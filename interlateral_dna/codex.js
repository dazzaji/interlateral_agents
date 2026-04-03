#!/usr/bin/env node
/**
 * codex.js - Control Codex via tmux
 *
 * Mirror of cc.js, but for injecting messages to Codex.
 * Requires Codex to be running in a tmux session (default: 'interlateral-codex').
 *
 * Commands:
 *   node codex.js send "message"     - Send message directly to Codex
 *   node codex.js status             - Check if Codex tmux session exists
 *
 * Environment:
 *   CODEX_TMUX_SESSION - Override session name (default: 'codex')
 *
 * DESIGN PHILOSOPHY:
 * This enables CC and AG to communicate directly with Codex, creating
 * a true tri-agent mesh network. Combined with cc.js and ag.js, this
 * enables full bidirectional comms between all three agents.
 *
 * @see cc.js for AG/CC → CC injection
 * @see ag.js for CC/Codex → AG injection
 * @see AGENTS.md for Codex startup instructions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// tmux socket path - use explicit socket to ensure Codex can access without permission prompts
// The system default socket at /private/tmp/ is outside Codex's writable roots
const TMUX_SOCKET = process.env.TMUX_SOCKET || '/tmp/interlateral-tmux.sock';
const TMUX = `tmux -S ${TMUX_SOCKET}`;

// tmux session name for Codex (namespaced to avoid conflicts)
const CODEX_TMUX_SESSION = process.env.CODEX_TMUX_SESSION || 'interlateral-codex';

// Track tmux access errors (common when running inside sandboxed environments)
let tmuxAccessError = null;

function recordTmuxAccessError(err) {
  if (!err) return;
  const message = String(err.message || '');
  const stderr = err.stderr ? String(err.stderr) : '';
  const combined = `${message}\n${stderr}`.toLowerCase();
  if (combined.includes('operation not permitted') || combined.includes('permission denied')) {
    tmuxAccessError = err;
  }
}

function warnIfTmuxAccessDenied() {
  if (!tmuxAccessError) return;
  console.error('\n⚠️  TMUX SOCKET ACCESS DENIED');
  console.error(`The tmux socket at "${TMUX_SOCKET}" is not accessible from this environment.`);
  console.error('Run this command from your host Terminal (outside Codex sandbox).');
  console.error('This is expected if you run status checks from Codex itself.');
}

// Path to comms.md for logging
const COMMS_PATH = path.join(__dirname, 'comms.md');

/**
 * Check if Codex tmux session exists
 */
function checkSession() {
  try {
    execSync(`${TMUX} has-session -t ${CODEX_TMUX_SESSION} 2>/dev/null`, { timeout: 2000, /* system socket */ });
    return true;
  } catch (err) {
    recordTmuxAccessError(err);
    return false;
  }
}

/**
 * Check what process is running in the tmux pane
 * Returns the command name (e.g., 'codex', 'node', 'zsh')
 */
function getPaneCommand() {
  try {
    const result = execSync(
      `${TMUX} display-message -p -F "#{pane_current_command}" -t ${CODEX_TMUX_SESSION}`,
      { timeout: 2000, encoding: 'utf-8', /* system socket */ }
    );
    return result.trim();
  } catch (err) {
    recordTmuxAccessError(err);
    return null;
  }
}

/**
 * Check if Codex appears to be running (not just an idle shell)
 * Codex typically runs as 'node' or 'codex' process
 */
function isCodexRunning() {
  const cmd = getPaneCommand();
  if (!cmd) return false;

  // Codex runs as 'node' (the CLI) or 'codex' on some systems
  // Idle shells are 'bash', 'zsh', 'sh', 'fish'
  const idleShells = ['bash', 'zsh', 'sh', 'fish'];

  if (cmd === 'node') return 'Codex CLI (Node)';
  if (cmd === 'codex') return 'Codex CLI';
  return !idleShells.includes(cmd);
}

/**
 * Get Codex injection status
 */
