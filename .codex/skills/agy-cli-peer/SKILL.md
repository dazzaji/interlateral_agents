---
name: agy-cli-peer
description: Join the Antigravity CLI (agy, Gemini 3.5 Flash) to the Interlateral mesh as a native CLI peer with its own tmux session, identity stamping, and the agy.js send helper. Use this instead of the Antigravity desktop-app CDP path.
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: macOS with tmux, Node.js, the Antigravity CLI (`agy`) installed on PATH, and this repo.
---

# Antigravity CLI Mesh Peer

## Purpose

Use this skill to join the **Antigravity CLI** (`agy`, running Gemini 3.5 Flash)
to the Interlateral mesh as a native CLI peer — like Codex CLI and Gemini CLI.

`agy` runs headless in a tmux session, receives messages by direct injection,
and sends with the standard repo helpers. No Chrome DevTools Protocol, no
Electron automation, no permission-prompt cards.

Antigravity CLI is an opt-in peer. Do not launch or recruit it for routine
skills unless Principal Human explicitly requests Antigravity CLI or the current
assignment names `agy`.

## Boundary

This is the **CLI peer** path. It is the recommended way to put Antigravity on
the mesh.

It is not the desktop-app path. The Antigravity 2.0 *desktop app* can also be
driven over Chrome DevTools Protocol via `interlateral_dna/ag.js` — that path is
documented separately in `ANTIGRAVITY.md`. Prefer this CLI peer; it is simpler
and prompt-free.

## Prerequisites

- The Antigravity CLI installed (binary at `~/.local/bin/agy`):
  ```bash
  curl -fsSL https://antigravity.google/cli/install.sh | bash
  ```
- `~/.local/bin` on `PATH`.
- Confirm: `agy --version` prints `1.0.0` or later.

## Canonical Session And Identity

- tmux session: `ia-agy`
- sender identity: `agy`
- agent type: `agy`
- model: Gemini 3.5 Flash

## Key agy Flags

- `--dangerously-skip-permissions` — auto-approve all tool permissions, no
  prompt cards. Required for unattended mesh operation.
  **Trust boundary:** this flag lets `agy` run commands, edit files, and make
  network calls with no confirmation. Use it only with a trusted local repo and
  trusted mesh prompts. Mesh messages reaching `ia-agy` are executed by an
  agent with full local filesystem and network reach — treat the peer's inbox
  as a privileged surface and do not relay untrusted external input to it.
- `-i, --prompt-interactive` — run an initial prompt then stay interactive.
  Required for a persistent peer that can receive injected messages.
- `-p, --print` — single-shot non-interactive prompt (outbound only; cannot
  listen). Useful for one-off sends, not for a standing peer.
- `--add-dir DIR` — add a directory to the workspace.

## Launch

Use the launcher script — it sets identity, socket, and workspace:

```bash
scripts/launch-agy-peer.sh ia-agy
```

With no session name, the launcher starts the canonical `ia-agy` peer that
`agy.js` targets by default. For additional peers, pass an explicit session name
such as `ia-agy-peer-01` and address it with `AGY_TMUX_SESSION`. The script
fails loudly if the session already exists; it does not kill a running peer.

To launch manually instead, start `ia-agy` as a persistent interactive peer on
the shared socket:

```bash
source scripts/tmux-config.sh
TS=$(date +%s)
tmux -S "$TMUX_SOCKET" new-session -d -s ia-agy -x 200 -y 50 \
  "cd $INTERLATERAL_AGENTS_REPO && \
   export PATH=\"\$HOME/.local/bin:\$PATH\" \
     INTERLATERAL_SENDER=agy INTERLATERAL_AGENT_TYPE=agy \
     INTERLATERAL_TEAM_ID=agents INTERLATERAL_SESSION_ID=session_agy_${TS} && \
   agy -i 'You are the ia-agy mesh peer (Antigravity CLI, Gemini 3.5 Flash) in \
the Interlateral agent mesh. Stay interactive and wait for injected messages.' \
     --dangerously-skip-permissions --add-dir $INTERLATERAL_AGENTS_REPO; exec zsh"
```

