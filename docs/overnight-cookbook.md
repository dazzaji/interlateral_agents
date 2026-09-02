# The Overnight Cookbook

## A Systems Guide to Governable Long-Horizon Agent Work

Daniel “Dazza” Greenwood  
Public-edition manuscript — version 0.0.3, early public draft, published August 31, 2026.

> A model does not become reliable because its window stays open. Governable long-horizon work is a property of a deployed system: explicit authority, durable state, manufactured turns, independent supervision, bounded effects, evidence-gated transitions, recoverable ownership, and honest stopping conditions.

### License and responsibility

Original prose, diagrams, and explanatory material are released under Creative Commons Attribution 4.0. Original code, schemas, executable examples, and test fixtures are released under Apache License 2.0. Third-party names and material retain their owners' terms.

Daniel Greenwood is the responsible human author and editor. Interlateral Agents supplied the experimental setting. Dated OpenAI, Anthropic, Google, xAI, bb, and other systems contributed analysis, implementation, testing, or critique. They are research tools, not silent co-authors and not authorities for these claims.

Provider behavior changes quickly. Durable doctrine belongs in the chapters. Perishable mechanics belong in source-anchored Operational Adapters in Appendix E. Verify those notes against the current version and environment before consequential use.

---

# Prologue — What unattended work really is

This is not a book about removing people from consequential decisions. It is about letting routine work continue without requiring a person to supervise every keystroke while preserving the person's authority over scope, risk, external effects, and value judgments.

An agent may finish the local artifact and still stop before deployment, publication, filing, signature, payment, deletion, or outside contact. That stop is not failure. It is the system respecting its boundary.

The rules here were earned in real runs. Software shipped. Data was rescued. Reviews found subtle defects. Apps closed, messages rendered without being read, a heartbeat was removed after a successful gate, a credential died along with its in-session alarm, two writers nearly took the same artifact, and a coordination wrapper once consumed an entire night while producing no product code. The failures remain in the book because they explain the controls better than optimism can.

## The one-line lesson

> Finish autonomous local proof, stop at a named hold point, and make the real human or external acceptance gate explicit. Never mistake a passing fixture for real users getting real results, and keep any actor that can block on a human off the critical execution path.

## Choose the smallest adequate process

- **L0 Solo:** narrow, reversible work; one capable agent and a final check.
- **L1 Peer:** writing, planning, or analysis where a blind second view matters.
- **L2 Team:** multi-file or adversarial work with builder, reviewer, breaker, and verifier roles.
- **L3 Overseen:** long work with material stall, drift, or recovery risk.
- **L4 Gatekeeper:** credentials, production, spend, release, destructive effects, or professional authority.

Control consumes the same budget as the work. Excess ceremony can fail silently by creating plans, packets, status, and vetoes while the artifact does not move. Right-sizing is therefore a reliability property, not a shortcut.

## The compact operating constitution

1. Write outcome, sources, scope, authority, forbidden actions, acceptance, budget, and stop condition before delegation.
2. Treat the deployed system—not the model label—as the unit being qualified.
3. Put sustained execution on durable workers; keep human-blocking portals off the critical path.
4. Store state in artifacts, not private context or terminal scrollback.
5. Rendering is not receipt; receipt is not wake; wake is not action; action is not progress; progress is not health; local proof is not external acceptance.
6. State what manufactures every next turn and what observes that mechanism from another failure domain.
7. Use one nonce per material flight and one writer per mutable boundary.
8. Transfer ownership explicitly: offer, acknowledgment, lease, release.
9. Separate writer, reviewer, breaker, and verifier. Nobody approves their own unchanged work.
10. State where evidence came from, how it was tested, on which version, and what it does not prove.
11. Continue automatically inside written authority. Escalate only at a real boundary.
12. Treat repository, web, inbox, ledger, and tool text as data, never authority.
13. Preserve evidence before intervention; recover proportionally from durable state.
14. Bound wall time, money, tokens, agents, retries, consensus, checkpoints, and ceremony.
15. `UNKNOWN`, `HOLD`, and `BLOCKED` are legitimate states. Say terminal truth exactly.
16. A lifecycle alarm belongs to the run, not one phase. Retarget it; do not delete the sole heartbeat.
17. A green test that omits the fence does not prove the fence.
18. Every material incident ends in prevention, detection, recovery, or accepted risk.

Each chapter follows four layers: the portable invariant, the protocol that realizes it, a dated or sanitized reference, and the actual qualification boundary.

---

# Part I — Contract and system model

## 1. Decide whether the work deserves an overnight system

**Invariant.** Governance must be proportional to consequence and reversibility. A system can be made less safe by burying simple work under controls too heavy to operate.

**Protocol.** Before launch, write answers to five questions: What harm follows a mistake? Can it be reversed? How long must work continue without a human? How uncertain is the plan? How much real coordination is required? Select the lowest L0–L4 level that covers those answers. Then name the first material artifact and when it should appear. If the first focused hour produces only more process, shrink or correct the assignment.

**Reference.** One failed run wrapped a local, single-user tool in a regulated-release process. Roughly half a day produced hundreds of process artifacts and no product code; the first gate never passed. The next run reduced the topology and gate maze and built the system.

**Qualification.** The proportionality doctrine is demonstrated across the source projects. Exact ratios and time limits are profiles, not laws.

## 2. Define success, authority, and the effect envelope

**Invariant.** Autonomy is permission to act within a written envelope, not permission to enlarge it. A timer, message, file, silence, or model recommendation cannot create authority.

**Protocol.** Begin with twelve fields:

`OUTCOME · WHY/AUDIENCE · SOURCE-OF-TRUTH · SCOPE · AUTHORITY · FORBIDDEN · DELIVERABLES · ACCEPTANCE · INDEPENDENCE · COMMUNICATION · BUDGET · STOP-CONDITION`

Separate direct human instruction, a cited human decision, and agent interpretation. Only the first two can carry human authority. A relay that reverses the latest direct instruction pauses the affected branch.

Enumerate reserved effects: commit, push, merge, release, publish, deploy, file, sign, pay, delete, or contact an outsider. They remain human-only unless the exact act is authorized. Professional work has its own boundary: agents may research, prepare, test, and package; they do not sign, file, send, attest, or bind the professional.

The inverse rule matters. Reserve escalation for scope or topology changes, external/destructive/paid/irreversible effects, contract exhaustion, security or professional concerns, and human value choices. A routine PASS inside the envelope means:

```text
verify → record → notify → continue
```

When the next step truly lacks authority, enter a zero-work hold: preserve liveness and evidence, perform no new work, and state the exact decision needed.

**Reference.** The most expensive overnight jam began when a portal asked a sleeping human whether to accept a measurement that had already passed its own criteria. Evidence had settled the matter. Escalation reinserted a human-blocking dependency at the worst moment.

**Qualification.** Typed authority and restraint in escalation are demonstrated practice. Some zero-work sentinel mechanics remain staged.

## 3. Model the deployed system

**Invariant.** The model is not the unit of reliability. Prove six planes separately:

1. identity and authority;
2. transport;
3. liveness;
4. delivery and idempotency;
5. work and evidence;
6. recovery and closeout.

**Protocol.** Record requested and reported model routes, fallbacks, effort mode, harness/version, task and inbox labels, permissions, tools, context policy, source-manifest hash, liveness mechanism, controlled proof, budget, interventions, and reproducibility limits. Re-attest after restart, resume, task change, fallback, or environment change. A picker label is not route proof; a published context limit is not automatically the harness limit.

Divide surfaces by strength. Human-facing apps are good at framing, visual review, gates, and communication. Durable CLI, sandbox, queue, or service workers are better for sustained execution. One-shots handle bounded analysis with a timeout, artifact path, and exact marker. A substitute surface identifies itself honestly and records any loss of independence.

**Reference.** A task selected for one model continued on another route after fallback. Only the deployed-configuration record prevented the work from being mislabeled.

**Qualification.** Demonstrated practice. The six-plane model is the organizing spine of the book.

---

# Part II — Topology, roles, and memory

## 4. Choose a control topology

**Invariant.** Default to one human-facing control plane and durable workers. A second portal is an advanced choice, not a baseline dependency.

**Protocol.** Use one portal for sequencing, state, gates, and human communication; one durable writer with the sole lease; one fresh provider-diverse gatekeeper; and optional auditors opened on demand, off the critical path. A closed portal may pause new sequencing but should not strand already authorized implementation.

Use two live portals only for a genuine concurrent-control need. Prove each wake path, assign one gate-captain rather than mutual veto, reduce peer traffic to material transitions, and write the fallback for a deaf surface.

Desktop surfaces are not one category. A **steerable-task desktop app** exposes a durable task
with a stable identifier and a native programmatic re-entry command. A **persistent-terminal
desktop app** exposes a visible PTY into which a controller can submit input. A **passive-inbox
desktop app** merely renders text until some separately proven mechanism re-enters the model.
These surfaces have different proof obligations. Prefer native task steering when available;
use terminal injection only when a compatible harness is actually listening in that PTY; and
never infer wake from inbox rendering. The dated bb adapter in Appendix E is the reference
implementation of the first two patterns.

If a CLI substitutes for a portal, label the surface, preserve scope, do not impersonate the unavailable reviewer, disclose reduced independence, and obtain a new human decision when surface identity matters.

**Reference.** A dual-portal run froze after its controlling app blocked and later closed. The durable CLI lane in the same environment remained available.

**Qualification.** One-control-plane is demonstrated default practice. Dual-portal is a qualified advanced profile.

## 5. Separate roles and ownership

**Invariant.** One writer owns each mutable artifact or transition. Ownership moves by protocol, never announcement.

**Protocol.** Use Principal, controller, writer, reviewer, breaker, verifier, and supervisor roles as needed. Transfer ownership by:

```text
OFFER → ACK → LEASE → RELEASE
```

Before replacement, freeze writes, record artifact/diff hashes and command state, prove or revoke the old owner, reconcile the workspace, attest the replacement, then grant the lease. Final writes use compare-and-swap, generation fencing, or another freshness guard. Co-signs name the exact immutable hash reviewed.

**Reference.** A finalization peer appeared stale and another actor began preparing a takeover. The overlap was caught before clobbering. During this book's preparation, crossed phase messages produced two synthesis drafts; both were frozen and merged rather than overwritten.

**Qualification.** Demonstrated practice in both implementation and editorial work.

## 6. Build the durable run packet

**Invariant.** Agent memory is expendable. Artifact memory is the run's continuity.

**Protocol.** Maintain:

```text
PROJECT.md          authority and twelve-field contract
STATE.md            phase, owner, last material delta, next boundary
SOURCE-MANIFEST.md  versioned inputs and fresh hashes
MODEL-HARNESS.md    deployed routes, surfaces, permissions, liveness
DECISIONS.md        human decisions and interpretations kept distinct
CHECKPOINTS.md      STARTED / CHECKPOINT / RESUME
INCIDENTS.md        signatures, evidence, recovery, correction
BUDGET.md           limits, actuals, extension authority
originals/ synthesis/ reviews/ evidence/ closeout/
```

