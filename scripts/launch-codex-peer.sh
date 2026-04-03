#!/bin/bash
# Launch a fresh Codex peer in a repo-scoped tmux session with visible scrollback and logging.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$REPO_ROOT/.runtime/agent_boot"
DEFAULT_PROMPT="Read docs/ops/comms/CLI_FIRST.md first, then wait for instructions."

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

usage() {
    cat <<'EOF'
Usage:
  scripts/launch-codex-peer.sh <session-name> [startup-prompt]

Examples:
  scripts/launch-codex-peer.sh CX_Impl_02
  scripts/launch-codex-peer.sh CX_Impl_02 "Read docs/ops/comms/CLI_FIRST.md first, then report for duty."

Notes:
  - Uses TMUX_SOCKET=/tmp/interlateral-platform-alpha-tmux.sock
  - Refuses to overwrite an existing session
  - Writes a pane log to .runtime/agent_boot/<session-name>.log
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

SESSION_NAME="$1"
shift
STARTUP_PROMPT="${*:-$DEFAULT_PROMPT}"
LOG_FILE="$RUNTIME_DIR/${SESSION_NAME}.log"
printf -v QUOTED_STARTUP_PROMPT '%q' "$STARTUP_PROMPT"

for cmd in tmux codex; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Missing required command: $cmd" >&2
        exit 1
    fi
done

mkdir -p "$RUNTIME_DIR"

if run_tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists on $TMUX_SOCKET" >&2
    echo "Use a new session name or kill it first:" >&2
    echo "  tmux -S '$TMUX_SOCKET' kill-session -t '$SESSION_NAME'" >&2
    exit 1
fi

run_tmux new-session -d -s "$SESSION_NAME" -c "$REPO_ROOT"
: > "$LOG_FILE"
run_tmux pipe-pane -o -t "$SESSION_NAME" "cat >> '$LOG_FILE'"

LAUNCH_CMD="cd '$REPO_ROOT' && export TMUX_SOCKET='$TMUX_SOCKET' CODEX_TMUX_SESSION='$SESSION_NAME' && codex --no-alt-screen -m gpt-5.4 -c model_reasoning_effort='high' --dangerously-bypass-approvals-and-sandbox -C '$REPO_ROOT' $QUOTED_STARTUP_PROMPT"

run_tmux send-keys -t "$SESSION_NAME" "$LAUNCH_CMD" Enter

echo "Launched Codex peer"
echo "Socket: $TMUX_SOCKET"
echo "Session: $SESSION_NAME"
echo "Log: $LOG_FILE"
echo
echo "Next commands:"
echo "  tmux -S '$TMUX_SOCKET' has-session -t '$SESSION_NAME' 2>/dev/null && echo ALIVE || echo DEAD"
echo "  tmux -S '$TMUX_SOCKET' capture-pane -t '$SESSION_NAME' -p -S -200"
echo "  tmux -S '$TMUX_SOCKET' attach -t '$SESSION_NAME'"
echo "  TMUX_SOCKET='$TMUX_SOCKET' '$SCRIPT_DIR/open-tmux-window.sh' '$SESSION_NAME' '$SESSION_NAME'"
