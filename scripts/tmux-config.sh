#!/bin/bash

# Restrict tmux socket permissions to owner-only (single-user dev assumption)
umask 077

export INTERLATERAL_TMUX_SOCKET="${INTERLATERAL_TMUX_SOCKET:-/tmp/interlateral-agents-tmux.sock}"
export TMUX_SOCKET="${TMUX_SOCKET:-$INTERLATERAL_TMUX_SOCKET}"
export CC_SESSION="${CC_SESSION:-ia-claude}"
export CODEX_SESSION="${CODEX_SESSION:-ia-codex}"
export GEMINI_SESSION="${GEMINI_SESSION:-ia-gemini}"

if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
    TMUX_CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    export INTERLATERAL_AGENTS_REPO="${INTERLATERAL_AGENTS_REPO:-$(cd "$TMUX_CONFIG_DIR/.." && pwd)}"
else
    export INTERLATERAL_AGENTS_REPO="${INTERLATERAL_AGENTS_REPO:-$(pwd)}"
fi
export INTERLATERAL_COMMS_LOG="${INTERLATERAL_COMMS_LOG:-$INTERLATERAL_AGENTS_REPO/interlateral_dna/comms.md}"

run_tmux() {
    tmux -S "$TMUX_SOCKET" "$@"
}

agent_send() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    run_tmux send-keys -t "$session" -l "$prompt"
    sleep 0.3
    run_tmux send-keys -t "$session" Escape
    sleep 0.1
    run_tmux send-keys -t "$session" Enter
}

codex_send_clean() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    run_tmux send-keys -t "$session" Escape
    sleep 0.3
    run_tmux send-keys -t "$session" -l "$prompt"
    sleep 0.3
    run_tmux send-keys -t "$session" Escape
    sleep 0.1
    run_tmux send-keys -t "$session" Enter
}

agent_send_long() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    local buffer="${3:-agent_send_long_$$}"
    run_tmux send-keys -t "$session" Escape
    sleep 0.3
    printf '%s' "$prompt" | run_tmux load-buffer -b "$buffer" -
    run_tmux paste-buffer -t "$session" -b "$buffer"
    run_tmux delete-buffer -b "$buffer" 2>/dev/null || true
    sleep 0.3
    run_tmux send-keys -t "$session" Escape
    sleep 0.1
    run_tmux send-keys -t "$session" Enter
}

agent_send_long_delayed() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    local delay="${3:-0.3}"
    local buffer="${4:-agent_send_long_delayed_$$}"
    run_tmux send-keys -t "$session" Escape
    sleep 0.3
    printf '%s' "$prompt" | run_tmux load-buffer -b "$buffer" -
    run_tmux paste-buffer -t "$session" -b "$buffer"
    run_tmux delete-buffer -b "$buffer" 2>/dev/null || true
    sleep "$delay"
    run_tmux send-keys -t "$session" Escape
    sleep 0.1
    run_tmux send-keys -t "$session" Enter
}

claude_send() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    run_tmux send-keys -t "$session" -l "$prompt"
    sleep 0.2
    run_tmux send-keys -t "$session" C-m
}

claude_send_long() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    local buffer="${3:-claude_send_long_$$}"
    printf '%s' "$prompt" | run_tmux load-buffer -b "$buffer" -
    run_tmux paste-buffer -t "$session" -b "$buffer"
    run_tmux delete-buffer -b "$buffer" 2>/dev/null || true
    sleep 0.3
    run_tmux send-keys -t "$session" C-m
}

agent_log_ledger() {
    local target_session="${1:?target session required}"
    local message="${2:?message required}"
    local timestamp
    local host
    timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    host="$(hostname -s 2>/dev/null || hostname 2>/dev/null || echo unknown)"
    mkdir -p "$(dirname "$INTERLATERAL_COMMS_LOG")"
    {
        printf '\n## %s\n' "$timestamp"
        printf '[ID team=%s sender=%s agent_type=%s host=%s sid=%s target=%s]\n' \
            "${INTERLATERAL_TEAM_ID:-agents}" \
            "${INTERLATERAL_SENDER:-operator}" \
            "${INTERLATERAL_AGENT_TYPE:-shell}" \
            "$host" \
            "${INTERLATERAL_SESSION_ID:-manual_$$}" \
            "$target_session"
        printf '%s\n' "$message"
    } >> "$INTERLATERAL_COMMS_LOG"
}

agent_send_logged() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    agent_send "$session" "$prompt"
    agent_log_ledger "$session" "$prompt"
}

