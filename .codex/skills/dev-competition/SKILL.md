---
name: dev-competition
description: Blind dual-implementation pattern where two agents independently create artifacts, then a third agent judges which is better and synthesizes learnings.
metadata:
  owner: interlateral
  version: "2.0"
compatibility: Works with any agent that can read/write files. Requires isolated workspaces to maintain blindness.
---

# Dev-Competition Skill

## Prerequisite: Three Agents Required

This skill requires at least three available agents (Implementer A, Implementer B, and Judge). If fewer than three agents are available, STOP and report:

```
CANNOT RUN dev-competition: only [N] agent(s) available, 3 required.
Available: [list agents]
```

Do not attempt a degraded single-implementer run.

## Required Parameters

| Parameter | Description |
|---|---|
| `competition_dir` | Directory where both implementations and the judgment will be created |
| `requirement_path` | Path to the spec file the Judge evaluates against |

Both must be provided before the skill begins. If either is missing, STOP and ask for it.

## Purpose

Enable two agents to independently implement the same requirement WITHOUT seeing each other's work, then have a third agent compare results and identify the best path forward. This pattern surfaces diverse approaches and prevents groupthink.

## When to Use

- When you want to explore multiple implementation approaches
- When the "best" solution is unclear and comparison would help
- When avoiding anchoring bias is important (no one drafts first)
- When you want redundancy as a quality check

## Roles

### Lead (Orchestrator)

The agent (or human) who sets up and coordinates the competition. The Lead:
- Creates the competition directory structure
- Ensures `requirement_path` exists and is accessible
- Assigns named agents to each role
- Dispatches implementers and triggers judgment
- Ensures blindness is maintained

### Implementer A and Implementer B (Parallel, Blind)

