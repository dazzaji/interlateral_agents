#!/bin/bash

# Restrict tmux socket permissions to owner-only (single-user dev assumption)
umask 077

export INTERLATERAL_TMUX_SOCKET="${INTERLATERAL_TMUX_SOCKET:-/tmp/interlateral-agents-tmux.sock}"
export TMUX_SOCKET="${TMUX_SOCKET:-$INTERLATERAL_TMUX_SOCKET}"
export CC_SESSION="${CC_SESSION:-ia-claude}"
export CODEX_SESSION="${CODEX_SESSION:-ia-codex}"
export GEMINI_SESSION="${GEMINI_SESSION:-ia-gemini}"

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

pane_idle() {
    local session="${1:?session name required}"
    local output
    output="$(agent_capture_recent "$session" 30 2>/dev/null || true)"
    echo "$output" | grep -Eq "❯|›|> $"
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

export -f run_tmux 2>/dev/null || true
export -f agent_send 2>/dev/null || true
export -f codex_send_clean 2>/dev/null || true
export -f agent_send_long 2>/dev/null || true
export -f agent_send_long_delayed 2>/dev/null || true
export -f agent_capture_recent 2>/dev/null || true
export -f agent_capture_deep 2>/dev/null || true
export -f pane_idle 2>/dev/null || true
export -f wait_for_idle 2>/dev/null || true
export -f next_peer_session_name 2>/dev/null || true
