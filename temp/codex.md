# Interlateral Repo Review and Final Multi-Agent Repo Proposal

Date: 2026-04-02

Repos investigated:
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_prototype_alphasa_uiax`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_design_pattern_factory`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha-upstream`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha`

## Executive Summary

- `interlateral_platform_alpha` is the best simple launcher kernel today. Its `me.sh` is the cleanest human entrypoint for a live Claude + Codex duo with deterministic ACK and `Ready to Rock!`.
- `interlateral_alpha` is the best full-mesh donor repo today. It already has quad-agent support, canonical Skills, Gemini CLI support, Antigravity support, dashboard/observability, evals, and stronger operational hardening than `interlateral_alpha-upstream`.
- `interlateral_alpha-upstream` is the closest sibling to `interlateral_alpha`, but it is slightly less hardened and still shows more mixed-state documentation around direct Codex comms vs courier fallback.
- `interlateral_design_pattern_factory` is the best minimal Skills/pattern reference. It is cleaner than the later mesh repos if the question is "what is the smallest understandable Skills system?"
- `interlateral_prototype_alphasa_uiax` is the historical CC + AG precursor. It matters because it established the AG/CDP and dashboard lineage, but it is not the right final base for a modern multi-agent repo.

My overall recommendation is:

1. Use `interlateral_alpha` as the base shape for the final dedicated multi-agent repo.
2. Import `me.sh`, `identity.js`, and the dual-agent tmux ergonomics from `interlateral_platform_alpha`.
3. Keep canonical Skills from `interlateral_alpha`.
4. Treat `interlateral_design_pattern_factory` as a reference repo for simplifying and testing Skills text, not as the final runtime base.
5. Treat `interlateral_prototype_alphasa_uiax` as historical reference only for AG and dashboard lineage.

---

## 1. Full Findings by Repo

### A. `interlateral_platform_alpha`

Top-line summary:
Product-first repo with the strongest current Claude + Codex launcher, but not yet the strongest general-purpose multi-agent mesh repo.

What it is and what it does:
- A proof-of-concept platform application with API/UI/product code, GCP deployment and cost-guard operations, and a lean dual-agent coordination layer.
- The agent layer is centered on `./me.sh`, repo-scoped tmux sessions, direct `cc.js` and `codex.js` injection, a simple comms log, and a mutual ACK bootstrap that ends with both agents printing `Ready to Rock!`.
- It also includes Codex worker-pool helpers such as `launch-codex-peer.sh` and `send-codex-peer.sh`.

Same as the broader Interlateral lineage:
- Direct terminal-based agent-to-agent messaging.
- `interlateral_dna/` as the comms/control layer.
- Shared comms log and explicit wake-up choreography.
- tmux-based orchestration and pane capture for visibility.

Different from the other repos:
- Product repo, not template repo. It carries Express/React/GCP/app concerns that the pure agent-control repos do not.
- Dual-agent first: Claude + Codex only. No native Antigravity or Gemini CLI mesh in the current launcher.
- No repo-local Skills library that actually organizes live collaboration flows.
- No web comms monitor/dashboard in the same way the template repos do.
- Includes GCP ops and billing guardrails that are unrelated to a dedicated agent-control repo.

Overall assessment:
- Best current launcher kernel.
- Best current human UX for "bring up two agents fast and reliably."
- Not the best base for a final generalized multi-agent repo because it lacks Skills as a first-class runtime layer and lacks native AG/Gemini mesh support.

Same and different summary:
- Same: direct live comms, repo-scoped tmux control, ACK discipline, explicit operational rules.
- Different: product-first, duo-only, no canonical multi-agent Skills system, no AG/Gemini runtime.

### B. `interlateral_prototype_alphasa_uiax`

Top-line summary:
Earliest CC + AG template in the lineage, with strong dashboard/observability beginnings but no modern multi-agent mesh layer and no Skills system.

What it is and what it does:
- A GitHub template repo for Claude Code orchestrating Antigravity.
- Provides `ag.js` CDP control, `cc.js` tmux injection back to Claude, `comms.md`, `ag_log.md`, and the first dashboard/observability stack.
- The architecture is fundamentally CC controlling AG, with logging and human oversight.

Same relative to `interlateral_platform_alpha`:
- Explicit wake-up flow.
- Direct agent messaging rather than passive files alone.
- tmux injection into Claude.
- Shared comms and message logs.

Different relative to `interlateral_platform_alpha`:
- Two-agent only: CC + AG.
- No Codex runtime, no Gemini CLI runtime, no `leadership.json`, no canonical Skills layer.
- AG transport is central and CDP/Puppeteer-driven.
- It is template/control-repo oriented rather than product-app oriented.
- Dashboard and observability are much more central than in `interlateral_platform_alpha`.

