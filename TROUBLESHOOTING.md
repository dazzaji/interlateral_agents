# Troubleshooting

## tmux copy or paste issues

- Make sure you are not already inside another tmux session when launching peers.
- Re-source the shared config with `source scripts/tmux-config.sh`.
- If prompt paste looks stuck, prefer the provided helpers over raw `tmux send-keys`.

## Agent does not respond

- Check the shared socket: `tmux -S /tmp/interlateral-agents-tmux.sock list-sessions`
- Confirm the target pane is running the agent CLI, not an idle shell.
- Re-send with the control script in `interlateral_dna/`.
- Remember that Gemini and Antigravity peers are opt-in. If `me.sh` or `init`
  started the session, only `ia-claude` and `ia-codex` are expected by default.

## Claude or Codex handshake fails

- Run `./scripts/shutdown.sh`
- Start fresh with `./me.sh`
- Inspect recent pane output with the helpers in `scripts/tmux-config.sh`

## Gemini prompt does not submit

- Gemini requires a 1-second delay before `Enter`.
- Use `node interlateral_dna/gemini.js send ...` or `scripts/launch-gemini-peer.sh`.
- Do not add Gemini to a routine workflow just because the helper exists; use it
  only when the task explicitly selects Gemini.

## Antigravity CLI refuses a send

- `node interlateral_dna/agy.js send ...` fails closed unless an `agy` process
  owns the pane foreground and the TUI looks ready.
- Check `node interlateral_dna/agy.js status`; `ready: true` is the canonical
  acceptance field.
- Relaunch with `scripts/launch-agy-peer.sh` if the pane fell back to a shell.
- Antigravity CLI and Desktop are opt-in peers, not part of `me.sh`.

## Idle detection takes too long

- Confirm the session exists on the shared socket.
- Increase patience and inspect the terminal buffer.
- Review `scripts/tmux-config.sh` and the launcher timeouts in `me.sh` if you are intentionally changing timeout behavior.
