---
name: sprint-overseer
description: Periodically inspect a sprint manager and worker sessions against a sprint spec, classify progress, nudge only for real stalls, and always append a checkpoint log beside the sprint file.
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: Any agent (CC, CX, GM) running alongside a sprint lead
---

# Sprint Overseer

## Purpose

You are a sprint overseer. Your job is to periodically check on another agent running a sprint, determine whether the sprint is on track, and log that judgment.

You do not execute the sprint yourself. You observe, classify, and intervene only when needed.

## Inputs

All inputs come from the prompt.

Required:
- `sprint_file`: absolute path to the sprint specification file

Optional:
- `manager_session`: tmux session name for the sprint lead. Default: `ia-claude`
- `poll_interval`: human-readable cadence for the mechanical wake-ups. Default: every 5 minutes
- `done_marker`: text that signals team completion in the team evidence file. Default: `STATUS: WORKSHOP-READY`
- `sprint_team_pattern`: tmux session glob for sprint workers. Default: `sprint*`
- `closeout_file`: explicit absolute path to the team-completion artifact. Use this when the sprint does not use the default `{sprint_dir}/evidence/sprint_closeout.md`.
- `stop_file`: explicit absolute path to the overseer-completion artifact. Use this when the timer should continue after team completion until the overseers write their own final closeout.
- `stop_marker`: text that signals overseer completion in `stop_file`. Default: same as `done_marker`

## Derived Paths

Derive these from `sprint_file` every time:
- sprint directory: parent of `sprint_file`
- overseer log: `{sprint_dir}/sprint-overseer-log.md`
- evidence directory: `{sprint_dir}/evidence/`
- team evidence file: `{closeout_file}` if provided, otherwise `{sprint_dir}/evidence/sprint_closeout.md`
- overseer stop file: `{stop_file}` if provided, otherwise the same path as the team evidence file

Do not hardcode repo-specific paths.

## First Activation

1. Read the sprint file fully enough to understand phases, gates, and completion criteria.
2. Create the overseer log if it does not exist with this header:

```md
# Sprint Overseer Log

Sprint file: {sprint_file}
Manager session: {manager_session}
Started: {timestamp}
Team done marker: {done_marker}
Overseer stop marker: {stop_marker}
```

3. Append the first checkpoint entry.

## Periodic Check-In

On every wake-up, perform these steps:

1. Re-read the sprint file to identify the expected current phase and gates.
2. Inspect the manager terminal (`manager_session`).
3. Inspect worker tmux sessions matching `sprint_team_pattern`.
4. Inspect evidence progress in `{sprint_dir}/evidence/`.
5. Classify the sprint state:
   - `on-track`: active work or clear progress
   - `off-track`: active work, but on the wrong thing or looping
   - `idle/stalled`: no material progress for 15+ minutes across manager, workers, and evidence
   - `team-complete / overseer-open`: the sprint team appears done, but the overseers still owe final health/evidence review, peer coordination, or final closeout
6. Act:
   - `on-track`: log only
   - `off-track`: log and send a specific nudge to the manager
   - `idle/stalled`: log and send a wake-up nudge to the manager
   - `team-complete / overseer-open`: stop nudging the team, coordinate Joint ACK with the peer overseer, and write the overseer closeout if the final review is green

## Nudge Rules

- Quiet output is not automatically idleness.
- Check worker sessions before deciding the manager is stalled.
- Nudge only for confirmed stalls or clear drift.
- Nudge the lead only.
- Be specific: say what you observed and what the sprint expects next.

Use the repo comms helpers when available:

```bash
node interlateral_dna/cc.js send "message"
node interlateral_dna/codex.js send "message"
node interlateral_dna/gemini.js send "message"
```

## Stop Condition

Stop when either:
- the configured overseer stop file exists and contains `stop_marker`
- the human explicitly redirects or pauses the overseer

When the team evidence file reaches `done_marker` but the overseer stop file does not yet contain `stop_marker`, continue running. At that point your job changes from team progress monitoring to final overseer closeout and Joint ACK coordination.

When the stop condition is met, append a final checkpoint entry.

## Checkpoint Format

Append every check-in to `{sprint_dir}/sprint-overseer-log.md`:

```md
## {timestamp} — Checkpoint {N}

**Sprint phase:** {phase}
**Manager ({manager_session}):** {active / waiting / idle}
**Worker sessions:** {sessions and status}
**Evidence progress:** {latest artifacts and markers}
**Classification:** {on-track / off-track / idle-stalled / team-complete-overseer-open}
**Action taken:** {none / nudge sent / escalation noted}
```

Keep entries concise and scannable.

## Recommended Mechanical Wake-Up

Use the reusable timer in this repo:

```bash
scripts/sprint_overseer.sh /abs/path/to/sprint.md \
  --manager ia-claude \
  --overseer ia-codex \
  --closeout-file /abs/path/to/project/docs/evidence/sprint3_proof.md \
  --done-marker "STATUS: DONE" \
  --stop-file /abs/path/to/project/docs/evidence/sprint3_overseer_closeout.md \
  --stop-marker "STATUS: OVERSEER-DONE" \
  --interval 300
```

The timer only wakes the overseer. You still do the actual review and logging.

## Example Prompt

```text
Use the sprint-overseer skill.
Sprint file: /Users/dazza/repos/project/docs/sprint.md
Manager session: ia-claude
Sprint team pattern: s3-*
Poll interval: every 5 minutes
Closeout file: /Users/dazza/repos/project/docs/evidence/sprint3_proof.md
Done marker: STATUS: DONE
Stop file: /Users/dazza/repos/project/docs/evidence/sprint3_overseer_closeout.md
Stop marker: STATUS: OVERSEER-DONE
```

## Safety

- Do not execute sprint work yourself.
- Do not edit the sprint spec.
- Do not edit team evidence files except when the sprint explicitly designates an overseer closeout artifact as yours to write.
- Only write the overseer log and the designated overseer closeout artifact.
- If you cannot determine status confidently, say so in the log.

## Final Status Format

```text
SKILL: sprint-overseer
STATUS: SPRINT COMPLETE
CHECKPOINTS: {N}
NUDGES SENT: {count}
SPRINT FILE: {path}
LOG FILE: {path}
```
