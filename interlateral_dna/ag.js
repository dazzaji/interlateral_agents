#!/usr/bin/env node
// ag.js - opt-in Antigravity desktop control over a local CDP debug port.
// Prefer the agy CLI peer; this desktop path is a fallback.

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const tls = require('tls');
const WebSocket = require('ws');

const LOG_FILE = path.join(__dirname, 'ag_log.md');
const REPO_ROOT = path.resolve(__dirname, '..');
const AG_TELEMETRY_LOG = path.join(REPO_ROOT, '.antigravitycli', 'ag_telemetry.log');
const CDP_URL = process.env.AG_CDP_URL || 'http://127.0.0.1:9222';
const rawCdpTimeout = Number(process.env.AG_CDP_CONNECT_TIMEOUT_MS || 5000);
// One timeout budget covers CDP HTTP preflight, WebSocket open, and protocol calls.
const CDP_CONNECT_TIMEOUT_MS = Number.isFinite(rawCdpTimeout) && rawCdpTimeout > 0 ? rawCdpTimeout : 5000;
const SESSION_ID = process.env.OTEL_SESSION_ID || `session_${Date.now()}`;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseUrl(rawUrl, label) {
    try {
        return new URL(rawUrl);
    } catch (err) {
        throw new Error(`${label} is not a valid URL: ${err.message}`);
    }
}

function socketHostFromUrl(url) {
    return url.hostname.replace(/^\[|\]$/g, '');
}

function isLoopbackHostname(hostname) {
    const normalized = hostname.replace(/^\[|\]$/g, '');
    return ['127.0.0.1', 'localhost', '::1'].includes(normalized);
}

function assertLoopbackEndpoint(rawUrl, label, allowedProtocols) {
    const url = parseUrl(rawUrl, label);
    if (!allowedProtocols.includes(url.protocol)) {
        throw new Error(`${label} must use ${allowedProtocols.join(' or ')}, got ${url.protocol}`);
    }
    if (!isLoopbackHostname(url.hostname)) {
        throw new Error(`${label} must use a loopback host, got ${url.hostname}`);
    }
    return url;
}

function persistTelemetry(type, content) {
    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId: SESSION_ID,
        type: type,
        content: content
    }) + '\n';

    try {
        const dir = path.dirname(AG_TELEMETRY_LOG);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.appendFileSync(AG_TELEMETRY_LOG, entry);
    } catch (err) {
        console.error(`⚠️  TELEMETRY FAILED: ${err.message}`);
    }
}

function log(direction, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entry = `\n[${timestamp}] **${direction}:** ${message}\n`;
    fs.appendFileSync(LOG_FILE, entry);
}

async function getCdpWebSocketUrl() {
    const cdpUrl = assertLoopbackEndpoint(CDP_URL, 'AG_CDP_URL', ['http:', 'https:']);
    const versionUrl = new URL('/json/version', cdpUrl);
    try {
        const response = await fetch(versionUrl, { signal: AbortSignal.timeout(CDP_CONNECT_TIMEOUT_MS) });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const version = await response.json();
        if (!version.webSocketDebuggerUrl) {
            throw new Error('missing webSocketDebuggerUrl');
        }
        return assertLoopbackEndpoint(version.webSocketDebuggerUrl, 'CDP webSocketDebuggerUrl', ['ws:', 'wss:']).href;
    } catch (err) {
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            throw new Error(`Timed out after ${CDP_CONNECT_TIMEOUT_MS}ms waiting for ${versionUrl}`);
        }
        throw new Error(`Failed to fetch browser webSocket URL from ${versionUrl}: ${err.message}`);
    }
}

