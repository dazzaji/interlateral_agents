---
name: evals
description: Run the OTEL eval workflow end-to-end (export trace, run eval packs via run-skill-eval.sh, collect JSON/Markdown report locations, and summarize results). Use when asked to execute or verify evals, generate LLM-as-judge reports, or audit eval pipeline outputs.
metadata:
  owner: interlateral
  version: "2.2"
  requires:
    - python3
    - openai
---

# Evals Skill

## Preflight

- Confirm `.env` exists at repo root with `OPENAI_API_KEY=...`.
- Ensure `.env` is gitignored and not tracked (`git ls-files --error-unmatch .env` should fail).
- Install Python deps if needed:
  - `pip install -r corpbot_agent_evals/lake_merritt/requirements.txt`
- Do not print or paste API keys into logs or comms.

## Pick the Trace

Choose one:

1) Use the most recent trace for a skill:
```bash
TRACE=$(ls -t .observability/traces/<skill>_*.json 2>/dev/null | head -1)
```

2) Export a new trace from events:
```bash
./scripts/export-skill-run.sh "<start_time>" "<end_time>" "<skill_name>"
TRACE=$(ls -t .observability/traces/<skill_name>_*.json 2>/dev/null | head -1)
```

If `TRACE` is empty, stop and report the missing trace.

## Run Evals

Default pack list (all 7):
- `revision_addressed`
- `reviewer_minimum`
- `approval_chain`
- `review_timing`
- `decline_percentage`
- `token_cost`
- `courier_usage`

Run all packs:
```bash
for pack in revision_addressed reviewer_minimum approval_chain review_timing decline_percentage token_cost courier_usage; do
  ./scripts/run-skill-eval.sh "$TRACE" "$pack" || echo "FAILED: $pack"
done
```

Run a single pack:
```bash
./scripts/run-skill-eval.sh "$TRACE" revision_addressed
```

## Report Results

- Reports are written to:
  - `.observability/evals/<pack>_<timestamp>.json`
  - `.observability/evals/<pack>_<timestamp>.md`
- Summarize:
  - Which trace was used
  - Which packs ran
  - Any failures (pack name + error)
  - Locations of the JSON and MD reports

## Red-Team Checks

- Confirm the trace contains the expected skill window and markers.
- Verify real LLM evaluation ran (no MOCK fallback messages).
- If any pack is trace-level, ensure it uses `evaluation_mode: trace`.
- Flag any missing metadata (e.g., breaker_review/change_log) in outputs.

## Coordination Output

Write a comms entry in strict format and (if needed) send via courier outbox:

```
[Codex] @CC [YYYY-MM-DD HH:MM:SS]
Evals run: <trace>
Packs: <list>
Reports: <paths>
Failures: <none | list>

---
```

If CC/AG must be notified immediately, send a courier outbox message after logging.

## Troubleshooting: MOCK vs REAL Mode

If eval reports show `"mock_evaluation": true` or `MOCK_PASS`, the LLM judge is not running. To enable REAL evaluations:

1. **Verify Python dependencies:**
   ```bash
   pip install openai pyyaml pydantic python-dotenv jinja2 tenacity
   ```

2. **Verify API key:**
   ```bash
   grep -q "^OPENAI_API_KEY=" .env && echo "API key present" || echo "Missing"
   ```

3. **Verify evaluation engine exists:**
   ```bash
   ls corpbot_agent_evals/lake_merritt/core/evaluation.py
   ```

If `evaluation.py` is missing, the full Lake Merritt package needs to be installed. Contact the repo maintainer or check if the package needs to be copied from the source repository.

**Real mode indicators:**
- Reports contain actual LLM reasoning, not placeholder text
- JSON shows `"mock_evaluation": false` or no mock field
- Scores vary based on actual trace content
