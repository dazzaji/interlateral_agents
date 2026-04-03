#!/usr/bin/env node
/**
 * cc.js - Control Claude Code via tmux
 *
 * Mirror of ag.js, but for injecting messages to CC.
 * Requires CC to be running in a tmux session (default: 'interlateral-claude').
 *
 * Commands:
 *   node cc.js send "message"     - Send message directly to CC
 *   node cc.js status             - Check if CC tmux session exists
 *
 * Environment:
 *   CC_TMUX_SESSION - Override session name (default: 'claude')
 *
 * DESIGN PHILOSOPHY:
 * This enables AG to communicate directly with CC, eliminating the need
 * for humans to relay messages. Combined with ag.js, this creates
 * TRUE BIDIRECTIONAL REAL-TIME COMMS between CC and AG.
 *
 * @see ag.js for CC → AG injection
 * @see ANTIGRAVITY.md for AG startup instructions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// tmux socket path - use explicit socket to ensure Codex can access without permission prompts
// The system default socket at /private/tmp/ is outside Codex's writable roots
const TMUX_SOCKET = process.env.TMUX_SOCKET || '/tmp/interlateral-tmux.sock';
const TMUX = `tmux -S ${TMUX_SOCKET}`;

// tmux session name for CC (namespaced to avoid conflicts)
const CC_TMUX_SESSION = process.env.CC_TMUX_SESSION || 'interlateral-claude';

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
 * Check if CC tmux session exists
 */
function checkSession() {
  try {
    execSync(`${TMUX} has-session -t ${CC_TMUX_SESSION} 2>/dev/null`, { timeout: 2000, /* system socket */ });
    return true;
  } catch (err) {
    recordTmuxAccessError(err);
    return false;
  }
}

/**
 * Check what process is running in the tmux pane
 * Returns the command name (e.g., 'claude', 'node', 'zsh')
 */
function getPaneCommand() {
  try {
    const result = execSync(
      `${TMUX} display-message -p -F "#{pane_current_command}" -t ${CC_TMUX_SESSION}`,
      { timeout: 2000, encoding: 'utf-8', /* system socket */ }
    );
    return result.trim();
  } catch (err) {
    recordTmuxAccessError(err);
    return null;
  }
}

/**
 * Check if CC appears to be running (not just an idle shell)
 * CC typically runs as 'node' or 'claude' process
 */
function isCCRunning() {
  const cmd = getPaneCommand();
  if (!cmd) return false;

  // CC runs as 'node' (the CLI) or 'claude' on some systems
  // Idle shells are 'bash', 'zsh', 'sh'
  const idleShells = ['bash', 'zsh', 'sh', 'fish'];
  return !idleShells.includes(cmd);
}

/**
 * Get CC injection status
 */
