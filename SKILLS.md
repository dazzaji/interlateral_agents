# Skills Index

Canonical source of truth:
`.agent/skills/`

Deployed copies:
- `.claude/skills/`
- `.codex/skills/`

Use `scripts/deploy-skills.sh` after editing the canonical copy.

v0.1 includes the full 16-skill canonical set from `interlateral_alpha`. The files are present and deployable in this repo. Some heavier skills still describe roadmap-era systems such as evals, dashboard skins, or advanced orchestration; those references are preserved for continuity, but the v0.1 starter scope is centered on the duo launcher, peer helpers, direct tmux comms, and readable skill files.

`projects/` is reserved for downstream user work. Do not put system skills there.

## Included Skills

| Skill | Canonical path | Notes |
|---|---|---|
| `add-comments` | `.agent/skills/add-comments/SKILL.md` | Shared review/comments helper |
| `adherence-check` | `.agent/skills/adherence-check/SKILL.md` | Conformance-style validation workflow |
| `competition` | `.agent/skills/competition/SKILL.md` | Parallel competition pattern |
| `constitutional` | `.agent/skills/constitutional/SKILL.md` | Federated drafting and ratification |
| `create-skin` | `.agent/skills/create-skin/SKILL.md` | Refers to deferred dashboard skin work |
| `democratic` | `.agent/skills/democratic/SKILL.md` | Equal-vote decision process |
| `dev-collaboration` | `.agent/skills/dev-collaboration/SKILL.md` | Drafter / reviewer / breaker workflow |
| `dev-competition` | `.agent/skills/dev-competition/SKILL.md` | Dual implementation + judge |
| `evals` | `.agent/skills/evals/SKILL.md` | Refers to deferred eval/trace tooling |
| `hierarchical` | `.agent/skills/hierarchical/SKILL.md` | Boss / worker delegation pattern |
| `hyperdomo` | `.agent/skills/hyperdomo/SKILL.md` | Refers to advanced orchestration |
| `negotiation` | `.agent/skills/negotiation/SKILL.md` | Structured trade-off process |
| `peer-collaboration` | `.agent/skills/peer-collaboration/SKILL.md` | Two-peer collaboration loop |
| `publication-pipeline` | `.agent/skills/publication-pipeline/SKILL.md` | Editorial multi-round pipeline |
| `search-synth` | `.agent/skills/search-synth/SKILL.md` | Search and synthesis workflow |
| `test-4-series` | `.agent/skills/test-4-series/SKILL.md` | Test/eval project skill |

## Typical Usage

Name the skill explicitly in your prompt, for example:

```text
Use the dev-collaboration skill at .agent/skills/dev-collaboration/SKILL.md.
CC is Drafter. Codex is Reviewer+Breaker.
Artifact: dev_plan/dev_plan.md
```

After deployment, Claude Code reads from `.claude/skills/` and Codex reads from `.codex/skills/`.
