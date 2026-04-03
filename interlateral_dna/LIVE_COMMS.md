# LIVE COMMS: Interlateral Agents v0.1

This is the canonical reference for direct comms in the starter-scope repo. v0.1 is CLI-first and tmux-first: Claude Code, Codex, and Gemini CLI all communicate by injecting directly into each other's tmux panes.

## Golden Rule

Never rely on `comms.md` alone. `comms.md` is the ledger, not the messenger.

Every meaningful handoff should do both:

1. Send directly with `node interlateral_dna/*.js send "message"`
2. Let the control script append the stamped message to `interlateral_dna/comms.md`

## Current Sessions

- Claude Code: `ia-claude`
- Codex: `ia-codex`
- Gemini CLI: `ia-gemini`
- Shared tmux socket: `/tmp/interlateral-agents-tmux.sock`

These values are defined in `scripts/tmux-config.sh`.

## Send Matrix

| Sender | Claude | Codex | Gemini |
|---|---|---|---|
| Claude | self | `node interlateral_dna/codex.js send "msg"` | `node interlateral_dna/gemini.js send "msg"` |
| Codex | `node interlateral_dna/cc.js send "msg"` | self | `node interlateral_dna/gemini.js send "msg"` |
| Gemini | `node interlateral_dna/cc.js send "msg"` | `node interlateral_dna/codex.js send "msg"` | self |

## Why The Control Scripts Matter

Do not use raw `tmux send-keys` for agent-to-agent messages. Claude, Codex, and Gemini all need a short delay between text injection and `Enter`, otherwise messages can remain stuck in the input buffer.

Use:

```bash
node interlateral_dna/cc.js send "message"
node interlateral_dna/codex.js send "message"
node interlateral_dna/gemini.js send "message"
```

## Observation

For quick observation, use tmux capture on the shared socket:

```bash
source scripts/tmux-config.sh
agent_capture_deep "$CC_SESSION" 120
agent_capture_deep "$CODEX_SESSION" 120
agent_capture_deep "$GEMINI_SESSION" 120
```

`node interlateral_dna/gemini.js read` is also available when Gemini is running.

## Identity Stamping

Identity stamping is on by default. Messages are prefixed with a stable header:

```text
[ID team=agents sender=codex agent_type=codex host=... sid=...]
```

This lets a shared `comms.md` remain readable when multiple peers are active at once.

## Troubleshooting

If a peer does not respond:

1. Check that the target session exists on the shared socket.
2. Confirm the pane is running the agent CLI, not an idle shell.
3. Re-send via the control script instead of raw tmux.

If a launcher helper creates a new peer, it should join the same socket and use the same control scripts. There is no courier fallback in v0.1.
