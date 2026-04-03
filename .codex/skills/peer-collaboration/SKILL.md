---
name: peer-collaboration
description: Two agents co-create an artifact through turn-based iteration until both signal DONE.
metadata:
  owner: interlateral
  version: "1.0"
  weight: light
compatibility: Any two agents (CC, CX, GM, AG)
---

# Peer Collaboration

## Purpose

Two agents work together as equals to co-create a single artifact. They take turns proposing, reacting, and refining until both agree the work is complete.

## Roles

| Role | Description |
|------|-------------|
| `PEER_A` | Initiates the first draft, proposes ideas |
| `PEER_B` | Responds, modifies, extends, challenges |

Both roles are equal. Either can propose changes. Neither has authority over the other.

## Protocol

```
1. PEER_A proposes initial draft (2-3 key points or sections)
2. PEER_B reacts: agrees, modifies, or challenges; adds 1-2 points
3. PEER_A responds to feedback, refines draft
4. Continue alternating until BOTH signal [DONE]
```

### Turn Format

Each turn should include:
- What you're adding/changing
- Why (brief rationale)
- The updated artifact (or diff)

### Termination

- Either agent may propose `[DONE]` when they believe the artifact is complete
- The other agent must confirm with `[DONE]` to end
- If the other agent disagrees, they explain why and the iteration continues

## Inputs

All inputs come from the prompt. No structured inputs required.

**Optional:**
- `output`: File path to save the final artifact
- `work`: File path containing detailed requirements
- `max_turns`: Override default (20)

## Prompt Format Examples

### Minimal:
```
Build a todo API spec. Use peer-collaboration. CC + CX.
```

### With output:
```
Use peer-collaboration to write a haiku about recursion.
CC is PEER_A, GM is PEER_B.
Output: projects/haiku/recursion.md
```

### With work file:
```
Use peer-collaboration.
Work: projects/api/requirements.md
CC is PEER_A, CX is PEER_B.
Output: projects/api/spec.md
```

## Safety

- **max_turns:** 20 (default). If reached, skill exits with `[INCOMPLETE]`
- **Status logged to:** comms.md

## Example Session

```
[PEER_A - CC]
Proposing initial draft for todo API:

1. GET /todos - List all todos
2. POST /todos - Create new todo
3. DELETE /todos/:id - Remove todo

[PEER_B - CX]
Good start. Modifications:
- Add PUT /todos/:id for updates
- Add query param ?completed=true/false to GET

Updated:
1. GET /todos?completed=bool - List todos (filterable)
2. POST /todos - Create todo
3. PUT /todos/:id - Update todo
4. DELETE /todos/:id - Remove todo

[PEER_A - CC]
Agreed. Adding response formats:
- All endpoints return JSON
- Include created_at, updated_at timestamps
- 201 for POST, 204 for DELETE

[DONE] - I think this covers our needs.

[PEER_B - CX]
[DONE] - Confirmed. Artifact complete.
```

## Final Status Format

```
SKILL: peer-collaboration
STATUS: DONE
TURNS: 4
OUTPUT: projects/api/spec.md
PARTICIPANTS: CC (PEER_A), CX (PEER_B)
```
