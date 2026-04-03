# Reconciliation

## ipa-claude

### same and different

**Where we agree (same):**

1. **Base repo choice.** Both of us independently concluded that `interlateral_alpha` is the best full-mesh donor repo and that `interlateral_platform_alpha` is the best source for the simple duo launcher (`me.sh`). This convergence is significant — it was not a given, and it means the recommendation is robust.

2. **Architecture: keep me.sh simple, add mesh launchers separately.** Both reports propose keeping `me.sh` as a fast CC+Codex-only entrypoint and adding separate scripts for the full mesh. We both recognize that overloading one launcher destroys the simplicity that makes the duo flow valuable.

3. **Import identity.js from platform_alpha.** Both reports identify identity stamping as the one unique capability from `platform_alpha` that the mesh repos lack and that should be merged in.

4. **Skills from interlateral_alpha.** Both agree the 16-17 skill catalog from `interlateral_alpha` (or `alpha-upstream`) is the right canonical set, with `design_pattern_factory` serving as a reference for the foundational 4.

5. **Repo role taxonomy.** Both reports correctly characterize:
   - `platform_alpha` = product repo with best launcher kernel
   - `alphasa_uiax` = historical CC+AG prototype
   - `design_pattern_factory` = skills workshop/forge
   - `alpha-upstream` = distribution template
   - `interlateral_alpha` = most mature reference implementation

6. **Ledger + Whip as canonical pattern.** Both reports emphasize that comms.md alone is passive and useless without active injection.

7. **Courier as fallback, not primary.** Both note that the documentation across repos is inconsistent about whether courier is primary or fallback for Codex, and both recommend normalizing to direct-first, courier-fallback.

8. **Dashboard, evals, and observability from interlateral_alpha.** Both agree these should carry over wholesale.

**Where we differ (different):**

1. **Launcher naming.** I proposed `me.sh`, `me-full.sh`, `me-no-ag.sh` (me-family). Codex proposed `me.sh`, `mesh.sh`, `mesh-no-ag.sh`, `preflight-mesh.sh` (me + mesh family). Codex's naming is better — it creates a clear semantic distinction between the duo fast path (`me`) and the mesh experience (`mesh`), rather than overloading the `me` prefix with modifiers.

2. **New architectural files.** Codex proposes two new DNA-level files I did not: `router.js` (centralized send/status/read dispatch across all agents) and `session.js` (centralized config for socket paths, session names, team IDs, ACK timeouts, launcher mode). I proposed `bootstrap-dual.sh` as a new script but did not propose new DNA-level abstractions. Codex's `router.js` and `session.js` are genuinely valuable — they address real duplication across cc.js/codex.js/gemini.js/ag.js and the scattered hardcoded session names.

3. **Skills directory placement.** I proposed moving skills to a top-level `skills/` directory with symlinks from `.agent/skills/`, `.claude/skills/`, `.codex/skills/`. Codex keeps them in `.agent/skills/` as canonical. My approach gives skills more visibility to the human; Codex's preserves the established convention. This is a real tradeoff — visibility vs convention.

4. **Worker pool helpers.** Codex specifically calls out `launch-codex-peer.sh`, `send-codex-peer.sh`, and proposes a new `launch-gemini-peer.sh` for multi-instance worker pools. I did not surface this capability at all. This is a genuine gap in my report — the worker-pool ergonomics from `platform_alpha` are important for scaling beyond single-instance agents.

5. **docs/ARCHITECTURE.md.** Codex proposes a new canonical architecture document. I did not. This is a good idea — the current repos rely on layered README drift.

6. **Depth of capabilities enumeration.** Codex enumerates 21 distinct agent-to-agent capabilities in a narrative format with per-repo differences explained in prose. I used a matrix/table format with YES/NO cells. The approaches are complementary — my tables give quick lookup, Codex's prose gives nuance (e.g., explaining that `platform_alpha` has the best tmux helper set for send, long-prompt paste, pane capture, and idle detection — a detail my tables miss).

7. **tmux-config.sh merge specificity.** Codex identifies specific helpers from `platform_alpha/scripts/tmux-config.sh` worth preserving: `agent_send`, `codex_send_clean`, long-prompt paste support, pane capture helpers, and idle detection. I mentioned tmux-config.sh as needing standardization but didn't enumerate these specific helpers. Codex is more thorough here.

8. **Phased migration plan.** I proposed a 4-phase day-by-day migration. Codex proposed a 9-step practical build order. Codex's is more actionable because it's sequenced by dependency rather than arbitrary day boundaries.

9. **Treatment of alphasa_uiax AG auxiliary scripts.** I noted the 10 auxiliary AG scripts (ag_probe, ag_deep, etc.) as a distinguishing feature. Codex does not mention them. Neither of us proposes carrying them forward, which is correct — they're debugging artifacts.

10. **Platform_alpha multi-instance Codex tooling.** Codex specifically identifies `launch-codex-peer.sh` and `send-codex-peer.sh` as practical helpers worth importing. I missed these entirely. This is a meaningful gap in my analysis — multi-instance agent pools are how this scales.

### comparative assessment

**Codex's report is better in several important ways:**

1. **Architectural proposals.** `router.js` and `session.js` are genuine improvements over the status quo. They address real pain points (duplicated logic, scattered config) that I described but did not solve. This is the kind of thinking that separates a report from a plan.

2. **Launcher naming.** `mesh.sh` vs `me-full.sh` is clearly better. The semantic distinction between "me" (duo, fast, simple) and "mesh" (multi-agent, full system) is more intuitive than "me" vs "me-full" vs "me-no-ag."

3. **Worker pool awareness.** Codex identified the multi-instance Codex peer helpers from `platform_alpha` and proposed extending them to Gemini CLI. This is a capability I completely missed, and it matters for real-world scaling.

4. **tmux-config.sh specificity.** Naming the exact helpers worth preserving (`agent_send`, `codex_send_clean`, etc.) is more actionable than my generic "standardize the socket config."

5. **Capabilities prose format.** The 21-item narrative with per-repo differences gives more actionable detail than my table format alone. The tables are useful for quick reference, but the prose captures nuances that YES/NO cells cannot.

**My report is better in several ways:**

1. **Structured tables.** The capabilities matrices provide at-a-glance comparison that Codex's narrative format lacks. For a human scanning across 5 repos, tables are faster.

2. **Skills inventory table.** I enumerated every skill by name, type, and which repos have it. Codex describes the skills system but doesn't provide this cross-repo inventory.

3. **File-level source annotations.** My proposed file structure annotates every file with its source repo and specific changes needed. Codex does this too but in a separate "Source File Map" section rather than inline.

4. **Architecture diagram.** I included an ASCII architecture diagram showing agent relationships and transport types. Codex did not visualize the architecture.

5. **Skills integration section.** I explicitly described three ways humans invoke skills (prompt, slash command, dev_plan). Codex mentions Skills as a runtime layer but doesn't spell out the human UX patterns as concretely.

**Overall:** Codex's report is stronger on architectural proposals and operational detail. Mine is stronger on structured presentation and Skills UX. The ideal final document combines both.

### best-and-final response

**Base:** `interlateral_alpha` as the repo shape.

**Launcher family:**

| Script | Mode | Source |
|--------|------|--------|
| `me.sh` | CC + Codex duo, fast, <5s | platform_alpha/me.sh, adapted |
| `mesh.sh` | Full quad-agent + dashboard | interlateral_alpha/scripts/wake-up.sh, wrapped |
| `mesh-no-ag.sh` | CC + Codex + Gemini CLI | interlateral_alpha/scripts/wake-up-no-ag.sh, wrapped |
| `preflight-mesh.sh` | Full mesh + evals/traces | interlateral_alpha/scripts/preflight-wakeup.sh, wrapped |

(Adopting Codex's naming scheme — it's better.)

**DNA layer — new architecture:**

