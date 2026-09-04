# Skills Catalog

All **27 shipped canonical skills** live in `.agent/skills/<name>/SKILL.md`.
Read the chosen file and required references in full. Hosts without discovery can
read it directly; naming a model or installing a plugin is not required.

The table supplies selection and handoff inputs; the individual skill defines its
full protocol. These skills never expand the human's authorized effects. Use the
lightest [process level](templates/sprint/process-levels.md): solo 0, peers 1, team 2,
supervised sprint 3, delegated gates 4. Ordinary questions stay at level 0.

| Skill | Use / purpose | Required input | Roles | Output | Side-effect boundary |
|---|---|---|---|---|---|
| [add-comments](.agent/skills/add-comments/SKILL.md) | Annotate a shared artifact | Artifact and comment location | Commenters | Attributed comments | Writes agreed comment area |
| [adherence-check](.agent/skills/adherence-check/SKILL.md) | Check a result against a contract | Artifact, requirements and evidence | Checker | Conformance findings | Read-only unless repairs assigned |
| [agy-cli-peer](.agent/skills/agy-cli-peer/SKILL.md) | Join an explicitly selected agy CLI | Socket, session and work scope | Joining peer | Unique seat and ACK proof | Launch only if authorized |
| [competition](.agent/skills/competition/SKILL.md) | Compare independent proposals | Problem, candidates and judging criteria | Competitors and judge | Ranked alternatives | Peer creation and writes need permission |
| [constitutional](.agent/skills/constitutional/SKILL.md) | Draft and ratify shared rules | Draft, stakeholders and ratification rule | Drafters and ratifiers | Constitution and recorded dissent | No external legal or publication effect |
| [democratic](.agent/skills/democratic/SKILL.md) | Make an agreed group decision | Options, electorate and voting rule | Voters and facilitator | Vote record and decision | Only the authorized decision scope |
| [desktop-live-comms](.agent/skills/desktop-live-comms/SKILL.md) | Exchange material desktop handoffs | Exact seats, task IDs, ask and nonce | Sender and receiver | Render/wake/ACK/work evidence | No implied timer or new-task launch |
| [desktop-mesh-peer](.agent/skills/desktop-mesh-peer/SKILL.md) | Join an existing mesh from a desktop | Socket, task identity and assignment | Desktop peer | Registered inbox and nonce ACK | No resetting an existing mesh |
| [desktop-multi-agent](.agent/skills/desktop-multi-agent/SKILL.md) | Avoid collisions among concurrent desktop seats | Exact native task IDs and roster | Concurrent desktop peers | Unique routing and ownership records | No permission inherited from another seat |
| [dev-collaboration](.agent/skills/dev-collaboration/SKILL.md) | Build with review and adversarial checking | Scope, files and acceptance tests | Drafter, reviewer, breaker | Reviewed implementation and findings | Single writer; gates stay scoped |
| [dev-competition](.agent/skills/dev-competition/SKILL.md) | Compare independent implementations | Shared spec and judge criteria | Implementers and judge | Selected implementation and rationale | Isolate writers; no implied merge |
| [gate-keeper](.agent/skills/gate-keeper/SKILL.md) | Check delegated high-risk gates | Evidence packet and delegated authority | Independent gatekeepers | Scoped pass/fail with proof | Cannot grant authority absent from human contract |
| [hierarchical](.agent/skills/hierarchical/SKILL.md) | Delegate through one manager | Goal, roster and task boundaries | Manager and workers | Integrated work and review record | Named write ownership and bounded delegation |
| [init](.agent/skills/init/SKILL.md) | Bootstrap the standard CLI pair | Environment, authenticated CLIs and launch go | Bootstrapper, Claude and Codex | Two peers reporting ready | Launches permissive agents; inspect socket first |
| [mesh-comms-core](.agent/skills/mesh-comms-core/SKILL.md) | Use tmux mesh communication | Socket, exact recipient, message and nonce | Sender and receiver | Direct send, ledger and ACK | Transport is not authority or completion |
| [negotiation](.agent/skills/negotiation/SKILL.md) | Resolve competing requirements | Positions, constraints and decision rule | Negotiating peers | Agreement and unresolved differences | No external commitments without authority |
| [overnight-cookbook](.agent/skills/overnight-cookbook/SKILL.md) | Select unattended topology | Run objective and human constraints | Portal and human | Confirmed launch contract and selected recipe | Selection does not launch anything |
| [overnight-one-desktop](.agent/skills/overnight-one-desktop/SKILL.md) | Run one-portal unattended collaboration | Confirmed contract and qualified liveness | Portal, CLI writer and independent reviewer | Stage-1 proof and Stage-2 disposition | No unapproved launches, merges or live effects |
| [overnight-two-desktop](.agent/skills/overnight-two-desktop/SKILL.md) | Run explicit dual-desktop oversight | Two-desktop go, contract and two wake proofs | Runner and independent gatekeeper | Joint closeout and acceptance evidence | No inferred extra desktop; independent gate required |
| [peer-collaboration](.agent/skills/peer-collaboration/SKILL.md) | Iterate as two equal peers | Artifact, goal and review scope | Two selected peers | Agreed improvement and remaining dissent | Write roles agreed before changes |
| [peer-superset](.agent/skills/peer-superset/SKILL.md) | Combine independent reviews | Frozen artifact and review questions | Independent reviewers and integrator | Consensus revision list preserving dissent | Do not label shared iterations blind |
| [peer-synthi](.agent/skills/peer-synthi/SKILL.md) | Synthesize independent research or proposals | Question, constraints and selected peers | Independent contributors and synthesizer | Decision brief with alternatives | Scope research and publication separately |
| [publication-pipeline](.agent/skills/publication-pipeline/SKILL.md) | Review editorial material | Draft, audience and release criteria | Writers, editors and reviewers | Publication-ready draft and review record | Actual publication needs permission |
| [ready-rock-quartet](.agent/skills/ready-rock-quartet/SKILL.md) | Coordinate a four-role build | Spec, authorized roster and write boundaries | Lead, reviewer, breaker, verifier | Implementation with final independent proof | New agents only with explicit launch authority |
| [search-synth](.agent/skills/search-synth/SKILL.md) | Research and synthesize evidence | Question, source criteria and scope | Researchers and synthesizer | Sourced synthesis and uncertainty | External access and sensitive data stay scoped |
| [sprint-overseer](.agent/skills/sprint-overseer/SKILL.md) | Supervise an authorized long sprint | Sprint file, exact peers and closeout markers | Overseer and working team | Liveness/progress log and closeout | Timer creation and interventions need authority |
| [warp-mesh-peer](.agent/skills/warp-mesh-peer/SKILL.md) | Use Warp as the terminal surface | Existing/new peer choice and launch configuration | Warp-hosted CLI peers | Visible tmux peers and ACK | Warp is not a new authority or transport |

