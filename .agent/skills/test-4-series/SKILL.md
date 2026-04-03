---
name: test-4-series
description: Test 4 Series - dev-collaboration evaluation tests
version: "1.0"
contract_version: "1.0"
type: project-skill
compatible_manager: hyperdomo
---

# Test 4 Series Project Skill

## Project Identity

- **Project ID:** test-4-series
- **Tests:** 4A, 4B, 4C, 4D
- **Purpose:** Evaluate dev-collaboration pattern with tri-agent mesh

## Execution Semantics

**IMPORTANT:** This skill file is a **human-readable procedure**, NOT an auto-executed DSL.

HyperDomo reads this file and executes each phase/action **manually** by:
- Running shell commands via Bash tool
- Sending prompts via `node interlateral_dna/cc.js send-file`, `node interlateral_dna/ag.js send`, etc.
- Checking signals in comms.md via grep/read
- Setting variables in its own context

There is **no interpreter** that parses and runs the YAML automatically. The YAML structure provides a consistent format that HyperDomo follows step-by-step.

## Variable Binding Model

**Model A (Prompt-Authoritative):** Each prompt file (`prompts/test4/{TEST_ID}.md`) contains YAML frontmatter that declares:
- `ARTIFACT_PATH` - Full path to the artifact file
- `REVIEW_FILE` - Full path to the review file

HyperDomo extracts these from the prompt frontmatter in Phase 1 and uses them directly. No `ARTIFACT_NAME` placeholder is needed.

## Configuration

```yaml
config:
  project_id_prefix: "test4"
  prompt_source_dir: "prompts/test4/"
  artifact_output_dir: "projects/eval_data/artifacts/"
  review_output_dir: "projects/eval_data/"
  trace_output_dir: ".observability/traces/"
  eval_output_dir: ".observability/evals/"

  worker_roles:
    cc_worker: "DRAFTER"
    ag: "REVIEWER"
    codex: "BREAKER"

  eval_packs:
    - "revision_addressed"
    - "reviewer_minimum"
    - "approval_chain"

  report_naming:
    worker_report: "test_4{TEST_ID}_FinalReport.md"
    manager_report: "HyperDomo_Report_Test4{TEST_ID}.md"
    review_file: "test4{TEST_ID}_reviews.md"

  success_criteria:
    all_evals_pass: true
    min_eval_score: 0.8
```

## Phases

### Phase 1: Preparation

```yaml
phase: 1-PREPARATION
actions:
  - type: READ_FILE
    path: "test_4A_FinalReport.md"
    purpose: "Understand prior test learnings"
  - type: READ_FILE
    path: "prompts/test4/{TEST_ID}.md"
    purpose: "Load test prompt and extract metadata from frontmatter"
  - type: SET_VAR
    name: "ARTIFACT_PATH"
    value_from_file: "prompts/test4/{TEST_ID}.md"
    extract_key: "ARTIFACT_PATH"
    comment: "Model A: Prompt is authoritative for paths (see Variable Binding Model)"
  - type: SET_VAR
    name: "REVIEW_FILE"
    value_from_file: "prompts/test4/{TEST_ID}.md"
    extract_key: "REVIEW_FILE"
    comment: "Model A: Prompt is authoritative for paths (see Variable Binding Model)"
  - type: ASSERT
    condition: "non_empty({ARTIFACT_PATH})"
    on_fail: HARD_FAIL
    message: "ARTIFACT_PATH extraction failed - check prompt frontmatter"
  - type: ASSERT
    condition: "non_empty({REVIEW_FILE})"
    on_fail: HARD_FAIL
    message: "REVIEW_FILE extraction failed - check prompt frontmatter"
```

**Manual execution (per Option 2):** HyperDomo reads this phase and implements it using its Bash tool. The runsheet (hyperdomo_runsheet.md) specifies the exact grep/sed commands HyperDomo uses. The skill file declares WHAT (extract these keys), the runsheet declares HOW (specific shell commands).

### Phase 2: Wake Workers

```yaml
phase: 2-WAKE
primitive: WAKE_WORKERS
config:
  wait_for_acks: [cc_worker, ag, codex]
  timeout_seconds: 120
  on_timeout: partial_mode
```

### Phase 3: Assignment

```yaml
phase: 3-ASSIGNMENT
actions:
  - type: SEND_PROMPT
    agent: cc_worker
    file: "prompts/test4/{TEST_ID}.md"
    append: |
      ---
      **RUN TOKEN:** {RUN_TOKEN}
      **ARTIFACT PATH:** {ARTIFACT_PATH}
      **REVIEW FILE:** {REVIEW_FILE}

      When complete, post: `[CC] SKILL COMPLETE [{RUN_TOKEN}]`
      Post artifact path: `[FINAL_ARTIFACT][{RUN_TOKEN}]: {ARTIFACT_PATH}`
```

### Phase 4: Monitor & Review Gate

```yaml
phase: 4-REVIEW_GATE
primitive: REVIEW_GATE
config:
  max_rounds: 5
  wait_for_signal: "[CC] SKILL COMPLETE [{RUN_TOKEN}]"
  monitor_signals:
    - "[AG] APPROVE [{RUN_TOKEN}]"
    - "[AG] REQUEST CHANGES [{RUN_TOKEN}]"
    - "[Codex] APPROVE [{RUN_TOKEN}]"
    - "[Codex] REQUEST CHANGES [{RUN_TOKEN}]"
  nudge_after_minutes: 20
  escalate_after_nudges: 3
```

