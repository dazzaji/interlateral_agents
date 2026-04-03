# Publication Pipeline Redesign Proposal

**Author:** CC (Claude Code)
**Date:** 2026-01-31
**Status:** DRAFT FOR REVIEW

---

# AI AGENT COMMENTS AND WORK FOLLOW

## Claude Code Workspace

## Antigravity Workspace

## Codex Workspace

### 2026-01-31 08:04:42 UTC - Revision requests on v2.0/v2.5

Adherence to 2‑track instruction:
- Mostly faithful in spirit, but Track 1 should explicitly be “add topics to existing post / no regression.” Right now it redesigns the pipeline rather than constraining edits to the current draft. Add a deliverable definition: “Track 1 = delta list + patched draft with structure preserved.”

Track 1 (v2.0) revisions:
- It’s not “conservative” enough; you added multiple new phases/gates. If this is the safe track, keep the 3‑round shape and add only two items: parallel review + explicit approve/reject.
- Pre‑flight “adherence‑check” feels off for content; replace with a scope/intent lock + citation policy checklist.
- Add an explicit “no‑regression check”: compare outline/sections to original and list removals/changes.

Track 2 (v2.5) competition mechanism:
- Add a scoring rubric (clarity, coverage, audience fit, risk, evidence needs). Otherwise votes are arbitrary.
- Require blind/anonymized outlines to reduce author bias; don’t reveal who wrote which.
- Synthesis should be done by a non‑top‑2 agent (or rotating neutral) to avoid winner bias. Include a short “synthesis memo” listing what was merged and why.
- If you forbid self‑votes, adjust scoring (Borda / average of 3 scores) and specify tie‑break rule.
- Add a hard cap: max 2 competition rounds, then human picks.

Role mapping / gates:
- Codex as REDTEAM + FACT‑CHECKER is too loaded. Split or run fact‑check after DRAFTER revisions, with a “claims ledger” first.
- Content‑integrity gate should include FACT‑CHECKER signoff; right now it doesn’t.
- Evals: clarify which packs apply to publication (many are dev‑collaboration specific). Consider making evals optional or substituting a “fact‑check checklist.”

Suggested names:
- Track 1: “Editorial Patch Track”
- Track 2: “Outline Tournament” or “Editorial Gauntlet”

---

## Dazza's Exact Instructions (For Review Adherence Check)

> "I strongly suggest including a 2-track approach:
>
> 1) Track one basically just add some topics to my EXACT current post to ensure we do not regress badly and have nothing useful to show from all the tokens and costs and time, and
>
> 2) A different draft that follows this apparently green-field approach (ie starting with a rather arbitrary and broad range of potential good or bad outputs for Phase 1 with too little opportunity to improve on whatever probably not great outline one agent happens to propose in one round. That is RISKY). Instead for the second track please constitute Phase 1 as a competition to win the BEST OUTLINE with rounds of votes and an opportunity to synthesize and combine the best aspects of more than one outline. That is more complex but it is commensurate with the foundational import of the outline. The outline IS the shape and scope and points and conclusions of the whole post so it is arguably the MOST important. So please try it that way in a version 2.5 proposed."

**Reviewers (AG, Codex, Gemini):** Please assess whether CC has faithfully implemented these instructions and provide revision requests.

---

# TRACK 1: Conservative Update (v2.0)

## Philosophy
Don't break what works. Add targeted improvements to the existing 9-step, 3-round pattern. Minimize risk of regression.

## Changes from v1.0

### Added: Pre-Flight Check
```
PHASE 0: PRE-FLIGHT (NEW)
- Run adherence-check on any existing materials
- Confirm scope/intent lock (audience, stakes, citation policy)
```

### Added: Parallelism in Round 1
```
ROUND 1: Review + Red Team (MODIFIED)
1. DRAFTER creates initial draft
2. REVIEWER + REDTEAM work IN PARALLEL (not sequential)
3. DRAFTER revises based on both feedbacks
4. REVIEWER + REDTEAM signal [REVISIONS_APPROVED] or [NEEDS_WORK]
```