## Invoke Explicitly

> Read .agent/skills/dev-collaboration/SKILL.md. Use the existing authorized peers:
> Claude as drafter, Codex as reviewer/breaker. Artifact: <path>. Allowed writes:
> <paths>. Acceptance: <tests>. Do not launch more agents or publish.

## Mirrors and Discovery

`.agent/` is canonical; `.claude/skills/` and `.codex/skills/` are matching
repository mirrors. `peer-synthi` additionally lives in `.agents/skills/peer-synthi/`,
including its references. bb's entry is [.bb/AGENTS.md](.bb/AGENTS.md) and
[its guide](docs/BB-DESKTOP.md); give the guide explicitly to tasks rooted elsewhere.

Prefer targeted copying of changed canonical files after preserving target-only edits.
`scripts/deploy-skills.sh` deletes ALL immediate children in both mirror directories;
it is not a harmless parity check. Do not use it without reviewing/preserving extras
and explicit replacement authority. Run `scripts/check-skills-parity.sh` to check.
Do not put deferred or broken skills back into discovery merely to retain their files.

One maintained book: [The Overnight Cookbook](docs/overnight-cookbook.md).
`create-skin`, `evals` and `hyperdomo` remain deferred; `test-4-series` is not a
standing system skill. `projects/` is reserved for downstream user work.