### Phase 5: Postflight

```yaml
phase: 5-POSTFLIGHT
actions:
  - type: QUIESCENCE_CHECK
    path: "{ARTIFACT_PATH}"
    stable_seconds: 10
  - type: RUN_COMMAND
    cmd: "./scripts/end-session.sh"
  - type: SET_VAR
    name: "SESSION_ID"
    value_from_json:
      file: ".observability/session_state.json"
      key: "eval_session_id"
      fallback_key: "session_id"
    capture_with_token: "{RUN_TOKEN}"
    comment: "Prefer eval_session_id; capture immediately to avoid race"
  - type: RUN_COMMAND
    cmd: "./scripts/harvest-session.sh {SESSION_ID}"
  - type: RUN_COMMAND
    cmd: "./scripts/verify-harvest.sh .observability/runs/{SESSION_ID}"
  - type: RUN_COMMAND
    cmd: "ARTIFACT_PATH={ARTIFACT_PATH} REVIEW_FILE={REVIEW_FILE} ./scripts/export-skill-run.sh --bundle {SESSION_ID}"
  - type: SET_VAR
    name: "TRACE_PATH"
    value_from_file: ".observability/last_trace.txt"
```

### Phase 6: Evaluation

```yaml
phase: 6-EVALUATION
actions:
  - type: ASSERT
    condition: "file_exists({TRACE_PATH})"
    on_fail: HARD_FAIL
    message: "Trace file not found at {TRACE_PATH}"
  - type: RUN_COMMAND
    cmd: "./scripts/run-skill-eval.sh {TRACE_PATH} revision_addressed"
  - type: RUN_COMMAND
    cmd: "./scripts/run-skill-eval.sh {TRACE_PATH} reviewer_minimum"
  - type: RUN_COMMAND
    cmd: "./scripts/run-skill-eval.sh {TRACE_PATH} approval_chain"
  - type: COLLECT_RESULTS
    source: ".observability/evals/*.md"
    into: "eval_results"
    filter: "newest 3 files OR files matching TRACE_PATH basename"
    comment: "Eval files use trace basename, not SESSION_ID. Collect newest or by trace."
```

### Phase 7: Reporting

```yaml
phase: 7-REPORTING
actions:
  - type: SET_VAR
    name: "WORKER_REPORT_NAME"
    value: "test_4{TEST_ID}_FinalReport.md"
  - type: SET_VAR
    name: "MANAGER_REPORT_NAME"
    value: "HyperDomo_Report_Test4{TEST_ID}.md"
  - type: SEND_PROMPT
    agent: cc_worker
    message: |
      Create {WORKER_REPORT_NAME} following test_4A_FinalReport.md format.
      Include: What worked, what didn't, gaps, solutions, eval results.
      Get reviews from AG and Codex before finalizing.
      When complete, post: `[CC] REPORT COMPLETE [{RUN_TOKEN}]`
  - type: WAIT_SIGNAL
    pattern: "[CC] REPORT COMPLETE [{RUN_TOKEN}]"
    timeout_minutes: 30
  - type: CREATE_REPORT
    template: "hyperdomo_report"
    output: "{MANAGER_REPORT_NAME}"
    include:
      - execution_summary
      - artifact_manifest
      - eval_results
      - findings
      - conclusions
      - next_steps
  - type: SIGNAL
    message: "[MANIFEST_COMPLETE][{RUN_TOKEN}]"
```

## Artifact Manifest (Output Contract)

```yaml
artifact_manifest:
  deliverable: "{ARTIFACT_PATH}"
  reviews: "{REVIEW_FILE}"
  worker_report: "{WORKER_REPORT_NAME}"
  manager_report: "{MANAGER_REPORT_NAME}"
  trace: "{TRACE_PATH}"
  evals:
    - ".observability/evals/revision_addressed_*.md"
    - ".observability/evals/reviewer_minimum_*.md"
    - ".observability/evals/approval_chain_*.md"
```

## Test Assignments

### Test 4A (Completed)

- **Artifact:** Privacy Policy
- **Status:** Complete
- **Report:** `test_4A_FinalReport.md`

### Test 4B

- **Artifact:** TBD per prompt
- **Prompt:** `prompts/test4/4B.md`
- **Status:** Ready

### Test 4C

- **Artifact:** TBD per prompt
- **Prompt:** `prompts/test4/4C.md`
- **Status:** Ready

### Test 4D

- **Artifact:** TBD per prompt
- **Prompt:** `prompts/test4/4D.md`
- **Status:** Ready

## Usage

Human invokes:
```
HyperDomo, run test-4-series with TEST_ID=4B
```

HyperDomo:
1. Loads this skill
2. Validates required fields
3. Interpolates `{TEST_ID}` -> `4B` throughout
4. Executes phases 1-7
5. Produces `HyperDomo_Report_Test4B.md`

---

*Test 4 Series Project Skill v1.0 - Approved by AG and Codex (MISSION 03)*
