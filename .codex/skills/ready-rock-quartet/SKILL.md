---
name: ready-rock-quartet
description: Boot a four-agent visible-terminal team, get all four to "Ready to Rock!", lock live session names to roles, and launch a Lead/Reviewer/Breaker/Verifier sprint without mandate drift.
metadata:
  owner: interlateral
  version: "1.0"
  weight: medium
compatibility: Four live agents in visible terminals, preferably two Codex and two Claude, with a shared comms surface.
---

# Ready Rock Quartet

## Purpose

Use this skill when you need a four-agent execution team that humans can see and type into directly.

This pattern is optimized for:
- visible terminal boot
- explicit role lock
- clean peer-to-peer comms
- a single lead with three support roles
- preventing non-lead agents from improvising while waiting for coordination

This is the house pattern for:
- `LEAD`
- `REVIEWER`
- `BREAKER`
- `VERIFIER`

## When To Use

Use this skill when all of the following are true:
- you want exactly four live agents
- the human should be able to see each terminal
- the team needs explicit role ownership
- the task has a real execution artifact or command sequence to review
- premature side exploration would be risky

Do not use this skill for:
- two-agent drafting
- blind headless swarms
- loose brainstorming without a concrete artifact

## Recommended Team Shape

Preferred roster:
- Codex as `LEAD`
- Claude as `REVIEWER`
- Codex as `BREAKER`
- Claude as `VERIFIER`

Recommended session naming:
- `13-codex-lead` -> `LEAD`
- `13-claude-reviewer` -> `REVIEWER`
- `13-codex-breaker` -> `BREAKER`
- `13-claude-verifier` -> `VERIFIER`

Why this naming is better:
- it avoids collisions with already-running `ia-*` house sessions
- the role is obvious from the session name
- the `13-` prefix ties the team to Skill 13 and makes the quartet easy to spot in tmux

If different session names are used, lock them explicitly in the sprint prompt.

## House Bootstrap Recipe

In this repo, the practical launch path is:

```bash
./scripts/launch-codex-peer.sh 13-codex-lead "Read AGENTS.md first, then wait for instructions."
./scripts/launch-codex-peer.sh 13-codex-breaker "Read AGENTS.md first, then wait for instructions."
./scripts/launch-cc-peer.sh 13-claude-reviewer "Read CLAUDE.md first, then wait for instructions."
./scripts/launch-cc-peer.sh 13-claude-verifier "Read CLAUDE.md first, then wait for instructions."
```

To expose each session in a visible Terminal.app window:

```bash
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-codex-lead "Skill 13 Codex Lead"
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-codex-breaker "Skill 13 Codex Breaker"
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-claude-reviewer "Skill 13 Claude Reviewer"
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-claude-verifier "Skill 13 Claude Verifier"
```

### Important Launcher Caveat

Fresh peer launchers create sessions, but they do **not** automatically establish pair-specific cross-peer wake-up behavior.

Do not assume:
- `13-codex-lead` will automatically watch `13-claude-reviewer`
- `13-claude-verifier` will automatically target `13-codex-breaker`

You must explicitly pair them in the wake-up prompt.

## Boot Sequence

### 1. Launch Four Unique Sessions

Use unique visible sessions. Avoid ambiguous names.

Preferred names:
- `13-codex-lead`
- `13-codex-breaker`
- `13-claude-reviewer`
- `13-claude-verifier`

### 2. Pair The Wake-Up Handshake

Do not leave comms implicit.

Pair them:
- `13-codex-lead` <-> `13-claude-reviewer`
- `13-codex-breaker` <-> `13-claude-verifier`

Each pair must complete the local wake-up handshake and visibly print:

```text
Ready to Rock!
```

Do not treat the team as live until all four terminals visibly show that line.

### 2.5 Submission Rule

For programmatic input into agent TUIs, do **not** rely on a raw `tmux send-keys ... Enter`.

Use one of:
- repo control scripts under `interlateral_dna/`
- helpers from `scripts/tmux-config.sh`
- the Escape-then-Enter pattern from `interlateral_dna/LIVE_COMMS.md`

Otherwise text may remain in the input box and not submit.

### 3. Lock The Roster Before Tasking

Before sending the sprint prompt, publish a live roster block:

```text
Live team roster for this sprint:
- Lead / Orchestrator / Integrator: 13-codex-lead
- Reviewer: 13-claude-reviewer
- Breaker: 13-codex-breaker
- Verifier: 13-claude-verifier
- Use these exact session names for direct comms and role ownership.
- Do not reassign roles unless the human explicitly says to.
```

Without this block, the lead may not know which live peers are "the other three."

## Launch Contract

The lead gets the full sprint prompt.

The other three do **not** get the full prompt first. They get role notices.

Initial role notices should be short:
- `REVIEWER`: wait for lead coordination, then review the concrete command sequence and artifact
- `BREAKER`: wait for lead coordination, then attack the command sequence for hidden traps
- `VERIFIER`: wait for lead coordination, then check adherence against the spec and deploy contract

This prevents the support agents from acting like shadow leads.

