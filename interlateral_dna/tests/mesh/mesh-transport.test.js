'use strict';
// mesh-transport.test.js — focused proof that M4-INC-03 is closed.
//
// The defect: `node codex.js send` exited 0 and wrote the ledger while tmux
// paste-buffer silently no-op'd into a `cat` inbox pane — silent transport
// success on an undelivered send. These tests prove the repaired helpers
// (1) actually render into a cat inbox via direct pane-TTY write,
// (2) fail LOUDLY (nonzero exit + honest ledger marker) when a render cannot
//     be confirmed, and (3) refuse idle shells and ambiguous recipients.
//
// Isolation: a scratch tmux server on a unique /private/tmp socket (never the
// shared /tmp/interlateral-agents-tmux.sock) and a scratch ledger via
// INTERLATERAL_COMMS_PATH. Teardown kills ONLY the scratch server this file
// created; scratch files are left in place (no destructive cleanup).

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const HELPERS_DIR = path.resolve(__dirname, '..', '..');
const SCRATCH = fs.mkdtempSync('/private/tmp/ia-mesh-transport-test-');
const SOCKET = path.join(SCRATCH, 'tmux.sock');
const LEDGER = path.join(SCRATCH, 'comms-scratch.md');
const INBOX_SESSION = 'mesh-test-inbox';
const TUI_SESSION = 'mesh-test-tui';

const transport = require(path.join(HELPERS_DIR, 'mesh-transport.js'));

function tmux(args, opts = {}) {
  return execFileSync('tmux', ['-S', SOCKET, ...args], { encoding: 'utf8', timeout: 5000, ...opts });
}

function runHelper(helper, sessionEnvKey, session, message) {
  return spawnSync('node', [path.join(HELPERS_DIR, helper), 'send', message], {
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      TMUX_SOCKET: SOCKET,
      [sessionEnvKey]: session,
      INTERLATERAL_COMMS_PATH: LEDGER,
    },
  });
}

before(() => {
  fs.writeFileSync(LEDGER, '# scratch ledger for mesh-transport tests\n');
  // The inbox pane mirrors the desktop-peer pattern: a pane whose foreground
  // process is `cat`. Launch cat directly (no shell bootstrap) and wait until
  // tmux reports it as the pane command, so mode detection cannot race.
  tmux(['new-session', '-d', '-s', INBOX_SESSION, 'cat', '-v']);
  for (let i = 0; i < 25; i += 1) {
    const cmd = tmux(['display-message', '-p', '-F', '#{pane_current_command}', '-t', INBOX_SESSION]).trim();
    if (cmd === 'cat') break;
    execFileSync('sleep', ['0.2']);
  }
  // A real idle shell is a negative fixture, never a stand-in proving CLI delivery.
  tmux(['new-session', '-d', '-s', TUI_SESSION]);
});

after(() => {
  // Kill only the scratch server owned by this file (unique socket path).
  try { execFileSync('tmux', ['-S', SOCKET, 'kill-server'], { timeout: 5000 }); } catch {}
});

test('T1: send to a cat inbox pane renders via direct TTY write and exits 0', () => {
  const marker = `inbox-proof-${process.pid}-t1`;
  const res = runHelper('codex.js', 'CODEX_TMUX_SESSION', INBOX_SESSION, `hello inbox ${marker}`);
  assert.equal(res.status, 0, `expected exit 0, got ${res.status}; stderr: ${res.stderr}`);
  assert.match(res.stdout, /DELIVERED_RENDERED mode=inbox/, 'must report the inbox delivery mode');
  const pane = tmux(['capture-pane', '-t', INBOX_SESSION, '-p', '-J', '-S', '-200']);
  assert.ok(pane.includes(marker), 'the message must actually render in the inbox pane');
  assert.ok(fs.readFileSync(LEDGER, 'utf8').includes(marker), 'the ledger must record the send');
});

test('T2: send to a missing session fails with nonzero exit', () => {
  const res = runHelper('codex.js', 'CODEX_TMUX_SESSION', 'mesh-test-does-not-exist', 'never delivered');
  assert.notEqual(res.status, 0, 'a missing session must never look like a successful send');
});

test('T3: multi-line message renders every line in the inbox', () => {
  const marker = `inbox-proof-${process.pid}-t3`;
  const res = runHelper('codex.js', 'CODEX_TMUX_SESSION', INBOX_SESSION, `line-one ${marker}\nline-two ${marker}`);
  assert.equal(res.status, 0, `stderr: ${res.stderr}`);
  const pane = tmux(['capture-pane', '-t', INBOX_SESSION, '-p', '-J', '-S', '-200']);
  assert.ok(pane.includes(`line-one ${marker}`), 'first line must render');
  assert.ok(pane.includes(`line-two ${marker}`), 'second line must render');
});


test('T4: idle shell is refused without executing text', () => {
  const sentinel = path.join(SCRATCH, 'must-not-exist');
  const res = runHelper('cc.js', 'CC_TMUX_SESSION', TUI_SESSION, `touch ${sentinel}`);
  assert.notEqual(res.status, 0);
  assert.equal(fs.existsSync(sentinel), false);
  assert.match(fs.readFileSync(LEDGER, 'utf8'), /"state":"REFUSED"/);
});

