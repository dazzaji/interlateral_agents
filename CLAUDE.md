# Claude Code Guide

You are the Claude Code agent in the Interlateral Agents v0.2.0 repo.

If you are Claude Desktop or Codex Desktop joining this repo, first read and follow `.agent/skills/desktop-mesh-peer/SKILL.md`.

If you are Claude Code or Codex CLI running inside Warp, first read `.agent/skills/warp-mesh-peer/SKILL.md` for the Warp-specific attach and comms rules.

If you are the Antigravity CLI (`agy`) joining the mesh, first read `.agent/skills/agy-cli-peer/SKILL.md`. For the Antigravity desktop app, see `ANTIGRAVITY.md`.

## Default Peer Policy

The default live mesh is the two-agent Claude Code + Codex CLI duo launched by
`init` / `me.sh`.

Do not launch, recruit, assign work to, or rely on Gemini CLI, Antigravity CLI
(`agy`), or the Antigravity desktop CDP path unless Dazza explicitly requests
that peer or the current assignment names it. Their helper scripts are available
for deliberate opt-in use; availability is not permission to include them in
routine skills, reviews, or startup flows.

## Wake-Up Protocol

1. Verify you are running in the shared tmux environment on `/tmp/interlateral-agents-tmux.sock`.
2. Read `interlateral_dna/LIVE_COMMS.md`.
3. If you were launched by `./me.sh`, send Codex exactly:
   `ACK from Claude. Can you hear me?`
   using `node interlateral_dna/codex.js send "ACK from Claude. Can you hear me?"`
4. Wait for Codex ACK.
5. Print exactly `Reporting for Duty!`
6. If there is no real assignment, stop and wait.

Do not invent work after ACK.

## Communication Rules

- Direct terminal injection is the real-time channel.
- `interlateral_dna/comms.md` is the ledger.
- Use both, but never rely on the ledger alone to wake another agent.

Send to Codex:

```bash
node interlateral_dna/codex.js send "message"
```

Send to Gemini:

```bash
node interlateral_dna/gemini.js send "message"
```

Send to the Antigravity CLI peer:

```bash
node interlateral_dna/agy.js send "message"
```

For detailed transport mechanics, use the `mesh-comms-core` skill.

## Skills

- Canonical skills live in `.agent/skills/`
- Claude’s deployed copies live in `.claude/skills/`
- Read the requested `SKILL.md` and follow it literally when the human names a skill

If a heavy skill mentions deferred systems from the roadmap, state that clearly and stay inside the current release boundaries unless the human explicitly expands scope.

## Identity Stamping

Live comms use identity stamping by default. Messages include team, sender, agent type, host, and session id so multiple peers remain distinguishable in `comms.md`.

## Scope

Current release includes:
- `./me.sh`
- peer launch helpers
- Warp tmux attach helpers
- direct tmux comms
- Antigravity CLI (`agy`) mesh peer (`agy.js`, `agy-cli-peer` skill)
- Antigravity desktop-app CDP transport (`ag.js`, `ANTIGRAVITY.md`)
- 21 skills
- minimal docs and logs

Current release does not include:
- other browser agents
- courier fallback
- unsupported mesh launchers outside the repo's local tmux helpers
- dashboard / `interlateral_comms_monitor`
- structured event stream
- product or GCP code

Stay inside that boundary unless Dazza explicitly changes it.
