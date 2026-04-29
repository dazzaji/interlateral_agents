#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
    cat <<'EOF'
Usage:
  scripts/warp-mesh-peer.sh [--relaunch] claude|codex SESSION

Examples:
  scripts/warp-mesh-peer.sh claude ia-claude-warp
  scripts/warp-mesh-peer.sh codex ia-codex-warp
  scripts/warp-mesh-peer.sh --relaunch codex ia-codex-warp
EOF
}

RELAUNCH=0
if [[ "${1:-}" == "--relaunch" ]]; then
    RELAUNCH=1
    shift
fi

KIND="${1:-}"
SESSION_NAME="${2:-}"

if [[ -z "$KIND" || -z "$SESSION_NAME" || "${3:-}" != "" ]]; then
    usage >&2
    exit 2
fi

case "$KIND" in
    claude|codex) ;;
    *)
        echo "Error: kind must be 'claude' or 'codex': $KIND" >&2
        exit 2
        ;;
esac

if [[ "$SESSION_NAME" == *"/"* || "$SESSION_NAME" == *".."* || "$SESSION_NAME" =~ [[:space:][:cntrl:]] ]]; then
    echo "Error: unsafe tmux session name: $SESSION_NAME" >&2
    exit 2
fi

if [[ "$KIND" == "claude" && "$SESSION_NAME" == *codex* ]]; then
    echo "Warning: launching Claude into codex-looking session '$SESSION_NAME'" >&2
fi
if [[ "$KIND" == "codex" && "$SESSION_NAME" == *claude* ]]; then
    echo "Warning: launching Codex into claude-looking session '$SESSION_NAME'" >&2
fi

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX
TMUX_TARGET="=$SESSION_NAME"
TMUX_PANE_TARGET="=$SESSION_NAME:"

for cmd in tmux "$KIND"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: missing required command on PATH: $cmd" >&2
        exit 127
    fi
done

session_exists() {
    run_tmux has-session -t "$TMUX_TARGET" 2>/dev/null
}

session_health_ok() {
    local cmd output
    cmd="$(pane_current_command "$TMUX_PANE_TARGET")"
    output="$(agent_capture_recent "$TMUX_PANE_TARGET" 80 2>/dev/null || true)"

    case "$KIND" in
        claude)
            [[ "$cmd" =~ ^(claude|[0-9]+\.[0-9]+\.[0-9]+)$ ]] || return 1
            ;;
        codex)
            [[ "$cmd" =~ ^(codex|node)$ ]] || return 1
            ;;
    esac

    if pane_idle "$TMUX_PANE_TARGET"; then
        return 0
    fi

    case "$KIND" in
        claude)
            echo "$output" | grep -Eq "❯" && return 0
            ;;
        codex)
            echo "$output" | grep -Eq "›" && return 0
            ;;
    esac

    return 1
}

print_recovery() {
    cat >&2 <<EOF
Session '$SESSION_NAME' exists but does not look like a healthy $KIND peer.

Inspect it:
  source scripts/tmux-config.sh
  pane_current_command =$SESSION_NAME:
  agent_capture_recent =$SESSION_NAME: 80

Recover explicitly:
  scripts/warp-mesh-peer.sh --relaunch $KIND $SESSION_NAME

This script will not kill an existing session unless --relaunch is supplied.
EOF
}

launch_peer() {
    case "$KIND" in
        claude)
            INTERLATERAL_SENDER="claude-warp" \
            INTERLATERAL_AGENT_TYPE="claude" \
            "$SCRIPT_DIR/launch-cc-peer.sh" "$SESSION_NAME" \
                "Read CLAUDE.md and interlateral_dna/LIVE_COMMS.md. You are $SESSION_NAME, a Warp-visible Claude Code mesh peer. Report ready, then wait."
            ;;
        codex)
            INTERLATERAL_SENDER="codex-warp" \
            INTERLATERAL_AGENT_TYPE="codex" \
            "$SCRIPT_DIR/launch-codex-peer.sh" "$SESSION_NAME" \
                "Read AGENTS.md and interlateral_dna/LIVE_COMMS.md. You are $SESSION_NAME, a Warp-visible Codex mesh peer. Report ready, then wait."
            ;;
    esac
}

cd "$REPO_ROOT"

if (( RELAUNCH )); then
    if session_exists; then
        echo "Relaunch requested: killing only session '$SESSION_NAME' on $TMUX_SOCKET"
        run_tmux kill-session -t "$TMUX_TARGET"
    fi
fi

if session_exists; then
    echo "Found existing session '$SESSION_NAME'; checking liveness..."
    if ! session_health_ok; then
        print_recovery
        exit 1
    fi
else
    echo "Creating $KIND Warp mesh peer '$SESSION_NAME' on $TMUX_SOCKET..."
    launch_peer
fi

echo "Attaching Warp pane to '$SESSION_NAME' on $TMUX_SOCKET..."
exec tmux -S "$TMUX_SOCKET" attach-session -t "$TMUX_TARGET"
