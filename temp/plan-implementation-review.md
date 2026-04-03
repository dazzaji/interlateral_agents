# Claude Code Review and Red-Team Results

**Date:** 2026-04-02
**Reviewer:** Claude Code (ipa-claude)
**Spec:** `temp/reconciliation.md` section "BEST AND FINAL 0.1 VERSION FOLLOWS"

## Spec Compliance: What Was Built vs What Was Specified

| Spec Requirement | Status | Notes |
|---|---|---|
| `me.sh` duo launcher with ACK handshake | DONE | Working. Session names default to `ia-claude`/`ia-codex` per spec. |
| `scripts/tmux-config.sh` with merged helpers | DONE | Has `agent_send`, `codex_send_clean`, `agent_send_long`, idle detection, `next_peer_session_name`. Socket defaults to `/tmp/interlateral-agents-tmux.sock`. |
| `interlateral_dna/cc.js` | DONE | Uses `execFileSync` (safer than `execSync`). Identity stamping via `identity.js`. Correct defaults. |
| `interlateral_dna/codex.js` | DONE | Parallel to `cc.js`. |
| `interlateral_dna/gemini.js` | DONE | Has 1-second delay. Also has `read()` function that cc.js/codex.js lack. |
| `interlateral_dna/identity.js` | DONE | Includes `agent_type` field per spec. |
| `interlateral_dna/leadership.json` | DONE | Present but not wired to any code — documentation-only. |
| `interlateral_dna/LIVE_COMMS.md` | DONE | Clean canonical reference. |
| `interlateral_dna/package.json` | DONE | Present. License says MIT (conflicts with root LICENSE). |
| `scripts/launch-codex-peer.sh` | DONE | Works. |
| `scripts/send-codex-peer.sh` | DONE | Works. |
| `scripts/launch-cc-peer.sh` | DONE | Works but has dead-code if/else. |
| `scripts/launch-gemini-peer.sh` | DONE | Works but has dead-code if/else and duplicated `gemini_send_long`. |
| `scripts/deploy-skills.sh` | DONE | Copies `.agent/skills/` to `.claude/skills/` and `.codex/skills/`. |
| `scripts/shutdown.sh` | DONE | Kills all sessions + server on the socket. |
| 16 canonical Skills in `.agent/skills/` | DONE | All 16 present and deployed to `.claude/` and `.codex/`. |
| `SKILLS.md` | DONE | Accurate index of all 16. |
| `CLAUDE.md` | DONE | ~1.8KB, simplified. Boot protocol, skills, comms. |
| `AGENTS.md` | DONE | ~1.7KB. Codex instructions. |
| `GEMINI.md` | DONE | ~1.4KB. Notes 1s delay. |
| `README.md` | DONE | Clean quickstart. |
| `TROUBLESHOOTING.md` | DONE | Common issues. |
| `ROADMAP.md` | DONE | Comprehensive deferred-feature list. |
| `.gitignore` | DONE | Covers `comms.md`, `*.log`, `.env`, `node_modules`, `.DS_Store`. |
| `.env.example` | DONE | Minimal identity vars. |

**All 14 build steps are complete. The file structure matches the spec.**

## Issues Found (Ranked by Severity)

### MUST FIX (blocking v0.1 release)

1. **Runtime artifacts tracked in git.** `comms.md` is committed despite being in `.gitignore`. It currently contains session data from `interlateral_platform_alpha` (wrong project). Fix: `git rm --cached interlateral_dna/comms.md`. Also remove any tracked `.DS_Store` files.

2. **License inconsistency.** Root `LICENSE` is Apache 2.0. `interlateral_dna/package.json` says `"license": "MIT"`. Pick one and make them agree.