The identity environment variables **must** be exported before `agy` starts.
`agy` inherits its sender identity from the environment — if launched from a
shell carrying another peer's `INTERLATERAL_SENDER`, it will stamp messages as
that peer. Always set `INTERLATERAL_SENDER=agy` explicitly.

## First-Run Onboarding

On a machine's first `agy` interactive launch, `agy` shows an onboarding wizard
(color theme picker, then Terms of Service). Advance it by sending `Enter` a
few times to the session:

```bash
source scripts/tmux-config.sh
for i in 1 2 3; do tmux -S "$TMUX_SOCKET" send-keys -t ia-agy Enter; sleep 2; done
```

Confirm boot completed — the pane should show the `>` interactive prompt and
`Gemini 3.5 Flash` in the status line.

## Comms

Use the `agy.js` helper, which mirrors `codex.js`:

```bash
node interlateral_dna/agy.js send "message"           # inject into ia-agy
node interlateral_dna/agy.js send --force "message"   # send even if no agy TUI detected
node interlateral_dna/agy.js status                   # session JSON (ready is canonical)
node interlateral_dna/agy.js read                     # capture the ia-agy pane
```

Submission note: the Antigravity CLI TUI submits on a **plain `Enter`** — not
the Escape-then-Enter pattern the Codex TUI uses. `agy.js` does this, and pastes
messages via `tmux paste-buffer -r` so literal newlines stay inside the prompt
instead of turning into submit keystrokes. Do **not** use the generic
`agent_send_logged` for an agy session — its Escape can cancel agy's input. Use
`agy.js`, or the `agy_send` / `agy_send_logged` shell helpers in
`scripts/tmux-config.sh`.

Fail-closed: `agy.js send` authenticates the target by walking the tmux pane's
process tree, tying it to the pane TTY, and requiring an `agy` process in the
foreground process group before a default send. Screen markers are a secondary
readiness requirement, so a default send also refuses when the agy prompt/status
line is not visible. If either check fails, re-launch agy or pass `--force`
immediately after `send` to override after manually confirming the pane.

Multi-line messages are supported through the helper. Avoid bypassing it with
raw `tmux paste-buffer` unless you pass `-r`; the tmux default converts LF to
CR, which can submit each line separately.

Multiple agy peers: `agy.js` targets `ia-agy` by default. Address another peer
by setting `AGY_TMUX_SESSION`, e.g.
`AGY_TMUX_SESSION=ia-agy-peer-01 node interlateral_dna/agy.js send "..."`.

`agy` sends to other peers with the standard helpers from the repo root:

```bash
node interlateral_dna/cc.js send "message to Claude"
node interlateral_dna/codex.js send "message to Codex"
```

`comms.md` is the ledger, not the wake-up path. A valid proof has both a direct
injected message and a stamped ledger entry.

## Known Quirk

The Antigravity CLI can report its pane process as `zsh`, so the pane command
alone cannot tell a foreground `agy` from a bare shell or a stopped/backgrounded
agy. `agy.js` authenticates `agy` through the pane TTY foreground process group
and reports `agy_process`, `agy_foreground`, `screen_ready`, and `ready` in
`status`. Treat `ready: true` as the canonical acceptance field for default
sends; lower-level fields are diagnostic. `pane_seems_cli` in `tmux-config.sh`
cannot classify agy reliably — use `agy.js status` to confirm liveness.

## Acceptance Checklist

1. `agy --version` prints `1.0.0` or later.
2. The launch command creates `ia-agy`; `tmux -S /tmp/interlateral-agents-tmux.sock list-sessions` shows it.
3. Onboarding cleared — the pane shows the `>` prompt and `Gemini 3.5 Flash`.
4. `node interlateral_dna/agy.js send "<nonce>"` reaches `ia-agy` and it acts on the message.
5. `ia-agy` replies via `cc.js`/`codex.js`; the reply is stamped `sender=agy agent_type=agy` in `comms.md`.
6. No permission-prompt cards appear during the round trip.