| File | Source | Status |
|------|--------|--------|
| `cc.js` | interlateral_alpha | Add identity stamping |
| `codex.js` | interlateral_alpha | Add identity stamping |
| `ag.js` | interlateral_alpha | No changes |
| `gemini.js` | interlateral_alpha | No changes |
| `courier.js` | interlateral_alpha | No changes |
| `identity.js` | platform_alpha | Extend for all 4 agents |
| `router.js` | **NEW** (Codex's proposal) | Centralized send/status/read dispatch |
| `session.js` | **NEW** (Codex's proposal) | Centralized config: socket, sessions, team, mode |
| `leadership.json` | interlateral_alpha | No changes |
| `LIVE_COMMS.md` | Merge: platform_alpha clarity + interlateral_alpha breadth | Normalize direct-first, courier-fallback |

**Skills:** Keep in `.agent/skills/` (canonical, per Codex's convention-preserving approach) with deploy copies to `.claude/skills/` and `.codex/skills/`. But add a top-level `SKILLS.md` index that is comprehensive and human-friendly (per my proposal). Carry all 17 skills from `interlateral_alpha`.

**Worker pool helpers (from Codex, which I missed):**

| Script | Source |
|--------|--------|
| `launch-codex-peer.sh` | platform_alpha |
| `send-codex-peer.sh` | platform_alpha |
| `launch-gemini-peer.sh` | **NEW** (based on Gemini bootstrap logic) |

**tmux-config.sh:** Merge from both repos. Keep platform_alpha's `agent_send`, `codex_send_clean`, long-prompt paste, pane capture, idle detection. Keep interlateral_alpha's explicit shared socket model. This is a critical merge.

**Documentation:**

| Document | Source |
|----------|--------|
| `docs/ARCHITECTURE.md` | **NEW** (Codex's proposal) — single canonical architecture overview |
| `CLAUDE.md` | Merge: platform_alpha cost guard + interlateral_alpha full protocol + Skills awareness |
| `AGENTS.md` | interlateral_alpha, normalize direct-first comms |
| `ANTIGRAVITY.md` | interlateral_alpha |
| `GEMINI.md` | interlateral_alpha |
| `SKILLS.md` | interlateral_alpha, clean stale paths |
| `ROADMAP.md` | interlateral_alpha |
| `TROUBLESHOOTING.md` | interlateral_alpha |

**Evals:** Rename `corpbot_agent_evals/` to `evals/` (per my proposal — cleaner). Keep Lake Merritt and all 7 eval packs.

**Dashboard:** `interlateral_comms_monitor/` from interlateral_alpha wholesale.

**Observability:** `.observability/` from interlateral_alpha with casts, traces, evals, logs, events.jsonl, SESSIONS.

**Build order** (adopting Codex's dependency-sequenced approach):

1. Copy `interlateral_alpha` as base
2. Import `me.sh`, `identity.js`, `launch-codex-peer.sh`, `send-codex-peer.sh` from platform_alpha
3. Merge `scripts/tmux-config.sh` from both repos
4. Normalize cc.js, codex.js, gemini.js, LIVE_COMMS.md around direct-first comms
5. Add identity stamping to all control scripts
6. Create `router.js` and `session.js` (new DNA-level files)
7. Create `mesh.sh` and `preflight-mesh.sh` root launchers
8. Create `launch-gemini-peer.sh`
9. Clean Skills: remove stale paths, standardize role names, normalize courier references
10. Create `docs/ARCHITECTURE.md`
11. Rename `corpbot_agent_evals/` to `evals/`
12. Run test suite, verify all launch modes work

### change log

| Change | From (my prior report) | To (best-and-final) | Why |
|--------|----------------------|---------------------|-----|
| Launcher naming | `me.sh`, `me-full.sh`, `me-no-ag.sh` | `me.sh`, `mesh.sh`, `mesh-no-ag.sh`, `preflight-mesh.sh` | Codex's naming creates clearer semantic distinction between duo and mesh |
| New DNA files | None proposed | `router.js`, `session.js` | Codex identified real duplication/config-scatter problems I described but didn't solve |
| Worker pool helpers | Not mentioned | `launch-codex-peer.sh`, `send-codex-peer.sh`, `launch-gemini-peer.sh` | I missed multi-instance worker tooling from platform_alpha entirely |
| Skills directory | Top-level `skills/` with symlinks | Keep `.agent/skills/` as canonical per convention | Convention preservation is more important than visibility; SKILLS.md index handles discoverability |
| `docs/ARCHITECTURE.md` | Not proposed | Added as new file | Codex correctly identified that layered README drift needs a single canonical architecture doc |
| `tmux-config.sh` | Generic "standardize" | Specific merge: `agent_send`, `codex_send_clean`, paste, capture, idle from platform_alpha + shared socket from alpha | Codex enumerated the exact helpers worth preserving |
| Build order | 4 phases by day | 12 steps by dependency | Dependency sequencing is more actionable than arbitrary day boundaries |
| Capabilities format | Tables only | Tables + prose narrative | Both formats serve different needs; tables for scanning, prose for nuance |

### key observations and deep insights

**1. The entry ramp is everything.**

The single most important design decision in this system is the gradient from "I just want two agents talking" to "I need a four-agent mesh with evals and a live dashboard." The current ecosystem accidentally solves this by having different repos for different complexity levels. The final repo must solve it intentionally with different launchers (`me.sh` -> `mesh.sh` -> `preflight-mesh.sh`) that share the same DNA layer but expose increasing capability.

The entry mode must be absurdly simple. `./me.sh` should require zero configuration, zero dependencies beyond Node.js and tmux, and produce two agents talking to each other in under 5 seconds. This is the hook. If the entry experience is painful or confusing, nobody scales up to the mesh.

**2. Skills are the killer feature for a general audience.**

Most multi-agent systems give you agents that can talk. This system gives you agents that know *how* to collaborate. The difference is Skills — reusable protocols that define roles, sequences, timeouts, delivery mechanisms, and termination criteria. A human who writes "Use the dev-collaboration skill, CC is Drafter, Codex is Reviewer+Breaker" gets a structured workflow without needing to understand the underlying comms infrastructure.

For a general audience, Skills need three things they don't fully have yet:
- **A catalog UX**: A human should be able to type `/skills` and see what's available with one-line descriptions.
- **Composability**: Skills should be chainable. "First use negotiation to decide the approach, then use dev-collaboration to build it" should just work.
- **Outcome logging**: Each Skill run should produce a structured artifact (not just comms.md entries) that captures what happened, what was decided, and what was produced. This is the bridge to after-the-fact reviewability.

**3. The human needs a live window, not just logs.**

The Comms Monitor dashboard exists but it's optional and only available in mesh mode. For a general audience, the human needs real-time visibility into what agents are doing even in the simple duo mode. This doesn't require the full dashboard — it could be as simple as a `tail -f` on a structured log that both agents write to. But the human should never feel like they launched agents into a void.

Three tiers of human visibility, matching the launcher gradient:
- **me.sh (duo)**: `tmux capture-pane` visibility + structured comms.md + optional `tail -f` watcher
- **mesh.sh (quad)**: Comms Monitor dashboard with real-time WebSocket streaming
- **preflight-mesh.sh (formal)**: Dashboard + OTEL traces + post-session eval reports

**4. After-the-fact reviewability is undersolved.**

The current system has raw ingredients for post-session review (asciinema casts, telemetry logs, OTEL traces, eval reports) but no unified "session report" that a human can read after the fact. Imagine coming back from lunch and wanting to know: What did my agents do? What decisions were made? What artifacts were produced? What went wrong?

The final repo should produce a `SESSION_REPORT.md` (or equivalent) at session end that includes:
- Which agents participated and for how long
- Which Skills were invoked and their outcomes
- Key decisions and artifacts produced
- Any errors, timeouts, or deadlocks encountered
- Links to full traces and recordings for deep dives

This is where the eval system and the observability system need to converge. Lake Merritt scores individual aspects; what's missing is a synthesis layer that turns scored traces into a human-readable narrative.

**5. Agent outputs and work artifacts need first-class treatment.**

Right now, agent work products live wherever the agents put them — in the repo, in comms.md, in project directories. For a general audience, there should be a clear convention:
- `projects/<project-name>/` is where deliverables go
- Each Skill run that produces artifacts should place them in a known location
- The session report should index all artifacts produced

The `mesh-hello-world` example project in `interlateral_alpha` is a good start. But the convention needs to be enforced in Skills (e.g., the dev-collaboration Skill should specify where the Drafter's artifact goes and where the Reviewer's comments go).

**6. router.js is the right abstraction at the right time.**

Codex's proposal for `router.js` (centralized send/status/read dispatch) solves a real problem: the current system has four separate control scripts (cc.js, codex.js, ag.js, gemini.js) with duplicated logic for logging, stamping, error handling, and fallback. A router doesn't replace these scripts — it wraps them with a unified interface:

```
node interlateral_dna/router.js send codex "Your message"
node interlateral_dna/router.js status all
node interlateral_dna/router.js read gemini
```

This also creates a natural hook for features like: message queuing when an agent is busy, retry logic, broadcast-to-all, and structured logging. The router becomes the single point where all agent communication passes through, which makes observability and debugging dramatically simpler.

**7. The scaling path goes: duo -> trio -> quad -> pool -> orchestrated pool.**

The current system tops out at quad-agent mesh with occasional worker-pool helpers. The natural next step is HyperDomo-style orchestration where a manager agent can dynamically spin up worker agents, assign them Skills, collect results, and produce consolidated outputs. The pieces exist (HyperDomo skill, `launch-codex-peer.sh`) but they're not yet a coherent workflow.

For a truly general audience, the scaling path should be:
1. **Duo** (`me.sh`): Two agents, one conversation, simple tasks
2. **Trio/Quad** (`mesh.sh`): Multiple agents with specialized roles, medium complexity
3. **Pool** (worker helpers): Multiple instances of the same agent type for parallel work
4. **Orchestrated Pool** (HyperDomo): A manager agent running Skills as sub-workflows with worker agents

Each level should feel like a natural extension of the previous one, not a completely different system. The DNA layer (`router.js`, `session.js`, control scripts) should be the same across all levels. Only the launcher and the Skills change.

**8. Logging should be structured from the start, not retrofitted.**

The current system has multiple logging formats: comms.md (markdown), ag_log.md (markdown), telemetry logs (JSON lines), OTEL traces (JSON), asciinema casts (binary). For a general audience, there should be one structured event log (JSON lines) that everything writes to and that all tools read from. The dashboard, eval system, session report generator, and human `tail -f` should all consume the same stream.

This doesn't mean eliminating the other formats — comms.md is valuable as a human-readable audit trail, asciinema is valuable for visual replay. But the structured event log should be the source of truth, and the other formats should be derived from it or supplementary to it.

**9. The real competitive advantage is "agents that know how to collaborate."**

Most multi-agent frameworks focus on the plumbing (how agents talk). Interlateral's unique contribution is the protocol layer (how agents collaborate). Skills aren't just templates — they're tested, evaluated, and refined collaboration protocols that encode hard-won lessons about what works when AI agents try to work together. The dev-collaboration Drafter/Reviewer/Breaker pattern, the blind dual-implementation in dev-competition, the formal voting in constitutional — these are genuine innovations in multi-agent coordination.

For a general audience, this should be the headline: "Your agents don't just talk to each other — they know *how* to work together." The entry point is the simple duo. The long game is a library of collaboration protocols that grows over time, contributed by the community, evaluated by the eval system, and continuously refined.

**10. The final repo should be named for what it is: the agent layer.**

Both reports implicitly treat the final repo as an "agent control" or "multi-agent" repo, distinct from the platform product repo. This separation is correct and important. The final repo (`interlateral_agents`) is the universal agent coordination layer. It can be used standalone (for any project) or alongside the platform repo (for Interlateral-specific events). It should not carry product-specific code (API server, event modules, GCP infrastructure) — those stay in `interlateral_platform_alpha`.



## ipa-codex

### same and different

Claude's content and my prior content converge on the main architectural answer, which is a good sign because the repos are messy enough that false convergence would have been easy. We both landed on `interlateral_alpha` as the best full-mesh donor and `interlateral_platform_alpha` as the best source for the simple launcher kernel. We both also independently separated the repos into roughly the same roles: `interlateral_platform_alpha` as the product repo with the best current duo launcher, `interlateral_prototype_alphasa_uiax` as the historical CC+AG precursor, `interlateral_design_pattern_factory` as the Skills workshop, `interlateral_alpha-upstream` as the broad upstream template, and `interlateral_alpha` as the most mature full-mesh reference.

We also agree on the most important comms conclusion: the final system should be direct-first, not file-first. In both our reports, the real system is live injection plus logging, not logging alone. We both call out the "ledger + whip" pattern as the real collaboration primitive, and we both reject passive `comms.md` as sufficient. We also agree that the final repo should be a dedicated agent-layer repo, not the platform app repo, and that the human entry ramp has to stay extremely simple before the system scales into a mesh.

On Skills, there is broad agreement in principle but not in emphasis. Claude's report is stronger on presenting Skills as the headline user feature and on describing how a human would invoke them from prompts, slash commands, and dev plans. My earlier report was stronger on the architecture underneath that choice: keep `.agent/skills` as canonical, generate `.claude/skills` and `.codex/skills`, and treat `design_pattern_factory` as the simplification lab rather than the runtime base. Claude's own reconciliation section now largely moves toward that same position, which is notable because it means the strongest combined answer is no longer a compromise on that point.

The biggest differences are in architecture and rigor. My prior report is stronger on concrete system-shaping proposals. I proposed `router.js` and `session.js` as new DNA-level files because the current mesh repos duplicate routing, naming, socket, and status logic across `cc.js`, `codex.js`, `gemini.js`, and `ag.js`, and they hardcode too much session state in too many places. Claude did not propose those files in his main report, but in his reconciliation he explicitly adopted them and correctly recognized that they solve real duplication instead of just documenting it. The same pattern shows up in launcher naming: Claude originally used a `me.sh` / `me-full.sh` / `me-no-ag.sh` family, while I used `me.sh` plus `mesh.sh`, `mesh-no-ag.sh`, and `preflight-mesh.sh`. His reconciliation explicitly accepts that my naming is better because it preserves `me.sh` as the duo fast path and makes "mesh" a distinct concept instead of an overloaded variant.

Another important difference is worker-pool thinking. My prior report surfaced `launch-codex-peer.sh` and `send-codex-peer.sh` from `interlateral_platform_alpha` as genuinely important because they are the first practical bridge from a small fixed mesh to scalable peer pools. Claude missed those in his main report, then correctly acknowledged that gap in reconciliation. I also proposed a new `launch-gemini-peer.sh` to bring Gemini CLI into the same scaling model. That matters because without pool ergonomics, the system tops out at "a few agents talking"; with them, it starts to become a real coordination substrate.

Claude's report is better than mine in several other ways. It is broader, more readable as a human-facing deliverable, and stronger on structured presentation. His repo writeups do a better job of situating each repo in the larger story, especially the product/platform aspects of `interlateral_platform_alpha` and the workshop role of `interlateral_design_pattern_factory`. His use of capability tables and phased migration makes the document easier to scan. He is also better than I was at foregrounding human UX around Skills and at explicitly tying live operation, dashboard visibility, and command invocation together.

There are a few factual and framing corrections where my prior report remains stronger. First, Claude's main report says `interlateral_alpha` and its upstream sibling have 17 Skills. The verified count in `.agent/skills` is 16 in both repos. Second, Claude described `interlateral_platform_alpha` as having no Skills system. That is directionally true if the question is "does it use repo-local Skills to drive runtime collaboration," but it is too absolute: it does serve onboarding `SKILL.md` files and explicitly references Agent Skills Specification-compatible skill files in the README. Third, his main report leaned harder into courier-centric Codex framing in some places than I think the code and newer instructions justify. My prior report was more careful: the alpha repos are mixed-lineage here, but the best final answer is to normalize them around direct comms as primary and courier as fallback only.

The other important thing that changed is that Claude's own reconciliation section already incorporated several of my strongest proposals. That means the delta between us is no longer "two competing recommendations." It is closer to "his report shell plus my architectural corrections." His reconciliation explicitly adopts `mesh.sh`, `router.js`, `session.js`, direct-first comms normalization, identity stamping everywhere, and the import of peer-launch helpers from `interlateral_platform_alpha`. That is a meaningful improvement over his initial report and it is the main reason the best final answer is now fairly clear.

### comparative assessment

If the question is "which artifact would I hand Dazza as the cleaner report right now," Claude's content is overall better. It is more complete as a document, it is better structured for human scanning, and it does a better job of explaining repo purpose, repo context, and Skills UX in a way that is easy to consume quickly. His report reads more like a polished advisory memo.

If the question is "which content is more useful for actually building the final system correctly," my prior content is stronger. It makes sharper distinctions between donor repos, is stricter about direct-first comms, catches the more important factual edge cases, and proposes the key missing abstractions instead of only describing the current state. In particular, `router.js`, `session.js`, the canonical `.agent/skills` choice, the merged `tmux-config.sh`, and the worker-pool helpers are not cosmetic differences. They materially change whether the final system becomes coherent or stays a pile of strong but disconnected scripts.

So my comparative assessment is this: Claude's content is better as the presentation layer; my prior content is better as the architecture layer. The strongest final answer is not "choose one." It is "use Claude's broader framing and polished structure, but anchor the actual design choices in my tighter architectural recommendations." Claude's own reconciliation section already trends in exactly that direction, which I think is the correct resolution.

### best-and-final response

The best-and-final answer is to build a new dedicated `interlateral_agents` repo on top of `interlateral_alpha`, then selectively import the launcher ergonomics and identity tooling from `interlateral_platform_alpha`.

`interlateral_alpha` should be the base because it already has the correct shape for a true multi-agent control repo: quad-agent runtime, Antigravity, Gemini CLI, canonical Skills, monitor/dashboard, evals, HyperDomo, leadership config, and explicit startup manuals. `interlateral_platform_alpha` should not be the base because it is a product repo and drags along API, UI, and GCP concerns that should not define the agent layer. But `interlateral_platform_alpha` is still the right donor for the fast human entrypoint and the best current duo experience. That means the correct synthesis is alpha as base shape, platform_alpha as launcher and ergonomics donor.

The root launcher family should be:

- `me.sh`: the simplest duo fast path, Claude + Codex only, ACK-based, deterministic, and as close as possible to what is working right now.
- `mesh.sh`: full mesh launcher for Claude + Antigravity + Codex + Gemini CLI.
- `mesh-no-ag.sh`: CLI-only mesh for Claude + Codex + Gemini CLI when AG is not present or not worth the overhead.
- `preflight-mesh.sh`: formal run mode with more aggressive validation, traces, and eval/report hooks.

That split matters because it preserves the entry ramp. The system should never force a user who wants "two agents right now" to boot an entire mesh stack. At the same time, the mesh modes should feel like extensions of the same system rather than a different product.

At the DNA layer, the final repo should keep `cc.js`, `codex.js`, `ag.js`, `gemini.js`, `courier.js`, `leadership.json`, and `LIVE_COMMS.md`, but it should add two new files: `router.js` and `session.js`. `router.js` should be the single dispatch surface for `send`, `status`, `read`, and later broadcast or retry behavior. `session.js` should centralize socket paths, session names, team IDs, ACK timeouts, and launcher-mode defaults. Those two files are the cleanest way to stop the current drift where naming and routing logic are duplicated in too many scripts and docs. `identity.js` from `interlateral_platform_alpha` should be imported and generalized so every relay or control message can be identity-stamped consistently across Claude, Codex, Gemini, AG, and any worker pool peers.

On comms policy, the final repo should explicitly standardize one truth: direct comms are primary, courier is fallback. The current alpha-line repos reflect a historical transition and the docs do not say one clean thing everywhere. The final repo should. The operative pattern is live direct injection plus durable logging. Courier remains useful for constrained or degraded cases, but it should not define the mental model of the system.

On Skills, the canonical source should remain `.agent/skills`. That aligns with the alpha repos, minimizes compatibility risk, and keeps the system aligned with the actual current runtime expectations. `.claude/skills` and `.codex/skills` should remain generated or deployed copies. `SKILLS.md` should be a strong human-facing catalog. `interlateral_design_pattern_factory` should continue to serve as the simplification and refinement lab for Skill wording and minimal examples, but not as the runtime base. `interlateral_platform_alpha` should be described accurately here: it does not have a runtime collaboration Skills library, but it does have onboarding skill support and should be treated as Skills-aware at the platform edge.

The first imports from `interlateral_platform_alpha` should be:

- `me.sh`
- `interlateral_dna/identity.js`
- `scripts/launch-codex-peer.sh`
- `scripts/send-codex-peer.sh`
- the strongest parts of `scripts/tmux-config.sh`

The merged `tmux-config.sh` is especially important. From `interlateral_platform_alpha`, the final repo should preserve `agent_send`, `codex_send_clean`, long-prompt paste handling, pane capture helpers, and idle detection. From `interlateral_alpha`, it should preserve the explicit shared socket discipline and multi-agent conventions. That merged helper layer is the practical foundation of reliable day-to-day operation.

The most important new file beyond `router.js` and `session.js` is `scripts/launch-gemini-peer.sh`. The final system should not stop at a fixed four-agent mesh. It should be able to scale into peer pools, first manually, then under manager control. Bringing Gemini CLI into that same pool model makes the architecture symmetric and much more future-proof.

The best practical build order is:

1. Copy `interlateral_alpha` as the base repo.
2. Import `me.sh`, `identity.js`, `launch-codex-peer.sh`, and `send-codex-peer.sh` from `interlateral_platform_alpha`.
3. Merge `scripts/tmux-config.sh` from alpha and platform_alpha.
4. Normalize `cc.js`, `codex.js`, `gemini.js`, and `LIVE_COMMS.md` around direct-first comms.
5. Add identity stamping consistently across the control scripts.
6. Create `router.js` and `session.js`.
7. Add `mesh.sh`, `mesh-no-ag.sh`, and `preflight-mesh.sh` as first-class root launchers.
8. Add `launch-gemini-peer.sh`.
9. Clean stale Skill examples and path references while keeping `.agent/skills` canonical.
10. Add a single `docs/ARCHITECTURE.md` so the repo stops depending on layered README drift.

That is the best merged answer because it preserves the strongest existing operational path, adopts the strongest full-mesh donor, keeps Skills first-class, and creates a clean runway from simple two-agent use to deeper orchestrated systems.

### change log

Relative to my own prior content, the biggest change is that I would now lean harder into Claude's presentation strengths and broader human-facing framing. My earlier report was intentionally direct and architecture-heavy. After comparing his content carefully, I think the final answer should do more to present repo roles, Skills invocation, and migration stages in a way that is easier for a human operator to scan.

I would also now more explicitly adopt the framing that the report should describe two layers at once: the repo as an engineering system and the repo as a human-operated product. Claude's content is better on that second layer, especially around how people discover and use Skills and how they understand why each repo exists.

That said, I would keep several of my original positions unchanged because the comparison reinforced them rather than weakened them:

- keep `.agent/skills` as canonical instead of moving canonical Skills to a top-level `skills/` directory
- keep direct comms primary and courier fallback-only
- add `router.js` and `session.js` as new DNA-level files
- preserve and extend peer-launch helpers for Codex and Gemini worker pools
- use `me.sh` plus `mesh.sh` family naming instead of `me-full.sh`
- treat `interlateral_alpha` as the base and `interlateral_platform_alpha` as a donor, not vice versa

I would also explicitly correct the facts that were fuzzy or overstated in the other report:

- `interlateral_alpha` and `interlateral_alpha-upstream` have 16 `.agent/skills` directories, not 17
- `interlateral_platform_alpha` should not be described as having zero skill capability, because it does serve onboarding `SKILL.md` files, even though it lacks a runtime collaboration Skills library
- the alpha-line repos should not be summarized as courier-primary in the final architecture, because the stronger forward-looking answer is to standardize them around direct-first comms

So the net change from my prior content is not a reversal. It is a refinement: keep my architecture, absorb Claude's reporting strengths, and make the final recommendation more explicit about the human-facing experience.

### key observations and deep insights

The system becomes powerful for a general audience only if it is designed as a progressive ladder rather than a single intimidating mesh. The first rung has to be almost trivial: one command, two agents, visible activity, and a clear end state. That is what `me.sh` gives you. If that entry mode is noisy, fragile, or overly abstract, the rest of the system will be perceived as experimental infrastructure rather than a usable collaboration tool. The ladder then expands outward: duo, CLI trio, quad mesh, peer pools, orchestrated pools, and eventually mixed teams of humans and agents. The same DNA layer has to support all of those without requiring users to mentally switch products.

Skills are the real differentiator, but only if they are treated as protocols rather than files. A Skill should not just be a markdown instruction block sitting somewhere in the tree. It should be a routable collaboration primitive with a discoverable name, a known role structure, a traceable run, and defined outputs. That means the future system should treat every Skill invocation as a first-class event with metadata: who invoked it, which agents participated, which roles they held, what artifact paths were expected, what actually got produced, and whether the run completed cleanly. If that metadata exists, Skills become composable building blocks. If it does not, Skills remain clever prompt files.

The logging model needs a sharper split between source of truth and human presentation. Right now the ecosystem has multiple overlapping traces: `comms.md`, `ag_log.md`, pane captures, telemetry files, OTEL traces, eval outputs, and dashboard state. That is useful but too fragmented. The final system should have one append-only structured event stream as the canonical substrate. Human-readable logs like `comms.md` should be rendered views over that stream, not the primary record. The dashboard should also read from that same event stream. Once that is in place, it becomes much easier to support replay, debugging, evaluation, and after-the-fact auditing without building separate pipelines for each surface.

Live UI/UX for the human should be designed in layers the same way launchers are. In duo mode, the operator does not need a full web dashboard, but they do need confidence. That means real-time status, recent message visibility, and a clear indicator of idle, busy, waiting, or blocked states. In mesh mode, the dashboard should show agent health, session state, active skills, message routing, and newly created artifacts. In formal or long-running modes, the human should be able to watch structured traces, see eval hooks, and inspect workflow state without spelunking across multiple directories. The point is not just observability. It is operator trust.

After-the-fact reviewability is where this system can become much more valuable than most agent stacks. A useful multi-agent system should leave behind a coherent session package, not just a pile of logs. That package should answer simple but important questions quickly: what did the agents do, what decisions did they make, what artifacts did they produce, what Skill runs happened, what got stuck, and what should the human inspect first. The right output here is not merely raw telemetry. It is a generated session report backed by structured data, with deep links into traces, diffs, transcripts, and artifacts for drill-down.

Artifacts themselves need to become first-class citizens. The current repos have the beginnings of this idea, but the model is still inconsistent. In a mature system, every meaningful output should be typed, indexed, and attributable. Code patches, docs, decisions, eval reports, screenshots, transcripts, research notes, and generated prompts should all be treated as retrievable session artifacts with provenance. Once artifacts are addressable, the dashboard becomes more than a chat viewer. It becomes the control room for the actual work product.

The final architecture should therefore be thought of as five cooperating planes, not one script bundle. There is a comms plane that moves messages, a control plane that launches and supervises agents, a Skills plane that defines collaboration protocols, an artifact plane that stores and indexes outputs, and a review plane that supports observability, evals, replay, and human auditing. Most of the current repos contain fragments of these planes. The final repo becomes strong when those planes are made explicit and cleanly connected.

`router.js` and `session.js` matter because they are the first move toward that explicit architecture. `router.js` begins to unify the comms plane. `session.js` begins to unify the control plane. Once those exist, Skills can target a stable routing and session model instead of a shifting set of repo-specific script names and hardcoded tmux assumptions. That in turn makes the dashboard and after-action review much more reliable, because the same stable identifiers can flow through every layer.

For a broad audience, the golden path should look something like this: start with `./me.sh`, add a Skill by naming it in plain language, see the agents visibly work, inspect the resulting artifact, and later replay the session if needed. Advanced users can climb into mesh mode, worker pools, formal evals, and manager-worker orchestration without leaving the same conceptual framework. That continuity is the difference between an interesting expert system and a genuinely adoptable multi-agent platform.

# View from the Hilltop

## Concise merged verdict

The two agents converge on the main answer: build `interlateral_agents` on `interlateral_alpha`, import the best launcher and operator ergonomics from `interlateral_platform_alpha`, keep direct comms primary, keep `.agent/skills` canonical, and preserve a simple `me.sh` fast path while adding a distinct `mesh.sh` family for deeper multi-agent modes. The strongest merged architecture is: alpha as the runtime base, platform_alpha as the duo launcher and worker-helper donor, Skills as the differentiation layer, `router.js` plus `session.js` as the missing unifying DNA pieces, and a stronger observability/artifact model so humans can see what is happening live and understand what happened after the fact.

## Combined assessment of `ipa-claude` + `ipa-codex`

`ipa-claude` produced the better operator-facing strategy memo. It is stronger on adoption path, UX framing, Skills as a product feature, live visibility, session reporting, and why the ladder from simple to advanced use matters. `ipa-codex` produced the stronger architecture memo. It is sharper on donor selection, canonical directory choices, file-level unification, direct-first comms, worker-pool scaling, and the need for `router.js` and `session.js`.

Together they are materially better than either alone. Claude prevents the system from becoming only a script bundle for experts. Codex prevents it from becoming an attractive but structurally inconsistent merge. My synthesis is that the right next move is not coding immediately, but locking the invariants that let both views coexist cleanly: launcher ladder, canonical Skills location, routing/session abstraction, event/logging substrate, artifact layout, and review surfaces.

## Revised best and final version

### Final architectural position

The final repo should be a dedicated `interlateral_agents` control layer, not a product repo. It should start from `interlateral_alpha` because that repo already has the right shape for a real mesh system: multi-agent runtime, canonical Skills, Gemini CLI, Antigravity, leadership config, observability, dashboard, evals, and HyperDomo. It should then import the best operational kernel from `interlateral_platform_alpha`: the current `me.sh`, identity stamping, Codex peer launch/send helpers, and the best parts of `tmux-config.sh`.

The repo should be organized around five explicit planes:

1. `control`: launchers, tmux/session lifecycle, worker pools, supervision
2. `comms`: direct routing, status/read/send, fallback behavior, identity
3. `skills`: collaboration protocols, deployment copies, registry/catalog
4. `artifacts`: outputs, manifests, provenance, indexing
5. `review`: dashboard, event stream, replay, session reports, eval hooks

That is the cleanest way to carry forward all the best ideas from both agents without losing coherence.

### Non-negotiable design choices

1. Base repo: `interlateral_alpha`
2. Primary donor repo: `interlateral_platform_alpha`
3. Comms policy: direct-first, courier fallback only
4. Canonical Skills location: `.agent/skills`
5. Launcher family:
   - `me.sh`
   - `mesh-no-ag.sh`
   - `mesh.sh`
   - `preflight-mesh.sh`
6. New DNA files:
   - `interlateral_dna/router.js`
   - `interlateral_dna/session.js`
7. Worker-pool support:
   - keep `launch-codex-peer.sh`
   - keep `send-codex-peer.sh`
   - add `launch-gemini-peer.sh`

### Smoothing revisions to stitch the best ideas together

1. Keep Claude's progressive ladder framing, but use Codex's naming.
   `me.sh` remains the duo fast path; `mesh*` names signal the larger system cleanly.
2. Keep Codex's `.agent/skills` canonical choice, but add Claude's stronger human discoverability.
   The answer is not moving the canonical directory. The answer is better indexing and surfacing.
3. Keep Claude's strong emphasis on live and after-the-fact reviewability, but ground it in Codex's tighter architecture.
   That means one event substrate and derived human-facing views rather than many unrelated logs.
4. Keep Codex's donor discipline and factual corrections, but keep Claude's broader operator framing.
   The final doc and repo should explain both what the system is and how a human uses it.

### My novel suggestions

1. Add a machine-readable Skills registry.
   Create `skills/registry.json` as a generated index from `.agent/skills` with: skill name, one-line description, roles, expected outputs, and launch compatibility (`me`, `mesh-no-ag`, `mesh`, `preflight`).
2. Add a lightweight duo-mode live view before the full dashboard.
   Create a simple `scripts/watch-session.sh` or small TUI that shows agent state, recent messages, and newest artifacts for `me.sh` runs without requiring the full monitor stack.
3. Make artifacts explicit from day one.
   Use `artifacts/<session-id>/` with:
   - `manifest.json`
   - `session-report.md`
   - `decisions.md`
   - `links.json`
   and store or link all generated outputs there.
4. Define the event schema before implementation.
   Put a short `docs/EVENT_SCHEMA.md` in phase 0 so `comms.md`, dashboard, replay, evals, and session reports can all derive from one stable model.

### Concrete pre-coding implementation plan

#### Phase 0: lock invariants before code

1. Write `docs/ARCHITECTURE.md`
2. Write `docs/EVENT_SCHEMA.md`
3. Write `docs/ARTIFACT_MODEL.md`
4. Define launcher matrix and naming rules in one place
5. Define canonical session naming, socket naming, and identity fields
6. Define `.agent/skills` as canonical and specify generated targets

Deliverable:
- a short, stable design spec that prevents the implementation from drifting

#### Phase 1: build the core control/comms spine

1. Copy `interlateral_alpha` into the new repo base
2. Import from `interlateral_platform_alpha`:
   - `me.sh`
   - `interlateral_dna/identity.js`
   - `scripts/launch-codex-peer.sh`
   - `scripts/send-codex-peer.sh`
3. Merge `scripts/tmux-config.sh`
4. Add `interlateral_dna/session.js`
5. Add `interlateral_dna/router.js`
6. Normalize `cc.js`, `codex.js`, `gemini.js`, and `ag.js` to use shared session/routing helpers
7. Standardize direct-first comms in `LIVE_COMMS.md`

Deliverable:
- reliable duo and mesh launch/control spine with shared naming and routing

#### Phase 2: make Skills first-class

1. Keep `.agent/skills` as canonical
2. Generate `.claude/skills` and `.codex/skills`
3. Add `skills/registry.json` generator
4. Clean stale paths and role conventions in the existing Skills
5. Add explicit expected artifact/output locations to the high-value Skills

Deliverable:
- canonical Skills with machine-readable index and cleaner runtime behavior

#### Phase 3: fix observability and human review

1. Establish one append-only structured event stream, likely `.observability/events.jsonl`
2. Make `comms.md` a rendered or synchronized human view, not the source of truth
3. Add `scripts/watch-session.sh` for duo mode
4. Keep and adapt `interlateral_comms_monitor/` for mesh mode
5. Add session report generation into `artifacts/<session-id>/session-report.md`
6. Add artifact manifest generation

Deliverable:
- one source of truth for events plus live and retrospective human review

#### Phase 4: scale to pools and orchestration

1. Add `launch-gemini-peer.sh`
2. Normalize peer-pool conventions across Codex and Gemini
3. Connect HyperDomo or similar manager-worker orchestration to the same routing/session model
4. Add review/eval hooks that operate on sessions and artifacts rather than only raw logs

Deliverable:
- a clean path from duo to mesh to worker pools to orchestrated pools

### Final recommended shape

If you force me to compress the whole answer to one paragraph:

Build `interlateral_agents` by copying `interlateral_alpha`, importing `me.sh`, `identity.js`, peer helpers, and tmux ergonomics from `interlateral_platform_alpha`, standardizing all control scripts around direct-first comms plus `router.js` and `session.js`, keeping `.agent/skills` canonical while improving discoverability with a registry and better docs, and making one structured event stream plus explicit artifact manifests the backbone for both live UI/UX and after-the-fact review. That carries forward the best of Claude's product/operator thinking, the best of Codex's architectural rigor, and adds the missing glue needed to keep the final repo coherent before any coding starts.

# Hilltop Changelog

- `ipa-claude` provenance:
  - progressive ladder from simple duo to advanced mesh/pools
  - Skills as the headline differentiator
  - strong emphasis on operator UX, live visibility, session reporting, and artifact indexing
  - framing the system as something a general audience can grow into
- `ipa-codex` provenance:
  - `interlateral_alpha` as base, `interlateral_platform_alpha` as donor
  - `router.js` and `session.js`
  - `.agent/skills` as canonical
  - direct-first, courier-fallback-only comms
  - `me.sh` plus `mesh*` naming
  - worker-pool helpers and `launch-gemini-peer.sh`
  - stronger donor discipline, factual corrections, and architecture-plane thinking
- `CX_hilltop` novel additions:
  - explicit five-plane architecture: control, comms, skills, artifacts, review
  - `skills/registry.json` as a machine-readable Skills catalog
  - `scripts/watch-session.sh` as a lightweight duo-mode live view before full dashboard use
  - `artifacts/<session-id>/manifest.json` and `session-report.md` as explicit artifact/session package outputs
  - `docs/EVENT_SCHEMA.md` and `docs/ARTIFACT_MODEL.md` as phase-0 invariants before implementation
- smoothing and consistency changes I made:
  - chose Claude's progressive-adoption framing but Codex's launcher naming
  - chose Codex's canonical Skills location but Claude's stronger discoverability emphasis
  - preserved both agents' observability goals, but tightened them around one structured event substrate
- kept both agents' best implementation ideas while removing contradictory framing around courier and top-level canonical `skills/`
- turned two strong analyses into one pre-coding implementation sequence with explicit phases and deliverables

# 1. give you a tight spoken-summary version of the Hilltop section

If I were saying this out loud in one pass, I would put it this way:

The best answer is to build `interlateral_agents` on top of `interlateral_alpha`, then import the best launcher and operator ergonomics from `interlateral_platform_alpha`. Keep `me.sh` as the very simple two-agent fast path, then add a clean `mesh.sh` family for larger multi-agent modes. Keep `.agent/skills` as the canonical Skills location, but improve discoverability and UX so humans can actually use the system without spelunking. Standardize the core around direct-first comms, add `router.js` and `session.js` as the missing unifying DNA layer, preserve worker-pool helpers, and treat Skills as first-class collaboration protocols rather than loose markdown files.

The real opportunity is not just getting agents to talk. It is building a system that scales from "two agents helping me right now" all the way to orchestrated pools of agents with replay, evals, artifacts, and clear operator visibility. To do that, the final repo needs one structured event stream, explicit artifact/session packaging, and layered UI/UX: something lightweight in duo mode and richer dashboards and replay in mesh mode. Claude is strongest on operator experience and adoption path. Codex is strongest on architecture and implementation discipline. The right move is to carry forward all of that, but lock the invariants before coding so the implementation does not drift.

# 2. turn the revised best-and-final into a one-page implementation brief

## Purpose

Build a dedicated `interlateral_agents` repo that becomes the stable, reusable multi-agent coordination layer for Interlateral and other projects. The repo must support a very easy starting mode, scale cleanly into richer multi-agent modes, and provide strong live and retrospective visibility for human operators.

## Core decision

- Base repo: `interlateral_alpha`
- Primary donor repo: `interlateral_platform_alpha`

Rationale:
- `interlateral_alpha` already has the right runtime shape for a real mesh system.
- `interlateral_platform_alpha` has the best current duo launcher, peer helper scripts, and practical tmux ergonomics.

## Required architecture

### Launcher family

- `me.sh`: Claude + Codex duo, minimal friction, fast startup
- `mesh-no-ag.sh`: Claude + Codex + Gemini CLI
- `mesh.sh`: full mesh including Antigravity
- `preflight-mesh.sh`: formal mode with stronger review/eval hooks

### DNA layer

- keep: `cc.js`, `codex.js`, `ag.js`, `gemini.js`, `courier.js`, `leadership.json`, `LIVE_COMMS.md`
- import and extend: `identity.js`
- add: `router.js`
- add: `session.js`

### Skills layer

- canonical source: `.agent/skills`
- deployed copies: `.claude/skills`, `.codex/skills`
- human-facing catalog: `SKILLS.md`
- generated machine-readable index: `skills/registry.json`

### Event, artifact, and review model

- one append-only structured event stream as the source of truth
- human-readable `comms.md` as a view, not the primary record
- session artifact package under `artifacts/<session-id>/`
- session report generation for after-the-fact review
- lightweight duo-mode live view plus richer mesh dashboard

## Must-preserve imports from `interlateral_platform_alpha`

- `me.sh`
- `interlateral_dna/identity.js`
- `scripts/launch-codex-peer.sh`
- `scripts/send-codex-peer.sh`
- strongest parts of `scripts/tmux-config.sh`

Specifically preserve from `tmux-config.sh`:
- `agent_send`
- `codex_send_clean`
- long-prompt paste handling
- pane capture helpers
- idle detection

## Must-preserve strengths from `interlateral_alpha`

- mesh runtime shape
- `.agent/skills`
- Gemini CLI support
- Antigravity support
- monitor/dashboard
- observability conventions
- evals and HyperDomo path

## Non-negotiable policies

- direct-first comms
- courier fallback only
- `.agent/skills` canonical
- explicit session naming and socket discipline
- progressive ladder from duo to mesh to worker pools

## Immediate implementation sequence

1. Lock phase-0 design docs.
2. Copy `interlateral_alpha` as base.
3. Import launcher/kernel pieces from `interlateral_platform_alpha`.
4. Merge tmux helpers.
5. Add `router.js` and `session.js`.
6. Normalize control scripts and docs around direct-first comms.
7. Clean and index Skills.
8. Establish event stream, artifact model, and session reports.
9. Add Gemini peer-pool symmetry.

## Success criteria

- `./me.sh` works as the obvious starting mode
- `mesh*` modes feel like a natural expansion, not a different product
- Skills are discoverable and routable
- operators can see live activity and review completed sessions clearly
- the system scales from duo to pools without architectural rework

# 3. start drafting the phase-0 design docs without coding the system yet

## Draft: `docs/ARCHITECTURE.md`

### Purpose

`interlateral_agents` is the agent coordination layer. It is not the product app. It provides launchers, comms, Skills, artifacts, and review surfaces for human-operated multi-agent work.

### System planes

1. `control`
   - launchers
   - tmux sessions
   - worker pools
   - supervision
2. `comms`
   - routing
   - status
   - read/send operations
   - identity
   - fallback behavior
3. `skills`
   - collaboration protocols
   - role definitions
   - output expectations
4. `artifacts`
   - generated outputs
   - manifests
   - provenance
   - session package
5. `review`
   - dashboard
   - replay
   - eval hooks
   - session reports

### Launcher ladder

- `me.sh`: simplest duo mode
- `mesh-no-ag.sh`: CLI mesh
- `mesh.sh`: full mesh
- `preflight-mesh.sh`: formal reviewed mode

### Core invariants

- direct comms are primary
- courier is fallback only
- `.agent/skills` is canonical
- one structured event stream is the source of truth
- every meaningful session has a session artifact package

### DNA responsibilities

- `session.js`: names, sockets, session defaults, launcher mode defaults
- `router.js`: dispatch, status, read/send, routing policy
- control scripts: agent-specific mechanics on top of shared session/routing rules

## Draft: `docs/EVENT_SCHEMA.md`

### Goal

Define one event substrate used by logs, dashboards, replay, and session reports.

### Event format

Use JSON Lines in `.observability/events.jsonl`.

Each event should include:
- `ts`
- `session_id`
- `team_id`
- `event_type`
- `source`
- `target`
- `agent_type`
- `session_name`
- `status`
- `skill_name` if relevant
- `artifact_path` if relevant
- `payload`

### Minimum event types

- `session_started`
- `session_stopped`
- `agent_started`
- `agent_ready`
- `agent_idle`
- `agent_busy`
- `message_sent`
- `message_received`
- `skill_invoked`
- `skill_completed`
- `artifact_created`
- `artifact_updated`
- `warning`
- `error`
- `eval_started`
- `eval_completed`

### Rule

Human-readable logs and dashboards should derive from this stream whenever possible.

## Draft: `docs/ARTIFACT_MODEL.md`

### Goal

Make outputs first-class, attributable, and reviewable.

### Session package

Each session should have:

`artifacts/<session-id>/`

Containing at minimum:
- `manifest.json`
- `session-report.md`
- `decisions.md`
- `links.json`

### Manifest fields

- `session_id`
- `started_at`
- `ended_at`
- `agents`
- `skills_invoked`
- `artifacts`
- `errors`
- `summary`

### Artifact classes

- code patch
- document
- decision record
- eval result
- screenshot
- transcript excerpt
- prompt artifact
- research note

### Provenance rule

Every artifact should be attributable to:
- session
- agent
- skill or workflow
- creation/update time

## Draft: launcher and naming rules

### Session naming

- stable prefix per launcher mode
- explicit session names for core agents
- worker peers use predictable suffixes

Examples:
- `ia-claude`
- `ia-codex`
- `ia-gemini`
- `ia-ag`
- `ia-codex-peer-01`

### Socket naming

- one shared repo socket by default
- session and routing code must not hardcode multiple incompatible defaults

### Identity fields

Minimum fields:
- `team`
- `sender`
- `agent_type`
- `host`
- `sid`
- `session_name`

## Draft: phase-0 decision checklist

Before coding starts, confirm:

1. launcher family names
2. canonical Skills location
3. direct-first comms policy
4. event schema
5. artifact package layout
6. session/socket naming rules
7. dashboard layering strategy
8. worker-pool naming and symmetry plan

# Mountaintop

## Best-and-Final Synthesis

### The core answer (unchanged from Hilltop)

Build `interlateral_agents` as a dedicated agent coordination layer on top of `interlateral_alpha`, importing the launcher kernel and operator ergonomics from `interlateral_platform_alpha`. This is the decision both agents independently reached, the Hilltop confirmed, and both agents validated in their assessments. It is not revisited here.

### Non-negotiable design choices (unchanged)

1. Base repo: `interlateral_alpha`
2. Primary donor repo: `interlateral_platform_alpha`
3. Comms policy: direct-first, courier fallback only
4. Canonical Skills location: `.agent/skills`
5. Launcher family: `me.sh`, `mesh-no-ag.sh`, `mesh.sh`, `preflight-mesh.sh`
6. New DNA files: `interlateral_dna/router.js`, `interlateral_dna/session.js`
7. Worker-pool support: keep `launch-codex-peer.sh`, `send-codex-peer.sh`, add `launch-gemini-peer.sh`

### The five-plane architecture (retained, with clarification)

The Hilltop's decomposition into five cooperating planes is the strongest original contribution of the synthesis. It is retained as the organizing mental model:

1. **Control**: launchers, tmux sessions, worker pools, supervision
2. **Comms**: routing, status/read/send, identity, fallback behavior
3. **Skills**: collaboration protocols, role definitions, output expectations
4. **Artifacts**: generated outputs, manifests, provenance, session packages
5. **Review**: dashboard, replay, eval hooks, session reports, **live operational state**

**Clarification**: These planes are a decision-making framework, not a directory structure or module boundary. During Phase 1-2, they guide where code belongs. They should not be reified into rigid abstractions until the implementation has enough code to justify it. Premature directory restructuring around these planes would be over-engineering.

**Addition to the review plane**: The Hilltop focused the review plane on retrospective use (replay, evals, session reports). It must also cover live operational state: blocked agents waiting for permission, degraded modes, Skill runs that timed out or failed partway, and human intervention points. These are the states where the operator most needs visibility and where the current system is weakest.

### Skills registry location (corrected)

The Hilltop proposed `skills/registry.json` at a top-level path that does not exist in the agreed directory structure. This reintroduces ambiguity about where the canonical Skills source lives, directly contradicting the decision that `.agent/skills` is canonical.

**Correction**: The machine-readable Skills registry should live at `.agent/skills/registry.json`. It is generated from the SKILL.md files in the same directory. Human-facing discoverability comes from the top-level `SKILLS.md` index (which already exists in `interlateral_alpha`), not from a new top-level directory.

### Event schema (revised)

The Hilltop's draft event schema is the right starting point. It needs two targeted additions now and should defer others to implementation.

**Add now** (because they are structural and affect every consumer):
- `correlation_id`: Links all events within a single Skill run or workflow. Without this, you cannot reconstruct the causal chain of a collaboration.
- `launcher_mode`: Which launcher started this session. Values match the launcher family directly: `me`, `mesh-no-ag`, `mesh`, `preflight-mesh`. Determines which planes are active and what review surfaces are available.

**Defer to implementation** (because the right shape depends on how agents actually emit events):
- `message_id`, `parent_event_id`, `artifact_id`: These are eventually needed for replay and causality graphs, but designing them now without knowing the actual event emission patterns risks a schema that's internally consistent but doesn't match reality.

**Revised minimum event fields**:
- `ts`
- `session_id`
- `correlation_id` *(added)*
- `launcher_mode` *(added)*
- `team_id`
- `event_type`
- `source`
- `target`
- `agent_type`
- `session_name`
- `status`
- `skill_name` (if relevant)
- `artifact_path` (if relevant)
- `payload`

**Minimum event types** (unchanged from Hilltop): `session_started`, `session_stopped`, `agent_started`, `agent_ready`, `agent_idle`, `agent_busy`, `message_sent`, `message_received`, `skill_invoked`, `skill_completed`, `artifact_created`, `artifact_updated`, `warning`, `error`, `eval_started`, `eval_completed`.

**Added event types** for live operational state:
- `agent_blocked` (stuck on input, unresponsive peer, general blockage)
- `agent_degraded` (fallback mode, courier instead of direct, missing peer)
- `skill_timeout` (Skill run exceeded time limit)
- `skill_failed` (Skill run terminated with error)

**Added event types** for approval workflow:
- `approval_requested` (agent needs permission from human or peer to proceed)
- `approval_granted` (permission given — by human or peer agent)
- `approval_denied` (permission refused — includes reason in payload)

These are separate from `agent_blocked` because approval is a deliberate workflow state, not an error condition. An agent can be blocked without requesting approval (e.g., stuck on input), and an agent can request approval without being blocked (e.g., pre-checking before a destructive operation). Keeping them distinct lets the review plane show approval chains cleanly and lets the dashboard distinguish "waiting for permission" from "stuck."

**Rule** (unchanged): Human-readable logs and dashboards should derive from this stream whenever possible.

### Artifact model (revised)

The Hilltop's artifact model is directionally correct but needs three decisions made explicit before implementation.

**Session package structure** (revised from Hilltop — canonical location consolidated under `.observability/`):

```
.observability/sessions/<session-id>/
├── manifest.json
├── session-report.md
├── decisions.md
└── links.json
```

All session review packages live under `.observability/sessions/`. This is the one canonical location. There is no separate top-level `artifacts/` directory.

**Three decisions that must be made in Phase 0**:

1. **Copy vs. link**: Session packages should *link* to artifacts (via paths in `links.json`), not copy them. Artifacts live where agents create them (typically in `projects/` or the repo working tree). The session package is an index, not an archive. This keeps disk usage bounded and avoids duplication.

2. **Retention**: Session packages under `.observability/sessions/` are retained indefinitely. Raw telemetry logs (`.observability/casts/`, `.observability/logs/`) follow the existing `rotate-logs.sh` archival policy. Event streams (`.observability/events.jsonl`) are append-only within a session and archived on rotation.

3. **Self-containment for export**: When a session needs to be shared or archived externally, a `scripts/export-session.sh` should bundle the manifest, report, linked artifacts, and relevant event stream slice into a portable archive. This is a Phase 4 concern, not Phase 0.

### `me.sh` import (clarified)

The Hilltop says "import `me.sh` from `interlateral_platform_alpha`." This is correct in intent but the wording implies a file copy, which it is not.

**What actually transfers**: The ACK choreography pattern, the dual-session tmux creation, the pipe-pane telemetry setup, and the "Ready to Rock!" deterministic endpoint. These behaviors are adapted into the new repo's naming conventions (`ia-claude`/`ia-codex` or whatever session naming Phase 0 locks), socket path, and boot prompts. The resulting `me.sh` will share behavioral DNA with `platform_alpha/me.sh` but will be substantially rewritten.

### Session naming (decision needed)

The Hilltop draft introduced `ia-` prefix session names (`ia-claude`, `ia-codex`, etc.) without justification. The existing repos use `interlateral-claude` (`interlateral_alpha`) and `ipa-claude` (`platform_alpha`).

**Recommendation**: Use `ia-` as the prefix. It is shorter (matters for tmux display width), unambiguous, and consistent with the repo name `interlateral_agents`. But this must be an explicit Phase 0 decision, not a silent drift. All control scripts, boot prompts, and documentation must use the same convention from day one.

### `watch-session.sh` (scoped down)

The Hilltop proposes "a lightweight duo-mode live view" but doesn't specify what that means. The risk is building a real TUI (nontrivial) when a simple wrapper would suffice.

**Scoped definition**: `watch-session.sh` is a `watch`-style script that polls three sources every 2 seconds and displays them in a single terminal:
1. Last 10 lines of `comms.md`
2. Agent status (idle/busy) via `router.js status all`
3. Newest files in `projects/` (if any)

This is explicitly *not* a TUI framework. It is a convenience wrapper for duo mode that gives the operator confidence without requiring the full Comms Monitor stack. If it proves insufficient, the answer is to start the dashboard, not to build a bespoke TUI.

### The hardest unsolved problem: Skills instrumentation

Both agents independently identified this as the critical gap, and neither the Hilltop nor either reconciliation solves it.

**The problem**: The event schema defines `skill_invoked`, `skill_completed`, `skill_timeout`, `skill_failed`, and `artifact_created` event types. But no current Skill emits these events. Skills are markdown files that agents read and follow. There is no instrumentation layer between "agent reads SKILL.md" and "events appear in the stream."

**The design question**: Who emits Skill lifecycle events?

Three options:

1. **Agent self-reporting**: Each agent, upon reading a Skill, emits `skill_invoked` to the event stream and `skill_completed` when done. This is the simplest approach and works with existing Skills unchanged. The risk is that agents may forget, emit inconsistently, or disagree on when a Skill is "completed."

2. **Router-mediated instrumentation**: `router.js` recognizes Skill-tagged messages and automatically emits lifecycle events. When an agent sends a message containing a Skill role marker (e.g., `[DRAFTER]`, `[REVIEWER]`), the router infers Skill state. This is more reliable but requires message conventions that don't yet exist.

3. **Wrapper script**: A `run-skill.sh` or `invoke-skill.js` wraps the Skill invocation, emits `skill_invoked` at start, monitors for completion signals, and emits `skill_completed` or `skill_timeout`. This is the most reliable but adds a new layer between the human prompt and the agent.

**Recommendation**: Start with option 1 (agent self-reporting) in Phase 2. Add Skill lifecycle event emission to the CLAUDE.md and AGENTS.md instructions: "When you begin following a Skill, emit a `skill_invoked` event. When you complete it, emit `skill_completed`." This is imperfect but gets events flowing immediately. Evolve toward option 2 or 3 in Phase 4 as patterns stabilize. Do not block Phase 2 on solving this perfectly.

### Revised implementation sequence

#### Phase 0: Lock invariants (before code)

1. Finalize `docs/ARCHITECTURE.md` (five-plane model as decision framework, not module boundary)
2. Finalize `docs/EVENT_SCHEMA.md` (with `correlation_id`, `launcher_mode`, and operational state events)
3. Finalize `docs/ARTIFACT_MODEL.md` (link-not-copy, retention policy, export-later)
4. Lock session naming convention (`ia-` prefix)
5. Lock socket path
6. Lock `.agent/skills` as canonical, `.agent/skills/registry.json` as generated index

**Deliverable**: A short, stable design spec. Not exhaustive — just enough to prevent the drift that plagued the existing repos.

#### Phase 1: Control + Comms spine

1. Copy `interlateral_alpha` as base
2. Adapt `me.sh` behavior from `platform_alpha` (not file-copy — behavioral adaptation)
3. Import `identity.js`, `launch-codex-peer.sh`, `send-codex-peer.sh` from `platform_alpha`
4. Merge `tmux-config.sh` (platform_alpha helpers + alpha socket discipline)
5. Create `session.js` (centralized naming, socket, mode config)
6. Create `router.js` (unified send/status/read dispatch)
7. Normalize control scripts to use shared session/routing
8. Standardize `LIVE_COMMS.md` around direct-first comms

**Deliverable**: Reliable duo and mesh launch with shared naming and routing.

#### Phase 2: Skills as first-class layer

1. Keep `.agent/skills` canonical, generate deploy copies
2. Create `.agent/skills/registry.json` generator
3. Clean stale paths and role conventions in existing Skills
4. Add Skill lifecycle event emission to agent instruction files (self-reporting, option 1)
5. Add expected artifact/output paths to high-value Skills

**Deliverable**: Canonical Skills with machine-readable index, cleaner conventions, and initial event emission.

#### Phase 3: Observability + Review

1. Establish `.observability/events.jsonl` as the one structured event stream
2. Make `comms.md` a derived/synchronized view
3. Create `watch-session.sh` (simple polling wrapper for duo mode)
4. Adapt `interlateral_comms_monitor/` for mesh mode, reading from event stream
5. Create session report generator (`.observability/sessions/<session-id>/session-report.md`)
6. Create artifact manifest generator

**Deliverable**: One source of truth for events, plus live and retrospective human review.

#### Phase 4: Scale + Harden

1. Create `launch-gemini-peer.sh`
2. Normalize peer-pool conventions across Codex and Gemini
3. Connect HyperDomo to router/session model
4. Evolve Skill instrumentation toward router-mediated or wrapper-based (options 2/3)
5. Create `scripts/export-session.sh` for portable session archives
6. Add approval/permission state events and review surface

**Deliverable**: Clean path from duo to mesh to pools to orchestrated pools, with full observability.

---

## Mountaintop Changelog (changes from Hilltop)

| What Changed | Hilltop Said | Mountaintop Says | Why |
|---|---|---|---|
| **Skills registry location** | `skills/registry.json` (top-level) | `.agent/skills/registry.json` | Hilltop contradicted its own decision that `.agent/skills` is canonical. Codex caught this; both agents agreed. |
| **Event schema fields** | 14 fields, no correlation or mode | Added `correlation_id` and `launcher_mode` | Needed for Skill run tracing and launcher-aware review. Deferred `message_id`, `parent_event_id`, `artifact_id` to implementation — designing them without knowing emission patterns risks premature schema. |
| **Event types for operational state** | 16 types, all happy-path or generic | Added `agent_blocked`, `agent_degraded`, `skill_timeout`, `skill_failed` | The review plane must cover live operational state, not just retrospective replay. Blocked/degraded/failed states are where operators most need visibility. |
| **Five-plane clarification** | Presented as architecture | Clarified: decision framework, not directory structure or module boundary | Risk of premature reification. Use it to guide decisions now; formalize as code structure later when implementation justifies it. |
| **Review plane scope** | Primarily retrospective (replay, evals, reports) | Explicitly includes live operational state (blocked, degraded, failed, permission-waiting) | Both agents identified this gap independently. The review plane is not just for after-the-fact — it's for right now. |
| **Artifact copy vs. link** | Not specified | Link, not copy. Session packages are indexes, not archives. | Prevents disk bloat, avoids duplication, keeps artifacts where agents create them. Export-to-archive is Phase 4. |
| **Artifact retention** | Not specified | Session packages retained indefinitely; raw telemetry follows existing rotation policy; event streams archived per session. | Needed before implementation to prevent unbounded growth. |
| **me.sh import** | "Import me.sh" | "Adapt me.sh behavior" — behavioral adaptation, not file copy | The file uses different session names, socket paths, and boot prompts. The pattern transfers; the file does not. |
| **Session naming** | Introduced `ia-` prefix without justification | Recommends `ia-` with explicit justification (shorter, unambiguous, matches repo name) and flags it as a required Phase 0 decision | Hilltop silently introduced a third naming convention. This must be a deliberate, documented choice. |
| **watch-session.sh** | "Lightweight duo-mode live view" (unspecified) | Scoped to a simple `watch`-style polling wrapper: last 10 lines of comms.md, agent status via router.js, newest project files. Explicitly not a TUI. | Prevents scope creep. If insufficient, start the dashboard — don't build a bespoke TUI. |
| **Skills instrumentation** | Not addressed | Identified as the hardest unsolved problem. Three options evaluated. Recommends agent self-reporting (option 1) for Phase 2, evolving to router-mediated or wrapper-based in Phase 4. | Both agents independently converged on this as the critical gap. The Hilltop described the desired end state but not how to get there. |
| **Phase 0 scope** | 6 items | Same 6 items, but each now has specific decisions locked (link-not-copy, `ia-` prefix, registry at `.agent/skills/registry.json`) | Phase 0 should *decide*, not just *list topics to decide*. |
| **Implementation phases** | 4 phases with deliverables | Same 4 phases, refined: Phase 2 adds Skill event emission; Phase 3 adds operational state events; Phase 4 adds export and evolved instrumentation | Each phase now includes the specific additions identified in this changelog. |
| **Session package path** *(post-Hilltop, Mountaintop revision)* | Mixed: `artifacts/<session-id>/` in structure, `.observability/artifacts/` in retention | Consolidated to `.observability/sessions/<session-id>/` everywhere | Dazza's feedback: consistency matters more than the exact choice. All session review packages now live under `.observability/` alongside other session data. |
| **`launcher_mode` values** *(post-Hilltop, Mountaintop revision)* | `duo`, `trio`, `quad`, `preflight` | `me`, `mesh-no-ag`, `mesh`, `preflight-mesh` | Dazza's feedback: align field values with actual launcher names to eliminate an avoidable crosswalk between concepts and scripts. |
| **Approval-state events** *(post-Hilltop, Mountaintop revision)* | Approval/permission states folded into `agent_blocked` | Explicit `approval_requested`, `approval_granted`, `approval_denied` event types, separate from `agent_blocked` | Dazza's feedback + design reasoning: approval is a deliberate workflow state, not an error condition. Separating them lets the review plane show approval chains cleanly. |