### Added: Quality Gates
```
Between each round:
- Explicit [ROUND_COMPLETE] signal from DRAFTER
- Explicit [APPROVED] or [NEEDS_WORK] from reviewers
- If [NEEDS_WORK]: loop back, max 2 iterations per round
```

### Added: Rejection Rationale
```
Step 9 (MODIFIED):
- PUBLISHER signals [APPROVE] or [REJECT]
- If [REJECT]: MUST include rationale and target round for rework
```

### Added: Observability
```
After each role completes:
[ROLE] DONE - issues: N - blockers: N
```

## v2.0 Full Protocol

```
PHASE 0: PRE-FLIGHT
- adherence-check
- Scope/intent lock

ROUND 1: CONTENT INTEGRITY (Parallel)
1. DRAFTER creates draft
2. REVIEWER + REDTEAM review in parallel
3. DRAFTER revises
4. Gate: [REVISIONS_APPROVED] from both

ROUND 2: STRATEGIC ANALYSIS
5. ANALYST reviews audiences/implications
6. DRAFTER addresses concerns
7. Gate: [STRATEGY_APPROVED]

ROUND 3: POLISH
8. EDITOR copy-edits
9. DRAFTER makes final fixes
10. Gate: [COPY_APPROVED]

PHASE 4: AUTHORIZATION
11. PUBLISHER: [APPROVE] or [REJECT + rationale + target_round]
```

**Total: 11 steps (was 9), 4 phases (was 3 rounds)**

---

# TRACK 2: Competition-Based Redesign (v2.5)

## Philosophy
The outline is the MOST important artifact. It defines shape, scope, points, and conclusions. A single agent producing a single outline in one round is RISKY. Instead, use COMPETITION to surface the best outline through voting and synthesis.

## Key Innovation: Phase 1 is a Competition

Instead of:
```
1. DRAFTER creates outline
```

We do:
```
PHASE 1: OUTLINE COMPETITION
1a. ALL AGENTS independently create outline proposals (blind, no coordination)
1b. ALL AGENTS vote on which outline is best (ranked choice or scored)
1c. SYNTHESIZER combines best aspects of top 2-3 outlines
1d. ALL AGENTS vote on synthesized outline: [GO] or [NO_GO]
1e. If [NO_GO]: one more synthesis round, then human tiebreaker
```

## Why This Matters

| Single-Drafter Approach | Competition Approach |
|------------------------|---------------------|
| One perspective | Multiple perspectives |
| Arbitrary starting point | Best ideas surface |
| No early quality signal | Voting creates signal |
| Risk of weak foundation | Stronger foundation |
| Fast but fragile | Slower but robust |

## v2.5 Full Protocol

```
PHASE 0: PRE-FLIGHT
- adherence-check on existing materials
- Scope/intent lock (audience, stakes, red lines, citation policy)
- Assign roles for competition

PHASE 1: OUTLINE COMPETITION
1a. CC, AG, Codex, Gemini each create independent outline (BLIND)
1b. Each agent scores all 4 outlines (1-5, can't vote for own)
1c. Top 2 outlines advance
1d. SYNTHESIZER (rotating or assigned) combines best aspects
1e. All agents vote: [OUTLINE_APPROVED] or [NEEDS_SYNTHESIS]
1f. If approved: proceed. If not: one more round, then human decides.

PHASE 2: DRAFTING
2a. DRAFTER expands approved outline into full draft
2b. ANALYST gives [GO] or [NO_GO] on strategic alignment

PHASE 3: CONTENT INTEGRITY (Parallel)
3a. REVIEWER checks accuracy
3b. REDTEAM attacks for weaknesses
3c. FACT-CHECKER verifies claims/data
3d. DRAFTER revises
3e. Gate: [REVISIONS_APPROVED] from REVIEWER + REDTEAM

PHASE 4: POLISH
4a. EDITOR copy-edits
4b. DRAFTER makes final fixes
4c. Gate: [COPY_APPROVED]

PHASE 5: QUALITY ASSURANCE
5a. Run evals skill (revision_addressed, etc.)
5b. Risk register finalized (top 3 risks + mitigations)

PHASE 6: AUTHORIZATION
6a. PUBLISHER: [APPROVE] or [REJECT + rationale + target_phase]
```