Overall assessment:
- Important historical foundation for Antigravity control, comms monitor, and observability.
- Not a realistic final base for a present-day Interlateral mesh because it lacks Codex, Gemini CLI, Skills, leadership configuration, and modern worker patterns.

Same and different summary:
- Same: live direct comms, tmux + automation, explicit wake-up, observability.
- Different: only CC + AG, no Skills, no leadership model, no Codex/Gemini mesh.

### C. `interlateral_design_pattern_factory`

Top-line summary:
Tri-agent pattern library repo with the cleanest minimal Skills model, but its runtime is older than the later mesh repos and its docs have outrun its implementation in places.

What it is and what it does:
- A tri-agent template for CC + AG + Codex.
- Provides dashboard, observability, tri-agent `leadership.json`, `LIVE_COMMS.md`, and a curated Skills workspace.
- Uses Skills as reusable pattern definitions for collaboration methods such as dev-collaboration and dev-competition.

Same relative to `interlateral_platform_alpha`:
- Direct agent messaging and comms logging.
- tmux-based coordination.
- Explicit human wake-up entrypoints.
- Direct Codex injection support and AG/CDP support.

Different relative to `interlateral_platform_alpha`:
- Tri-agent mesh instead of dual-agent launcher.
- Canonical Skills source is under `projects/Skills_Capability/workspace_for_skills/`, not under `.agent/skills/`.
- Has four core Skills only: `add-comments`, `adherence-check`, `dev-collaboration`, `dev-competition`.
- Uses courier + sandbox assumptions for Codex outbound as a primary pattern.
- README discusses Gemini CLI and multi-instance Gemini patterns, but the actual runtime remains tri-agent only.

Overall assessment:
- Best minimal reference for understanding the Skills idea without too much surrounding complexity.
- Good source repo for canonical examples of pattern-oriented Skills.
- Not the best final runtime base because the later `alpha` repos are more capable and more complete.

Same and different summary:
- Same: direct comms, observability, AG + Codex + Claude coordination.
- Different: tri-agent only, smaller Skills catalog, Skills canonical source lives in `projects/`, docs drift toward Gemini without true runtime parity.

### D. `interlateral_alpha-upstream`

Top-line summary:
First broad quad-agent mesh template with Skills elevated into the operating model, plus evals and manager-agent orchestration.

What it is and what it does:
- A template repo for CC + AG + Codex + Gemini CLI, with a CLI-only no-AG mode as well.
- Uses `leadership.json`, `gemini.js`, `wake-up-no-ag.sh`, dashboard/observability, canonical Skills under `.agent/skills`, per-agent deployment copies, evals, and HyperDomo.
- Moves from "agents can talk" to "agents can follow formal collaboration protocols."

Same relative to `interlateral_platform_alpha`:
- Direct terminal messaging remains central.
- tmux remains the main CLI coordination mechanism.
- Uses explicit wake-up logic, ACK expectations, and comms logs.

Different relative to `interlateral_platform_alpha`:
- Full quad-agent mesh, with Gemini CLI as a first-class agent.
- Canonical Skills system is present and large.
- Adds `leadership.json`, CLI-only mode, dashboard, monitor, evals, HyperDomo, project Skills, design-pattern Skills, and broader docs.
- Transport assumptions are mixed: some docs/scripts say Codex can talk directly because it runs `--yolo`, while `LIVE_COMMS.md` still documents courier-first outbound for Codex.

Overall assessment:
- Very strong donor repo for a final mesh.
- Significantly more mature than `design_pattern_factory`.
- Slightly weaker than `interlateral_alpha` because `interlateral_alpha` adds extra operational hardening and clearer Codex guidance.

Same and different summary:
- Same: direct live comms and tmux-centric orchestration.
- Different: quad-agent, Skills-heavy, evals-heavy, more ambitious, somewhat mixed-state in documentation.

### E. `interlateral_alpha`

Top-line summary:
Best current full-mesh donor repo. It is effectively `alpha-upstream` plus operational hardening, stricter Codex guidance, shared tmux socket discipline, and better Gemini bootstrap behavior.

What it is and what it does:
- A quad-agent mesh template supporting CC + AG + Codex + Gemini CLI, plus a CLI-only no-AG mode.
- Uses `.agent/skills` as canonical source, deploys copies to `.claude/skills` and `.codex/skills`, includes HyperDomo, evals, monitor, telemetry, dashboard, leadership config, and startup manuals for multiple agents.
- Replaces the older `CODEX.md` style manual with `AGENTS.md` for Codex and adds stricter operational rules.

