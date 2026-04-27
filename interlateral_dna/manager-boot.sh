#!/bin/bash
# Boot ia-manager session on the shared tmux socket
set -euo pipefail
REPO=/Users/dazzagreenwood/Documents/GitHub/interlateral_agents
SOCK=/tmp/interlateral-agents-tmux.sock
SID="session_manager_$(date +%s)"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.5}"

printf -v REPO_Q '%q' "$REPO"
printf -v SOCK_Q '%q' "$SOCK"
printf -v CODEX_MODEL_Q '%q' "$CODEX_MODEL"

tmux -S "$SOCK" new-session -d -s ia-manager -c "$REPO"

tmux -S "$SOCK" send-keys -t ia-manager \
  "export TMUX_SOCKET=$SOCK_Q INTERLATERAL_TMUX_SOCKET=$SOCK_Q INTERLATERAL_TEAM_ID=agents INTERLATERAL_SENDER=manager INTERLATERAL_AGENT_TYPE=codex INTERLATERAL_SESSION_ID=$SID CC_TMUX_SESSION=ia-claude CODEX_TMUX_SESSION=ia-codex && cd $REPO_Q && codex --no-alt-screen -m $CODEX_MODEL_Q --dangerously-bypass-approvals-and-sandbox -C $REPO_Q" Enter

sleep 18

source "$REPO/scripts/tmux-config.sh"
agent_send "ia-manager" "$(cat "$REPO/interlateral_dna/manager-prompt.md")"

echo "ia-manager launched. Attach with:"
echo "  tmux -S $SOCK attach -t ia-manager"