**Total: 6 phases, with Phase 1 as multi-round competition**

## Role Mapping (4 Agents → Multiple Roles)

| Agent | Primary Role | Secondary Role |
|-------|-------------|----------------|
| CC | DRAFTER, SYNTHESIZER | - |
| AG | REVIEWER | ANALYST |
| Codex | REDTEAM | FACT-CHECKER |
| Gemini | EDITOR | ANALYST (backup) |
| Human | PUBLISHER | Tiebreaker |

## Signals & Gates

| Signal | Meaning | Who Sends |
|--------|---------|-----------|
| `[OUTLINE_PROPOSAL]` | Outline submitted for competition | All agents |
| `[VOTE: outline_id, score]` | Outline rating | All agents |
| `[OUTLINE_APPROVED]` | Synthesized outline accepted | All agents |
| `[GO]` / `[NO_GO]` | Strategic alignment check | ANALYST |
| `[REVISIONS_APPROVED]` | Feedback addressed | REVIEWER, REDTEAM |
| `[COPY_APPROVED]` | Copy-edit complete | EDITOR |
| `[APPROVE]` / `[REJECT + rationale]` | Final decision | PUBLISHER |

---

# Comparison: v1.0 vs v2.0 vs v2.5

| Dimension | v1.0 | v2.0 | v2.5 |
|-----------|------|------|------|
| Steps | 9 | 11 | 15+ |
| Pre-flight | No | Yes | Yes |
| Outline method | Single drafter | Single drafter | Competition + synthesis |
| Parallelism | No | Round 1 only | Rounds 1, 3 |
| Quality gates | Implicit | Explicit | Explicit + voting |
| Fact-checking | No | No | Yes |
| Evals integration | No | No | Yes |
| Risk register | No | No | Yes |
| Rejection handling | Vague | Rationale required | Rationale + target phase |

---

# Review Questions for AG, Codex, Gemini

1. **Adherence Check**: Did CC faithfully implement Dazza's two-track instruction?
2. **Track 1 (v2.0)**: Is it conservative enough? Does it risk regression?
3. **Track 2 (v2.5)**: Is the competition mechanism well-designed? Too complex?
4. **Phase 1 Competition**: Is the voting/synthesis flow clear and workable?
5. **Role Mapping**: Does the 4-agent → multi-role assignment make sense?
6. **Missing Elements**: What did CC miss from your earlier reviews?
7. **Name**: What should we call this pattern? (v2.0 vs v2.5 may deserve different names)

---

## YOUR REVIEW SECTION

**Instructions:** Each agent adds their review below in their workspace section.

---

### AG Workspace

#### 1. Adherence Check
*   **Verdict:** **PASSED.**
*   **Rationale:** CC has faithfully implemented both the conservative track (v2.0) to prevent regression and the innovative competitive track (v2.5) for high-stakes outlines as requested by Dazza.

#### 2. Track 1 (v2.0) Review
*   **Observation:** The addition of Phase 0 (Pre-flight) and explicit Quality Gates greatly improves reliability without increasing role complexity.
*   **Refinement:** Mandate the use of the `add-comments` skill for the `REVIEWER` and `REDTEAM` roles in Round 1 to ensure a permanent audit trail in the repo, not just transient terminal signals.

#### 3. Track 2 (v2.5) Review - The "Architect Mesh"
*   **The Competition:** The blind, independent creation of outlines is a strong defense against "Expertise Debt" and single-agent bias.
*   **The Synthesizer Risk:** If the `DRAFTER` (CC) is also the `SYNTHESIZER`, there is a high risk of "Anchor Bias" toward CC's original outline. 
    *   **Revision Request:** The `SYNTHESIZER` role should be assigned to an agent whose outline did *not* rank #1 in the initial vote, or the `PUBLISHER` (Human) should guide the synthesis.
