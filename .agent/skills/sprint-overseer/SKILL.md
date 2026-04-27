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
   - `team-complete-overseer-open`: the sprint team appears done, but the overseers still owe final health/evidence review, peer coordination, or final closeout
6. Act:
   - `on-track`: log only
   - `off-track`: log and send a specific nudge to the manager
   - `idle/stalled`: log and send a wake-up nudge to the manager
   - `team-complete-overseer-open`: stop nudging the team, coordinate Joint ACK with the peer overseer, and write the overseer closeout if the final review is green

When the team appears substantively complete but has not marked `done_marker`, the overseers may use the Override Authority below to break deadlock.

## Nudge Rules

- Quiet output is not automatically idleness.
- Check worker sessions before deciding the manager is stalled.
- Nudge only for confirmed stalls or clear drift.
- Nudge the lead only. Workers do not receive overseer nudges.
- Be specific: say what you observed and what the sprint expects next.

Use the repo comms helpers when available:

```bash
node interlateral_dna/cc.js send "message"
node interlateral_dna/codex.js send "message"
node interlateral_dna/gemini.js send "message"
```

### Lead Self-Nudge

If the overseer is also the sprint lead, write the checkpoint first, then send the nudge to your own active session or treat the next turn as the nudge response.

The self-nudge must still be concrete:
- what is stalled or drifting
- what the sprint expects next
- what artifact or command sequence should be updated

Do not use self-nudge authority to expand scope or skip evidence.

### Cadence Discipline

Default polling cadence is 5 minutes. Acceptable human-configured range is 3 to 5 minutes unless the sprint explicitly says otherwise.

Do not poll more often than every 3 minutes for normal oversight. Faster polling increases duplicate nudges and false stall classification.

Every wake-up writes a checkpoint entry with:
- `Classification`
- `Action taken`

Even when no action is taken, record `Action taken: none`.

## Stop Condition

Stop when either:
- the configured overseer stop file exists and contains `stop_marker`
- the human explicitly redirects or pauses the overseer

When the team evidence file reaches `done_marker` but the overseer stop file does not yet contain `stop_marker`, continue running. At that point your job changes from team progress monitoring to final overseer closeout and Joint ACK coordination.

When the team evidence file has not reached `done_marker`, but the overseers invoke Override Authority, treat that as functionally equivalent to team completion for the purpose of final Joint ACK and overseer closeout. This may happen either through coordinated use by both overseers or through the lone-overseer fallback described below.

When no heartbeat file is present (empty-file tick between heartbeats), write a
short-form tick entry to the log anyway so the log proves the overseer is alive
between heartbeats. A gap in the log means the overseer was dead — not that
nothing happened.

When the stop condition is met, append a final checkpoint entry.

## Overseer Override Authority

If the team has not marked `done_marker` in the team evidence file but the overseers judge the sprint objectives met — based on the declared health checks, acceptance criteria, regression surfaces, and live endpoint verification — the overseers are authorized to:

1. Write the team's `done_marker` into the team evidence file themselves, with a note: `OVERRIDE-BY-OVERSEERS: <reason>`.
2. Immediately switch to Joint Overseer ACK and closeout.

This authority exists to prevent a single stuck or pedantic team agent from silently blocking the entire overseer completion path. The overseers have final say on whether a sprint is done, not the team.

**When to use:** Prefer coordinated use by both overseers after they independently verify that the sprint's acceptance criteria are met via live checks. If only one overseer is active, that overseer may invoke the authority only after two consecutive check-ins with no team progress and a complete live verification. Never use to skip genuinely incomplete work.

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

Every wake-up writes a log entry — including empty-file ticks where no heartbeat
is pending. Use a one-paragraph short form for those so the log proves the
overseer is alive between heartbeats. Example: `"Cron tick — no heartbeat pending.
Team status: on-track, LEAD actively coding. No action."`

Keep entries concise and scannable.

## Who Starts the Timer (MANDATORY)