test('T5: invalid TTY refused before write', () => {
  const calls = [];
  const fake = args => {
    calls.push(args[0]);
    if (args[0] === 'list-panes') return 'fake|0|0|%1';
    if (args[0] === 'display-message') {
      const f = args[args.indexOf('-F') + 1];
      return f === '#{pane_tty}' ? '/dev/null' : f === '#{pane_pid}' ? '1' : 'cat';
    }
    return '';
  };
  const result = transport.deliverVerified({ runTmux: fake, session: 'fake', text: 'hello' });
  assert.equal(result.ok, false);
  assert.equal(result.receipt.state, 'REFUSED');
  assert.ok(!calls.includes('paste-buffer'));
});

test('T6: unknown processes default deny', () => {
  assert.equal(transport.paneMode('cat'), 'inbox');
  assert.equal(transport.paneMode('bash'), 'shell');
  assert.equal(transport.paneMode('node'), 'unknown');
  assert.equal(transport.paneMode(''), 'unknown');
  assert.equal(transport.paneMode('codex'), 'tui');
});

test('T7: exact session name, no prefix fallback', () => {
  const res = runHelper('codex.js', 'CODEX_TMUX_SESSION', 'mesh-test-in', 'prefix collision');
  assert.notEqual(res.status, 0);
});

test('T8: ambiguous session needs exact pane', () => {
  tmux(['new-session', '-d', '-s', 'ambiguous', 'cat', '-v']);
  tmux(['split-window', '-d', '-t', transport.resolvePane(tmux, 'ambiguous').id, 'cat', '-v']);
  assert.notEqual(runHelper('codex.js', 'CODEX_TMUX_SESSION', 'ambiguous', 'no ambiguous recipient').status, 0);
  assert.equal(runHelper('codex.js', 'CODEX_TMUX_SESSION', 'ambiguous:0.0', 'exact recipient').status, 0);
});

test('T9: identical retries have different attempt IDs and preserve request nonce', () => {
  const a = transport.deliverVerified({ runTmux: tmux, session: INBOX_SESSION, text: 'identical', requestNonce: 'request-one' });
  const b = transport.deliverVerified({ runTmux: tmux, session: INBOX_SESSION, text: 'identical', requestNonce: 'request-one' });
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.notEqual(a.receipt.attempt_id, b.receipt.attempt_id);
  assert.equal(a.receipt.request_nonce, b.receipt.request_nonce);
  assert.equal(a.receipt.payload_sha256, b.receipt.payload_sha256);
  assert.match(a.receipt.resolved_target, /^mesh-test-inbox:0.0$/);
});

test('T10: stale capture cannot confirm an identical resend', () => {
  const oldCapture = tmux(['capture-pane', '-t', INBOX_SESSION, '-p', '-J', '-S', '-300']);
  const fake = (args, opts) => args[0] === 'capture-pane' ? oldCapture : tmux(args, opts);
  const result = transport.deliverVerified({ runTmux: fake, session: INBOX_SESSION, text: 'identical',
    verify: { attempts: 1 } });
  assert.equal(result.ok, false);
  assert.equal(result.receipt.state, 'DELIVERY_UNCERTAIN');
  assert.match(result.detail, /No automatic retry/);
});

test('T11: truncated payload and shared suffix cannot verify', () => {
  assert.equal(transport.verifyRendered(() => '[BEGIN new] other suffix [END new]',
    '%1', '[BEGIN new] original suffix [END new]', { attempts: 1 }), false);
  assert.equal(transport.verifyRendered(() => '[END new]', '%1',
    '[BEGIN new] original suffix [END new]', { attempts: 1 }), false);
});

test('T12: terminal control bytes refused', () => {
  const r = transport.deliverVerified({ runTmux: tmux, session: INBOX_SESSION, text: 'bad\u001b[2J' });
  assert.equal(r.receipt.state, 'REFUSED');
});

test('T13: all simple helpers produce structured receipts', () => {
  for (const [helper, key] of [['cc.js','CC_TMUX_SESSION'], ['gemini.js','GEMINI_TMUX_SESSION']]) {
    assert.equal(runHelper(helper, key, INBOX_SESSION, 'receipt verification').status, 0);
  }
  const rows = fs.readFileSync(LEDGER, 'utf8').split('\n').filter(l => l.startsWith('{')).map(JSON.parse);
  assert.ok(rows.some(r => r.sender && r.target === INBOX_SESSION && r.attempt_id &&
    r.payload_sha256 && r.request_nonce && r.state === 'DELIVERED_RENDERED'));
});

test('T14: native version titles can resolve through exact foreground executable', () => {
  assert.deepEqual(transport.parseForegroundCli('10 10 20 Ss -zsh\n20 20 20 S+ claude'),
    { pid: '20', command: 'claude' });
  assert.equal(transport.parseForegroundCli('20 20 30 S claude'), null);
  assert.equal(transport.parseForegroundCli('20 20 20 T+ claude'), null);
  assert.equal(transport.parseForegroundCli('20 20 20 S+ node'), null);
  assert.equal(transport.parseForegroundCli('20 20 20 S+ zsh'), null);
  assert.equal(transport.parseForegroundCli('20 20 20 S+ claude\n21 20 20 S+ codex'), null);
});