async function verifyWebSocketHandshake(webSocketUrl) {
    const url = assertLoopbackEndpoint(webSocketUrl, 'CDP webSocketDebuggerUrl', ['ws:', 'wss:']);
    if (!['ws:', 'wss:'].includes(url.protocol)) {
        throw new Error(`CDP endpoint returned unsupported WebSocket URL protocol: ${url.protocol}`);
    }

    await new Promise((resolve, reject) => {
        const secure = url.protocol === 'wss:';
        const port = Number(url.port || (secure ? 443 : 80));
        const pathWithQuery = `${url.pathname || '/'}${url.search || ''}`;
        const socketHost = socketHostFromUrl(url);
        const socket = secure
            ? tls.connect({ host: socketHost, port, servername: socketHost })
            : net.connect({ host: socketHost, port });
        let settled = false;
        let response = '';
        let timer;

        const finish = (err) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            socket.destroy();
            if (err) reject(err);
            else resolve();
        };

        timer = setTimeout(() => {
            finish(new Error(`Timed out after ${CDP_CONNECT_TIMEOUT_MS}ms waiting for WebSocket handshake at ${webSocketUrl}`));
        }, CDP_CONNECT_TIMEOUT_MS);
        timer.unref?.();

        const sendUpgradeRequest = () => {
            const key = crypto.randomBytes(16).toString('base64');
            socket.write([
                `GET ${pathWithQuery} HTTP/1.1`,
                `Host: ${url.host}`,
                'Upgrade: websocket',
                'Connection: Upgrade',
                `Sec-WebSocket-Key: ${key}`,
                'Sec-WebSocket-Version: 13',
                '',
                '',
            ].join('\r\n'));
        };

        socket.once(secure ? 'secureConnect' : 'connect', sendUpgradeRequest);
        socket.once('error', (err) => {
            finish(new Error(`Failed WebSocket handshake at ${webSocketUrl}: ${err.message}`));
        });
        socket.on('data', (chunk) => {
            response += chunk.toString('latin1');
            if (!response.includes('\r\n\r\n')) return;

            const statusLine = response.split('\r\n', 1)[0] || '';
            if (/^HTTP\/1\.[01] 101\b/.test(statusLine)) {
                finish();
            } else {
                finish(new Error(`Failed WebSocket handshake at ${webSocketUrl}: ${statusLine || 'no HTTP status'}`));
            }
        });
    });
}

class OwnedWebSocketTransport {
    onmessage;
    onclose;

    constructor(ws) {
        this.ws = ws;
        this.ws.on('message', (message) => {
            if (this.onmessage) this.onmessage(message.toString());
        });
        this.ws.on('close', () => {
            if (this.onclose) this.onclose();
        });
        this.ws.on('error', () => {});
    }

    send(message) {
        this.ws.send(message);
    }

    close() {
        this.ws.close();
        this.ws.terminate?.();
    }
}

async function createWebSocketTransport(webSocketUrl) {
    return await new Promise((resolve, reject) => {
        const ws = new WebSocket(webSocketUrl, [], {
            followRedirects: true,
            perMessageDeflate: false,
            allowSynchronousEvents: false,
            handshakeTimeout: CDP_CONNECT_TIMEOUT_MS,
            maxPayload: 256 * 1024 * 1024,
        });
        let settled = false;
        let timer;

        const finish = (err, transport) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            ws.off('open', onOpen);
            ws.off('error', onError);
            if (err) {
                ws.terminate();
                reject(err);
            } else {
                resolve(transport);
            }
        };
        const onOpen = () => finish(null, new OwnedWebSocketTransport(ws));
        const onError = (err) => finish(new Error(`Failed WebSocket connection at ${webSocketUrl}: ${err.message}`));

        timer = setTimeout(() => {
            finish(new Error(`Timed out after ${CDP_CONNECT_TIMEOUT_MS}ms connecting to ${webSocketUrl}`));
        }, CDP_CONNECT_TIMEOUT_MS);
        timer.unref?.();

        ws.once('open', onOpen);
        ws.once('error', onError);
    });
}

