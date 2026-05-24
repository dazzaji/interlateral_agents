# ROADMAP — Interlateral Agents

Current release target: **v0.2.0** (duo launcher + opt-in peer helpers + Skills + live comms + basic logs)

Default startup remains the two-agent Claude Code + Codex mesh. Gemini CLI,
Antigravity CLI, and Antigravity desktop control are opt-in peers, not default
bootstrap capacity.

## Delivered Since The v0.1 Baseline

### Antigravity Integration — DELIVERED (pending release tag, 2026-05-20)
Delivered:
- interlateral_dna/agy.js + `agy-cli-peer` skill — Antigravity CLI (`agy`) as a
  native mesh peer; the recommended opt-in Antigravity path
- scripts/launch-agy-peer.sh — peer launcher
- interlateral_dna/ag.js — Antigravity desktop-app CDP control (send / read /
  status / screenshot / watch); the fallback opt-in path
- ANTIGRAVITY.md — documents both transports

Default `init` / `me.sh` startup remains unchanged and does not include
Antigravity.

## Deferred / Excluded From v0.2.0

Everything below is intentionally excluded from the current release target.
Nothing has been dropped.

---

## 1. Architecture Normalization

### 1.1 session.js — Centralized Session Config
- Single source of truth for socket path, session names, team ID, ACK timeouts, launcher mode
- Replaces hardcoded values across control scripts and launchers
- Why deferred: hardcoded values work in v0.1 with one launcher

### 1.2 router.js — Centralized Command Dispatch
- Unified send/status/read for all agents
- Target registry, fallback order, unified logging
- Why deferred: individual control scripts work when called directly

### 1.3 docs/ARCHITECTURE.md
- Canonical architecture document (five-plane model: control, comms, skills, artifacts, review)
- Why deferred: you understand the system; this matters when others need to

### 1.4 docs/EVENT_SCHEMA.md
- Canonical event format for structured logging
- Fields: ts, session_id, correlation_id, launcher_mode, team_id, event_type, source, target, agent_type, session_name, status, skill_name, artifact_path, payload
- Event types: session/agent lifecycle, message sent/received, skill lifecycle, operational state (blocked, degraded, timeout, failed), approval workflow (requested, granted, denied)
- Why deferred: comms.md is the v0.1 log

### 1.5 Direct-Send Readiness Guards
- Move `cc.js`, `codex.js`, and `gemini.js` toward explicit readiness fields
  and fail-closed default sends, with a deliberate `--force` override
- Preserve current operator escape hatches while preventing large prompts from
  being pasted into stale panes such as shells, editors, pagers, or crashed TUIs
- Why deferred: this changes long-standing direct-send behavior and needs a
  focused compatibility pass across the existing Claude+Codex mesh before it is
  safe for current users

### 1.6 docs/ARTIFACT_MODEL.md
- First-class artifact model: typed, indexed, attributable outputs
- Session packages at .observability/sessions/<session-id>/
- Link-not-copy, retention policy, export-to-archive
- Why deferred: add when you want structured reviewability

---

## 2. Mesh Expansion

### 2.1 Mesh Launchers
- mesh-no-ag.sh (CC + Codex + Gemini CLI)
- mesh.sh (full quad with AG)
- preflight-mesh.sh (formal mode with eval hooks)
- bootstrap-full.sh and bootstrap-cli.sh
- Why deferred: peer helpers cover manual expansion for now, and Gemini/AG
  should remain special opt-in peers until Principal Human explicitly wants wider default
  mesh launchers

### 2.2 Worker-Pool Normalization
- Standardize peer-pool conventions across Codex and Gemini
- Consistent naming, status reporting, pool health
- Why deferred: basic peer helpers are sufficient at small scale

---

## 3. Skills Infrastructure

### 3.0 Deferred Skills (removed from v0.1 catalog)

The following reusable skills were removed from the v0.1 catalog and are deferred until their supporting infrastructure ships. Each entry lists:
- a **restoration target path** for where the skill will live in this repo when restored
- a **donor source path** for where the source material exists today

- **create-skin** — dashboard skin generation (depends on comms monitor / skins system, see 4.3)
  - Restoration target path (future in-repo location, not present until restored): `.agent/skills/create-skin/SKILL.md`
  - Donor source: deferred upstream skill source
  - Restored only when dashboard / skin infrastructure is back in scope

- **evals** — eval and trace tooling (depends on Lake Merritt eval system, see 5.1)
  - Restoration target path (future in-repo location, not present until restored): `.agent/skills/evals/SKILL.md`
  - Donor source: deferred upstream skill source
  - Restored only when traces, eval packs, and supporting scripts are back in scope

- **hyperdomo** — advanced manager-agent orchestration (depends on router.js, session.js, skills registry, see 6.1)
  - Restoration target path (future in-repo location, not present until restored): `.agent/skills/hyperdomo/SKILL.md`
  - Donor source: deferred upstream skill source
  - Restored only when manager/worker orchestration infrastructure is back in scope

`test-4-series` is intentionally not listed here as a deferred reusable skill. It was a one-off project/test skill and is considered complete rather than something to restore into the standing v0.1 catalog.

### 3.1 Machine-Readable Skills Registry
- .agent/skills/registry.json generated from SKILL.md files
- Fields: name, description, roles, expected outputs, launcher compatibility
- Why deferred: SKILLS.md is the v0.1 index