Same relative to `interlateral_platform_alpha`:
- Direct live comms remain the core runtime model.
- tmux remains central for CLI agents.
- Explicit boot choreography and ACK expectations remain important.
- Human convenience scripts still matter; this is not just a library repo.

Different relative to `interlateral_platform_alpha`:
- Full mesh support for AG and Gemini CLI.
- Full Skills catalog and Skills deployment pipeline.
- Dashboard, AG telemetry watcher, evals, HyperDomo, `leadership.json`, worker/project skill model.
- Shared explicit tmux socket at `/tmp/interlateral-tmux.sock`.
- Defaulting of `wake-up.sh` and `wake-up-no-ag.sh` to full permissions.
- Fresh session coordination-file creation on wake-up.
- Gemini bootstrap model pinning and preflight behavior.
- Stronger Codex instructions around repo boundaries, idle-after-ACK, and permission granting for peer agents.

Overall assessment:
- Best full-mesh donor repo among everything reviewed.
- Strongest candidate for the final dedicated multi-agent repo base.
- Still needs one major cleanup before being "final": docs should be normalized so direct Codex comms is primary and courier is explicitly fallback-only everywhere.

Same and different summary:
- Same: live terminal-first comms and explicit operational protocols.
- Different: full mesh, full Skills, stronger tmux/socket discipline, stronger operator docs, more polished bootstrap, Gemini pinning.

---

## 2. Full Capabilities List

### A. Agent-to-Agent Communications and Collaboration Capabilities

#### 1. Direct terminal injection to Claude Code

- Present in: `interlateral_platform_alpha`, `interlateral_prototype_alphasa_uiax`, `interlateral_design_pattern_factory`, `interlateral_alpha-upstream`, `interlateral_alpha`
- Core idea:
  - A helper script types into Claude's tmux pane and submits a message.
  - This makes Claude reachable as a live agent endpoint.
- Differences:
  - `interlateral_platform_alpha`: simplest implementation, identity-stamped messages, tight duo focus.
  - `prototype`: plain tmux session targeting, older form, no shared socket discipline.
  - `design_pattern_factory`: tri-agent era implementation.
  - `alpha-upstream` and `alpha`: namespaced sessions, richer status checks, better warnings, and in `alpha` a shared explicit tmux socket.

#### 2. Direct terminal injection to Codex

- Present in: `interlateral_platform_alpha`, `interlateral_design_pattern_factory`, `interlateral_alpha-upstream`, `interlateral_alpha`
- Core idea:
  - Claude and/or AG can type directly into Codex's tmux pane.
- Differences:
  - `platform_alpha`: simplest and most direct. Best for current duo flow.
  - `design_pattern_factory`: assumes sandboxed Codex and keeps courier as the main outbound path from Codex.
  - `alpha-upstream`: runtime increasingly assumes direct Codex comms, but docs still partly describe courier-first behavior.
  - `alpha`: same mixed lineage, but AGENTS explicitly says direct scripts are available and courier is backup.

#### 3. Antigravity CDP injection

- Present in: `interlateral_prototype_alphasa_uiax`, `interlateral_design_pattern_factory`, `interlateral_alpha-upstream`, `interlateral_alpha`
- Core idea:
  - `ag.js` uses Puppeteer/CDP against Antigravity's Electron app at port 9222.
  - It finds the workspace/iframe, inserts text, submits it, and can also read/screenshot/watch the panel.
- Differences:
  - `prototype`: foundational version, already effective, but more limited in overall mesh context.
  - `design_pattern_factory`: established tri-agent runtime pattern.
  - `alpha-upstream` and `alpha`: broader integration with watchers, telemetry, no-AG mode, leadership, and full mesh docs.
  - `platform_alpha`: absent as a runtime feature in the current launcher.

#### 4. Gemini CLI tmux injection

- Present in: `interlateral_alpha-upstream`, `interlateral_alpha`
- Core idea:
  - `gemini.js` makes Gemini CLI another terminal-addressable agent like Claude or Codex.
- Differences:
  - `alpha-upstream`: quad-agent support is present and works, but some documentation remains transitional.
  - `alpha`: adds pinned Gemini model selection, preflight validation, degraded-mode handling, and explicit named session conventions.
  - `design_pattern_factory`: README mentions Gemini patterns, but runtime support is not actually first-class.
  - `platform_alpha` and `prototype`: no native Gemini CLI runtime.

#### 5. Bidirectional or multi-way comms matrix