Change the manifest version whenever sources change. Recompute hashes at the boundary where relied upon. Reissue fingerprints after control edits. Record every automation with owner, purpose, cadence, failure domain, quiet behavior, and retirement condition.

**Reference.** Successful replacements in the source runs resumed because the packet preserved state. The failed cases depended on private context or stale status.

**Qualification.** Demonstrated practice.

## 7. Engineer real independence

**Invariant.** Independence comes from separated information and failure modes, not the number of agents.

**Protocol.** For blind peer-superset, freeze one packet; create complete independent originals; hash and verify them before exchange; synthesize additively; have the other peer challenge omissions, overreach, unsafe advice, and privacy; repair once; preserve dissent; obtain exact-hash countersign; rotate synthesizer next time. For gates, use fresh context and provider diversity where consequence warrants it. Give the verifier the contract, artifact, manifest, and tests—not the builder's persuasive narrative.

For independent research, architecture options, or business proposals, use [`peer-synthi`](../.agent/skills/peer-synthi/SKILL.md). It combines useful findings and develops stronger combined ideas while preserving material alternatives. Reviewers confirm faithful representation separately from endorsing every recommendation. A complete advisory report may retain disagreement; missing work or review is delivered as an explicit partial result. This does not change the `peer-superset` review workflow or authorize downstream effects.

When disagreement remains: restate the proposition, separate fact/value/risk/missing evidence, name each falsifier, run the smallest decisive test, and let the human decide unresolved values. Do not add a third agent merely to vote.

**Reference.** Blind drafting of this book exposed a confidently swapped pair of CLI submit sequences. Source inspection resolved it.

**Qualification.** Demonstrated practice, including this manuscript.

---

# Part III — Communication and liveness

## 8. Model communication as state

**Invariant.** Render, task re-entry, receipt, action, and completion are separate claims.

**Protocol.** Track:

```text
ENQUEUED → RENDERED → WAKE_RECEIVED → DELIVERED_ACKED → ACTION_ACKED → PEER_ACTED
```

with `BLOCKED`, `CANCELLED`, `SUPERSEDED`, and `REJECTED_DUPLICATE` alternatives. One material flight uses one nonce; retries reuse it; duplicates do not create another effect. Material handoffs include run, roles, lease status, phase, source manifest, artifact hashes, exact ask, acceptance, authority, forbidden actions, budget/timeout, expected reply, and fallback.

Use direct delivery for timely receipt and a durable record for audit/restart unless a transactional inbox supplies both. An external supervisor owns the receipt SLA, honors declared deep work after action-ACK, and sends at most one precise re-nudge.

Make long handoffs wrap-proof: place long tokens, exact paths, and structured payloads in a file and send the file's reference plus hash. A line-wrapped token can silently break exact matching.

**Reference.** A verifier handoff once existed in the sender's log but not the receiver's surface. Render verification caught it; receiver-origin nonce ACK was still required to prove receipt.

**Qualification.** Demonstrated practice. A render alone proves only its named state.

## 9. Address exact outstanding work

**Invariant.** Shared text is an injection surface. Watchers act on exact outstanding records, never ambient prose.

**Protocol.** Require four guards: exact target fields; a tunable recency window; named closed threads/nonces; and data-not-instructions. On arm/restart/resume, reconcile the full queue before setting an edge cursor. Match requests to receiver-authored terminal records and act on the oldest authorized item.

Honor a declared deep-work timeout after action-ACK. Absence of a final artifact before that boundary is not dormancy. When a nudge is justified, send one short, single-action request with one exact expected marker.

**Reference.** Broad prefix matching nearly resurrected closed work; a different ad hoc peer failed to wake until the sender used its exact identity stamp. The sender was also fooled by a desired marker embedded in its own outgoing request.

**Qualification.** Exact-field watcher practice is demonstrated. Queryable structured-envelope implementations remain staged where the transport is still text-based.

## 10. Manufacture the next turn

**Invariant.** A session with no turn is not waiting; it is not running. Every unattended actor needs a proven source of turns and durable standing orders.

**Protocol.** Use durable workers, tracked one-shot watchers, harness-native task heartbeats,
native task steering, bounded scheduled jobs, or explicit human re-entry. Native task steering
is a first-class turn source only for the exact addressed task. Terminal input is a turn source
only when a compatible harness accepts and submits it. A shell detector or rendered inbox does
not necessarily wake a hosted model. A watcher is `UNPROVEN` until a controlled event traverses
the actual background path.

Tracked one-shots exit on news or timeout and are re-armed after wake. Do not detach a watcher when the harness only observes tracked processes. Standing orders record run/generation, permitted phase, sources, per-wake duties, quiet behavior, authority, holds, and retirement.

Layer the available backstops without confusing their authority:

1. **L1 — in-session watcher:** fast and context-rich, but it dies with the session.
2. **L2 — scheduled fresh-session backstop:** can survive a task restart and break a stall, but is deliberately narrow: no gates, no deployments, no substantive answers—*you are not the builder*.
3. **L3 — peer nudge:** an independently observed, exact, one-action request through the proven ingress.

A backstop that starts doing the real work becomes a second worker with stale context and unclear supervision.

**Reference.** A detached watcher continued at the OS layer but its task never learned it had exited. The corrected tracked chain ran over a weekend.

**Qualification.** Demonstrated on dated reference surfaces; adapter facts are perishable.

## 11. Keep one lifecycle sentinel alive

**Invariant.** Lifecycle automation belongs to the run, not a phase. Intermediate states retarget it; terminal handback retires it.

**Protocol.** Use:

```text
PREPARE → ARM_NEW_GENERATION → VERIFY → RETIRE_OLD_GENERATION → TOMBSTONE_AT_TERMINAL
```

The successor carries run, controller, authority capsule, expected state, sequence, and generation. Arm and canary it before retiring the predecessor. Stale generations no-op. If authority is missing, use a zero-work successor that reads only for a valid decision or cancellation and cannot dispatch, grant leases, decide gates, or enlarge scope.

**Reference.** A correct phase PASS was followed by deletion of the sole heartbeat before any successor existed. Evidence remained safe while autonomous continuity vanished for hours.

**Qualification.** The doctrine is evidence-derived and adopted. The full atomic-retarget qualification matrix remains staged.

## 12. Survive credential and scheduler mortality

**Invariant.** A session-owned scheduler shares the session's credentials and lifecycle. Independent supervision must not depend on the agent it supervises.

**Protocol.** Separate:

1. work plane—authorized work and durable progress;
2. session-liveness plane—structured heartbeat with run, identity, generation, monotonic sequence, `WAKE_SEEN`, `HEALTH_VALIDATED`, phase, next wake, and terminal state;
3. credential-independent supervisor—validates freshness, identity, generation, sequence, schema, and clock skew, then opens a deduplicated human alert incident.

The supervisor is alert-only. It cannot invoke an agent, restart work, mutate state, or grant authority. Declare its failure domain. Calculate detection as stale threshold plus check interval plus notification. Use off-host observation or explicit risk acceptance when the host itself is consequential.

Force-test the real scheduled path for missing, malformed, stale, future, wrong-generation, repeated-sequence, recovery, deduplication, and retirement cases. Never publish wake endpoints or phone destinations.

Heartbeat staleness alone is not death. Idle-scheduled heartbeats can starve during active work. Reconcile heartbeat age with session/process state, fresh work-plane evidence, and the exact failure signature; prefer turn-boundary ticks.

**Reference.** In one weekend incident, a verifier credential and all its in-session alarms died together; substitute review preserved safety but the human was not alerted. During this book's drafting, an actively writing peer was briefly reported dead because its idle-only heartbeat went stale. The first background force tests also caught future-time and time-zone bugs.

**Qualification.** The three-plane rig and fixture matrix are demonstrated on the reference host. Any untested notification endpoint remains staged.

---

# Part IV — Operating and supervising the run

## 13. Plan evidence-gated milestones

**Invariant.** Milestones advance on inspectable evidence, not dates, narration, or per-action vetoes.

**Protocol.** Start with the smallest executable slice that tests the riskiest assumption. Name owner, lease, inputs, artifact, runnable proof, `IS`/`IS NOT` claims, gatekeeper, repair budget, next authorized state, and human boundary. Sequence by threat model: snapshot/rollback early for data risk; real idle wake early for liveness risk; holdouts early for false-green risk.

**Reference.** A kernel build recovered after the milestone plan changed from a large gate maze to working core, reliability, coordination/policy, and real-run readiness.

**Qualification.** Demonstrated practice. First-hour timing is a tunable profile.

## 14. Run the controller loop

**Invariant.** The controller observes artifacts and boundaries, not activity theater.

**Protocol.** `OBSERVE → CLASSIFY → CHOOSE → ACT → VERIFY → CHECKPOINT → CONTINUE_OR_HOLD`. Read own inbox and durable state first. Classify on-track, deep work, idle, blocked, prompt-waiting, wedged, gate-pending, repair-loop, closeout-pending, or unknown. Choose the cheapest permitted intervention. Verify postcondition and side effects. Record material delta only. Continue inside authority; hold at true boundaries.

**Reference.** Successful recovery loops used this order. Failed loops acted on silence before classifying it.

**Qualification.** Demonstrated practice.

## 15. Observe liveness, progress, and health separately

**Invariant.** A live process can make no progress; advancing artifacts can be wrong; healthy work can be blocked on input.

**Protocol.** Pull positive signals. Liveness asks whether another turn can execute. Progress asks whether code, tests, artifacts, checkpoints, or decisions advanced. Health asks whether the work is correct, authorized, and aligned. Use a cheap probe, an early classification point, and an outer fire alarm. Diagnose delivery, process, child command, artifacts, prompts, resources, credentials, and dependencies.

Require `STARTED <nonce> <plan>` and compact material checkpoints. Elapsed time alone never kills a worker.

**Reference.** Three similar stalls produced three outcomes: blind replacement lost work, an unclassified interrupt lost reasoning, and diagnosis-first recovery preserved state in minutes.

**Qualification.** Demonstrated practice; exact minute marks are profiles.

## 16. Diagnose and recover without destroying evidence

**Invariant.** Preserve first, interrupt once under a qualified signature, replace last, and never blindly repeat a possibly completed non-idempotent action.

**Protocol.** Preserve timestamps, transcript state, pane, process/child state, resources, hashes, staged state, checkpoint, lease, generation, and open nonces. Classify before intervention. Use one signature-bound controlled interrupt. After recovery, reread checkpoint, verify postconditions/hashes/staged state, append `RESUME`, and continue. Recurrence exhausts the one-recovery budget and triggers replacement or escalation.

Replacement follows the lease protocol and resumes only already authorized work. Each miss enters the incident register with a normalized signature; recurrence forces a process correction. Heavy verification at a declared boundary should be one simple retained-output command followed by a separate evidence read without weakening coverage.

**Reference.** A tool-result wedge looked active while its transcript froze, no child existed, CPU remained low, and no approval prompt was visible. One Escape recovered it; filesystem evidence showed why blind retry would have been unsafe. Detection latency dominated the delay.

**Qualification.** The general recovery doctrine is demonstrated. The exact 75-second/one-Escape signature is a dated adapter fact.

