#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_DIR="$REPO_ROOT/scripts"
DNA_DIR="$REPO_ROOT/interlateral_dna"

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

CLAUDE_SESSION="${CC_TMUX_SESSION:-$CC_SESSION}"
CODEX_SESSION="${CODEX_TMUX_SESSION:-$CODEX_SESSION}"
CLAUDE_ARGS="${CLAUDE_ARGS:---dangerously-skip-permissions}"
CODEX_ARGS="${CODEX_ARGS:--m gpt-5.4 --yolo}"
INTERLATERAL_TEAM_ID="${INTERLATERAL_TEAM_ID:-agents}"
LAUNCH_SESSION_ID="${INTERLATERAL_SESSION_ID:-session_$(date +%s)}"
export TMUX_SOCKET INTERLATERAL_TEAM_ID

CLAUDE_LOG="$DNA_DIR/claude_telemetry.log"
CODEX_LOG="$DNA_DIR/codex_telemetry.log"

need_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1"
        exit 1
    fi
}

kill_if_exists() {
    local session="$1"
    if run_tmux has-session -t "$session" 2>/dev/null; then
        run_tmux kill-session -t "$session" 2>/dev/null || true
    fi
}

pane_ready() {
    local session="$1"
    local cmd
    cmd="$(run_tmux display-message -p -F "#{pane_current_command}" -t "$session" 2>/dev/null || true)"
    case "$cmd" in
        bash|zsh|sh|fish|"") return 1 ;;
        *) return 0 ;;
    esac
}

