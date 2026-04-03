#!/usr/bin/env node
/**
 * gemini.js - Control Gemini CLI via tmux
 *
 * Mirror of codex.js, but for injecting messages to Gemini CLI.
 * Requires Gemini CLI to be running in a tmux session (default: 'interlateral-gemini').
 *
 * Commands:
 *   node gemini.js send "message"     - Send message directly to Gemini CLI
 *   node gemini.js status             - Check if Gemini tmux session exists
 *   node gemini.js read               - Capture current pane content
 *
 * Environment:
 *   GEMINI_TMUX_SESSION - Override session name (default: 'gemini')
 *
 * DESIGN PHILOSOPHY:
 * This enables CC, AG, and Codex to communicate directly with Gemini CLI,
 * creating a quad-agent mesh network. Combined with cc.js, ag.js, and codex.js,
 * this enables full bidirectional comms between all four agents.
 *
 * KEY DIFFERENCES FROM AG (Antigravity):
 * - Gemini CLI is terminal-based (like Codex), not GUI-based
 * - Uses tmux injection (like cc.js/codex.js), not CDP
 * - Has native telemetry via pipe-pane (AG requires CDP scraping)
 * - Context file is GEMINI.md (auto-loaded by Gemini CLI)
 *
 * @see cc.js for AG/Codex/Gemini → CC injection
 * @see ag.js for CC/Codex/Gemini → AG injection (CDP)
 * @see codex.js for CC/AG/Gemini → Codex injection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// tmux socket path - use explicit socket to ensure Codex can access without permission prompts
// The system default socket at /private/tmp/ is outside Codex's writable roots
const TMUX_SOCKET = process.env.TMUX_SOCKET || '/tmp/interlateral-tmux.sock';
const TMUX = `tmux -S ${TMUX_SOCKET}`;

// tmux session name for Gemini CLI (namespaced to avoid conflicts)
const GEMINI_TMUX_SESSION = process.env.GEMINI_TMUX_SESSION || 'interlateral-gemini';

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

// Path to gemini telemetry log
const TELEMETRY_PATH = path.join(__dirname, '..', '.gemini', 'gemini_cli_telemetry.log');

/**
 * Check if Gemini tmux session exists
 */
function checkSession() {
  try {
    execSync(`${TMUX} has-session -t ${GEMINI_TMUX_SESSION} 2>/dev/null`, { timeout: 2000, /* system socket */ });
    return true;
  } catch (err) {
    recordTmuxAccessError(err);
    return false;
  }
}

/**
 * Check what process is running in the tmux pane
 * Returns the command name (e.g., 'gemini', 'node', 'zsh')
 */
function getPaneCommand() {
  try {
    const result = execSync(
      `${TMUX} display-message -p -F "#{pane_current_command}" -t ${GEMINI_TMUX_SESSION}`,
      { timeout: 2000, encoding: 'utf-8', /* system socket */ }
    );
    return result.trim();
  } catch (err) {
    recordTmuxAccessError(err);
    return null;
  }
}

/**
 * Check if Gemini CLI appears to be running (not just an idle shell)
 * Gemini CLI typically runs as 'node' or 'gemini' process
 */
function isGeminiRunning() {
  const cmd = getPaneCommand();
  if (!cmd) return false;

  // Gemini CLI runs as 'node' (the CLI) or 'gemini' on some systems
  // Idle shells are 'bash', 'zsh', 'sh', 'fish'
  const idleShells = ['bash', 'zsh', 'sh', 'fish'];

  if (cmd === 'node') return 'Gemini CLI (Node)';
  if (cmd === 'gemini') return 'Gemini CLI';
  return !idleShells.includes(cmd);
}

/**
 * Get Gemini CLI injection status
 */