- Present in:
  - `prototype`: CC <-> AG only.
  - `design_pattern_factory`: CC <-> AG <-> Codex tri-agent mesh.
  - `alpha-upstream` and `alpha`: CC <-> AG <-> Codex <-> Gemini quad-agent mesh.
  - `platform_alpha`: Claude <-> Codex duo.
- Key difference:
  - The lineage clearly evolves from 2-way to tri-way to quad-way.

#### 6. ACK-driven wake-up protocols

- Present in all repos, but with different complexity.
- Differences:
  - `platform_alpha`: strongest deterministic launcher-level ACK flow. Exact handshake and `Ready to Rock!` checks.
  - `prototype`: ACK from AG only.
  - `design_pattern_factory`: ACKs among the tri-agent runtime.
  - `alpha-upstream` and `alpha`: ACK protocols for full mesh, including CLI-only no-AG mode.

#### 7. Ledger + whip pattern

- Present conceptually in all mesh repos except the earliest platform duo where it is lighter-weight.
- Meaning:
  - Log to `comms.md` for record.
  - Inject directly to actually wake the peer.
- Differences:
  - `prototype`: clearly states the principle for CC -> AG.
  - `design_pattern_factory`: codifies it strongly in comms docs and Skills.
  - `alpha-upstream` and `alpha`: this becomes a canonical rule across docs and Skills.
  - `platform_alpha`: same practical pattern exists, but the docs are simpler and duo-focused.

#### 8. Courier fallback for Codex outbound

- Present in: `interlateral_design_pattern_factory`, `interlateral_alpha-upstream`, `interlateral_alpha`
- Meaning:
  - Codex can write JSON messages to `codex_outbox`, and `courier.js` relays them.
- Differences:
  - `design_pattern_factory`: primary pattern because Codex is sandboxed.
  - `alpha-upstream`: still documented heavily even though direct Codex scripts are increasingly enabled.
  - `alpha`: backup-only in spirit, but docs still need cleanup.
  - `platform_alpha`: not part of the core duo runtime.

#### 9. Shared tmux socket discipline

- Present strongly in: `interlateral_platform_alpha`, `interlateral_alpha`
- Meaning:
  - All scripts use one repo-specific or explicitly named tmux socket to avoid split-brain behavior.
- Differences:
  - `platform_alpha`: repo-scoped socket tuned for the current duo launcher.
  - `alpha`: explicit `/tmp/interlateral-tmux.sock` shared across scripts, better for a general mesh.
  - `prototype` and `design_pattern_factory`: older default-tmux assumptions.

#### 10. Safe CLI send semantics for race-prone TUIs

- Present in: `platform_alpha`, `design_pattern_factory`, `alpha-upstream`, `alpha`
- Meaning:
  - Send text, wait, then submit.
  - Avoid raw `tmux send-keys ... Enter` when the CLI can leave input stuck.
- Differences:
  - `platform_alpha`: `tmux-config.sh` has the best combined helper set for send, long-prompt paste, pane capture, and idle detection.
  - `alpha` family: per-script 1-second delay pattern plus explicit guidance for Gemini.
  - `prototype`: older raw-pattern lineage before the more explicit shared tmux helpers.

#### 11. Observation and readback

- Present in all repos except the platform duo is narrower.
- Capabilities include:
  - `tmux capture-pane` for CLI peers
  - `node ag.js read`
  - screenshots
  - watcher loops
- Differences:
  - `prototype`: screenshot and read are central because AG is GUI/CDP-based.
  - `design_pattern_factory` and `alpha` repos: combine pane capture, AG read, telemetry, and dashboard streaming.
  - `platform_alpha`: pane capture is available but no full web monitor.

#### 12. Leadership configuration

- Present in: `interlateral_design_pattern_factory`, `interlateral_alpha-upstream`, `interlateral_alpha`
- Meaning:
  - `leadership.json` defines who leads, who follows, and collaborative vs hierarchical mode.
- Differences:
  - `design_pattern_factory`: tri-agent leadership only.
  - `alpha-upstream` and `alpha`: quad-agent leadership with Gemini as possible lead.
  - `platform_alpha` and `prototype`: no equivalent runtime leader config.

#### 13. Launch modes

- `interlateral_platform_alpha`
  - `./me.sh` for duo fast path
- `interlateral_prototype_alphasa_uiax`
  - `./scripts/wake-up.sh` for CC + AG
- `interlateral_design_pattern_factory`
  - tri-agent wake-up/bootstrap
- `interlateral_alpha-upstream`
  - `wake-up.sh` full quad
  - `wake-up-no-ag.sh` CLI-only trio
