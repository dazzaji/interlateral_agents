# Interlateral Agents v0.1 — Final Revisions Plan

**Date:** 2026-04-02
**Authority:** Dazza Greenwood, human project owner
**Repo:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents`

---

## Background and Context

This repo is a multi-agent starter built from a detailed spec. Before starting any work,
read these two documents for full context:

1. **The build plan:**
   `temp/plan.md` — describes who does what, the execution sequence, and success criteria.

2. **The authoritative spec (read ONLY the final section):**
   `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/reconciliation.md`
   — scroll to the section titled **"# BEST AND FINAL 0.1 VERSION FOLLOWS"**.
   That section contains: the HAS / DOES NOT HAVE boundaries, the proposed file structure,
   the 14-step build plan, the ROADMAP.md content, and the source-of-truth donor map.
   Do not read anything above that section.

3. **The review that produced this plan (for reference only, do not re-decide anything):**
   `temp/plan-implementation-review.md` — contains the dual-agent code review, red-team
   findings, and Codex's skill triage. This document is messy because two agents wrote into
   it across multiple rounds. This revisions plan supersedes it.

---

## Dazza's Rulings (binding, do not re-decide)

- **License:** Apache 2.0. The root `LICENSE` file stays. `interlateral_dna/package.json`
  has already been updated to `"Apache-2.0"`.
- **Skill catalog:** 12 skills for v0.1. 4 skills were removed from the shipped catalog
  (`create-skin`, `evals`, `hyperdomo`, `test-4-series`). Of those, 3 reusable skills
  (`create-skin`, `evals`, `hyperdomo`) are deferred and preserved in `ROADMAP.md`
  with absolute paths for future restoration. `test-4-series` is retired permanently as
  completed one-off work and is NOT part of the deferred catalog. 4 skills were rewritten
  (`adherence-check`, `dev-collaboration`, `dev-competition`, `search-synth`). 8 ship as-is.
- **Nice-to-haves are required:** All items below are in scope, not optional.
- **Do not commit** unless Dazza explicitly asks.

---

## Current State

A prior agent session (Claude Code + Codex) has already made all the changes listed below.
The changes are **uncommitted** in the working tree and may be a mix of staged and unstaged
edits. The next team's job is to:

1. **Review** every change for correctness, quality, and spec compliance
2. **Fix** anything that's wrong or incomplete
3. **Verify** using the checklist at the bottom
4. **Report** what's good and what needed fixing

---

## What Was Changed (review each one)

### A. Release Hygiene

| Change | File(s) | What to verify |
|---|---|---|
| Untracked runtime ledger from git | `interlateral_dna/comms.md` | `git ls-files` should NOT list this file. The file should still exist on disk. `.gitignore` should have an entry for it. |
| License updated to Apache-2.0 | `interlateral_dna/package.json` | The `"license"` field should say `"Apache-2.0"`. Must match root `LICENSE` file (Apache 2.0). |
| Security warning added | `README.md` | Should have a visible "Security Notice" section warning that `me.sh` uses `--dangerously-skip-permissions` and `--yolo`. Should be brief (2-3 sentences). |

### B. Skill Catalog (4 cut, 4 rewritten)

**Cut skills — verify they are fully removed:**

These 4 skills should NOT exist in `.agent/skills/`, `.claude/skills/`, or `.codex/skills/`:
- `create-skin`
- `evals`
- `hyperdomo`
- `test-4-series`

Verify `SKILLS.md` no longer lists them. Verify `ROADMAP.md` preserves **only**
`create-skin`, `evals`, and `hyperdomo` as deferred reusable skills with absolute paths, and
explicitly treats `test-4-series` as retired/completed rather than deferred.

**Rewritten skills — review each SKILL.md for quality and spec compliance:**

| Skill | File | Key requirements |
|---|---|---|
| `adherence-check` | `.agent/skills/adherence-check/SKILL.md` | Must require `artifact_path`, `spec_path`, `report_path`. Must STOP if `spec_path` is missing. Must keep PASS/FAIL/WARN/N/A model. No hardcoded repo-specific paths. |
| `dev-collaboration` | `.agent/skills/dev-collaboration/SKILL.md` | Must define 3 roles: Drafter, Reviewer, Breaker. Must allow `claude`, `codex`, `gemini` as role-holders. Must require explicit role assignment and `artifact_path`. Must state dual-hat rule for 2-agent teams. No AG/browser references. |
| `dev-competition` | `.agent/skills/dev-competition/SKILL.md` | Must require `competition_dir`, `requirement_path`, and 3 named agents (Implementer A, B, Judge). Must STOP if fewer than 3 agents. Must keep blind implementation and judge-against-requirement rules. No AG references. Examples must use `cc.js`/`codex.js`/`gemini.js`. |
| `search-synth` | `.agent/skills/search-synth/SKILL.md` | Must require `topic`, `output_file`, and explicit agent list with search capability declarations. Must STOP if no agent can search. No AG/browser/puppeteer references. |

After reviewing canonical copies, run `scripts/deploy-skills.sh` to sync deployed copies, then verify all 3 locations have exactly 12 skills each.

### C. DNA Script Hardening

| Change | File(s) | What to verify |
|---|---|---|
| Escape before Enter in `send()` | `interlateral_dna/cc.js`, `codex.js`, `gemini.js` | Each `send()` function should: `send-keys -l` (text), sleep, `send-keys Escape`, sleep, `send-keys Enter`. This matches `tmux-config.sh` hardening. |
| maxBuffer set to 10MB | `interlateral_dna/cc.js`, `codex.js` | Both should have `maxBuffer: 10 * 1024 * 1024` in `runTmux()`. `gemini.js` already had it. |
| `read()` command added | `interlateral_dna/cc.js`, `codex.js` | Both should have a `read()` function (matching `gemini.js`), a `case 'read':` in the switch, and updated usage string showing `| read`. |

### D. Launcher Safety

| Change | File(s) | What to verify |
|---|---|---|
| Session-kill guard | `me.sh` | Before `kill_if_exists`, `me.sh` should check if sessions have attached tmux clients. If so, warn and prompt for confirmation. A `--force` flag should bypass the prompt. |
| Dead-code if/else removed | `scripts/launch-cc-peer.sh`, `scripts/launch-gemini-peer.sh` | Both should have a simple `wait_for_idle ... \|\| true` + `agent_send_long` (or `agent_send_long_delayed`) — no if/else where both branches are identical. |
| Gemini send consolidated | `scripts/launch-gemini-peer.sh`, `scripts/tmux-config.sh` | The local `gemini_send_long` function should be removed from `launch-gemini-peer.sh`. Instead, `tmux-config.sh` should export an `agent_send_long_delayed` function with a configurable delay parameter. `launch-gemini-peer.sh` should call it with delay=1. |

### E. Nice-to-Have Items (promoted to required by Dazza)

| Change | File(s) | What to verify |
|---|---|---|
| Documentation-only note | `interlateral_dna/leadership.json` | Should have a `_note` field at the top stating this file is reference-only and no code reads it. |
| Session name validation | `scripts/launch-cc-peer.sh`, `launch-codex-peer.sh`, `launch-gemini-peer.sh` | All 3 should reject session names containing `/` or `..` with a clear error message before doing anything else. |
| Socket permissions | `scripts/tmux-config.sh` | Should have `umask 077` near the top, before any tmux operations, with a comment explaining it restricts socket permissions to owner-only. |

---

## Verification Checklist

Run these checks after reviewing and fixing all changes:

```bash
# 1. Syntax checks
bash -n me.sh scripts/*.sh
node --check interlateral_dna/cc.js interlateral_dna/codex.js interlateral_dna/gemini.js interlateral_dna/identity.js

# 2. Skill counts (all must be 12)
ls .agent/skills/ | wc -l
ls .claude/skills/ | wc -l
ls .codex/skills/ | wc -l

# 3. No tracked runtime artifacts
git ls-files | grep -E 'comms\.md|DS_Store|\.log$'
# ^ should return nothing

# 4. License consistency
head -2 LICENSE
grep '"license"' interlateral_dna/package.json
# ^ both should say Apache 2.0

# 5. Removed skills are gone from the shipped catalog
ls .agent/skills/create-skin .agent/skills/evals .agent/skills/hyperdomo .agent/skills/test-4-series 2>&1
# ^ should say "No such file or directory" for all 4

# 5b. ROADMAP deferred-skills section is correct
sed -n '/### 3.0 Deferred Skills/,/### 3.1/p' ROADMAP.md
# ^ should list absolute paths for create-skin, evals, and hyperdomo only, and should say
#   test-4-series is retired/completed rather than deferred

# 6. Rewritten skills have no dead references
grep -r 'interlateral_comms_monitor\|ag\.js\|courier\.js\|corpbot_agent_evals\|projects/Skills_Capability' .agent/skills/
# ^ should return nothing

# 7. DNA scripts have Escape hardening
grep -A2 "send-keys.*Enter" interlateral_dna/cc.js interlateral_dna/codex.js interlateral_dna/gemini.js
# ^ each should show Escape before Enter

# 8. Session name validation exists
grep -l 'session name must not contain' scripts/launch-cc-peer.sh scripts/launch-codex-peer.sh scripts/launch-gemini-peer.sh
# ^ should list all 3 files

# 9. me.sh has session-kill guard
grep -c 'attached\|--force' me.sh
# ^ should be > 0
```

---

## What NOT To Do

- Do not re-open the question of which skills belong in v0.1. The triage is final.
- Do not reclassify `test-4-series` as deferred. It is retired permanently, not part of the standing roadmap restoration set.
- Do not re-decide the license. Apache 2.0 is confirmed by Dazza.
- Do not add features, new files, or scope beyond what's listed here.
- Do not commit unless Dazza explicitly asks.
- Do not touch files not listed in this plan.

---

## Deliverable

When done, report back to Dazza with:
1. What you reviewed and what was already correct
2. What you fixed and why
3. Results of the verification checklist (paste the output)

---

## Agent Prompts

This is a single-agent job. Give it to **Codex (ipa-codex)** — it is the lead builder
for this repo per `temp/plan.md`, so it should own the final review pass. Claude Code
already made the changes; having Codex review them gives you two independent sets of eyes.

If both agents are available and you want to parallelize, give Codex the primary prompt
and give Claude the secondary prompt. Otherwise, Codex alone is sufficient.

### Primary Prompt — for Codex (lead reviewer + fixer)

```
You are the lead reviewer for the Interlateral Agents v0.1 final revisions.

Your task: review, fix, and verify all uncommitted changes in this repo.

Your complete instructions are in:

/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/revisions-plan.md

Read that file top to bottom before doing anything else. It contains:
- Pointers to the original spec and plan for context
- Dazza's binding rulings (license, skill triage, scope)
- Every change that was made, organized into sections A through E
- Specific verification criteria for each change
- A runnable verification checklist
- Rules about what NOT to do

For additional context, you may also read:
- temp/plan.md (the original build plan and role assignments)
- temp/reconciliation.md, section "# BEST AND FINAL 0.1 VERSION FOLLOWS" only
  (the authoritative v0.1 spec with HAS/DOES NOT HAVE, file structure, donor map)

Your job:
1. Read the revisions plan
2. Review every changed file listed in sections A through E against the stated criteria
3. Fix anything that is wrong, incomplete, or does not meet the spec
4. Run the verification checklist and paste the results
5. Report to Dazza: what was correct, what you fixed, and the checklist output

Do not commit. Do not add scope. Do not re-decide any of Dazza's rulings.
```

### Secondary Prompt — for Claude Code (optional parallel reviewer)

Only use this if both agents are running and you want a second pair of eyes.

```
You are the secondary reviewer for the Interlateral Agents v0.1 final revisions.

Codex is the lead reviewer. Your role is narrower: review the 4 rewritten skills
for quality and completeness. Do not edit any other files.

Read the revisions plan first:

/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/revisions-plan.md

Then read the original spec for context:
- temp/reconciliation.md, section "# BEST AND FINAL 0.1 VERSION FOLLOWS" only

Your specific tasks:
1. Read each rewritten skill:
   - .agent/skills/adherence-check/SKILL.md
   - .agent/skills/dev-collaboration/SKILL.md
   - .agent/skills/dev-competition/SKILL.md
   - .agent/skills/search-synth/SKILL.md
2. Check each against its requirements in section B of the revisions plan
3. Check for dead references: grep for ag.js, courier.js, interlateral_comms_monitor,
   corpbot_agent_evals, projects/Skills_Capability across all skills
4. Report findings to both Codex (via node interlateral_dna/codex.js send) and Dazza:
   which skills pass review, which need fixes, and what the fixes are

Do not edit any files unless explicitly asked by Codex or Dazza. Your role is
review-only — Codex owns all file edits to avoid parallel-edit collisions.
Do not commit. Do not re-decide any of Dazza's rulings.
```
