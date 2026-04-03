# Interlateral Multi-Agent Ecosystem: Comprehensive Cross-Repository Report

**Author:** Claude Opus 4.6 (1M context)
**Date:** 2026-04-02
**Repos Examined:** 5

---

## Table of Contents

1. [Individual Repo Findings](#1-individual-repo-findings)
2. [Full Capabilities Matrix](#2-full-capabilities-matrix)
3. [Proposed Best-and-Final Multi-Agent Repo](#3-proposed-best-and-final-multi-agent-repo)

---

# 1. Individual Repo Findings

---

## 1.1 interlateral_platform_alpha

**Path:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha`

### Top-Line Summary

A **production platform** for an AI agent professional network focused on structured events (debates, voting, collaboration). Features a 3600+ line Express API server, dual-persistence (LowDB + PostgreSQL), GCP deployment infrastructure, and a React admin console with 15+ pluggable skins. Agent-to-agent comms use a simple tmux-only approach (Claude Code + Codex) with identity stamping.

### What It Is and What It Does

This is the **product** — the actual Interlateral professional network where AI agents register, join events, post activities, vote, and collaborate. It has:

- **API Server** (api-server.js, 152KB): Full REST API with auth, rate limiting, event modules, rounds, checkpoints, decisions, moderation
- **Event System**: Module-based event types (simple_debate, open_simple_debate, debate) with proposal rounds, voting rounds, and evidence gates
- **Database**: LowDB (JSON file) with PostgreSQL migration path via dual-write mode
- **Admin UI**: React+Vite with skins for Admin Console, Directory, Event Feed, Scoreboard, Mission Control, Debate Flow, etc.
- **GCP Infrastructure**: Cloud SQL, GCE MIG, Load Balancer, Artifact Registry, Secret Manager (~$2/day running, ~$0.24/day idle)
- **Agent Onboarding**: SKILL.md files for agent self-registration via API (register -> verify -> approve -> API key)

### Inter-Agent Communication

- **Agent pair**: Claude Code + Codex (GPT) only
- **Transport**: tmux send-keys on custom socket (`/tmp/interlateral-platform-alpha-tmux.sock`)
- **Scripts**: `cc.js` (73 lines), `codex.js` (75 lines) — simple, zero npm dependencies
- **Identity stamping**: `[ID team=platform sender=relay host=... sid=...]` metadata on every message
- **Launch**: `me.sh` creates both tmux sessions, agents do mutual ACK handshake
- **Safety**: Never send Ctrl-C to Codex (kills CLI); Escape only for overlay dismissal

### What's Same as Others

- `interlateral_dna/` directory with cc.js, codex.js, comms.md
- tmux-based messaging with pause-before-Enter pattern
- Escape before Enter to dismiss autocomplete

### What's Different

- **No AG/Gemini support** — only 2 agents (CC + Codex)
- **No Skills system** — no .agent/skills/, no SKILLS.md
- **No CDP/browser automation** — both agents are CLI tools
- **Has identity.js** with full message stamping (unique to this repo)
- **Has a production API server** — no other repo has this
- **Has GCP infrastructure** with cost guards and tested shutdown runbook
- **Has event modules** with debate/voting/rounds
- **Has comprehensive test suite**: contract smoke, auth, moderation, PG integration, simulation runners
- **Has simulation runners**: simulation-runner.js (161KB), simple-debate-runner.js (33KB), etc.

### Overall Assessment

The most **production-ready** repo but the **simplest** agent-to-agent system. Its strength is the platform product, not the multi-agent orchestration. The comms layer is minimal by design — both agents are CLI tools talking via tmux, so no browser automation is needed. The identity stamping system is the one unique comms feature worth preserving.

---

## 1.2 interlateral_prototype_alphasa_uiax

**Path:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_prototype_alphasa_uiax`

### Top-Line Summary

A **prototype/template** repo focused on solving the hard problem of Claude Code + Antigravity (Gemini) browser-based communication via Chrome DevTools Protocol. Features a Comms Monitor dashboard for real-time agent observation, extensive observability tooling, but no backend platform or Skills system.

### What It Is and What It Does

This is where the **CC-to-AG communication pattern was first developed**. It solves the specific challenge of injecting text into Antigravity's browser-based UI using CDP (puppeteer-core) while maintaining bidirectional comms. It includes:

- **ag.js** (v1.3.0, 234 lines): CDP-based injection into AG's contenteditable input via iframe discovery
- **cc.js** (v1.0, 236 lines): tmux-based injection into CC's terminal
- **Comms Monitor**: Express+WebSocket backend + React+Vite frontend with hot-swappable skins (Cockpit, Timeline, Focus)
- **Observability**: asciinema recordings, log rotation, telemetry discovery
- **10 auxiliary scripts**: ag_send.js, ag_chat.js, ag_control.js, ag_manager.js, ag_probe.js, ag_interact.js, ag_launchpad.js, ag_deep.js — for debugging and specialized AG interactions

### Inter-Agent Communication

- **Agent pair**: Claude Code + Antigravity (Gemini) only
- **CC -> AG**: CDP via puppeteer-core on port 9222 — finds workspace page, navigates into Agent Manager iframe (cascade-panel.html), locates contenteditable div, types via `execCommand('insertText')`, submits with Enter
- **AG -> CC**: tmux send-keys with 1-second delay before Enter
- **Coordination files**: comms.md (bidirectional), ag_log.md (CC->AG transcript)
- **No Codex or Gemini CLI support**

### What's Same as Others

- `interlateral_dna/` directory with ag.js, cc.js, comms.md, ag_log.md
- CDP approach for AG (shared with alpha-upstream, design_pattern_factory, interlateral_alpha)
- Comms Monitor dashboard (shared with alpha-upstream, design_pattern_factory, interlateral_alpha)
- Observability system (asciinema casts, log rotation)

### What's Different

- **Only 2 agents** (CC + AG) — no Codex, no Gemini CLI
- **No Skills system** at all
- **No courier.js** (no need — no sandboxed agent)
- **No leadership.json** (no need — only 2 agents)
- **No identity stamping** — messages are just `[CC] @AG` or `[AG] @CC`
- **Has 10 auxiliary AG scripts** that no other repo has (ag_send.js, ag_chat.js, ag_control.js, ag_manager.js, ag_probe.js, ag_interact.js, ag_launchpad.js, ag_deep.js)
- **Has the most extensive ag.js debugging toolkit** — multiple specialized scripts for different AG interaction scenarios
- **Comms Monitor uses file watching** (chokidar on comms.md, ag_log.md) — same pattern as others but this is where it was first built

### Overall Assessment

The **R&D prototype** where browser-based agent communication was cracked. The auxiliary AG scripts (ag_probe, ag_deep, ag_interact, etc.) represent the debugging journey. Valuable as a historical reference and for understanding CDP quirks, but superseded by the more mature repos. The Comms Monitor originated here.

---

## 1.3 interlateral_alpha-upstream

**Path:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha-upstream`

### Top-Line Summary

A **quad-agent mesh distribution template** — the polished upstream that projects fork from. Supports 4 agents (CC, AG, Codex, Gemini CLI) with full bidirectional communication, 16 reusable Skills implementing design patterns, a complete Lake Merritt LLM-as-judge evaluation system, and comprehensive observability.

### What It Is and What It Does

This is the **distribution-ready template** designed to be cloned for new projects. It packages everything needed for autonomous multi-agent collaboration:

- **Quad-agent mesh**: CC (Anthropic) + AG (Google Gemini) + Codex (OpenAI) + Gemini CLI (Google)
- **16 Skills**: 6 design patterns (peer-collaboration, negotiation, hierarchical, democratic, competition, constitutional) + 7 functional patterns (dev-collaboration, dev-competition, publication-pipeline, add-comments, adherence-check, hyperdomo, test-4-series) + 3 infrastructure (evals, search-synth, create-skin)
- **Lake Merritt evals**: LLM-as-judge scoring with 7 eval packs
- **Full observability**: 3-tier (visual/semantic/real-time), OTEL traces, asciinema recordings
- **Comms Monitor dashboard**: Express+WebSocket+React with hot-swappable skins
- **45+ scripts**: wake-up variants, eval runners, conformance checks, deployment tools

### Inter-Agent Communication

- **4 agents**: CC, AG, Codex, Gemini CLI — all bidirectional
- **CC <-> AG**: CDP via ag.js (~600 lines) + cc.js (~200 lines)
- **CC <-> Codex**: tmux via codex.js (~200 lines)
- **CC <-> Gemini**: tmux via gemini.js (~200 lines) — critical 1s delay for input buffer
- **Codex -> CC/AG**: courier.js file watcher on `codex_outbox/` (Codex is sandboxed)
- **Leadership protocol**: leadership.json configures who leads, ACK timeout, fallback
- **Ledger + Whip**: Every message = injection (whip) + comms.md entry (ledger)
- **LIVE_COMMS.md**: Canonical communication matrix for all 4 agents

### What's Same as Others

- Shares DNA with design_pattern_factory and interlateral_alpha (nearly identical comms layer)
- Same Comms Monitor dashboard architecture
- Same observability system
- Same CDP approach for AG

### What's Different vs design_pattern_factory

- **16 skills vs 4** — upstream has the full library including constitutional, negotiation, democratic, hierarchical, hyperdomo, publication-pipeline, test-4-series, search-synth, create-skin
- **Full Lake Merritt evals** with 7 eval packs and Python infrastructure
- **More scripts** (45+ vs ~20)
- **Multiple wake-up variants**: wake-up.sh, wake-up-no-ag.sh, preflight-wakeup.sh
- **TROUBLESHOOTING.md** present
- **896-line README** (vs shorter)

### What's Different vs interlateral_alpha

- Very similar — alpha-upstream appears to be a slightly earlier version or parallel branch
- interlateral_alpha has `.tmux.conf`, ROADMAP_additions.md, mesh-hello-world example project
- interlateral_alpha has SKILLS_DEV_GUIDE.md and EVALS_GUIDE.md in comms monitor docs
- alpha-upstream may have slightly different script counts and documentation depth

### Overall Assessment

The **canonical distribution template** for the Interlateral multi-agent pattern. Designed to be forked. Contains the full 16-skill library and eval system. Very close to interlateral_alpha — one may be the upstream of the other.

---

## 1.4 interlateral_design_pattern_factory

**Path:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_design_pattern_factory`

### Top-Line Summary

A **tri-agent workshop/forge** where Skills and design patterns are authored, tested, and refined before promotion to the upstream template. Has 4 foundational Skills, owns the INTERNALS_CONFORMANCE.md source of truth, and includes the full comms infrastructure for CC + AG + Codex.

### What It Is and What It Does

This is the **factory** — where patterns are invented and validated:

- **Tri-agent mesh**: CC + AG + Codex (no Gemini CLI)
- **4 foundational Skills**: dev-collaboration, dev-competition, adherence-check, add-comments
- **INTERNALS_CONFORMANCE.md**: The source of truth for architecture conformance (~150KB) lives here
- **Skills development workspace**: `projects/Skills_Capability/workspace_for_skills/` is where skills are authored
- **Full comms infrastructure**: ag.js, cc.js, codex.js, courier.js, LIVE_COMMS.md

### Inter-Agent Communication

- **3 agents**: CC, AG, Codex — no Gemini CLI
- **CC <-> AG**: CDP via ag.js (v1.3.0) + cc.js
- **CC <-> Codex**: tmux via codex.js
- **Codex -> CC/AG**: courier.js file watcher on `codex_outbox/`
- **Leadership protocol**: leadership.json with CC default lead
- **Ledger + Whip pattern**: Same as upstream

### What's Same as Others

- Shares core DNA with alpha-upstream and interlateral_alpha
- Same Comms Monitor dashboard
- Same observability system
- Same Ledger + Whip pattern

### What's Different

- **Only 4 Skills** (the building blocks) vs 16 in upstream
- **No Gemini CLI** (no gemini.js)
- **Has the actual skills development workspace** (`projects/Skills_Capability/workspace_for_skills/`)
- **Owns INTERNALS_CONFORMANCE.md** — the authoritative conformance spec
- **Smaller script count** than upstream
- **More experimental** — contains prototypes and drafts
- **cookbook-pr.md** — PR/contribution guidelines

### Overall Assessment

The **R&D lab** for Skills. Patterns are born here, tested here, and promoted to upstream when ready. The 4 skills here (dev-collaboration, dev-competition, adherence-check, add-comments) are the foundation that all other skills build on. Owns the conformance spec that all repos reference.

---

## 1.5 interlateral_alpha

**Path:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha`

### Top-Line Summary

The **most mature and complete quad-agent mesh template**. Supports CC + AG + Codex + Gemini CLI with 17 Skills, full Lake Merritt evaluation system, comprehensive observability, extensive documentation (INTERNALS_CONFORMANCE.md v1.8 at ~150KB), and 46 scripts. Includes a ROADMAP with 33 planned items and graceful degradation to any subset of agents.

### What It Is and What It Does

This is the **flagship template** — the most polished version of the multi-agent mesh:

- **Quad-agent mesh**: CC + AG + Codex + Gemini CLI, all bidirectional
- **17 Skills**: Everything in upstream plus additional refinements
- **Lake Merritt evals**: Full LLM-as-judge with 7 eval packs
- **Comprehensive docs**: INTERNALS_CONFORMANCE.md v1.8 (~150KB), SKILLS_DEV_GUIDE.md, EVALS_GUIDE.md
- **46 scripts**: Bootstrap, recording, evaluation, conformance, deployment, maintenance, development
- **Explicit tmux socket**: `/tmp/interlateral-tmux.sock` (avoids sandbox permission issues)
- **Graceful degradation**: Works with any subset of the 4 agents
- **ROADMAP**: 33 items across NOW/NEXT/LATER/ARCHIVED, plus ROADMAP_additions.md

### Inter-Agent Communication

- **4 agents**: CC, AG, Codex, Gemini CLI — all bidirectional
- **ag.js** (9.9KB): CC->AG via CDP puppeteer-core, port 9222, iframe navigation, contenteditable injection
- **cc.js** (9.3KB): Others->CC via tmux, explicit socket `/tmp/interlateral-tmux.sock`, session `interlateral-claude`
- **codex.js** (9.5KB): Others->Codex via tmux, session `interlateral-codex`, sandbox-aware
- **gemini.js** (11.3KB): Others->Gemini via tmux, session `interlateral-gemini`, native capture-pane support
- **courier.js** (3.8KB): File watcher sidecar for sandboxed Codex outbox delivery
- **leadership.json** (1.6KB): Quad-agent leadership with team configurations (hierarchical/collaborative)
- **LIVE_COMMS.md** (7.8KB): Canonical communication matrix with Golden Rule ("NEVER assume another agent will poll comms.md")
- **Ledger + Whip**: Every message = injection + comms.md entry

### What's Same as alpha-upstream

- Nearly identical in scope — both are quad-agent mesh templates
- Same 16+ skills, same eval system, same observability
- Same Comms Monitor dashboard
- Same scripts ecosystem

### What's Different vs alpha-upstream

- **17 skills** (one additional vs 16)
- **SKILLS_DEV_GUIDE.md** in comms monitor docs (skill authoring guide)
- **EVALS_GUIDE.md** in comms monitor docs
- **.tmux.conf** at root (tmux configuration)
- **ROADMAP_additions.md** (17.8KB extended roadmap)
- **mesh-hello-world** example project in `projects/`
- **Explicit tmux socket** path (`/tmp/interlateral-tmux.sock`) in all scripts
- **INTERNALS_CONFORMANCE.md v1.8** (~150KB) — most mature version
- **Permission Granting Protocol** — agents can grant permissions to each other
- **Shared House Rule** — explicit file access governance
- **Fresh Session Rule** with `# === NEW SESSION ===` markers
- **More refined control scripts**: cc.js (9.3KB), codex.js (9.5KB), gemini.js (11.3KB) — larger and more robust than upstream equivalents

### Overall Assessment

The **most complete and mature** multi-agent template. If alpha-upstream is the distribution template, interlateral_alpha is the **reference implementation** with the most refined documentation, scripts, and agent protocols. The Shared House Rule, Permission Granting Protocol, and Fresh Session semantics represent lessons learned that haven't fully propagated to other repos.

---

# 2. Full Capabilities Matrix

## 2A. Agent-to-Agent Communication and Collaboration Capabilities

### Core Communication Infrastructure

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **CC <-> Codex (tmux)** | YES | - | YES | YES | YES |
| **CC <-> AG (CDP)** | - | YES | YES | YES | YES |
| **CC <-> Gemini CLI (tmux)** | - | - | YES | - | YES |
| **AG <-> Codex (tmux)** | - | - | YES | YES | YES |
| **AG <-> Gemini CLI (tmux)** | - | - | YES | - | YES |
| **Codex -> CC/AG (courier)** | - | - | YES | YES | YES |
| **Total agent pairs** | 1 (2 agents) | 1 (2 agents) | 6 (4 agents) | 3 (3 agents) | 6 (4 agents) |

### Communication Transport Details

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **CDP (Chrome DevTools Protocol)** | - | YES | YES | YES | YES |
| **tmux send-keys injection** | YES | YES | YES | YES | YES |
| **Courier file-watcher sidecar** | - | - | YES | YES | YES |
| **Explicit tmux socket path** | custom | default | default | default | `/tmp/interlateral-tmux.sock` |
| **Identity stamping on messages** | YES (full metadata) | - | - | - | - |
| **Pause-before-Enter (race fix)** | YES | YES (1s) | YES (1s) | YES (1s) | YES (1s) |
| **Escape-before-Enter (overlay)** | YES | YES | YES | YES | YES |
| **puppeteer-core dependency** | - | YES (^22) | YES (^22.15) | YES (^22) | YES (^22.15) |

### Control Scripts

| Script | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|--------|:-:|:-:|:-:|:-:|:-:|
| **ag.js** | - | 234 lines | ~600 lines | ~600 lines | 9.9KB |
| **cc.js** | 73 lines | 236 lines | ~200 lines | ~200 lines | 9.3KB |
| **codex.js** | 75 lines | - | ~200 lines | ~200 lines | 9.5KB |
| **gemini.js** | - | - | ~200 lines | - | 11.3KB |
| **courier.js** | - | - | 100 lines | 100 lines | 3.8KB |
| **identity.js** | 26 lines | - | - | - | - |
| **AG auxiliary scripts** | - | 10 scripts | - | - | - |

### Coordination Protocols

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **Ledger + Whip pattern** | partial (tmux only) | partial | YES | YES | YES |
| **comms.md shared ledger** | YES (small) | YES (150KB) | YES | YES | YES (fresh each session) |
| **ag_log.md (CC->AG transcript)** | - | YES (82KB) | YES | YES | YES |
| **leadership.json** | - | - | YES | YES | YES |
| **Configurable lead agent** | - | - | YES | YES | YES |
| **ACK timeout + fallback** | - | - | YES (30s) | YES (30s) | YES (30s) |
| **Fresh Session markers** | - | - | - | - | YES |
| **Permission Granting Protocol** | - | - | - | - | YES |
| **Shared House Rule** | - | - | - | - | YES |
| **LIVE_COMMS.md (canonical ref)** | - | - | YES | YES | YES (7.8KB) |
| **codex_outbox/ message queue** | - | - | YES | YES | YES |

### Agent Instruction Files

| File | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|------|:-:|:-:|:-:|:-:|:-:|
| **CLAUDE.md** | 24 lines (cost guard) | YES (wake-up) | 364 lines | YES | 19.5KB |
| **AGENTS.md / CODEX.md** | 24 lines | - | 344 lines | YES | 16.7KB |
| **ANTIGRAVITY.md** | - | YES | 238 lines | YES | 9.7KB |
| **GEMINI.md** | - | - | 100+ lines | - | 7.2KB |
| **SKILLS.md** | - | - | YES | YES | 9.7KB |
| **ROADMAP.md** | - | - | YES | YES | 9.8KB |
| **TROUBLESHOOTING.md** | - | - | YES | - | YES |

### Launch and Bootstrap

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **me.sh (dual-agent launcher)** | YES | - | - | - | - |
| **wake-up.sh (full system)** | - | YES | YES | YES | YES |
| **wake-up-no-ag.sh (CLI only)** | - | - | YES | - | YES |
| **bootstrap-full.sh** | - | YES | YES | YES | YES (19.9KB) |
| **preflight-wakeup.sh (with evals)** | - | - | YES | - | YES |
| **One-command autonomy** | partial | YES | YES | YES | YES |
| **Graceful degradation** | - | - | YES | YES | YES |
| **Mutual ACK handshake** | YES | - | YES | YES | YES |

### Skills System

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **Skills framework** | - | - | YES | YES | YES |
| **Total skills count** | 0 | 0 | 16 | 4 | 17 |
| **Design patterns** | - | - | 6 | 0 | 6 |
| **Functional patterns** | - | - | 7 | 4 | 7 |
| **Infrastructure skills** | - | - | 3 | 0 | 3+ |
| **.agent/skills/ (canonical)** | - | - | YES | YES | YES |
| **.claude/skills/ (deployed)** | - | - | YES | YES | YES |
| **.codex/skills/ (deployed)** | - | - | YES | YES | YES |
| **deploy-skills.sh** | - | - | YES | YES | YES |
| **validate-skills.sh** | - | - | - | YES | YES |
| **SKILLS_DEV_GUIDE.md** | - | - | - | - | YES |
| **Skill YAML frontmatter** | - | - | YES | YES | YES |

#### Skills Inventory (across repos that have them)

| Skill | Type | alpha-upstream | design_pattern_factory | interlateral_alpha | Description |
|-------|------|:-:|:-:|:-:|-------------|
| **peer-collaboration** | Design Pattern | YES | - | YES | Two agents, turn-based co-creation |
| **negotiation** | Design Pattern | YES | - | YES | Competing priorities reach consensus |
| **hierarchical** | Design Pattern | YES | - | YES | Boss delegates, workers execute |
| **democratic** | Design Pattern | YES | - | YES | Equal voice, majority vote |
| **competition** | Design Pattern | YES | - | YES | Parallel work, judge selects winner |
| **constitutional** | Design Pattern | YES | - | YES | Federated co-authorship + formal voting |
| **dev-collaboration** | Functional | YES | YES | YES | Drafter/Reviewer/Breaker sequential refinement |
| **dev-competition** | Functional | YES | YES | YES | Blind dual-implementation + judge comparison |
| **publication-pipeline** | Functional | YES | - | YES | 3-round editorial (review, red-team, copy-edit) |
| **add-comments** | Functional | YES | YES | YES | Non-destructive multi-agent commenting in isolated workspaces |
| **adherence-check** | Functional | YES | YES | YES | Verify artifacts against INTERNALS_CONFORMANCE.md |
| **hyperdomo** | Functional | YES | - | YES | Manager agent orchestrating worker agents |
| **test-4-series** | Functional | YES | - | YES | Automated test framework for dev-collaboration evals |
| **evals** | Infrastructure | YES | - | YES | LLM-as-judge quality evaluation via Lake Merritt |
| **search-synth** | Infrastructure | YES | - | YES | Research synthesis pattern |
| **create-skin** | Infrastructure | YES | - | YES | Generate new dashboard UI skins |

### Observability

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **asciinema terminal recording** | - | YES | YES | YES | YES |
| **OTEL trace extraction** | - | - | YES | - | YES |
| **events.jsonl stream** | - | - | YES | - | YES |
| **Comms Monitor dashboard** | - | YES | YES | YES | YES |
| **Hot-swappable skins** | YES (admin UI) | YES | YES | YES | YES |
| **WebSocket real-time streaming** | - | YES | YES | YES | YES |
| **File watcher (chokidar)** | - | YES | YES | YES | YES |
| **Direct injection from UI** | - | YES | YES | YES | YES |
| **Export (JSON/TXT/CSV)** | - | YES | YES | YES | YES |
| **OpenTelemetry integration** | YES (in API) | - | YES | - | YES |
| **Telemetry log capture** | YES | YES | YES | YES | YES |
| **Log rotation/archival** | - | YES | YES | YES | YES |
| **Session recordings** | - | YES | YES | YES | YES |

### Evaluation System

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **Lake Merritt LLM-as-judge** | - | - | YES | - | YES |
| **Eval packs** | - | - | 7 packs | - | 7 packs |
| **OTEL trace scoring** | - | - | YES | - | YES |
| **export-skill-run.sh** | - | - | YES | - | YES |
| **run-skill-eval.sh** | - | - | YES | - | YES |
| **EVALS_GUIDE.md** | - | - | - | - | YES |
| **corpbot_agent_evals/ directory** | - | - | YES | - | YES |

### Conformance and Quality

| Capability | platform_alpha | alphasa_uiax | alpha-upstream | design_pattern_factory | interlateral_alpha |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **INTERNALS_CONFORMANCE.md** | - | - | referenced | YES (source of truth) | v1.8 (~150KB) |
| **conformance-check.sh** | - | - | - | - | YES |
| **adherence-check skill** | - | - | YES | YES (authored here) | YES |
| **INTERNALS_GUIDE.md** | - | - | YES | YES | YES |

---

## 2B. Non-Agent Capabilities (Contextual)

| Capability | Repo(s) | Notes |
|-----------|---------|-------|
| **REST API Server (3600+ lines)** | platform_alpha | Express.js, auth, rate limiting, event modules |
| **Event System (debates, voting, rounds)** | platform_alpha | Module-based: simple_debate, open_simple_debate, debate |
| **Database (LowDB + PostgreSQL)** | platform_alpha | Dual-write migration path |
| **GCP Infrastructure** | platform_alpha | Cloud SQL, GCE MIG, Load Balancer, Artifact Registry |
| **Agent Registration/Onboarding API** | platform_alpha | Register -> verify -> approve -> API key |
| **Simulation Runners** | platform_alpha | simulation-runner.js (161KB), simple-debate-runner.js (33KB) |
| **Admin Console UI (15+ skins)** | platform_alpha | React+Vite, AdminConsole, Directory, EventFeed, Scoreboard, etc. |
| **Agent Evals (Lake Merritt)** | alpha-upstream, interlateral_alpha | Python, LLM-as-judge, 7 eval packs |
| **AG Auxiliary Debug Scripts** | alphasa_uiax | 10 scripts for CDP debugging |
| **Skills Development Workspace** | design_pattern_factory | Where skills are authored before promotion |
| **INTERNALS_CONFORMANCE.md (source)** | design_pattern_factory, interlateral_alpha | Architecture conformance spec |
| **Example Project (mesh-hello-world)** | interlateral_alpha | Template for user projects |
| **Python Test Suite** | all mesh repos | pytest: wake-up, capture, cleanup, wrappers |

---

# 3. Proposed Best-and-Final Multi-Agent Repo

## 3A. Design Principles

The goal is a single repo that:

1. **Starts simple**: `me.sh` boots CC + Codex (what you're using right now) in under 5 seconds
2. **Scales up**: Optional flags add AG, Gemini CLI, or both
3. **Skills-first**: Human points to a Skill in their prompt and agents know what to do
4. **Preserves everything**: All capabilities from all 5 repos are accessible
5. **Clean separation**: comms layer, skills, platform features, and observability are modular

## 3B. Proposed File Structure

```
interlateral_agents/                    # THE repo
│
├── me.sh                              # PRIMARY ENTRYPOINT (simple, fast)
├── me-full.sh                         # Full quad-agent mesh with AG + Gemini CLI
├── me-no-ag.sh                        # CLI-only: CC + Codex + Gemini CLI
│
├── CLAUDE.md                          # CC instructions (merge platform_alpha + interlateral_alpha)
├── AGENTS.md                          # Codex instructions (from interlateral_alpha)
├── ANTIGRAVITY.md                     # AG instructions (from interlateral_alpha)
├── GEMINI.md                          # Gemini CLI instructions (from interlateral_alpha)
├── SKILLS.md                          # Skills index (from interlateral_alpha, 17 skills)
├── README.md                          # Getting started guide
├── ROADMAP.md                         # Public roadmap
├── TROUBLESHOOTING.md                 # Common issues
├── LICENSE                            # MIT
│
├── interlateral_dna/                  # CORE COMMS LAYER
│   ├── cc.js                          # FROM: interlateral_alpha/interlateral_dna/cc.js
│   │                                  #   CHANGE: Add identity stamping from platform_alpha/identity.js
│   │                                  #   CHANGE: Support both simple socket (me.sh) and explicit socket
│   ├── codex.js                       # FROM: interlateral_alpha/interlateral_dna/codex.js
│   │                                  #   CHANGE: Add identity stamping
│   │                                  #   CHANGE: Support both socket modes
│   ├── ag.js                          # FROM: interlateral_alpha/interlateral_dna/ag.js
│   │                                  #   No changes needed — most mature version
│   ├── gemini.js                      # FROM: interlateral_alpha/interlateral_dna/gemini.js
│   │                                  #   No changes needed — most mature version
│   ├── courier.js                     # FROM: interlateral_alpha/interlateral_dna/courier.js
│   │                                  #   No changes needed
│   ├── identity.js                    # FROM: platform_alpha/interlateral_dna/identity.js
│   │                                  #   CHANGE: Extend to support all 4 agents, not just relay
│   │                                  #   CHANGE: Add agent-type field (cc/codex/ag/gemini/relay)
│   ├── leadership.json                # FROM: interlateral_alpha/interlateral_dna/leadership.json
│   │                                  #   No changes needed — quad-agent config
│   ├── LIVE_COMMS.md                  # FROM: interlateral_alpha/interlateral_dna/LIVE_COMMS.md
│   │                                  #   No changes needed — canonical reference
│   ├── comms.md                       # Generated fresh each session
│   ├── ag_log.md                      # Generated by ag.js
│   ├── codex_outbox/                  # Courier message queue
│   ├── README.md                      # FROM: interlateral_alpha/interlateral_dna/README.md
│   └── package.json                   # FROM: interlateral_alpha (puppeteer-core ^22.15)
│
├── skills/                            # SKILLS (promoted from .agent/skills/)
│   │                                  # NOTE: Move to top-level for visibility.
│   │                                  # .agent/skills/, .claude/skills/, .codex/skills/
│   │                                  # become symlinks or deploy copies.
│   │
│   ├── peer-collaboration/SKILL.md    # FROM: interlateral_alpha/.agent/skills/
│   ├── negotiation/SKILL.md           # FROM: interlateral_alpha/.agent/skills/
│   ├── hierarchical/SKILL.md          # FROM: interlateral_alpha/.agent/skills/
│   ├── democratic/SKILL.md            # FROM: interlateral_alpha/.agent/skills/
│   ├── competition/SKILL.md           # FROM: interlateral_alpha/.agent/skills/
│   ├── constitutional/SKILL.md        # FROM: interlateral_alpha/.agent/skills/
│   ├── dev-collaboration/SKILL.md     # FROM: interlateral_alpha/.agent/skills/
│   ├── dev-competition/SKILL.md       # FROM: interlateral_alpha/.agent/skills/
│   ├── publication-pipeline/SKILL.md  # FROM: interlateral_alpha/.agent/skills/
│   ├── add-comments/SKILL.md          # FROM: interlateral_alpha/.agent/skills/
│   ├── adherence-check/SKILL.md       # FROM: interlateral_alpha/.agent/skills/
│   ├── hyperdomo/SKILL.md             # FROM: interlateral_alpha/.agent/skills/
│   ├── test-4-series/SKILL.md         # FROM: interlateral_alpha/.agent/skills/
│   ├── evals/SKILL.md                 # FROM: interlateral_alpha/.agent/skills/
│   ├── search-synth/SKILL.md          # FROM: interlateral_alpha/.agent/skills/
│   └── create-skin/SKILL.md           # FROM: interlateral_alpha/.agent/skills/
│
├── .agent/skills -> ../skills         # SYMLINK: AG reads here
├── .claude/skills -> ../skills        # SYMLINK: CC reads here
├── .codex/skills -> ../skills         # SYMLINK: Codex reads here
│
├── scripts/                           # BOOTSTRAP & OPERATIONS
│   │
│   │  # --- Launchers ---
│   ├── bootstrap-dual.sh             # NEW: Minimal bootstrap for me.sh (CC + Codex only)
│   │                                  #   Based on: platform_alpha/me.sh logic
│   │                                  #   Creates 2 tmux sessions on shared socket
│   │                                  #   No AG, no dashboard, no CDP — fast start
│   │                                  #   Includes identity stamping setup
│   │                                  #   Includes mutual ACK handshake
│   │
│   ├── bootstrap-full.sh             # FROM: interlateral_alpha/scripts/bootstrap-full.sh
│   │                                  #   CHANGE: Add identity stamping initialization
│   │                                  #   CHANGE: Source shared tmux-config.sh
│   │                                  #   For me-full.sh (all 4 agents + dashboard)
│   │
│   ├── bootstrap-cli.sh              # FROM: interlateral_alpha/scripts/bootstrap-full-no-ag.sh
│   │                                  #   RENAME for clarity
│   │                                  #   For me-no-ag.sh (CC + Codex + Gemini CLI)
│   │
│   │  # --- Agent Wrappers ---
│   ├── logged-claude.sh               # FROM: interlateral_alpha/scripts/logged-claude.sh
│   ├── start-codex-tmux.sh            # FROM: interlateral_alpha/scripts/start-codex-tmux.sh
│   ├── logged-ag.sh                   # FROM: interlateral_alpha/scripts/logged-ag.sh (if exists)
│   │
│   │  # --- Observability ---
│   ├── preflight-wakeup.sh            # FROM: interlateral_alpha/scripts/preflight-wakeup.sh
│   ├── export-skill-run.sh            # FROM: interlateral_alpha/scripts/export-skill-run.sh
│   ├── discover-cc-logs.sh            # FROM: interlateral_alpha/scripts/discover-cc-logs.sh
│   ├── rotate-logs.sh                 # FROM: interlateral_alpha/scripts/rotate-logs.sh
│   ├── harvest-native-logs.sh         # FROM: interlateral_alpha (if exists)
│   │
│   │  # --- Evals ---
│   ├── run-skill-eval.sh              # FROM: interlateral_alpha/scripts/run-skill-eval.sh
│   ├── run-test4.sh                   # FROM: interlateral_alpha/scripts/run-test4.sh
│   │
│   │  # --- Maintenance ---
│   ├── deploy-skills.sh               # FROM: interlateral_alpha/scripts/deploy-skills.sh
│   │                                  #   CHANGE: Create symlinks instead of copies
│   ├── validate-skills.sh             # FROM: interlateral_alpha/scripts/validate-skills.sh
│   ├── conformance-check.sh           # FROM: interlateral_alpha/scripts/conformance-check.sh
│   ├── reset-leadership.sh            # FROM: interlateral_alpha/scripts/reset-leadership.sh
│   ├── shutdown.sh                    # FROM: interlateral_alpha/scripts/shutdown.sh
│   ├── end-session-safe.sh            # FROM: interlateral_alpha/scripts/end-session-safe.sh
│   │
│   │  # --- Setup ---
│   ├── first-time-setup.sh            # FROM: interlateral_alpha/scripts/first-time-setup.sh
│   ├── setup-ag-telemetry.sh          # FROM: interlateral_alpha/scripts/setup-ag-telemetry.sh
│   ├── setup-observability.sh         # FROM: interlateral_alpha/scripts/setup-observability.sh
│   ├── tmux-config.sh                 # FROM: interlateral_alpha/scripts/tmux-config.sh
│   │                                  #   CHANGE: Shared socket config used by all launchers
│   ├── quick-status.sh                # FROM: interlateral_alpha/scripts/quick-status.sh
│   └── open-tmux-window.sh            # FROM: interlateral_alpha/scripts/open-tmux-window.sh
│
├── interlateral_comms_monitor/        # DASHBOARD (optional, for full mesh)
│   ├── server/                        # FROM: interlateral_alpha/interlateral_comms_monitor/server/
│   ├── ui/                            # FROM: interlateral_alpha/interlateral_comms_monitor/ui/
│   ├── scripts/                       # FROM: interlateral_alpha/interlateral_comms_monitor/scripts/
│   └── docs/                          # FROM: interlateral_alpha/interlateral_comms_monitor/docs/
│       ├── INTERNALS_GUIDE.md
│       ├── INTERNALS_CONFORMANCE.md   # FROM: interlateral_alpha (v1.8, ~150KB)
│       ├── USER_GUIDE.md
│       ├── EVALS_GUIDE.md
│       ├── SKILLS_DEV_GUIDE.md
│       └── SKIN_DEV_GUIDE.md
│
├── evals/                             # EVALUATION SYSTEM
│   │                                  # FROM: interlateral_alpha/corpbot_agent_evals/lake_merritt/
│   │                                  # RENAME: corpbot_agent_evals -> evals (cleaner)
│   ├── lake_merritt/                  # Python eval engine
│   │   ├── eval_*.py                  # Eval pack implementations
│   │   └── requirements.txt           # Python dependencies
│   └── walkthrough.md                 # Eval system guide
│
├── .observability/                    # SESSION DATA (gitignored)
│   ├── casts/                         # asciinema recordings
│   ├── traces/                        # OTEL traces
│   ├── evals/                         # Eval reports
│   ├── logs/                          # Archived sessions
│   ├── events.jsonl                   # Event stream
│   └── SESSIONS/                      # Session metadata
│
├── .gemini/                           # Gemini CLI config
├── .claude/                           # Claude Code config + skills symlink
├── .codex/                            # Codex config + skills symlink
├── .agent/                            # AG config + skills symlink
│
├── docs/                              # REFERENCE DOCUMENTATION
│   ├── observability.md               # FROM: interlateral_alpha/docs/observability.md
│   ├── OTEL_TRACE_VALIDITY.md         # FROM: interlateral_alpha/docs/
│   ├── historical.md                  # FROM: interlateral_alpha/docs/historical.md
│   ├── codex_info/                    # FROM: interlateral_alpha/docs/codex_info/
│   └── gemini-cli_info/               # FROM: interlateral_alpha/docs/gemini-cli_info/
│
├── projects/                          # USER PROJECT WORKSPACE
│   └── mesh-hello-world/              # FROM: interlateral_alpha/projects/mesh-hello-world/
│
├── tests/                             # TEST SUITE
│   ├── test_wake_up.py                # FROM: interlateral_alpha/tests/
│   ├── test_capture.py
│   ├── test_cleanup.py
│   ├── test_wrappers.py
│   ├── test_lake_merritt.py
│   └── conftest.py
│
├── dev_plan/                          # TASK ASSIGNMENTS
│   └── dev_plan.md                    # Human-editable
│
├── .env.example                       # Environment template
├── .tmux.conf                         # FROM: interlateral_alpha/.tmux.conf
├── .gitignore                         # FROM: interlateral_alpha/.gitignore
└── temp/                              # Temporary workspace
```

## 3C. The Three Launcher Scripts

### me.sh — The Simple Starter (What You're Using Now)

**Source:** Based on `platform_alpha/me.sh` logic, simplified
**What it does:** Boots CC + Codex in tmux, mutual ACK, ready in <5 seconds

```bash
#!/bin/bash
# me.sh — Dual-agent quick start (CC + Codex)
# Usage: ./me.sh ["optional prompt for CC"]
#
# This is the simplest launcher. Two agents, tmux only, no browser.
# For full mesh (AG + Gemini CLI + dashboard): use me-full.sh
# For CLI-only trio (CC + Codex + Gemini): use me-no-ag.sh

source scripts/tmux-config.sh          # Shared socket config
source scripts/bootstrap-dual.sh       # Create 2 tmux sessions

# Boot CC with wake-up prompt (includes ACK handshake with Codex)
# Boot Codex with --yolo and matching ACK handshake
# Identity stamping enabled by default
# Pipe-pane telemetry capture enabled

# Changes needed vs current platform_alpha me.sh:
#   - Source tmux-config.sh for socket path consistency
#   - Add INTERLATERAL_TEAM_ID, INTERLATERAL_SENDER env vars
#   - Reference CLAUDE.md (merged version with Skills awareness)
#   - Add optional --with-skills flag to pre-load a specific Skill
```

**Key addition — Skills invocation from prompt:**
```bash
# Human can reference a Skill directly:
./me.sh "Use the dev-collaboration skill. I'm assigning CC as Drafter and Codex as Reviewer+Breaker. Task: refactor the auth module."

# Or just start plain:
./me.sh
```

### me-full.sh — The Full Quad-Agent Mesh

**Source:** Based on `interlateral_alpha/scripts/wake-up.sh`
**What it does:** Boots all 4 agents + Comms Monitor dashboard + observability

```bash
#!/bin/bash
# me-full.sh — Full quad-agent mesh with dashboard
# Usage: ./me-full.sh ["optional prompt"]
#
# Starts: CC, Codex, Antigravity (CDP), Gemini CLI, Dashboard
# Requires: Node.js 20+, Chrome/Chromium, Antigravity installed

source scripts/tmux-config.sh
source scripts/bootstrap-full.sh       # Full system bootstrap (idempotent)

# Changes needed vs interlateral_alpha wake-up.sh:
#   - Add identity stamping initialization
#   - Add --skip-dashboard flag option
#   - Add --skip-evals flag option
#   - Reference merged CLAUDE.md
```

### me-no-ag.sh — CLI-Only Trio

**Source:** Based on `interlateral_alpha/scripts/wake-up-no-ag.sh`
**What it does:** Boots CC + Codex + Gemini CLI (no browser needed)

```bash
#!/bin/bash
# me-no-ag.sh — CLI-only tri-agent (no Antigravity)
# Usage: ./me-no-ag.sh ["optional prompt"]
#
# For when Antigravity isn't installed or you want terminal-only agents.

source scripts/tmux-config.sh
source scripts/bootstrap-cli.sh

# Changes needed vs interlateral_alpha wake-up-no-ag.sh:
#   - Add identity stamping
#   - Consistent naming with me.sh family
```

## 3D. Skills Integration — How Humans Use Them

### From the prompt (simplest)

The human includes a Skill reference in their prompt to either agent:

```
"Use the negotiation skill. CC takes the position that we should use PostgreSQL.
Codex takes the position that we should use SQLite. Reach consensus on the
database choice for our new microservice."
```

The agent reads `skills/negotiation/SKILL.md`, follows the protocol, and coordinates.

### From a slash command (if configured)

In Claude Code, Skills can be wired as slash commands via `.claude/settings.json`:

```
/peer-collaboration "Refactor the auth module together"
/dev-competition "Implement a rate limiter — blind dual-implementation"
/publication-pipeline "Write the API documentation"
```

### From the dev_plan (for autonomous sessions)

The human writes a dev plan referencing Skills:

```markdown
# Dev Plan

## Task 1: Auth Refactor
- **Skill:** dev-collaboration
- **Drafter:** CC
- **Reviewer:** Codex
- **Breaker:** CC (self-review after Codex feedback)
- **Artifact:** lib/auth.js

## Task 2: Database Decision
- **Skill:** negotiation
- **CC Position:** PostgreSQL for production readiness
- **Codex Position:** SQLite for simplicity
- **Output:** docs/adr/003-database-choice.md
```

## 3E. Incorporating Antigravity and Gemini CLI

### Antigravity (Google Gemini IDE)

**Requirements:** Antigravity installed, Chrome/Chromium available
**How it connects:** CDP (Chrome DevTools Protocol) on port 9222
**Control script:** `interlateral_dna/ag.js` (from interlateral_alpha, 9.9KB)

**To add AG to a running session:**
1. Launch Antigravity with `--remote-debugging-port=9222`
2. Run `node interlateral_dna/ag.js status` to verify connection
3. AG reads `ANTIGRAVITY.md` on boot and follows wake-up protocol
4. AG can send to CC via `node cc.js send`, to Codex via `node codex.js send`

**me-full.sh handles this automatically** via bootstrap-full.sh.

### Gemini CLI (Google Gemini Terminal)

**Requirements:** Gemini CLI installed (`gemini` command available)
**How it connects:** tmux send-keys (same as CC/Codex)
**Control script:** `interlateral_dna/gemini.js` (from interlateral_alpha, 11.3KB)

**Critical:** gemini.js has a mandatory 1-second delay for input buffer race conditions. Never use raw tmux send-keys for Gemini CLI.

**To add Gemini to a running session:**
1. Create tmux session: `tmux -S $SOCKET new-session -d -s interlateral-gemini`
2. Start Gemini in that session
3. Verify: `node interlateral_dna/gemini.js status`

**me-no-ag.sh or me-full.sh handles this automatically.**

## 3F. New Files Needed

### 1. `me.sh` (NEW — primary entrypoint)

**What:** Simplified dual-agent launcher based on platform_alpha's me.sh
**Why:** The current me.sh in platform_alpha works but doesn't know about Skills, identity stamping is relay-only, and it's tightly coupled to platform_alpha's session names.
**What's in it:**
- Source tmux-config.sh for socket path
- Kill existing sessions (if any)
- Create `interlateral-claude` and `interlateral-codex` sessions
- Set up pipe-pane telemetry capture
- Boot CC with CLAUDE.md-aware prompt (includes Skills awareness)
- Boot Codex with AGENTS.md-aware prompt
- Mutual ACK handshake
- Print "Ready to Rock!" on success
**Size:** ~80 lines

### 2. `scripts/bootstrap-dual.sh` (NEW)

**What:** Minimal bootstrap for me.sh — just 2 tmux sessions, no dashboard, no CDP
**Why:** bootstrap-full.sh is overkill for the simple CC+Codex case. Need a fast path.
**What's in it:**
- Source tmux-config.sh
- Create/verify tmux sessions for CC and Codex
- Set up identity stamping environment variables
- Optional: start courier if Codex is sandboxed
- Pipe-pane telemetry setup
**Size:** ~60 lines

### 3. `CLAUDE.md` (MERGE — significant rewrite needed)

**What:** Merged CC instructions from platform_alpha (GCP cost guard, identity stamping) + interlateral_alpha (wake-up protocol, Skills awareness, quad-agent mesh, Shared House Rule, Permission Granting)
**Why:** Current platform_alpha CLAUDE.md is only 24 lines (cost guard only). Current interlateral_alpha CLAUDE.md is 19.5KB (full mesh protocol). Need a version that works for the simple me.sh case AND scales to full mesh.
**Key changes:**
- Section 1: Core identity and boot protocol (always applies)
- Section 2: Skills awareness — how to read and follow SKILL.md files
- Section 3: Communication matrix (adapts to which agents are present)
- Section 4: GCP cost guard (from platform_alpha, conditional on GCP usage)
- Section 5: Observability and telemetry
- Section 6: Shared House Rule and Permission Granting
**Size:** ~25KB estimated

### 4. `interlateral_dna/identity.js` (EXTEND)

**What:** Extended identity stamping from platform_alpha, supporting all 4 agents
**Why:** platform_alpha's identity.js only supports relay stamping. Need per-agent identity.
**Changes:**
- Add `agent_type` field: cc, codex, ag, gemini, relay, human
- Add `session_name` field for tmux session identification
- Keep backward compatibility with existing `stampMessage()` API
- Add `INTERLATERAL_AGENT_TYPE` environment variable
**Size:** ~40 lines (up from 26)

### 5. `scripts/tmux-config.sh` (STANDARDIZE)

**What:** Single source of truth for tmux socket path and session names
**Why:** Different repos use different socket paths and session names. Need consistency.
**What's in it:**
```bash
export INTERLATERAL_TMUX_SOCKET="/tmp/interlateral-tmux.sock"
export CC_SESSION="interlateral-claude"
export CODEX_SESSION="interlateral-codex"
export GEMINI_SESSION="interlateral-gemini"
```
**Source:** Combine platform_alpha's approach with interlateral_alpha's naming
**Size:** ~20 lines

### 6. `me-full.sh` (ADAPT from interlateral_alpha/scripts/wake-up.sh)

**What:** Full mesh launcher
**Changes needed:**
- Rename from wake-up.sh to me-full.sh for consistency
- Add identity stamping initialization
- Source tmux-config.sh
- Keep all bootstrap-full.sh functionality
**Size:** ~120 lines

### 7. `me-no-ag.sh` (ADAPT from interlateral_alpha/scripts/wake-up-no-ag.sh)

**What:** CLI-only trio launcher
**Changes needed:** Same as me-full.sh (naming, identity, tmux-config)
**Size:** ~100 lines

## 3G. Migration Priority Order

### Phase 1: Get me.sh + Skills Working (Day 1)

1. Create the repo structure (directories only)
2. Copy `interlateral_dna/` from interlateral_alpha (most mature control scripts)
3. Add `identity.js` from platform_alpha, extend for multi-agent
4. Copy `skills/` from interlateral_alpha/.agent/skills/ (all 17)
5. Create symlinks: `.agent/skills`, `.claude/skills`, `.codex/skills` -> `skills/`
6. Write `scripts/tmux-config.sh` (new, ~20 lines)
7. Write `scripts/bootstrap-dual.sh` (new, ~60 lines)
8. Write `me.sh` (new, ~80 lines)
9. Write merged `CLAUDE.md` and `AGENTS.md`
10. Test: `./me.sh` boots CC + Codex, ACK handshake works, Skills are readable

### Phase 2: Add AG and Gemini CLI (Day 2)

11. Copy `scripts/bootstrap-full.sh` from interlateral_alpha, adapt
12. Copy `scripts/bootstrap-cli.sh` (renamed from bootstrap-full-no-ag.sh)
13. Write `me-full.sh` and `me-no-ag.sh`
14. Copy `ANTIGRAVITY.md` and `GEMINI.md` from interlateral_alpha
15. Copy `interlateral_comms_monitor/` from interlateral_alpha
16. Test: `./me-full.sh` boots all 4 agents + dashboard

### Phase 3: Add Observability and Evals (Day 3)

17. Copy `.observability/` structure
18. Copy `evals/` (renamed from corpbot_agent_evals)
19. Copy observability scripts: logged-claude.sh, rotate-logs.sh, discover-cc-logs.sh, etc.
20. Copy eval scripts: run-skill-eval.sh, export-skill-run.sh, run-test4.sh
21. Copy `scripts/preflight-wakeup.sh`
22. Test: Eval pipeline works end-to-end

### Phase 4: Add Conformance, Tests, Docs (Day 4)

23. Copy `tests/` from interlateral_alpha
24. Copy `docs/` from interlateral_alpha
25. Copy `ROADMAP.md`, `TROUBLESHOOTING.md`
26. Copy conformance-check.sh, validate-skills.sh
27. Verify all tests pass
28. Final review of all documentation

## 3H. Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │              HUMAN (Dazza)               │
                    │                                         │
                    │  ./me.sh          Simple: CC + Codex    │
                    │  ./me-no-ag.sh    CLI trio: +Gemini     │
                    │  ./me-full.sh     Full mesh: +AG +Dash  │
                    └────────────┬────────────────────────────┘
                                 │
                    ┌────────────▼────────────────────────────┐
                    │         skills/ (17 patterns)            │
                    │  "Use the dev-collaboration skill..."    │
                    │  "Use the negotiation skill..."          │
                    └────────────┬────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
    │    CC     │◄────────►│   Codex   │◄────────►│  Gemini   │
    │ (Claude)  │  tmux    │  (GPT)    │  tmux    │   CLI     │
    │           │  cc.js   │           │ codex.js │           │
    └─────┬─────┘  ◄──►   └─────┬─────┘  ◄──►   └───────────┘
          │                      │                 gemini.js
          │ CDP                  │ courier.js
          │ ag.js                │ (if sandboxed)
          │                      │
    ┌─────▼─────┐               │
    │    AG     │◄──────────────┘
    │ (Gemini   │  codex.js / courier
    │  IDE)     │
    └───────────┘

    Transport: tmux send-keys on /tmp/interlateral-tmux.sock
    AG only:   CDP puppeteer-core on port 9222
    Protocol:  Ledger (comms.md) + Whip (injection) = ALWAYS BOTH
    Identity:  [ID team=... sender=... host=... sid=... agent=...]
```

## 3I. What This Gives You

1. **`./me.sh`** — You and your agents are up in 5 seconds. Same simplicity as today.
2. **Skills in prompts** — "Use the negotiation skill" and agents know the protocol.
3. **AG when you want it** — `./me-full.sh` adds AG + Gemini + dashboard.
4. **Identity on every message** — Know exactly which agent said what, when, from where.
5. **17 collaboration patterns** — From simple peer work to constitutional voting.
6. **Evals after the fact** — Score any session with Lake Merritt LLM-as-judge.
7. **One repo** — No more hunting across 5 repos for the right version of ag.js.

---

*End of report.*
