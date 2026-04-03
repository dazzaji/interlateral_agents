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

**Skills:** Keep in `.agent/skills/` (canonical, per Codex's convention-preserving approach) with deploy copies to `.claude/skills/` and `.codex/skills/`. But add a top-level `SKILLS.md` index that is comprehensive and human-friendly (per my proposal). Carry all 16 skills from `interlateral_alpha`.

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


_______________

# Streamlined and Simplified Starter Scope

I am Dazza and I need to start building this now but it has become sprawling.  So I need a bite-sized starter initial 0.1 state project that

A) HAS:

has 1) the 2-agent clean simple thing and 2) has a easy way to spin up more agents including more codex, more claude code, and more gemini cli agents, and 3) an easy way to start to use the SKILLS files so I can use them to get the agents organized in lots of ways (so we keep the SKILLS stuff) and 4) of course the Live Comms and 5) some logging/records such as the comms.md file but 

B) DOES NOT HAVE

All the other stuff that seems like complexity or bloat for right now.  Instead add ALL THAT TO a new "ROADMAP.md" file that I will add to root dir.  BE SURE YOU DO NOT MISS ANYTHING and that it is all in section A (HAS) or B (DOES NOT HAVE).  

Give me your response in body of text reply and use markdown headers for "# HAS" and for "# DOES NOT HAVE" and for "# ROADMAP.md"

____

# RESPONSE 01_CL

OK Dazza, here's the clean split. I went through every capability across all five repos and the full reconciliation proposal to make sure nothing falls through the cracks.

## HAS (v0.1 Starter Scope)

**The duo launcher.** `me.sh` at the repo root. One command, boots Claude Code + Codex in tmux sessions on a shared socket, mutual ACK handshake, done in under 5 seconds. Adapted from `platform_alpha`'s `me.sh` behavior, using `interlateral_alpha`'s socket discipline (`/tmp/interlateral-tmux.sock`). This is your daily driver.

