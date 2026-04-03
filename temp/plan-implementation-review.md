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
