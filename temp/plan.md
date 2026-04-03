# Interlateral Agents v0.1 — Build Plan

**Date:** 2026-04-02
**Target repo:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents`
**Source of truth:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/reconciliation.md` — section `# BEST AND FINAL 0.1 VERSION FOLLOWS`

---

## 1. What's better in Codex's prompt vs mine

Codex's prompt had several improvements over my initial version:

- **Explicit priority ordering.** Codex sequences the build (me.sh first, then DNA, then peers, then Skills, then docs, then shutdown, then verify). My prompt said "execute step by step" but Codex makes the priority explicit. Better for a fresh agent that needs to know what to do first.
- **"Do not commit unless I explicitly ask."** I missed this guardrail. Important.
- **"Before editing, read only the source-of-truth section and the donor files actually needed for the current step."** Prevents context bloat in the fresh agent. Smart.
- **Explicit negative scope list by name.** Codex lists every deferred item (AG, mesh launchers, dashboard, router.js, etc.) so the builder can't accidentally pull them in. More bulletproof than my generic "do not add files not listed in the spec."
- **"Send me a concise build report with blockers."** Good explicit deliverable.
- **Claude's reviewer prompt is tighter.** Codex scopes it to specific duties: scope protection, docs clarity, Skills usability, donor-file checking, drift catching. Mine just said "review the result."

My prompt had one thing Codex's didn't: **"If something is ambiguous, flag it and keep moving."** Useful for velocity. Incorporated below.

The best-and-final prompts below merge both, keeping Codex's structural discipline and my velocity clause.

---

## 2. BEST AND FINAL PROMPT — for ipa-codex (lead builder)

```
Build Interlateral Agents v0.1 in:

/Users/dazzagreenwood/Documents/GitHub/interlateral_agents

Your complete build spec is in:

/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/reconciliation.md

Read ONLY the section titled:

# BEST AND FINAL 0.1 VERSION FOLLOWS

That section is authoritative. It contains the file structure, a 14-step build plan with exact source paths and cp commands, a donor map showing which repo/file each v0.1 file starts from, and what adaptations are needed. Do not read any section above it.

Your job:
- Implement the v0.1 repo end-to-end
- Stay strictly within the HAS / DOES NOT HAVE boundaries
- Use the PROPOSED FILE STRUCTURE, BUILD PLAN, ROADMAP.md content, and SOURCE-OF-TRUTH DONOR MAP
- Use live comms with ipa-claude as a parallel reviewer and scope/doc auditor
- Assign Claude bounded review tasks; avoid duplicate edits; keep one owner per file
- Build end-to-end: create/adapt files, verify the core workflow, and report what was built and what remains
- If something is ambiguous, flag it and keep moving

Do NOT:
- Implement roadmap items
- Bring in AG, ag.js, ANTIGRAVITY.md, CDP, puppeteer
- Bring in mesh launchers (mesh.sh, mesh-no-ag.sh, preflight-mesh.sh)
- Bring in router.js, session.js
- Bring in the dashboard / interlateral_comms_monitor
- Bring in structured event stream, event schema implementation, artifact/session packages
- Bring in evals, Lake Merritt, OTEL, traces, casts, telemetry pipeline
- Bring in HyperDomo, courier fallback, conformance system, test suite
- Bring in any product/platform code from interlateral_platform_alpha
- Commit unless Dazza explicitly asks

Priority order:
1. me.sh and scripts/tmux-config.sh foundation
2. Comms DNA: cc.js, codex.js, gemini.js, identity.js, leadership.json, LIVE_COMMS.md, comms.md
3. Peer launch helpers: launch-codex-peer.sh, send-codex-peer.sh, launch-cc-peer.sh, launch-gemini-peer.sh
4. Canonical Skills (.agent/skills/) plus deployed copies (.claude/skills/, .codex/skills/) plus deploy-skills.sh
5. Minimal docs: README.md, CLAUDE.md, AGENTS.md, GEMINI.md, TROUBLESHOOTING.md, SKILLS.md
6. ROADMAP.md, .gitignore, .env.example
7. scripts/shutdown.sh
8. Verify: test the duo path (me.sh) and at least one peer-launch path

Before editing each step, read only the source-of-truth section and the specific donor files needed for that step.

When done, send Dazza a concise build report listing: what was built, what was adapted vs copied vs written new, any blockers or ambiguities flagged, and what to test.
```

---

## 3. BEST AND FINAL PROMPT — for ipa-claude (secondary reviewer)

```
You are the secondary reviewer for the Interlateral Agents v0.1 build in:

/Users/dazzagreenwood/Documents/GitHub/interlateral_agents

The source of truth is the section:

# BEST AND FINAL 0.1 VERSION FOLLOWS

in:

/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/temp/reconciliation.md

Do not lead the build. Do not start broad independent implementation. Wait for tasks from ipa-codex over live comms. Your role is:
- Scope protection: flag anything that drifts outside HAS / DOES NOT HAVE
- Docs clarity: review CLAUDE.md, AGENTS.md, GEMINI.md, README.md for accuracy and simplicity
- Skills usability: verify Skills are readable and invocable after deploy-skills.sh runs
- Donor-file sanity: spot-check that adapted files match the donor map's intent
- Drift catching: if Codex pulls in roadmap items or adds unlisted files, flag it
- Concise review feedback and suggested fixes when asked

Do not duplicate Codex's work. Do not edit files Codex is actively working on. If you have no pending review task, wait.
```

---

## 4. BEST AND FINAL GENERAL PLAN

### Who does what

| Role | Agent | Job |
|------|-------|-----|
| **Lead builder** | ipa-codex | Implements all v0.1 files following the build plan. Owns edits. |
| **Reviewer** | ipa-claude | Reviews on request. Catches scope drift, checks docs/Skills. Does not lead edits. |
| **Supervisor** | Dazza | Boots agents, sends prompts, monitors, tests result, decides when to commit. |

### Execution sequence

1. **Boot fresh agents.** From `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents`, start a fresh me.sh pair. If me.sh doesn't exist yet in this repo, boot from `interlateral_platform_alpha`'s me.sh temporarily or start two agents manually in tmux targeting this repo as working directory.

2. **Send prompts.** Send the ipa-codex prompt to the Codex session. Send the ipa-claude prompt to the Claude session.

3. **Codex builds.** Codex reads the build spec, executes steps 1-14 in priority order, adapts donor files per the donor map, and assigns bounded review tasks to Claude as needed.

4. **Claude reviews.** Claude reviews files when asked by Codex, flags drift, checks docs and Skills usability. Does not lead.

5. **Codex reports.** When done, Codex sends a build report: what was built, what was adapted/copied/new, blockers, and what to test.

6. **Dazza tests.** Run these checks:
   - `./me.sh` — two agents boot, ACK, "Ready to Rock!"
   - `scripts/launch-codex-peer.sh` — a peer Codex session starts on the shared socket
   - `comms.md` — shows messages with identity stamps from multiple agents
   - An agent can read `.claude/skills/dev-collaboration/SKILL.md`
   - `scripts/shutdown.sh` — kills all sessions cleanly

7. **Commit when satisfied.** Dazza decides when to commit. Agents do not commit on their own.

### What success looks like

A working repo at `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents` where:
- One command (`./me.sh`) boots a Claude + Codex duo with ACK handshake
- Peer helpers let you add more agents on demand
- 17 Skills are present and readable by agents
- Direct live comms work via tmux injection with identity stamping
- `comms.md` is the running human-readable session record
- Everything else is in `ROADMAP.md`, nothing dropped
- The repo is clean, minimal, and ready to use today
