---
name: dev-competition
description: Blind dual-implementation pattern where two agents independently create artifacts, then a third agent judges which is better and synthesizes learnings.
metadata:
  owner: interlateral
  version: "1.1"
compatibility: Works with any agent that can read/write files. Requires isolated workspaces to maintain blindness.
---

# Dev-Competition Skill

## Purpose

Enable two agents to independently implement the same requirement WITHOUT seeing each other's work, then have a third agent compare results and identify the best path forward. This pattern surfaces diverse approaches and prevents groupthink.

## When to Use

- When you want to explore multiple implementation approaches
- When the "best" solution is unclear and comparison would help
- When you want to test agent capabilities against each other
- When avoiding anchoring bias is important (no one drafts first)
- When you want redundancy as a quality check

## Roles

### Lead (Orchestrator)

The agent (or human) who sets up and coordinates the competition. The Lead:
- Creates the competition directory structure
- Writes or places the requirement
- Assigns roles to other agents
- Dispatches implementers and triggers judgment
- Ensures blindness is maintained

### Implementer A and Implementer B (Parallel, Blind)

Two agents who EACH create a complete implementation of the same requirement. They:
- Work in ISOLATED directories (cannot see each other's work)
- Receive the SAME prompt/requirement
- Have NO knowledge of what the other is doing
- Complete their work BEFORE the Judge phase begins

### Judge (Sequential, After Implementers)

One agent who compares both implementations AFTER both are complete. The Judge:
- Reads BOTH implementations
- Evaluates against the REQUIREMENT (not personal style preferences)
- Produces a structured comparison report
- Recommends next steps

## Directory Structure

All artifacts go into a single competition directory:

```
[competition_dir]/
├── requirement.md          # The shared requirement (input)
├── impl_a/                 # Implementer A's work
│   └── [artifacts]         # Code, docs, analysis - any file type
├── impl_b/                 # Implementer B's work
│   └── [artifacts]         # Code, docs, analysis - any file type
└── judgment.md             # Judge's comparison report (output)
```

**Note:** Implementations can be code, documentation, analysis, or any artifact type. Use `impl_a/` and `impl_b/` regardless of content type, with clear filenames inside.

## Communication Rules

**Critical: Use BOTH injection AND ledger for all signals.**

Posting to `comms.md` alone does NOT wake agents. You must:
1. Log to `comms.md` (for the record)
2. Send via injection (to actually deliver):
   - To CC: `node cc.js send "message"`
   - To AG: `node ag.js send "message"`
   - To Codex: `node codex.js send "message"`

**During parallel implementation phase:**
- Implementers must NOT post detailed progress to `comms.md`
- This prevents "leakage" that breaks blindness
- Use only vague signals: "Working...", "50% done", "Complete"
- Save detailed descriptions for AFTER judgment

## Procedure

### Phase 1: Setup (Lead)

1. Create the competition directory structure:
   ```bash
   mkdir -p [competition_dir]/impl_a [competition_dir]/impl_b
   ```
2. Write `requirement.md` with the task description
3. Assign roles: which agent is Implementer A, which is B, which is Judge
4. Ensure implementers CANNOT see each other's directories during implementation

### Phase 2: Parallel Implementation (Implementer A and B)

**Critical Rule: BLINDNESS**
- Implementer A works ONLY in `impl_a/`
- Implementer B works ONLY in `impl_b/`
- Neither reads the other's directory until Phase 3
- Do NOT open the other's directory in your file browser/tree view
- If blindness is accidentally broken, disclose immediately

**Each Implementer:**
1. Read `requirement.md`
2. Create your implementation in your assigned directory
3. When done, signal completion via INJECTION (not just comms.md)
4. Do NOT proceed to judgment - wait for the other implementer

**Completion Signal Format:**
```
[AGENT] @Lead - IMPLEMENTATION COMPLETE
Directory: [competition_dir]/impl_[a or b]/
Files created: [list]
Ready for judgment phase.
```

### Phase 3: Judgment (Judge Agent)

**Trigger:** Both implementers have signaled completion.

**Important:** Evaluate implementations against the REQUIREMENT, not against your stylistic preferences. Focus on correctness, completeness, and fitness for purpose.

**The Judge MUST produce `judgment.md` with these sections:**

```markdown
# Competition Judgment

## Requirement Summary
[Brief restatement of what was requested]

## Implementation A Summary
- Agent: [name]
- Files: [list]
- Approach: [brief description of their approach]
- Strengths: [what they did well]
- Weaknesses: [what could be improved]

## Implementation B Summary
- Agent: [name]
- Files: [list]
- Approach: [brief description of their approach]
- Strengths: [what they did well]
- Weaknesses: [what could be improved]

## Comparison

### What is the SAME
[Aspects where both implementations converged - this often indicates the "obvious" or "correct" approach]

### What is DIFFERENT
[Key divergences in approach, structure, or decisions]

### Why the Differences Matter
[Analysis of which differences are significant and which are stylistic]

## Verdict

### Is one clearly best and ready to use as-is?
[YES/NO]

If YES:
- Winner: [A or B]
- Reason: [why this one is clearly better]
- Ready to use: [any caveats or minor fixes needed]

If NO:
- Why neither is clearly best: [explanation]
- What would make one clearly best: [specifics]

### Would a third implementation be better?
[YES/NO]

If YES, describe the ideal implementation:
- From A, take: [specific elements]
- From B, take: [specific elements]
- Add new elements: [if any]
- Rationale: [why this hybrid would be superior]

## Recommendation
[Clear next step: use A, use B, create hybrid, or re-implement]
```

### Phase 4: Handoff

The Judge signals completion via injection:
```
[AGENT] @Lead - JUDGMENT COMPLETE
Report: [competition_dir]/judgment.md
Recommendation: [brief summary]
```

The competition directory now contains everything needed for downstream processing.

## Timing and Coordination

**Parallel Execution:**
- Implementers A and B can work simultaneously
- Judge MUST wait for BOTH to complete
- Use timestamps in comms.md to track progress

**Timeout Escalation (prioritize extension over degradation):**

1. **10 minutes - First check:** If one implementer finishes and the other hasn't started, Lead pings them via injection
2. **20 minutes - Extension offer:** Lead asks if more time is needed; extend if reasonable
3. **30 minutes - Final warning:** Lead notifies that deadline is approaching
4. **Only as last resort - Degraded mode:** If one implementer cannot complete, Lead may proceed with single implementation BUT must document this in judgment.md as "Degraded Competition (single implementation)"

**Degraded mode defeats the purpose of competition.** Always prefer extending time over degrading.

## Blindness Enforcement

**How to maintain blindness:**

1. **Directory isolation:** Each implementer only writes to their directory
2. **No peeking:** Do NOT read the other impl directory
3. **No file browser snooping:** Do NOT open the other directory in your file tree/browser view
4. **No detailed comms:** Do NOT post implementation details to shared logs during Phase 2
5. **Disclosure requirement:** If blindness is accidentally broken, disclose immediately:
   ```
   [AGENT] @Lead - BLINDNESS BROKEN
   I accidentally saw [what they saw] in impl_[a/b].
   Impact: [how this might affect my work]
   ```

**Verification:** Lead can verify blindness was maintained by:
- Checking that implementer only wrote to their assigned directory
- Reviewing comms.md for any leaked details
- Asking implementers to confirm no cross-reading occurred
- (Note: Git history cannot prove an agent didn't READ a file, only that they didn't WRITE to it)

**Why blindness matters:**
- Prevents anchoring (first idea dominating)
- Surfaces genuinely independent approaches
- Makes comparison more meaningful
- Tests if agents converge on similar solutions naturally

## Resource Isolation

**Warning: Shared resource collisions can break parallel implementation.**

If implementations require runtime resources (ports, databases, etc.), ensure isolation:
- Use different ports (e.g., impl_a uses 3001, impl_b uses 3002)
- Use different database names or schemas
- Use different temp directories
- Prefix resource names with `impl_a_` or `impl_b_`

The Lead should specify resource assignments in the dispatch message if applicable.

## Example Prompt to Invoke This Skill

**To the Lead Agent:**
```
Run the dev-competition skill at projects/Skills_Capability/workspace_for_skills/dev-competition/SKILL.md.

Competition directory: projects/experiments/auth_implementation/
Requirement: Create a JWT authentication middleware for the Express server.

Assign roles:
- Implementer A: CC
- Implementer B: AG
- Judge: Codex

Start Phase 1 setup, then dispatch to implementers.
```

**Lead then sends to Implementer A (CC) via `node cc.js send`:**
```
You are Implementer A in a dev-competition.
Read: projects/experiments/auth_implementation/requirement.md
Write your implementation to: projects/experiments/auth_implementation/impl_a/
Do NOT read impl_b/ - maintain blindness.
Do NOT post implementation details to comms.md.
Signal when complete via injection.
```

**Lead sends to Implementer B (AG) via `node ag.js send`:**
```
You are Implementer B in a dev-competition.
Read: projects/experiments/auth_implementation/requirement.md
Write your implementation to: projects/experiments/auth_implementation/impl_b/
Do NOT read impl_a/ - maintain blindness.
Do NOT post implementation details to comms.md.
Signal when complete via injection.
```

**After both complete, Lead sends to Judge (Codex) via `node codex.js send`:**
```
You are the Judge in a dev-competition.
Read both implementations:
- projects/experiments/auth_implementation/impl_a/
- projects/experiments/auth_implementation/impl_b/
Evaluate against the requirement, not stylistic preferences.
Write your judgment to: projects/experiments/auth_implementation/judgment.md
Follow the judgment template in the dev-competition skill.
```

## Measurable Adherence Checklist

An agent ADHERED to this skill if ALL of the following are true:

1. **Directory structure correct:** competition_dir contains requirement.md, impl_a/, impl_b/, judgment.md
2. **Blindness maintained:** Implementers did not read each other's directories (or disclosed if broken)
3. **No leakage:** Implementers did not post detailed progress to shared logs during Phase 2
4. **Both implementations complete:** Each impl directory has artifacts before judgment
5. **Judgment structure complete:** judgment.md contains all required sections
6. **Comparison is substantive:** "Same" and "Different" sections have specific observations, not vague statements
7. **Verdict is clear:** YES/NO answers with reasoning provided
8. **Recommendation is actionable:** Clear next step identified
9. **Signals sent via injection:** Completion signals sent via injection (not just comms.md)

**Adherence score:** Count how many of the 9 checks pass. 9/9 = full adherence.

## Anti-Patterns (Skill Violations)

**Implementer Anti-Patterns:**
- Reading the other implementer's directory before completing own work
- Opening the other impl directory in file browser/tree view
- Communicating with the other implementer about approach during implementation
- Posting detailed progress to comms.md (leakage)
- Waiting to see what the other does before starting
- Not signaling completion via injection

**Judge Anti-Patterns:**
- Starting judgment before both implementations are complete
- Evaluating based on style preference instead of requirement fitness
- Giving a verdict without substantive comparison
- Recommending a hybrid without specifying what to take from each
- Not following the judgment template structure

**Lead Anti-Patterns:**
- Not creating isolated directories
- Sending different requirements to each implementer
- Revealing one implementation to the other before judgment
- Not waiting for both completions before triggering judgment
- Jumping to degraded mode without trying extensions first
- Not specifying resource isolation when needed

## Comparison with dev-collaboration

**dev-collaboration (Sequential Refinement)**
- Pattern: Draft -> Review -> Break
- Visibility: Each role sees previous work
- Goal: Iterative refinement of single artifact
- Output: One polished artifact
- Best for: Known-good approach that needs polish
- Risk: Anchoring on first draft

**dev-competition (Parallel Exploration)**
- Pattern: A + B (parallel) -> Judge
- Visibility: Implementers blind to each other
- Goal: Explore diverse approaches
- Output: Two artifacts + comparison report
- Best for: Uncertain which approach is best
- Risk: Wasted effort if implementations are similar

## Quick Reference Card

```
1. Setup: Create competition_dir with requirement.md, impl_a/, impl_b/
2. Assign: Lead, Implementer A, Implementer B, Judge
3. Dispatch A and B in PARALLEL via injection (not just comms.md)
4. BLINDNESS: No reading other impl, no detailed comms, no file browser peeking
5. WAIT for both completion signals (extend time if needed, avoid degraded mode)
6. Dispatch Judge to compare and write judgment.md
7. Judge evaluates against REQUIREMENT, not style preferences
8. Judgment must answer:
   - What's same? What's different?
   - Is one clearly best? (YES/NO + why)
   - Would hybrid be better? (YES/NO + what from each)
9. Hand off competition_dir for downstream use
```

---

# Agent Reviews

## Antigravity Workspace

### 2026-01-22 20:45:00 UTC - Review of dev-competition

#### What Works Well
- **Blindness Enforcement:** The directory isolation strategy is solid.
- **Judgment Template:** The "Verdict" section forces a clear decision (A vs B vs Hybrid), preventing wishy-washy "both are good" conclusions.
- **Comparison Table:** The contrast with `dev-collaboration` helps agents choose the right tool.

#### Suggestions for Improvement
- **Lead Role Definition:** "Lead" is mentioned in Procedure but missing from the Roles table. Add it to the top level Roles list for completeness.
- **Leakage Warning:** Explicitly warn implementers NOT to post detailed progress in `comms.md` during the parallel phase, as that breaks blindness. Use vague signals only ("Working...", "Done").

#### Breaker Notes (What Could Go Wrong)
- **Shared Resource Collision:** If both agents try to bind to Port 3000 or use the same DB table name during testing, they will crash each other. The skill should mandate *isolated runtime environments* or unique resource identifiers.
- **"Degraded Mode" Risk:** The timeout guidance suggests proceeding with one implementation. This defeats the purpose. Suggest prioritizing "Extend Time" over "Degrade".

#### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- **Assessment:** YES.
- **Note:** The "Example Prompt" is particularly good at showing the Lead -> Implementer handoff.

---

## Codex Workspace

### 2026-01-22 20:48:00 UTC - Review of dev-competition

#### What Works Well
- Clear role separation and blindness emphasis; good fit for exploration vs refinement.
- Strong judgment template with explicit comparison, verdict, and recommendation.
- Measurable adherence checklist and anti-patterns are thorough.
- Quick Reference Card makes it actionable for cold agents.

#### Suggestions for Improvement
- Add explicit control-script usage for dispatch/notifications (e.g., node ag.js send, node cc.js send, node codex.js send) and state that comms.md alone is not sufficient to wake agents.
- Replace "lead can verify git history shows no cross-reads" — git history can't prove reads. Suggest "lead verifies isolation by directory permissions/logged commands or relies on disclosure."
- Add a short note on where outputs live if implementations are non-code (docs/analysis): still use impl_a/ and impl_b/ with a clear filename.
- Add a failure/timeout escalation path for missing implementer (e.g., after X minutes, ping once; after Y, proceed degraded and record it in judgment).

#### Breaker Notes (What Could Go Wrong)
- "Blindness" can be broken inadvertently if the tool's file browser shows both directories; suggest an explicit "do not open the other directory in file tree" warning.
- Judge bias: if the Judge has prior knowledge of one agent's style, the comparison could be skewed. Add a reminder to evaluate against requirement, not style.
- Completion signals sent to comms.md only could stall; require injection + ledger.

#### Cold-Start Test
- Assessment: Mostly yes.
- Missing: explicit comms/injection method and realistic blindness verification.
- Suggested additions: a "Communication Rules" subsection + revise the verification line.

---

# Change Log (v1.1)

## Changes Made

1. **Added Lead role to Roles section** (AG feedback) - Lead was mentioned in procedure but not defined as a role
2. **Added Communication Rules section** (Codex feedback) - Explicit requirement to use injection + ledger, not just comms.md
3. **Added leakage warning** (AG feedback) - Implementers must not post detailed progress to comms.md
4. **Added Resource Isolation section** (AG feedback) - Guidance on avoiding port/DB collisions
5. **Revised timeout escalation** (AG feedback) - Prioritize extension over degraded mode with clear escalation path
6. **Added file browser warning** (Codex feedback) - Don't open other impl directory in tree view
7. **Added judge bias reminder** (Codex feedback) - Evaluate against requirement, not style preferences
8. **Fixed verification claim** (Codex feedback) - Git history can't prove reads, now uses disclosure + directory checks
9. **Added non-code output guidance** (Codex feedback) - impl_a/ and impl_b/ work for docs/analysis too
10. **Updated example prompts** (Codex feedback) - Include explicit injection commands and blindness reminders
11. **Expanded adherence checklist to 9 items** - Added leakage check and injection requirement
12. **Updated Quick Reference Card** - Added key points about blindness, injection, and extension preference

## Suggestions NOT Accepted

None - all feedback was incorporated.

---
