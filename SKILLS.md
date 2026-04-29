# Skills Index

Canonical source of truth:
`.agent/skills/`

Deployed copies:
- `.claude/skills/`
- `.codex/skills/`

Use `scripts/deploy-skills.sh` after editing the canonical copy.

v0.1 now ships a 17-skill canonical set. Three reusable skills (`create-skin`, `evals`, `hyperdomo`) were removed from the v0.1 catalog because they depend on infrastructure that has not shipped yet; they are tracked as deferred in `ROADMAP.md` and will be restored when their supporting systems are ready. `test-4-series` was a one-off project/test skill and is not treated as part of the standing deferred catalog.

`projects/` is reserved for downstream user work. Do not put system skills there.

## Included Skills

| Skill | Canonical path | Notes |
|---|---|---|
| `add-comments` | `.agent/skills/add-comments/SKILL.md` | Shared review/comments helper |
| `adherence-check` | `.agent/skills/adherence-check/SKILL.md` | Conformance-style validation workflow |
| `competition` | `.agent/skills/competition/SKILL.md` | Parallel competition pattern |
| `constitutional` | `.agent/skills/constitutional/SKILL.md` | Federated drafting and ratification |
| `democratic` | `.agent/skills/democratic/SKILL.md` | Equal-vote decision process |
| `desktop-mesh-peer` | `.agent/skills/desktop-mesh-peer/SKILL.md` | Desktop peer inbox, identity, and ACK proof |
| `dev-collaboration` | `.agent/skills/dev-collaboration/SKILL.md` | Drafter / reviewer / breaker workflow |
| `dev-competition` | `.agent/skills/dev-competition/SKILL.md` | Dual implementation + judge |
| `hierarchical` | `.agent/skills/hierarchical/SKILL.md` | Boss / worker delegation pattern |
| `init` | `.agent/skills/init/SKILL.md` | Standard two-agent CLI mesh initializer via `me.sh` |
| `mesh-comms-core` | `.agent/skills/mesh-comms-core/SKILL.md` | Direct-send, tmux, identity, ledger, and ACK transport mechanics |
| `negotiation` | `.agent/skills/negotiation/SKILL.md` | Structured trade-off process |
| `peer-collaboration` | `.agent/skills/peer-collaboration/SKILL.md` | Two-peer collaboration loop |
| `publication-pipeline` | `.agent/skills/publication-pipeline/SKILL.md` | Editorial multi-round pipeline |
| `ready-rock-quartet` | `.agent/skills/ready-rock-quartet/SKILL.md` | Four-agent visible-terminal launch and role-lock workflow |
| `search-synth` | `.agent/skills/search-synth/SKILL.md` | Search and synthesis workflow |
| `sprint-overseer` | `.agent/skills/sprint-overseer/SKILL.md` | Periodic intelligent sprint oversight with per-sprint logging |

## Typical Usage

Name the skill explicitly in your prompt, for example:

```text
Use the dev-collaboration skill at .agent/skills/dev-collaboration/SKILL.md.
CC is Drafter. Codex is Reviewer+Breaker.
Artifact: path/to/work-plan.md
```

After deployment, Claude Code reads from `.claude/skills/` and Codex reads from `.codex/skills/`.

For repo-agnostic sprint oversight, point the skill at an absolute sprint file path in any working repo and optionally start the mechanical wake-up helper:

```text
Use the sprint-overseer skill.
Sprint file: /abs/path/to/project/docs/sprint.md
Manager session: ia-claude
Sprint team pattern: s3-*
```

```bash
scripts/sprint_overseer.sh /abs/path/to/project/docs/sprint.md \
  --closeout-file /abs/path/to/project/docs/evidence/sprint3_proof.md \
  --done-marker "STATUS: DONE" \
  --stop-file /abs/path/to/project/docs/evidence/sprint3_overseer_closeout.md \
  --stop-marker "STATUS: OVERSEER-DONE" \
  --interval 300
```