Recommended role notices:

```text
REVIEWER:
You are the REVIEWER. Wait for the lead's coordination, then review the concrete command sequence, derived values, and artifact only.
```

```text
BREAKER:
You are the BREAKER. Wait for the lead's coordination and execution artifact. Do not compensate for missing coordination with ad hoc live probing. Report blockers and hidden traps tied to the artifact only.
```

```text
VERIFIER:
You are the VERIFIER. Wait for the lead's coordination and artifact. Verify adherence to the spec and contract. Do not perform independent execution unless the lead explicitly requests it.
```

## Mandatory Coordination Surface

Before non-lead agents do substantial work, the lead must publish:
- the execution artifact path
- the concrete command sequence or draft artifact
- the review request

Examples:
- execution log
- plan file
- spec draft
- rollout runbook

If the lead has not yet published the artifact, support agents should stay in a waiting posture and only do minimal prerequisite reading.

## Anti-Drift Rule

This is the most important lesson from the pattern.

When support agents are waiting, they must **not compensate for missing coordination by expanding scope on their own**.

Bad waiting behavior:
- ad hoc live infrastructure probing
- independent auth/setup work
- speculative implementation
- trying to become a second lead

Good waiting behavior:
- confirm role
- read the named spec or skill
- identify missing prerequisites
- wait for the lead artifact

## Prompt Language To Prevent Drift

Use language this explicit when tasking support agents:

```text
Wait for the lead's coordination and execution artifact before doing substantial work.
Do not compensate for missing coordination with ad hoc live probing, implementation, or infra discovery.
Stay anchored to the named artifact, spec, and your role only.
If a prerequisite is missing, report it as a blocker instead of expanding scope.
```

Use role-specific variants:

### Reviewer Prompt Add-On

```text
You are the REVIEWER. Wait for the lead's coordination, then review the concrete artifact and command sequence only. Do not invent alternate plans or perform live execution.
```

### Breaker Prompt Add-On

```text
You are the BREAKER. Wait for the lead's coordination and execution artifact. Do not compensate for missing coordination with ad hoc live probing. Report concrete blockers, hidden traps, and failure modes tied to the artifact only.
```

### Verifier Prompt Add-On

```text
You are the VERIFIER. Wait for the lead's coordination and artifact. Verify adherence to the spec and contract. Do not perform independent execution unless the lead explicitly requests it.
```

## Lead Responsibilities

The lead must do all of the following early:

1. Publish the execution artifact.
2. Record the roster in the artifact.
3. Make the concrete command sequence visible before any risky mutation.
4. Request passes from reviewer, breaker, and verifier explicitly.
5. Reconcile objections in the artifact before proceeding.

If the lead delays artifact publication, support agents will either idle too long or drift.

## Recommended Sequence

```text
1. Launch four named sessions
2. Pair wake-up handshakes
3. Confirm all four show "Ready to Rock!"
4. Publish live roster
5. Send full sprint prompt to LEAD only
6. Send short role notices to REVIEWER, BREAKER, VERIFIER
7. LEAD creates execution artifact
8. LEAD posts concrete command sequence
9. REVIEWER / BREAKER / VERIFIER respond
10. LEAD reconciles and only then proceeds
```

## Human Operator Checks

The human should verify:
- all four terminals are visible
- all four terminals show `Ready to Rock!`
- each role is mapped to a specific live session
- the lead has published an execution artifact before risky work starts
- support agents are working from role-specific prompts, not improvising

## Completion Criteria

This skill is complete when:
- [ ] four visible terminals are live
- [ ] all four have printed `Ready to Rock!`
- [ ] live roster is explicit
- [ ] lead has the full sprint prompt
- [ ] reviewer, breaker, and verifier have role-specific prompts
- [ ] execution artifact exists
- [ ] support agents are anchored to the artifact
- [ ] no support agent is drifting beyond mandate

## Example Prompt

```text
Use the ready-rock-quartet skill.

Goal:
Launch a four-agent execution team for the Jot subdomain sprint.

Live roster:
- Lead / Orchestrator / Integrator: 13-codex-lead
- Reviewer: 13-claude-reviewer
- Breaker: 13-codex-breaker
- Verifier: 13-claude-verifier

Artifact:
/abs/path/to/execution_log.md

Lead:
- receives the full sprint prompt
- must publish the execution artifact and concrete command sequence before any risky mutation

Reviewer / Breaker / Verifier:
- wait for lead coordination
- do not compensate for missing coordination with ad hoc probing or implementation
- report blockers instead of expanding scope
```

## Final Status Format

```text
SKILL: ready-rock-quartet
STATUS: DONE
TEAM:
- LEAD: 13-codex-lead
- REVIEWER: 13-claude-reviewer
- BREAKER: 13-codex-breaker
- VERIFIER: 13-claude-verifier
READY_CHECK: 4/4 terminals showed "Ready to Rock!"
ARTIFACT: /abs/path/to/execution_log.md
ROLE_LOCK: CONFIRMED
DRIFT_STATUS: CONTROLLED
```
