---
name: democratic
description: All agents have equal voice; decisions made by majority vote.
metadata:
  owner: interlateral
  version: "1.0"
  weight: medium
compatibility: Three or more agents (CC, CX, GM, AG)
---

# Democratic

## Purpose

A collaborative pattern where all agents have equal standing. Proposals are discussed openly and decisions are made by majority vote. No single agent has veto power.

## Roles

| Role | Description |
|------|-------------|
| `MEMBER` | Equal participant with one vote |
| `FACILITATOR` | (Optional) Manages discussion flow, calls votes |

All MEMBERs are equal. FACILITATOR has no extra voting power, just keeps things moving.

## Protocol

```
1. PROPOSAL: Any member may propose an idea or decision
2. DISCUSSION: Open discussion, all voices heard
3. CALL VOTE: Any member may call [VOTE] on a proposal
4. VOTING: All members vote [YES], [NO], or [ABSTAIN]
5. TALLY: Majority wins (>50% of non-abstaining votes)
6. RECORD: Decision recorded, move to next item
7. COMPLETE: When all items resolved, any member may call [DONE]
```

### Proposal Format

```
[PROPOSAL - AGENT] #ID
TITLE: [Brief title]
DESCRIPTION: [What you're proposing]
RATIONALE: [Why this is a good idea]
```

### Vote Call Format

```
[VOTE] on Proposal #ID
All members please vote.
```

### Voting Format

```
[YES/NO/ABSTAIN - AGENT] on #ID
REASON: [Optional explanation]
```

## Inputs

All inputs come from the prompt.

**Optional:**
- `output`: File path for decisions document
- `work`: File containing agenda/items to decide
- `max_turns`: Override default (30)

## Prompt Format Examples

### Minimal:
```
Use democratic to decide on project priorities.
Members: CC, CX, GM.
```

### With facilitator:
```
Use democratic for team retrospective.
FACILITATOR=CC. Members: CC, CX, GM.
Items: What went well, What to improve, Action items.
Output: projects/retro/decisions.md
```

## Safety

- **max_turns:** 30 (default)
- **Tie handling:** FACILITATOR breaks ties, or re-discuss
- **Quorum:** All members must vote (ABSTAIN counts as participation)
- **Status logged to:** comms.md

## Example Session

```
[FACILITATOR - CC]
Welcome to the team decision meeting.
Agenda: Choose our next sprint focus.

[PROPOSAL - CX] #1
TITLE: Focus on Performance
DESCRIPTION: Spend next sprint on optimization and benchmarking
RATIONALE: Users complaining about slow load times

[PROPOSAL - GM] #2
TITLE: Focus on Security Audit
DESCRIPTION: Review and harden authentication/authorization
RATIONALE: We're handling sensitive data, need to be proactive

[DISCUSSION - CC]
Both valid concerns. Performance affects UX daily.
Security is critical but less visible until it's a problem.

[DISCUSSION - CX]
Security audit could be done by external team.
Performance needs our specific codebase knowledge.

[DISCUSSION - GM]
External audit is expensive. We know our code best.
But I see the performance point.

[VOTE] on Proposal #1 (Performance Focus)

[YES - CC] on #1
REASON: Direct user impact, measurable improvement

[YES - CX] on #1
REASON: I proposed it, still believe it's priority

[NO - GM] on #1
REASON: Security should come first, but I accept the group decision

RESULT: #1 PASSES (2-1)

[FACILITATOR - CC]
Performance focus approved for next sprint.
GM, we'll schedule security audit for sprint after next.

[DONE] - All agenda items resolved.
```

## Final Status Format

```
SKILL: democratic
STATUS: DONE
TURNS: 10
OUTPUT: projects/sprint/decisions.md
PARTICIPANTS: CC, CX, GM
PROPOSALS: 2
VOTES_HELD: 1
DECISIONS_MADE: 1
```