function getStatus() {
  const sessionExists = checkSession();
  const paneCmd = getPaneCommand();
  let geminiStatus = isGeminiRunning();

  // Normalize for boolean check where needed, but keep description
  const isRunning = Boolean(geminiStatus && geminiStatus !== false);

  console.log('=== Gemini CLI Injection Status ===');
  console.log(`tmux session '${GEMINI_TMUX_SESSION}': ${sessionExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  if (sessionExists) {
    console.log(`Pane process: ${paneCmd || 'unknown'}`);
    console.log(`Gemini attached: ${isRunning ? '✅ YES (' + (typeof geminiStatus === 'string' ? geminiStatus : 'Active') + ')' : '⚠️  NO (idle shell)'}`);

    if (!isRunning) {
      console.log('\n⚠️  Warning: Session exists but Gemini CLI is not running in it.');
      console.log('Messages sent now will go to the shell prompt, not Gemini.');
      console.log('\nTo fix: Run Gemini CLI inside the tmux session:');
      console.log(`  tmux -S "${TMUX_SOCKET}" attach -t ${GEMINI_TMUX_SESSION}`);
      console.log('  # Then start Gemini CLI:');
      console.log('  gemini --approval-mode=auto_edit');
      console.log('  # Or for full auto (sandboxed by default):');
      console.log('  gemini -y');
    }
  } else {
    console.log('\nTo enable Gemini CLI injection:');
    console.log(`  tmux -S "${TMUX_SOCKET}" new-session -d -s ${GEMINI_TMUX_SESSION}`);
    console.log('  # Then run Gemini CLI in that session');
  }

  warnIfTmuxAccessDenied();

  return {
    session: GEMINI_TMUX_SESSION,
    sessionExists,
    paneCommand: paneCmd,
    geminiAttached: isRunning,
    ready: sessionExists && isRunning
  };
}

/**
 * Capture current pane content (read what Gemini is showing)
 */
function read() {
  if (!checkSession()) {
    console.error(`Error: tmux session '${GEMINI_TMUX_SESSION}' not found.`);
    warnIfTmuxAccessDenied();
    process.exit(1);
  }

  try {
    // Capture the entire scrollback buffer
    const content = execSync(
      `${TMUX} capture-pane -t ${GEMINI_TMUX_SESSION} -p -S -`,
      { timeout: 5000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    console.log(content);
    return content;
  } catch (error) {
    console.error('❌ Failed to read Gemini pane:', error.message);
    process.exit(1);
  }
}

/**
 * Send a message directly to Gemini CLI via tmux
 */
function send(message) {
  if (!checkSession()) {
    console.error(`Error: tmux session '${GEMINI_TMUX_SESSION}' not found.`);
    console.error(`Create it with: tmux -S "${TMUX_SOCKET}" new-session -d -s ${GEMINI_TMUX_SESSION}`);
    warnIfTmuxAccessDenied();
    process.exit(1);
  }

  // Warn if Gemini doesn't appear to be running (but still send)
  const geminiStatus = isGeminiRunning();
  const isRunning = Boolean(geminiStatus && geminiStatus !== false);

  if (!isRunning) {
    const paneCmd = getPaneCommand();
    console.warn(`⚠️  Warning: tmux pane is running '${paneCmd}', not Gemini CLI.`);
    console.warn('   Message will go to shell prompt, not Gemini input.');
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
    // Without delay, text appears but Enter doesn't submit (input buffer issue)
    // Same pattern as cc.js and codex.js - discovered through testing
    execSync(`${TMUX} send-keys -t ${GEMINI_TMUX_SESSION} -- "${escaped}"`, { timeout: 5000, /* system socket */ });

    // Wait 1 second for text to fully buffer in Gemini's input
    // This delay is REQUIRED - same as cc.js/codex.js pattern
    execSync('sleep 1', { timeout: 2000, /* system socket */ });

    // Send Enter to submit
    execSync(`${TMUX} send-keys -t ${GEMINI_TMUX_SESSION} Enter`, { timeout: 1000, /* system socket */ });

    console.log(`✅ Message sent to Gemini CLI in tmux session '${GEMINI_TMUX_SESSION}'`);

    // Log to comms.md for record
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const entry = `\n[AG] @Gemini [${timestamp}]\n${message}\n\n---\n`;
      fs.appendFileSync(COMMS_PATH, entry);
      console.log('📝 Also logged to comms.md');
    } catch (logError) {
      console.warn('⚠️  Could not log to comms.md:', logError.message);
    }

    return { success: true, method: 'tmux', session: GEMINI_TMUX_SESSION };
  } catch (error) {
    console.error('❌ Failed to send to Gemini CLI:', error.message);
    process.exit(1);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
gemini.js - Control Gemini CLI via tmux

USAGE:
  node gemini.js send "Your message"   Send message to Gemini CLI
  node gemini.js status                Check Gemini session status
  node gemini.js read                  Capture current pane content
  node gemini.js help                  Show this help

ENVIRONMENT:
  GEMINI_TMUX_SESSION  Override session name (default: 'interlateral-gemini')
  TMUX_SOCKET          Override tmux socket path (default: /tmp/interlateral-tmux.sock)

EXAMPLES:
  node gemini.js send "Please review comms.md"
  node gemini.js send "[CC] @Gemini Ready for your input"
  node gemini.js read
  GEMINI_TMUX_SESSION=my-gemini node gemini.js status
  TMUX_SOCKET=/tmp/interlateral-tmux.sock node gemini.js status

GEMINI CLI MODES:
  --approval-mode=default     Prompt for everything (safest)
  --approval-mode=auto_edit   Auto-approve file edits only (recommended)
  --approval-mode=yolo / -y, --yolo   Auto-approve all (sandbox ON by default!)

NOTE: Unlike Codex/CC, Gemini's --yolo enables sandbox by default.
      For true dangerous mode: gemini --yolo --sandbox=false

DESIGN:
  This is part of the quad-agent mesh network. Together with cc.js, ag.js,
  and codex.js, it enables true bidirectional real-time communication
  between CC, AG, Codex, and Gemini CLI:

    CC → Gemini:     node gemini.js send "message" (via tmux)
    AG → Gemini:     node gemini.js send "message" (via tmux)
    Codex → Gemini:  node gemini.js send "message" (via tmux)
    Gemini → CC:     node cc.js send "message"     (via tmux)
    Gemini → AG:     node ag.js send "message"     (via CDP)
    Gemini → Codex:  node codex.js send "message"  (via tmux)
`);
}

// Main command handler
const [, , command, ...args] = process.argv;

switch (command) {
  case 'send':
    if (args.length === 0) {
      console.error('Error: No message provided');
      console.error('Usage: node gemini.js send "Your message"');
      process.exit(1);
    }
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
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    showUsage();
    process.exit(command ? 1 : 0);
}
