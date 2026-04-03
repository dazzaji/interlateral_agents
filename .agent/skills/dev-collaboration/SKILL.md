---
name: dev-collaboration
description: Design pattern for tri-agent collaboration (Drafter, Reviewer, Breaker). Assigns roles via prompt parameters. Use when starting multi-agent dev work.
metadata:
  owner: interlateral
  version: "1.1"
compatibility: Requires tri-agent system (CC, AG, Codex) and access to interlateral_dna/ control scripts
---

# Dev Collaboration Pattern

## Prerequisites
- **Control Scripts:** You must use the scripts in `interlateral_dna/` (e.g., `ag.js`, `cc.js`, `codex.js`) for injection.
- **Comms:** You must use `interlateral_dna/comms.md` for the ledger.

## Roles

| Role | Job | Deliverable |
|------|-----|-------------|
| **Drafter** | Creates the initial artifact (plan, code, doc) | Working draft at agreed path |
| **Reviewer** | Provides constructive improvement suggestions | List of actionable suggestions |
| **Breaker** | Attacks assumptions, finds failure modes | List of ways this could break |

## Sequence

```
1. DRAFTER creates artifact
2. DRAFTER posts to comms.md AND notifies REVIEWER/BREAKER via injection
3. REVIEWER and BREAKER work in parallel (do NOT read each other's drafts)
4. REVIEWER delivers suggestions
5. BREAKER delivers failure scenarios
6. DRAFTER incorporates feedback into v1.1
7. DRAFTER reports completion to human
```

**Timeout Rule:** If Reviewer or Breaker has not responded within 10 minutes of the notification, Drafter may proceed with "Partial Revision" but must note the missing input in the report.

## Role Behaviors

### If You Are DRAFTER
1. Create the artifact at the path specified in your assignment.
2. When done, perform the **Ledger and Whip**:
   - **Post to comms.md**: `[YOUR_AGENT] @REVIEWER @BREAKER - Draft ready at [PATH].`
   - **Inject Notification**:
     ```bash
     # Use the specific script for the target agent (ag.js, cc.js, or codex.js)
     node interlateral_dna/<target>.js send "[YOUR_AGENT] Draft ready at [ABSOLUTE_PATH]. Please review."
     ```
3. Wait for both to complete (or for 10-minute timeout).
4. Read their feedback and create v1.1.
5. Add a "## Change Log" section to the artifact using this schema:
   ```markdown
   ## Change Log (v1.1)
   - **Fixed:** [What was fixed] (Thanks @[Reviewer])
   - **Hardened:** [What was protected] (Thanks @[Breaker])
   - **Declined:** [Suggestion] - [Reason]
   ```

### If You Are REVIEWER
1. Wait for Drafter's "ready" notification.
2. Read the artifact thoroughly.
3. Provide 3-5 actionable suggestions in this format:
   ```
   SUGGESTION 1: [Title]
   What: [Specific change]
   Why: [Benefit]
   ```
4. Deliver via one of these methods:
   - **add-comments skill** (preferred for file reviews)
   - **comms.md entry** (for brief feedback)
   - **Direct injection** (for very short feedback)
5. Notify Drafter when done via injection.

### If You Are BREAKER
1. Wait for Drafter's "ready" notification.
2. Read the artifact with adversarial mindset.
3. Assume future agents will be careless, rushed, and confused.
4. Provide 3-5 failure scenarios in this format:
   ```
   FAILURE 1: [Title]
   Attack: [How someone could misuse or break this]
   Consequence: [What goes wrong]
   Prevention: [How to guard against it]
   ```
5. Deliver via one of the methods listed for Reviewer.
6. Notify Drafter when done via injection.

## Completion Criteria

Pattern is COMPLETE when:
- [ ] Drafter created initial artifact
- [ ] Reviewer delivered ≥3 suggestions (or timed out)
- [ ] Breaker delivered ≥3 failure scenarios (or timed out)
- [ ] Drafter created v1.1
- [ ] Drafter included a correctly formatted Change Log in the artifact
- [ ] Human notified of completion

## Example Prompt

```
"Run the dev-collaboration skill at projects/Skills_Capability/workspace_for_skills/dev-collaboration/SKILL.md.
Your role is REVIEWER.
The Drafter is CC, the Breaker is Codex.
Artifact location: dev_plan/dev_plan.md
Deliver your review using the add-comments skill to projects/plan_reviews.md"
```

---

## Change Log

### v1.1 Revision (2026-01-22) - AG
Based on reviews from CC, Codex, and AG.

- **Fixed:** Added "Post to comms.md AND inject" requirement to Drafter role. (Thanks @CC)
- **Fixed:** Added explicit timeout rule (10 minutes) to prevent deadlocks. (Thanks @CC, @AG)
- **Fixed:** Clarified "Deliver via..." options for Reviewer. (Thanks @CC)
- **Hardened:** Added "Prerequisites" section to specify `interlateral_dna/` scripts location. (Thanks @CC)
- **Hardened:** Strengthened "No Coordination" rule in Sequence. (Thanks @Codex)
- **Hardened:** Added specific schema for the Change Log in Drafter behaviors. (Thanks @Codex)
- **Fixed:** Updated Prompt Description to mention role assignment. (Thanks @CC)
- **Declined:** "Provide critical vs minor suggestions" (Codex) - Kept it simple ("actionable") to reduce cognitive load and prompt complexity.
