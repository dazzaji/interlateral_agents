---
name: warp-mesh-peer
description: Join Claude Code and Codex CLI to the Interlateral mesh in Warp panes by attaching Warp to the standard tmux socket; Warp is the visible terminal surface, tmux remains the transport.
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: Warp on macOS with tmux, claude, codex, and this repo on PATH.
---

# Warp Mesh Peer

## Purpose

Use this skill when the human wants Interlateral CLI agents visible inside Warp while preserving the standard tmux mesh.

Warp is the terminal surface. tmux remains the transport. Do not use Warp Oz, Warp Drive, AppleScript, or Accessibility paste as the mesh channel.

## Boundary

This skill is for Claude Code and Codex CLI running inside tmux sessions that are attached from Warp panes.

It is not the Desktop join path. If Claude Desktop or Codex Desktop needs to join the mesh, use `desktop-mesh-peer`.

## Canonical Sessions

- Claude Code in Warp: `ia-claude-warp`
- Codex CLI in Warp: `ia-codex-warp`

Suffix variants are allowed for reviews or sprints, for example:

- `ia-claude-warp-review`
- `ia-codex-warp-breaker`

Always target the exact tmux session name.

## Quick Start

Install or refresh the Warp launch configuration:

```bash
scripts/install-warp-launch-config.sh --force
```

Open the Warp mesh:

```bash
open "warp://launch/interlateral-warp-mesh"
```

This opens Warp panes attached to:

- `ia-claude-warp`
- `ia-codex-warp`

If the sessions do not exist, the wrapper creates them using the existing repo launchers.

## Manual Attach

Run either peer directly:

```bash
scripts/warp-mesh-peer.sh claude ia-claude-warp
scripts/warp-mesh-peer.sh codex ia-codex-warp
```

Relaunch one named peer explicitly:

```bash
scripts/warp-mesh-peer.sh --relaunch claude ia-claude-warp
scripts/warp-mesh-peer.sh --relaunch codex ia-codex-warp
```

The wrapper never kills an existing session unless `--relaunch` is supplied.

## Comms

Use the same mesh helpers as the rest of the repo.

For Warp Claude:

```bash
source scripts/tmux-config.sh
claude_send_long_logged =ia-claude-warp: "ACK challenge: warp-claude-001. Reply with this nonce."
```

For Warp Codex:

```bash
source scripts/tmux-config.sh
agent_send_long_logged =ia-codex-warp: "ACK challenge: warp-codex-001. Reply with this nonce."
```

`comms.md` is the ledger, not the wake-up path. A valid proof has both a visible direct reply and a stamped ledger entry.

## Lifecycle

Warp attaches to existing tmux sessions. Detaching or closing a Warp pane should leave the tmux session alive. Reopening the launch config reattaches to the same session if it is healthy.

Multiple terminals can attach to the same session. They share one live TTY. Human typing and mesh injection can interleave, so check idle before sending and avoid injecting while someone is actively typing.

## Liveness And Recovery

The wrapper checks existing sessions before attaching.

Healthy sessions must look like the requested CLI and show a usable prompt or idle state.

If a stale session exists, the wrapper prints recovery instructions and exits. It does not auto-kill.

Inspect a stale session:

```bash
source scripts/tmux-config.sh
pane_current_command ia-codex-warp
agent_capture_recent ia-codex-warp 80
```

Recover intentionally:

```bash
scripts/warp-mesh-peer.sh --relaunch codex ia-codex-warp
```

## Acceptance Checklist

1. `scripts/install-warp-launch-config.sh --force` succeeds.
2. `open "warp://launch/interlateral-warp-mesh"` opens two Warp panes.
3. `tmux -S /tmp/interlateral-agents-tmux.sock list-sessions` shows `ia-claude-warp` and `ia-codex-warp`.
4. A nonce sent with `claude_send_long_logged =ia-claude-warp: ...` wakes Claude visibly and logs to `comms.md`.
5. A nonce sent with `agent_send_long_logged =ia-codex-warp: ...` wakes Codex visibly and logs to `comms.md`.
6. Reopening the launch config attaches to healthy existing sessions without duplicates.
7. A stale session fails loudly unless `--relaunch` is supplied.
