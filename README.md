# Interlateral Agents

Interlateral Agents v0.2.0 is a small, working multi-agent starter repo built around the `init` skill. It gives you a fast Claude Code + Codex duo, opt-in peer helpers for adding more CLI agents on the same tmux socket, a canonical skill catalog, direct live comms with identity stamping, and a simple `interlateral_dna/comms.md` session ledger.

## Prerequisites

- Node.js 20+
- `tmux`
- `claude`
- `codex`
- Optional: `gemini` for manually selected Gemini peer sessions
- Optional: `agy` for manually selected Antigravity CLI peer sessions

## Security Notice

The launcher used by `init` starts agents in fully permissive mode (`--dangerously-skip-permissions` for Claude Code, `--dangerously-bypass-approvals-and-sandbox` for Codex). This disables all safety prompts and approval gates. Only run it in environments and on codebases where you accept that risk.

Optional peer launchers use the same trust model. Gemini CLI and Antigravity CLI peers are powerful local agents once launched; only add them when you have deliberately chosen them for the task.

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

`init` / `me.sh` do not launch Gemini, Antigravity CLI, Antigravity Desktop, or desktop inbox peers. Those are opt-in expansions.

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

For the lightest guided path, start a capable CLI agent such as Claude Code with Opus 4.7 or Codex 5.5, point it at this repo, and ask it to act as your personal project concierge. Have it get familiar with the repo, help you get onto the mesh, choose the right collaboration pattern, invoke the right skills, brief the other agents, and keep you updated. This role is more like a majordomo managing a household staff, or a Navy Master Chief keeping the operation moving, than a formal workflow.

This is intentionally not a skill. Current frontier agents are already well adapted to this kind of judgment-heavy coordination, and too many instructions can make them worse. A lightweight prompt is usually better when you want one capable agent helping you use this repo, rather than personally invoking and managing the collaboration-pattern skills yourself.

Example prompt:

```text
Please get familiar with this repo and act as my personal concierge for using the Interlateral Agents mesh. Help me choose and invoke the right skills and agents, keep the work moving, give me clear status when I ask, and only add heavier process when it is genuinely needed.
```

For a hands-on hierarchical workflow, use the `hierarchical` skill: appoint one agent as the manager who delegates tasks to the rest, reviews their output, and approves or requests changes.

For maximum manual control, run the working-team patterns directly yourself. You can invoke any one or combination of these skills as useful starting points:

- `ready-rock-quartet` for a visible four-agent Lead / Reviewer / Breaker / Verifier team
- `dev-collaboration` for a focused Drafter / Reviewer / Breaker workflow
- `peer-collaboration` for two agents iterating as equals
- `peer-synthi` for independent research or proposals that combine strong ideas and retain material alternatives
- `dev-competition` when you want independent implementations and a judge

Unless the human prompt explicitly selects otherwise, collaboration skills should build their roster from Claude Code and Codex peers. Gemini CLI, Antigravity CLI, and Antigravity Desktop are special opt-in participants, not default capacity.

For long-running, complex, or high-stakes sprints in any mode, layer `sprint-overseer` on top. A team of overseer agents periodically reviews current sprint progress, confirms when work is on track, and nudges or intervenes when it drifts. It also writes a sprint-local log of progress, drift, interventions, major problems, and closeout evidence. See Sprint Overseer Recipe below for invocation.

## Choosing Process Weight

Use the lightest process that fits the actual risk. The repo provides process levels as guides, not achievement levels or mandatory gates:

- **Level 0: Solo task.** One agent handles a bounded request.
- **Level 1: Peer collaboration.** Selected peers collaborate, for example with `peer-collaboration`, `peer-superset`, or `peer-synthi`; more perspectives alone do not require a heavier process.
- **Level 2: Team collaboration.** Three or more agents use explicit roles, for example a Lead / Reviewer / Breaker / Verifier quartet.
- **Level 3: Overseen sprint.** Add liveness oversight for longer autonomous work, for example with `sprint-overseer`.
- **Level 4: Gatekeeper sprint.** Add formal delegated approvals for live, sensitive, mission-critical, public, destructive, or hard-to-reverse work, for example with `gate-keeper`.

Quick risk test: would a wrong action affect production users, mutate live data, spend money, expose credentials, or be hard to reverse without human help? If yes, consider Level 3 or Level 4. If no, prefer Level 0-2.

Templates:

- `templates/sprint/process-levels.md`
- `templates/sprint/sprint-template.md`

Canonical reference: `templates/sprint/process-levels.md`. If this summary and the canonical reference disagree, the canonical reference wins.

## Control Plane Tools

Most tasks do not need these tools. Use them when work is autonomous, long-running, live-risk, credential-bearing, delegated, or serious enough that a missed gate would be expensive to recover from. None of these helpers is a complete safety proof; see `templates/sprint/process-levels.md` for proof boundaries.