- `interlateral_alpha`
  - same as upstream, with more hardening and better tmux/socket behavior

#### 14. Multi-instance worker pools

- Present in:
  - `interlateral_platform_alpha`: best practical Codex peer tooling today
  - `interlateral_design_pattern_factory`: docs for multi-instance CC/Codex and Gemini patterns
  - `interlateral_alpha-upstream` and `interlateral_alpha`: broader multi-instance mesh thinking, especially around Gemini CLI
- Differences:
  - `platform_alpha` actually has concrete peer helper scripts worth reusing.
  - `design` and `alpha` repos document the idea at broader mesh scale.

#### 15. Permission-granting and peer intervention

- Strongest in: `interlateral_alpha`
- Meaning:
  - A peer agent can observe another agent's terminal and approve stuck in-scope prompts.
- Differences:
  - `alpha` makes this an explicit doctrine in `AGENTS.md`.
  - Other repos imply or partially document intervention, but not with the same clarity.

#### 16. File-based prompt injection (`send-file`)

- Present clearly in: `interlateral_alpha-upstream`, `interlateral_alpha`
- Meaning:
  - Large prompt files can be injected directly to an agent rather than squeezed into one-line messages.
- Why it matters:
  - Important for Skills, worker orchestration, and HyperDomo.
- `platform_alpha` has long-prompt support at the shell helper layer, but not the same file-oriented command surface.

#### 17. Identity stamping and explicit relay metadata

- Strongest in: `interlateral_platform_alpha`
- Meaning:
  - Messages are stamped with explicit relay/team/session metadata via `identity.js`.
- Differences:
  - The mesh repos log heavily, but the platform duo has the cleanest explicit message identity layer.
- Recommendation:
  - This should be imported into the final mesh repo.

#### 18. Skills as collaboration protocols

- Absent as a real runtime layer in:
  - `interlateral_platform_alpha`
  - `interlateral_prototype_alphasa_uiax`
- Present as a minimal curated layer in:
  - `interlateral_design_pattern_factory`
- Present as a full operating layer in:
  - `interlateral_alpha-upstream`
  - `interlateral_alpha`

What Skills do in the later repos:
- Define roles rather than agent identities.
- Let the human assign agents to roles in the prompt.
- Turn collaboration methods into reusable instructions.
- Provide shared vocabulary and termination rules.
- Standardize delivery paths such as `add-comments`.

#### 19. Manager-agent orchestration (HyperDomo)

- Present in: `interlateral_alpha-upstream`, `interlateral_alpha`
- Meaning:
  - Skills are no longer just instructions to workers.
  - A manager agent can load project skills, wake workers, send prompts, wait on signals, checkpoint state, and generate reports.
- This is the deepest form of Skills usage found in the investigated repos.

#### 20. Trace-based quality evaluation (evals)

- Present strongly in: `interlateral_alpha-upstream`, `interlateral_alpha`
- Partial/code-context presence in:
  - `interlateral_prototype_alphasa_uiax` via eval-related code directories
- Not a first-class Skills feature in:
  - `interlateral_design_pattern_factory`
  - `interlateral_platform_alpha`

What it does:
- Runs quality checks against OTEL traces.
- Checks review timing, approval chains, issue addressing, token cost, courier usage, and more.

#### 21. Dashboard and monitor as collaboration surface

- Present in:
  - `interlateral_prototype_alphasa_uiax`
  - `interlateral_design_pattern_factory`
  - `interlateral_alpha-upstream`
  - `interlateral_alpha`
- Absent in:
  - `interlateral_platform_alpha`

Capabilities:
- Real-time stream display
- direct injection UI
- multiple skins/views
- export
- operational visibility for humans

### B. Non-Agent Capabilities and Repo Context

#### `interlateral_platform_alpha`

- Product application code
- Express API server
- React admin UI
- pluggable skins
- database and migration scripts
- simulation and debate-related scripts
- GCP deployment and operations
- GCP cost guard and shutdown/spinup documentation

#### `interlateral_prototype_alphasa_uiax`

- Comms monitor dashboard
- AG telemetry and observability
- bootstrap scripts
- eval-related code directories
- project template structure

#### `interlateral_design_pattern_factory`

- Comms monitor/dashboard
- observability logs and casts
- Skills workspace projects
- sandbox and design-pattern materials
- tests and scripts for pattern development

#### `interlateral_alpha-upstream`

- Comms monitor/dashboard
- observability and traces
- OTEL/evals integration
- project skill and manager-agent experiments
- no-AG and full-mesh launch modes
- worker orchestration and reporting tooling

