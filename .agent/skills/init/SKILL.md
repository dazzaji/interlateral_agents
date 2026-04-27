---
name: init
description: Initialize the standard Interlateral two-agent CLI mesh from a bootstrap agent by running me.sh, launching Claude Opus 4.7 plus Codex 5.5, proving live ACK, and waiting for "Reporting for Duty!". The bootstrap agent is not part of the mesh.
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: Bootstrap operator with shell access to this repo, tmux, claude, codex, and node.
---

# Init

## Purpose

Use this skill when a fresh bootstrap agent is asked to initialize the normal Interlateral CLI mesh.

This skill starts exactly the standard duo:
- Claude Code in `ia-claude`
- Codex in `ia-codex`

The agent running this skill is the bootstrap operator. It is not a mesh peer and should not claim a mesh identity.

## Boundaries

Do not use this skill for:
- desktop peers
- quartet teams
- extra workers
- sprint role assignment
- long-running collaboration patterns

For desktop peers, use `desktop-mesh-peer`.
For transport details or troubleshooting, use `mesh-comms-core`.
For quartet work, use `ready-rock-quartet`.

## Defaults

`me.sh` owns the launch mechanics and prints the exact commands before starting the sessions.

Defaults:
- Claude model: `claude-opus-4-7`
- Codex model: `gpt-5.5`
- Ready phrase: `Reporting for Duty!`
- tmux socket: `/tmp/interlateral-agents-tmux.sock`

Model and argument defaults are configurable with environment variables:

```bash
CLAUDE_MODEL=claude-opus-4-7 CODEX_MODEL=gpt-5.5 ./me.sh
CLAUDE_ARGS="..." CODEX_ARGS="..." ./me.sh
```

## Procedure

1. Change to the agents repo:

```bash
cd /Users/dazzagreenwood/Documents/GitHub/interlateral_agents
```

2. Run the standard initializer:

```bash
./me.sh
```

Use `./me.sh --force` only when the human explicitly accepts replacing attached `ia-claude` or `ia-codex` windows.

3. Read the preflight output before the sessions launch.

Confirm it prints:
- detected CLI versions
- actual Claude launch command
- actual Codex launch command
- the configured ready phrase

4. Wait for both sessions to report:

```text
Reporting for Duty!
```

5. Verify the ACK path if either side looks uncertain:

```bash
tmux -S /tmp/interlateral-agents-tmux.sock list-sessions
tail -40 interlateral_dna/comms.md
```

The comms log should contain a stamped Claude ACK to Codex and a stamped Codex ACK to Claude.

## Failure Handling

If startup fails:

1. Inspect the printed launch command and the relevant pane output.
2. Check `interlateral_dna/claude_telemetry.log` and `interlateral_dna/codex_telemetry.log`.
3. If the run produced half-started sessions, shut down only the launcher-owned duo:

```bash
source scripts/tmux-config.sh
run_tmux kill-session -t "$CC_SESSION" 2>/dev/null || true
run_tmux kill-session -t "$CODEX_SESSION" 2>/dev/null || true
```

Do not use `scripts/shutdown.sh` for this scoped cleanup. That script intentionally tears down every session on the shared socket.

4. Retry once with corrected model or argument environment variables.

Do not improvise new mesh topology inside this skill. Escalate if the standard duo cannot boot cleanly after one controlled retry.

## Report Format

When complete, report:

```text
INIT_STATUS: READY
BOOTSTRAP_AGENT_IN_MESH: no
SOCKET: /tmp/interlateral-agents-tmux.sock
CLAUDE_SESSION: ia-claude
CODEX_SESSION: ia-codex
READY_PHRASE: Reporting for Duty!
ACK_STATUS: direct plus ledger confirmed
```
