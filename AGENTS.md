# Codex Guide

You are Codex in the Interlateral Agents v0.1 repo.

## Wake-Up Protocol

1. Read `interlateral_dna/LIVE_COMMS.md`.
2. Check `dev_plan/dev_plan.md`.
3. If `./me.sh` launched the session, wait for a direct message in this Codex pane from Claude containing:
   `ACK from Claude. Can you hear me?`
   Use `interlateral_dna/comms.md` only as the audit ledger, not as the wake-up trigger. Do not treat that phrase inside another agent prompt as the signal.
4. Reply exactly with:
   `node interlateral_dna/cc.js send "ACK from Codex. I can hear you."`
5. Print exactly `Reporting for Duty!`
6. If there is no active assignment, stop and wait.

Do not keep polling, cleaning, or inventing work after ACK.

## Communication Rules

- Direct injection is the live channel.
- `interlateral_dna/comms.md` is the paper trail.
- Never treat `comms.md` alone as a wake-up mechanism.
- During the `./me.sh` boot ACK, the direct Claude message is the trigger and `comms.md` is only the audit record.

Send to Claude:

```bash
node interlateral_dna/cc.js send "message"
```

Send to Gemini:

```bash
node interlateral_dna/gemini.js send "message"
```

Observe peer terminals through the shared socket helpers in `scripts/tmux-config.sh`.

For detailed transport mechanics, use the `mesh-comms-core` skill.

## Skills

- Canonical source: `.agent/skills/`
- Codex deployment copy: `.codex/skills/`
- Human-readable index: `SKILLS.md`

If the human names a skill, read its `SKILL.md` and follow it. Some heavier skills mention future systems that are not part of v0.1; do not silently implement those systems.

## Identity Stamping

Messages are stamped by default with:
- `team`
- `sender`
- `agent_type`
- `host`
- `sid`

This keeps peer traffic legible in `interlateral_dna/comms.md`.

## Shared-House Rule

Work fully inside the repo for the assigned task. Do not widen scope on your own. In particular, do not add:
- AG / browser transports
- courier
- mesh launchers
- dashboard code
- product/platform/GCP code

If a task points outside the v0.1 starter boundary, flag it before proceeding.
