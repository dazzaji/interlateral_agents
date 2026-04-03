#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

usage() {
    cat <<'EOF'
Usage:
  scripts/send-codex-peer.sh [--no-wait-idle] [--wait-tries N] <session-name> <prompt>
EOF
}

WAIT_IDLE=1
WAIT_TRIES=30

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-wait-idle)
            WAIT_IDLE=0
            shift
            ;;
        --wait-tries)
            WAIT_TRIES="${2:?--wait-tries requires a value}"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

if [[ $# -lt 2 ]]; then
    usage
    exit 1
fi

SESSION_NAME="$1"
shift
PROMPT="$*"

if ! run_tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' not found on $TMUX_SOCKET" >&2
    exit 1
fi

if [[ "$WAIT_IDLE" -eq 1 ]] && ! pane_idle "$SESSION_NAME"; then
    echo "Waiting for Codex session '$SESSION_NAME' to become idle..." >&2
    if ! wait_for_idle "$SESSION_NAME" "$WAIT_TRIES"; then
        echo "Session '$SESSION_NAME' did not become idle after $WAIT_TRIES checks." >&2
        exit 1
    fi
fi

if [[ "$PROMPT" == *$'\n'* || "${#PROMPT}" -gt 240 ]]; then
    agent_send_long "$SESSION_NAME" "$PROMPT" "codex_peer_${SESSION_NAME}_$$"
else
    codex_send_clean "$SESSION_NAME" "$PROMPT"
fi

echo "Sent prompt to $SESSION_NAME on $TMUX_SOCKET"
