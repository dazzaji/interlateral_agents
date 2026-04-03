---
name: adherence-check
description: Check an artifact against INTERNALS_CONFORMANCE.md and report violations using the add-comments workspace format; use when validating plans, scripts, docs, or code changes.
metadata:
  owner: interlateral
  version: "1.1"
  depends-on: add-comments
compatibility: Requires access to repo files and ability to edit the specified report file
---

# Adherence Check

## Purpose
Verify that a specific artifact (plan, code change, or document) adheres to the repo's conformance requirements, then report any violations using the add-comments workspace format.

## Inputs (Required)
You must be given:
1. **Artifact to check** (path)
2. **Report destination** (path to file where your report will be appended)

If either input is missing, request it before proceeding.

## Source of Truth
Conformance document:
`interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md`

Full path from repo root:
`<repo>/interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md`

If the conformance doc is missing at this path, STOP and report the error to the requester.

## Procedure

### Quick Start (Required)
1. Identify the change type using Section 0 (Quick Start Matrix).
2. Use that mapping to scope which sections you must check.
3. You do NOT need to read the entire conformance doc if Section 0 scopes it.

### Step 1: Identify Applicable Conformance Sections
1. Read the conformance doc.
2. Use Section 0 (Quick Start Matrix) to map the artifact to relevant sections.
3. Record the list of sections you will check (section numbers + titles).

### Step 2: Read the Artifact
Read the artifact at the provided path. Identify the specific behaviors, statements, or instructions that must align with conformance requirements.

For large artifacts or codebases:
- Scan headings or file structure first.
- Deep-read only the sections relevant to the change type.
- For code artifacts, focus on behavior and implications; cite file paths and line numbers where possible.

### Step 3: Evaluate Each Requirement
For each applicable conformance section:
- **PASS** if the artifact clearly satisfies the requirement.
- **FAIL** if the artifact violates or omits the requirement.
- **WARN** if the requirement may be violated but evidence is ambiguous; explain the ambiguity.
- **N/A** if the requirement does not apply.

Record **FAIL** and **WARN** items in the report details, but include all counts in the summary.

Tip: Keep a simple tally table as you go (PASS/FAIL/WARN/N/A) to avoid count errors.

### Step 4: Write the Report (Exact Structure)
Draft the report in a scratch buffer or temporary file first, then append via add-comments.

Use this structure exactly:

```markdown
# Adherence Check Report

**Artifact checked**: [path]
**Conformance doc**: interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md
**Checked by**: [Agent name]
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
**Change type**: [e.g., scripts-only, docs-only, backend-only]
**Sections checked**: [List section numbers + titles]

## Summary
- Sections checked: [N]
- PASS: [X]
- FAIL: [Y]
- WARN: [W]
- NOT APPLICABLE: [Z]

## Violations

### FAIL: Section [X.Y] - [Section Title]

**Requirement**: [Quote or paraphrase the conformance requirement]

**Artifact evidence**: [Quote exact text or cite line numbers / snippet]

**Gap**: [Specific mismatch]

**Suggested fix**: [Concrete correction]

---

### WARN: Section [X.Y] - [Section Title]

**Requirement**: [Quote or paraphrase the conformance requirement]

**Artifact evidence**: [Quote exact text or cite line numbers / snippet]

**Gap**: [Specific mismatch + why it is ambiguous]

**Suggested fix**: [Concrete correction or clarification needed]

---

[Repeat for each failure or warning]

## Notes (Optional)
- [Any brief caveats or follow-ups]
```

If there are **no violations**, include:

```markdown
## Violations

None found.
```

### Step 5: Deliver via add-comments
Use the **add-comments** skill to append the report to the destination file:
1. Add or locate the main header: `# AI AGENT COMMENTS AND WORK FOLLOW`
2. Add or locate your workspace header: `## Codex Workspace`
3. Append a timestamped entry and include the report.
4. End with `---`.

Do not edit any other agent workspaces.
Never overwrite or replace the file; append only via add-comments.
If the add-comments skill is missing or broken, STOP and report the dependency failure.

## Completion Checklist (Measurable)
- [ ] Conformance doc read and cited by section number
- [ ] Artifact read and referenced with evidence
- [ ] Report matches the exact structure above
- [ ] Each FAIL/WARN includes Requirement, Evidence, Gap, Suggested fix
- [ ] Report delivered using add-comments workspace rules
- [ ] Summary math is correct (PASS + FAIL + WARN + N/A = Sections checked)

## Example Prompt

```
"Run the adherence-check skill at projects/Skills_Capability/workspace_for_skills/adherence-check/SKILL.md.
Check: dev_plan/dev_plan.md
Report to: projects/conformance_results.md
Notify me when complete."
```

---

# Agent Reviews

## Codex Review - 2026-01-22