Two named agents who EACH create a complete implementation of the same requirement. They:
- Work in ISOLATED directories (cannot see each other's work)
- Receive the SAME requirement
- Have NO knowledge of what the other is doing
- Complete their work BEFORE the Judge phase begins

### Judge (Sequential, After Implementers)

One named agent who compares both implementations AFTER both are complete. The Judge:
- Reads BOTH implementations
- Evaluates against the REQUIREMENT (not personal style preferences)
- Produces a structured comparison report
- Recommends next steps

## Directory Structure

All artifacts go into a single competition directory:

```
<competition_dir>/
├── impl_a/                 # Implementer A's work
│   └── [artifacts]         # Code, docs, analysis - any file type
├── impl_b/                 # Implementer B's work
│   └── [artifacts]         # Code, docs, analysis - any file type
└── judgment.md             # Judge's comparison report (output)
```

The requirement spec lives at `requirement_path` (which may be inside or outside the competition directory). Implementations can be code, documentation, analysis, or any artifact type. Use `impl_a/` and `impl_b/` regardless of content type, with clear filenames inside.

## Communication Rules

Posting to `comms.md` alone does NOT wake agents. You must:
1. Log to `comms.md` (for the record)
2. Send via injection (to actually deliver):
   - To CC: `node interlateral_dna/cc.js send "message"`
   - To Codex: `node interlateral_dna/codex.js send "message"`
   - To Gemini: `node interlateral_dna/gemini.js send "message"`

During the parallel implementation phase:
- Implementers must NOT post detailed progress to `comms.md`
- This prevents leakage that breaks blindness
- Use only vague signals: "Working...", "50% done", "Complete"
- Save detailed descriptions for AFTER judgment

## Procedure

### Phase 1: Setup (Lead)

1. Verify that three agents are available. If not, STOP.
2. Create the competition directory structure:
   ```bash
   mkdir -p <competition_dir>/impl_a <competition_dir>/impl_b
   ```
3. Verify that `requirement_path` exists and is readable.
4. Assign named agents: which agent is Implementer A, which is B, which is Judge.
5. Ensure implementers CANNOT see each other's directories during implementation.

### Phase 2: Parallel Implementation (Implementer A and B)

**Critical Rule: BLINDNESS**
- Implementer A works ONLY in `impl_a/`
- Implementer B works ONLY in `impl_b/`
- Neither reads the other's directory until Phase 3
- Do NOT open the other's directory in your file browser/tree view
- If blindness is accidentally broken, disclose immediately

**Each Implementer:**
1. Read the spec at `requirement_path`
2. Create your implementation in your assigned directory
3. When done, signal completion via INJECTION (not just comms.md)
4. Do NOT proceed to judgment -- wait for the other implementer

**Completion Signal Format:**
```
[AGENT] @Lead - IMPLEMENTATION COMPLETE
Directory: <competition_dir>/impl_[a or b]/
Files created: [list]
Ready for judgment phase.
```

### Phase 3: Judgment (Judge Agent)

**Trigger:** Both implementers have signaled completion.

**Important:** Evaluate implementations against the REQUIREMENT at `requirement_path`, not against your stylistic preferences. Focus on correctness, completeness, and fitness for purpose.

**The Judge MUST produce `judgment.md` in `competition_dir` with these sections:**

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
[Aspects where both implementations converged]

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
Report: <competition_dir>/judgment.md
Recommendation: [brief summary]
```

The competition directory now contains everything needed for downstream processing.

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
- Checking that each implementer only wrote to their assigned directory
- Reviewing comms.md for any leaked details
- Asking implementers to confirm no cross-reading occurred

**Why blindness matters:**
- Prevents anchoring (first idea dominating)
- Surfaces genuinely independent approaches
- Makes comparison more meaningful
- Tests if agents converge on similar solutions naturally

## Resource Isolation

If implementations require runtime resources (ports, databases, etc.), ensure isolation:
- Use different ports (e.g., impl_a uses 3001, impl_b uses 3002)
- Use different database names or schemas
- Use different temp directories
- Prefix resource names with `impl_a_` or `impl_b_`

The Lead should specify resource assignments in the dispatch message if applicable.

## Timing and Coordination

Implementers A and B can work simultaneously. The Judge MUST wait for BOTH to complete. Use timestamps in comms.md to track progress.

**Timeout Escalation (prioritize extension over degradation):**

1. **10 minutes:** If one implementer finishes and the other hasn't started, Lead pings via injection
2. **20 minutes:** Lead asks if more time is needed; extend if reasonable
3. **30 minutes:** Lead sends a final warning
4. **Last resort only:** If one implementer cannot complete, Lead may proceed with a single implementation BUT must document this in judgment.md as "Degraded Competition (single implementation)"

## Example Invocation

**To the Lead Agent:**
```
Run the dev-competition skill.

competition_dir: projects/experiments/auth_implementation/
requirement_path: projects/specs/auth-middleware-spec.md

Assign roles:
- Implementer A: CC
- Implementer B: Gemini
- Judge: Codex

Start Phase 1 setup, then dispatch to implementers.
```

**Lead sends to Implementer A (CC) via `node interlateral_dna/cc.js send`:**
```
You are Implementer A in a dev-competition.
Read: projects/specs/auth-middleware-spec.md
Write your implementation to: projects/experiments/auth_implementation/impl_a/
Do NOT read impl_b/ - maintain blindness.
Do NOT post implementation details to comms.md.
Signal when complete via injection.
```

**Lead sends to Implementer B (Gemini) via `node interlateral_dna/gemini.js send`:**
```
You are Implementer B in a dev-competition.
Read: projects/specs/auth-middleware-spec.md
Write your implementation to: projects/experiments/auth_implementation/impl_b/
Do NOT read impl_a/ - maintain blindness.
Do NOT post implementation details to comms.md.
Signal when complete via injection.
```

**After both complete, Lead sends to Judge (Codex) via `node interlateral_dna/codex.js send`:**
```
You are the Judge in a dev-competition.
Requirement: projects/specs/auth-middleware-spec.md
Read both implementations:
- projects/experiments/auth_implementation/impl_a/
- projects/experiments/auth_implementation/impl_b/
Evaluate against the requirement, not stylistic preferences.
Write your judgment to: projects/experiments/auth_implementation/judgment.md
Follow the judgment template in the dev-competition skill.
```

## Adherence Checklist

An agent ADHERED to this skill if ALL of the following are true:

1. **Three agents assigned:** Named agents for Implementer A, Implementer B, and Judge
2. **Required parameters provided:** `competition_dir` and `requirement_path` both specified
3. **Directory structure correct:** `competition_dir` contains `impl_a/`, `impl_b/`, `judgment.md`
4. **Blindness maintained:** Implementers did not read each other's directories (or disclosed if broken)
5. **No leakage:** Implementers did not post detailed progress to shared logs during Phase 2
6. **Both implementations complete:** Each impl directory has artifacts before judgment
7. **Judgment structure complete:** `judgment.md` contains all required sections
8. **Comparison is substantive:** "Same" and "Different" sections have specific observations
9. **Verdict is clear:** YES/NO answers with reasoning provided
10. **Recommendation is actionable:** Clear next step identified
11. **Signals sent via injection:** Completion signals sent via injection (not just comms.md)

**Adherence score:** Count how many of the 11 checks pass. 11/11 = full adherence.

## Anti-Patterns

**Implementer Anti-Patterns:**
- Reading the other implementer's directory before completing own work
- Opening the other impl directory in file browser/tree view
- Communicating with the other implementer about approach during implementation
- Posting detailed progress to comms.md (leakage)
- Not signaling completion via injection

**Judge Anti-Patterns:**
- Starting judgment before both implementations are complete
- Evaluating based on style preference instead of requirement fitness
- Giving a verdict without substantive comparison
- Recommending a hybrid without specifying what to take from each
- Not following the judgment template structure

**Lead Anti-Patterns:**
- Not verifying three agents are available before starting
- Not creating isolated directories
- Sending different requirements to each implementer
- Revealing one implementation to the other before judgment
- Jumping to degraded mode without trying extensions first

## Quick Reference

```
0. GATE: 3 agents available? If not, STOP.
1. Setup: Create competition_dir with impl_a/, impl_b/. Confirm requirement_path exists.
2. Assign: Named agents for Implementer A, Implementer B, Judge.
3. Dispatch A and B in PARALLEL via injection (not just comms.md).
4. BLINDNESS: No reading other impl, no detailed comms, no file browser peeking.
5. WAIT for both completion signals (extend time if needed).
6. Dispatch Judge to compare against requirement_path and write judgment.md.
7. Judge evaluates against REQUIREMENT, not style preferences.
8. Judgment answers: What's same? Different? One clearly best? Hybrid better?
9. Hand off competition_dir for downstream use.
```
