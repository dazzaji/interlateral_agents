#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getIdentity, stampMessage } = require('./identity');
const { deliverVerified, paneInfo, paneMode } = require('./mesh-transport');

const TMUX_SOCKET = process.env.TMUX_SOCKET || process.env.INTERLATERAL_TMUX_SOCKET || '/tmp/interlateral-agents-tmux.sock';
const SESSION = process.env.GEMINI_TMUX_SESSION || 'ia-gemini';
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

function ready() {
  const cmd = paneCommand();
  return ['inbox', 'tui'].includes(paneMode(cmd));
}

function appendLedger(target, message, receipt) {
  const sender = getIdentity().sender || 'relay';
  const timestamp = new Date().toISOString();
  if (receipt) fs.appendFileSync(COMMS_PATH, JSON.stringify({ timestamp, sender, ...receipt }) + '\n');
  fs.appendFileSync(COMMS_PATH, `\n[${sender}] ${target} [${timestamp}]\n${message}\n\n---\n`);
}

function getStatus() {
  const exists = sessionExists();
  const info = exists ? paneInfo(runTmux, SESSION) : { command: '', tty: '' };
  const payload = {
    session: SESSION,
    exists,
    pane_command: info.command || null,
    pane_mode: paneMode(info.command),
    pane_tty: info.tty || null,
    ready: exists && ready(),
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
// a direct pane-TTY write (paste-buffer silently no-ops there); a TUI gets the
// buffer paste + Escape/Enter submit. Either way the pane is re-captured and a
// send that never rendered exits nonzero instead of reporting success.
function deliver(text) {
  return deliverVerified({
    runTmux,
    session: SESSION,
    text,
    submitKeys: ['Escape', 'Enter'],
  });
}

function send(message) {
  if (!message) {
    console.error('Usage: node interlateral_dna/gemini.js send "message"');
    process.exit(1);
  }
  if (!sessionExists()) {
    console.error(`tmux session '${SESSION}' not found on ${TMUX_SOCKET}`);
    process.exit(1);
  }

  const stamped = stampMessage(message);

  const result = deliver(stamped);
  if (!result.ok) {
    appendLedger('@Gemini', `${stamped}\n[${result.receipt.state}: ${result.detail}]`, result.receipt);
    console.error(`ERROR: send to '${SESSION}' NOT confirmed rendered (mode=${result.mode}): ${result.detail}`);
    process.exit(2);
  }
  appendLedger('@Gemini', stamped, result.receipt);
  console.log(`DELIVERED_RENDERED mode=${result.mode} session=${SESSION}`);
}

function showUsage() {
  console.log('Usage: node interlateral_dna/gemini.js send "message" | status | read');
}

const [, , command, ...args] = process.argv;

switch (command) {
  case 'send':
    send(args.join(' '));
    break;
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