**The DNA layer for direct comms.** `interlateral_dna/` containing: `cc.js` (inject into Claude Code's tmux pane), `codex.js` (inject into Codex's tmux pane), `gemini.js` (inject into Gemini CLI's tmux pane), `LIVE_COMMS.md` (the canonical reference for who-talks-to-whom-how), `comms.md` (fresh each session, the running ledger of what agents said), and `leadership.json` (simple config for who leads, collaborative mode). All comms are direct-first. No courier in v0.1 — if Codex can run `--full-auto` or equivalent, it talks directly.

**Peer launch helpers for spinning up more agents.** `scripts/launch-codex-peer.sh` and `scripts/send-codex-peer.sh` from `platform_alpha` — lets you spin up additional Codex instances and message them. `scripts/launch-gemini-peer.sh` (new, simple, based on the Gemini bootstrap logic from `interlateral_alpha`) — same thing for Gemini CLI instances. A simple `scripts/launch-cc-peer.sh` for additional Claude Code sessions. This is how you scale from duo to as many CLI agents as you want without needing the full mesh launcher infrastructure.

**The full Skills catalog.** `.agent/skills/` as the canonical location, containing all 16 canonical skills from `interlateral_alpha`: peer-collaboration, negotiation, hierarchical, democratic, competition, constitutional, dev-collaboration, dev-competition, publication-pipeline, add-comments, adherence-check, hyperdomo, test-4-series, evals, search-synth, create-skin. Deploy copies go to `.claude/skills/` and `.codex/skills/` so each agent can read them. `SKILLS.md` at the root as the human-readable index. `scripts/deploy-skills.sh` to push canonical copies to agent directories.

**Basic tmux config.** `scripts/tmux-config.sh` — shared socket path, session names, and the essential helpers from `platform_alpha`: `agent_send`, `codex_send_clean`, long-prompt paste support, and pane capture. This is the glue that makes the launcher and peer scripts work consistently.

**Logging and records.** `comms.md` refreshed each session as the human-readable record of agent conversation. `ag_log.md` placeholder for when AG is added. Standard tmux pane capture so you can always see what each agent's terminal shows. That's your paper trail for v0.1 — simple, readable, sufficient.

**Minimal agent instruction docs.** `CLAUDE.md` (simplified — boot protocol, Skills awareness, comms rules, no GCP cost guard or mesh-specific sections). `AGENTS.md` (Codex instructions — how to read Skills, direct comms, idle-after-ACK, repo boundaries). `GEMINI.md` (Gemini CLI instructions — model pinning, input buffer delay, session conventions). `README.md` (getting started: how to run `me.sh`, how to launch peers, how to invoke Skills). `TROUBLESHOOTING.md` (common issues, from `interlateral_alpha`).

**A basic shutdown script.** `scripts/shutdown.sh` — kills tmux sessions cleanly so you don't accumulate zombie agents.

**`ROADMAP.md`** at root (see below) — everything else lives here as a named, organized, prioritized list so nothing is forgotten.

## DOES NOT HAVE (Deferred to Roadmap)

Everything below is cut from v0.1 and captured in the ROADMAP. I've organized this into groups so you can see what you're deferring and why.

**Architectural abstractions:** `router.js` (centralized send/status/read dispatch), `session.js` (centralized config for sockets/names/modes), `docs/ARCHITECTURE.md`, `docs/EVENT_SCHEMA.md`, `docs/ARTIFACT_MODEL.md`, the five-plane conceptual framework as formalized code structure. These are valuable but they're unifying abstractions — you can add them once you feel the pain of not having them, which makes the design better anyway.

**The mesh launcher family:** `mesh.sh`, `mesh-no-ag.sh`, `preflight-mesh.sh`, `scripts/bootstrap-full.sh`, `scripts/bootstrap-cli.sh`. You don't need named launchers for larger configurations yet — the peer launch scripts let you manually spin up whatever combination you want. The formal launchers make sense once the patterns stabilize.

**Antigravity (browser-based Gemini IDE agent):** `ag.js` (CDP/Puppeteer injection), `ANTIGRAVITY.md`, all AG-related bootstrap logic, AG telemetry watcher. AG is the most complex transport and requires Chrome DevTools Protocol, puppeteer-core, and a running Antigravity instance. Not needed for your CLI-first workflow.

**Identity stamping:** `identity.js` from `platform_alpha`, extending it to all 4 agents, adding `[ID team=... sender=... agent=...]` metadata to every message. Nice for forensics but not essential when you're the only operator with a handful of agents.

**Courier fallback:** `courier.js`, `codex_outbox/` directory, file-watcher sidecar for sandboxed Codex. Only needed if Codex can't do direct comms. Deferred.

**The Comms Monitor dashboard:** `interlateral_comms_monitor/` — the full Express+WebSocket+React dashboard with hot-swappable skins, real-time streaming, direct injection UI, and export. This is the mesh-mode observation tool. Deferred until you're running enough agents to need it.

**Lightweight duo-mode live view:** `scripts/watch-session.sh` (the polling wrapper for duo mode that shows agent status and recent messages). Even this simpler observation tool can wait — tmux panes and `comms.md` are enough for now.

**Structured event stream:** `.observability/events.jsonl` as the single canonical append-only event substrate. The full event schema with 16+ event types, `correlation_id`, `launcher_mode`, operational state events (`agent_blocked`, `agent_degraded`, `skill_timeout`), and approval workflow events (`approval_requested`/`granted`/`denied`). This is the foundation of the mature observability model but is premature for v0.1.

**OTEL traces and telemetry pipeline:** OpenTelemetry integration, trace extraction, telemetry discovery (`discover-cc-logs.sh`), log rotation (`rotate-logs.sh`), asciinema terminal recordings, `scripts/harvest-native-logs.sh`. All the structured observability infrastructure beyond basic comms.md logging.

**Lake Merritt eval system:** The full LLM-as-judge evaluation framework, 7 eval packs, `evals/` directory (renamed from `corpbot_agent_evals/`), `run-skill-eval.sh`, `export-skill-run.sh`, `run-test4.sh`, `EVALS_GUIDE.md`, `scripts/preflight-wakeup.sh`. Powerful but a whole subsystem unto itself.

**Session artifact packages:** `.observability/sessions/<session-id>/` with `manifest.json`, `session-report.md`, `decisions.md`, `links.json`. Typed artifact model (code patch, document, decision record, eval result, screenshot, transcript, prompt artifact, research note). Link-not-copy policy. Export-to-archive tooling (`scripts/export-session.sh`). The entire first-class artifact plane.

**Machine-readable Skills registry:** `skills/registry.json` generated index with skill name, description, roles, expected outputs, launcher compatibility. The `/skills` command UX. Skill composability. Skill lifecycle event emission and outcome logging per run.

**HyperDomo manager-agent orchestration:** The manager agent pattern where a supervisor loads project skills, wakes workers, sends prompts, checkpoints state, and generates reports. This is the deepest Skills usage pattern and depends on the simpler Skills working well first.

**Conformance and quality checking:** `INTERNALS_CONFORMANCE.md` (~150KB architecture conformance spec), `conformance-check.sh`, `validate-skills.sh` (advanced validation), the adherence-check skill as an automated validation tool (the skill file itself stays in v0.1 since all skills are kept, but the tooling around running it programmatically is deferred).

**Advanced protocols:** Permission Granting Protocol (agents granting permissions to peers for stuck prompts), Shared House Rule (file access governance), Fresh Session Rule with `# === NEW SESSION ===` markers, graceful degradation logic (formal handling of missing agents).

**Test suite:** Python pytest suite (wake-up tests, capture tests, cleanup tests, wrapper tests). Automated CI validation.

**Project template:** `projects/mesh-hello-world/` example project. Project directory conventions.

**`SKILLS_DEV_GUIDE.md`:** The guide for authoring new Skills. Deferred because you're using existing Skills first, not writing new ones yet.

**`ROADMAP_additions.md`:** The extended 17.8KB roadmap from `interlateral_alpha`. Folded into the new consolidated ROADMAP.md below.

**`.tmux.conf`:** Root-level tmux configuration from `interlateral_alpha`.

---

## ROADMAP.md

Here's the file content:Here's your ROADMAP.md. To recap the split:

**v0.1 HAS** — the stuff you use every day: `me.sh` duo launcher, peer launch helpers to spin up more Codex/CC/Gemini CLI agents on demand, the full 17-skill catalog in `.agent/skills/`, LIVE_COMMS.md, comms.md session logging, basic tmux-config, agent instruction docs (CLAUDE.md, AGENTS.md, GEMINI.md), SKILLS.md, TROUBLESHOOTING.md, and a shutdown script. That's a working multi-agent system you can use right now.

**ROADMAP has everything else**, organized into five tiers: (1) near-term friction fixes like identity stamping and courier fallback, (2) architectural unification like router.js/session.js and the mesh launcher family, (3) full observability including the dashboard, event stream, OTEL, evals, and session reports, (4) Antigravity/browser-agent support, and (5) long-term hardening like HyperDomo orchestration, conformance checking, test suites, and skill composability.

Every single capability from all five source repos and every novel addition from the reconciliation is accounted for — either in v0.1 or in the roadmap. Nothing dropped.

---

## ROADMAP — interlateral_agents

**Current state:** v0.1 (Starter Scope)
**What v0.1 has:** `me.sh` duo launcher, peer launch helpers for scaling agents (Codex, CC, Gemini CLI), full Skills catalog, LIVE_COMMS.md, comms.md logging, basic tmux config, agent instruction docs, shutdown script.

Everything below is deferred from v0.1, organized by priority tier. Nothing has been dropped — it is all here, waiting for the right moment.

---

## Tier 1: Add When You Feel the Pain (Near-Term)

These are things you'll likely want within weeks of using v0.1 daily. They address friction you'll hit quickly.

### 1.1 Identity Stamping
- Import `identity.js` from `interlateral_platform_alpha`
- Extend to support all agent types (cc, codex, gemini, ag, relay, human)
- Add `[ID team=... sender=... agent=... sid=...]` metadata to every injected message
- Add `INTERLATERAL_AGENT_TYPE` environment variable per agent session
- **Why deferred:** Not essential with a small number of agents where you can see who's who. Becomes important when running multiple peers or reviewing logs after the fact.

### 1.2 Courier Fallback for Sandboxed Codex
- Bring in `courier.js` from `interlateral_alpha`
- Set up `codex_outbox/` message queue directory
- File-watcher sidecar that relays Codex messages when direct tmux injection isn't available
- **Why deferred:** v0.1 assumes Codex can do direct comms. If you hit a sandboxing situation where Codex can't inject directly, add courier.

### 1.3 Lightweight Duo-Mode Live View
- Create `scripts/watch-session.sh`
- Simple `watch`-style polling wrapper: last 10 lines of comms.md, agent status via tmux, newest project files
- Explicitly not a TUI — if insufficient, jump to the full dashboard instead
- **Why deferred:** tmux panes + comms.md are enough for early use. This fills the gap between "raw terminal" and "full web dashboard."

### 1.4 Fresh Session Markers and Conventions
- `# === NEW SESSION ===` markers in comms.md at session start
- Automatic clearing or archiving of prior session's comms.md
- Session naming convention (`ia-` prefix recommended)
- **Why deferred:** Manageable manually at first. Becomes important when you're running multiple sessions per day and reviewing logs.

### 1.5 Advanced Skills Validation
- `scripts/validate-skills.sh` — lint all SKILL.md files for required fields, role definitions, and consistent formatting
- **Why deferred:** Skills work as-is. Validation tooling matters when you start editing or authoring new Skills.

---

## Tier 2: Architectural Unification (Medium-Term)

These create the structural backbone that makes the system coherent at scale. Add them once the ad-hoc v0.1 patterns start feeling fragile.

### 2.1 `session.js` — Centralized Session Config
- Single source of truth for: socket path, session names, team ID, ACK timeout values, launcher mode
- Replaces hardcoded values scattered across control scripts and launch helpers
- All control scripts and launchers source their config from this file
- **Why deferred:** Hardcoded values work fine in v0.1 with one launcher. Becomes essential when you have multiple launch modes and peer pools sharing the same conventions.

### 2.2 `router.js` — Centralized Command Dispatch
- Unified send/status/read dispatch for all agents
- Target registry (cc, codex, gemini, ag)
- Fallback order per agent (direct-first, courier if available)
- Unified logging format and identity stamping integration
- Replaces duplicated logic across cc.js, codex.js, gemini.js, ag.js
- **Why deferred:** Individual control scripts work fine when you're calling them directly. Router pays off when you want uniform logging, consistent fallback, and a single interface for Skills and orchestration to target.

### 2.3 `docs/ARCHITECTURE.md`
- Single canonical architecture document explaining: launch modes, DNA layer, Skills layer, observability layer, worker-pool model
- Organized around the five-plane framework: control, comms, skills, artifacts, review
- Replaces the current pattern of layered README drift
- **Why deferred:** You understand the system. This matters when other people need to understand it, or when you return to it after a break.

### 2.4 `docs/EVENT_SCHEMA.md`
- Defines the canonical event format for `.observability/events.jsonl`
- Fields: `ts`, `session_id`, `team_id`, `event_type`, `source`, `target`, `agent_type`, `session_name`, `status`, `skill_name`, `artifact_path`, `correlation_id`, `launcher_mode`, `payload`
- Event types: `session_started`, `session_stopped`, `agent_started`, `agent_ready`, `agent_idle`, `agent_busy`, `agent_blocked`, `agent_degraded`, `message_sent`, `message_received`, `skill_invoked`, `skill_completed`, `skill_timeout`, `skill_failed`, `artifact_created`, `artifact_updated`, `approval_requested`, `approval_granted`, `approval_denied`, `warning`, `error`, `eval_started`, `eval_completed`
- Rule: all human-readable logs and dashboards derive from this stream
- **Why deferred:** comms.md is the v0.1 log. This schema is the foundation of the mature observability model — design it when you're ready to build on it.

### 2.5 `docs/ARTIFACT_MODEL.md`
- Makes agent outputs first-class: typed, indexed, attributable
- Session packages at `.observability/sessions/<session-id>/` containing: `manifest.json`, `session-report.md`, `decisions.md`, `links.json`
- Artifact classes: code patch, document, decision record, eval result, screenshot, transcript, prompt artifact, research note
- Manifest fields: `session_id`, `started_at`, `ended_at`, `agents`, `skills_invoked`, `artifacts`, `errors`, `summary`
- Link-not-copy policy (artifacts stay where agents create them; session packages are indexes, not archives)
- Retention policy: session packages retained indefinitely; raw telemetry follows rotation; event streams archived per session
- Export-to-archive deferred to Tier 3
- **Why deferred:** Agent outputs currently live wherever agents put them. This formalizes the model — add it when you want structured reviewability.

### 2.6 Machine-Readable Skills Registry
- Generate `.agent/skills/registry.json` from SKILL.md files
- Fields per skill: name, one-line description, roles, expected outputs, launcher compatibility (me, mesh-no-ag, mesh, preflight)
- Generator script that re-indexes on demand
- Foundation for future `/skills` command UX and skill composability
- **Why deferred:** You can read SKILLS.md. The registry matters for tooling that needs to programmatically discover and route to Skills.

### 2.7 Mesh Launcher Family
- `mesh.sh`: full quad-agent mesh (CC + Codex + Gemini CLI + AG) with dashboard
- `mesh-no-ag.sh`: CLI-only trio/quad (CC + Codex + Gemini CLI, no AG)
- `preflight-mesh.sh`: formal mode with eval hooks and stronger review surfaces
- `scripts/bootstrap-full.sh` and `scripts/bootstrap-cli.sh` supporting the above
- Clear semantic distinction: `me` = duo fast path, `mesh` = multi-agent system
- **Why deferred:** v0.1 uses `me.sh` + manual peer launches. Named mesh launchers formalize the common configurations once you know which ones you actually use.

---

## Tier 3: Full Observability and Review (Medium-to-Long-Term)

These make the system observable, reviewable, and auditable. They turn raw logs into understanding.

### 3.1 Structured Event Stream
- `.observability/events.jsonl` as the one append-only canonical substrate
- All control scripts emit events when they send, receive, start, stop, fail
- `comms.md` becomes a derived/synchronized human view, not the source of truth
- Skill invocations emit `skill_invoked` and `skill_completed` events with `correlation_id`
- Operational state events: `agent_blocked`, `agent_degraded`, `skill_timeout`, `skill_failed`
- Approval workflow events: `approval_requested`, `approval_granted`, `approval_denied`
- **Depends on:** EVENT_SCHEMA.md (2.4), router.js (2.2) recommended but not required

### 3.2 Comms Monitor Dashboard
- Import `interlateral_comms_monitor/` from `interlateral_alpha`
- Express + WebSocket backend, React + Vite frontend
- Hot-swappable skins (Cockpit, Timeline, Focus, and others)
- Real-time streaming of agent messages
- Direct injection from dashboard UI
- Export (JSON/TXT/CSV)
- Adapt to read from event stream (3.1) when available
- **Depends on:** More valuable once you're running 3+ agents regularly

### 3.3 OTEL Traces and Telemetry Pipeline
- OpenTelemetry integration for structured traces
- Trace extraction tooling
- `scripts/discover-cc-logs.sh` — find Claude Code's native log paths
- `scripts/rotate-logs.sh` — log rotation and archival
- `scripts/harvest-native-logs.sh` — collect native agent logs
- Asciinema terminal recordings (`logged-claude.sh`, `logged-ag.sh`)
- `.observability/` directory structure: traces/, casts/, logs/
- **Depends on:** EVENT_SCHEMA.md (2.4)

### 3.4 Session Artifact Packages
- Generate `.observability/sessions/<session-id>/session-report.md` at session end
- Include: which agents participated, which Skills were invoked, key decisions, artifacts produced, errors/timeouts, links to traces
- Generate `manifest.json` and `links.json` per session
- Artifact indexing so you can find what agents produced
- `scripts/export-session.sh` for portable session archives
- **Depends on:** ARTIFACT_MODEL.md (2.5), event stream (3.1) recommended

### 3.5 Lake Merritt Evaluation System
- `evals/` directory (renamed from `corpbot_agent_evals/`)
- LLM-as-judge quality evaluation with 7 eval packs
- OTEL trace scoring
- `scripts/run-skill-eval.sh` — run eval on a completed skill run
- `scripts/export-skill-run.sh` — package a skill run for evaluation
- `scripts/run-test4.sh` — automated test framework
- `EVALS_GUIDE.md` — how to use the eval system
- `scripts/preflight-wakeup.sh` — launch with eval hooks active
- **Depends on:** OTEL traces (3.3), event stream (3.1) for full power; can run in limited mode against comms.md earlier

---

## Tier 4: Antigravity and Browser-Based Agents (When Needed)

AG is the most complex transport. Add it when you specifically need a browser-based Gemini IDE agent.

### 4.1 AG CDP Transport
- `interlateral_dna/ag.js` — Chrome DevTools Protocol injection via puppeteer-core into Antigravity's Electron app
- Port 9222 connection, iframe navigation, contenteditable injection
- Read, screenshot, and watch capabilities
- puppeteer-core dependency (^22.15)
- `ANTIGRAVITY.md` — agent instruction file for AG

### 4.2 AG Telemetry and Observation
- AG-specific telemetry watcher
- AG pane capture and screenshot tooling
- AG log integration into the event stream

### 4.3 Full Quad-Agent Bootstrap
- Integration of AG into `bootstrap-full.sh`
- AG health checks and readiness reporting
- Graceful degradation when AG is unavailable

---

## Tier 5: Advanced Orchestration and Hardening (Long-Term)

These turn the system from a tool for one operator into a robust platform.

### 5.1 HyperDomo Manager-Agent Orchestration
- Manager agent loads project skills, wakes workers, sends prompts, checkpoints state, generates reports
- Deepest form of Skills usage — Skills become addressable workflow primitives, not just instruction files
- Worker orchestration across agent pools
- **Depends on:** router.js (2.2), session.js (2.1), Skills registry (2.6)

### 5.2 Skill Composability and Lifecycle
- Chain Skills: "First use negotiation to decide the approach, then use dev-collaboration to build it"
- Skill invocations as first-class events with metadata: who invoked, which agents, which roles, expected artifacts, actual outputs, completion status
- Three instrumentation options: (1) agent self-reporting in Phase 2, (2) router-mediated in Phase 4, (3) wrapper-based in Phase 4
- `/skills` command UX for humans to see available Skills with one-line descriptions
- **Depends on:** Skills registry (2.6), event stream (3.1)

### 5.3 Permission Granting Protocol
- Formal protocol where a peer agent can observe another agent's terminal and approve stuck prompts
- Explicit doctrine in agent instruction files
- Permission state events in the event stream
- Review surface for approval chains
- **Depends on:** event stream (3.1), approval events in EVENT_SCHEMA

### 5.4 Shared House Rule and Governance
- Explicit file access governance across agents
- Which agents can read/write which directories
- Enforcement and logging of access patterns

### 5.5 Conformance and Quality System
- `INTERNALS_CONFORMANCE.md` (~150KB architecture conformance spec) from `interlateral_alpha`/`design_pattern_factory`
- `scripts/conformance-check.sh` — automated conformance validation
- `adherence-check` skill as a tooling-backed validation (the SKILL.md is already in v0.1; the automated tooling around it is here)
- `INTERNALS_GUIDE.md`

### 5.6 Worker Pool Normalization
- Standardize peer-pool conventions across Codex and Gemini CLI
- Consistent naming, session management, and status reporting for pools
- Connect pools to router/session model
- Pool health monitoring and auto-recovery

### 5.7 Automated Test Suite
- Python pytest suite: wake-up tests, capture tests, cleanup tests, wrapper tests
- CI integration
- Regression testing for control scripts and launch modes

### 5.8 Skills Development Guide and Authoring Tooling
- `SKILLS_DEV_GUIDE.md` — how to author new Skills
- Skills development workspace conventions (from `design_pattern_factory`)
- Promotion workflow: draft → test → canonical

### 5.9 Project Template and Conventions
- `projects/mesh-hello-world/` example project
- Convention for where deliverables go (`projects/<project-name>/`)
- Skill-specific output location conventions

### 5.10 Root-Level tmux Configuration
- `.tmux.conf` at repo root from `interlateral_alpha`
- Standardized tmux settings for agent sessions

---

## Provenance Notes

This roadmap consolidates capabilities from five source repos:

| Source Repo | Role |
|---|---|
| `interlateral_platform_alpha` | Duo launcher kernel, identity.js, peer helpers, tmux ergonomics |
| `interlateral_prototype_alphasa_uiax` | Historical AG/CDP reference, dashboard lineage |
| `interlateral_design_pattern_factory` | Skills workshop, conformance spec source, minimal pattern reference |
| `interlateral_alpha-upstream` | Quad-agent distribution template, evals, Skills catalog |
| `interlateral_alpha` | Most mature reference implementation — primary base for final repo |

Novel additions proposed during reconciliation (not from any existing repo):
- `router.js` and `session.js` (architectural unification)
- Machine-readable Skills registry (`registry.json`)
- Structured event stream as single source of truth
- Session artifact packages with manifests and reports
- `docs/ARCHITECTURE.md`, `docs/EVENT_SCHEMA.md`, `docs/ARTIFACT_MODEL.md`
- Five-plane conceptual framework (control, comms, skills, artifacts, review)
- `watch-session.sh` lightweight duo-mode live view
- `launch-gemini-peer.sh` for Gemini CLI worker-pool symmetry
- Formal event types for operational state and approval workflows

Nothing from the original five repos or the reconciliation proposal has been dropped. Everything is either in v0.1 (HAS) or in this roadmap.

_____

# RESPONSE 02_CH

# HAS

The 0.1 starter should be a **small, runnable control repo** built for immediate use, not the full final architecture. Its job is to give you a clean duo mode, a clean path to add more agents, retained Skills, live comms, and basic records — nothing more. That aligns with the final synthesis’s “very easy starting mode” and “progressive ladder” approach, but stops before the broader architecture and review stack.  

## 1) Clean simple 2-agent mode

Keep `me.sh` as the obvious default entrypoint: Claude Code + Codex, minimal friction, fast startup, tmux-based, direct comms, ACK discipline, and the strongest human ergonomics from `interlateral_platform_alpha`. This is the right “start here now” mode.   

## 2) Easy way to spin up more agents

Include a **small launcher family**, but keep it minimal:

* `me.sh` for Claude + Codex
* `mesh-no-ag.sh` for Claude + Codex + Gemini CLI
* `mesh.sh` for full mesh including Antigravity
* `scripts/launch-codex-peer.sh`
* `scripts/send-codex-peer.sh`
* `scripts/launch-gemini-peer.sh`

That gives you the easy expansion path you asked for: more Codex agents, more Claude/Claude Code sessions via the same tmux/session model, and Gemini CLI peers, without dragging in the rest of the platform. The final proposal explicitly preserves Codex worker helpers and adds Gemini peer symmetry.   

## 3) Keep Skills and make them usable now

Keep `.agent/skills` as the canonical Skills source, with deployed copies for the active agents and a simple `SKILLS.md` humans can actually use. For 0.1, the important thing is not the full registry/index system; it is that you can start agents and invoke Skills in prompts right away. The final synthesis is very clear that `.agent/skills` stays canonical and Skills remain first-class.   

## 4) Live Comms

Keep `LIVE_COMMS.md` and keep the runtime direct-first:

* direct tmux injection is primary
* courier is fallback only
* explicit session naming and socket discipline stay in place
* message identity stamping should stay, because it is one of the most useful low-cost pieces from `platform_alpha`

This preserves the operational core without requiring the larger monitor/replay system.  

## 5) Basic logging and records

Keep:

* `comms.md`
* basic session logs
* enough pane capture / send helpers from `tmux-config.sh` to support review and debugging
* fresh per-session records

For 0.1, `comms.md` can remain a primary human-readable record. You do not need the full structured event substrate yet. The existing repos all rely on comms logs heavily, and the final proposal only moves beyond that in the larger architecture.  

## 6) Small supporting core only

Keep only the smallest necessary core files:

* `cc.js`
* `codex.js`
* `gemini.js`
* `ag.js`
* `courier.js`
* `interlateral_dna/identity.js`
* one merged `scripts/tmux-config.sh`
* `leadership.json`
* `CLAUDE.md`
* `AGENTS.md` or `CODEX.md`
* `GEMINI.md`
* `ANTIGRAVITY.md`
* `SKILLS.md`
* `LIVE_COMMS.md`

That is enough to run the system, organize agent behavior, and keep operations understandable.  

# DOES NOT HAVE

The 0.1 starter should **not** include the broader “final architecture” items that make the system sprawl. Those should be deferred, even if they were recommended for the eventual repo. The right rule is: if it is not needed to run the duo mode, expand to more agents, use Skills, maintain live comms, or keep basic records, it stays out of 0.1.  

## 1) No full dashboard / monitor stack

Do not include:

* `interlateral_comms_monitor`
* WebSocket streaming UI
* skins/themes
* live web dashboard
* replay UI
* export UI

Those are valuable later, but they are not required for your immediate starter. They belong in roadmap, not in the initial repo.  

## 2) No evals / Lake Merritt / formal review system

Do not include:

* eval packs
* LLM-as-judge
* OTEL trace scoring
* `run-skill-eval.sh`
* `export-skill-run.sh`
* `corpbot_agent_evals/`
* formal preflight / review orchestration

Those are real capabilities in `interlateral_alpha`, but they are exactly the kind of “good later, not now” complexity you want to avoid in 0.1.  

## 3) No structured event / artifact architecture yet

Do not include, yet:

* append-only structured event stream as source of truth
* `artifacts/<session-id>/manifest.json`
* session artifact packaging
* `session-report.md`
* explicit artifact model
* explicit event schema

Those were additions in the synthesized final proposal beyond the existing repos, but they are not required for your starter build. For now, basic logs and `comms.md` are enough.  

## 4) No `router.js` and no `session.js` in 0.1

These were smart architectural additions for the fuller repo, but for your bite-sized start they are optional complexity. You can keep launch/session logic simpler at first and add these when you are ready to normalize the control and comms planes.  

## 5) No product-app/platform features

Do not include anything from `platform_alpha` that belongs to the product/application layer:

* REST API server
* debate/event modules
* database
* auth / registration / onboarding
* GCP infrastructure
* billing / ops guardrails
* admin console
* simulation runners

Those were explicitly identified as product-repo concerns, not control-repo concerns.  

## 6) No historical/debug baggage

Do not include:

* AG auxiliary debug scripts from `prototype_alphasa_uiax`
* older historical dashboard/debug plumbing
* docs or files kept only for lineage/reference
* mixed old courier-first patterns

Those are reference material, not starter-state necessities. 

## 7) No full conformance/documentation suite

Do not include in 0.1:

* full `INTERNALS_CONFORMANCE.md`
* `INTERNALS_GUIDE.md`
* conformance checking scripts
* broad documentation tree
* historical docs archive
* full project/examples/test suite carried over wholesale

Keep docs minimal and operational for now.  

## 8) No HyperDomo or broader observability stack

Do not include:

* HyperDomo path
* OTEL extraction / trace conventions
* traces / casts / richer observability directories
* session recordings / archival system beyond simple logs

These are useful later, but not necessary for the small starter you described.  

# ROADMAP.md

Your `ROADMAP.md` should contain **everything intentionally excluded from 0.1**, organized so you do not lose any capability. The main sections should be these.

## 1) Architecture normalization

Add later:

* `interlateral_dna/router.js`
* `interlateral_dna/session.js`
* stronger unified routing/session model
* clearer control/comms/skills/artifacts/review separation
* explicit session and naming invariants

This is the first major “grow up” step after 0.1.  

## 2) Better Skills infrastructure

Add later:

* `skills/registry.json`
* machine-readable Skills catalog
* Skills cleanup pass
* stale-path cleanup
* standardized role names / termination conventions
* richer Skills discoverability and UX

0.1 keeps Skills working; roadmap makes Skills systematic.  

## 3) Rich observability and dashboard

Add later:

* `interlateral_comms_monitor`
* lightweight duo watcher such as `scripts/watch-session.sh`
* richer mesh dashboard
* live status surfaces
* replay surfaces
* exports
* WebSocket streaming
* session recordings / archival

These were part of the mature mesh repos and the synthesized future direction, but not needed to start.  

## 4) Event, artifact, and review model

Add later:

* append-only structured event stream
* `docs/EVENT_SCHEMA.md`
* `docs/ARTIFACT_MODEL.md`
* artifact manifests
* session packaging
* session report generation
* stronger after-action review flow

This is one of the biggest “beyond existing repos” additions and should be preserved in roadmap explicitly.  

## 5) Formal evals and quality/conformance

Add later:

* Lake Merritt eval system
* skill eval scripts
* eval packs
* OTEL scoring
* conformance docs
* conformance checks
* adherence-check integration
* stronger test suite

This keeps the 0.1 repo light while preserving the quality path.  

## 6) Deeper launcher and pool evolution

Add later:

* `preflight-mesh.sh`
* richer supervision and readiness reporting
* manager-worker orchestration
* larger Codex/Gemini pools
* more formal launcher ladder behavior
* stronger shutdown/cleanup lifecycle

Your 0.1 already has the minimal launcher family; roadmap is where you grow it into a more formal orchestration system. 

## 7) Product/platform capabilities explicitly out of scope

Add a roadmap section that says these are **not part of this repo unless strategy changes**:

* API server
* debate/event systems
* DB/auth/onboarding
* GCP infra
* admin UI
* simulation runners

This is important so the repo does not drift back into product-app scope.  

## 8) Historical/reference material

Add later only as reference imports if truly needed:

* prototype AG debug helpers
* older lineage docs
* design-pattern examples as reference only
* historical notes and migration docs

These should be treated as reference sources, not starter-state code.  

## Recommended 0.1 framing for you

In one line: **build the repo as “duo-first, mesh-capable, Skills-kept, comms-live, logs-basic.”** Everything else goes into `ROADMAP.md`. That gives you something you can actually start coding now without losing the larger plan.  

_____

# RESPONSE 03_GK

**# HAS**

The 0.1 starter repo (`interlateral_agents`) is deliberately minimal and focused **only** on these five things you asked for:

1. **Clean simple 2-agent thing**  
   - `./me.sh` — the exact fast duo launcher (Claude Code + Codex) you are already using.  
   - Boots two tmux sessions, does mutual ACK handshake, prints “Ready to Rock!”, and is ready in <5 seconds.  
   - Uses `interlateral_dna/cc.js` and `codex.js` for direct tmux injection (Ledger + Whip pattern).

2. **Easy way to spin up more agents**  
   - `scripts/launch-codex-peer.sh` and `scripts/send-codex-peer.sh` (imported from platform_alpha) so you can instantly add as many extra Codex instances as you want.  
   - Simple equivalent helpers for extra Claude Code instances and Gemini CLI agents (basic launch scripts that reuse the same tmux socket).  
   - All extra agents join the **same shared comms.md** automatically.

3. **Easy way to start using SKILLS files**  
   - `.agent/skills/` directory with all 16–17 Skills copied from `interlateral_alpha` (canonical location).  
   - Top-level `SKILLS.md` index so you can see what’s available.  
   - Agents are instructed (via merged CLAUDE.md / AGENTS.md) to read and follow any Skill you name in your prompt, e.g. “Use the dev-collaboration skill…”.

4. **Live Comms**  
   - Full Ledger + Whip: every message is both injected live into the target agent **and** appended to the shared `comms.md` ledger.

5. **Basic logging/records**  
   - `comms.md` (fresh each session) as the single human-readable record of everything said.  
   - Simple tmux pane capture and console output for visibility.

**That’s it.** The entire 0.1 repo is built around these five capabilities and nothing more. You can start using it **today** exactly like your current `me.sh` workflow, but now with Skills and the ability to spin up extra agents on demand.

**# DOES NOT HAVE**

Everything else is **explicitly excluded** from 0.1 (no bloat, no complexity):

- No full-mesh launchers (`mesh.sh`, `mesh-no-ag.sh`, `preflight-mesh.sh`, etc.)
- No Antigravity / Gemini IDE / CDP support (`ag.js` is not present)
- No Comms Monitor dashboard or WebSocket UI
- No `router.js` or `session.js` (the new DNA abstractions)
- No structured event stream (`.observability/events.jsonl`)
- No Lake Merritt evals or any evaluation system
- No OTEL traces, asciinema casts, log rotation, or advanced observability
- No artifact/session packages or `session-report.md`
- No HyperDomo / manager-worker orchestration
- No permission-granting protocol or Shared House Rule enforcement
- No leadership.json (beyond the simple duo)
- No `.claude/skills/` or `.codex/skills/` deployed copies or `deploy-skills.sh`
- No `watch-session.sh`, preflight checks, or shutdown scripts
- No docs/ARCHITECTURE.md, EVENT_SCHEMA.md, ARTIFACT_MODEL.md, or any phase-0 design docs
- No five-plane architecture implementation
- No worker-pool symmetry beyond the basic Codex helpers already listed in HAS

All of the above (and every other capability mentioned in the original reports) is deliberately deferred.

**# ROADMAP.md**

```markdown
# Interlateral Agents — ROADMAP

This file contains **everything** that is intentionally excluded from the 0.1 starter but will be added in future versions.

## v0.2 – Mesh Foundations (next)
- Add `mesh-no-ag.sh` (CLI trio: CC + Codex + Gemini CLI)
- Add `mesh.sh` (full quad mesh with Antigravity)
- Introduce `interlateral_dna/session.js` and `router.js`
- Merge full tmux-config.sh helpers (agent_send, codex_send_clean, etc.)
- Deploy Skills copies to `.claude/skills/` and `.codex/skills/`
- Add `launch-gemini-peer.sh` for symmetric Gemini worker pools

## v0.3 – Observability & Review
- Single structured `.observability/events.jsonl` event stream
- Lightweight `watch-session.sh` for duo mode
- Full Comms Monitor dashboard (interlateral_comms_monitor/)
- Basic session packages under `.observability/sessions/<id>/` (manifest + session-report.md)

## v0.4 – Polish & Production Readiness
- Full Lake Merritt LLM-as-judge eval system
- OTEL traces, asciinema casts, log rotation
- Permission Granting Protocol + Shared House Rule
- HyperDomo / manager-worker orchestration
- `preflight-mesh.sh` with evals and traces
- Export-session.sh for portable archives

## v1.0 – Mature Multi-Agent Platform
- Five-plane architecture fully implemented (control, comms, skills, artifacts, review)
- Machine-readable `registry.json` for Skills
- Approval/permission state events
- Advanced Skill instrumentation and correlation IDs
- Comprehensive docs/ARCHITECTURE.md, EVENT_SCHEMA.md, ARTIFACT_MODEL.md
- Community contribution guidelines and Skills expansion pipeline

## Long-term (post v1.0)
- Dynamic worker pools under manager control
- Mixed human + agent teams
- Integration hooks with the platform product (interlateral_platform_alpha)
- Public Skills marketplace / community library

**Rule for all future work:**  
Never add anything to the 0.1 core unless it directly serves the five HAS items above. Everything else belongs in this ROADMAP and will be implemented as separate, incremental releases.

Current version: **0.1** (simple duo + Skills + peer spawning)
Next target: **0.2**
```

You can now create the repo, drop in the files listed under **# HAS**, and start building immediately. The ROADMAP.md above is ready to copy-paste into the root. Let me know when you want the exact file list + copy commands for the 0.1 skeleton!

_______________

# BEST AND FINAL 0.1 VERSION FOLLOWS

**Project:** Interlateral Agents
**Repo:** `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents`
**Version:** 0.1 (Starter Scope)
**Date:** 2026-04-02

## Top-Line Scope Summary

v0.1 is a bite-sized, working multi-agent starter. It has exactly five things: a fast duo launcher (`me.sh`), peer launch helpers to spin up more CLI agents on demand, the full 16-skill collaboration catalog, direct live comms via tmux injection, and basic `comms.md` session logging. Everything else is deferred to `ROADMAP.md` — nothing is dropped, nothing is forgotten.

An agent reading this section should be able to build the entire v0.1 repo from the file structure, donor map, and build plan below.

---

# HAS

## 1. The duo launcher

`/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/me.sh`

One command. Boots Claude Code + Codex in tmux sessions on a shared socket. Mutual ACK handshake. Done in seconds. This is the daily driver.

## 2. Peer launch helpers

```
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/launch-codex-peer.sh
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/send-codex-peer.sh
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/launch-cc-peer.sh
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/launch-gemini-peer.sh
```

Spin up additional Codex, Claude Code, or Gemini CLI agents on demand. All reuse the same tmux socket from `tmux-config.sh`. All join the same `comms.md` conversation.

## 3. Full Skills catalog

```
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/          # canonical source (all 16 skills)
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.claude/skills/          # deployed copy for Claude Code
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.codex/skills/           # deployed copy for Codex
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/SKILLS.md               # human-readable index
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/deploy-skills.sh # push canonical -> deployed
```

Skills included: peer-collaboration, negotiation, hierarchical, democratic, competition, constitutional, dev-collaboration, dev-competition, publication-pipeline, add-comments, adherence-check, hyperdomo, test-4-series, evals, search-synth, create-skin, and any additional skill present in the `interlateral_alpha` canonical set.

Human invokes a Skill by naming it in a prompt: "Use the dev-collaboration skill. CC is Drafter, Codex is Reviewer+Breaker."

## 4. Live Comms DNA

```
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/cc.js          # inject into Claude Code tmux pane
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/codex.js       # inject into Codex tmux pane
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/gemini.js      # inject into Gemini CLI tmux pane
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/identity.js    # message stamping (26 lines, zero deps)
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/leadership.json # who leads, collaborative mode config
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/LIVE_COMMS.md  # canonical comms reference
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/comms.md       # fresh each session, running ledger
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/package.json   # metadata only (no runtime deps in 0.1)
```

All comms are direct-first. No courier in v0.1. Identity stamping is on by default so messages from multiple peers are distinguishable.

## 5. Basic logging and records

`comms.md` is the human-readable session record. tmux pane capture via `tmux-config.sh` helpers provides visibility into each agent's terminal. That's the paper trail for v0.1.

## 6. Minimal supporting files

```
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/tmux-config.sh   # shared socket, session names, send/capture helpers
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/shutdown.sh       # kill tmux sessions cleanly
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/README.md                # how to use me.sh, peers, Skills
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/CLAUDE.md                # CC boot protocol + Skills awareness
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/AGENTS.md                # Codex instructions
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/GEMINI.md                # Gemini CLI instructions
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/TROUBLESHOOTING.md       # common issues and fixes
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/ROADMAP.md               # everything deferred from 0.1
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.gitignore
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.env.example
```

---

# DOES NOT HAVE

Everything below is intentionally excluded from v0.1 and captured in ROADMAP.md. Nothing is dropped.

- **Antigravity / browser agents:** `ag.js`, `ANTIGRAVITY.md`, CDP, puppeteer-core. AG is the most complex transport and not needed for CLI-first workflow.
- **Mesh launchers:** `mesh.sh`, `mesh-no-ag.sh`, `preflight-mesh.sh`, `bootstrap-full.sh`, `bootstrap-cli.sh`. Peer helpers cover manual expansion for now.
- **Architectural abstractions:** `router.js`, `session.js`, `docs/ARCHITECTURE.md`, `docs/EVENT_SCHEMA.md`, `docs/ARTIFACT_MODEL.md`. Valuable but premature — add when you feel the pain.
- **Comms Monitor dashboard:** `interlateral_comms_monitor/` (Express, WebSocket, React, skins). Not needed when tmux panes and comms.md suffice.
- **Structured event stream:** `.observability/events.jsonl`, event schema implementation, operational state events, approval workflow events.
- **Artifact/session packages:** `.observability/sessions/<id>/`, manifests, session reports, link-not-copy model, export tooling.
- **Lake Merritt evals:** `evals/`, eval packs, `run-skill-eval.sh`, `export-skill-run.sh`, `EVALS_GUIDE.md`.
- **OTEL and telemetry pipeline:** Traces, asciinema casts, `discover-cc-logs.sh`, `rotate-logs.sh`, `harvest-native-logs.sh`, advanced log rotation.
- **HyperDomo / advanced orchestration:** Manager-worker patterns, formal pool supervision, Skill lifecycle instrumentation.
- **Courier fallback:** `courier.js`, `codex_outbox/`. Direct comms is sufficient in v0.1.
- **Heavy docs/conformance/tests:** `INTERNALS_CONFORMANCE.md`, `conformance-check.sh`, `INTERNALS_GUIDE.md`, Python pytest suite, `SKILLS_DEV_GUIDE.md`.
- **Advanced protocols:** Permission Granting Protocol, Shared House Rule enforcement, Fresh Session markers.
- **Machine-readable Skills registry:** `.agent/skills/registry.json`, generator script, `/skills` command UX.
- **Product/platform code:** API server, database, auth, GCP, admin UI, event modules, simulation runners — all stay in `interlateral_platform_alpha`.

---

# PROPOSED FILE STRUCTURE

```
/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/
├── me.sh                                    # duo launcher (CC + Codex)
├── CLAUDE.md                                # CC instructions (simplified)
├── AGENTS.md                                # Codex instructions
├── GEMINI.md                                # Gemini CLI instructions
├── SKILLS.md                                # human-readable Skills index
├── README.md                                # getting started guide
├── TROUBLESHOOTING.md                       # common issues
├── ROADMAP.md                               # everything deferred from 0.1
├── .env.example                             # environment template
├── .gitignore                               # standard exclusions
│
├── interlateral_dna/                        # core comms layer
│   ├── cc.js                                # Claude Code tmux injection
│   ├── codex.js                             # Codex tmux injection
│   ├── gemini.js                            # Gemini CLI tmux injection
│   ├── identity.js                          # message stamping
│   ├── leadership.json                      # lead agent + collaborative mode
│   ├── LIVE_COMMS.md                        # canonical comms reference
│   ├── comms.md                             # session ledger (fresh each run)
│   └── package.json                         # metadata
│
├── .agent/skills/                           # canonical Skills (16 skills)
│   ├── peer-collaboration/SKILL.md
│   ├── negotiation/SKILL.md
│   ├── hierarchical/SKILL.md
│   ├── democratic/SKILL.md
│   ├── competition/SKILL.md
│   ├── constitutional/SKILL.md
│   ├── dev-collaboration/SKILL.md
│   ├── dev-competition/SKILL.md
│   ├── publication-pipeline/SKILL.md
│   ├── add-comments/SKILL.md
│   ├── adherence-check/SKILL.md
│   ├── hyperdomo/SKILL.md
│   ├── test-4-series/SKILL.md
│   ├── evals/SKILL.md
│   ├── search-synth/SKILL.md
│   └── create-skin/SKILL.md
│
├── .claude/skills/                          # deployed copy for CC
├── .codex/skills/                           # deployed copy for Codex
│
├── scripts/
│   ├── tmux-config.sh                       # shared socket, names, helpers
│   ├── deploy-skills.sh                     # canonical -> deployed copies
│   ├── shutdown.sh                          # kill tmux sessions
│   ├── launch-codex-peer.sh                 # spin up extra Codex
│   ├── send-codex-peer.sh                   # send to a Codex peer
│   ├── launch-cc-peer.sh                    # spin up extra Claude Code
│   └── launch-gemini-peer.sh                # spin up extra Gemini CLI
│
├── dev_plan/                                # task assignments (human-editable)
│   └── dev_plan.md
│
└── temp/                                    # scratch workspace
```

---

# BUILD PLAN

## Step 1: Create directory structure

Create all directories listed in the file structure above inside `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/`.

## Step 2: Copy DNA layer from interlateral_alpha

Copy control scripts from the most mature source:

```
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/cc.js      /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/codex.js   /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/gemini.js  /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/leadership.json /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/LIVE_COMMS.md   /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/package.json    /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
```

**Adaptation needed for cc.js, codex.js, gemini.js:** Update session names and socket path to match `tmux-config.sh` conventions (see Step 5). Add `identity.js` stamping to the send functions.

## Step 3: Import identity.js from platform_alpha

```
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/interlateral_dna/identity.js /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/
```

**Adaptation needed:** Extend `getIdentity()` to include `agent_type` field. Add `INTERLATERAL_AGENT_TYPE` environment variable support. Keep backward compatibility with existing `stampMessage()` API.

## Step 4: Create comms.md

Create a fresh `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/interlateral_dna/comms.md` with a minimal header:

```markdown
# Comms Log
```

This file is regenerated fresh each session by `me.sh`.

## Step 5: Create tmux-config.sh

Build `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/tmux-config.sh` by merging:

**From platform_alpha** (`/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/scripts/tmux-config.sh`):
- `agent_send` helper function
- `codex_send_clean` helper function
- Long-prompt paste support
- Pane capture helpers
- Idle detection

**From interlateral_alpha** (`/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/scripts/tmux-config.sh`):
- Explicit shared socket path discipline

**Set these values:**
```bash
export INTERLATERAL_TMUX_SOCKET="/tmp/interlateral-agents-tmux.sock"
export CC_SESSION="ia-claude"
export CODEX_SESSION="ia-codex"
export GEMINI_SESSION="ia-gemini"
```

## Step 6: Adapt me.sh from platform_alpha

Start from `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/me.sh`.

**Adaptations needed:**
- Source `scripts/tmux-config.sh` for socket path and session names
- Use session names from tmux-config.sh (`ia-claude`, `ia-codex`), not platform_alpha's names
- Set identity stamping environment variables per session
- Reference this repo's `CLAUDE.md` and `AGENTS.md` in boot prompts
- Keep the mutual ACK handshake and "Ready to Rock!" behavior
- Add pipe-pane telemetry capture to `interlateral_dna/` log files
- Refresh `comms.md` at session start

## Step 7: Create peer launch helpers

**launch-codex-peer.sh and send-codex-peer.sh:**
Start from `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/scripts/launch-codex-peer.sh` and `send-codex-peer.sh`. Adapt to source `tmux-config.sh` and use the shared socket.

**launch-cc-peer.sh:**
New file. Simple script that creates a new tmux session (`ia-claude-peer-NN`) on the shared socket and starts Claude Code in it. Pattern it after `launch-codex-peer.sh`.

**launch-gemini-peer.sh:**
New file. Same pattern but for Gemini CLI. Creates `ia-gemini-peer-NN` sessions. Must use the 1-second input buffer delay documented in `gemini.js`.

## Step 8: Copy Skills from interlateral_alpha

```
cp -r /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/.agent/skills/ /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/.agent/skills/
```

Then create `deploy-skills.sh` based on `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/scripts/deploy-skills.sh`. It should copy `.agent/skills/` contents to `.claude/skills/` and `.codex/skills/`.

Run it once to populate the deployed copies.

## Step 9: Copy SKILLS.md

```
cp /Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/SKILLS.md /Users/dazzagreenwood/Documents/GitHub/interlateral_agents/SKILLS.md
```

**Adaptation needed:** Update any internal paths that reference old repo locations.

## Step 10: Create agent instruction docs

**CLAUDE.md:** Write new, simplified. Include: boot protocol (verify tmux, ACK with Codex), Skills awareness (how to read and follow `.agent/skills/` or `.claude/skills/`), comms rules (direct injection + comms.md ledger), identity stamping. Do NOT include: GCP cost guard, mesh-specific sections, AG-related protocols. Reference files exist at `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/CLAUDE.md` (19.5KB, full mesh version) and `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/CLAUDE.md` (24 lines, cost guard only). The v0.1 version should be ~2-4KB.

**AGENTS.md:** Start from `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/AGENTS.md` (16.7KB). Simplify: keep Codex boot protocol, Skills awareness, direct comms instructions, idle-after-ACK. Remove: mesh-specific sections, courier instructions, quad-agent references. Target ~2-4KB.

**GEMINI.md:** Start from `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/GEMINI.md` (7.2KB). Simplify: keep model pinning, input buffer delay warning, ACK protocol, comms rules. Remove: mesh-specific sections. Target ~1-2KB.

**README.md:** Write new. Sections: What this is (one paragraph), Prerequisites (Node.js 20+, tmux), Quick Start (`./me.sh`), Adding More Agents (peer helpers), Using Skills (name it in your prompt), Troubleshooting (link to TROUBLESHOOTING.md), Roadmap (link to ROADMAP.md).

**TROUBLESHOOTING.md:** Copy from `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/TROUBLESHOOTING.md`. Remove any mesh-specific or AG-specific entries.

## Step 11: Create shutdown.sh

New file at `/Users/dazzagreenwood/Documents/GitHub/interlateral_agents/scripts/shutdown.sh`. Should:
- Source `tmux-config.sh` for socket path
- Kill all sessions on the shared socket
- Print what was stopped

## Step 12: Create .gitignore and .env.example

**.gitignore:** Standard Node.js ignores plus:
```
node_modules/
.env
.env.local
interlateral_dna/comms.md
interlateral_dna/*.log
.observability/
.DS_Store
```

**.env.example:** Minimal template with identity stamping variables:
```
INTERLATERAL_TEAM_ID=agents
INTERLATERAL_SENDER=relay
INTERLATERAL_AGENT_TYPE=
INTERLATERAL_SESSION_ID=
```

## Step 13: Create ROADMAP.md

Use the content from the ROADMAP section below.

## Step 14: Test

1. Run `./me.sh` — verify two agents boot, ACK, print "Ready to Rock!"
2. Run `scripts/launch-codex-peer.sh` — verify a peer Codex session starts
3. Verify `comms.md` shows messages from both agents
4. Verify Skills are readable: agent should be able to read `.claude/skills/dev-collaboration/SKILL.md`
5. Run `scripts/shutdown.sh` — verify all sessions are killed

---

# ROADMAP.md

```markdown
# ROADMAP — Interlateral Agents

Current: **v0.1** (duo launcher + peer helpers + Skills + live comms + basic logs)

Everything below is intentionally excluded from v0.1. Nothing has been dropped.

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

### 1.5 docs/ARTIFACT_MODEL.md
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
- Why deferred: peer helpers cover manual expansion for now

### 2.2 Worker-Pool Normalization
- Standardize peer-pool conventions across Codex and Gemini
- Consistent naming, status reporting, pool health
- Why deferred: basic peer helpers are sufficient at small scale

---

## 3. Skills Infrastructure

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

### 7.1 AG CDP Transport
- interlateral_dna/ag.js (puppeteer-core, port 9222, iframe injection)
- ANTIGRAVITY.md
- Why deferred: most complex transport, not needed for CLI-first workflow

### 7.2 AG Telemetry and Observation
- AG-specific telemetry watcher, screenshots, log integration

### 7.3 Full Quad-Agent Bootstrap
- AG in bootstrap-full.sh, health checks, graceful degradation

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

These stay in interlateral_platform_alpha.

---

## Provenance

Capabilities consolidated from five source repos:

| Source Repo | Role |
|---|---|
| interlateral_platform_alpha | Duo launcher kernel, identity.js, peer helpers, tmux ergonomics |
| interlateral_prototype_alphasa_uiax | Historical AG/CDP reference, dashboard lineage |
| interlateral_design_pattern_factory | Skills workshop, conformance spec source |
| interlateral_alpha-upstream | Quad-agent distribution template, evals, Skills catalog |
| interlateral_alpha | Most mature reference implementation — primary base |

Novel additions from reconciliation: router.js, session.js, event schema, artifact model, five-plane framework, registry.json, watch-session.sh, launch-gemini-peer.sh, approval workflow events.

Nothing from any source or reconciliation has been dropped.
```

---

# SOURCE-OF-TRUTH DONOR MAP

| v0.1 File | Source Repo | Source Path | Adaptation |
|---|---|---|---|
| `me.sh` | interlateral_platform_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/me.sh` | Adapt session names, socket path, boot prompts, identity stamping. Keep ACK handshake behavior. |
| `interlateral_dna/cc.js` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/cc.js` | Update session name to `ia-claude`, socket to match tmux-config.sh, add identity stamping |
| `interlateral_dna/codex.js` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/codex.js` | Update session name to `ia-codex`, socket to match, add identity stamping |
| `interlateral_dna/gemini.js` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/gemini.js` | Update session name to `ia-gemini`, socket to match, add identity stamping |
| `interlateral_dna/identity.js` | interlateral_platform_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/interlateral_dna/identity.js` | Add `agent_type` field, add `INTERLATERAL_AGENT_TYPE` env var |
| `interlateral_dna/leadership.json` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/leadership.json` | No changes needed |
| `interlateral_dna/LIVE_COMMS.md` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/LIVE_COMMS.md` | No changes needed |
| `interlateral_dna/package.json` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/interlateral_dna/package.json` | Remove puppeteer-core dep (not needed without ag.js) |
| `.agent/skills/*` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/.agent/skills/` | Copy entire directory. Update any stale internal paths. |
| `SKILLS.md` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/SKILLS.md` | Update internal path references |
| `scripts/deploy-skills.sh` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/scripts/deploy-skills.sh` | Verify paths match new repo structure |
| `scripts/tmux-config.sh` | MERGE | platform_alpha: `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/scripts/tmux-config.sh` + alpha: `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/scripts/tmux-config.sh` | Merge: platform_alpha helpers (agent_send, codex_send_clean, paste, capture, idle) + alpha socket discipline. Set new session names. |
| `scripts/launch-codex-peer.sh` | interlateral_platform_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/scripts/launch-codex-peer.sh` | Adapt to source tmux-config.sh, use shared socket |
| `scripts/send-codex-peer.sh` | interlateral_platform_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/scripts/send-codex-peer.sh` | Adapt to source tmux-config.sh |
| `scripts/launch-cc-peer.sh` | NEW | — | New file. Pattern after launch-codex-peer.sh but for Claude Code sessions. |
| `scripts/launch-gemini-peer.sh` | NEW | — | New file. Pattern after launch-codex-peer.sh but for Gemini CLI. Must use 1s input delay. |
| `scripts/shutdown.sh` | NEW | — | New file. Source tmux-config.sh, kill all sessions on shared socket. |
| `CLAUDE.md` | NEW (merge) | Reference: `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/CLAUDE.md` + `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/CLAUDE.md` | Write new ~2-4KB simplified version. Boot protocol + Skills + comms rules + identity. |
| `AGENTS.md` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/AGENTS.md` | Simplify to ~2-4KB. Keep boot, Skills, direct comms. Remove mesh/courier/quad. |
| `GEMINI.md` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/GEMINI.md` | Simplify to ~1-2KB. Keep model pin, delay, ACK. Remove mesh. |
| `README.md` | NEW | — | Write new. Quick start, peers, Skills, troubleshooting, roadmap links. |
| `TROUBLESHOOTING.md` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/TROUBLESHOOTING.md` | Remove AG-specific and mesh-specific entries. |
| `ROADMAP.md` | NEW | — | Use content from ROADMAP section above. |
| `.gitignore` | interlateral_alpha | `/Users/dazzagreenwood/Documents/GitHub/interlateral_alpha/.gitignore` | Simplify for v0.1 scope. |
| `.env.example` | NEW | — | Minimal: identity stamping vars only. |

# CLAUDE CHECK

**Verdict:** PASS WITH RISKS

**Findings:**

1. **LOW — ROADMAP.md deferred-skill restoration target paths are aspirational, not live.** The three restoration target paths (e.g., `.agent/skills/create-skin/SKILL.md`) do not currently exist on disk — they describe where skills will be placed when restored. This is now clearly labeled "Restoration target path" vs "Donor source path," so intent is unambiguous. The donor paths in `interlateral_alpha` are confirmed live. No fix needed — flagging for awareness only.

2. **LOW — TROUBLESHOOTING.md leadership.json wording is improved but still references the file.** Line 30 now says leadership.json "is reference-only and does not drive runtime logic," which is accurate and no longer misleading. No fix needed.

3. **INFO — me.sh comms.md refresh now occurs after abort confirmation (line 107), which is correct.** The abort path (`exit 1` at line 103) exits before the ledger is touched. Verified non-regressing.

**What was verified clean:**

- **Skill command paths:** All occurrences of `node cc.js`, `node codex.js`, `node gemini.js`, and `<target_agent_script>.js` are gone from all three skill locations (`.agent/`, `.claude/`, `.codex/`). Replaced with `node interlateral_dna/cc.js send` etc. Deployed copies match canonical (diff confirmed).
- **me.sh abort path:** `comms.md` refresh moved to after the attached-session confirmation gate. User answering "N" now preserves both sessions and the prior ledger.
- **ROADMAP.md deferred skills:** Now shows both restoration target paths (in `interlateral_agents`) and donor source paths (in `interlateral_alpha`). All three donor paths verified live on disk.
- **CLAUDE.md skill count:** Line 55 now says "12 skills" (was "16"). Consistent with README.md, SKILLS.md, and the on-disk 12/12/12 catalog.
- **TROUBLESHOOTING.md:** No longer implies leadership.json controls runtime behavior.
- **No regressions:** Syntax checks pass, skill counts remain 12/12/12, no dead references in skills, no tracked runtime artifacts.

**Reasoning:** All five findings from `temp/revisions-plan-REVIEW.md` have been addressed. The HIGH (broken skill command paths) is fully resolved. The three MEDIUMs (me.sh abort path, ROADMAP dead paths, CLAUDE.md skill count) are fully resolved. The LOW (TROUBLESHOOTING.md) is resolved. Remaining risks are cosmetic/awareness-level only.

# CODEX CHECK

**Verdict:** PASS WITH RISKS

**Findings:** None at blocking or regression level.

**What I checked:**

- The rewritten skill handoff commands now use the real repo paths under `interlateral_dna/` in canonical and deployed copies.
- `me.sh` now refreshes `interlateral_dna/comms.md` only after the attached-session confirmation gate, so aborting preserves the existing ledger.
- `ROADMAP.md` now carries both restoration target paths in `interlateral_agents` and donor source paths in `interlateral_alpha`, which aligns with the source-of-truth donor model in this file and with Dazza's clarification.
- `CLAUDE.md` now reflects the 12-skill v0.1 catalog.
- `TROUBLESHOOTING.md` no longer suggests `leadership.json` controls runtime behavior.

**Verification basis:**

- `bash -n me.sh scripts/*.sh` passed.
- `node --check interlateral_dna/cc.js interlateral_dna/codex.js interlateral_dna/gemini.js interlateral_dna/identity.js` passed.
- Deployed skill copies were resynced and matched the canonical rewritten skills.
- Searches for stale `node cc.js`, `node codex.js`, `node gemini.js`, and `<target_agent_script>.js` patterns in the rewritten skill scope came back clean.

**Residual risk level:** Low. The remaining concerns are documentation/awareness-level only, not functional breakage in the implemented fix set.
