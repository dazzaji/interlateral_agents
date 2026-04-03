---
name: competition
description: Agents work in parallel on the same task; judges evaluate and select the winner.
metadata:
  owner: interlateral
  version: "1.0"
  weight: heavy
compatibility: Three or more agents (CC, CX, GM, AG)
---

# Competition

## Purpose

Multiple agents independently create solutions to the same challenge. Judges evaluate the submissions blind (if possible) and select a winner. Encourages diverse approaches and best-idea-wins culture.

## Roles

| Role | Description |
|------|-------------|
| `COMPETITOR` | Creates an independent solution to the challenge |
| `JUDGE` | Evaluates submissions against criteria, selects winner |

Competitors work in isolation. Judges deliberate together.

## Protocol

```
PHASE 1: CHALLENGE
- Challenge announced with clear criteria
- Competitors acknowledge and begin work

PHASE 2: PARALLEL WORK
- Competitors work independently (no collaboration)
- Each submits with [ENTRY]

PHASE 3: JUDGING
- Judges review all entries
- Score against criteria
- Deliberate on winner

PHASE 4: DECISION
- Judges announce winner with [WINNER]
- Provide feedback on all entries
- Optional: Synthesize best elements from all entries
```

### Challenge Format

```
[CHALLENGE]
TASK: [What competitors must create]
CRITERIA:
1. [Criterion 1] - [Weight]
2. [Criterion 2] - [Weight]
3. [Criterion 3] - [Weight]
DEADLINE: [Turn count]
```

### Entry Format

```
[ENTRY - COMPETITOR]
SUBMISSION: [The work product]
APPROACH: [Brief explanation of strategy]
```

### Judging Format

```
[SCORE - JUDGE]
ENTRY: [Competitor name]
Criterion 1: [Score/10]
Criterion 2: [Score/10]
Criterion 3: [Score/10]
TOTAL: [Sum]
NOTES: [Qualitative feedback]
```

### Winner Format

```
[WINNER]
SELECTED: [Competitor name]
REASON: [Why this entry won]
SYNTHESIS: [Optional: Best ideas from all entries to combine]
```

## Inputs

All inputs come from the prompt.

**Optional:**
- `output`: File path for winning entry
- `work`: File containing challenge details
- `max_turns`: Override default (40)

## Prompt Format Examples

### Minimal:
```
Use competition to design a logo concept.
Competitors: CX, GM.
Judge: CC.
```

### With criteria:
```
Use competition for writing a product tagline.
Competitors: CC, CX.
Judges: GM.
Criteria: Memorable, Clear, Under 8 words.
Output: projects/marketing/tagline.md
```

### Multiple judges:
```
Use competition for architecture proposal.
Competitors: CC, GM.
Judges: CX (technical), AG (business).
Criteria: Scalability, Maintainability, Cost.
Output: projects/arch/winner.md
```

## Safety

- **max_turns:** 40 (default)
- **Tie handling:** Judges deliberate; if still tied, random or synthesize
- **No winner:** If no entry meets minimum criteria, all get feedback, re-compete
- **Status logged to:** comms.md

## Example Session

```
[CHALLENGE]
TASK: Write a one-paragraph product description for Interlateral
CRITERIA:
1. Clarity - Is it easy to understand? (30%)
2. Compelling - Does it make you want to learn more? (40%)
3. Accuracy - Does it reflect the actual product? (30%)
DEADLINE: 4 turns

[ENTRY - CC]
SUBMISSION:
"Interlateral is a multi-agent collaboration framework that turns
AI chaos into orchestrated teamwork. Instead of wrestling with
single-agent limitations, deploy teams of specialized AI agents
that communicate, negotiate, and build together. Six proven
design patterns—from simple peer review to full democratic
governance—let you match the collaboration style to the task."

APPROACH: Led with the problem (chaos), offered the solution (teamwork),
ended with concrete value (six patterns).

[ENTRY - CX]
SUBMISSION:
"What if AI agents could actually work together? Interlateral
makes it happen. Our framework connects multiple AI systems—
Claude, GPT, Gemini—into collaborative teams that tackle complex
projects through natural conversation. Choose from battle-tested
patterns like peer collaboration, competitive challenges, or
democratic decision-making. Your AI team, your rules."

APPROACH: Started with a hook question, emphasized multi-vendor,
ended with user empowerment.

[SCORE - GM (JUDGE)]
ENTRY: CC
Clarity: 8/10 - Clear but "AI chaos" might confuse newcomers
Compelling: 7/10 - Solid but a bit formal
Accuracy: 9/10 - Correctly describes patterns and value prop
TOTAL: 24/30
NOTES: Professional tone, accurate, but could be punchier.

ENTRY: CX
Clarity: 9/10 - Very accessible, question hook helps
Compelling: 9/10 - "Your AI team, your rules" is sticky
Accuracy: 8/10 - Multi-vendor angle is good but less about patterns
TOTAL: 26/30
NOTES: More engaging, slight sacrifice on technical depth.

[WINNER]
SELECTED: CX
REASON: Higher engagement factor while maintaining clarity. The
question hook and "your rules" ending create better reader connection.

SYNTHESIS: Consider combining CX's hook with CC's specific mention
of "six proven design patterns" for best of both worlds.

[DONE]
```

## Final Status Format

```
SKILL: competition
STATUS: DONE
TURNS: 8
OUTPUT: projects/marketing/description.md
COMPETITORS: CC, CX
JUDGES: GM
WINNER: CX
SCORES: CC=24, CX=26
```
