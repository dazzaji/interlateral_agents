#!/usr/bin/env node
// agy.js - mesh send/status/read helper for the Antigravity CLI peer (ia-agy).
// Mirrors codex.js. The Antigravity CLI TUI submits on a plain Enter
// (no Escape-then-Enter, unlike the Codex TUI).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getIdentity, stampMessage } = require('./identity');
const { deliverVerified, paneInfo, paneMode } = require('./mesh-transport');

const TMUX_SOCKET = process.env.TMUX_SOCKET || process.env.INTERLATERAL_TMUX_SOCKET || '/tmp/interlateral-agents-tmux.sock';
const SESSION = process.env.AGY_TMUX_SESSION || 'ia-agy';
const COMMS_PATH = process.env.INTERLATERAL_COMMS_PATH || path.join(__dirname, 'comms.md');

function runTmux(args, options = {}) {
  return execFileSync('tmux', ['-S', TMUX_SOCKET, ...args], {
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
}

function sessionExists() {
  return Boolean(paneInfo(runTmux, SESSION).id);
}

function paneCommand() {
  return paneInfo(runTmux, SESSION).command;
}

function panePid() {
  try {
    const pid = Number(runTmux(['display-message', '-p', '-F', '#{pane_pid}', '-t', paneInfo(runTmux, SESSION).id]).trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function paneTty() {
  try {
    return runTmux(['display-message', '-p', '-F', '#{pane_tty}', '-t', paneInfo(runTmux, SESSION).id]).trim();
  } catch {
    return '';
  }
}

function normalizeTty(tty) {
  return tty.replace(/^\/dev\//, '');
}

function processRows() {
  const output = execFileSync('ps', ['-axo', 'pid=,ppid=,pgid=,tpgid=,stat=,tty=,command='], {
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return output.split('\n').flatMap((line) => {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(-?\d+)\s+(-?\d+)\s+(\S+)\s+(\S+)\s+(.*)$/);
    if (!match) return [];
    return [{
      pid: Number(match[1]),
      ppid: Number(match[2]),
      pgid: Number(match[3]),
      tpgid: Number(match[4]),
      stat: match[5],
      tty: match[6],
      command: match[7],
    }];
  });
}

function isAgyCommand(command) {
  const executable = command.trim().split(/\s+/, 1)[0] || '';
  return path.basename(executable) === 'agy';
}

function canReceiveTerminalInput(row) {
  return !/[TZX]/.test(row.stat);
}

function agyAuthState() {
  const root = panePid();
  const tty = paneTty();
  const paneTtyName = normalizeTty(tty);
  const state = {
    pane_pid: root,
    pane_tty: tty || null,
    foreground_pgid: null,
    agy_process: false,
    agy_foreground: false,
    agy_pid: null,
  };
  if (!root || !paneTtyName) return state;

  try {
    const rows = processRows();
    const byPid = new Map(rows.map((row) => [row.pid, row]));
    const byParent = new Map();
    for (const row of rows) {
      if (!byParent.has(row.ppid)) byParent.set(row.ppid, []);
      byParent.get(row.ppid).push(row);
    }

    const queue = [root];
    const seen = new Set();
    while (queue.length > 0) {
      const pid = queue.shift();
      if (seen.has(pid)) continue;
      seen.add(pid);
      for (const child of byParent.get(pid) || []) {
        queue.push(child.pid);
      }
    }

    const rootRow = byPid.get(root);
    const ttyRows = rows.filter((row) => row.tty === paneTtyName);
    if (rootRow && rootRow.tpgid > 0) {
      state.foreground_pgid = rootRow.tpgid;
    } else {
      const withForeground = ttyRows.find((row) => row.tpgid > 0);
      state.foreground_pgid = withForeground ? withForeground.tpgid : null;
    }

    for (const pid of seen) {
      const row = byPid.get(pid);
      if (!row || row.tty !== paneTtyName || !isAgyCommand(row.command)) continue;
      state.agy_process = true;
      if (
        canReceiveTerminalInput(row) &&
        ((state.foreground_pgid && row.pgid === state.foreground_pgid) || row.stat.includes('+'))
      ) {
        state.agy_foreground = true;
        state.agy_pid = row.pid;
        return state;
      }
      if (!state.agy_pid) state.agy_pid = row.pid;
    }
    return state;
  } catch {
    return state;
  }
}

// Screen markers are only a readiness hint. Authentication comes from the
// pane TTY foreground process group above: default sends require the foreground
// process group to contain agy. Text in the pane can be spoofed by a shell and
// must never authenticate the recipient.
const AGY_MARKERS = /Gemini 3\.5 Flash|\? for shortcuts/;
// Common bare shell prompts as the final visible line: zsh `%`, bash `$`, root
// `#`, and prompt-theme glyphs such as Starship/Powerlevel arrows. Do not match
// a plain `>` because that is also agy's own input prompt.
const SHELL_PROMPT = /(?:[%$#]|❯|›|➜)\s*$/u;
const TAIL_LINES = 10;

function agyScreenReady() {
  try {
    // Inspect only the tail of the visible pane. A crashed agy that dropped to
    // a shell can leave markers up in scrollback; trusting the whole buffer
    // would let stale or attacker-printed markers pass.
    const tail = runTmux(['capture-pane', '-t', paneInfo(runTmux, SESSION).id, '-p'])
      .split('\n')
      .slice(-TAIL_LINES);
    const lastLine = [...tail].reverse().find((l) => l.trim().length > 0) || '';
    if (SHELL_PROMPT.test(lastLine)) return false;
    return AGY_MARKERS.test(tail.join('\n'));
  } catch {
    return false;
  }
}

function appendLedger(target, message, receipt) {
  const sender = getIdentity().sender || 'relay';
  const timestamp = new Date().toISOString();
  if (receipt) fs.appendFileSync(COMMS_PATH, JSON.stringify({ timestamp, sender, ...receipt }) + '\n');
  fs.appendFileSync(COMMS_PATH, `\n[${sender}] ${target} [${timestamp}]\n${message}\n\n---\n`);
}

function getStatus() {
  const exists = sessionExists();
  const auth = exists ? agyAuthState() : {};
  const screenReady = exists && agyScreenReady();
  const payload = {
    session: SESSION,
    exists,
    pane_command: paneCommand() || null,
    pane_pid: auth.pane_pid || null,
    pane_tty: auth.pane_tty || null,
    foreground_pgid: auth.foreground_pgid || null,
    agy_pid: auth.agy_pid || null,
    agy_process: Boolean(auth.agy_process),
    agy_foreground: Boolean(auth.agy_foreground),
    screen_ready: screenReady,
    agy_running: Boolean(auth.agy_foreground && screenReady),
    ready: Boolean(auth.agy_foreground && screenReady),
    tmux_socket: TMUX_SOCKET,
  };
  console.log(JSON.stringify(payload, null, 2));
}

function read() {
  if (!sessionExists()) {
    console.error(`tmux session '${SESSION}' not found on ${TMUX_SOCKET}`);
    process.exit(1);
  }
  process.stdout.write(runTmux(['capture-pane', '-t', paneInfo(runTmux, SESSION).id, '-p', '-S', '-']));
}

// Delivery is mode-aware and VERIFIED (M4-INC-03): a cat-style inbox pane gets
// a direct pane-TTY write (paste-buffer silently no-ops there); the agy TUI
// gets the buffer paste + plain Enter submit. Either way the pane is
// re-captured and a send that never rendered exits nonzero, never a success.
function deliver(text) {
  return deliverVerified({
    runTmux,
    session: SESSION,
    text,
    submitKeys: ['Enter'],
  });
}

function send(message, force) {
  if (!message) {
    console.error('Usage: node interlateral_dna/agy.js send [--force] "message"');
    process.exit(1);
  }
  if (!sessionExists()) {
    console.error(`tmux session '${SESSION}' not found on ${TMUX_SOCKET}`);
    process.exit(1);
  }

  const auth = agyAuthState();
  const screenReady = agyScreenReady();
  if (!auth.agy_foreground && !force) {
    console.error(`Refusing to send: session '${SESSION}' does not have agy in the pane foreground process group.`);
    console.error('It may be stopped, backgrounded, or the pane may have dropped to a shell. Investigate the peer. --force never bypasses the transport shell/unknown-process guard.');
    process.exit(1);
  }
  if (!screenReady && !force) {
    console.error(`Refusing to send: session '${SESSION}' has foreground agy, but TUI readiness markers were not visible.`);
    console.error('Wait for the agy prompt/status line; --force bypasses only this readiness check.');
    process.exit(1);
  }
  if (!screenReady) {
    console.error(`Warning: session '${SESSION}' readiness markers were not visible; --force is overriding the guard.`);
  }

  const stamped = stampMessage(message);
  const result = deliver(stamped);
  if (!result.ok) {
    appendLedger(force ? '@AGY --force' : '@AGY', `${stamped}\n[${result.receipt.state}: ${result.detail}]`, result.receipt);
    console.error(`ERROR: send to '${SESSION}' NOT confirmed rendered (mode=${result.mode}): ${result.detail}`);
    process.exit(2);
  }
  appendLedger(force ? '@AGY --force' : '@AGY', stamped, result.receipt);
  console.log(`DELIVERED_RENDERED mode=${result.mode} session=${SESSION}`);
}

function showUsage() {
  console.log('Usage: node interlateral_dna/agy.js send [--force] "message" | status | read');
}

const [, , command, ...args] = process.argv;

switch (command) {
  case 'send': {
    const force = args[0] === '--force';
    send((force ? args.slice(1) : args).join(' '), force);
    break;
  }
  case 'status':
    getStatus();
    break;
  case 'read':
    read();
    break;
  case 'help':
  case '--help':
  case '-h':
    showUsage();
    break;
  default:
    showUsage();
    process.exit(command ? 1 : 0);
}