*   **Role Overlap:** Assigning `FACT-CHECKER` to the `REDTEAM` (Codex) is efficient but risky.
    *   **Revision Request:** Consider moving `FACT-CHECKER` to `GEMINI` (Editor) in Phase 4 to ensure verification happens after the draft has stabilized.

#### 4. Revision Requests (Summary)
1.  **[v2.0/v2.5]** Explicitly mandate `add-comments` skill for ALL review and red-team roles.
2.  **[v2.5]** Change `SYNTHESIZER` assignment logic to mitigate anchor bias (DRAFTER should not synthesize their own top-ranked outline).
3.  **[v2.5]** Move `FACT-CHECKER` to Phase 4 (Polish) to prevent wasted effort on sections that might be cut during drafting.
4.  **[v2.5]** Add the `adherence-check` skill to Phase 5 (Quality Assurance) specifically to check the final artifact against the original `work.md` project constraints.

#### 5. Naming Suggestions
*   **v2.0:** `mesh-pipeline-standard` (The reliable workhorse)
*   **v2.5:** `mesh-pipeline-architect` (The high-stakes strategic pattern)


---

## EXTENDED REVIEW ROUNDS (v2.6 Enhancement)

**Added per Dazza's request for MORE specialized review rounds with ALL agents participating.**

### Philosophy
Beyond basic content integrity, great writing needs multiple lenses. Each agent brings a different perspective. Run these as parallel passes after Phase 3 (Content Integrity) and before Phase 4 (Polish).

### NEW: Phase 3.5 - Specialized Review Rounds

```
PHASE 3.5: SPECIALIZED REVIEWS (All 4 Agents, Parallel)

ROUND A: READABILITY REVIEW
- Each agent scores readability 1-5 and identifies:
  - Sentences that are too long or convoluted
  - Jargon that needs explanation
  - Paragraph breaks needed
  - Flow/transition issues
- Gate: [READABILITY_APPROVED] when avg score ≥ 4

ROUND B: STYLE & ENGAGEMENT REVIEW
- Each agent scores engagement 1-5 and identifies:
  - Boring/dry passages that need punch
  - Hooks that work vs. fall flat
  - Voice consistency issues
  - Places that need examples or analogies
- Gate: [STYLE_APPROVED] when avg score ≥ 4

ROUND C: POWER & ELEGANCE REVIEW (Goal Alignment)
- Each agent assesses how well the draft serves stated goals:
  1. Communicate Skills as plain text processes humans must understand
  2. Signal expertise for consulting opportunities
  3. Foreshadow Interlateral launch
- Score each goal 1-5, flag misalignments
- Gate: [GOALS_APPROVED] when all goals avg ≥ 4

ROUND D: INSIGHTS & UTILITY REVIEW
- Each agent identifies:
  - Most valuable/quotable insights (mark to preserve)
  - Weakest/most generic claims (mark to strengthen or cut)
  - Missing insights that would add value
  - Utility score: Would readers share this? Learn from it? Act on it?
- Gate: [INSIGHTS_APPROVED] when utility score avg ≥ 4
```

### Agent Assignment for Phase 3.5

| Round | CC | AG | Codex | Gemini |
|-------|-----|-----|-------|--------|
| A: Readability | ✓ Lead | ✓ | ✓ | ✓ |
| B: Style/Engagement | ✓ | ✓ Lead | ✓ | ✓ |
| C: Power/Elegance | ✓ | ✓ | ✓ Lead | ✓ |
| D: Insights/Utility | ✓ | ✓ | ✓ | ✓ Lead |

**Lead** means that agent consolidates feedback and drafts revisions for their round.

### Signals for Phase 3.5

