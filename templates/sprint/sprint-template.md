# Sprint Template

Use this template as a starting point. Delete sections that do not apply. Add optional modules only when the task risk justifies them.

Chosen process level: Level N
Why this level fits:
- 

## Purpose

What this sprint is for:
- 

## Goals

- 
- 
- 

## Non-Goals

- 
- 

## Scope

Files or areas to read:
- 

Files or areas expected to change:
- 

Files or areas out of scope:
- 

## Roles

Use only the roles needed.

- Lead:
- Reviewer:
- Breaker:
- Verifier:
- Overseer, if used:
- Gatekeepers, if used:

Within the stated scope, agents should proceed using good judgment. Ask for help only when there is real ambiguity, a human-only decision, or a concrete risk outside the scope.

## Comms Rule

Live-send first; ledger second. A handoff, vote, review, or blocker does not count if it only appears as pane text or in a flat file. Use the mesh helper or another proven direct channel, and mirror the result to the ledger when available.

## Human-Only Decisions

- 

## Success Criteria

This sprint is done when:
- 
- 
- 

## Work Plan

### Step 1: Context

Read the source files and confirm the intended process level still fits the risk.

### Step 2: Implement

Make the smallest change that satisfies the purpose and success criteria.

### Step 3: Review

Use the review weight appropriate to the level:
- Level 0-1: self-check or peer check.
- Level 2: reviewer, breaker, and verifier check the concrete artifact.
- Level 3-4: include overseer or gatekeeper modules only where justified.

### Step 4: Closeout

Record:
- what changed;
- what was intentionally left simple;
- what remains optional or deferred;
- what the human must decide, if anything;
- verification performed.
- if a timer or watcher was started at any point in the sprint, verify the Supervisor Exit Contract even if the sprint was later downgraded.

## Optional Module: Adversarial Review

Use when the sprint needs role-separated review.

Skip when a normal self-check or peer review is enough.

Roles:
- Reviewer checks clarity, fit, and likely user outcome.
- Breaker looks for failure modes, ambiguity, and overreach.
- Verifier checks adherence to the sprint spec and success criteria.

## Optional Module: Overseer / Liveness

Use when the sprint may run unattended, involve several handoffs, or risk silent stalls.

Skip when the work fits in a short active session.

Define:
- manager session:
- worker session pattern:
- poll interval:
- closeout file:
- done marker:
- stop file:
- stop marker:

If a mechanical timer or watcher is used, you MUST complete the Supervisor Exit Contract below. Closeout is not done without it.

## Optional Module: Supervisor Exit Contract

Use when overseers, timers, watchers, or long-running agents are active.

Skip when a simple closeout is enough.

Required contract:
- supervisor process or launch command:
- watched closeout file:
- watched stop file, if separate:
- literal done marker:
- literal stop marker:
- role responsible for writing the done marker:
- role responsible for writing the stop marker:
- command or check that proves the supervisor stopped:

Closeout is not complete until the exact marker strings from this contract exist in the watched files and a process/log check confirms no supervisor is still running for this sprint.

## Optional Module: Gatekeepers

Use when an action needs delegated human judgment because it affects live systems, credentials, spend, destructive changes, public-facing behavior, or hard-to-reverse state.

Skip for ordinary docs, local code, or reversible work.

For each gate:
- gate name:
- action being approved:
- evidence required:
- rollback or recovery path:
- forbidden actions:
- expiry or invalidation condition:

## Optional Module: Rollback / Recovery

Use when a wrong change would be costly or hard to reverse.

Skip when `git diff` or ordinary revert is enough.

Record:
- previous state:
- proposed change:
- rollback command or recovery path:
- verification before and after:

## Optional Module: Deploy Safety

Use for live infra, public endpoints, production data, credentials, money, or externally visible systems.

Skip for local-only work.

Checklist:
- credentials and secrets are not printed or committed;
- target environment is explicit;
- preflight confirms current state;
- command sequence has timeouts;
- smoke tests are named;
- rollback or recovery path is known before mutation.

## Optional Module: Simple State Table

Use when a sprint has several handoffs or gates.

Skip for short linear work.

| Item | Owner | State | Next action |
| --- | --- | --- | --- |
|  |  |  |  |

## Optional Module: Extended Definition Of Done

Use for high-risk or multi-role sprints.

Skip when the closeout list above is enough.

Example checks:
- success criteria satisfied;
- tests or manual checks passed;
- evidence path recorded;
- human-only decisions identified;
- open risks documented;
- supervisor exit contract satisfied, if used.

## Optional Module: Autonomous / Level 3+ Controls

Skip this Level 3+ module cluster for ordinary Level 0-2 work.

Use when work is autonomous, live-risk, credential-bearing, delegated,
long-running, or hard to reverse.

Keep this cluster short. If these controls need more than terse fields, move
them to `templates/sprint/autonomous-sprint-template.md` and leave only a
pointer here.

### Step 0 Preflight

Purpose: prove prerequisites before tasking agents.
Skip when local context and permissions are already obvious.

Record:
- required credentials or logins:
- access checks already passed:
- current git status:
- current runtime/service state, if relevant:

### Declared Write Roots And Forbidden Adjacent Actions

Purpose: keep autonomous edits inside the intended surface.
Skip when a normal small edit has an obvious single file or directory.

Record:
- allowed write roots:
- files or directories explicitly out of scope:
- forbidden adjacent actions:

### Credential Readiness

Purpose: avoid mid-sprint stalls caused by missing auth.
Skip when the task does not touch credentials, cloud auth, secret stores, or
credential-bearing docs/scripts.

Record:
- credentials needed:
- readiness check:
- fallback if auth expires:
- secret-handling rule:

### Controller Triage

Purpose: handle ambiguous Reviewer/Breaker findings without process drift.
Skip when findings are clear, low-risk, and directly patchable.

Use controller triage for:
- live-risk, credential-bearing, or authority-ambiguous findings;
- repeated materiality disputes;
- proposed scope expansion.

### Verifier-Last Closeout

Purpose: keep final verification independent after revisions settle.
Skip when the chosen process level only needs self-check or peer-check.

Record:
- verifier artifact:
- final evidence checked:
- remaining residual risk:

### SHA Sidecar Pinning

Purpose: pin reviewed prompts, specs, packets, or evidence that must not drift.
Skip when ordinary git diff/review is enough.

Record:
- artifact:
- SHA-256:
- when to refresh:
