#!/bin/bash
# Boot ia-manager session on the shared tmux socket
set -euo pipefail
REPO=/Users/dazzagreenwood/Documents/GitHub/interlateral_agents
SOCK=/tmp/interlateral-agents-tmux.sock
SID="session_manager_$(date +%s)"

tmux -S "$SOCK" new-session -d -s ia-manager -c "$REPO"

tmux -S "$SOCK" send-keys -t ia-manager \
  "export TMUX_SOCKET=$SOCK INTERLATERAL_TMUX_SOCKET=$SOCK INTERLATERAL_TEAM_ID=agents INTERLATERAL_SENDER=manager INTERLATERAL_AGENT_TYPE=codex INTERLATERAL_SESSION_ID=$SID CC_TMUX_SESSION=ia-claude CODEX_TMUX_SESSION=ia-codex && cd $REPO && codex -m gpt-5.4 --yolo" Enter

sleep 18

source "$REPO/scripts/tmux-config.sh"
agent_send "ia-manager" "$(cat "$REPO/interlateral_dna/manager-prompt.md")"

echo "ia-manager launched. Attach with:"
echo "  tmux -S $SOCK attach -t ia-manager"
