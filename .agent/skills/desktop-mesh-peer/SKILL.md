---
name: desktop-mesh-peer
description: Join Claude Desktop or Codex Desktop to the Interlateral mesh as a desktop peer with its own tmux inbox session, identity, direct ACK, and ledger mirror. This is separate from the standard CLI init flow.
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: Desktop agent plus shell access to the Interlateral agents repo.
---

# Desktop Mesh Peer

## Purpose

Use this skill when a desktop agent needs to join the live Interlateral comms mesh.

Desktop peers are not launched by `init` or `me.sh`. They join separately with their own inbox session and must prove both direct and ledger comms.

## Prerequisite

Use `mesh-comms-core` first if the shared socket, helper scripts, or current sessions are not already known.

Detailed desktop reference:

```text
$INTERLATERAL_PLATFORM_REPO/docs/ops/comms/DESKTOP_FIRST.md
```

That platform doc is an optional local reference. This skill contains the minimum desktop peer procedure.

## Identity Choices

Use stable sender identities:
- Claude Desktop: `claude-desktop`
- Codex Desktop: `codex-desktop`

Use stable inbox sessions:
- Claude Desktop: `ia-claude-desktop`
- Codex Desktop: `ia-codex-desktop`

## Create Inbox

```bash
cd "${INTERLATERAL_AGENTS_REPO:-$PWD}"
source scripts/tmux-config.sh

tmux -S "$TMUX_SOCKET" new-session -d -s ia-codex-desktop \
  "bash -lc 'echo Codex Desktop mesh inbox ready; exec cat -v'"
```

Adjust the session name and text for Claude Desktop.

The inbox is intentionally simple: it gives CLI peers a direct tmux target for messages to the desktop-side operator.

## Outbound Messages From Desktop

Desktop peers should send to CLI peers with the same helper scripts:

```bash
node interlateral_dna/cc.js send "message to Claude CLI"
node interlateral_dna/codex.js send "message to Codex CLI"
node interlateral_dna/gemini.js send "message to Gemini CLI"
```

Set sender identity before sending when possible:

```bash
export INTERLATERAL_SENDER=codex-desktop
export INTERLATERAL_AGENT_TYPE=codex-desktop
```

## Inbound Messages To Desktop

For `codex-desktop`, target `ia-codex-desktop`.

For `claude-desktop`, target `ia-claude-desktop`. If there is no dedicated helper, use `agent_send_logged` against that inbox session so the direct message is also mirrored to `comms.md`.

```bash
source scripts/tmux-config.sh
agent_send_logged ia-codex-desktop "ACK challenge: desktop-ack-123. Reply in comms.md and direct to ia-codex."
```

## Proof Of Join

Use a nonce challenge:

```text
Desktop mesh ACK challenge: desktop-ack-YYYYMMDD-HHMMSS.
Reply with the nonce, your sender identity, and the target CLI session you can reach.
```

The desktop peer is joined only when:
- its inbox session exists on the shared socket
- it receives a direct nonce challenge
- it sends a direct ACK to a CLI peer
- it writes or triggers a stamped ledger entry in `interlateral_dna/comms.md`

## Report Format

```text
DESKTOP_MESH_PEER_READY: yes
DESKTOP_IDENTITY: codex-desktop|claude-desktop
INBOX_SESSION: ia-codex-desktop|ia-claude-desktop
DIRECT_ACK: pass/fail
LEDGER_ACK: pass/fail
NOTES: ...
```