#### `interlateral_alpha`

- Everything above from `alpha-upstream`
- more hardened tmux/socket model
- stronger Codex operating manual
- more refined Gemini bootstrap behavior
- better session reset behavior

---

## 3. Proposed Best and Final Multi-Agent Repo

### Recommendation

The final multi-agent repo should be a new dedicated repo based on `interlateral_alpha`, not on `interlateral_platform_alpha`.

Reason:
- `interlateral_alpha` already has the correct base shape for a true multi-agent control repo: mesh runtime, AG, Gemini CLI, Skills, evals, dashboard, telemetry, leadership, and startup manuals.
- `interlateral_platform_alpha` should be used as a donor for the launcher kernel and selected helper files, not as the whole base, because it drags in product app and GCP concerns that do not belong in a dedicated agent-control repo.

Best-final architecture in one sentence:
- Use `interlateral_alpha` as the base repo, replace its human-facing entrypoint with `interlateral_platform_alpha/me.sh`, import `identity.js` and peer-launch tooling from `interlateral_platform_alpha`, keep canonical Skills from `interlateral_alpha`, and normalize all docs around direct comms first and courier fallback second.

### Human-Facing Launch Modes

Keep separate entrypoints instead of one overloaded script:

- `./me.sh`
  - Fast path
  - Claude + Codex only
  - Exact ACK and `Ready to Rock!` behavior
  - This is the "I need two agents now" command

- `./mesh.sh`
  - Full mesh
  - Claude + AG + Codex + Gemini CLI
  - Uses leadership config and full bootstrap

- `./mesh-no-ag.sh`
  - CLI-only mesh
  - Claude + Codex + Gemini CLI
  - Use when AG is unavailable or not worth the overhead

- `./preflight-mesh.sh`
  - Full mesh plus evals/traces/reporting
  - Use for harder or more formal runs

- `./scripts/launch-codex-peer.sh`
  - Worker-pool helper for extra Codex sessions

- `./scripts/launch-gemini-peer.sh`
  - New equivalent helper for Gemini CLI workers

### Proposed Repo File Structure

```text
final_interlateral_agents/
├── me.sh
├── mesh.sh
├── mesh-no-ag.sh
├── preflight-mesh.sh
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── ANTIGRAVITY.md
├── GEMINI.md
├── SKILLS.md
├── .agent/
│   └── skills/
├── .claude/
│   └── skills/
├── .codex/
│   └── skills/
├── interlateral_dna/
│   ├── cc.js
│   ├── codex.js
│   ├── ag.js
│   ├── gemini.js
│   ├── courier.js
│   ├── leadership.json
│   ├── LIVE_COMMS.md
│   ├── identity.js
│   ├── router.js
│   ├── session.js
│   ├── comms.md
│   └── ag_log.md
├── scripts/
│   ├── tmux-config.sh
│   ├── deploy-skills.sh
│   ├── validate-skills.sh
│   ├── bootstrap-full.sh
│   ├── bootstrap-full-no-ag.sh
│   ├── launch-codex-peer.sh
│   ├── send-codex-peer.sh
│   ├── launch-gemini-peer.sh
│   ├── logged-claude.sh
│   ├── open-tmux-window.sh
│   ├── preflight-wakeup.sh
│   ├── run-skill-eval.sh
│   ├── tri-agent-status.sh
│   └── shutdown.sh
├── interlateral_comms_monitor/
├── .observability/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ops/
│   │   └── comms/
│   └── evals/
└── tests/
```

### Source File Map and What to Start From

#### Repo root launchers

- `me.sh`
  - Start from: `interlateral_platform_alpha/me.sh`
  - Why:
    - It already works for the exact duo pattern you are using now.
    - It has the cleanest exact-phrase ACK orchestration.
  - Changes needed:
    - Parameterize session names and socket path through shared config.
    - Make the duo prompt files compatible with the shared startup manuals from the mesh repo.
    - Keep it strictly duo. Do not overload it with AG/Gemini logic.

- `mesh.sh`
  - Start from: `interlateral_alpha/scripts/wake-up.sh`
  - Why:
    - It already knows how to bootstrap AG, monitor, Codex, and Gemini.
  - Changes needed:
    - Wrap it in a cleaner root entrypoint.
    - Harmonize docs, session names, and readiness reporting with `me.sh`.
    - Replace any stale courier-first framing in user-facing docs.

- `mesh-no-ag.sh`
  - Start from: `interlateral_alpha/scripts/wake-up-no-ag.sh`
  - Changes needed:
    - Same cleanup as `mesh.sh`
    - Keep CLI-only mode explicit and first-class

