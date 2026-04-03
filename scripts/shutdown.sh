#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

if ! run_tmux list-sessions -F '#S' >/tmp/interlateral_agents_shutdown.$$ 2>/dev/null; then
    echo "No tmux sessions running on $TMUX_SOCKET"
    rm -f /tmp/interlateral_agents_shutdown.$$
    exit 0
fi

SESSIONS=()
while IFS= read -r session; do
    SESSIONS+=("$session")
done < /tmp/interlateral_agents_shutdown.$$
rm -f /tmp/interlateral_agents_shutdown.$$

if [[ "${#SESSIONS[@]}" -eq 0 ]]; then
    echo "No tmux sessions running on $TMUX_SOCKET"
    exit 0
fi

for session in "${SESSIONS[@]}"; do
    run_tmux kill-session -t "$session" 2>/dev/null || true
    echo "Stopped: $session"
done

run_tmux kill-server 2>/dev/null || true
echo "Shutdown complete for $TMUX_SOCKET"