agent_send_long_logged() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    local buffer="${3:-agent_send_long_logged_$$}"
    agent_send_long "$session" "$prompt" "$buffer"
    agent_log_ledger "$session" "$prompt"
}

claude_send_logged() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    claude_send "$session" "$prompt"
    agent_log_ledger "$session" "$prompt"
}

claude_send_long_logged() {
    local session="${1:?session name required}"
    local prompt="${2:?prompt required}"
    local buffer="${3:-claude_send_long_logged_$$}"
    claude_send_long "$session" "$prompt" "$buffer"
    agent_log_ledger "$session" "$prompt"
}

agent_capture_recent() {
    local session="${1:?session name required}"
    local lines="${2:-120}"
    run_tmux capture-pane -t "$session" -p | tail -n "$lines"
}

agent_capture_deep() {
    local session="${1:?session name required}"
    local lines="${2:-200}"
    run_tmux capture-pane -t "$session" -p -S "-$lines"
}

pane_contains() {
    local session="${1:?session name required}"
    local needle="${2:?needle required}"
    run_tmux capture-pane -t "$session" -p | grep -Fq "$needle"
}

pane_current_command() {
    local session="${1:?session name required}"
    run_tmux display-message -p -F '#{pane_current_command}' -t "$session" 2>/dev/null || true
}

pane_seems_cli() {
    local session="${1:?session name required}"
    local cmd
    cmd="$(pane_current_command "$session")"
    [[ "$cmd" =~ ^(claude|codex|gemini|node|[0-9]+\.[0-9]+\.[0-9]+)$ ]]
}

pane_idle() {
    local session="${1:?session name required}"
    local output
    if ! pane_seems_cli "$session"; then
        return 1
    fi
    output="$(agent_capture_recent "$session" 30 2>/dev/null || true)"
    if echo "$output" | grep -Eqi "Working \\(|esc to interrupt|Starting MCP|MCP startup|Running tool|Applying patch"; then
        return 1
    fi
    if echo "$output" | grep -Eq "❯|›|> $|Type your message"; then
        if echo "$output" | grep -Eq "⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏"; then
            return 1
        fi
        return 0
    fi
    return 1
}

wait_for_idle() {
    local session="${1:?session name required}"
    local tries="${2:-60}"
    local i
    for i in $(seq 1 "$tries"); do
        if pane_idle "$session"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

claude_needs_workspace_trust() {
    local session="${1:?session name required}"
    pane_contains "$session" "Quick safety check:"
}

confirm_claude_workspace_trust() {
    local session="${1:?session name required}"
    run_tmux send-keys -t "$session" Enter
}

prepare_claude_for_boot() {
    local session="${1:?session name required}"
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

next_peer_session_name() {
    local prefix="${1:?prefix required}"
    local highest="0"
    local name
    while IFS= read -r name; do
        [[ "$name" =~ ^${prefix}-([0-9]{2})$ ]] || continue
        if (( 10#${BASH_REMATCH[1]} > 10#$highest )); then
            highest="${BASH_REMATCH[1]}"
        fi
    done < <(run_tmux list-sessions -F '#S' 2>/dev/null || true)
    printf '%s-%02d\n' "$prefix" "$((10#$highest + 1))"
}

if [[ -n "${BASH_VERSION:-}" ]]; then
    export -f run_tmux 2>/dev/null || true
    export -f agent_send 2>/dev/null || true
    export -f codex_send_clean 2>/dev/null || true
    export -f agent_send_long 2>/dev/null || true
    export -f agent_send_long_delayed 2>/dev/null || true
    export -f claude_send 2>/dev/null || true
    export -f claude_send_long 2>/dev/null || true
    export -f agent_log_ledger 2>/dev/null || true
    export -f agent_send_logged 2>/dev/null || true
    export -f agent_send_long_logged 2>/dev/null || true
    export -f claude_send_logged 2>/dev/null || true
    export -f claude_send_long_logged 2>/dev/null || true
    export -f agent_capture_recent 2>/dev/null || true
    export -f agent_capture_deep 2>/dev/null || true
    export -f pane_contains 2>/dev/null || true
    export -f pane_current_command 2>/dev/null || true
    export -f pane_seems_cli 2>/dev/null || true
    export -f pane_idle 2>/dev/null || true
    export -f wait_for_idle 2>/dev/null || true
    export -f claude_needs_workspace_trust 2>/dev/null || true
    export -f confirm_claude_workspace_trust 2>/dev/null || true
    export -f prepare_claude_for_boot 2>/dev/null || true
    export -f next_peer_session_name 2>/dev/null || true
fi