### What Works Well
- Clear inputs and source-of-truth callout reduce ambiguity.
- Report template is structured and enforces evidence + suggested fix per failure.
- Explicit add-comments delivery steps align with the coordination plan.

### Suggestions for Improvement
- Require quoting a specific line or snippet for "Artifact evidence" to avoid vague assertions.
- Add a note to include section titles alongside numbers in the summary list for readability.

### Breaker Notes (What Could Go Wrong)
- Agent checks the wrong conformance sections if the change type is misidentified.
- Report gets appended outside the correct workspace, contaminating other agent logs.

### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- Yes, the workflow is explicit and the format is strict.
- Missing: a one-line reminder to verify Section 0 change type first.
- Suggested addition: a short "Change type quick check" bullet before evaluation.

---

---

# Agent Reviews

## Claude Code Review - 2026-01-22

### What Works Well
- Explicit dependency declaration (`depends-on: add-comments`) in metadata is excellent for skill chaining
- The report structure template is exact and copy-pasteable, reducing interpretation errors
- "Change type" field in the report helps the reader quickly assess scope
- Completion checklist is measurable with concrete criteria
- Good fallback for no violations ("None found.")

### Suggestions for Improvement
- **Add full path to conformance doc:** The skill says `interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md` but a cold agent might not know this is relative to repo root. Consider: "Full path from repo root: `<repo>/interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md`"
- **Clarify "Artifact evidence" field:** The template says "[The relevant line(s) or behavior]" - clarify whether this should be a direct quote, line number reference, or paraphrase. Suggestion: "Quote the exact text or cite line numbers (e.g., 'Line 45: uses localhost instead of 127.0.0.1')"
- **Add guidance for partial artifacts:** If the artifact is code (not a doc), how should the agent handle checking it? Add: "For code artifacts, focus on behavior implications rather than literal text matching."

### Breaker Notes (What Could Go Wrong)
- **Conformance doc doesn't exist:** If someone renames or moves INTERNALS_CONFORMANCE.md, the skill breaks silently. Prevention: Add "If conformance doc not found at expected path, STOP and report the error to the human."
- **False positives from overly strict reading:** An agent might flag something as FAIL when the artifact handles it differently but correctly. Prevention: Add "If unsure whether something is a true violation, mark it as WARN instead of FAIL and explain the ambiguity."
- **Report overwrites previous entries:** If agent doesn't follow add-comments correctly, they might replace rather than append. Prevention: The add-comments skill already handles this, but consider adding: "NEVER use file-write/replace operations. ONLY append via add-comments."

### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- **Assessment:** Yes, with minor gaps. The procedure is clear and the template is explicit.
- **Missing context:** No mention of what to do if the conformance doc is very long (it is ~600+ lines). A cold agent might get overwhelmed.
- **Suggested addition:** Add a "Quick Start" tip: "Focus on Section 0 (Quick Start Matrix) first - it maps change types to relevant sections, so you don't need to read the entire conformance doc."

---

---

# Agent Reviews

## Antigravity Review - 2026-01-22

### What Works Well
- **Explicit Dependency:** Calling out `add-comments` as a dependency is good architecture.
- **Source of Truth:** Pointing to `INTERNALS_CONFORMANCE.md` prevents hallucinated rules.
- **Summary Math:** The requirement to check `PASS + FAIL + N/A = Total` is a great self-consistency check.

### Suggestions for Improvement
- **Workflow Flow:** Step 4 (Write) and Step 5 (Deliver) could conduct the user to "Write to temp, then append". Writing directly to the file in Step 4 might risk overwriting if `add-comments` isn't used correctly.
- **Context Handling:** For large artifacts, a "Scan Headers Only" mode might be needed to avoid context overflow.

### Breaker Notes (What Could Go Wrong)
- **Dependency Failure:** If `add-comments` skill is broken or missing, this skill fails completely.
- **Pass Counting:** "Record only FAIL items" in detail but "Count PASS items" in summary requires keeping a mental tally, which is cognitive load.

### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- **Assessment:** YES.
- **Detailed Note:** The "Exact Structure" section is perfect for an agent to just fill-in-the-blanks.

---

## Change Log

### Changes Made
- Added full repo-root path for the conformance doc and a hard stop if missing; prevents silent failure when the file moves.
- Added a required Quick Start step to scope sections via Section 0; reduces cold-start overload and change-type errors.
- Added large-artifact and code-artifact guidance; focuses checks on relevant sections and behavior/line evidence.
- Introduced WARN status and a WARN template; handles ambiguity without forcing false FAILs.
- Required explicit evidence quoting/line references; improves auditability of violations.
- Added scratch-draft instruction plus append-only warning and add-comments dependency failure stop; prevents overwrites and bad delivery.
- Added tally tip and updated summary math to include WARN; reduces counting errors.

### Suggestions Not Accepted
- None. All review feedback items were implemented or already satisfied by existing text (e.g., sections-checked list already requires numbers + titles).