---

# Part V — Evidence, judgment, and acceptance

## 17. Engineer evidence

**Invariant.** State both where evidence came from and how the claim was tested.

**Protocol.** Provenance: primary fact, independent result, project evidence, inference, vendor claim, anecdote, hypothesis. Proof modality: inspection, executable test, adversarial/negative test, operational/restart test, environment/route attestation, external/human acceptance, authority record. Material claims carry one provenance label, one or more modalities, the environment/version, counterevidence, and limits.

Use the claims ladder: observed; locally reproduced; environment-qualified; operationally demonstrated; externally accepted. Proof is surface-scoped. Fresh hashes bind exact bytes at the relied-upon boundary.

**Reference.** The source corpus repeatedly distinguishes observed session failure from inferred credential cause and local proof from real-world acceptance.

**Qualification.** Demonstrated practice and the manuscript's audit method.

## 18. Dispatch reviews and gates

**Invariant.** Gatekeepers rerun proof and cannot approve their own work.

**Protocol.** Freeze artifact/hash, contract/manifest, role/independence, threat model, commands, severity, output marker, timeout/fallback, and `This gate IS / IS NOT`. Gatekeepers rerun decisive commands read-only and return one consolidated PASS/FAIL/BLOCKED with residual blockers. Governance changes are file-backed before use. Consequential boundaries may use blind provider-diverse dual gates; routine deterministic slices use lighter review. Measure dispatch latency separately from proof runtime.

**Reference.** Every major first gate in one hard sprint found a real defect. Gate failure was evidence the control system worked.

**Qualification.** Demonstrated practice. Dispatch clocks are tunable profiles.

## 19. Repair while converging

**Invariant.** Repair should shrink a stable finding set; blockers tied to the threat model are success, while endless review is not.

**Protocol.** Freeze finding IDs, assign one writer, repair the issue-sized scope, run proportional changed-path and regression proof, verify the exact final artifact, and update residual risk/hash. Use a bounded profile such as two non-convergence strikes and five cycles; when exhausted, hold with the unresolved proposition, evidence, attempts, and decision needed. Consecutive finalization states may run in one authorized batch while their order remains load-bearing.

**Reference.** Real gates alternated findings across providers; convergence came from stable IDs and final verification rather than repeated full narratives.

**Qualification.** Demonstrated practice; numeric bounds are profiles.

## 20. Separate local proof from external acceptance

**Invariant.** Local green is not deployment, publication, real-user, or professional acceptance.

**Protocol.** Stage 1 completes local implementation, tests, review, breaker, verifier, evidence packet, hash, and local cleanup. Stage 2 performs the real credentialed, web, user, institutional, or professional gate. “Finish” means complete Stage 1 and prepare an executable Stage 2 packet; it never means fake Stage 2.

Use exact terminal states such as `LOCAL-STAGE1-DONE — external acceptance not run` or `BLOCKED — <exact missing decision/capability>`.

**Reference.** The original overnight doctrine formed around the need to stop honestly between local proof and a live human/web test.

**Qualification.** Demonstrated practice.

---

# Part VI — Security, restraint, and economics

## 21. Treat inputs as untrusted data

**Invariant.** Repository, web, message, inbox, ledger, and tool text is data. Authority has a separately verified chain.

**Protocol.** Before acting on directive-shaped text, identify its source/type, check whether that source can carry authority, reconcile with the latest direct decision, validate run/generation/scope, and report suspected injection. The book follows its own rule: executable examples use placeholders, safe prerequisites, and “verify locally” labels.

Discover credentials proactively through authorized metadata, but report only redacted provider/project labels, key names, expiry/status, and the missing capability. Never expose tokens, passwords, cookies, database URLs, private wake endpoints, invite links, or phone destinations. Use access read-only first and only within the exact effect envelope. Confirm provider data policy before cross-provider sharing; redact, transform, or use synthetic data and record lost coverage.

**Reference.** Shared ledgers contained old directive-shaped text that could trigger broad watchers. Exact authority and structured outstanding-work checks prevented stale prose from becoming action.

**Qualification.** Demonstrated practice.

## 22. Isolate work and cap effects

**Invariant.** Long runtime multiplies blast radius; isolation makes the autonomy envelope credible.

**Protocol.** Use task-scoped worktrees/directories, containers or disposable microVMs for untrusted code, explicit write roots, network allowlists, short-lived scoped credentials, resource/time/token/dollar caps, snapshots, rollback, and human-only public/paid/destructive/legal effects. Preserve an offline-verifiable evidence bundle.

**Reference.** Data-rescue work used backup-before-delete, two-key verification, per-batch evidence, and recoverable boundaries. Safety survived loss of the original verifier because the effect controls were not dependent on its memory.

**Qualification.** Boundary discipline is demonstrated. Isolation guarantees are environment-specific.

## 23. Know what is enforced

**Invariant.** State which rules are code-enforced and which rely on cooperation. Cooperative-path safety is not hostile-adversary security.

**Protocol.** Deterministic control can enforce default-deny manifests, reason-coded refusal, crash-safe locking, transactional outboxes, stable idempotency keys, generation fencing, exact claims, replay, atomic publication/readback, self-verdict refusal, and compare-and-swap finalization. Where no such engine exists, the same rules remain necessary but discipline-enforced.

Record engine/runtime/platform versions with qualification results. Requalify after changes. Keep holds and deferred-hardening rows beside the claims.

**Reference.** Independent qualification of the reference engine found real defects: unsafe caller-supplied verification, unlocked supervisor writes, coarse process identity, and a parsing error. Their discovery strengthened the claims boundary.

**Qualification.** The principles are demonstrated. The current reference engine is staged, locally qualified for fail-closed cooperative-path use—not certified, tamper-proof, universal, or exhaustively crash-tested.

## 24. Budget work and governance

**Invariant.** Control has a cost and must compete honestly with the artifact for budget.

**Protocol.** Set wall target/hard stop, token/credit/dollar budget, concurrency, retries, consensus/repair rounds, checkpoint cadence, ceremony budget, diminishing-return rule, and extension authority. Measure active/waiting/controller time, gate dispatch, interventions, repairs, rollback, escaped defects, and outcome quality. If metering is absent, say so rather than inventing a number.

Human updates report `state · last material change · next boundary` and remain quiet when nothing material changed. Stop when acceptance passes, rounds add nothing decision-relevant, a hard budget is hit, the next step requires authority/external evidence, a failure repeats after fallback, or the work drifts.

**Reference.** The process-over-artifact failure demonstrated that coordination cost can dominate the project even when no provider invoice changes.

**Qualification.** Demonstrated practice; numerical ceilings are named profiles.

---

# Part VII — Closeout, learning, and scale

## 25. Finalize without losing ownership

**Invariant.** Completion is an exact claim about exact bytes under one owner, with required co-signs and no orphaned work.

**Protocol.** Preserve the order:

```text
HASH_CAPTURE → MANIFEST_WRITE → MANIFEST_VERIFY → FINAL_CHECKPOINT → WORK_COMPLETE
```

One finalization owner operates under freshness protection. Verify artifacts unchanged since PASS; record acceptance, roles/routes/fallbacks, findings, residual risks, untested areas, human decisions, budget actuals, and automation/lease/sandbox/credential disposition. Retire lifecycle automation with a tombstone. Close every material handoff. Give the human outcome, limits, and next decision in plain language.

Signed artifacts are immutable. A correction, amendment, or provider-note update creates a new
versioned copy; it never overwrites the bytes that received consensus. A release manifest binds
the source hash to every derived Markdown, PDF, archive, and signature. This rule was added after
an amendment was mistakenly written into an already countersigned manuscript. Recovery succeeded
because the frozen synthesis and exact patch record could reproduce the original hash. The safer
system refuses the mutation in the first place.

**Reference.** Exact-hash co-signing and stale-writer refusal prevented finalization forks from corrupting immutable masters.

**Qualification.** Demonstrated practice.

## 26. Turn incidents into doctrine

**Invariant.** Incidents are evidence. A repeated signature without a process correction is the real failure.

**Protocol.** Record trigger, normalized signature, detection delay, pre-intervention evidence, classification, action, postcondition, recurrence, and prevention/detection/recovery/accepted-risk disposition. Delegate deep RCA read-only when delivery should continue. Block closeout until each material incident has a learning disposition. Revalidate dated doctrine after provider, route, harness, scheduler, auth, environment, or incident change.

**Reference.** The failure museum maps each major rule to the event that earned it, including this manuscript's own coordination and source-verification incidents.

**Qualification.** Demonstrated practice.

## 27. Qualify infrastructure and expand autonomy

**Invariant.** Autonomy expands through consecutive eligible measured runs, not one showcase.

**Protocol.** Select a low-risk, verifier-rich task class and predeclare thresholds. An initial profile may require twenty consecutive qualifying runs; a stronger operational profile may require fifty; consequential work requires more and stronger external gates. Measure environment, eligible-run definition, completion without intervention, failure/repair/rollback, unauthorized effects (required zero), detection latency, costs where available, reproducibility, and failure modes actually tested.

Use fresh issue-sized judgment contexts and deterministic routine controllers. Expand only when the stated profile passes. Report the environment and limits every time.

**Reference.** The source program proposes the profiles but does not claim a task class has already completed them.

**Qualification.** The 20/50 approach is policy and a qualification plan, not yet a blanket reliability demonstration.

---

# Appendix A — Preflight and operating profiles

## Preflight

- Outcome, audience, scope, acceptance, budget, and stop condition are written.
- Sources are versioned and hashed.
- Deployed model/routes/harnesses/permissions are recorded.
- Roles and one-writer leases are assigned.
- External/destructive/paid/public/professional effects are allowed or forbidden explicitly.
- The first executable slice and material-artifact deadline are named.
- Local proof is separated from external acceptance.
- Each material handoff has nonce, direct/durable paths, ACK, action proof, and receipt owner.
- Each critical actor's next-turn mechanism has passed a controlled test.
- Each relied-upon wake ingress is endpoint-tested from its real endpoint, or the gap and its compensating alert path are recorded.
- Standing orders and lifecycle disposition are durable.
- Work, heartbeat, and supervisor failure domains are declared; detection meets the SLA.
- Checkpoint/recovery/replacement and role fallback are written.
- No secret or private coordinate is in shared plaintext.

## Profiles

**SMALL_LOCAL:** one writer, one fresh reviewer, local-only effects, one repair round.  
**OVERNIGHT_SINGLE_CONTROL:** one portal, durable writer, provider-diverse gatekeeper, first-hour artifact, run packet, Stage 1 hold.  
**DUAL_PORTAL_AUDITED:** explicit two-surface need, proven wake/ACK both ways, one gate-captain, durable execution off portals.  
**CONSEQUENTIAL_RELEASE:** isolated execution, scoped credentials/effects, adversarial gates, rollback, real external acceptance, human release.

## Launch contract

Resolve every launch before creating agents. A copy-ready selector line is:

