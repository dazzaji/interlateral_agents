---
name: hierarchical
description: Boss delegates tasks to workers, reviews their output, and approves or requests changes.
metadata:
  owner: interlateral
  version: "1.0"
  weight: medium
compatibility: Two to four explicitly selected agents. Default to Claude Code + Codex peers; Gemini and Antigravity are opt-in only when the human explicitly selects them.
---

# Hierarchical

## Purpose

A structured delegation pattern where a boss agent assigns work to worker agents, reviews their output, and makes final approval decisions. Clear chain of command.

Use `mesh-comms-core` first if direct worker notification has not already been proven. `comms.md` is the ledger, not the wake-up path.

Default roster: use Claude Code and Codex peers. Do not assign Gemini CLI,
Antigravity CLI, or Antigravity Desktop as boss or worker unless the human
prompt explicitly names that peer.

## Roles

| Role | Description |
|------|-------------|
| `BOSS` | Delegates tasks, reviews work, approves or rejects |
| `WORKER` | Receives assignment, executes, submits for review |

One BOSS, one or more WORKERs.

## Protocol

```
1. DELEGATION: BOSS assigns specific tasks to each WORKER
2. EXECUTION: WORKERs complete their assigned tasks
3. SUBMISSION: WORKERs submit work with [SUBMIT]
4. REVIEW: BOSS reviews each submission
5. DECISION: BOSS signals [APPROVE] or [REVISE: feedback]
6. ITERATE: If revisions needed, WORKERs address and resubmit
7. COMPLETE: When all work approved, BOSS signals [DONE]
```

### Delegation Format

```
[DELEGATION - BOSS]
@WORKER_1: [Task description]
@WORKER_2: [Task description]
DEADLINE: [Turn count or "when ready"]
ACCEPTANCE CRITERIA: [What "done" looks like]
```

### Submission Format

```
[SUBMIT - WORKER]
TASK: [What was assigned]
DELIVERABLE: [The work product]
NOTES: [Any caveats or questions]
```

### Review Format

```
[REVIEW - BOSS]
@WORKER: [APPROVE] or [REVISE]
FEEDBACK: [What's good, what needs work]
```

## Inputs

All inputs come from the prompt.

**Optional:**
- `output`: File path for final deliverable
- `work`: File containing the overall goal
- `max_turns`: Override default (30)

## Prompt Format Examples

### Minimal:
```
Use hierarchical to build a landing page.
CC is BOSS. CX and CC-peer-02 are WORKERs.
```

### With specific tasks:
```
Use hierarchical for code review workflow.
BOSS=CC (Tech Lead).
WORKER=CX (implements feature).
WORKER=CC-peer-02 (writes tests).
Output: projects/feature/implementation.md
```

## Safety

- **max_turns:** 30 (default)
- **Stuck reviews:** If BOSS doesn't respond, WORKERs may escalate with [ESCALATE]
- **Status logged to:** direct notification plus `comms.md`

## Example Session

```
[DELEGATION - CC (BOSS)]
Project: Create a press release for our new AI product.

@CX: Write the headline and first paragraph (hook)
@CC-peer-02: Write the product details and features section

ACCEPTANCE CRITERIA:
- Compelling headline (under 10 words)
- Clear value proposition
- Three key features highlighted

[SUBMIT - CX]
TASK: Headline and hook
DELIVERABLE:
# AI Agents That Actually Collaborate

Today we announce Interlateral, the first multi-agent framework
where AI systems work together like a real team.

NOTES: Went for impact over cleverness.

[SUBMIT - CC-peer-02]
TASK: Product details and features
DELIVERABLE:
## Key Features

1. **Natural Collaboration** - Agents communicate in plain language
2. **Design Patterns** - Pre-built patterns for common workflows
3. **Observable** - Full visibility into agent interactions

NOTES: Kept it to three as requested.

[REVIEW - CC (BOSS)]
@CX: [APPROVE] - Headline is strong. Good hook.
@CC-peer-02: [REVISE] - Add one more feature about safety/reliability.

[SUBMIT - CC-peer-02]
TASK: Revised features
DELIVERABLE:
## Key Features

1. **Natural Collaboration** - Agents communicate in plain language
2. **Design Patterns** - Pre-built patterns for common workflows
3. **Observable** - Full visibility into agent interactions
4. **Fail-Safe** - Built-in safeguards prevent runaway processes

NOTES: Added safety feature as requested.

[REVIEW - CC (BOSS)]
@CC-peer-02: [APPROVE] - Perfect.

[DONE] - All work approved. Compiling final document.
```

## Final Status Format

```
SKILL: hierarchical
STATUS: DONE
TURNS: 6
OUTPUT: projects/press/release.md
PARTICIPANTS: CC (BOSS), CX (WORKER), CC-peer-02 (WORKER)
SUBMISSIONS: 3
APPROVALS: 3
REVISIONS: 1
```
