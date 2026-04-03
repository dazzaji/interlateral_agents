#!/bin/bash
# Open a new Terminal.app window attached to a tmux session on the configured socket.

set -euo pipefail

SESSION_NAME="${1:?Usage: $0 <session-name> [window-title]}"
WINDOW_TITLE="${2:-$SESSION_NAME}"
TMUX_SOCKET="${TMUX_SOCKET:-/tmp/interlateral-agents-tmux.sock}"

if ! tmux -S "$TMUX_SOCKET" has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Error: tmux session '$SESSION_NAME' does not exist on $TMUX_SOCKET"
    exit 1
fi

WRAPPER="/tmp/attach-${SESSION_NAME}.command"

cat > "$WRAPPER" <<EOF
#!/bin/bash
printf "\033]0;%s\007" "$WINDOW_TITLE"
echo "Attaching to session: $SESSION_NAME"
TMUX_SOCKET="$TMUX_SOCKET"
if command -v tmux >/dev/null 2>&1; then
    exec tmux -S "\$TMUX_SOCKET" attach-session -t "$SESSION_NAME"
else
    echo "tmux not found"
    read -r -p "Press enter to close"
fi
EOF

chmod +x "$WRAPPER"
open "$WRAPPER"
