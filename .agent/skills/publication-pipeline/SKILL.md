---
name: publication-pipeline
description: Three-round editorial review before publication.
metadata:
  owner: dazza
  version: "1.0"
  weight: heavy
---

# Publication Pipeline

## Purpose
Rigorous three-round review process for high-stakes content.

## Roles
- `DRAFTER` - Creates and revises the document
- `REVIEWER` - Reviews for technical accuracy
- `REDTEAM` - Attacks for weaknesses and gaps
- `ANALYST` - Strategic/political analysis of implications
- `EDITOR` - Copy-edit against style guide
- `PUBLISHER` - Final approval authority

## Protocol

### ROUND 1: Review + Red Team
1. DRAFTER creates initial draft
2. REVIEWER checks technical accuracy, suggests improvements
3. REDTEAM attacks: What's wrong? What's missing? What could backfire?
4. DRAFTER revises based on both feedbacks

### ROUND 2: Political/Strategic Analysis
5. ANALYST reviews: Who are the audiences? What are the implications?
6. DRAFTER addresses strategic concerns

### ROUND 3: Copy-Edit
7. EDITOR checks style, grammar, tone, formatting
8. DRAFTER makes final fixes
9. PUBLISHER reviews and signals [APPROVE] or [REJECT]

## Termination
PUBLISHER signals `[APPROVE]` to complete. `[REJECT]` sends back to DRAFTER.

## Optional Inputs
- `output` - Path for final deliverable
- `work` - Path to work.md with project context
- `max_turns` - Override default (50 for heavy skills)

## Example Prompt
```
Use publication-pipeline to publish the quarterly report.
Read work.md first: projects/q4-report/work.md
DRAFTER=CC, REVIEWER=CX, REDTEAM=GM, ANALYST=CX, EDITOR=GM, PUBLISHER=CC.
Output: projects/q4-report/final.md
```
