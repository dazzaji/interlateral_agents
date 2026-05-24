#!/bin/bash
set -euo pipefail

# Launch an Antigravity CLI (agy) peer in a tmux session on the shared socket.
# Mirrors launch-gemini-peer.sh. See the agy-cli-peer skill for the full flow.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DNA_DIR="$REPO_ROOT/interlateral_dna"
DEFAULT_PROMPT="You are an Antigravity CLI mesh peer in the Interlateral agent mesh. Read AGENTS.md, interlateral_dna/LIVE_COMMS.md, ANTIGRAVITY.md, and .agent/skills/agy-cli-peer/SKILL.md. Gemini and Antigravity peers are opt-in only; do not recruit Gemini or Antigravity peers unless Principal Human explicitly selects them. Direct injection is the live channel; interlateral_dna/comms.md is the audit ledger only, not a wake-up trigger. Stay interactive, wait for direct assignments, and do not invent work."

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

export PATH="$HOME/.local/bin:$PATH"

shell_quote() {
    local quoted
    printf -v quoted '%q' "$1"
    printf '%s' "$quoted"
}

SESSION_NAME="${1:-}"
if [[ -n "$SESSION_NAME" ]]; then
    shift
else
    # Default to the canonical peer that the docs and agy.js target.
    SESSION_NAME="ia-agy"
fi
# Strict whitelist: the name is interpolated into a shell launch command, so
# reject anything that could break quoting (quotes, ';', spaces, '$()').
if [[ ! "$SESSION_NAME" =~ ^[A-Za-z0-9_-]+$ ]]; then
    echo "Error: session name must match ^[A-Za-z0-9_-]+\$: $SESSION_NAME" >&2
    exit 1
fi

# The canonical session ia-agy uses sender identity 'agy'; numbered auxiliary
# peers use 'agy-peer' so ledger traffic stays distinguishable.
if [[ "$SESSION_NAME" == "ia-agy" ]]; then
    SENDER_ID="agy"
else
    SENDER_ID="agy-peer"
fi
STARTUP_PROMPT="${*:-$DEFAULT_PROMPT}"
LOG_FILE="$DNA_DIR/${SESSION_NAME}.log"
TEAM_ID="${INTERLATERAL_TEAM_ID:-agents}"
SESSION_ID="${INTERLATERAL_SESSION_ID:-peer_$(date +%s)}"
LAUNCH_SESSION_ID="${SESSION_ID}_${SESSION_NAME}"

for cmd in tmux agy; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Missing required command: $cmd" >&2
        exit 1
    fi
done

if run_tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists on $TMUX_SOCKET" >&2
    exit 1
fi

run_tmux new-session -d -s "$SESSION_NAME" -x 200 -y 50 -c "$REPO_ROOT"
: > "$LOG_FILE"
LOG_FILE_Q="$(shell_quote "$LOG_FILE")"
run_tmux pipe-pane -o -t "$SESSION_NAME" "cat >> $LOG_FILE_Q"

REPO_ROOT_Q="$(shell_quote "$REPO_ROOT")"
TMUX_SOCKET_Q="$(shell_quote "$TMUX_SOCKET")"
TEAM_ID_Q="$(shell_quote "$TEAM_ID")"
SENDER_ID_Q="$(shell_quote "$SENDER_ID")"
LAUNCH_SESSION_ID_Q="$(shell_quote "$LAUNCH_SESSION_ID")"
CC_SESSION_Q="$(shell_quote "$CC_SESSION")"
CODEX_SESSION_Q="$(shell_quote "$CODEX_SESSION")"
GEMINI_SESSION_Q="$(shell_quote "$GEMINI_SESSION")"
SESSION_NAME_Q="$(shell_quote "$SESSION_NAME")"
STARTUP_PROMPT_Q="$(shell_quote "$STARTUP_PROMPT")"

LAUNCH_CMD="cd $REPO_ROOT_Q && export PATH=\"\$HOME/.local/bin:\$PATH\" TMUX_SOCKET=$TMUX_SOCKET_Q INTERLATERAL_TMUX_SOCKET=$TMUX_SOCKET_Q INTERLATERAL_TEAM_ID=$TEAM_ID_Q INTERLATERAL_SENDER=$SENDER_ID_Q INTERLATERAL_AGENT_TYPE=agy INTERLATERAL_SESSION_ID=$LAUNCH_SESSION_ID_Q CC_TMUX_SESSION=$CC_SESSION_Q CODEX_TMUX_SESSION=$CODEX_SESSION_Q GEMINI_TMUX_SESSION=$GEMINI_SESSION_Q AGY_TMUX_SESSION=$SESSION_NAME_Q && agy -i $STARTUP_PROMPT_Q --dangerously-skip-permissions --add-dir $REPO_ROOT_Q"
run_tmux send-keys -t "$SESSION_NAME" "$LAUNCH_CMD" Enter

echo "Launched Antigravity CLI peer"
echo "Socket: $TMUX_SOCKET"
echo "Session: $SESSION_NAME"
echo "Log: $LOG_FILE"
echo "Note: on the first-ever agy run, clear the onboarding wizard (theme + ToS)"
echo "by sending Enter a few times. See the agy-cli-peer skill."