function getStatus() {
  const sessionExists = checkSession();
  const paneCmd = getPaneCommand();
  const ccRunning = isCCRunning();

  console.log('=== CC Injection Status ===');
  console.log(`tmux session '${CC_TMUX_SESSION}': ${sessionExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  if (sessionExists) {
    console.log(`Pane process: ${paneCmd || 'unknown'}`);
    console.log(`CC attached:  ${ccRunning ? '✅ YES' : '⚠️  NO (idle shell)'}`);

    if (!ccRunning) {
      console.log('\n⚠️  Warning: Session exists but CC is not running in it.');
      console.log('Messages sent now will go to the shell prompt, not CC.');
      console.log('\nTo fix: Run CC inside the tmux session:');
      console.log(`  tmux -S "${TMUX_SOCKET}" attach -t ${CC_TMUX_SESSION}`);
      console.log('  # Then start CC (e.g., claude)');
    }
  } else {
    console.log('\nTo enable CC injection:');
    console.log(`  tmux -S "${TMUX_SOCKET}" new-session -d -s ${CC_TMUX_SESSION}`);
    console.log('  # Then run CC in that session');
  }

  warnIfTmuxAccessDenied();

  return {
    session: CC_TMUX_SESSION,
    sessionExists,
    paneCommand: paneCmd,
    ccAttached: ccRunning,
    ready: sessionExists && ccRunning
  };
}

/**
 * Send a message directly to CC via tmux
 */
function send(message) {
  if (!checkSession()) {
    console.error(`Error: tmux session '${CC_TMUX_SESSION}' not found.`);
    console.error(`Create it with: tmux -S "${TMUX_SOCKET}" new-session -d -s ${CC_TMUX_SESSION}`);
    warnIfTmuxAccessDenied();
    process.exit(1);
  }

  // Warn if CC doesn't appear to be running (but still send)
  const ccRunning = isCCRunning();
  if (!ccRunning) {
    const paneCmd = getPaneCommand();
    console.warn(`⚠️  Warning: tmux pane is running '${paneCmd}', not CC.`);
    console.warn('   Message will go to shell prompt, not CC input.');
    console.warn('   (Sending anyway in case this is intentional)\n');
  }

  try {
    // Escape special characters for tmux
    // Escape special characters for tmux
    const escaped = message
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');

    // Send the message followed by Enter
    // Send the message keys
    // -l flag tells tmux to treat characters literally (no need to escape special chars except newlines)
    // We replace newlines with actual enters if needed, but for now let's stick to single line or simple escaping

    // Safer approach: send the text, then send Enter separately
    // CRITICAL: Must have delay between text and Enter to avoid race condition
    // Without delay, text appears but Enter doesn't submit (CC input buffer issue)
    execSync(`${TMUX} send-keys -t ${CC_TMUX_SESSION} -- "${escaped}"`, { timeout: 5000, /* system socket */ });

    // Wait 1 second for text to fully buffer in CC's input
    // This delay is REQUIRED - discovered through testing on 2026-01-21
    execSync('sleep 1', { timeout: 2000, /* system socket */ });

    // Send Enter to submit
    execSync(`${TMUX} send-keys -t ${CC_TMUX_SESSION} Enter`, { timeout: 1000, /* system socket */ });

    console.log(`✅ Message sent to CC in tmux session '${CC_TMUX_SESSION}'`);

    // Log to comms.md for record
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const entry = `\n[AG] @CC [${timestamp}]\n${message}\n\n---\n`;
      fs.appendFileSync(COMMS_PATH, entry);
      console.log('📝 Also logged to comms.md');
    } catch (logError) {
      console.warn('⚠️  Could not log to comms.md:', logError.message);
    }

    return { success: true, method: 'tmux', session: CC_TMUX_SESSION };
  } catch (error) {
    console.error('❌ Failed to send to CC:', error.message);
    process.exit(1);
  }
}

/**
 * Send a file's content directly to CC via tmux
 */
function sendFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`📖 Reading ${content.length} bytes from ${filePath}...`);
    return send(content);
  } catch (error) {
    console.error('❌ Failed to read or send file:', error.message);
    process.exit(1);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
cc.js - Control Claude Code via tmux

USAGE:
  node cc.js send "Your message"   Send message to CC
  node cc.js send-file path/to/f   Send file content to CC
  node cc.js status                Check CC session status
  node cc.js help                  Show this help

ENVIRONMENT:
  CC_TMUX_SESSION  Override session name (default: 'interlateral-claude')
  TMUX_SOCKET      Override tmux socket path (default: /tmp/interlateral-tmux.sock)

EXAMPLES:
  node cc.js send "Please review comms.md"
  node cc.js send "[AG] @CC Ready for next task"
  CC_TMUX_SESSION=my-session node cc.js status
  TMUX_SOCKET=/tmp/interlateral-tmux.sock node cc.js status

DESIGN:
  This is the mirror of ag.js. Together they enable true bidirectional
  real-time communication between CC and AG:
  
    CC → AG:  node ag.js send "message"  (via CDP/Puppeteer)
    AG → CC:  node cc.js send "message"  (via tmux send-keys)
`);
}

// Main command handler
const [, , command, ...args] = process.argv;

switch (command) {
  case 'send':
    send(args.join(' '));
    break;

  case 'send-file':
    if (args.length === 0) {
      console.error('Error: No file path provided');
      console.error('Usage: node cc.js send-file path/to/file');
      process.exit(1);
    }
    sendFile(args[0]);
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
