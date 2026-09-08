# Historical Lineage

Interlateral Agents did not begin as a clean-room mesh design. It is the maintained
result of a sequence of late-2025 and early-2026 experiments in observation, embodied
agent control, durable coordination, structured work decomposition, and human
governance. This history explains where several present patterns came from; it does
not enlarge the current system's scope or authority.

Historical repositories and artifacts are provenance, not normative specifications.
Current behavior is defined by this repository's current documentation, skills, tests,
and explicitly accepted operating procedures.

## Experimental Sequence

### AgentO and observability

The `agento_otel_for_hyperdomo` experiment asked how agent activity could be observed
and evaluated through structured telemetry rather than inferred from a chat transcript.
That work anticipated the present emphasis on evidence receipts, inspectable state,
and the difference between reported activity and verified progress.

### TMUX HyperDomo

TMUX HyperDomo made agent work visible and spatial. Manager and worker processes lived
in inspectable panes, communications survived individual turns, and cockpit/Situation
Room concepts put the human supervisor inside the operating architecture. This is part
of the ancestry of today's exact peer surfaces and local mesh.

### Hypertree Alpha and Beta

Hypertree combined the HyperDomo actuator with durable comtree communications and Git
worktrees. Alpha explored isolated ownership and concurrent implementation. Beta
developed a reusable manager/overseer template, task envelopes, permission escalation,
stall handling, state snapshots, audit events, and design patterns for review and
integration.

The hypertree metaphor described work that was not merely sequential: AND/OR plans,
integrations requiring several parents, decisions affecting several tasks, and module
"bags" used to constrain overlapping work. Two small greeter repositories then tested
whether the patterns transferred across projects and harnesses.

### Interlateral Alpha and the maintained mesh

Interlateral Alpha began separating a reusable collaboration layer from the broader
Hypertree product vision. The maintained Interlateral repository generalized that
layer and made its proof boundaries explicit: direct delivery and durable ledger
recording are separate; render is not wake; wake is not acknowledgment; acknowledgment
is not completion; local proof is not human or external acceptance.

The Overnight Cookbook later organized those lessons—including failed runs—into an
operating doctrine for authorized, inspectable, recoverable, long-horizon agent work.

## Contributions That Continue

| Earlier contribution | Present expression |
|---|---|
| Visible tmux operations room | Inspectable local mesh surfaces and exact peer addresses |
| Comtree coordination memory | Direct delivery plus a distinct ledger/audit record |
| AND/OR plans and multi-parent handoffs | Dependencies, ownership, acceptance gates, and peer workflows |
| Manager, reviewer, breaker, and overseer roles | Selectable skills and proportionate process levels |
| Stall and permission handling | Liveness contracts, sentinels, escalation, and honest blocked states |
| State snapshots, replay, and telemetry | Artifact memory, evidence, observability, and recovery doctrine |
| Situation Room and human control | Authority boundaries and explicit external-acceptance gates |
| Multi-harness experiments | Interoperability across models, CLIs, desktops, browsers, and tools |

## Ideas Not Carried Forward by Default

The earlier work also considered dashboards, hosted infrastructure, databases, APIs,
generalized event systems, browser transports, business-system integrations, and a
broad autonomous control plane. These are not implied Interlateral features. Some are
explicitly deferred or out of scope in the current roadmap.

Historical scripts also require requalification before reuse. Provider interfaces,
browser mechanics, permission systems, and security assumptions change. An influential
prototype is evidence about a design idea, not proof that its implementation remains
safe or correct.

## Preservation

The original Git histories were marked with dated archival tags, exported as complete
Git bundles, and accompanied by source snapshots and captures of unfinished worktree
states. The private archival capsule also records the domain-retirement decision,
repository visibility, checksums, key artifacts, and recovery instructions.

This separation is intentional: Interlateral remains small and current, while the
Hypertree archive preserves the intellectual record without silently reviving its old
roadmap.
