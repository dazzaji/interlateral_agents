#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DNA_DIR="$REPO_ROOT/interlateral_dna"
DEFAULT_PROMPT="Read GEMINI.md first, then wait for instructions."

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

SESSION_NAME="${1:-}"
if [[ -n "$SESSION_NAME" ]]; then
    shift
else
    SESSION_NAME="$(next_peer_session_name "ia-gemini-peer")"
fi
if [[ "$SESSION_NAME" =~ [/\.\.]|^\.\. ]]; then
    echo "Error: session name must not contain '/' or '..': $SESSION_NAME" >&2
    exit 1
fi
STARTUP_PROMPT="${*:-$DEFAULT_PROMPT}"
LOG_FILE="$DNA_DIR/${SESSION_NAME}.log"
TEAM_ID="${INTERLATERAL_TEAM_ID:-agents}"
SESSION_ID="${INTERLATERAL_SESSION_ID:-peer_$(date +%s)}"

for cmd in tmux gemini; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Missing required command: $cmd" >&2
        exit 1
    fi
done

if run_tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists on $TMUX_SOCKET" >&2
    exit 1
fi

run_tmux new-session -d -s "$SESSION_NAME" -c "$REPO_ROOT"
: > "$LOG_FILE"
run_tmux pipe-pane -o -t "$SESSION_NAME" "cat >> '$LOG_FILE'"

LAUNCH_CMD="cd '$REPO_ROOT' && export TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TEAM_ID='$TEAM_ID' INTERLATERAL_SENDER='gemini-peer' INTERLATERAL_AGENT_TYPE='gemini' INTERLATERAL_SESSION_ID='${SESSION_ID}_${SESSION_NAME}' CC_TMUX_SESSION='$CC_SESSION' CODEX_TMUX_SESSION='$CODEX_SESSION' GEMINI_TMUX_SESSION='$SESSION_NAME' && gemini --approval-mode=auto_edit"
run_tmux send-keys -t "$SESSION_NAME" "$LAUNCH_CMD" Enter

wait_for_idle "$SESSION_NAME" 30 || true
agent_send_long_delayed "$SESSION_NAME" "$STARTUP_PROMPT" 1 "gemini_peer_${SESSION_NAME}_$$"

echo "Launched Gemini peer"
echo "Socket: $TMUX_SOCKET"
echo "Session: $SESSION_NAME"
echo "Log: $LOG_FILE"
