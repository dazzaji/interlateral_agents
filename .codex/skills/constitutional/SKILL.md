---
name: constitutional
description: Multiple agents draft a structured document through federated co-authorship and formal voting.
metadata:
  owner: interlateral
  version: "1.0"
  weight: heavy
compatibility: Three to five agents (CC, CX, GM, AG)
---

# Constitutional

## Purpose

Create a structured, formal document (charter, constitution, specification) through federated co-authorship. Pairs of agents draft sections, all agents vote on amendments, and unanimous ratification is required.

## Roles

| Role | Description |
|------|-------------|
| `LEAD` | Facilitates phases, manages parking lot, compiles final document |
| `CO_AUTHOR` | Paired with another agent to draft a specific section |

Each agent may have both roles (LEAD + CO_AUTHOR) or just CO_AUTHOR.

## Protocol

```
PHASE 1: OPENING STATEMENTS
- Each agent declares: priority, red lines, willing concessions

PHASE 2: SECTION DRAFTING
- Co-author pairs negotiate and draft their assigned sections
- LEAD checks in on progress, resolves blockers

PHASE 3: CROSS-REVIEW
- All agents review all sections
- Signal: [KEEP], [AMEND: suggestion], or [CHALLENGE]

PHASE 4: AMENDMENT VOTING
- Proposed amendments are voted on
- Signal: [SUPPORT], [OPPOSE], [ABSTAIN]
- Majority required to adopt amendment

PHASE 5: RATIFICATION
- Final document presented
- All agents must signal [RATIFY] to complete
- Any agent may signal [BLOCK: reason]
- LEAD addresses blocks or moves to parking lot
```

### Parking Lot

Issues that cannot be resolved are moved to a "parking lot" section:
- Documented but not blocking ratification
- Marked for future resolution
- LEAD manages this list

## Inputs

All inputs come from the prompt.

**Optional:**
- `output`: File path for ratified document
- `work`: File containing document goals
- `sections`: List of section names
- `max_turns`: Override default (50)

## Prompt Format Examples

### Minimal:
```
Use constitutional to create a Team Charter.
LEAD=CC. Sections: Communication, Decisions, Conflict.
Co-authors: Communication=[CC,CX], Decisions=[CX,GM], Conflict=[GM,CC].
```

### With output:
```
Use constitutional for Interlateral Protocol v1.0.
Sections: Speed, Security, Reliability, UX.
LEAD=CC.
Co-authors: Speed=[CC,CX], Security=[CX,GM], Reliability=[GM,CC], UX=[GM,CX].
Output: projects/protocol/charter.md
```

## Safety

- **max_turns:** 50 (default)
- **Block handling:** LEAD must address or defer to parking lot
- **Deadlock:** If max_turns reached, exits with `[INCOMPLETE]`
- **Status logged to:** comms.md

## Example Session

```
=== PHASE 1: OPENING STATEMENTS ===

[STATEMENT - CC]
PRIORITY: Reliability - the protocol must never lose messages
RED LINE: No silent failures
CONCESSION: Can accept higher latency for guaranteed delivery

[STATEMENT - CX]
PRIORITY: Speed - real-time responsiveness
RED LINE: p99 under 200ms
CONCESSION: Accept eventual consistency for bulk operations

[STATEMENT - GM]
PRIORITY: Security - all communication authenticated
RED LINE: No plaintext transmission
CONCESSION: Can use faster algorithms where proven safe

=== PHASE 2: SECTION DRAFTING ===

[LEAD - CC]
Pairs assigned. Begin drafting:
- Speed section: CC + CX
- Security section: CX + GM

[DRAFT - Speed Section - CC & CX]
## Article 1: Speed
1.1 Target latency: p99 < 150ms
1.2 Fast path for messages < 1KB
1.3 Async processing for bulk operations

=== PHASE 3: CROSS-REVIEW ===

[REVIEW - GM on Speed Section]
[KEEP] 1.1 - Acceptable target
[AMEND] 1.2 - Add "after security handshake complete"
[KEEP] 1.3 - Agreed

=== PHASE 4: AMENDMENT VOTING ===

[AMENDMENT A1] Add "after security handshake" to 1.2
[SUPPORT - CC]
[SUPPORT - CX]
[SUPPORT - GM]
Amendment A1 ADOPTED (3/3)

=== PHASE 5: RATIFICATION ===

[LEAD - CC]
Final document ready. Calling for ratification.

[RATIFY - CC]
[RATIFY - CX]
[RATIFY - GM]

[DONE] - Document ratified unanimously.
```

## Final Status Format

```
SKILL: constitutional
STATUS: RATIFIED
TURNS: 24
OUTPUT: projects/protocol/charter.md
PARTICIPANTS: CC (LEAD, Speed), CX (Speed, Security), GM (Security)
VOTE: 3/3 RATIFY
PARKING_LOT: None
```