**The overseer timer is mandatory for every sprint. An agent cannot decide to skip it. Only the human owner (Dazza) can waive this requirement.**

The timer MUST be started by the **human operator or the overseer boot script** BEFORE the team boot sequence begins. The timer must show at least one "Timer alive" entry in its log before the first team prompt is injected.

**Startup order:**
1. Start the overseer timer(s)
2. Verify timer log shows "PREFLIGHT PASSED" and "Timer alive"
3. THEN boot the team sessions
4. THEN inject the lead prompt

If an agent proposes skipping the timer (e.g., "we'll supervise manually"), that proposal MUST be rejected unless Dazza explicitly approves. Manual supervision without a mechanical wake-up is not viable — agent sessions will go idle and nothing will wake them.

Before any overnight sprint or new overseer topology, run `scripts/heartbeat_validation_harness.sh` first to prove visible injection and HEARTBEAT_ID acknowledgment on the real target CLI session.

**The timer runs the heartbeat acknowledgment protocol:** Each heartbeat carries a unique HEARTBEAT_ID. The overseer must echo that ID in their checkpoint log entry. A cycle counts as successful only when the ID appears in the overseer log. If 3 consecutive heartbeats receive no acknowledgment, the timer logs a WARNING to comms.md for escalation.

## Recommended Mechanical Wake-Up

The timer supports two delivery paths depending on the overseer's CLI:

### Codex CLI overseers — tmux injection (default)

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

This uses the existing Escape-then-Enter tmux injection, which is proven reliable for Codex (9/9 ACKs in validation).

### Claude Code CLI overseers — native `/loop` + file polling

Claude Code v2.1.101+ does not reliably process tmux-injected prompts as fresh turns when idle. The validated workaround uses `/loop` inside the TUI with a shared file:

**Timer side** (adds `--native-file`):
```bash
scripts/sprint_overseer.sh /abs/path/to/sprint.md \
  --manager ia-codex \
  --overseer ia-claude \
  --native-file /path/to/workdir/sprint_heartbeat_command.txt \
  --closeout-file /abs/path/to/project/docs/evidence/sprint3_proof.md \
  --done-marker "STATUS: DONE" \
  --stop-file /abs/path/to/project/docs/evidence/sprint3_overseer_closeout.md \
  --stop-marker "STATUS: OVERSEER-DONE" \
  --interval 300
```

**Claude side** (type into TUI):
```
/loop 60s Read /path/to/workdir/sprint_heartbeat_command.txt — if the file
exists and has content, treat it as a heartbeat prompt: follow the instructions
in the file, write HEARTBEAT_ID + ACK to the overseer log, then DELETE the file.
If the file is missing or empty, output: heartbeat check — no pending command
```

**Interval guidance:** `/loop` interval should be ≤ half the timer interval. For `--interval 300`, use `/loop 60s` to `/loop 120s`. For validation (`--interval 30`), use `/loop 15s` (rounded to 1m by cron minimum).

**File detection:** Read-and-delete. The loop reads the file, acts on it, deletes it. Next cycle sees no file = no action. No mtime tracking or state between iterations.

**Note:** Claude's TUI injection path (`agent_send_long`) is preserved in `sprint_overseer.sh` for future Channels integration but is not used for heartbeats when `--native-file` is set. `/loop` is session-scoped — if the Claude session crashes, `/loop` must be re-registered as part of overseer startup.

### Common to both paths

The timer runs a launch preflight check (verifies session exists, pane is CLI, stop marker absent) before entering the main loop. It logs "Timer alive" each cycle independent of injection success, making stale timers detectable. The timer only wakes the overseer — you still do the actual review and logging.

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
- Do not edit team evidence files except:
  1. when the sprint explicitly designates an overseer closeout artifact as yours to write, or
  2. when both overseers invoke Override Authority and write the team's `done_marker` with an `OVERRIDE-BY-OVERSEERS:` note.
- Only write the overseer log, the designated overseer closeout artifact, and the narrow override note described above.
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