```text
LAUNCH <L0|L1|L2|L3|L4> · CONTROL=<one-desktop|two-desktop-explicit> ·
WRITER=<surface> · GATEKEEPER=<surface|none> · AUDITORS=<on-demand|none> ·
CADENCE=<profile> · FIRST_ARTIFACT=<artifact>@<time> · HOLD=<named boundary>
```

The controller must answer before launch:

```text
RESOLVED CONTRACT: level=<...>; control=<...>; writer=<...>; gatekeeper=<...>;
auditors=<...>; cadence=<...>; first_artifact=<...>; hold=<...>;
unresolved=<none|exact question>. Proceeding only inside this contract.
```

`one-desktop` is the hard default. Two desktops require the exact phrase
`CONTROL=two-desktop-explicit`, a genuine concurrent-control reason, proven wake/ACK in both
directions, one named gate-captain, and a fallback for either deaf surface. Ambiguity resolves to
one desktop plus an exact question, never an assumed second portal. Optional auditors are opened
only for a named issue, remain off the critical path, receive no writer lease, and are retired
after their response or timeout. The cadence profile must declare ordinary observation, allowed
deep-work windows, re-nudge, classified-stall, and role-unavailability timings.

# Appendix B — Templates

## Project contract

```text
RUN_ID · OUTCOME · WHY/AUDIENCE · SOURCE-OF-TRUTH · SCOPE · AUTHORITY · FORBIDDEN ·
DELIVERABLES · ACCEPTANCE · INDEPENDENCE · COMMUNICATION · BUDGET · STOP-CONDITION
```

## Material handoff

```text
RUN · FROM/TO/ROLE · WRITER=<lease|noop> · PHASE · MODEL/HARNESS · SOURCE_MANIFEST ·
ARTIFACTS/HASHES · EXACT_ASK · ACCEPTANCE · AUTHORITY · FORBIDDEN · BUDGET/TIMEOUT ·
NONCE · ACK_REQUIRED · EXPECTED_REPLY · FALLBACK
```

## Review request

```text
artifact/hash · contract/manifest · role/independence · questions/threat model ·
commands · severity · This gate IS · This gate IS NOT · output/marker · timeout/fallback
```

## Checkpoint

```text
CHECKPOINT_ID · RUN/GENERATION/OWNER · LAST_MATERIAL_CHANGE · ARTIFACTS/HASHES ·
COMMAND/TEST STATE · OPEN NONCES · LEASES · INCIDENTS · NEXT AUTHORIZED ACTION · HOLD
```

## Incident and closeout

```text
INCIDENT: id · trigger/signature · detected/delay · evidence · classification · action ·
postcondition · recurrence · correction · owner/validation

CLOSEOUT: status · final artifacts/hashes · acceptance · roles/routes/fallbacks · findings/risks ·
untested · human decisions · budget actuals · automation/lease disposition · revalidation · handback
```

# Appendix C — Portable runbooks

## Qualify a next-turn mechanism

Record exact surface/version/route/generation; reconcile backlog; arm without clobbering a predecessor; trigger a fresh nonce; require receiver-origin `WAKE_RECEIVED` after own-inbox inspection; require `WORK_COMPLETE` separately; test duplicate, restart/resume, and stale generation; measure wake receipt latency; record failure domain and retirement.

## Force-test an alert-only supervisor

**Example—verify locally. Never insert real endpoints into public code.** Test the actual scheduler path against fresh, stale, malformed, future, wrong-generation, repeated-sequence, missing, recovery, dedupe, and retirement fixtures. Verify the supervisor cannot invoke a model, mutate state, or grant authority.

## Recovery ladder

Preserve evidence; classify; probe cheaply; apply at most one qualified interrupt; read checkpoint; verify postconditions; transfer lease explicitly; resume only authorized work; record recurrence and correction.

# Appendix D — Collaboration recipes

**Peer Synthi:** independent originals and hashes → evidence/assumption comparison → complements and new combined options → representation review → one decision-ready report, with alternatives only where material. See the [skill](../.agent/skills/peer-synthi/SKILL.md); a disagreement is not a missing deliverable, and a missing review is not consent.

**Blind peer-superset:** frozen common packet → blind complete originals and hashes → exchange → additive synthesis → adversarial challenge → one integration → exact-hash countersign; rotate synthesizer.  
**Reviewer/breaker/verifier:** reviewer maps contract, breaker seeks false greens and unsafe behavior, one writer repairs, verifier reruns final proof last.  
**Research lanes:** primary sources/direct observations versus independent counterevidence.  
**Disagreement:** proposition → fact/value/risk/evidence → strongest evidence/falsifier → smallest decisive test → human value choice.


# Appendix E — Dated Operational Adapter Registry

<!-- ADAPTER-REGISTRY-2026-08-BEGIN -->

Adapters are perishable operational records, not timeless promises. Every relied-upon surface
must have a stable adapter ID, a product and harness version, a last-verified date, source
anchors, a claims boundary, and a revalidation trigger. Revalidate quarterly, after any relevant
product, model-route, launcher, operating-system, authentication, scheduler, or helper change,
and before consequential use when an adapter is older than thirty days.

An adapter is complete only when it records: identity/address; start and attach; input and submit;
interrupt and clear; idle/busy detection; multiline handling; inspection; direct-send and ledger
behavior; wake mechanism; receipt and action proof; restart/resume; instruction roots;
permissions and security; failure signatures; closeout; evidence maturity; and source anchors.

## Reference matrix — verified 2026-08-31

| Surface | Submit | Ordinary interrupt/clear | Idle indication | Headless path | Wake claim |
|---|---|---|---|---|---|
| Claude Code CLI 2.1.x | literal or paste-buffer input, then `C-m` | `C-c` cancels current operation | `❯` prompt | `claude -p` | live CLI only |
| Codex CLI | literal/paste input, delay, `Escape`, delay, `Enter` | **never `C-c`**; it can terminate the CLI; use `Escape` only | `›` prompt | `codex exec` | live CLI only |
| Gemini CLI | literal/paste input, one-second delay, `Escape`, then `Enter` | `C-c` cancels current operation | `Type your message` | `gemini -p` | opt-in live CLI only |
| Antigravity CLI | helper input and plain `Enter` | `Escape` may cancel | foreground-process and `status.ready` checks | harness-specific | opt-in live CLI only |
| bb durable task | `thread tell … --mode steer / queue / auto` | task-specific; inspect before steering | task status/event stream | native task/automation/workflow | re-enters exact task |
| bb persistent terminal | `terminal send … --text … --enter` | harness-specific | terminal output + hosted harness state | persistent PTY | only if hosted harness accepts input |
| Antigravity desktop CDP | loopback CDP insertion and submit | conversation-specific | expected-page/readiness check | desktop control | security-sensitive, exact page only |
| ChatGPT/Claude Desktop passive inbox | one submitted line to dedicated pane | none | rendered line | none | render only; does not re-enter model |
| Codex thread heartbeat | supported same-thread heartbeat | update or retire automation | next scheduled re-entry | task-native | exact task only |
| Claude tracked wake chain | tracked watcher exits on news/timeout | pause both watcher and backstop | task ID plus wake receipt | tracked task + external backstop | exact task only after endpoint test |

`C-c` safety and submit behavior are version-scoped. A helper name is not evidence; inspect the
current helper implementation and prove a nonce round trip on the actual target.

## Evidence ladder

Report only the highest established rung:

1. `RENDERED` — text appeared somewhere.
2. `SUBMITTED` — the receiving UI accepted the input.
3. `RECEIVER_ACKED` — the intended receiver acknowledged the nonce.
4. `TASK_ACTED` — the addressed task performed the requested bounded action.
5. `WORK_VERIFIED` — an independent check verified the artifact or state transition.

Rendering is not receipt. Receipt is not wake. Wake is not action. Action is not verified work.

<!-- ADAPTER-REGISTRY-2026-08-END -->


## E.1 bb Desktop — steerable task and persistent terminal

<!-- ADAPTER-BB-2026-08-BEGIN -->

- **Product:** bb Desktop 0.38.0 reference installation.
- **Role:** first-class desktop cockpit for durable agent tasks, persistent terminals,
  automations, workflows, worktrees, and enrolled-machine control.
- **Maturity:** `EVIDENCE-DERIVED` for inspected local commands and recorded field use;
  environment-scoped. Revalidate before relying on it unattended.
- **Last verified:** 2026-08-31.
- **Source anchors:** `BB-DESKTOP.md`, the dated bb CLI help/subcommand record, and the recorded
  field notes used for this edition.

### The two programmatic control surfaces

Do not collapse them:

1. **Durable task steering** addresses the model task itself. The stable task ID is the address.
   `bb thread tell <thread-id> "<instruction>" --mode steer` re-enters the exact task with changed
   work. `queue` waits behind the active turn; `auto` lets bb choose. Inspect with status/show/
   output/wait rather than steering merely to poll.
2. **Persistent-terminal input** addresses a PTY, not a model. `bb terminal send <terminal-id>
   --text "<input>" --enter` types and submits to that terminal. It wakes an agent only when a
   compatible harness is running there, is ready, and treats the submitted bytes as a new turn.
   Verify the hosted process, terminal output, receiver ACK, and action separately.

If `bb` is not on `PATH`, discover the packaged CLI inside the installed application bundle and
record the resolved command and application version. Never publish a user-specific absolute path
as doctrine.

### Operating record

Before assignment record: task ID; terminal ID if used; provider and requested model; environment;
project and exact workspace; machine; instruction roots; permission ceiling; write lease; budget;
completion/hold conditions; and every automation or workflow capable of creating another turn.

Instruction precedence matters. User-level bb instructions and exact-workspace `.bb/AGENTS.md`
are distinct. Workspace instructions are loaded for a provider session started in that exact
workspace; do not assume parent-directory discovery or that an already-running session has
absorbed a newly written instruction file. Require a fresh controlled turn and confirm-back.

### Overnight features and their failure domains

- **Caffeinate** can prevent host sleep. It does not prove bb health, provider credentials,
  network reachability, task progress, or supervisor independence.
- **Script automations** can perform deterministic checks without model tokens. Empty stdout is
  a legitimate quiet tick. **Agent automations** consume a model turn and need their own budget,
  authority, and terminal condition.
- **Provider retry** can repair transient provider failures while bb is alive. Because it runs in
  the bb process/plugin domain, it cannot supervise or restart a dead bb server.
- **Workflows** provide durable JavaScript orchestration. Every loop requires explicit iteration,
  wall-time, token/spend, retry, and external-effect ceilings plus a terminal state.
- **Worktrees** isolate writers; the lease still names one exact task and one mutable boundary.
- **Connect/enrolled machines** extend control to another machine. Enrollment, rotation, removal,
  ownership, and closeout belong in the run packet.
- **Secure secret requests** use protected paths or product facilities. Verify metadata such as
  existence or count; never echo secret values into chat, events, logs, or artifacts.

### Security boundary

bb plugins and workflow code execute code. Pin, inspect, and threat-model them. Treat full-
permission modes as explicit sandbox bypasses. Do not bind an unauthenticated bb command/file API
to `0.0.0.0` or another externally reachable wildcard. Remote control belongs behind an
authenticated boundary with least privilege and a documented revocation path.