3. **Skills with dead references (agrees with Codex finding #1).** 6 of 16 Skills reference infrastructure not present in this repo: `adherence-check`, `create-skin`, `evals`, `hyperdomo`, `test-4-series`, and `search-synth` reference files like `interlateral_comms_monitor/`, `corpbot_agent_evals/`, `ag.js`, `courier.js`, `.observability/`, and various scripts. A cold agent trying to follow these Skills will hit dead ends.

### SHOULD FIX

4. **Dead-code if/else in `launch-cc-peer.sh` (lines 42-46) and `launch-gemini-peer.sh` (lines 55-59).** Both branches of each if/else do the identical thing. Copy-paste artifact.

5. **`me.sh` silently kills existing sessions (lines 100-101).** Running `me.sh` while Terminal.app windows are attached to the sessions will instantly kill those terminals with no warning. This is what caused Dazza's terminal crash earlier. Should add a guard/warning.

6. **`maxBuffer` inconsistency.** `gemini.js` sets `maxBuffer: 10MB`. `cc.js` and `codex.js` use Node's default (1MB). If an agent session has verbose output, capture could truncate silently.

7. **Node control scripts skip Escape hardening (agrees with Codex finding #3).** `tmux-config.sh` sends Escape before Enter to dismiss autocomplete overlays. `cc.js`, `codex.js`, and `gemini.js` skip this step, making them less robust than the shell helpers they're meant to complement.

8. **No security warning in README.** Both agents launch in fully permissive mode (`--dangerously-skip-permissions`, `--yolo`). Should be documented prominently.

### NICE TO HAVE

9. **`leadership.json` is documentation-only.** No code reads it. The `ack_timeout_seconds: 45` doesn't drive `me.sh`'s timeout (which is also 45, but hardcoded).

10. **`gemini_send_long` duplicated in `launch-gemini-peer.sh`.** Should be in `tmux-config.sh` with configurable delay.

11. **`cc.js` and `codex.js` lack `read()` that `gemini.js` has.** Minor API inconsistency.

12. **Tmux socket permissions.** Socket in `/tmp` with default umask. Safe for single-user dev machine; document the assumption.

## Red-Team Assessment

| Attack Vector | Risk | Status |
|---|---|---|
| Tmux injection via message content | LOW | `send-keys -l` (literal mode) and `load-buffer`/`paste-buffer` prevent tmux escape interpretation. Safe. |
| Shell injection via session names | LOW | `next_peer_session_name` produces sanitized names. User-supplied names not validated — path traversal possible in log file paths. |
| Prompt injection via `comms.md` | MEDIUM | Any agent can write crafted content. Other agents reading it could be influenced. Inherent to the architecture. |
| Socket hijacking on shared machines | MEDIUM | `/tmp` socket with default permissions. Any local user can connect and inject. Acceptable for single-user dev. |
| Permissive agent modes | ACCEPTED | `--dangerously-skip-permissions` and `--yolo` are fundamental to the workflow. By design. |
| Hostname leakage in identity stamps | LOW | `os.hostname()` in every message. Fine for dev tool. |
| Secret leakage from repo | NONE | `.env` gitignored. No API keys or credentials in any committed file. |

## Overall Verdict

**The repo is structurally complete and matches the spec.** All 14 build steps were executed. File structure matches. 16 Skills present and deployed. DNA layer works. Docs are clean.

**Not ready to ship as-is.** Three blocking items:
1. Runtime artifacts in git (comms.md, .DS_Store) — 2-minute fix
2. License contradiction (Apache 2.0 vs MIT) — 1-minute fix
3. Skills with dead references into non-existent systems — needs a decision: annotate the affected skills, or strip them to v0.1-safe content

After those fixes, it is good to go for v0.1.

__________

# Codex Code Review and Red-Team Results

Date: 2026-04-02

Verdict: Not good to go as-is for v0.1. The repo shape is close, and the shell/JS entrypoints pass static syntax checks, but there are still blocking usability/scope issues that would cause cold agents to reach for missing systems.

## Findings

1. High: the shipped 16-skill catalog is not actually v0.1-safe. Multiple canonical skills still instruct agents to use excluded files, transports, and subsystems, so a cold agent following the repo's advertised Skill flow will fail or drift out of scope.
   Evidence:
   - [adherence-check](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/adherence-check/SKILL.md#L23) requires `interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md`, which v0.1 explicitly excludes, and its example still points at the old `projects/Skills_Capability/...` workspace at [line 147](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/adherence-check/SKILL.md#L147).
   - [create-skin](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/create-skin/SKILL.md#L7) requires the excluded dashboard, courier, and AG transport; see the prereqs at [lines 26-34](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/create-skin/SKILL.md#L26) and the courier / `ag.js` flow at [lines 108-140](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/create-skin/SKILL.md#L108).
   - [hyperdomo](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/hyperdomo/SKILL.md#L21) still assumes `preflight-wakeup.sh`, `ag.js`, and `.observability` state files at [lines 23-26](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/hyperdomo/SKILL.md#L23) and [lines 38-41](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/hyperdomo/SKILL.md#L38).
   - The flagship example in [SKILLS.md](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/SKILLS.md#L39) tells users to invoke `dev-collaboration`, but that skill still declares tri-agent / AG compatibility at [lines 3-13](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/dev-collaboration/SKILL.md#L3) and still points at the old workspace path at [line 101](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/dev-collaboration/SKILL.md#L101).
   Why this blocks release:
   - v0.1 explicitly sells "the full 16-skill catalog" and tells users to invoke skills by name. As shipped, several of those skills are documentation traps, not runnable starter-repo workflows.
   Red-team:
   - Tell a fresh agent "use the adherence-check skill" and it will immediately look for a missing conformance doc.
   - Tell a fresh agent "use dev-collaboration" and the skill itself nudges it toward a missing `ag.js` path and tri-agent assumptions.
   - Tell a fresh agent "use create-skin" and it will try to start courier and a dashboard that this repo intentionally does not ship.

2. Medium: the runtime session ledger is still tracked even though the repo intends it to be ephemeral.
   Evidence:
   - [.gitignore](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.gitignore#L10) correctly ignores `interlateral_dna/comms.md`.
   - The current repo index still contains `interlateral_dna/comms.md` (`git ls-files` confirms it is tracked).
   Why it matters:
   - The launcher rewrites `comms.md` on every run, so the repo will churn into a dirty state during normal use.
   - This increases the chance of accidentally committing live agent transcripts into the starter repo.

3. Medium: the canonical Node control scripts bypass the Escape-based input hardening already present in the tmux helper layer.
   Evidence:
   - [scripts/tmux-config.sh](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/tmux-config.sh#L13) hardens sends with `Escape` before submit in `agent_send`, `codex_send_clean`, and `agent_send_long`.
   - The actual control scripts used by docs and skills do not use that hardening: [cc.js](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/cc.js#L78), [codex.js](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/codex.js#L79), and [gemini.js](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/gemini.js#L88) send raw text, wait, then hit `Enter`.
   Why it matters:
   - This reintroduces the exact class of UI-buffer / autocomplete-overlay problems the helper layer was designed to avoid.
   - In practice, the "blessed" direct-comm scripts are currently less robust than the lower-level shell helpers.

## What Looks Good

- The repo broadly matches the v0.1 file structure in [temp/reconciliation.md](/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/reconciliation.md#L1945).
- The duo launcher, peer helpers, DNA scripts, minimal docs, roadmap, and env template are all present.
- The skill copies are deployed consistently: 16 canonical skills, 16 Claude copies, and 16 Codex copies.
- Static verification passed:
  - `bash -n me.sh scripts/*.sh`
  - `node --check interlateral_dna/cc.js interlateral_dna/codex.js interlateral_dna/gemini.js interlateral_dna/identity.js`

## Minimum Changes Before Calling It v0.1 Ready

1. Do a real v0.1 cleanup pass on the shipped skills, not just on `SKILLS.md`.
2. Remove `interlateral_dna/comms.md` from the git index so the ignore rule actually works.
3. Align the Node control scripts with the hardened tmux send behavior already defined in `scripts/tmux-config.sh`.

## Bottom Line

The repo is close, but I would not ship it as "good to go" yet. The biggest problem is not the launcher shell code. It is that the advertised 16-skill experience still contains multiple cold-start traps into non-existent systems, which undermines the starter-repo promise.

## Skills That Need Modification For v0.1 Inclusion

- `adherence-check`
  - What is wrong: hardcodes a missing conformance source at `interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md` and still points at the old `projects/Skills_Capability/...` path.
  - Suggested v0.1 shape: make it generic and parameter-driven. Require `artifact_path`, `spec_path`, and `report_path`. If `spec_path` is missing, stop and tell the human exactly what is needed. Keep the current PASS/FAIL/WARN report structure.

- `dev-collaboration`
  - What is wrong: still frames itself as tri-agent with AG examples even though v0.1 is CLI-only and has no `ag.js`.
  - Suggested v0.1 shape: define it as a three-role pattern, not an AG-era triad. Require explicit role assignment (`DRAFTER`, `REVIEWER`, `BREAKER`) and artifact path. Allow any available agents (`claude`, `codex`, `gemini`) to fill the roles. If only two agents are available, require the human to explicitly assign a dual-hatted role.

- `dev-competition`
  - What is wrong: still uses AG-specific examples and old workspace paths.
  - Suggested v0.1 shape: keep the blind dual-implementation concept, but require explicit `competition_dir`, `requirement_path`, and named agents for Implementer A, Implementer B, and Judge. Replace AG-specific examples with generic `cc.js` / `codex.js` / `gemini.js` messaging.

- `search-synth`
  - What is wrong: assumes a 4-agent setup with AG browser search and guaranteed web-search support for every participant.
  - Suggested v0.1 shape: rewrite as a CLI-only research pattern. Require the prompt to name which agents are participating and confirm they each have search capability. Require `topic` and `output_file`. If the assigned roster cannot satisfy search requirements, stop instead of improvising.

## Skills Good To Go As-Is For v0.1

- `add-comments`
- `competition`
- `constitutional`
- `democratic`
- `hierarchical`
- `negotiation`
- `peer-collaboration`
- `publication-pipeline`

## Skills Not Good To Go And Best Excluded From v0.1 For Now

- `create-skin`
  - Depends on excluded dashboard, courier, browser workflow, AG transport, and skin-specific docs.

- `evals`
  - Depends on excluded OTEL traces, eval packs, `.observability`, Python tooling, and Lake Merritt assets.

- `hyperdomo`
  - Depends on excluded manager-worker orchestration, `preflight-wakeup.sh`, `ag.js`, `.observability` state, and broader automation scaffolding.

- `test-4-series`
  - Depends on `hyperdomo`, eval infrastructure, traces, `.observability`, and AG-era project-skill machinery.

## Second-Pass Consolidated Skill Triage

This is my tightened release-ready recommendation after a second pass and after reading Claude's skill findings.

### 1. Keep As-Is In v0.1

- `add-comments`
  - Safe, self-contained, and directly useful in the starter repo.

- `competition`
  - Generic coordination pattern. Heavy, but not coupled to excluded infrastructure.

- `constitutional`
  - Generic structured drafting protocol. No hard dependency on excluded systems.

- `democratic`
  - Generic voting pattern. Safe as documentation and runnable as-is.

- `hierarchical`
  - Generic boss/worker protocol. Fits the peer-launch-helper model.

- `negotiation`
  - Generic consensus protocol. No dead references found.

- `peer-collaboration`
  - Clean two-agent pattern and a good match for the starter repo.

- `publication-pipeline`
  - Heavy but still generic. The role count is high, but that is a usage/scoping issue, not a missing-infrastructure issue.

### 2. Keep In v0.1 But Rewrite Now

- `adherence-check`
  - Rewrite target:
    - Must require `artifact_path`
    - Must require `spec_path`
    - Must require `report_path`
  - v0.1-safe framing:
    - "Use this when you have an artifact and an explicit source-of-truth spec to check it against."
    - If `spec_path` is not supplied or missing, stop and report the missing prerequisite.
  - Keep:
    - The current structured PASS / FAIL / WARN / N/A reporting format
    - The add-comments delivery pattern

- `dev-collaboration`
  - Rewrite target:
    - Remove AG-specific wording and examples
    - Remove old `projects/Skills_Capability/...` references
    - Explicitly support `claude`, `codex`, and `gemini` as interchangeable role-holders
  - v0.1-safe framing:
    - "Three-role collaboration pattern: Drafter, Reviewer, Breaker."
    - Require `artifact_path` and explicit role assignment.
    - If only two agents are available, require the prompt to assign one dual-hatted role.
  - Keep:
    - Ledger + direct notification discipline
    - Reviewer / Breaker separation
    - Change-log requirement in the resulting artifact

- `dev-competition`
  - Rewrite target:
    - Remove AG-specific examples and legacy workspace paths
    - Normalize messaging examples to `cc.js`, `codex.js`, `gemini.js`
  - v0.1-safe framing:
    - Require `competition_dir`, `requirement_path`, and named Implementer A, Implementer B, and Judge
    - State clearly that the skill is usable only when at least three agents are available
  - Keep:
    - Blind dual implementation
    - Judge evaluates against requirement, not style
    - Isolation / blindness rules

- `search-synth`
  - Rewrite target:
    - Remove AG/browser assumptions
    - Remove assumption that every assigned agent definitely has search capability
  - v0.1-safe framing:
    - Require `topic`, `output_file`, and explicit participating agent list
    - Require the user or launcher context to confirm which participating agents have web-search capability
    - If the assigned roster cannot actually search, stop instead of improvising
  - Keep:
    - Multi-agent research
    - Cross-fact-checking
    - Final synthesized response

### 3. Cut From v0.1

- `create-skin`
  - Cut reason:
    - It is a dashboard-production skill, not a starter-repo skill.
    - Depends on excluded dashboard UI, courier, AG, browser checks, and conformance docs.
  - Recommendation:
    - Move to roadmap-era catalog or a future "full mesh / dashboard" profile.

- `evals`
  - Cut reason:
    - Depends on excluded `.observability`, OTEL traces, eval scripts, Python stack, and Lake Merritt assets.
  - Recommendation:
    - Restore only when the eval subsystem is actually shipped.

- `hyperdomo`
  - Cut reason:
    - It is an orchestration framework, not a starter-scope skill.
    - Depends on excluded wake-up scripts, AG, `.observability`, state/lock files, and manager runtime primitives.
  - Recommendation:
    - Keep for post-v0.1 roadmap work once router/session/orchestration layers exist.

- `test-4-series`
  - Cut reason:
    - It is a project-skill for the excluded HyperDomo/evals stack, not a generic starter-repo skill.
  - Recommendation:
    - Remove from v0.1 catalog entirely and restore only with HyperDomo + eval support.

## Final Release Recommendation For Skills

If the goal is "right and ready" for v0.1, the skill decision should be:

- Ship now as-is: `add-comments`, `competition`, `constitutional`, `democratic`, `hierarchical`, `negotiation`, `peer-collaboration`, `publication-pipeline`
- Rewrite now before release: `adherence-check`, `dev-collaboration`, `dev-competition`, `search-synth`
- Exclude from v0.1: `create-skin`, `evals`, `hyperdomo`, `test-4-series`

That gives v0.1 a clean 12-skill catalog if the rewrites happen now, or a clean 8-skill catalog if the repo needs to ship immediately without more skill editing.

---

# Claude Code Review of Codex's Findings

**Date:** 2026-04-02
**Reviewer:** Claude Code (ipa-claude)

## Verdict on Codex's Analysis

Codex's skill triage is excellent and I endorse it fully. The "keep as-is / rewrite now / cut" breakdown is the right call. The rewrite specs for `adherence-check`, `dev-collaboration`, `dev-competition`, and `search-synth` are detailed and actionable.

However, Codex's "Minimum Changes" list (3 items) is incomplete. It covers skills, comms.md tracking, and Node script hardening — but misses several items that both reviews independently found or that only my review caught. Below is the consolidated, single-source action list.

## CONSOLIDATED v0.1 RELEASE ACTION LIST

This is the single complete list. An agent tasked with getting this repo to v0.1 should do every item below.

### MUST FIX (blocking release)

**MF-1. Remove tracked runtime artifacts from git.**
```bash
cd /Users/dazzagreenwood/Documents/GitHub/interlateral_agents
git rm --cached interlateral_dna/comms.md
git rm --cached --ignore-unmatch '*.DS_Store' '.agent/.DS_Store' '.claude/.DS_Store' '.codex/.DS_Store'
```
Why: `.gitignore` has entries for these but they were committed before the ignore was added. The repo will churn dirty on every `me.sh` run and risk leaking session transcripts.

**MF-2. Fix license inconsistency.**
Root `LICENSE` file says Apache 2.0. `interlateral_dna/package.json` says `"license": "MIT"`. Pick one and make them match. (Dazza decides which.)

**MF-3. Skill triage — cut 4 skills from v0.1 catalog.**
Remove from `.agent/skills/`, `.claude/skills/`, `.codex/skills/`, and update `SKILLS.md`:
- `create-skin` — depends on excluded dashboard, courier, AG transport
- `evals` — depends on excluded OTEL, eval packs, Python tooling, Lake Merritt
- `hyperdomo` — depends on excluded orchestration, preflight scripts, `.observability`
- `test-4-series` — depends on excluded HyperDomo + eval infrastructure

Move each to a `ROADMAP.md` note so nothing is lost.

**MF-4. Skill triage — rewrite 4 skills for v0.1 safety.**
Rewrite per Codex's detailed specs above:
- `adherence-check` — make parameter-driven (`artifact_path`, `spec_path`, `report_path`), remove hardcoded conformance doc reference
- `dev-collaboration` — remove AG/tri-agent framing, support `claude`/`codex`/`gemini` as interchangeable role-holders, remove old workspace paths
- `dev-competition` — remove AG examples and legacy paths, normalize to `cc.js`/`codex.js`/`gemini.js` messaging
- `search-synth` — remove AG/browser assumptions, require explicit agent list with confirmed search capability

After cuts and rewrites, update `SKILLS.md` to reflect a 12-skill catalog.

### SHOULD FIX (quality / safety)

**SF-1. Align Node control scripts with tmux-config.sh hardening.**
`cc.js`, `codex.js`, and `gemini.js` send raw text then Enter. `tmux-config.sh` sends Escape before Enter to dismiss autocomplete overlays. The Node scripts should match. Add an Escape send before the final Enter in each script's `send()` function.

**SF-2. Dead-code if/else in peer launch scripts.**
In `scripts/launch-cc-peer.sh` (lines 42-46) and `scripts/launch-gemini-peer.sh` (lines 55-59), both branches of the if/else do the identical thing. Remove the dead conditional — just call `agent_send_long` unconditionally.

**SF-3. Add session-kill guard to `me.sh`.**
Lines 100-101 unconditionally `kill_if_exists` on `ia-claude`/`ia-codex`. If Terminal.app windows are attached, they die instantly with no warning. Add: check if sessions exist AND are attached, warn the user, and require confirmation or a `--force` flag before killing.

**SF-4. Harmonize `maxBuffer` across DNA scripts.**
`gemini.js` sets `maxBuffer: 10 * 1024 * 1024`. `cc.js` and `codex.js` use Node's default (1MB). Set all three to 10MB for consistency.

**SF-5. Add security notice to README.md.**
Both agents launch in fully permissive mode (`--dangerously-skip-permissions`, `--yolo`). Add a short, prominent warning in the README so anyone cloning the repo understands what `me.sh` does.

**SF-6. Consolidate `gemini_send_long` into `tmux-config.sh`.**
`launch-gemini-peer.sh` defines its own `gemini_send_long` that duplicates `agent_send_long` but with a 1-second delay. Add a delay parameter to `agent_send_long` in `tmux-config.sh` and remove the duplicate.

### NICE TO HAVE (polish, non-blocking)

**NH-1.** `leadership.json` is not read by any code. Either wire it to `me.sh` (e.g., drive `ack_timeout_seconds`) or add a comment in the file saying it is reference-only documentation.

**NH-2.** `cc.js` and `codex.js` lack the `read()` command that `gemini.js` has. Add for API parity.

**NH-3.** Validate user-supplied session names in peer launch scripts. Reject names containing `/`, `..`, or other path-unsafe characters to prevent log file path traversal.

**NH-4.** Set `umask 077` before tmux socket creation in `tmux-config.sh`, or document that the socket is only safe on single-user machines.

## Summary

Codex nailed the skill analysis. This consolidated list adds 6 items Codex missed (license, .DS_Store, dead code, session-kill guard, maxBuffer, README security warning) and merges everything into one actionable checklist. Total: 4 must-fix, 6 should-fix, 4 nice-to-have.

The repo is close. The must-fixes are mostly quick (git rm, license line, skill cuts). The skill rewrites are the biggest effort but Codex's specs above are detailed enough to execute directly.

## Codex Revision Brief For Next Agents

This section is the execution-oriented version of the review above. It is written for the next implementation agents so they can make the repo release-ready without re-deciding the scope.

### Release Decision To Use

Use the **12-skill v0.1 target**, not the 8-skill emergency target.

That means:
- Keep as-is: `add-comments`, `competition`, `constitutional`, `democratic`, `hierarchical`, `negotiation`, `peer-collaboration`, `publication-pipeline`
- Rewrite now: `adherence-check`, `dev-collaboration`, `dev-competition`, `search-synth`
- Remove from v0.1: `create-skin`, `evals`, `hyperdomo`, `test-4-series`

### Dazza Decision Needed Up Front

- Choose the repo license:
  - Option A: keep root `LICENSE` as Apache 2.0 and update `interlateral_dna/package.json`
  - Option B: change the repo to MIT everywhere

Do not let agents guess this.

### Ordered Work Packets

#### WP-1. Release Hygiene

Owner: any single agent

Files:
- `interlateral_dna/comms.md`
- tracked `.DS_Store` files if still present in git
- `interlateral_dna/package.json`
- `README.md`

Tasks:
- Untrack `interlateral_dna/comms.md`
- Untrack any committed `.DS_Store` files
- Resolve the license mismatch
- Add a short README warning that `me.sh` launches agents in permissive mode

Done criteria:
- `git status` no longer shows tracked runtime artifacts after a fresh `./me.sh` run
- license metadata matches root `LICENSE`
- README visibly states the permissive launch behavior

#### WP-2. Skill Catalog Cut For v0.1

Owner: one agent with ownership of skill catalog files

Files:
- `.agent/skills/create-skin/`
- `.agent/skills/evals/`
- `.agent/skills/hyperdomo/`
- `.agent/skills/test-4-series/`
- matching deployed copies in `.claude/skills/` and `.codex/skills/`
- `SKILLS.md`
- `ROADMAP.md`

Tasks:
- Remove those four skills from the shipped v0.1 catalog
- Remove their deployed copies
- Update `SKILLS.md` to describe the remaining catalog only
- Add a short note in `ROADMAP.md` preserving each removed skill as deferred functionality

Done criteria:
- canonical skill count is 12
- `.claude/skills/` count is 12
- `.codex/skills/` count is 12
- `SKILLS.md` no longer advertises removed skills as current v0.1 skills

#### WP-3. Rewrite `adherence-check`

Owner: one agent, this file only

Files:
- `.agent/skills/adherence-check/SKILL.md`
- deployed copies after `scripts/deploy-skills.sh`

Required rewrite:
- Remove all hardcoded references to `interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md`
- Remove old `projects/Skills_Capability/...` invocation examples
- Require these explicit inputs:
  - `artifact_path`
  - `spec_path`
  - `report_path`
- State clearly:
  - if `spec_path` is missing or file does not exist, STOP and report the missing prerequisite
- Keep:
  - the structured PASS / FAIL / WARN / N/A evaluation model
  - the report template
  - add-comments delivery

Done criteria:
- a cold agent can run the skill in any repo that has an artifact and an explicit spec file
- there are no repo-specific missing-path assumptions left in the skill

#### WP-4. Rewrite `dev-collaboration`

Owner: one agent, this file only

Files:
- `.agent/skills/dev-collaboration/SKILL.md`
- deployed copies after `scripts/deploy-skills.sh`

Required rewrite:
- Remove AG-specific framing and examples
- Remove old workspace-path references
- Recast the skill as a role pattern:
  - `DRAFTER`
  - `REVIEWER`
  - `BREAKER`
- Allow any available v0.1 agents to hold roles:
  - `claude`
  - `codex`
  - `gemini`
- Require:
  - explicit role assignment
  - `artifact_path`
- State clearly:
  - if only two agents are available, the prompt must explicitly assign a dual-hatted role
- Keep:
  - ledger + direct-notification requirement
  - reviewer / breaker separation
  - change-log requirement

Done criteria:
- the skill reads as valid in a CLI-only repo with no AG
- the default example uses only v0.1-supported agents and paths

#### WP-5. Rewrite `dev-competition`

Owner: one agent, this file only

Files:
- `.agent/skills/dev-competition/SKILL.md`
- deployed copies after `scripts/deploy-skills.sh`

Required rewrite:
- Remove AG examples
- Remove legacy workspace-path examples
- Normalize examples to `cc.js`, `codex.js`, and `gemini.js`
- Require:
  - `competition_dir`
  - `requirement_path`
  - Implementer A
  - Implementer B
  - Judge
- State clearly:
  - the skill requires at least three available agents
- Keep:
  - blind dual implementation
  - isolation rules
  - judge-against-requirement rule

Done criteria:
- a cold agent can run the skill in this repo without reaching for AG or excluded files

#### WP-6. Rewrite `search-synth`

Owner: one agent, this file only

Files:
- `.agent/skills/search-synth/SKILL.md`
- deployed copies after `scripts/deploy-skills.sh`

Required rewrite:
- Remove AG/browser-specific assumptions
- Remove the assumption that every named participant automatically has search capability
- Require:
  - `topic`
  - `output_file`
  - explicit participating agent list
- State clearly:
  - the assigned roster must actually have web-search capability
  - if not, STOP and report the mismatch
- Keep:
  - multi-agent research
  - fact-checking of peer findings
  - final synthesized output

Done criteria:
- the skill is truthful about prerequisites and does not silently assume non-v0.1 infrastructure

#### WP-7. DNA Script Hardening

Owner: one agent for comms/runtime files

Files:
- `interlateral_dna/cc.js`
- `interlateral_dna/codex.js`
- `interlateral_dna/gemini.js`
- optionally `scripts/tmux-config.sh`

Tasks:
- Add Escape-based input hardening to all Node `send()` paths so they match the safer helper behavior
- Harmonize `maxBuffer` across all three DNA scripts
- Optional parity improvement: add `read()` to `cc.js` and `codex.js`

Done criteria:
- all three DNA scripts behave consistently on send
- large pane captures do not rely on Node defaults

#### WP-8. Launcher Safety Cleanup

Owner: one agent for shell launchers

Files:
- `me.sh`
- `scripts/launch-cc-peer.sh`
- `scripts/launch-gemini-peer.sh`
- optionally `scripts/tmux-config.sh`

Tasks:
- Add a guard to `me.sh` before killing attached sessions
  - warning + `--force`, or equivalent explicit override
- Remove dead conditionals in `launch-cc-peer.sh` and `launch-gemini-peer.sh`
- Optional cleanup: generalize Gemini long-send behavior into shared helper code

Done criteria:
- rerunning `me.sh` does not silently kill attached human windows without warning
- peer launch scripts no longer contain no-op conditionals

### Final Verification Checklist For Release

After all work packets are complete:

1. Skill counts:
   - `.agent/skills/` = 12
   - `.claude/skills/` = 12
   - `.codex/skills/` = 12
2. Static checks:
   - `bash -n me.sh scripts/*.sh`
   - `node --check interlateral_dna/cc.js interlateral_dna/codex.js interlateral_dna/gemini.js interlateral_dna/identity.js`
3. Repo hygiene:
   - `git status` clean after normal launcher use
   - `interlateral_dna/comms.md` not tracked
4. Docs:
   - `SKILLS.md` reflects the 12-skill v0.1 catalog
   - README includes permissive-mode warning
   - license metadata is consistent
5. Runtime smoke:
   - `./me.sh`
   - one peer launch helper
   - `scripts/deploy-skills.sh`
   - `scripts/shutdown.sh`

### What Next Agents Should Not Re-Decide

- Do not re-open the question of whether `create-skin`, `evals`, `hyperdomo`, or `test-4-series` belong in v0.1. They do not.
- Do not keep the current repo-specific dead references in the four rewrite-now skills.
- Do not ship the repo with `comms.md` still tracked.
- Do not silently choose a license without Dazza's explicit decision.
