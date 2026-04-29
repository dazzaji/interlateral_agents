# Interlateral Agents

Interlateral Agents v0.1 is a small, working multi-agent starter repo built around the `init` skill. It gives you a fast Claude Code + Codex duo, peer helpers for adding more CLI agents on the same tmux socket, a canonical 18-skill catalog, direct live comms with identity stamping, and a simple `interlateral_dna/comms.md` session ledger.

## Prerequisites

- Node.js 20+
- `tmux`
- `claude`
- `codex`
- `gemini` if you want Gemini peer sessions

## Security Notice

The launcher used by `init` starts agents in fully permissive mode (`--dangerously-skip-permissions` for Claude Code, `--dangerously-bypass-approvals-and-sandbox` for Codex). This disables all safety prompts and approval gates. Only run it in environments and on codebases where you accept that risk.

## Quick Start

If you are Claude Desktop or Codex Desktop joining this repo, first read and follow `.agent/skills/desktop-mesh-peer/SKILL.md`.

1. Open a terminal and `cd` into this repo:

   ```bash
   cd path/to/interlateral_agents
   ```

2. Start one agent CLI in that terminal. Either of these works:

   ```bash
   claude
   ```

   ```bash
   codex
   ```

3. In that agent, send exactly:

   ```text
   Use the init skill in this repo.
   ```

4. Wait until both launched peers print:

   ```text
   Reporting for Duty!
   ```

> The agent you started in step 2 is only the bootstrap operator. It is not a mesh peer. The mesh is the two agents `init` launches: Claude Code in `ia-claude` and Codex in `ia-codex`, sharing `/tmp/interlateral-agents-tmux.sock`.

## How init Boots The Mesh

The `init` skill runs the standard launcher underneath and brings up:
- Claude Code in `ia-claude` using `claude-opus-4-7` by default
- Codex in `ia-codex` using `gpt-5.5` by default
- shared socket at `/tmp/interlateral-agents-tmux.sock`

Under the hood, `init` runs `./me.sh`. The script prints CLI versions and the exact Claude/Codex commands before launch, performs the ACK handshake, and waits for both peers to print `Reporting for Duty!`.

Direct peer injection is the live comms path. `interlateral_dna/comms.md` is the audit ledger, not the wake-up channel.

## Warp Quick Start

The normal Quick Start above is still the baseline path. Use Warp when you want Claude Code and Codex CLI visible in Warp panes while they remain normal tmux mesh peers.

1. Install or refresh the Warp launch configuration:

   ```bash
   scripts/install-warp-launch-config.sh --force
   ```

2. Open the Warp mesh:

   ```bash
   open "warp://launch/interlateral-warp-mesh"
   ```

3. Wait for the Warp panes to attach or create:

   ```text
   ia-claude-warp
   ia-codex-warp
   ```

Warp is the terminal surface. The mesh transport is still the shared tmux socket and the direct-send helpers documented in `mesh-comms-core`. For details, use the `warp-mesh-peer` skill.

## Choosing An Operating Mode

Interlateral Agents can be used in several modes depending on how much control you want.

For the concierge path, follow Quick Start to bring up the mesh. Then give the live agents your goal and ask them to choose the right skill or collaboration pattern.

For a hands-on hierarchical workflow, use the `hierarchical` skill: appoint one agent as the manager who delegates tasks to the rest, reviews their output, and approves or requests changes.

For maximum manual control, run the working-team patterns directly yourself. You can invoke any one or combination of these skills as useful starting points:

- `ready-rock-quartet` for a visible four-agent Lead / Reviewer / Breaker / Verifier team
- `dev-collaboration` for a focused Drafter / Reviewer / Breaker workflow
- `peer-collaboration` for two agents iterating as equals
- `dev-competition` when you want independent implementations and a judge

For long-running, complex, or high-stakes sprints in any mode, layer `sprint-overseer` on top. A team of overseer agents periodically reviews current sprint progress, confirms when work is on track, and nudges or intervenes when it drifts. It also writes a sprint-local log of progress, drift, interventions, major problems, and closeout evidence. See Sprint Overseer Recipe below for invocation.

## Under The Hood: me.sh

You should rarely need to invoke `me.sh` directly; the `init` skill owns the normal bootstrap UX. Use the launcher knobs here when CLI defaults change or you need a specific model or argument combination.

Override defaults when needed:

```bash
CLAUDE_MODEL=claude-opus-4-7 CODEX_MODEL=gpt-5.5 ./me.sh
CLAUDE_ARGS="--dangerously-skip-permissions --model claude-opus-4-7" ./me.sh
CODEX_ARGS="--no-alt-screen -m gpt-5.5 --dangerously-bypass-approvals-and-sandbox -C /path/to/repo" ./me.sh
```

Use `./me.sh --force` only when you explicitly accept replacing attached `ia-claude` or `ia-codex` windows.

If you want to run `me.sh` from anywhere as `me.sh` instead of `./me.sh`, add this repo to your shell `PATH` in `~/.zshrc` or the equivalent startup file for your shell:

```bash
export PATH="$PATH:/path/to/interlateral_agents"
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
Artifact: path/to/work-plan.md
```

### Comms And Init Skills

The comms setup is now split into focused skills:

- `init` launches only the standard two-agent CLI mesh with `me.sh` underneath.
- `mesh-comms-core` documents the transport substrate: tmux socket, direct-send helpers, `comms.md` ledger, identity stamping, safe TUI submission, idle checks, and ACK proof.
- `desktop-mesh-peer` joins Claude Desktop or Codex Desktop separately with its own inbox session and nonce ACK proof.
- `warp-mesh-peer` opens Claude Code and Codex CLI as Warp-visible tmux peers while keeping the same mesh transport.

Collaboration-pattern skills now treat `comms.md` as the ledger rather than the wake-up path. Use direct helper scripts such as `node interlateral_dna/cc.js send "message"` and let the helpers mirror stamped entries into `interlateral_dna/comms.md`.

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
