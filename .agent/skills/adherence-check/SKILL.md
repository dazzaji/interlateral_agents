---
name: adherence-check
description: Check any artifact against an explicit specification and report adherence using the add-comments workspace format. Use when validating plans, scripts, docs, or code changes against a source-of-truth spec.
metadata:
  owner: interlateral
  version: "2.0"
  depends-on: add-comments
compatibility: Requires access to repo files and ability to edit the specified report file
---

# Adherence Check

## Purpose

Verify that a specific artifact adheres to a given specification, then report any violations using the add-comments workspace format.

This skill is repo-agnostic. It works in any repository as long as you supply the three required inputs.

## Inputs (All Required)

| Input           | Description                                              |
|-----------------|----------------------------------------------------------|
| `artifact_path` | Path to the file or artifact to check                    |
| `spec_path`     | Path to the source-of-truth specification to check against |
| `report_path`   | Path to the file where the adherence report will be appended |

If any input is missing, STOP and ask the caller to provide it before proceeding.

## Prerequisite Gate

Before starting evaluation, verify that both `artifact_path` and `spec_path` resolve to existing, readable files.

- If `spec_path` is missing or the file does not exist: **STOP immediately.** Report the missing prerequisite to the caller. Do not improvise a specification. Do not guess requirements.
- If `artifact_path` is missing or the file does not exist: **STOP immediately.** Report the missing artifact to the caller.

## Procedure

### Step 1: Read the Specification

1. Read the file at `spec_path`.
2. Identify the set of requirements, rules, or constraints it defines.
3. If the spec contains a quick-start matrix, change-type index, or table of contents, use it to scope which sections apply to the artifact. Record the list of applicable sections (numbers and titles, if available).
4. If the spec has no such index, treat every requirement as potentially applicable.

### Step 2: Read the Artifact

Read the artifact at `artifact_path`. Identify the specific behaviors, statements, or instructions that must align with the spec requirements.

For large artifacts:
- Scan headings or file structure first.
- Deep-read only the sections relevant to the applicable requirements.
- For code artifacts, focus on behavior and implications; cite file paths and line numbers where possible.

### Step 3: Evaluate Each Requirement

For each applicable requirement in the spec:

- **PASS** -- the artifact clearly satisfies the requirement.
- **FAIL** -- the artifact violates or omits the requirement.
- **WARN** -- the requirement may be violated but evidence is ambiguous; explain the ambiguity. When unsure whether something is a true violation, use WARN rather than FAIL.
- **N/A** -- the requirement does not apply to this artifact.

Record FAIL and WARN items in the report details. Include all counts in the summary.

Tip: Keep a simple tally table as you go (PASS / FAIL / WARN / N/A) to avoid count errors.

### Step 4: Write the Report (Exact Structure)

Draft the report in a scratch buffer or temporary file first, then append via add-comments.

Use this structure exactly:

```markdown
# Adherence Check Report

**Artifact checked**: [artifact_path]
**Spec checked against**: [spec_path]
**Checked by**: [Agent name]
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
**Artifact type**: [e.g., script, plan, doc, code module]
**Sections checked**: [List section numbers + titles, or "all" if spec has no sections]

## Summary
- Requirements checked: [N]
- PASS: [X]
- FAIL: [Y]
- WARN: [W]
- NOT APPLICABLE: [Z]

## Violations

### FAIL: [Requirement identifier] - [Requirement title or short description]

**Requirement**: [Quote or paraphrase the spec requirement]

**Artifact evidence**: [Quote exact text or cite line numbers / snippet]

**Gap**: [Specific mismatch]

**Suggested fix**: [Concrete correction]

---

### WARN: [Requirement identifier] - [Requirement title or short description]

**Requirement**: [Quote or paraphrase the spec requirement]

**Artifact evidence**: [Quote exact text or cite line numbers / snippet]

**Gap**: [Specific mismatch + why it is ambiguous]

**Suggested fix**: [Concrete correction or clarification needed]

---

[Repeat for each failure or warning]

## Notes (Optional)
- [Any brief caveats or follow-ups]
```

If there are no violations:

```markdown
## Violations

None found.
```

### Step 5: Deliver via add-comments

Use the **add-comments** skill to append the report to `report_path`:

1. Add or locate the main header: `# AI AGENT COMMENTS AND WORK FOLLOW`
2. Add or locate your workspace header: `## Codex Workspace`
3. Append a timestamped entry and include the report.
4. End with `---`.

Do not edit any other agent workspaces.
Never overwrite or replace the file; append only via add-comments.
If the add-comments skill is missing or broken, STOP and report the dependency failure.

## Completion Checklist

- [ ] Both `spec_path` and `artifact_path` verified to exist
- [ ] Spec read and requirements cited by section/identifier
- [ ] Artifact read and referenced with evidence
- [ ] Report matches the exact structure above
- [ ] Each FAIL/WARN includes Requirement, Evidence, Gap, Suggested fix
- [ ] Report delivered using add-comments workspace rules
- [ ] Summary math is correct (PASS + FAIL + WARN + N/A = Requirements checked)

## Example Invocation

```
"Run adherence-check.
  artifact_path: src/deploy.sh
  spec_path: docs/deploy-spec.md
  report_path: reports/adherence-results.md"
```
