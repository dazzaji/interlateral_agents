# Interlateral Agents

Interlateral Agents v0.1 is a small, working multi-agent starter repo. It gives you a fast Claude Code + Codex duo launcher, peer helpers for adding more CLI agents on the same tmux socket, a canonical 17-skill catalog, direct live comms with identity stamping, and a simple `interlateral_dna/comms.md` session ledger.

## Prerequisites

- Node.js 20+
- `tmux`
- `claude`
- `codex`
- `gemini` if you want Gemini peer sessions

## Security Notice

`me.sh` launches agents in fully permissive mode (`--dangerously-skip-permissions` for Claude Code, `--dangerously-bypass-approvals-and-sandbox` for Codex). This disables all safety prompts and approval gates. Only run it in environments and on codebases where you accept that risk.

## Quick Start

Recommended bootstrap prompt for a fresh agent:

```text
Use the init skill in this repo.
```

That skill runs the standard initializer:

```bash
./me.sh
```

This boots:
- Claude Code in `ia-claude` using `claude-opus-4-7` by default
- Codex in `ia-codex` using `gpt-5.5` by default
- shared socket at `/tmp/interlateral-agents-tmux.sock`

The bootstrap agent that runs `init` or `me.sh` is not part of the mesh. The launcher prints CLI versions and the exact Claude/Codex commands before launch, performs the ACK handshake, and waits for both agents to print `Reporting for Duty!`.

Override defaults when needed:

```bash
CLAUDE_MODEL=claude-opus-4-7 CODEX_MODEL=gpt-5.5 ./me.sh
CLAUDE_ARGS="--dangerously-skip-permissions --model claude-opus-4-7" ./me.sh
CODEX_ARGS="--no-alt-screen -m gpt-5.5 --dangerously-bypass-approvals-and-sandbox -C /path/to/repo" ./me.sh
```

If you want to run `me.sh` from anywhere as `me.sh` instead of `./me.sh`, add this repo to your shell `PATH` in `~/.zshrc` or the equivalent startup file for your shell:

```bash
export PATH="$PATH:/Users/dazzagreenwood/Documents/GitHub/interlateral_agents"
```

Reload your shell config after editing it:

```bash
source ~/.zshrc
```

`me.sh` resolves its own repo root, so once the repo directory is on `PATH` you do not need to `cd` into the repo before launching it.

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

### Comms And Init Skills

The comms setup is now split into focused skills:

- `init` launches only the standard two-agent CLI mesh with `me.sh`.
- `mesh-comms-core` documents the transport substrate: tmux socket, direct-send helpers, `comms.md` ledger, identity stamping, safe TUI submission, idle checks, and ACK proof.
- `desktop-mesh-peer` joins Claude Desktop or Codex Desktop separately with its own inbox session and nonce ACK proof.

Collaboration-pattern skills now treat `comms.md` as the ledger rather than the wake-up path. Use direct helper scripts such as `node interlateral_dna/cc.js send "message"` and let the helpers mirror stamped entries into `interlateral_dna/comms.md`.

This keeps the foundation simple for new users: start one bootstrap agent, tell it to use `init`, and it should bring up the standard Claude/Codex duo without requiring local edits to `me.sh`. More complex collaboration remains opt-in through separate skills, so the basic boot path does not also carry desktop onboarding, quartet setup, sprint governance, or worker-role policy. If the CLI model names or flags change, override them with environment variables and read the printed launch commands before the script starts the sessions.

### Sprint Overseer Recipe

To oversee a sprint in any working repo, point the skill at the absolute sprint file path:

```text
Use the sprint-overseer skill.
Sprint file: /abs/path/to/other-repo/docs/sprint.md
Manager session: ia-claude
Sprint team pattern: s3-*
Poll interval: every 5 minutes
```

Optional mechanical wake-up loop:

```bash
scripts/sprint_overseer.sh /abs/path/to/other-repo/docs/sprint.md \
  --manager ia-claude \
  --overseer ia-codex \
  --closeout-file /abs/path/to/other-repo/docs/evidence/sprint3_proof.md \
  --done-marker "STATUS: DONE" \
  --stop-file /abs/path/to/other-repo/docs/evidence/sprint3_overseer_closeout.md \
  --stop-marker "STATUS: OVERSEER-DONE" \
  --interval 300
```

The skill derives sprint-local paths from `sprint_file`, writes `sprint-overseer-log.md` beside that sprint, and should usually be pointed at:
- a sprint-specific team evidence file via `--closeout-file`
- a separate sprint-specific overseer closeout via `--stop-file`

That separation lets the timer keep running after the team finishes so the overseers can still perform Joint ACK and final closeout.

## Troubleshooting

See `TROUBLESHOOTING.md`.

## Roadmap

Everything intentionally excluded from v0.1 is tracked in `ROADMAP.md`.
