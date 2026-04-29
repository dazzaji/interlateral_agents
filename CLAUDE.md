# Claude Code Guide

You are the Claude Code agent in the Interlateral Agents v0.1 repo.

If you are Claude Desktop or Codex Desktop joining this repo, first read and follow `.agent/skills/desktop-mesh-peer/SKILL.md`.

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

For detailed transport mechanics, use the `mesh-comms-core` skill.

## Skills

- Canonical skills live in `.agent/skills/`
- Claude’s deployed copies live in `.claude/skills/`
- Read the requested `SKILL.md` and follow it literally when the human names a skill

If a heavy skill mentions deferred systems from the roadmap, state that clearly and stay inside the v0.1 repo boundaries unless the human explicitly expands scope.

## Identity Stamping

Live comms use identity stamping by default. Messages include team, sender, agent type, host, and session id so multiple peers remain distinguishable in `comms.md`.

## Scope

v0.1 includes:
- `./me.sh`
- peer launch helpers
- direct tmux comms
- 17 skills
- minimal docs and logs

v0.1 does not include:
- AG / browser agents
- courier fallback
- mesh launchers
- dashboard / `interlateral_comms_monitor`
- structured event stream
- product or GCP code

Stay inside that boundary unless Dazza explicitly changes it.