### 3.2 Skills Cleanup Pass
- Remove stale path references in existing Skills
- Standardize role names and termination conventions
- Why deferred: Skills work as-is

### 3.3 Skill Composability and Lifecycle
- Chain Skills in sequence
- Skill invocations as first-class events with metadata
- Instrumentation: agent self-reporting -> router-mediated -> wrapper-based
- /skills command UX
- Why deferred: depends on event stream and registry

### 3.4 SKILLS_DEV_GUIDE.md
- How to author new Skills
- Promotion workflow: draft -> test -> canonical
- Why deferred: using existing Skills first, not writing new ones

### 3.5 Advanced Skills Validation
- scripts/validate-skills.sh (lint SKILL.md files)
- Why deferred: Skills work as-is

---

## 4. Observability and Review

### 4.1 Structured Event Stream
- .observability/events.jsonl as append-only canonical substrate
- comms.md becomes a derived view
- Depends on: EVENT_SCHEMA.md

### 4.2 Lightweight Duo-Mode Live View
- scripts/watch-session.sh (polling wrapper: comms.md tail, agent status, new files)
- Why deferred: tmux panes + comms.md suffice for now

### 4.3 Comms Monitor Dashboard
- interlateral_comms_monitor/ (Express + WebSocket + React)
- Hot-swappable skins, real-time streaming, direct injection, export
- Why deferred: not needed until running 3+ agents regularly

### 4.4 OTEL Traces and Telemetry Pipeline
- OpenTelemetry, trace extraction, log rotation, asciinema recordings
- discover-cc-logs.sh, rotate-logs.sh, harvest-native-logs.sh
- Why deferred: basic comms.md logging is enough for v0.1

### 4.5 Session Artifact Packages
- .observability/sessions/<session-id>/ with manifest, report, decisions, links
- Session report generation at session end
- scripts/export-session.sh for portable archives
- Depends on: ARTIFACT_MODEL.md, event stream

### 4.6 Runtime Log Retention and Cleanup
- Move per-session pipe-pane logs out of `interlateral_dna/` into an ignored
  run-scoped runtime directory such as `.runtime/runs/<run-id>/`
- Add `scripts/rotate-logs.sh` or equivalent retention cleanup for large local
  logs, with a clear default retention policy
- Document log privacy and cleanup in `TROUBLESHOOTING.md`
- Why deferred: current logs are ignored but can grow large (local audits saw
  about 1GB under `interlateral_dna/`); the retention policy needs a deliberate
  owner decision before implementation

---

## 5. Evals and Quality

### 5.1 Lake Merritt Eval System
- evals/ directory with LLM-as-judge, 7 eval packs
- run-skill-eval.sh, export-skill-run.sh, run-test4.sh
- EVALS_GUIDE.md, preflight-wakeup.sh
- Why deferred: a whole subsystem unto itself

### 5.2 Conformance System
- INTERNALS_CONFORMANCE.md (~150KB spec)
- conformance-check.sh, INTERNALS_GUIDE.md
- Why deferred: heavy documentation infrastructure

### 5.3 Automated Test Suite
- Python pytest: wake-up, capture, cleanup, wrapper tests
- CI integration
- Why deferred: manual testing is sufficient at v0.1 scale

---

## 6. Orchestration and Pools

### 6.1 HyperDomo Manager-Agent Orchestration
- Manager agent loads Skills, wakes workers, checkpoints, reports
- Depends on: router.js, session.js, Skills registry

### 6.2 Permission Granting Protocol
- Peer agents approve stuck prompts
- Permission state events in event stream
- Depends on: event stream, approval events

### 6.3 Shared House Rule and Governance
- File access governance across agents
- Enforcement and logging

### 6.4 Fresh Session Markers
- # === NEW SESSION === markers in comms.md
- Automatic archiving of prior sessions
- Session naming conventions

---

## 7. AG and Browser-Based Agents

### 7.1 AG Telemetry and Observation
- ag.js already includes basic `watch` and `screenshot`; a structured
  telemetry/observation layer (dashboards, event stream) remains deferred
- Why deferred: depends on the structured event stream (section 6)

### 7.2 Full Quad-Agent Bootstrap
- AG in bootstrap-full.sh, health checks, graceful degradation
- Keep deferred unless Principal Human explicitly decides AG should become standard
  startup capacity.

---

## 8. Explicitly Out-of-Scope Product/Platform Features

These are NOT part of this repo unless strategy changes:

- REST API server (api-server.js)
- Database (LowDB, PostgreSQL)
- Auth / registration / onboarding
- GCP infrastructure (Cloud SQL, MIG, LB)
- Admin console UI
- Event modules (debate, voting, rounds)
- Simulation runners
- GCP cost guard and ops runbooks

These stay in the separate platform repo.

---

## Provenance

Capabilities consolidated from five source repos:

| Source Repo | Role |
|---|---|
| Platform prototype | Duo launcher kernel, identity.js, peer helpers, tmux ergonomics |
| Historical prototype | Historical AG/CDP reference, dashboard lineage |
| Design-pattern workshop | Skills workshop, conformance spec source |
| Upstream distribution template | Quad-agent distribution template, evals, Skills catalog |
| Mature reference implementation | Primary base for v0.1 consolidation |

Novel additions from reconciliation: router.js, session.js, event schema, artifact model, five-plane framework, registry.json, watch-session.sh, launch-gemini-peer.sh, approval workflow events.

Nothing from any source or reconciliation has been dropped.
