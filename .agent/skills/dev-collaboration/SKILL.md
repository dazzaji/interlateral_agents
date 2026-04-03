---
name: dev-collaboration
description: Role-based collaboration pattern (Drafter, Reviewer, Breaker). Assigns roles to available agents via prompt parameters. Use when starting multi-agent dev work.
metadata:
  owner: interlateral
  version: "0.1"
compatibility: Requires at least two agents from {claude, codex, gemini} and access to comms.md ledger and agent notification scripts.
---

# Dev Collaboration Pattern

## Prerequisites

- **Notification Scripts:** Use the repo's agent-specific scripts under `interlateral_dna/` to send direct notifications.
  - Claude Code: `node interlateral_dna/cc.js send "message"`
  - Codex: `node interlateral_dna/codex.js send "message"`
  - Gemini: `node interlateral_dna/gemini.js send "message"`
- **Ledger:** Use `comms.md` as the shared communications ledger.

## Roles

| Role | Job | Deliverable |
|------|-----|-------------|
| **DRAFTER** | Creates or modifies the artifact | Working draft at the specified `artifact_path` |
| **REVIEWER** | Reviews for correctness, clarity, completeness | List of actionable suggestions |
| **BREAKER** | Adversarial testing; finds flaws, edge cases, failure modes | List of ways the artifact could break |

Any v0.1 agent (`claude`, `codex`, `gemini`) may hold any role.

## Prompt Requirements

Every invocation of this skill MUST include:

1. **Explicit role assignment** -- which agent holds which role(s).
2. **`artifact_path`** -- the file path for the artifact being created or reviewed.

### Dual-Hatting Rule

All three roles must be covered. If only two agents are available, the prompt MUST explicitly assign one agent a dual-hatted role. Example:

```
Codex is both REVIEWER and BREAKER.
```

The dual-hatted agent must complete each role as a separate phase and deliver separate outputs for each.

## Sequence

```
1. DRAFTER creates artifact at artifact_path
2. DRAFTER posts to comms.md AND notifies REVIEWER and BREAKER via their scripts
3. REVIEWER and BREAKER work in parallel (do NOT read each other's outputs)
4. REVIEWER delivers suggestions
5. BREAKER delivers failure scenarios
6. DRAFTER incorporates feedback into a revised version
7. DRAFTER reports completion to human
```

**Timeout Rule:** If REVIEWER or BREAKER has not responded within 10 minutes of notification, DRAFTER may proceed with a partial revision but must note the missing input in the report.

## Role Behaviors

### If You Are DRAFTER

1. Create the artifact at `artifact_path`.
2. When done, perform the **Ledger + Notify** step:
   - **Post to comms.md:** `[YOUR_AGENT] @REVIEWER @BREAKER -- Draft ready at [artifact_path].`
   - **Send direct notification** to each agent using the matching script in `interlateral_dna/`:
     ```bash
     node interlateral_dna/cc.js send "[YOUR_AGENT] Draft ready at [ABSOLUTE_PATH]. Please review."
     ```
3. Wait for both roles to complete (or for the 10-minute timeout).
4. Read their feedback and produce a revised version.
5. Add a `## Change Log` section to the artifact:
   ```markdown
   ## Change Log
   - **Fixed:** [What was fixed] (Source: @[agent])
   - **Hardened:** [What was strengthened] (Source: @[agent])
   - **Declined:** [Suggestion] -- [Reason]
   ```

### If You Are REVIEWER

1. Wait for DRAFTER's "ready" notification.
2. Read the artifact thoroughly.
3. Provide 3-5 actionable suggestions in this format:
   ```
   SUGGESTION 1: [Title]
   What: [Specific change]
   Why: [Benefit]
   ```
4. Deliver via comms.md entry or direct notification to DRAFTER.
5. Notify DRAFTER when done.

### If You Are BREAKER

1. Wait for DRAFTER's "ready" notification.
2. Read the artifact with an adversarial mindset. Assume future agents will be careless, rushed, and confused.
3. Provide 3-5 failure scenarios in this format:
   ```
   FAILURE 1: [Title]
   Attack: [How someone could misuse or break this]
   Consequence: [What goes wrong]
   Prevention: [How to guard against it]
   ```
4. Deliver via comms.md entry or direct notification to DRAFTER.
5. Notify DRAFTER when done.

## Completion Criteria

The pattern is COMPLETE when:

- [ ] DRAFTER created the initial artifact
- [ ] REVIEWER delivered at least 3 suggestions (or timed out)
- [ ] BREAKER delivered at least 3 failure scenarios (or timed out)
- [ ] DRAFTER produced a revised version incorporating feedback
- [ ] The artifact includes a correctly formatted Change Log
- [ ] Human notified of completion

## Example Prompt

```
Run the dev-collaboration skill.
artifact_path: plans/integration_plan.md

Roles:
  DRAFTER: claude
  REVIEWER: gemini
  BREAKER: codex

Deliver reviews via comms.md.
```

Two-agent example (dual-hatting):

```
Run the dev-collaboration skill.
artifact_path: specs/api_spec.md

Roles:
  DRAFTER: claude
  REVIEWER and BREAKER: codex

Codex: complete the REVIEWER phase first, then the BREAKER phase. Deliver separate outputs for each.
```