wait_for_ready() {
    local session="$1"
    local tries="${2:-60}"
    local i
    for i in $(seq 1 "$tries"); do
        if pane_ready "$session"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

wait_for_phrase() {
    local session="$1"
    local phrase="$2"
    local tries="${3:-60}"
    local i
    for i in $(seq 1 "$tries"); do
        if run_tmux capture-pane -t "$session" -p | grep -Fq "$phrase"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

pane_contains() {
    local session="$1"
    local needle="$2"
    run_tmux capture-pane -t "$session" -p | grep -Fq "$needle"
}

wait_for_exact_line() {
    local session="$1"
    local line="$2"
    local tries="${3:-60}"
    local i
    for i in $(seq 1 "$tries"); do
        if run_tmux capture-pane -t "$session" -p | grep -Fxq "$line"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

wait_for_ready_signal() {
    local session="$1"
    local tries="${2:-60}"
    local i
    for i in $(seq 1 "$tries"); do
        if run_tmux capture-pane -t "$session" -p | grep -q 'Ready to Rock!'; then
            return 0
        fi
        sleep 2
    done
    return 1
}

claude_needs_workspace_trust() {
    local session="$1"
    pane_contains "$session" "Quick safety check:"
}

confirm_claude_workspace_trust() {
    local session="$1"
    run_tmux send-keys -t "$session" Enter
}

prepare_claude_for_boot() {
    local session="$1"
    local tries="${2:-45}"
    local i
    for i in $(seq 1 "$tries"); do
        if claude_needs_workspace_trust "$session"; then
            echo "Claude workspace trust prompt detected, confirming..."
            confirm_claude_workspace_trust "$session"
            sleep 2
            continue
        fi
        if wait_for_idle "$session" 1; then
            return 0
        fi
        sleep 2
    done
    return 1
}

quote_file_content() {
    local quoted
    printf -v quoted '%q' "$1"
    printf '%s' "$quoted"
}

need_cmd tmux
need_cmd node
need_cmd codex
need_cmd claude

CLAUDE_PROMPT="Read CLAUDE.md in this repo for your operating instructions. Do not explore yet. First send Codex exactly \"ACK from Claude. Can you hear me?\" using node interlateral_dna/codex.js send \"ACK from Claude. Can you hear me?\", then wait for Codex ACK, then print exactly Ready to Rock!, then stop and wait for Dazza's assignment."
CODEX_PROMPT="Read AGENTS.md in this repo for your operating instructions. Do not explore yet. Watch Claude's terminal for \"ACK from Claude. Can you hear me?\". When you see it, reply exactly using node interlateral_dna/cc.js send \"ACK from Codex. I can hear you.\", then print exactly Ready to Rock!, then stop and wait for Dazza's assignment."

CODEX_BOOT_QUOTED="$(quote_file_content "$CODEX_PROMPT")"

if [[ "${1:-}" != "--force" ]]; then
    ATTACHED=""
    if run_tmux has-session -t "$CLAUDE_SESSION" 2>/dev/null; then
        CLIENTS="$(run_tmux list-clients -t "$CLAUDE_SESSION" -F '#{client_name}' 2>/dev/null || true)"
        [[ -n "$CLIENTS" ]] && ATTACHED="$ATTACHED $CLAUDE_SESSION"
    fi
    if run_tmux has-session -t "$CODEX_SESSION" 2>/dev/null; then
        CLIENTS="$(run_tmux list-clients -t "$CODEX_SESSION" -F '#{client_name}' 2>/dev/null || true)"
        [[ -n "$CLIENTS" ]] && ATTACHED="$ATTACHED $CODEX_SESSION"
    fi
    if [[ -n "$ATTACHED" ]]; then
        echo "WARNING: The following sessions have attached terminals:$ATTACHED"
        echo "Killing them will close those terminal windows immediately."
        read -r -p "Continue? (y/N or re-run with --force): " confirm
        [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
    fi
fi

cat > "$DNA_DIR/comms.md" <<EOF
# Comms Log

Session started: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Team: $INTERLATERAL_TEAM_ID
Socket: $TMUX_SOCKET
Claude session: $CLAUDE_SESSION
Codex session: $CODEX_SESSION
Launch session id: $LAUNCH_SESSION_ID
EOF

kill_if_exists "$CLAUDE_SESSION"
kill_if_exists "$CODEX_SESSION"

run_tmux new-session -d -s "$CLAUDE_SESSION" -c "$REPO_ROOT"
run_tmux new-session -d -s "$CODEX_SESSION" -c "$REPO_ROOT"

: > "$CLAUDE_LOG"
: > "$CODEX_LOG"
run_tmux pipe-pane -t "$CLAUDE_SESSION" "cat >> '$CLAUDE_LOG'"
run_tmux pipe-pane -t "$CODEX_SESSION" "cat >> '$CODEX_LOG'"

run_tmux send-keys -t "$CODEX_SESSION" "cd '$REPO_ROOT' && export TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TEAM_ID='$INTERLATERAL_TEAM_ID' INTERLATERAL_SENDER='codex' INTERLATERAL_AGENT_TYPE='codex' INTERLATERAL_SESSION_ID='${LAUNCH_SESSION_ID}_codex' CC_TMUX_SESSION='$CLAUDE_SESSION' CODEX_TMUX_SESSION='$CODEX_SESSION' && codex $CODEX_ARGS $CODEX_BOOT_QUOTED" Enter
run_tmux send-keys -t "$CLAUDE_SESSION" "cd '$REPO_ROOT' && export TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TEAM_ID='$INTERLATERAL_TEAM_ID' INTERLATERAL_SENDER='claude' INTERLATERAL_AGENT_TYPE='claude' INTERLATERAL_SESSION_ID='${LAUNCH_SESSION_ID}_claude' CC_TMUX_SESSION='$CLAUDE_SESSION' CODEX_TMUX_SESSION='$CODEX_SESSION' && claude $CLAUDE_ARGS" Enter

"$SCRIPT_DIR/open-tmux-window.sh" "$CLAUDE_SESSION" "Interlateral Claude" >/dev/null 2>&1 || true
"$SCRIPT_DIR/open-tmux-window.sh" "$CODEX_SESSION" "Interlateral Codex" >/dev/null 2>&1 || true

echo "Waiting for agent CLIs to attach..."
wait_for_ready "$CLAUDE_SESSION" 45 || echo "Warning: Claude session did not report ready before prompt injection"
wait_for_ready "$CODEX_SESSION" 45 || echo "Warning: Codex session did not report ready before prompt injection"
echo "Waiting for Claude idle prompt..."
if prepare_claude_for_boot "$CLAUDE_SESSION" 30; then
    echo "Claude prompt detected, injecting boot context..."
    agent_send "$CLAUDE_SESSION" "$CLAUDE_PROMPT"
else
    echo "Warning: Claude prompt not detected, attempting injection anyway..."
    agent_send "$CLAUDE_SESSION" "$CLAUDE_PROMPT"
fi

echo
echo "Dual-agent launcher started"
echo "Socket: $TMUX_SOCKET"
echo "Claude session: $CLAUDE_SESSION"
echo "Codex session: $CODEX_SESSION"
echo
echo "Waiting for Ready to Rock! confirmations..."

CLAUDE_READY=0
CODEX_READY=0
if wait_for_ready_signal "$CLAUDE_SESSION" 45; then
    CLAUDE_READY=1
fi
if wait_for_ready_signal "$CODEX_SESSION" 45; then
    CODEX_READY=1
fi

echo "Claude Ready: $CLAUDE_READY"
echo "Codex Ready: $CODEX_READY"
echo
echo "Attach manually if needed:"
echo "  tmux -S '$TMUX_SOCKET' attach -t '$CLAUDE_SESSION'"
echo "  tmux -S '$TMUX_SOCKET' attach -t '$CODEX_SESSION'"
