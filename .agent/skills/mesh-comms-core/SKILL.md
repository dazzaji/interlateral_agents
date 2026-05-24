---
name: mesh-comms-core
description: "Operate or troubleshoot Interlateral CLI mesh transport: tmux socket discovery, direct-send helpers, comms.md ledger, identity stamping, idle checks, ACK proof, and safe prompt injection. This is comms mechanics only, not a collaboration workflow."
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: CLI agents on the Interlateral tmux socket.
---

# Mesh Comms Core

## Purpose

Use this skill before any collaboration pattern that depends on live peer communication.

It covers transport mechanics only:
- tmux socket and session discovery
- direct prompt delivery
- `comms.md` ledger mirroring
- identity stamping
- safe TUI submission
- two-way ACK proof

It does not assign roles, choose sprint process, onboard desktop peers, or define review/breaker/verifier workflows.

Sprint-specific evidence regimes, gate tables, and approval policies belong in sprint specs or templates, not in this transport skill.

Default peer policy: the normal mesh is Claude Code + Codex. Gemini CLI,
Antigravity CLI, and Antigravity Desktop helpers are documented here only so
operators can use them after an explicit opt-in decision. Do not treat helper
availability as permission to recruit those peers.

## Desktop Boundary

Use this skill for CLI mesh transport. If Claude Desktop or Codex Desktop needs to join the mesh, switch to `desktop-mesh-peer` at `.agent/skills/desktop-mesh-peer/SKILL.md`.

Desktop agents are manually joined peers. They need their own tmux inbox session, stable identity, direct ACK, and ledger mirror. Do not treat `comms.md` polling as a desktop join path.

## Always In The Path

Every agent handoff depends on these rules. Keep them in the active path whenever agents are coordinating:

1. Direct-send wakes the peer; `comms.md` records the event.
2. Never rely on `comms.md` alone as a wake-up mechanism.
3. Pane text alone does not count. A message drafted in a terminal has not been delivered until it is submitted through a live path and, when available, mirrored to the ledger.
4. Use the shared socket every time: `/tmp/interlateral-agents-tmux.sock`.
5. Use repo helpers before raw `tmux send-keys`.
6. Use the target-specific helper when one exists; current Claude Code uses `claude_send*_logged`, while Codex and explicitly selected Gemini peers continue to use the generic helpers.
7. For Codex, never send `C-c` to clear input; it can kill the CLI.
8. Prove new or uncertain comms with a nonce ACK.
9. Check idle before follow-up prompts so text is not injected into a busy agent.

Primary in-repo transport reference:

```text
interlateral_dna/LIVE_COMMS.md
```

Desktop peers use the in-repo `desktop-mesh-peer` skill. This skill is the self-contained CLI transport reference for the agents repo.

## Constants

```bash
AGENTS_REPO="${INTERLATERAL_AGENTS_REPO:-$PWD}"
SOCKET=/tmp/interlateral-agents-tmux.sock
COMMS=interlateral_dna/comms.md
```

House sessions:
- Claude Code: `ia-claude`
- Codex: `ia-codex`
- Optional Gemini base: `ia-gemini`
- Optional Antigravity CLI: `ia-agy`

## CLI Comms Quick Path

Standard peer sends:

```bash
node interlateral_dna/cc.js send "message to Claude"
node interlateral_dna/codex.js send "message to Codex"
node interlateral_dna/gemini.js send "message to Gemini"               # opt-in only
node interlateral_dna/agy.js send "message to the Antigravity CLI peer" # opt-in only
```

The Antigravity CLI peer (`ia-agy`) joins via the `agy-cli-peer` skill. Its TUI
submits on a plain `Enter`, so `agy.js` does not use the Codex Escape-then-Enter
pattern.

Arbitrary session sends:

```bash
source scripts/tmux-config.sh
agent_send_logged ia-codex-peer-01 "Short prompt to Codex"
claude_send_long_logged ia-claude-peer-01 "Long or multiline prompt to Claude"
```

The `_logged` helpers both inject into the tmux pane and append a stamped audit entry to `interlateral_dna/comms.md`.

## Preflight

```bash
cd "$AGENTS_REPO"
source scripts/tmux-config.sh
tmux -S "$TMUX_SOCKET" list-sessions
```

Confirm the target session exists and is running an agent CLI:

```bash
pane_current_command ia-codex
agent_capture_recent ia-codex 40
```

## Send Helpers

From any mesh peer:

```bash
node interlateral_dna/cc.js send "message to Claude"
node interlateral_dna/codex.js send "message to Codex"
node interlateral_dna/gemini.js send "message to Gemini"               # opt-in only
node interlateral_dna/agy.js send "message to the Antigravity CLI peer" # opt-in only
```

For nonstandard sessions, source the helper library and use the logged helpers:

```bash
source scripts/tmux-config.sh
agent_send_logged ia-codex-peer-01 "Short prompt to Codex"
claude_send_logged ia-claude-peer-01 "Short prompt to Claude"
claude_send_long_logged ia-claude-peer-01 "Long prompt to Claude"
```

The generic helpers implement the Escape-then-Enter pattern that remains valid for Codex and Gemini. Current Claude Code 2.1.x needs literal or paste-buffer input followed by `C-m`, so use `claude_send_logged` or `claude_send_long_logged` for nonstandard Claude sessions. The `_logged` variants also append the stamped event to `interlateral_dna/comms.md`.

## ACK Proof

Use a nonce, not a generic hello:

```text
ACK challenge: mesh-ack-YYYYMMDD-HHMMSS. Reply with this nonce and your sender identity.
```

A valid proof has both:
- a visible direct reply in the target pane
- a stamped ledger entry in `interlateral_dna/comms.md`

For fresh, uncertain, desktop-joined, changed, or high-risk transport, the
optional helper `scripts/identity-direct-send-compat.js` can validate captured
receiver and ledger evidence for nonce, sender, session id, and target after a
direct send. It does not send the message, capture the pane, prove the peer is
idle, or prove ongoing transport health.

```bash
node scripts/identity-direct-send-compat.js \
  --nonce NONCE \
  --receiver-file PATH \
  --ledger PATH \
  --sender EXPECTED_SENDER \
  --sid EXPECTED_SESSION_ID \
  --target EXPECTED_TARGET
```

## Collaboration Pattern Boundary

After transport is proven, invoke a separate collaboration skill for the actual work:
- `dev-collaboration`
- `peer-collaboration`
- `dev-competition`
- `ready-rock-quartet`
- `sprint-overseer`

If a collaboration skill says "post to `comms.md`", interpret that as ledger plus direct notification unless it explicitly says otherwise.

## Report Format

```text
MESH_COMMS_READY: yes
SOCKET: /tmp/interlateral-agents-tmux.sock
SESSIONS_SEEN: ...
DIRECT_SEND_TEST: pass/fail
LEDGER_TEST: pass/fail
NOTES: ...
```
