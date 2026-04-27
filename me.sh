#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_DIR="$REPO_ROOT/scripts"
DNA_DIR="$REPO_ROOT/interlateral_dna"

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

CLAUDE_SESSION="${CC_TMUX_SESSION:-$CC_SESSION}"
CODEX_SESSION="${CODEX_TMUX_SESSION:-$CODEX_SESSION}"
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-opus-4-7}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.5}"
READY_PHRASE="${READY_PHRASE:-Reporting for Duty!}"
INTERLATERAL_TEAM_ID="${INTERLATERAL_TEAM_ID:-agents}"
LAUNCH_SESSION_ID="${INTERLATERAL_SESSION_ID:-session_$(date +%s)}"
export TMUX_SOCKET INTERLATERAL_TEAM_ID

CLAUDE_LOG="$DNA_DIR/claude_telemetry.log"
CODEX_LOG="$DNA_DIR/codex_telemetry.log"

usage() {
    cat <<'EOF'
Usage:
  ./me.sh [--force]

Environment overrides:
  CLAUDE_MODEL       Default: claude-opus-4-7
  CODEX_MODEL        Default: gpt-5.5
  CLAUDE_ARGS        Default: --dangerously-skip-permissions --model "$CLAUDE_MODEL"
  CODEX_ARGS         Default: --no-alt-screen -m "$CODEX_MODEL" --dangerously-bypass-approvals-and-sandbox -C "$REPO_ROOT"
  READY_PHRASE       Default: Reporting for Duty!

This launches only the standard two-agent CLI mesh: ia-claude and ia-codex.
The bootstrap operator that runs this script is not part of the mesh.
EOF
}

shell_quote() {
    local quoted
    printf -v quoted '%q' "$1"
    printf '%s' "$quoted"
}

need_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

print_version() {
    local cmd="$1"
    local version
    version="$("$cmd" --version 2>&1 | head -n 1 || true)"
    [[ -n "$version" ]] && echo "  $cmd: $version" || echo "  $cmd: installed"
}

