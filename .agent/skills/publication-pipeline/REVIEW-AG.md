# Publication Pipeline - Design Review & Improvement Suggestions
**Author:** AG (Antigravity)
**Date:** 2026-01-31 (UTC)

## 1. Naming & Concept
*   **Current Name:** `publication-pipeline`
*   **Suggestion:** **`consensus-mesh-release`** or **`redline-to-release`**.
*   **Rationale:** "Publication Pipeline" sounds like a linear Jenkins CI job. In the context of Agent Skills and Interlateral, this is a **multi-agent mesh** reaching consensus. Using "Consensus" or "Redline" signals the professional/legal grounding of the repo.

## 2. Redundancy & Sequencing
*   **Redundancy:** In **Round 1**, `REVIEWER` (accuracy) and `REDTEAM` (weaknesses/gaps) often overlap in practice.
*   **Better Sequencing:**
    *   **Phase 0: Pre-flight (Automated):** Run `adherence-check` BEFORE any human/agent starts reviewing to ensure the file is even ready for intake.
    *   **Round 1: Content & Conflict:** Keep `REVIEWER` + `REDTEAM`.
    *   **Round 2: Strategic Alignment:** Keep `ANALYST`.
    *   **Round 3: Polish & Prove:** Combine `EDITOR` and `EVALUATOR`.

## 3. Missing Elements (The "Interlateral Edge")
*   **Evaluation Gate:** The current design lacks an automated verification step. It should explicitly call for the `evals` skill (Lake Merritt) after Round 3.
*   **Audit Trail:** The protocol should mandate use of the `add-comments` skill for every role to ensure a clean, attributable review history.
*   **The "Breaker" Role:** For high-stakes content, we should assign a `CX-BREAKER` role in Round 1 specifically to look for "Expertise Debt" (as per the Skills4Skills blog post).

## 4. Quality Gates
*   **Mandatory ACK:** Every round should start with an injection of an ACK from the assigned agents.
*   **Issue Tracking:** Adoption of a "No Unresolved Issues" rule. The `PUBLISHER` should not see the file until the `evals` skill confirms `revision_addressed` for all Round 1/2 comments.

## 5. Better Examples
*   The example prompt should use absolute paths and mention the `work.md` project context more explicitly to guide the agents.

## Proposed Protocol Revision (The "Mesh" Version)
1. **Pre-flight:** `CC` runs `adherence-check`.
2. **Construction:** `DRAFTER` builds using `peer-collaboration`.
3. **Intake Review (Mesh):** `REVIEWER` + `REDTEAM` use `add-comments`.
4. **Strategic Review:** `ANALYST` checks political/business risk.
5. **Quality Assurance:** `EDITOR` polishes + `EVALUATOR` (Automated) runs `evals`.
6. **Authorization:** `PUBLISHER` approves.

---
**AG Status:** Task Complete. CC notified via `cc.js`.
