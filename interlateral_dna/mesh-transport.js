'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { randomUUID, createHash } = require('crypto');
const INBOX_COMMANDS = new Set(['cat']);
const IDLE_SHELLS = new Set(['bash', 'zsh', 'sh', 'fish']);
const TUI_COMMANDS = new Set(['codex', 'claude', 'gemini', 'agy']);
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Resolve exact names ourselves rather than allowing tmux prefix matching.
// A multi-pane session requires an exact session:window.pane target.
function resolvePane(runTmux, target) {
  const rows = runTmux(['list-panes', '-a', '-F',
    '#{session_name}|#{window_index}|#{pane_index}|#{pane_id}']).trim().split('\n');
  const matches = rows.map(row => row.split('|')).filter(parts =>
    parts.length === 4 && (parts[0] === target ||
      `${parts[0]}:${parts[1]}.${parts[2]}` === target));
  if (matches.length !== 1) throw new Error('Exact target missing or ambiguous');
  const [session, window, pane, id] = matches[0];
  if (!/^%\d+$/.test(id)) throw new Error('Invalid pane id');
  return { id, target: `${session}:${window}.${pane}` };
}
function paneInfo(runTmux, session) {
  try {
    const resolved = resolvePane(runTmux, session);
    const query = format => runTmux(['display-message', '-p', '-F', format, '-t', resolved.id]).trim();
    const rawCommand = query('#{pane_current_command}');
    const tty = query('#{pane_tty}');
    // Native CLIs can set their process title to a version. Inspect only this
    // PTY's foreground executable; never infer a CLI from prompt text or "node".
    const foreground = ['unknown', 'tui'].includes(paneMode(rawCommand))
      ? foregroundCli(tty) : null;
    return { ...resolved, rawCommand,
      command: foreground?.command || (TUI_COMMANDS.has(rawCommand) ? '' : rawCommand),
      foregroundPid: foreground?.pid || null, tty, pid: query('#{pane_pid}') };
  } catch {
    return { command: '', tty: '', id: null, target: null };
  }
}
function parseForegroundCli(output) {
  const matches = output.split('\n').flatMap(line => {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(-?\d+)\s+(\S+)\s+(.+)$/);
    if (!m || Number(m[2]) !== Number(m[3]) || /[TZX]/.test(m[4])) return [];
    const command = path.basename(m[5].trim());
    return TUI_COMMANDS.has(command) ? [{ pid: m[1], command }] : [];
  });
  return matches.length === 1 ? matches[0] : null;
}
function foregroundCli(tty) {
  if (!/^\/dev\/(?:ttys\d+|pts\/\d+)$/.test(tty)) return null;
  try {
    return parseForegroundCli(execFileSync('ps',
      ['-t', tty.replace('/dev/', ''), '-o', 'pid=,pgid=,tpgid=,stat=,comm='],
      { encoding: 'utf8', timeout: 2000 }));
  } catch { return null; }
}
function paneMode(command) {
  if (INBOX_COMMANDS.has(command)) return 'inbox';
  if (IDLE_SHELLS.has(command)) return 'shell';
  return TUI_COMMANDS.has(command) ? 'tui' : 'unknown';
}
function verifyRendered(runTmux, pane, frame, { attempts = 5, delayMs = 100 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const capture = runTmux(['capture-pane', '-t', pane, '-p', '-J', '-S', '-300']);
      if (normalize(capture).includes(normalize(frame))) return true;
    } catch {}
    if (i + 1 < attempts) sleep(delayMs);
  }
  return false;
}
function deliverVerified({ runTmux, session, text, submitKeys = ['Enter'], verify,
  requestNonce = process.env.INTERLATERAL_REQUEST_NONCE || randomUUID() }) {
  const attempt = randomUUID();
  const digest = createHash('sha256').update(String(text)).digest('hex');
  const info = paneInfo(runTmux, session);
  const mode = paneMode(info.command);
  const receipt = { target: session, resolved_target: info.target, pane_id: info.id,
    request_nonce: requestNonce, attempt_id: attempt, payload_sha256: digest, state: 'REFUSED' };
  const result = (ok, detail) => ({ ok, mode, detail, receipt });
  if (typeof text !== 'string' || !text.trim() || Buffer.byteLength(text) > 16384 ||
      /[\x00-\x08\x0b-\x1f\x7f]/.test(text)) {
    return result(false, 'Message must be nonempty, at most 16384 bytes, and contain no terminal controls');
  }
  if (!info.id || !['inbox', 'tui'].includes(mode)) {
    return result(false, 'Exact target is missing, ambiguous, an idle shell, or an unrecognized process');
  }
  const marker = `MESH attempt=${attempt} pane=${info.id} sha256=${digest}`;
  const frame = `[BEGIN ${marker}]\n${text}\n[END ${marker}]`;
  const unchanged = () => {
    const now = paneInfo(runTmux, session);
    if (now.id !== info.id || now.command !== info.command ||
        now.tty !== info.tty || now.pid !== info.pid ||
        now.foregroundPid !== info.foregroundPid) throw new Error('Recipient changed during send');
  };
  try {
    unchanged();
    if (mode === 'inbox') {
      if (!/^\/dev\/(?:ttys\d+|pts\/\d+)$/.test(info.tty) ||
          !fs.statSync(info.tty).isCharacterDevice()) {
        return result(false, 'Inbox does not have a supported real PTY');
      }
      receipt.state = 'DELIVERY_UNCERTAIN';
      fs.writeFileSync(info.tty, '\r\n' + frame.replace(/\n/g, '\r\n') + '\r\n');
    } else {
      const buffer = `mesh_${attempt}`;
      try {
        runTmux(['load-buffer', '-b', buffer, '-'], { input: frame });
        unchanged();
        receipt.state = 'DELIVERY_UNCERTAIN';
        runTmux(['paste-buffer', '-p', '-r', '-t', info.id, '-b', buffer]);
        sleep(1000);
        for (const key of submitKeys) {
          unchanged();
          runTmux(['send-keys', '-t', info.id, key]);
          sleep(100);
        }
      } finally {
        try { runTmux(['delete-buffer', '-b', buffer]); } catch {}
      }
    }
    unchanged();
    if (!verifyRendered(runTmux, info.id, frame, verify)) {
      return result(false, 'Delivery uncertain; inspect receiver before retrying. No automatic retry.');
    }
    receipt.state = 'DELIVERED_RENDERED';
    return result(true, 'Fresh complete frame rendered; native wake and recipient ACK are separate');
  } catch (error) {
    return result(false, `${receipt.state}: ${error.message}; inspect before retrying`);
  }
}
module.exports = { deliverVerified, resolvePane, paneInfo, paneMode, verifyRendered, parseForegroundCli,
  normalize, INBOX_COMMANDS, IDLE_SHELLS };