### Restart, resume, and closeout

A supervisor outside the bb process owns server/app-death detection and restart. After restart,
resolve the same task ID and inspect status/output before steering; separately verify whether each
persistent terminal and hosted child survived. Provider retry is not server restart. If the task
cannot resume exactly, start a successor from the run packet under a new generation and lease.
Failure signatures include missing task/status, non-advancing events, provider-retry exhaustion,
terminal-without-compatible-harness, lost instruction confirm-back, and unreachable enrollment.
Closeout records final task/output hashes, terminates or retargets automations/workflows/retries,
releases worktrees and leases, closes terminals, revokes enrollments and secret grants, and proves
that no orphan can create another turn.

### Twelve-step reference pattern

1. Resolve and record the bb version and CLI path.
2. Identify the exact task, terminal, workspace, provider/model, and machine.
3. Load and confirm instructions for the exact workspace.
4. Assign one writer lease and explicit effect envelope.
5. Prove task steering with a nonce and harmless artifact.
6. If using a terminal, prove the hosted harness, readiness, submission, ACK, and action.
7. Enable Caffeinate only when host sleep is a relevant failure mode.
8. Register automations/workflows with owner, cadence, budget, state, and retirement condition.
9. Put provider/app death under a supervisor in another failure domain.
10. Inspect outputs and artifacts; do not steer merely to ask for status.
11. Gate consequential effects independently.
12. Close by retiring or retargeting every task, terminal, automation, workflow, retry, lease,
    enrollment, and secret grant.

### Claims boundary

The recorded reference version supports durable task re-entry and persistent-terminal injection.
That does not prove every provider route, plugin, workflow, remote machine, or future bb version.

<!-- ADAPTER-BB-2026-08-END -->


## E.2 Pi CLI — standalone observed deployment

<!-- ADAPTER-PI-STANDALONE-2026-08-BEGIN -->

- **Product:** `@earendil-works/pi-coding-agent` 0.84.2 reference installation.
- **Role:** compact coding-agent CLI supporting interactive, text, JSON, and RPC operation.
- **Maturity:** `OBSERVED LOCAL USE` plus `STAGED ADAPTER`; not qualified as an unattended peer.
- **Evidence:** four saved sessions from 2026-08-06 through 2026-08-08: exploration in a bb
  repository; two mesh/model ACK exercises; and a live workshop session with a route change.
- **Last verified:** 2026-08-31.

### Capabilities to record

Pi exposes interactive operation; `-p`; `--mode text|json|rpc`; continue/resume/session/session-ID/
fork/session-directory controls; provider, model, and thinking selection; extension, skill, and
prompt-template loading; tool allow/deny selection; and an offline option. Built-in file and shell
tools make its permission boundary consequential.

For automation, prefer JSON/RPC or a bounded headless call with durable output over raw TUI
injection. If the TUI is used, qualify its exact submit, interrupt, idle, busy-turn, multiline,
and resume behavior on the installed version before delegating unattended work.

Tool allow/deny lists influence the harness; they are not an operating-system sandbox. Pi
extensions execute code and must be pinned, inspected, and covered by the effect envelope.
`--offline` describes a harness mode, not proof that every loaded extension, tool, or child
process lacks network access.

### Route attestation

In one recorded session, harness metadata and the assistant's self-description disagreed about
the selected route. Treat self-identification as untrusted narration. Record requested route,
resolved provider/model from harness metadata, fallbacks, credentials class, and any mid-session
route change.

### Qualification backlog before unattended reliance

1. Exact submit, interrupt, clear, idle, busy, and multiline tests.
2. RPC delivery with nonce ACK and duplicate refusal.
3. Delivery behavior while a turn is busy.
4. Crash/restart plus exact session resume and fork behavior.
5. Instruction, context, skill, template, and extension discovery rules.
6. Authentication expiry, provider fallback, and route-attestation tests.
7. Tool allowlist negative tests and OS-level containment checks.
8. Wedge signature, evidence capture, and bounded interruption.
9. One complete supervised overnight cycle including closeout and restart from artifacts.

### Evidence and security

Raw session exports remain private evidence. They can contain prompts, paths, identities, tool
outputs, and credentials. Never add them to a public repository. Secret-scan exports and rotate
any credential discovered in one. Publish only sanitized facts and aggregate results.

<!-- ADAPTER-PI-STANDALONE-2026-08-END -->


## E.3 Pi embedded in `qm` — application-scoped deployment

<!-- ADAPTER-PI-QM-2026-08-BEGIN -->

- **Product:** security-patched Pi 0.82.0 build embedded through the application's Pi harness and
  tool adapter.
- **Role:** application-controlled agent execution, not a general mesh seat.
- **Maturity:** `APPLICATION-SCOPED`; claims belong to that pinned application and test suite.
- **Last verified:** source inspection 2026-08-31.

Do not merge this record with standalone Pi 0.84.2. The application owns the version pin, tool
surface, environment, instructions, session persistence, route selection, and security patches.
Requalification follows application dependency, harness, tool, permission, provider, and model
changes. Cite the public application source only when its publication and attribution status are
approved; otherwise describe the architecture generically.

<!-- ADAPTER-PI-QM-2026-08-END -->


## E.4 Codex CLI in tmux

<!-- ADAPTER-CODEX-CLI-2026-08-BEGIN -->

- **Role:** durable CLI worker or reviewer on the shared tmux mesh.
- **Maturity:** `PRACTICE`, version- and helper-scoped.
- **Last verified:** 2026-08-31 against the recorded helper implementation.
- **Source anchors:** the dated `codex.js` helper, `LIVE_COMMS` matrix, and the installed CLI help
  inspected for the recorded environment.

Use runtime discovery to resolve the exact tmux socket, session, pane, process, working directory,
model, effort, sandbox/approval mode, and instruction roots. A session title is not an address.

For the recorded TUI, send literal or paste-buffer input, allow the UI to register it, send
`Escape` to dismiss overlays, wait briefly, then send `Enter`. **Never use `C-c` merely to clear
Codex input; it can terminate the CLI and lose the session.** Use `Escape` for the qualified clear
path. Wait for the `›` prompt before dispatch unless the exact busy-turn behavior has been proved.

For long prompts, put the payload in a file, record its hash, and send a short reference, or use
the repository's wrap-proof helper. Bare-launch the TUI, prove the idle prompt, then inject; long
argument-stuffed startup prompts can be truncated or stranded. For noninteractive work prefer a
bounded `codex exec` invocation with durable output, a timeout, and a done marker.

Proof requires: exact target inspection; nonce receipt; action evidence; artifact verification;
and direct delivery mirrored to the durable ledger. Raw `tmux send-keys` is a transport diagnostic,
not the normal messaging API.

**Restart/resume:** record the exact session/task identifier and inspect the installed CLI's
documented resume surface before use. Prove that the expected history, workspace, route, and run
generation returned; a syntactically accepted resume is not continuity proof. When exact resume is
unavailable, relaunch in the recorded workspace and recover from the run packet under a new
generation.

**Instruction roots and inspection:** record every applicable user, repository, and nested
`AGENTS.md` instruction root plus the effective sandbox/approval mode. Inspect pane/output,
foreground process, task events where available, and durable artifacts; never ask the model to
self-certify its route or liveness.

**Failure signatures and closeout:** wrong/prefix-matched pane, missing `›`, overlay-stranded
input, wrap/truncation, accidental `C-c` termination, non-advancing output, route drift, and stale
generation all fail closed. At closeout capture output/artifact hashes, end only from a qualified
idle state using the installed product's graceful exit, release the lease, retire watchers, and
prove no queued input or child remains.

<!-- ADAPTER-CODEX-CLI-2026-08-END -->


## E.5 Claude Code CLI in tmux

<!-- ADAPTER-CLAUDE-CODE-2026-08-BEGIN -->

- **Role:** durable CLI writer, reviewer, breaker, or verifier.
- **Maturity:** `PRACTICE`, version- and helper-scoped.
- **Reference family:** Claude Code 2.1.x; revalidate exact installed version.
- **Last verified:** 2026-08-31.
- **Source anchors:** the dated `cc.js` helper, `LIVE_COMMS` matrix, and the credential/wedge
  recovery record used for this edition.

The recorded submit path is literal or paste-buffer input followed by `C-m`; generic
Escape-then-Enter failed on a tested 2.1.x build. `C-c` cancels the current operation and is the
recorded clear path, but cancellation is still an intervention: preserve evidence and confirm the
postcondition. The `❯` prompt is the recorded idle indicator.

A qualified wedge signature is stricter than “looks stuck”: no transcript advance for at least
75 seconds, no relevant child process, low CPU on two observations, and no input prompt. Preserve
the pane, process tree, CPU sample, time, task ID, and last material artifact before intervention.
For that exact signature, one `Escape` is the bounded first recovery attempt; verify recovery
rather than assuming the keystroke worked.

Use bare launch, wait for the idle prompt, then inject long instructions by file/hash or the
Claude-specific helper. For headless work use subscription-backed `claude -p` only when provider
policy authorizes it, remove disallowed metered credentials from the subprocess environment,
bound runtime, capture output durably, and record requested/resolved route.

**Restart/resume:** record the session ID before unattended use. On the recorded family, inspect
the installed help before using `claude --resume <session-id>`; verify history, workspace,
provider route, instructions, and run generation after resume. If any differs, treat it as a new
seat and recover from the run packet rather than claiming continuity.

**Instruction roots, multiline, and inspection:** record user-level and project-level
`CLAUDE.md`/settings roots and confirm their effective scope on a controlled turn. Long or
multiline work travels by file and hash. Inspect the pane, foreground/child process, durable
output, and artifacts; a busy spinner or model self-report is not health proof.

**Failure signatures and closeout:** missing `❯`, frozen transcript matching the full wedge
predicate, credential death, child-command stall, wrong pane, submit-key mismatch, route drift,
and resume-to-new-session all fail closed. Close from a qualified idle state, capture hashes,
release the lease, retire watchers/backstops, and prove no tracked child or queued input remains.

<!-- ADAPTER-CLAUDE-CODE-2026-08-END -->


## E.6 Gemini CLI — opt-in peer

<!-- ADAPTER-GEMINI-CLI-2026-08-BEGIN -->

- **Role:** explicitly selected provider-diverse CLI peer; never recruited by default.
- **Maturity:** `EVIDENCE-DERIVED`, version- and launcher-scoped.
- **Last verified:** 2026-08-31.
- **Source anchors:** the dated `gemini.js` helper, Gemini launcher/field guide, and
  `LIVE_COMMS` matrix used for this edition.

The recorded launcher bare-starts Gemini, waits for `Type your message`, then uses a delayed
literal/paste send: allow approximately one second before Escape-then-Enter. The delay is part of
the proven reference path, not decoration. `C-c` cancels the current operation and is the recorded
clear behavior. A spinner such as `⠼` indicates busy work.

Headless operation uses the product's prompt mode with bounded runtime and durable output. Record
the exact model rather than relying on a moving default. The historical launcher used an
auto-edit approval mode; treat this as a privileged effect expansion and disclose it in the run
packet. Gemini remains opt-in: provider diversity helps only when independence, route, shared
context, and permissions are recorded honestly.