- `preflight-mesh.sh`
  - Start from: `interlateral_alpha/scripts/preflight-wakeup.sh`
  - Changes needed:
    - Make it consistent with the new root-level launch naming

#### Startup manuals

- `AGENTS.md`
  - Start from: `interlateral_alpha/AGENTS.md`
  - Why:
    - Strongest Codex instructions found.
  - Changes needed:
    - Add a short section explaining the difference between `me.sh`, `mesh.sh`, and `mesh-no-ag.sh`.
    - Make direct comms primary and courier explicitly fallback-only everywhere.

- `CLAUDE.md`, `ANTIGRAVITY.md`, `GEMINI.md`
  - Start from: `interlateral_alpha` versions
  - Changes needed:
    - Align wake-up semantics with the `me.sh` duo fast path.
    - Remove doc drift and make session names consistent with the new repo conventions.

#### Skills system

- `SKILLS.md`
  - Start from: `interlateral_alpha/SKILLS.md`
  - Why:
    - Best canonical index model.
  - Changes needed:
    - Clean example paths that still reference the old `projects/Skills_Capability/workspace_for_skills/...` lineage.

- `.agent/skills/`
  - Start from: `interlateral_alpha/.agent/skills/`
  - Why:
    - Best complete catalog: collaboration, competition, publication, evals, HyperDomo, project Skills.
  - Changes needed:
    - Review each skill for stale path references.
    - Keep design clarity from `interlateral_design_pattern_factory` where the alpha wording became too sprawling.

- `.claude/skills/` and `.codex/skills/`
  - Start from: `interlateral_alpha` deployed copies
  - Changes needed:
    - Keep them generated from `.agent/skills` via `deploy-skills.sh`

- `scripts/deploy-skills.sh`
  - Start from: `interlateral_alpha/scripts/deploy-skills.sh`
  - Keep:
    - `.agent/skills` as canonical source
    - `.claude/skills` and `.codex/skills` as deployment targets

#### DNA / comms layer

- `interlateral_dna/cc.js`
  - Start from: `interlateral_alpha/interlateral_dna/cc.js`
  - Import from platform:
    - `identity.js` stamping pattern
  - Changes needed:
    - Stamp relay identity consistently.
    - Keep `send-file`.
    - Keep shared-socket support.

- `interlateral_dna/codex.js`
  - Start from: `interlateral_alpha/interlateral_dna/codex.js`
  - Import from platform:
    - identity stamping
    - some of the simpler duo logging ergonomics
  - Changes needed:
    - Make direct send primary.
    - Keep courier only as fallback.

- `interlateral_dna/ag.js`
  - Start from: `interlateral_alpha/interlateral_dna/ag.js`
  - Why:
    - Most complete AG transport found.
  - Keep:
    - send
    - read
    - status
    - screenshot
    - watch

- `interlateral_dna/gemini.js`
  - Start from: `interlateral_alpha/interlateral_dna/gemini.js`
  - Keep:
    - 1-second delay
    - status/read/send
    - explicit socket support
  - Changes needed:
    - unify identity stamping and comms logging format with the other agent scripts

- `interlateral_dna/leadership.json`
  - Start from: `interlateral_alpha/interlateral_dna/leadership.json`
  - Keep:
    - quad-agent configs
    - collaborative mode

- `interlateral_dna/LIVE_COMMS.md`
  - Start from: merged content
    - structure and clarity from `interlateral_platform_alpha/interlateral_dna/LIVE_COMMS.md`
    - matrix breadth from `interlateral_alpha/interlateral_dna/LIVE_COMMS.md`
  - Changes needed:
    - remove outdated courier-primary framing
    - explicitly document direct-first, courier-fallback
    - document duo, trio, and quad modes in one place

- `interlateral_dna/identity.js`
  - Start from: `interlateral_platform_alpha/interlateral_dna/identity.js`
  - Why:
    - Best message identity/stamping utility found

#### Script helpers

- `scripts/tmux-config.sh`
  - Start from: merge
    - `interlateral_platform_alpha/scripts/tmux-config.sh`
    - `interlateral_alpha/scripts/tmux-config.sh`
  - Keep from platform:
    - `agent_send`
    - `codex_send_clean`
    - long-prompt paste support
    - pane capture helpers
    - idle detection
  - Keep from alpha:
    - explicit shared socket model
  - This is a significant merged file and one of the most important pieces.

- `scripts/bootstrap-full.sh`
  - Start from: `interlateral_alpha/scripts/bootstrap-full.sh`
  - Changes needed:
    - use merged tmux helpers consistently
    - keep Gemini model pinning
    - normalize readiness reporting

