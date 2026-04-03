#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getIdentity, stampMessage } = require('./identity');

const TMUX_SOCKET = process.env.TMUX_SOCKET || process.env.INTERLATERAL_TMUX_SOCKET || '/tmp/interlateral-agents-tmux.sock';
const SESSION = process.env.CODEX_TMUX_SESSION || 'ia-codex';
const COMMS_PATH = path.join(__dirname, 'comms.md');
const IDLE_SHELLS = new Set(['bash', 'zsh', 'sh', 'fish']);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runTmux(args, options = {}) {
  return execFileSync('tmux', ['-S', TMUX_SOCKET, ...args], {
    encoding: 'utf8',
    timeout: 5000,
    ...options,
  });
}

function sessionExists() {
  try {
    runTmux(['has-session', '-t', SESSION], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function paneCommand() {
  try {
    return runTmux(['display-message', '-p', '-F', '#{pane_current_command}', '-t', SESSION]).trim();
  } catch {
    return '';
  }
}

function ready() {
  const cmd = paneCommand();
  return Boolean(cmd) && !IDLE_SHELLS.has(cmd);
}

function appendLedger(target, message) {
  const sender = getIdentity().sender || 'relay';
  const timestamp = new Date().toISOString();
  fs.appendFileSync(COMMS_PATH, `\n[${sender}] ${target} [${timestamp}]\n${message}\n\n---\n`);
}

function getStatus() {
  const exists = sessionExists();
  const payload = {
    session: SESSION,
    exists,
    pane_command: paneCommand() || null,
    ready: exists && ready(),
    tmux_socket: TMUX_SOCKET,
  };
  console.log(JSON.stringify(payload, null, 2));
}

function send(message) {
  if (!message) {
    console.error('Usage: node interlateral_dna/codex.js send "message"');
    process.exit(1);
  }
  if (!sessionExists()) {
    console.error(`tmux session '${SESSION}' not found on ${TMUX_SOCKET}`);
    process.exit(1);
  }

  const stamped = stampMessage(message);
  if (!ready()) {
    console.error(`Warning: session '${SESSION}' is not running Codex. Sending anyway.`);
  }

  runTmux(['send-keys', '-t', SESSION, '-l', stamped]);
  sleep(1000);
  runTmux(['send-keys', '-t', SESSION, 'Enter']);
  appendLedger('@Codex', stamped);
}

function showUsage() {
  console.log('Usage: node interlateral_dna/codex.js send "message" | status');
}

const [, , command, ...args] = process.argv;

switch (command) {
  case 'send':
    send(args.join(' '));
    break;
  case 'status':
    getStatus();
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