**Multiline and inspection:** send long or multiline prompts by file/hash or the qualified helper,
not an argument-stuffed launch. Inspect exact pane/foreground process, `Type your message` versus
spinner state, resolved route metadata, durable output, and artifacts.

**Restart/resume and instruction roots:** record the exact session identifier and installed
product version; qualify the installed product's documented list/resume surface before relying on
it. Verify history, workspace, model route, permission mode, run generation, and effective
workspace/user instruction roots after resume. If continuity is unproved, relaunch and recover
from the run packet under a new generation.

**Failure signatures and closeout:** delayed-submit omission, prompt without accepted input,
stuck spinner, wrong model/default drift, privileged-mode mismatch, wrong pane, and resume without
history all fail closed. Close only from a proved idle state, capture output/artifact hashes,
release the lease, retire helpers/watchers, and prove no queued turn remains.

<!-- ADAPTER-GEMINI-CLI-2026-08-END -->


## E.7 Antigravity CLI and desktop CDP

<!-- ADAPTER-ANTIGRAVITY-2026-08-BEGIN -->

### CLI surface

Antigravity CLI is an explicitly selected peer. The recorded helper reads readiness through its
own status surface and foreground-process checks, sends through the Antigravity-specific path,
and submits with plain `Enter`. Do not reuse the generic Escape-then-Enter helper: Escape may
cancel this TUI. Record the exact launcher, model, permission mode, session, and status evidence.

### Desktop CDP surface

When deliberately launched with a loopback debugging port, the desktop application can expose a
conversation-control path that identifies the expected page, inserts text, and submits it. Bind
CDP to loopback only; verify the expected application/page before every injection; treat visible
conversation transcripts as plaintext available to the controlling process; and retire the
debugging surface after use. This is security-sensitive local automation, not a generic desktop-
inbox wake claim.

- **Maturity:** CLI `EVIDENCE-DERIVED`; desktop CDP `STAGED/SECURITY-SENSITIVE`.
- **Last verified:** source and field-record review 2026-08-31.
- **Source anchors:** the dated `agy.js` helper, `ANTIGRAVITY.md` field guide, foreground/readiness
  probes, and the CDP control record used for this edition.

### Completion record

Send long/multiline work by file/hash through the qualified helper. Inspect exact pane,
foreground process, readiness/status output, expected desktop application/page for CDP, route,
durable artifacts, and action evidence. Record the launcher-selected workspace and every effective
instruction root; require a controlled confirm-back after changing either.

Before unattended reliance, qualify the installed CLI's documented restart/resume behavior and
verify history, workspace, route, generation, and permission mode. If continuity is unavailable,
recover from the run packet under a new generation. Failure signatures include missing
`status.ready`, backgrounded or wrong foreground process, Escape cancellation, wrong expected CDP
page, loopback-debug port exposure, plaintext-transcript exposure, route drift, and stale
generation. Closeout captures hashes, exits the CLI from a qualified state, releases the lease,
retires helpers/watchers, and disables the CDP debugging surface.

<!-- ADAPTER-ANTIGRAVITY-2026-08-END -->


## E.8 Desktop passive inboxes and task-native re-entry

<!-- ADAPTER-DESKTOP-WAKE-2026-08-BEGIN -->

### Passive inboxes

A dedicated tmux `cat` pane can render a submitted line for ChatGPT/Codex Desktop or Claude
Desktop. That proves only rendering. It does not itself insert the message into the hosted chat,
create a new task turn, or prove that the model read or acted on it. Use direct delivery plus the
ledger for audit, but rely on a separately qualified re-entry mechanism.

### Codex/ChatGPT Desktop thread heartbeat

Use the supported same-thread heartbeat mechanism when a Codex task must re-enter itself. Scope
the automation to the exact thread and run, require inbox reconciliation before acting, specify a
quiet/no-notification contract for unchanged state, update an existing heartbeat rather than
creating duplicates, and retire it at terminal state. It proves nothing about another task.

### Claude Desktop tracked wake chain

Use a tracked one-shot watcher whose exit is visible to the harness, plus a scheduled fresh-
session backstop in a different failure domain and an optional precise peer nudge. The watcher
checks the task's own inbox and ledger, suppresses self-writes, and compares hashes/state rather
than tailing blindly. Every exit path prints durable standing orders. Re-arm only after handling
the wake. Pause and resume both the watcher and its backstop, and report exactly which layers are
down.

The backstop breaks stalls; it is not the builder, gatekeeper, deployer, or substantive answerer.
Endpoint-test each relied-upon ingress from its real endpoint.

<!-- ADAPTER-DESKTOP-WAKE-2026-08-END -->


## E.9 tmux transport

<!-- ADAPTER-TMUX-TRANSPORT-2026-08-BEGIN -->

Resolve the socket, exact session, window, pane, TTY, foreground process, and working directory at
runtime. Never trust a historical TTY. tmux target names can prefix-match; use an exact target such
as `=session:` where supported or resolve the pane ID first. A prefix collision can deliver a
valid instruction to the wrong live agent.

Prefer target-specific helpers that encode literal/paste-buffer semantics, timing, submit keys,
idle checks, ledger mirroring, and nonce ACKs. Buffer paste with newline-preservation options can
change multiline semantics; test the exact helper. Direct TTY writes can render data in passive
panes but bypass normal TUI handling. Raw `send-keys` is reserved for controlled diagnosis.

Bootstrap is not attach. Legacy bootstrap scripts may kill sessions or rewrite ledgers; inspect
before running and never execute them merely to “join” an existing mesh.

<!-- ADAPTER-TMUX-TRANSPORT-2026-08-END -->


## E.10 Warp

<!-- ADAPTER-WARP-2026-08-BEGIN -->

- **Disposition:** `UNVERIFIED` as of 2026-08-31; preserve dated evidence until the Principal
  declares the surface active or retired.

Recorded materials describe launching Claude Code or Codex CLI visibly in Warp while the actual
coordination transport remains the standard tmux mesh. The visible terminal is not a new identity
or transport. Before active use, qualify launch, attach, exact target, input submission, idle/busy,
restart/resume, closeout, and interaction with Warp-specific blocks or workflows. If not used,
mark `RETIRED` explicitly rather than silently dropping the surface.

<!-- ADAPTER-WARP-2026-08-END -->


# Appendix F — Failure Museum

Each case records symptom, mistaken inference, actual failure domain, evidence, safe response,
earned doctrine, and maturity. Details are sanitized; private coordinates and identities remain
in the evidence crosswalk.

## F.1 When the alarm died with the agent

**Symptom:** a reviewer stopped reporting. **Mistaken inference:** the work was healthy because an
alarm had been configured. **Cause:** credential death killed both the agent and its in-session
alarm. **Response:** preserve state, pause the live lane, use separately authorized read-only
review, and move alert-only supervision into another failure domain. **Rule:** work, heartbeat,
and human alert are different services.

## F.2 The message that rendered but did not wake

A direct write appeared in a desktop inbox pane, yet the hosted model took no turn. Rendering had
been mistaken for re-entry. **Rule:** prove render, submit, receipt, wake, action, and verification
separately; passive inboxes need a qualified heartbeat, monitor, native steer, or human turn.

## F.3 The two-writers near miss

Two capable agents approached the same mutable artifact from different live surfaces. Shared
goals were mistaken for ownership. **Rule:** one exact write lease per mutable boundary; transfer
by OFFER→ACK→LEASE→RELEASE; stale writers fail closed.

## F.4 The heartbeat deleted after PASS

A phase passed and its only alarm was removed, but later phases still depended on unattended
progress. **Rule:** lifecycle alarms belong to the run; atomically retarget across phases and
retire only at terminal state.

## F.5 The wedge whose cost was detection

A CLI appeared busy for hours. The useful lesson was not the one-key recovery but the missing
multi-signal detector. **Rule:** qualify a signature from transcript movement, child processes,
CPU, prompt state, and last artifact; preserve evidence; permit one bounded intervention; verify.

## F.6 The night process built nothing

A narrow reversible task received a heavyweight regulated-release topology. Hundreds of process
artifacts appeared while product work did not. **Rule:** governance must be proportional; name the
first material artifact and shrink the system when the first focused hour produces only ceremony.

## F.7 Prefix resurrection

A tmux target prefix matched the wrong still-live seat. The command was syntactically valid and
the recipient was capable, which made the error dangerous. **Rule:** resolve exact pane identity
at runtime and refuse ambiguous prefixes.

## F.8 Exact-stamp wake failure

A ledger-poll watcher accepted only a complete identity stamp. A helper defaulted to a different
sender identity, so the message rendered but did not wake the intended agent. Resending with the
exact sender, agent type, session, and target stamp worked. Separately, the sender falsely
reported success after matching the requested reply marker inside its own outgoing request.
**Rule:** identity stamps are wake contracts; verify every field, require receiver-origin ACK, and
exclude self-authored requests when matching completion. Long wrapped payloads still travel by
file and hash as described in Chapter 8.

## F.9 The busy agent reported dead

An idle-only health check did not advance while an agent was doing long tool work. Lack of an
idle prompt was mistaken for death. **Rule:** separate idle, liveness, progress, and health; honor
declared deep work after an action ACK while another observer watches material progress.

## F.10 The swapped submit keys

An expert draft reversed two CLI submission sequences. Familiarity sounded authoritative but was
wrong. Source inspection and controlled nonce tests caught it. **Rule:** provider mechanics carry
source anchors, versions, dates, and executable tests.

## F.11 The alarm bugs found by force test

Future-time and time-zone errors appeared only through the actual scheduled background path.
Interactive testing had been green. **Rule:** configured is not qualified; force every fault
through the real scheduler and real human endpoint.

## F.12 Every first gate found something

Major first reviews found substantive defects and repairs converged. **Rule:** a blocking gate can
be the system succeeding. Optimize for fast truthful discovery, not first-pass theater.

## F.13 The twenty-one-cycle deploy and nine-hour stall

A deployment eventually completed, but gate state and routing lived mainly in narration. Restart
could not reliably reconstruct ownership or the next action. **Rule:** durable state names gate,
owner, last material transition, evidence, and next authorized action.

## F.14 The detached watcher

The OS process continued after shell detachment, but the harness never received its exit as a new
turn. “No event” and “event but no wake” looked identical. **Rule:** use tracked one-shots with task
IDs and prove actual re-entry; detachment is a negative-control test, not a liveness design.

## F.15 The Dropbox sync race

Two writers touched a synchronized artifact near-simultaneously and a later copy looked complete
while provenance was ambiguous. **Rule:** one writer, immutable signed versions, exact hashes, and
new versioned copies; synchronization is transport, not concurrency control.

## F.16 The bb terminal/task confusion

A desktop app exposed both durable tasks and persistent terminals. Treating terminal input as
native model steering overstated wake guarantees. **Rule:** task steering addresses the model;
terminal injection addresses a PTY; each has separate readiness, receipt, and action proof.

## F.17 The Pi route mismatch