function getStatus() {
  const sessionExists = checkSession();
  const paneCmd = getPaneCommand();
  // isCodexRunning now returns a truthy string (description) or boolean/string for check
  let codexStatus = isCodexRunning();

  // Normalize for boolean check where needed, but keep description
  const isRunning = Boolean(codexStatus && codexStatus !== false);

  console.log('=== Codex Injection Status ===');
  console.log(`tmux session '${CODEX_TMUX_SESSION}': ${sessionExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  if (sessionExists) {
    console.log(`Pane process: ${paneCmd || 'unknown'}`);
    console.log(`Codex attached:  ${isRunning ? '✅ YES (' + (typeof codexStatus === 'string' ? codexStatus : 'Active') + ')' : '⚠️  NO (idle shell)'}`);

    if (!isRunning) {
      console.log('\n⚠️  Warning: Session exists but Codex is not running in it.');
      console.log('Messages sent now will go to the shell prompt, not Codex.');
      console.log('\nTo fix: Run Codex inside the tmux session:');
      console.log(`  tmux -S "${TMUX_SOCKET}" attach -t ${CODEX_TMUX_SESSION}`);
      console.log('  # Then start Codex with safety flags:');
      console.log('  codex --sandbox workspace-write --ask-for-approval never');
    }
  } else {
    console.log('\nTo enable Codex injection:');
    console.log(`  tmux -S "${TMUX_SOCKET}" new-session -d -s ${CODEX_TMUX_SESSION}`);
    console.log('  # Then run Codex in that session with safety flags');
  }

  warnIfTmuxAccessDenied();

  return {
    session: CODEX_TMUX_SESSION,
    sessionExists,
    paneCommand: paneCmd,
    codexAttached: isRunning,
    ready: sessionExists && isRunning
  };
}

/**
 * Send a message directly to Codex via tmux
 */
function send(message) {
  if (!checkSession()) {
    console.error(`Error: tmux session '${CODEX_TMUX_SESSION}' not found.`);
    console.error(`Create it with: tmux -S "${TMUX_SOCKET}" new-session -d -s ${CODEX_TMUX_SESSION}`);
    warnIfTmuxAccessDenied();
    process.exit(1);
  }

  // Warn if Codex doesn't appear to be running (but still send)
  const codexStatus = isCodexRunning();
  const isRunning = Boolean(codexStatus && codexStatus !== false);

  if (!isRunning) {
    const paneCmd = getPaneCommand();
    console.warn(`⚠️  Warning: tmux pane is running '${paneCmd}', not Codex.`);
    console.warn('   Message will go to shell prompt, not Codex input.');
    console.warn('   (Sending anyway in case this is intentional)\n');
  }

  try {
    // Escape special characters for tmux
    const escaped = message
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');

    // Send the message keys
    // CRITICAL: Must have delay between text and Enter to avoid race condition
    // Without delay, text appears but Enter doesn't submit (Codex input buffer issue)
    // Same pattern as cc.js - discovered through testing
    execSync(`${TMUX} send-keys -t ${CODEX_TMUX_SESSION} -- "${escaped}"`, { timeout: 5000, /* system socket */ });

    // Wait 1 second for text to fully buffer in Codex's input
    // This delay is REQUIRED - same as cc.js pattern
    execSync('sleep 1', { timeout: 2000 });

    // Send Enter to submit
    execSync(`${TMUX} send-keys -t ${CODEX_TMUX_SESSION} Enter`, { timeout: 1000, /* system socket */ });

    console.log(`✅ Message sent to Codex in tmux session '${CODEX_TMUX_SESSION}'`);

    // Log to comms.md for record
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const entry = `\n[AG] @Codex [${timestamp}]\n${message}\n\n---\n`;
      fs.appendFileSync(COMMS_PATH, entry);
      console.log('📝 Also logged to comms.md');
    } catch (logError) {
      console.warn('⚠️  Could not log to comms.md:', logError.message);
    }

    return { success: true, method: 'tmux', session: CODEX_TMUX_SESSION };
  } catch (error) {
    console.error('❌ Failed to send to Codex:', error.message);
    process.exit(1);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
codex.js - Control Codex via tmux

USAGE:
  node codex.js send "Your message"   Send message to Codex
  node codex.js status                Check Codex session status
  node codex.js help                  Show this help

ENVIRONMENT:
  CODEX_TMUX_SESSION  Override session name (default: 'interlateral-codex')
  TMUX_SOCKET         Override tmux socket path (default: /tmp/interlateral-tmux.sock)

EXAMPLES:
  node codex.js send "Please review comms.md"
  node codex.js send "[CC] @Codex Ready for your input"
  CODEX_TMUX_SESSION=my-codex node codex.js status
  TMUX_SOCKET=/tmp/interlateral-tmux.sock node codex.js status

DESIGN:
  This is part of the tri-agent mesh network. Together with cc.js and ag.js,
  it enables true bidirectional real-time communication between CC, AG, and Codex:

    CC → AG:     node ag.js send "message"    (via CDP/Puppeteer)
    CC → Codex:  node codex.js send "message" (via tmux send-keys)
    AG → CC:     node cc.js send "message"    (via tmux send-keys)
    AG → Codex:  node codex.js send "message" (via tmux send-keys)
    Codex → CC:  node cc.js send "message"    (via tmux send-keys)
    Codex → AG:  node ag.js send "message"    (via CDP/Puppeteer)
`);
}

// Main command handler
const [, , command, ...args] = process.argv;

switch (command) {
  case 'send':
    if (args.length === 0) {
      console.error('Error: No message provided');
      console.error('Usage: node codex.js send "Your message"');
      process.exit(1);
    }
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
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    showUsage();
    process.exit(command ? 1 : 0);
}