| Tool | Use when | Hint |
| --- | --- | --- |
| `scripts/gate-packet-lint.js` | A delegated gate adopts the strict packet contract. | `node scripts/gate-packet-lint.js <packet.md>` |
| `scripts/identity-direct-send-compat.js` | Fresh, uncertain, changed, desktop-joined, or high-risk transport needs post-send evidence validation. | `node scripts/identity-direct-send-compat.js --help` |
| `scripts/watcher-control-sim.js` | Overseer stall, false-green, retry-loop, or review-spiral classification logic changed. | `node scripts/watcher-control-sim.js all` |
| `scripts/credential-hygiene-lint.js` | Files mention credentials, tokens, secret stores, cloud auth, or auth headers. | `node scripts/credential-hygiene-lint.js <file> [file...]` |

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

The default mesh is still Claude Code + Codex. Add peers only when the task needs
them and the human has selected them.

Launch additional Claude or Codex peers on the same socket:

```bash
scripts/launch-codex-peer.sh
scripts/launch-cc-peer.sh
```

Advanced opt-in peers:

```bash
scripts/launch-gemini-peer.sh
scripts/launch-agy-peer.sh
```

Antigravity has two paths: the CLI peer (`scripts/launch-agy-peer.sh`, `interlateral_dna/agy.js`) is the normal opt-in path; the desktop-app CDP helper (`interlateral_dna/ag.js`) is a fallback for cases where the visible desktop app specifically must be controlled. See `ANTIGRAVITY.md`.

Send a follow-up prompt to a Codex peer:

```bash
scripts/send-codex-peer.sh ia-codex-peer-01 "Read AGENTS.md and report ready."
```

Shut everything down cleanly:

```bash
scripts/shutdown.sh
```

## Using Skills

The versioned catalog contains 24 skills; see [SKILLS.md](SKILLS.md). The canonical source is `.agent/skills/`. Deploy copies live in `.claude/skills/` and `.codex/skills/`.

For independent multi-agent research and proposals that preserve useful complements and material alternatives, use [`peer-synthi`](.agent/skills/peer-synthi/SKILL.md). Model-specific discovery locations are listed in [SKILLS.md](SKILLS.md#peer-synthi-discovery).

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

### When To Change A Skill

Hard lessons from a sprint should not automatically become permanent SKILL rules. A SKILL should be changed only when the lesson is truly general.

“Truly necessary” means all of these are true:

1. **The problem is inside the skill itself.** The skill currently tells agents to do something wrong, ambiguous, too heavy, or unsafe as a general rule.
2. **The problem is reusable, not sprint-specific.** It affects many future uses of the skill, not just one project, sprint, or deploy.
3. **A lighter fix is insufficient.** A template note, sprint-specific instruction, README note, or example would not reliably prevent the failure.
4. **The edit makes the skill simpler or safer.** It should clarify, prune, or correct. It should not add a large new doctrine block.
5. **The blast radius is understood.** Since SKILLS affect future agents AND FUTURE SPRINTS, the change must be reviewed more carefully than a sprint-specific template.

When in doubt, keep the SKILL small and put sprint-specific process in a template or sprint spec.

### Comms And Init Skills

The comms setup is now split into focused skills:

- `init` launches only the standard two-agent CLI mesh with `me.sh` underneath.
- `mesh-comms-core` documents the transport substrate: tmux socket, direct-send helpers, `comms.md` ledger, identity stamping, safe TUI submission, idle checks, and ACK proof.
- `desktop-mesh-peer` joins Claude Desktop or Codex Desktop separately with its own inbox session and nonce ACK proof.
- `agy-cli-peer` joins Antigravity CLI as an explicitly selected native CLI peer.
- `warp-mesh-peer` opens Claude Code and Codex CLI as Warp-visible tmux peers while keeping the same mesh transport.

Collaboration-pattern skills now treat `comms.md` as the ledger rather than the wake-up path. Use direct helper scripts such as `node interlateral_dna/cc.js send "message"` and let the helpers mirror stamped entries into `interlateral_dna/comms.md`.

### Sprint Overseer Recipe

Use sprint overseers when the work is long-running, easy to stall, or needs periodic independent liveness checks. Do not use overseers for ordinary short tasks just because the skill exists.

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

If you use the mechanical timer, the sprint closeout must satisfy the timer's exact exit contract: write the literal `--done-marker` into the `--closeout-file`, write the literal `--stop-marker` into the `--stop-file`, and verify the timer process has stopped. Otherwise the overseer can keep polling after the sprint is done.

## Troubleshooting

See `TROUBLESHOOTING.md`.

## Roadmap

Everything intentionally excluded from the current release target is tracked in `ROADMAP.md`.

## Release Versioning

When this Antigravity integration is merged, cut a GitHub release and keep the
repo version references aligned. This change adds a new opt-in peer family, so
the chosen release target is `v0.2.0`; the GitHub release tag and in-repo
metadata should match that version.
