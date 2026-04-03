#!/bin/bash
# Send a follow-up prompt into a Codex tmux session using the safe Escape-then-Enter pattern.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

usage() {
    cat <<'EOF'
Usage:
  scripts/send-codex-peer.sh [--no-wait-idle] [--wait-tries N] <session-name> <prompt>

Examples:
  scripts/send-codex-peer.sh CX_Impl_02 "Read docs/PLATFORM_EVENT_OpenSimpleDebate_OperatorChecklist.md and report readiness."
  scripts/send-codex-peer.sh --no-wait-idle CX_Impl_02 "Short follow-up prompt."
  scripts/send-codex-peer.sh CX_Impl_02 "$(cat /tmp/prompt.txt)"

Notes:
  - Uses the repo tmux socket by default
  - Waits for an idle Codex pane before sending unless --no-wait-idle is used
  - Uses paste-buffer for long or multi-line prompts
  - Never sends C-c to Codex
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
            if [[ $# -lt 2 ]]; then
                echo "--wait-tries requires a value" >&2
                exit 1
            fi
            WAIT_TRIES="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
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

if [[ "$WAIT_IDLE" -eq 1 ]]; then
    if ! pane_idle "$SESSION_NAME"; then
        echo "Waiting for Codex session '$SESSION_NAME' to become idle..." >&2
        if ! wait_for_idle "$SESSION_NAME" "$WAIT_TRIES"; then
            echo "Session '$SESSION_NAME' did not become idle after $WAIT_TRIES checks." >&2
            echo "Inspect it first or rerun with --no-wait-idle if you intend to inject anyway." >&2
            exit 1
        fi
    fi
elif ! pane_idle "$SESSION_NAME"; then
    echo "Warning: session '$SESSION_NAME' does not appear idle; sending anyway because --no-wait-idle was used." >&2
fi

if [[ "$PROMPT" == *$'\n'* || "${#PROMPT}" -gt 240 ]]; then
    agent_send_long "$SESSION_NAME" "$PROMPT" "codex_peer_${SESSION_NAME}_$$"
else
    codex_send_clean "$SESSION_NAME" "$PROMPT"
fi

echo "Sent prompt to $SESSION_NAME on $TMUX_SOCKET"
