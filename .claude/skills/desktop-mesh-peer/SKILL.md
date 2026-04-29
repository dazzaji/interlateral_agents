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

## Required Comms Rules

This skill is self-contained for desktop peer onboarding. Use `mesh-comms-core` first if the shared socket, helper scripts, or current CLI sessions are not already known.

Every desktop peer must:
- own a tmux inbox session on the shared socket `/tmp/interlateral-agents-tmux.sock`
- use a stable desktop identity such as `codex-desktop` or `claude-desktop`
- receive live messages by direct tmux injection, not by `comms.md` polling
- mirror important messages to `interlateral_dna/comms.md` as the audit ledger
- prove join with a nonce challenge visible in both the direct path and the ledger

Desktop peers are full mesh peers, but they are manually joined peers. The standard `init` skill only launches the CLI duo.

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

To observe the inbox:

```bash
tmux -S "$TMUX_SOCKET" capture-pane -t ia-codex-desktop -p -S -120
```

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

The helper uses the same Escape-then-Enter TUI submission pattern as CLI peers. Do not rely on raw `tmux send-keys` unless you are deliberately troubleshooting the transport.

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