async function connectPuppeteer(browserWSEndpoint) {
    await verifyWebSocketHandshake(browserWSEndpoint);
    const transport = await createWebSocketTransport(browserWSEndpoint);

    let browser;
    const connectPromise = puppeteer.connect({
        transport,
        protocolTimeout: CDP_CONNECT_TIMEOUT_MS,
    }).then((connectedBrowser) => {
        browser = connectedBrowser;
        return connectedBrowser;
    });

    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Timed out after ${CDP_CONNECT_TIMEOUT_MS}ms connecting to ${browserWSEndpoint}`));
        }, CDP_CONNECT_TIMEOUT_MS);
        timer.unref?.();
    });

    try {
        return await Promise.race([connectPromise, timeoutPromise]);
    } catch (err) {
        if (browser) await browser.disconnect().catch(() => {});
        transport.close();
        connectPromise.then((lateBrowser) => lateBrowser.disconnect()).catch(() => {});
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

async function getManagerPage(options = {}) {
    const { allowLaunchpad = false } = options;
    const browserWSEndpoint = await getCdpWebSocketUrl();
    const browser = await connectPuppeteer(browserWSEndpoint);
    try {
        const pages = await browser.pages();

        // Only connect to a loopback CDP endpoint and only drive pages served
        // from loopback hosts. Page text validation is defense-in-depth for
        // avoiding accidental automation of unrelated local pages.
        const parsePageUrl = (url) => {
            try {
                return new URL(url);
            } catch {
                return null;
            }
        };
        const isLoopbackPageUrl = (url) => {
            const parsed = parsePageUrl(url);
            if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) return false;
            return isLoopbackHostname(parsed.hostname);
        };
        // Antigravity 2.0 standalone Agent Manager conversation page: /c/<uuid>.
        const isAntigravityConversationUrl = (url) => {
            const parsed = parsePageUrl(url);
            return Boolean(
                parsed &&
                isLoopbackPageUrl(url) &&
                /^\/c\/[0-9a-fA-F-]{36}(?:\/|$)/.test(parsed.pathname)
            );
        };

        const pageInfo = async (page) => {
            const title = await page.title().catch(() => '');
            const info = await page.evaluate(() => ({
                body: document.body.innerText,
                productName: window.__APP_CONFIG__?.productName || ''
            })).catch(() => ({ body: '', productName: '' }));
            return { url: page.url(), title, ...info };
        };

        const isAntigravityManager = (info) => {
            const text = `${info.title}\n${info.body}`;
            if (info.productName === 'antigravity') return true;
            const hasAppShell =
                /Conversation History[\s\S]*Scheduled Tasks[\s\S]*Projects/i.test(text) ||
                /Ask anything,\s*@ to mention,\s*\/ for actions/i.test(text);
            const hasAgentUi = /Gemini 3\.5 Flash|Agent Manager|Antigravity/i.test(text);
            return hasAppShell && hasAgentUi;
        };

        const returnIfValidated = async (page, kind) => {
            const info = await pageInfo(page);
            if (isAntigravityManager(info)) {
                return { browser, page, kind, info };
            }
            return null;
        };

        const fail = (message) => {
            throw new Error(message);
        };

        // Preferred: Antigravity 2.0 conversation page.
        for (const page of pages) {
            if (isAntigravityConversationUrl(page.url())) {
                const validated = await returnIfValidated(page, 'conversation');
                if (validated) return validated;
            }
        }

        // Legacy Antigravity IDE: a workbench page (not the jetski Launchpad).
        // Loopback-gated so a foreign debug target cannot match.
        for (const page of pages) {
            const url = page.url();
            if (isLoopbackPageUrl(url) && url.includes('workbench.html') && !url.includes('jetski')) {
                const validated = await returnIfValidated(page, 'workbench');
                if (validated) return validated;
            }
        }

        // Legacy Antigravity IDE: a window titled "Manager", loopback-gated.
        for (const page of pages) {
            if (!isLoopbackPageUrl(page.url())) continue;
            if ((await page.title().catch(() => '')) === 'Manager') {
                const validated = await returnIfValidated(page, 'manager');
                if (validated) return validated;
            }
        }

        // Launchpad (jetski page), loopback-gated.
        const jetski = pages.find((p) => isLoopbackPageUrl(p.url()) && p.url().includes('jetski'));
        if (jetski) {
            if (!allowLaunchpad) {
                fail('Antigravity is on Launchpad, not a conversation/workspace page. Open a conversation before using this command.');
            }
            return { browser, page: jetski, kind: 'launchpad', info: await pageInfo(jetski) };
        }

        fail('Antigravity conversation page not found or failed Antigravity page validation. Open a conversation in the app, and confirm it is running with --remote-debugging-port=9222.');
    } catch (err) {
        await browser.disconnect().catch(() => {});
        throw err;
    }
}

async function runJsonCommand(fn) {
    try {
        await fn();
    } catch (err) {
        console.log(JSON.stringify({ status: 'error', error: err.message }));
        process.exitCode = 1;
    }
}

async function withManagerPage(options, fn) {
    const { browser, page, kind, info } = await getManagerPage(options);
    try {
        return await fn({ page, kind, info });
    } finally {
        await browser.disconnect().catch(() => {});
    }
}

async function getAgentFrame(page) {
    const frames = page.frames();
    for (const frame of frames) {
        if (frame.url().includes('cascade-panel')) {
            return frame;
        }
    }
    return null;
}

async function focusChatInput(targetFrame) {
    return targetFrame.evaluate(() => {
        const selectors = [
            '[contenteditable="true"].max-h-\\[300px\\]',
            '[contenteditable="true"][role="textbox"]',
            '[contenteditable="true"][aria-label*="message" i]',
            '[contenteditable="true"][aria-label*="prompt" i]',
            '[contenteditable="true"][placeholder*="Ask" i]',
            'textarea[aria-label*="message" i]',
            'textarea[aria-label*="prompt" i]',
            'textarea[placeholder*="Ask" i]',
            '[role="textbox"][aria-label*="message" i]',
            '[role="textbox"][aria-label*="prompt" i]',
            '[contenteditable="true"]'
        ];
        const isVisible = (el) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const isEditable = (el) => el.isContentEditable || 'value' in el;
        for (const selector of selectors) {
            for (const input of document.querySelectorAll(selector)) {
                if (!isVisible(input) || !isEditable(input)) continue;
                input.focus();
                return true;
            }
        }
        return false;
    });
}

async function insertIntoActiveInput(targetFrame, message) {
    await targetFrame.evaluate((msg) => {
        const input = document.activeElement;
        if (!input) throw new Error('Could not focus chat input');

        if (input.isContentEditable) {
            document.execCommand('insertText', false, msg);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        if ('value' in input) {
            input.value = msg;
            input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: msg }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        throw new Error('Focused chat input is not editable');
    }, message);
}

async function activeInputHasText(targetFrame) {
    return targetFrame.evaluate(() => {
        const input = document.activeElement || document.querySelector('[contenteditable="true"], textarea, [role="textbox"]');
        if (!input) return false;
        if (input.isContentEditable) return input.innerText.trim().length > 0;
        if ('value' in input) return input.value.trim().length > 0;
        return false;
    });
}

async function send(message) {
    await withManagerPage({}, async ({ page }) => {
        const agentFrame = await getAgentFrame(page);
        const targetFrame = agentFrame || page;

        // 1. Find and Focus Input
        const inputFound = await focusChatInput(targetFrame);
        if (!inputFound) {
            throw new Error('Could not find chat input');
        }

        await sleep(200);

        // 2. Insert Text using editor-native events where possible.
        await insertIntoActiveInput(targetFrame, message);

        await sleep(500);

        // 3. Submit using Enter key (Primary Method)
        console.log('Dispatching Enter key...');
        await page.keyboard.press('Enter');
        await sleep(300);

        // 4. Verify Clearance
        let isStillFull = await activeInputHasText(targetFrame);

        // 5. Fallback: Aggressive DOM Events if still full
        if (isStillFull) {
            console.log('⚠️ Standard Enter failed. Trying aggressive DOM events...');
            await targetFrame.evaluate(() => {
                const input = document.activeElement || document.querySelector('[contenteditable="true"], textarea, [role="textbox"]');
                if (!input) return;

                const events = [
                    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' }),
                    new KeyboardEvent('keypress', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' }),
                    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' })
                ];

                events.forEach(e => input.dispatchEvent(e));
            });
            await sleep(500);
        }

        // 6. Final Check
        isStillFull = await activeInputHasText(targetFrame);

        if (isStillFull) {
            console.error('❌ FAILED TO SUBMIT. Message remains in input box.');
            log('CC → AG', `FAILED DELIVERY: ${message}`);
        } else {
            console.log('✅ Submitted successfully.');
            log('CC → AG', message);
        }

        console.log(JSON.stringify({ status: isStillFull ? 'failed_stuck' : 'sent', message: message }));
        persistTelemetry('send', { message, status: isStillFull ? 'failed' : 'sent' });
        if (isStillFull) process.exitCode = 1;
    });
}

async function read() {
    await withManagerPage({}, async ({ page }) => {
        const agentFrame = await getAgentFrame(page);
        const targetFrame = agentFrame || page;

        const content = await targetFrame.evaluate(() => document.body.innerText);
        persistTelemetry('read', content);
        console.log(content);
    });
}

async function screenshot(filename = '/tmp/ag_screenshot.png') {
    await withManagerPage({}, async ({ page }) => {
        await page.screenshot({ path: filename });
        console.log(JSON.stringify({ status: 'screenshot saved', path: filename }));
    });
}

async function watch(intervalMs = 5000) {
    let lastContent = '';
    const poll = async (emitMarker = true) => {
        await withManagerPage({}, async ({ page }) => {
            const agentFrame = await getAgentFrame(page);
            const targetFrame = agentFrame || page;

            const content = await targetFrame.evaluate(() => document.body.innerText);

            if (content !== lastContent) {
                persistTelemetry('watch_change', content);
                lastContent = content;
                if (emitMarker) process.stdout.write('📝');
            } else {
                if (emitMarker) process.stdout.write('.');
            }
        });
    };

    try {
        await poll(false);
    } catch (err) {
        console.log(JSON.stringify({ status: 'error', error: err.message }));
        process.exitCode = 1;
        return;
    }

    console.log(`👁️  AG WATCHER STARTED (polling every ${intervalMs}ms)`);
    console.log(`📂 Logging to: ${AG_TELEMETRY_LOG}`);

    while (true) {
        try {
            await poll();
        } catch (err) {
            process.stdout.write('❌');
        }
        await sleep(intervalMs);
    }
}

async function status() {
    try {
        await withManagerPage({ allowLaunchpad: true }, async ({ page, kind }) => {
            const title = await page.title().catch(() => '');
            const bodyInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const lines = text.split('\n').filter(l => l.trim());
                return {
                    tasks: lines.filter(l => l.includes('ago')).slice(0, 5),
                    preview: text.substring(0, 500)
                };
            });
            if (kind === 'launchpad') {
                console.log(JSON.stringify({ status: 'not_sendable_launchpad', sendable: false, kind, title, ...bodyInfo }, null, 2));
            } else {
                console.log(JSON.stringify({ status: 'connected', sendable: true, kind, title, ...bodyInfo }, null, 2));
            }
        });
    } catch (err) {
        console.log(JSON.stringify({ status: 'error', error: err.message }));
        process.exitCode = 1;
    }
}

async function logResponse(response) {
    log('AG → CC', response);
    console.log(JSON.stringify({ status: 'logged', response }));
}

async function debugUI() {
    await withManagerPage({}, async ({ page }) => {
        const agentFrame = await getAgentFrame(page);
        const targetFrame = agentFrame || page;

        const html = await targetFrame.evaluate(() => document.documentElement.outerHTML);
        fs.writeFileSync('/tmp/ag_ui.html', html);
        console.log('UI HTML saved to /tmp/ag_ui.html');
    });
}

// Main Command Router
const command = process.argv[2];
const arg = process.argv.slice(3).join(' ');

switch (command) {
    case 'send':
        if (!arg) {
            console.error('Usage: node ag.js send "your message"');
            process.exitCode = 1;
        }
        else runJsonCommand(() => send(arg));
        break;
    case 'read':
        runJsonCommand(read);
        break;
    case 'screenshot':
        runJsonCommand(() => screenshot(arg || '/tmp/ag_screenshot.png'));
        break;
    case 'status':
        status();
        break;
    case 'log-response':
        if (!arg) {
            console.error('Usage: node ag.js log-response "AG response text"');
            process.exitCode = 1;
        }
        else logResponse(arg);
        break;
    case 'debug':
        runJsonCommand(debugUI);
        break;
    case 'watch':
        watch(parseInt(arg) || 5000);
        break;
    default:
        console.log(`
Antigravity Control (ag.js)
===========================
Commands:
  node ag.js send "message"      - Send message to AG
  node ag.js read                - Read current AG panel text
  node ag.js watch [ms]          - Continuous watch (default 5000ms)
  node ag.js screenshot [path]   - Take screenshot
  node ag.js status              - Check connection status
  node ag.js debug               - Dump UI HTML for debugging
        `);
        if (command) process.exitCode = 1;
}
