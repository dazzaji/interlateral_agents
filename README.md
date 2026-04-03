# Interlateral Agents

Interlateral Agents v0.1 is a small, working multi-agent starter repo. It gives you a fast Claude Code + Codex duo launcher, peer helpers for adding more CLI agents on the same tmux socket, a canonical 12-skill catalog, direct live comms with identity stamping, and a simple `interlateral_dna/comms.md` session ledger.

## Prerequisites

- Node.js 20+
- `tmux`
- `claude`
- `codex`
- `gemini` if you want Gemini peer sessions

## Security Notice

`me.sh` launches agents in fully permissive mode (`--dangerously-skip-permissions` for Claude Code, `--yolo` for Codex). This disables all safety prompts and approval gates. Only run it in environments and on codebases where you accept that risk.

## Quick Start

```bash
./me.sh
```

This boots:
- Claude Code in `ia-claude`
- Codex in `ia-codex`
- shared socket at `/tmp/interlateral-agents-tmux.sock`

The duo launcher performs the ACK handshake and waits for both agents to print `Ready to Rock!`.

## Adding More Agents

Launch more peers on the same socket:

```bash
scripts/launch-codex-peer.sh
scripts/launch-cc-peer.sh
scripts/launch-gemini-peer.sh
```

Send a follow-up prompt to a Codex peer:

```bash
scripts/send-codex-peer.sh ia-codex-peer-01 "Read AGENTS.md and report ready."
```

Shut everything down cleanly:

```bash
scripts/shutdown.sh
```

## Using Skills

The canonical skill source is `.agent/skills/`. Deploy copies live in `.claude/skills/` and `.codex/skills/`.

Deploy or refresh them with:

```bash
scripts/deploy-skills.sh
```

Invoke a skill by naming it in your prompt, for example:

```text
Use the dev-collaboration skill at .agent/skills/dev-collaboration/SKILL.md.
CC is Drafter. Codex is Reviewer+Breaker.
Artifact: dev_plan/dev_plan.md
```

## Troubleshooting

See `TROUBLESHOOTING.md`.

## Roadmap

Everything intentionally excluded from v0.1 is tracked in `ROADMAP.md`.