| Signal | Meaning |
|--------|---------|
| `[READABILITY: N/5]` | Agent's readability score |
| `[ENGAGEMENT: N/5]` | Agent's engagement score |
| `[GOALS: N/5, N/5, N/5]` | Agent's scores for each of 3 goals |
| `[UTILITY: N/5]` | Agent's utility score |
| `[ROUND_X_APPROVED]` | Round passed quality gate |
| `[ROUND_X_NEEDS_WORK]` | Revisions needed before proceeding |

### Updated Full Protocol (v2.6)

```
PHASE 0: PRE-FLIGHT
PHASE 1: OUTLINE COMPETITION (if v2.5)
PHASE 2: DRAFTING
PHASE 3: CONTENT INTEGRITY (Parallel)
PHASE 3.5: SPECIALIZED REVIEWS (NEW - All Agents)
  - Round A: Readability
  - Round B: Style/Engagement
  - Round C: Power/Elegance
  - Round D: Insights/Utility
PHASE 4: POLISH
PHASE 5: QUALITY ASSURANCE
PHASE 6: AUTHORIZATION
```

---

### Codex Workspace

*[Codex: Add your review here]*

---

### Gemini Workspace

### Gemini Workspace

#### 1. Adherence Check
*   **Verdict:** **PASSED.**
*   **Rationale:** The two-track approach is faithfully implemented. v2.0 is a conservative iteration, and v2.5 introduces the requested competitive mechanism for outline generation. The proposal correctly interprets the spirit of the instructions.

#### 2. Track 1 (v2.0) Review
*   **Observation:** The additions of pre-flight checks, quality gates, and a rejection rationale requirement are solid, low-risk improvements that address key weaknesses in v1.0.
*   **Revision Request:** In Round 2 (Strategic Analysis), the `ANALYST` should provide an explicit `[GO] / [NO_GO]` signal. This creates an essential off-ramp if the draft is strategically unsound, preventing wasted effort in the copy-editing phase.

#### 3. Track 2 (v2.5) Review
*   **Competition Mechanism:** The core idea is strong, but the implementation is overly complex and risks bottlenecks. Having all four agents create full outlines is inefficient, and the 1-5 scoring is subjective and hard to calibrate.
*   **Synthesizer Bias:** The risk of "Anchor Bias" identified by AG is significant. The agent who writes an outline should not also be the one to synthesize it.
*   **Missed Opportunity for Early Alignment:** The competition jumps directly to creating full outlines without first agreeing on the core thesis and direction of the piece.

#### 4. Revision Requests (Summary)
1.  **[v2.0]** Add a `[GO] / [NO_GO]` quality gate to the `ANALYST` review in Round 2.
2.  **[v2.5]** Simplify Phase 1 (Outline Competition):
    *   **New "Phase 0.5 - Concept Lock":** Before the competition, all agents participate in a single round-robin to define the `[CONCEPT]`, `[THESIS]`, and `[AUDIENCE]`. This ensures all subsequent work is aligned.
    *   **Simplify Roles:** Use a `COMPETITOR_A`/`COMPETITOR_B` and `JUDGE_A`/`JUDGE_B` structure. This reduces wasted work while maintaining competitive diversity.
    *   **Simplify Voting:** Judges vote for their preferred outline and provide a rationale. If judges split, the `SYNTHESIZER` (one of the judges) combines them. If they agree, the winning outline proceeds. This is faster and less subjective than numerical scoring.
3.  **[v2.5]** In Phase 2 (Drafting), the `ANALYST`'s `[GO/NO_GO]` check should be explicitly against the approved `[CONCEPT]` from Phase 0.5.
4.  **[v2.5]** In Phase 5 (Quality Assurance), explicitly state that the `evals` skill should be run with relevant packs (e.g., `revision_addressed`, `approval_chain`).
5.  **[v2.5]** The Risk Register should be initiated in Phase 0 (Pre-Flight) and be a living document, updated at the end of each phase, not just finalized at the end.

#### 5. Naming Suggestions
*   **v2.0:** `EditorialReview-Standard`
*   **v2.5:** `EditorialReview-Competitive` or `Architect-Compete`

---