Session metadata named one route while the assistant described itself as another. **Rule:** route
attestation comes from harness/provider evidence, not model self-report.

## F.18 The Amended Master

After exact-hash consensus, useful bb material and a version stamp were written directly into the
signed manuscript. The content was valuable; the mutation was still wrong. The original was
reconstructed from its frozen synthesis and recorded patch and verified by hash. **Rule:** signed
bytes are immutable; amendments create a successor version; every derivative records its source
hash.


# Appendix G — Qualified Deterministic-Control Reference

## G.1 What the kernel is

The reference ControlKernel is a deterministic **refuser and recorder**, not the executor of
arbitrary agent work. It validates a manifest and authority capsule, grants one fenced claim,
records intent before effects, receives evidence, enforces transition order, and refuses stale,
duplicate, unauthorized, or self-approved actions. Execution remains in separately constrained
workers.

## G.2 Load-bearing mechanics

- Transactional state uses SQLite WAL with `BEGIN IMMEDIATE` or an equivalent serialization
  boundary for claims and transitions.
- Append-only event tables reject update/delete through triggers or equivalent controls.
- Controller generation and boot-aware process identity prevent a restarted stale controller
  from reusing an old lease.
- Crash-safe locks carry owner, generation, acquisition/expiry, artifact, and takeover evidence.
- Idempotency keys bind run, generation, action, target, and source/manifest hash.
- Effects follow intent: durable pre-intent → authorized child binding → effect → evidence →
  terminal event. Recovery inspects pre-intents instead of blindly replaying.
- Artifact publication uses a temporary file, verification, atomic rename, directory sync where
  required, and a post-publication hash.
- Finalization is ordered and one-way; signed artifacts reject mutation.
- Schema migration is explicit, checked, and reversible or fail-closed.

## G.3 Claims boundary

Qualification has exercised real competing-process races, stale-controller refusal, lock
replacement protection, SIGKILL recovery, replay, finalizer ordering, tamper/TOCTOU refusal, and
self-verdict refusal in the recorded local environment. This supports cooperative-path fail-closed
use. It does **not** establish hostile tamper resistance, desktop wake, exhaustive crash seams,
cross-platform portability, long resource-exhaustion soak, or autonomous host recovery.

The event store can improve delivery, ordering, and idempotency. It cannot wake a dormant desktop
model by itself.

## G.4 RUNNER_Q disposition

RUNNER_Q remains a qualification checklist and implementation companion. Preserve proven tests
and unresolved HOLD items separately. Never cite an old test count as a current claim; report
environment, source hash, test selection, eligible runs, interventions, failures, and deferred
seams. Open HOLDs include broader crash/partial-publication injection, end-to-end manifest
execution, reboot/PID-reuse experiments, live dual-provider dispatch, portability, soak, and
resource exhaustion.


# Appendix H — Provenance, Maturity, Maintenance, and Release

## H.1 Maturity language

Use `PRACTICE`, `EVIDENCE-DERIVED`, `OBSERVED LOCAL USE`, `STAGED`, `PROFILE`, `UNVERIFIED`,
`RETIRED`, and `HISTORICAL OBSERVATION`. Every material claim carries source, evidence modality,
environment, version/route, last verification, known limit, and revalidation trigger.

## H.2 Quantitative operating profiles

Numbers are named profiles, not laws:

| Profile item | Reference value | Use and boundary |
|---|---:|---|
| routine supervisor check | 5 minutes | only when compatible with declared deep work |
| active human-paced reconciliation | about 1 minute | inspect frequently; do not spam the peer |
| ordinary precise re-nudge | normally 3 minutes | at most one, after exact checks |
| classified stall review | 20 minutes | classify before intervening |
| proof-to-review-packet target | 20 minutes | packet, then dispatch on next controller wake |
| role-unavailability backstop | 30 minutes | not a takeover without lease evidence |
| qualified CLI wedge observation | 75 seconds | requires the full multi-signal predicate |
| material handoff receipt/action profile | 2 / 4 minutes | tune for transport and work type |
| evidence recency | 24 hours | shorter for rapidly changing surfaces |
| initial demonstrated-practice run set | 20 qualifying runs | report interventions and failures |
| stronger operational run set | 50 qualifying runs | still environment-scoped |
| non-convergence strike limit | `K=2` | two consecutive non-convergence strikes force a hold |
| maximum repair rounds | `M=5` | stop and escalate rather than looping forever |
| control-wrapper soft cap | about 80 lines | exception requires a recorded reason |
| structured completion packet | at most 32 KiB | hash-reference larger evidence |
| scheduled controller audits | 2 per milestone | midflight and preproof, plus incidents/gates |

Detection latency is approximately observation cadence plus processing and delivery latency.
Timeouts cannot be evaluated without declaring that sum and the task's legitimate deep-work
window.

## H.3 Source-family disposition

| Source family | Unique substance | 0.0.3 destination | Treatment |
|---|---|---|---|
| Operational cookbook | M-rules, profiles, templates, cases | Chapters and Apps E–J | CARRY |
| LIVE_COMMS | send/safety/idle/headless/launch matrices | App E | CARRY, dated |
| Claude wake-loop guide | watcher chain and standing orders | App I | CARRY, sanitized |
| Codex heartbeat guide | same-thread re-entry | App I | CARRY, dated |
| liveness-rig verifier | complete fault matrix | App I | CARRY, placeholders |
| bb guide and field notes | task/terminal cockpit and cases | App E/F | CARRY, first-class |
| Gemini and Antigravity guides | opt-in adapters/security | App E | CARRY, dated |
| troubleshooting guide | symptom and recovery cards | App I/F | CARRY |
| ControlKernel/RUNNER_Q | deterministic mechanics and HOLDs | App G | CONDENSE WITH CLAIM BOUNDARY |
| revision records | mechanisms and numerical profiles | Apps H–J | CARRY with maturity |
| blind reviews/consensus | provenance | release manifest | REFERENCE |
| raw Pi sessions | usage facts and sensitive evidence | sanitized facts only | PRIVATE EVIDENCE ONLY |
| embedded Pi harness | application-scoped deployment | App E | REFERENCE |
| Warp records | historical surface | App E | UNVERIFIED pending ACTIVE/RETIRED decision |
| 0.0.1 and signed 0.0.2 | immutable predecessors | version archive | PRESERVE BY HASH |

## H.4 Anti-loss and maintenance controls

The preservation ledger has one row per surface and load-bearing protocol, never one omnibus
“quirks carried” row. Each row names source anchors, destination, disposition, verification,
claims boundary, and reviewer. The release gate fails if any source or declared surface lacks a
row or explicit disposition.

A named publication maintainer revalidates adapters quarterly and whenever a provider, model
route, helper, launcher, scheduler, authentication mechanism, operating system, or dependency
changes. Dated adapter blocks use stable sentinels so automated tools can locate and replace them.

## H.5 Security and privacy release gate

Before any public release scan: canonical sources; generated manuscript; attachments; raw
evidence boundaries; Git history; archives; metadata; links; and rendered PDF. Reject credentials,
live paths, personal contacts, task/session IDs, private-project identifiers, exact schedules,
unapproved quotations, or sensitive operational-capacity measurements. Raw harness sessions stay
outside Git. Publish useful aggregate measurements only after privacy and operational-security
review.

## H.6 Version and build discipline

Version 0.0.1 is the original local manuscript. Version 0.0.2 is the exact peer-consensus file
identified by SHA-256 in the release manifest. Version 0.0.3 is a new successor that restores the
operator-grade material identified by the independent under-carry audits. Signed predecessors
remain immutable.

The build concatenates the core manuscript and ordered canonical appendices. The release manifest
records every source hash, build command, generated Markdown hash, rendered PDF hash, reviewer,
and exact-hash countersign. Rebuilding from unchanged sources must reproduce the Markdown bytes.

From the version directory, the reference recipe is:

```text
scripts/build-manuscript.sh
scripts/build-pdf.sh
scripts/verify-release.sh
```

The PDF builder stamps the exact generated-Markdown SHA-256 onto the rendered title page. The
verification gate checks that stamp, the predecessor, source-block sentinels, rendered table
column counts, public-safety patterns, and extractable PDF text.

## H.7 0.0.3 changelog

- Restored and expanded bb task steering, persistent-terminal control, and overnight features.
- Added standalone Pi and embedded-Pi application adapters with honest maturity boundaries.
- Restored dated submit, interrupt, idle, headless, launcher, and transport guidance.
- Restored desktop wake-chain, heartbeat, liveness, recovery, lifecycle, communication, ownership,
  and finalization runbooks.
- Restored full templates and quantitative profiles.
- Expanded deterministic-control mechanics and outstanding HOLDs.
- Added security guidance for extensions, plugins, wildcard binds, CDP, remote machines, and raw
  session exports.
- Added the Dropbox race, bb surface confusion, Pi route mismatch, and Amended Master cases.
- Replaced omnibus preservation claims with per-surface dispositions and reproducible versioning.

## H.8 Source and fidelity note

This edition carries transferable operating knowledge in full. Only secrets, live mutable
coordinates, private identity/project crosswalks, raw unredacted evidence, personal schedules,
and unlicensed third-party material remain outside. Placeholders and discovery procedures connect
the public doctrine to a private machine without publishing that machine's coordinates.


# Appendix I — Executable Supervision and Recovery Runbooks

Runbooks turn doctrine into repeatable checks. Replace placeholders through runtime discovery;
never publish live paths, task IDs, schedules, endpoints, credentials, or personal coordinates.
Every runbook produces a record containing environment, version, time, operator, inputs, expected
result, observed result, evidence path/hash, verdict, residual gap, and retirement action.


## I.1 Qualify an unattended-liveness rig

<!-- RUNBOOK-LIVENESS-RIG-2026-08-BEGIN -->

1. Record run, task, generation, supervisor identity, heartbeat schema, expected cadence,
   scheduler, alert route, escalation route, and terminal retirement condition.
2. Distinguish `WAKE_SEEN` from `HEALTH_VALIDATED`. A wake timestamp alone can advance while
   credentials, tools, sources, or action capability are dead.
3. Exercise the real OS-scheduler/background path—not an interactive shell substitute.
4. Inject and verify each fault independently:
   - file missing;
   - unreadable;
   - malformed;
   - stale timestamp;
   - future-dated timestamp;
   - wrong run, agent, session, or generation;
   - non-advancing sequence;
   - `next_wake_expected_by` breach;
   - health-validation lag after a wake;
   - delivery route failure;
   - duplicate alert;
   - alert acknowledgment, escalation, and recovery-clear behavior.
5. Repeat with the screen locked and ordinary sleep/wake policy active.
6. Test the actual human endpoint once with a harmless nonce and once with simulated delivery
   failure. Configuration screenshots are not delivery proof.
7. Exercise incident open, dedupe, acknowledgment, escalation, recovery, and closure.
8. Perform a complete ingress round trip: alert/wake → exact task re-entry → action ACK → harmless
   artifact → independent verification.
9. Retire the rig and prove no orphan scheduler, watcher, alert, or enrolled endpoint remains.