warn_if_help_missing() {
    local cmd="$1"
    local flag="$2"
    if ! "$cmd" --help 2>&1 | grep -q -- "$flag"; then
        echo "Warning: '$cmd --help' did not show expected flag '$flag'. The command will still be printed before launch." >&2
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

wait_for_ready_signal() {
    local session="$1"
    local tries="${2:-60}"
    local i
    for i in $(seq 1 "$tries"); do
        if run_tmux capture-pane -t "$session" -p | grep -Fxq "$READY_PHRASE"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi
if [[ $# -gt 1 || ( $# -eq 1 && "${1:-}" != "--force" ) ]]; then
    usage >&2
    exit 1
fi

need_cmd tmux
need_cmd node
need_cmd codex
need_cmd claude

warn_if_help_missing claude "--model"
warn_if_help_missing codex "--dangerously-bypass-approvals-and-sandbox"

CLAUDE_MODEL_Q="$(shell_quote "$CLAUDE_MODEL")"
CODEX_MODEL_Q="$(shell_quote "$CODEX_MODEL")"
REPO_ROOT_Q="$(shell_quote "$REPO_ROOT")"
TMUX_SOCKET_Q="$(shell_quote "$TMUX_SOCKET")"
TEAM_ID_Q="$(shell_quote "$INTERLATERAL_TEAM_ID")"
CLAUDE_SESSION_Q="$(shell_quote "$CLAUDE_SESSION")"
CODEX_SESSION_Q="$(shell_quote "$CODEX_SESSION")"
CLAUDE_LAUNCH_ID_Q="$(shell_quote "${LAUNCH_SESSION_ID}_claude")"
CODEX_LAUNCH_ID_Q="$(shell_quote "${LAUNCH_SESSION_ID}_codex")"

CLAUDE_ARGS="${CLAUDE_ARGS:---dangerously-skip-permissions --model $CLAUDE_MODEL_Q}"
CODEX_ARGS="${CODEX_ARGS:---no-alt-screen -m $CODEX_MODEL_Q --dangerously-bypass-approvals-and-sandbox -C $REPO_ROOT_Q}"

CLAUDE_PROMPT="Read CLAUDE.md in this repo for your operating instructions. Do not explore yet. First send Codex exactly \"ACK from Claude. Can you hear me?\" using node interlateral_dna/codex.js send \"ACK from Claude. Can you hear me?\", then wait for Codex ACK, then print exactly $READY_PHRASE, then stop and wait for Dazza's assignment."
CODEX_PROMPT="Read AGENTS.md in this repo for your operating instructions. Do not explore yet. Wait for a direct message in this Codex pane from Claude containing \"ACK from Claude. Can you hear me?\". Use interlateral_dna/comms.md only as the audit ledger, not as the wake-up trigger. Do not treat that phrase inside this boot prompt as the signal. When the direct Claude message arrives, reply exactly using node interlateral_dna/cc.js send \"ACK from Codex. I can hear you.\", then print exactly $READY_PHRASE, then stop and wait for Dazza's assignment."

CLAUDE_LAUNCH_CMD="cd $REPO_ROOT_Q && export TMUX_SOCKET=$TMUX_SOCKET_Q INTERLATERAL_TMUX_SOCKET=$TMUX_SOCKET_Q INTERLATERAL_TEAM_ID=$TEAM_ID_Q INTERLATERAL_SENDER='claude' INTERLATERAL_AGENT_TYPE='claude' INTERLATERAL_SESSION_ID=$CLAUDE_LAUNCH_ID_Q CC_TMUX_SESSION=$CLAUDE_SESSION_Q CODEX_TMUX_SESSION=$CODEX_SESSION_Q && claude $CLAUDE_ARGS"
CODEX_LAUNCH_CMD="cd $REPO_ROOT_Q && export TMUX_SOCKET=$TMUX_SOCKET_Q INTERLATERAL_TMUX_SOCKET=$TMUX_SOCKET_Q INTERLATERAL_TEAM_ID=$TEAM_ID_Q INTERLATERAL_SENDER='codex' INTERLATERAL_AGENT_TYPE='codex' INTERLATERAL_SESSION_ID=$CODEX_LAUNCH_ID_Q CC_TMUX_SESSION=$CLAUDE_SESSION_Q CODEX_TMUX_SESSION=$CODEX_SESSION_Q && codex $CODEX_ARGS"

echo "Preflight complete."
echo "Detected CLI versions:"
print_version claude
print_version codex
echo
echo "Standard mesh duo:"
echo "  Claude session: $CLAUDE_SESSION (model: $CLAUDE_MODEL)"
echo "  Codex session: $CODEX_SESSION (model: $CODEX_MODEL)"
echo "  Socket: $TMUX_SOCKET"
echo "  Ready phrase: $READY_PHRASE"
echo
echo "Launch commands that will be sent:"
echo "  $CLAUDE_LAUNCH_CMD"
echo "  $CODEX_LAUNCH_CMD"
echo

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
Claude model: $CLAUDE_MODEL
Codex session: $CODEX_SESSION
Codex model: $CODEX_MODEL
Launch session id: $LAUNCH_SESSION_ID
Ready phrase: $READY_PHRASE
EOF

kill_if_exists "$CLAUDE_SESSION"
kill_if_exists "$CODEX_SESSION"

run_tmux new-session -d -s "$CLAUDE_SESSION" -c "$REPO_ROOT"
run_tmux new-session -d -s "$CODEX_SESSION" -c "$REPO_ROOT"

: > "$CLAUDE_LOG"
: > "$CODEX_LOG"
run_tmux pipe-pane -t "$CLAUDE_SESSION" "cat >> '$CLAUDE_LOG'"
run_tmux pipe-pane -t "$CODEX_SESSION" "cat >> '$CODEX_LOG'"

run_tmux send-keys -t "$CODEX_SESSION" "$CODEX_LAUNCH_CMD" Enter
run_tmux send-keys -t "$CLAUDE_SESSION" "$CLAUDE_LAUNCH_CMD" Enter

"$SCRIPT_DIR/open-tmux-window.sh" "$CLAUDE_SESSION" "Interlateral Claude" >/dev/null 2>&1 || true
"$SCRIPT_DIR/open-tmux-window.sh" "$CODEX_SESSION" "Interlateral Codex" >/dev/null 2>&1 || true

echo "Waiting for agent CLIs to attach..."
wait_for_ready "$CLAUDE_SESSION" 45 || echo "Warning: Claude session did not report ready before prompt injection"
wait_for_ready "$CODEX_SESSION" 45 || echo "Warning: Codex session did not report ready before prompt injection"

echo "Waiting for Codex idle prompt..."
if wait_for_idle "$CODEX_SESSION" 30; then
    echo "Codex prompt detected, injecting boot context..."
    agent_send_long "$CODEX_SESSION" "$CODEX_PROMPT" "codex_boot_${LAUNCH_SESSION_ID}_$$"
else
    echo "Warning: Codex prompt not detected, attempting injection anyway..."
    agent_send_long "$CODEX_SESSION" "$CODEX_PROMPT" "codex_boot_${LAUNCH_SESSION_ID}_$$"
fi

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
echo "Waiting for $READY_PHRASE confirmations..."

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
