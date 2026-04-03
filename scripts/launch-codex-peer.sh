#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DNA_DIR="$REPO_ROOT/interlateral_dna"
DEFAULT_PROMPT="Read AGENTS.md first, then wait for instructions."

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

usage() {
    cat <<'EOF'
Usage:
  scripts/launch-codex-peer.sh [session-name] [startup-prompt]

Examples:
  scripts/launch-codex-peer.sh
  scripts/launch-codex-peer.sh ia-codex-peer-02
  scripts/launch-codex-peer.sh ia-codex-peer-03 "Read AGENTS.md, then report ready."
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

SESSION_NAME="${1:-}"
if [[ -n "$SESSION_NAME" ]]; then
    shift
else
    SESSION_NAME="$(next_peer_session_name "ia-codex-peer")"
fi
STARTUP_PROMPT="${*:-$DEFAULT_PROMPT}"
LOG_FILE="$DNA_DIR/${SESSION_NAME}.log"
TEAM_ID="${INTERLATERAL_TEAM_ID:-agents}"
SESSION_ID="${INTERLATERAL_SESSION_ID:-peer_$(date +%s)}"
printf -v QUOTED_STARTUP_PROMPT '%q' "$STARTUP_PROMPT"

for cmd in tmux codex; do
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

LAUNCH_CMD="cd '$REPO_ROOT' && export TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TEAM_ID='$TEAM_ID' INTERLATERAL_SENDER='codex-peer' INTERLATERAL_AGENT_TYPE='codex' INTERLATERAL_SESSION_ID='${SESSION_ID}_${SESSION_NAME}' CC_TMUX_SESSION='$CC_SESSION' CODEX_TMUX_SESSION='$SESSION_NAME' GEMINI_TMUX_SESSION='$GEMINI_SESSION' && codex --no-alt-screen -m gpt-5.4 --yolo -C '$REPO_ROOT' $QUOTED_STARTUP_PROMPT"

run_tmux send-keys -t "$SESSION_NAME" "$LAUNCH_CMD" Enter

echo "Launched Codex peer"
echo "Socket: $TMUX_SOCKET"
echo "Session: $SESSION_NAME"
echo "Log: $LOG_FILE"