- `scripts/bootstrap-full-no-ag.sh`
  - Start from: `interlateral_alpha/scripts/bootstrap-full-no-ag.sh`

- `scripts/launch-codex-peer.sh`
  - Start from: `interlateral_platform_alpha/scripts/launch-codex-peer.sh`
  - Why:
    - Best concrete Codex worker helper found

- `scripts/send-codex-peer.sh`
  - Start from: `interlateral_platform_alpha/scripts/send-codex-peer.sh`

- `scripts/launch-gemini-peer.sh`
  - New file
  - Build from:
    - Gemini session start logic in `interlateral_alpha/scripts/bootstrap-full.sh`
  - Purpose:
    - Give Gemini CLI the same worker-pool ergonomics as Codex

- `scripts/shutdown.sh`
  - Start from: `interlateral_alpha/scripts/shutdown.sh` if retained
  - Changes needed:
    - explicitly stop watcher, courier, dashboard, and tmux sessions created by this repo

#### Dashboard and observability

- `interlateral_comms_monitor/`
  - Start from: `interlateral_alpha/interlateral_comms_monitor/`
  - Why:
    - More mature than the earliest prototype and more integrated with evals/docs

- `.observability/` conventions
  - Start from: `interlateral_alpha`
  - Keep:
    - traces
    - casts
    - logs
    - eval outputs

### New Files or Significant New Architecture Needed

#### 1. `mesh.sh`

New root launcher.

Why needed:
- `me.sh` should stay simple and duo-only.
- The final repo needs a similarly simple root command for the full mesh.

What it should include:
- call into `bootstrap-full.sh`
- load shared session/socket config
- inject a clean full-mesh wake-up prompt
- wait for all required ACKs
- print a concise readiness summary

#### 2. `router.js`

New DNA-level command router.

Why needed:
- Right now each repo has duplicated send/status/read logic spread across multiple files and multiple eras.
- A small router can centralize target lookup, message stamping, comms logging, and mode-specific fallbacks.

What it should include:
- target registry for `cc`, `codex`, `ag`, `gemini`
- `send`, `status`, `read` dispatch
- fallback order per agent
- unified logging format

#### 3. `session.js`

New DNA-level session and naming config.

Why needed:
- Session names, socket paths, team IDs, and defaults should not be hardcoded in multiple files.

What it should include:
- socket path
- session names
- team/session metadata
- ACK timeout values
- launcher mode (`duo`, `trio`, `quad`)

#### 4. `docs/ARCHITECTURE.md`

New architecture overview.

Why needed:
- The repos currently rely on layered README/manual drift.
- The final repo needs one document that explains:
  - launch modes
  - DNA layer
  - Skills layer
  - monitor/evals layer
  - worker-pool model

#### 5. Skills cleanup pass

This is not one file, but it is mandatory.

What needs to be cleaned:
- remove stale old-path examples
- distinguish direct comms vs courier fallback clearly
- standardize role names and termination conventions
- ensure HyperDomo/project Skills load only canonical `.agent/skills`

### Final Recommendation in Practical Terms

If I were building the final repo now, I would do it in this order:

1. Copy `interlateral_alpha` to become the new dedicated multi-agent base.
2. Import `me.sh`, `identity.js`, `launch-codex-peer.sh`, and `send-codex-peer.sh` from `interlateral_platform_alpha`.
3. Merge `scripts/tmux-config.sh` from `platform_alpha` and `alpha`.
4. Normalize `cc.js`, `codex.js`, `gemini.js`, and `LIVE_COMMS.md` around direct-first comms.
5. Keep `.agent/skills` and `SKILLS.md` from `alpha`, but clean stale examples and reduce drift.
6. Add `mesh.sh`, `router.js`, `session.js`, and `launch-gemini-peer.sh`.
7. Keep `interlateral_comms_monitor` and eval tooling from `alpha`.
8. Use `design_pattern_factory` as a reference for simplifying Skills wording and testing the minimal pattern library.
9. Keep `prototype_alphasa_uiax` only as historical AG/dashboard reference, not as an active donor except in narrow edge cases.

Bottom line:
- Best launcher donor: `interlateral_platform_alpha`
- Best mesh/skills donor: `interlateral_alpha`
- Best minimal skills reference: `interlateral_design_pattern_factory`
- Best historical AG reference: `interlateral_prototype_alphasa_uiax`
- Best final repo shape: a new dedicated repo based on `interlateral_alpha`, upgraded with `interlateral_platform_alpha/me.sh` and platform-style launcher ergonomics