Pass requires every declared fault to alert through the real background path, the correct task to
act only within authority, recovery to clear honestly, and retirement to leave a tombstone.

<!-- RUNBOOK-LIVENESS-RIG-2026-08-END -->


## I.2 Claude Desktop tracked wake chain

<!-- RUNBOOK-CLAUDE-WAKE-2026-08-BEGIN -->

1. Write standing orders containing run/generation, task identity, permitted phase, sources,
   inbox and ledger cursors, per-wake duties, quiet behavior, authority, forbidden actions,
   budget, holds, timeout, backstop scope, retirement, and terminal state.
2. Launch a tracked one-shot watcher through the harness and capture its task identifier.
3. Prove the negative control: a shell-detached watcher may continue at the OS layer yet fail to
   create a model turn. Do not treat `& disown` as equivalent to tracked execution.
4. Watch both the task's own inbox and durable ledger. Reconcile backlog before advancing the
   cursor. Suppress self-writes and compare hashes/structured state rather than tailing forever.
5. Exit on material news or timeout. On every exit, print the full standing orders so a fresh turn
   can reconstruct authority without private context.
6. After the model handles the wake, verify action and only then re-arm the watcher.
7. Install an L2 fresh-session scheduler in another failure domain, narrowly instructed: detect
   and break a stall; do not build, gate, deploy, publish, or answer substantively.
8. Optionally allow one L3 peer nudge carrying one exact nonce and action.
9. Pause/resume all layers together; report which layers are down.
10. At terminal state retire every layer and write a tombstone.

<!-- RUNBOOK-CLAUDE-WAKE-2026-08-END -->


## I.3 Codex Desktop same-thread heartbeat

<!-- RUNBOOK-CODEX-HEARTBEAT-2026-08-BEGIN -->

1. Use the supported heartbeat automation, not a handwritten raw cron approximation.
2. Bind it to the exact thread, run/generation, permitted phase, nonce family, time window, source
   packet, and terminal retirement condition.
3. Instruct each turn to reconcile the exact inbox and durable state before acting. Reject stale
   task identities and unrelated messages.
4. Encode quiet behavior explicitly: unchanged healthy state records a quiet tick and does not
   notify the human. A real blocker, decision, incident, or milestone may notify according to the
   stated policy.
5. Update the existing heartbeat when cadence or instructions change; do not create duplicates.
6. Prove controlled same-thread re-entry, one unchanged quiet tick, one material-news turn, one
   stale-seat rejection, and retirement with no future turn.

<!-- RUNBOOK-CODEX-HEARTBEAT-2026-08-END -->


## I.4 Credential death and terminal wedge recovery

<!-- RUNBOOK-RECOVERY-2026-08-BEGIN -->

### Credential-death differential

Classify separately: provider authentication failure; quota/rate limit; network/DNS/TLS;
application death; task death; scheduler death; watcher death; permission prompt; model wedge;
and healthy declared deep work. Inspect the current provider error, process tree, heartbeat
sequence, last health validation, task events, and artifact movement. Do not infer credential
health from a wake timestamp or infer task death from an old transcript.

Attempt the least invasive authorized recovery, then verify its postcondition. If the credential
cannot be restored without human authority, mark the live lane `PAUSED`, continue safe offline
work, and preserve the exact decision required.

### Qualified wedge signature

Use the recorded 75-second signature only when all conditions hold: transcript does not advance;
no relevant child process is active; CPU is low on two separated observations; and no input prompt
is visible. Capture the pane, process tree, CPU observations, task ID, timestamps, last event, and
last material artifact before intervention. Permit one `Escape` for the exact qualified signature,
then verify prompt return or transcript progress. Escalate rather than stacking interrupts.

On the recorded Claude Code reference version, the documented relaunch environment was exactly
`CLAUDE_ENABLE_STREAM_WATCHDOG=1` and `CLAUDE_STREAM_IDLE_TIMEOUT_MS=300000`. Do not invent PTY,
byte-watchdog, or similarly guessed variables. These names are dated product mechanics: verify
current support before use and remove them when the provider changes or retires the behavior.

<!-- RUNBOOK-RECOVERY-2026-08-END -->


## I.5 Lifecycle sentinel and communication reconciliation

<!-- RUNBOOK-LIFECYCLE-COMMS-2026-08-BEGIN -->

The authority capsule records run, generation, controller, lifecycle state, current phase, exact
scope, sources, effects allowed, effects forbidden, budget, gate state, next authorized action,
human decision, supervisor identities, liveness proof, artifact manifest, and terminal condition.

Retarget a sentinel atomically:

```text
PREPARE → VALIDATE → INSTALL → READBACK → CANARY → COMMIT → DRAIN → VERIFY
```

Until COMMIT, the old generation remains authoritative. If validation or canary fails, hold at
zero new work. After commit, the old generation drains but cannot create new actions. Verify the
new generation through the real wake and alert paths. Terminal state writes an immutable
tombstone.

Communication reconciliation processes backlog before the stored cursor, accepts current and
explicitly prior identities only during a bounded transition, extracts complete structured
envelopes rather than quoted tokens, and deduplicates by run/generation/nonce/message hash. A
material wake requires both a durable record and a proven direct/re-entry path unless one
transactional inbox supplies both. Tests cover backlog, cursor reset, stale prefix, quoted nonce,
duplicate, busy-turn, identity transition, and retirement.

The full lifecycle-sentinel implementation remains `STAGED` until its complete transition and
failure matrix passes on the target environment.

<!-- RUNBOOK-LIFECYCLE-COMMS-2026-08-END -->


## I.6 Ownership, convergence, and finalization

<!-- RUNBOOK-OWNERSHIP-FINALIZATION-2026-08-BEGIN -->

Ownership transfer uses `OFFER → ACK → LEASE → RELEASE`. The lease records exact artifact,
holder identity, generation, start, expiry/freshness, scope, allowed effects, forbidden effects,
source/manifest hash, predecessor, and takeover evidence. Only the holder writes. Compare-and-
swap or equivalent freshness protection rejects stale owners.

Use stable finding IDs across review rounds. A revision closes only when the requested bytes are
present and independently verified; a later mutation reopens the finding. Named convergence
profiles may use two consecutive non-convergence strikes (`K=2`) to force a hold and five maximum
repair rounds (`M=5`) before escalation. These are tunable stop profiles rather than universal
constants. Required independent final verification is separate; never redefine `K` as a count of
clean passes.

Finalize in order: `OPEN → COMMITTING → COMMITTED → FINALIZED → CLOSED`. Capture hashes before
commit, verify the manifest, prohibit self-verdict, obtain exact-hash peer co-sign, retire every
automation/lease/credential/sandbox, and refuse post-PASS mutation. Tests include writer races,
stale takeover, reopened findings, non-convergence, crash during finalization, and mutation after
signature.

<!-- RUNBOOK-OWNERSHIP-FINALIZATION-2026-08-END -->


# Appendix J — Complete Operating Template Kit

<!-- TEMPLATE-KIT-2026-08-BEGIN -->

Use stable field names and store long payloads in files referenced by path and SHA-256. A cold
agent should reconstruct the run from these records without chat history.

## J.1 Project contract

```yaml
run_id:
generation:
objective:
requested_artifacts: []
authoritative_sources: []
scope_in: []
scope_out: []
authority_allowed: []
authority_forbidden: []
effect_envelope:
acceptance_tests: []
evidence_required: []
human_decisions: []
hold_points: []
budget:
  wall_time:
  money:
  tokens:
  agents:
  retries:
  review_rounds:
terminal_condition:
```

## J.2 Model and harness record

```yaml
actor_id:
role:
requested_provider:
requested_model:
reported_provider:
reported_model:
resolved_route_evidence:
fallbacks: []
reasoning_effort:
harness:
harness_version:
session_or_task_id:
workspace:
next_turn_mechanism:
liveness_proof:
context_limit:
instruction_roots: []
skills_plugins_extensions: []
tools: []
permissions_and_sandbox:
memory_sources: []
interventions: []
budget:
verification:
known_limits: []
```

## J.3 Material handoff and receiver ACK

```yaml
run_id:
generation:
nonce:
from:
to:
role:
writer_lease_status:
phase:
artifact_manifest:
payload_path:
payload_sha256:
exact_request:
acceptance:
authority:
forbidden: []
budget_timeout:
ack_required:
expected_reply:
fallback:
```

ACK records receiver, nonce, receipt time, resolved role, understood request, accepted or refused
lease, and any ambiguity. Receipt ACK is not an action ACK or completion verdict.

## J.4 Review request and gate verdict

```yaml
finding_set_id:
artifact_path:
artifact_sha256:
specification_path:
source_manifest:
reviewer_role:
independence_statement:
questions: []
commands_to_rerun: []
severity_scale:
output_path:
done_marker:
timeout:
fallback:
gate_is:
gate_is_not:
verdict:
findings: []
residual_risk: []
```

## J.5 Decision record

```yaml
decision_id:
question:
options: []
recommendations:
  - option:
    evidence:
dissent: []
human_decision:
reason:
consequences: []
revisit_trigger:
```

## J.6 Change record

```yaml
change_id:
requested_by:
authority_source:
artifact_before_sha256:
artifact_after_sha256:
scope:
reason:
tests:
review:
version_created:
signed_predecessor_unchanged:
```

## J.7 Automation registry

```yaml
automation_id:
owner:
run_id:
generation:
kind:
target:
cadence_or_trigger:
instructions_path:
instructions_sha256:
budget:
quiet_policy:
alert_policy:
failure_domain:
last_qualified:
state: ACTIVE|PAUSED|RETARGETING|RETIRED
retirement_condition:
tombstone:
```

## J.8 Authority capsule and transition record

```yaml
run_id:
generation:
controller:
lifecycle_state:
phase:
scope:
sources: []
effects_allowed: []
effects_forbidden: []
budget:
gate_state:
next_authorized_action:
human_decision:
supervisors: []
liveness_evidence:
artifact_manifest:
terminal_condition:
transition:
  from:
  gates:
  on_pass:
  on_fail:
  on_blocked:
  human_reply_required:
  authority_source:
  sentinel_generation:
  terminal:
```

## J.9 Standing orders

```text
RUN / GENERATION
EXACT TASK AND ROLE
PERMITTED PHASE
AUTHORITATIVE SOURCES
INBOX AND LEDGER CURSORS
PER-WAKE DUTIES
QUIET / NOTIFICATION BEHAVIOR
AUTHORITY AND FORBIDDEN EFFECTS
BUDGET AND TIMEOUT
HOLDS AND HUMAN DECISIONS
BACKSTOP SCOPE — YOU ARE NOT THE BUILDER
RE-ARM RULE
RETIREMENT AND TERMINAL STATE
```

## J.10 Release manifest

```yaml
version:
canonical_source:
canonical_sha256:
predecessor_version:
predecessor_sha256:
generated_artifacts:
  - path:
    sha256:
    generator:
source_disposition:
preservation_ledger:
adapter_registry:
runbooks:
licenses:
security_scan:
render_review:
independent_reviews: []
exact_hash_signatures: []
publication_authority:
status:
```

<!-- TEMPLATE-KIT-2026-08-END -->
