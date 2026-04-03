# Troubleshooting

## tmux copy or paste issues

- Make sure you are not already inside another tmux session when launching peers.
- Re-source the shared config with `source scripts/tmux-config.sh`.
- If prompt paste looks stuck, prefer the provided helpers over raw `tmux send-keys`.

## Agent does not respond

- Check the shared socket: `tmux -S /tmp/interlateral-agents-tmux.sock list-sessions`
- Confirm the target pane is running the agent CLI, not an idle shell.
- Re-send with the control script in `interlateral_dna/`.

## Claude or Codex handshake fails

- Run `./scripts/shutdown.sh`
- Start fresh with `./me.sh`
- Inspect recent pane output with the helpers in `scripts/tmux-config.sh`

## Gemini prompt does not submit

- Gemini requires a 1-second delay before `Enter`.
- Use `node interlateral_dna/gemini.js send ...` or `scripts/launch-gemini-peer.sh`.

## Idle detection takes too long

- Confirm the session exists on the shared socket.
- Increase patience and inspect the terminal buffer.
- Review `interlateral_dna/leadership.json` only if you are intentionally changing timeout behavior.
