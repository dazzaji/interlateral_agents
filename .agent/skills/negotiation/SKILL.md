---
name: negotiation
description: Agents with competing priorities reach consensus through structured trade-offs.
metadata:
  owner: interlateral
  version: "1.0"
  weight: medium
compatibility: Three or more explicitly selected agents. Default to Claude Code + Codex peers; Gemini and Antigravity are opt-in only when the human explicitly selects them.
---

# Negotiation

## Purpose

Multiple agents, each advocating for a different priority, negotiate to reach a consensus. No agent has authority; all must agree through trade-offs and compromise.

Use `mesh-comms-core` first if direct peer notification has not already been proven. `comms.md` is the ledger, not the wake-up path.

Default roster: use Claude Code and Codex peers. Do not include Gemini CLI,
Antigravity CLI, or Antigravity Desktop unless the human prompt explicitly
names that peer.

## Roles

| Role | Description |
|------|-------------|
| `ADVOCATE` | Each agent advocates for one priority (assigned in prompt) |

All advocates are equal. Each agent gets one priority to champion.

## Protocol

```
1. POSITION STATEMENTS: Each advocate declares their priority and rationale
2. NEGOTIATION: Agents propose trade-offs, discuss, counter-propose
3. CONSENT CHECK: Any agent may call for consent check
4. ITERATE: Continue until all agents signal [DONE] or [CONSENT]
```

### Position Statement Format

```
[ADVOCATE - AGENT_NAME]
PRIORITY: [What I'm advocating for]
RATIONALE: [Why this matters]
RED LINE: [What I cannot compromise on]
WILLING TO TRADE: [What I can give up]
```

### Trade-Off Format

```
[PROPOSAL - AGENT_NAME]
I OFFER: [What I'm giving up]
I WANT: [What I need in return]
RATIONALE: [Why this is fair]
```

### Consent Check

Any agent may call: `[CONSENT CHECK]`

All agents must respond:
- `[CONSENT]` - I agree to the current proposal
- `[OBJECT: reason]` - I cannot agree because...

## Inputs

All inputs come from the prompt.

**Optional:**
- `output`: File path for consensus document
- `work`: File containing the decision to be made
- `max_turns`: Override default (30)

## Prompt Format Examples

### Minimal:
```
Use negotiation to decide on team meeting frequency.
CC=Productivity, CX=Work-Life-Balance, CC-peer-02=Collaboration.
```

### With output:
```
Use negotiation for authentication protocol design.
CC advocates Reliability, CX advocates Speed, CC-peer-02 advocates Security.
Output: projects/auth/protocol.md
```

## Safety

- **max_turns:** 30 (default)
- **Deadlock:** If max_turns reached, exits with `[INCOMPLETE]`
- **Status logged to:** direct notification plus `comms.md`

## Example Session

```
[ADVOCATE - CC]
PRIORITY: Reliability
RATIONALE: Users must always receive their messages
RED LINE: No silent message loss
WILLING TO TRADE: Latency up to 500ms acceptable

[ADVOCATE - CX]
PRIORITY: Speed
RATIONALE: Real-time feel is essential for UX
RED LINE: p99 latency must stay under 200ms
WILLING TO TRADE: Can accept eventual consistency for non-critical messages

[ADVOCATE - CC-peer-02]
PRIORITY: Security
RATIONALE: Messages must be authenticated and encrypted
RED LINE: No plaintext transmission
WILLING TO TRADE: Can use faster symmetric encryption after key exchange

[PROPOSAL - CC]
I OFFER: Accept 150ms latency target instead of "as fast as possible"
I WANT: Guaranteed delivery with at-least-once semantics
RATIONALE: Small latency increase enables retry mechanism

[PROPOSAL - CX]
I OFFER: Accept at-least-once (may require dedup on client)
I WANT: Fast path for messages under 1KB (skip some validation)
RATIONALE: 90% of messages are small, can optimize the common case

[CONSENT CHECK - CC-peer-02]
Current proposal:
- 150ms p99 target
- At-least-once delivery
- Fast path for small messages
- TLS required, symmetric encryption after handshake

[CONSENT - CC]
[CONSENT - CX]
[CONSENT - CC-peer-02]

[DONE] - Consensus reached.
```

## Final Status Format

```
SKILL: negotiation
STATUS: DONE
TURNS: 8
OUTPUT: projects/auth/protocol.md
PARTICIPANTS: CC (Reliability), CX (Speed), CC-peer-02 (Security)
CONSENSUS: Achieved
```
