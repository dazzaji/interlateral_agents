# Interlateral Agents

A local toolkit for explicitly assigned agents to communicate, review each other's work,
and collaborate using reusable skills. This is the v0.2.0 mesh starter, not a hosted
platform or the ControlKernel service.

## Start Here

**Just understand the repo:** give any capable agent this prompt:

> Read this repository's AGENTS.md and SKILLS.md. Briefly explain the collaboration
> options. Do not launch or stop agents, join or recreate a mesh, install tools, or
> change files until I ask. Identify yourself uniquely when collaboration is authorized.

**Join an existing mesh:** use a separate, explicit request:

> Join the existing Interlateral mesh for my assignment. Inspect the socket and active
> peers first; do not restart it. Use a collision-checked identity tied to your actual
> task. Tell me your exact sender, inbox, native task address, and nonce ACK result.
> Do not launch additional agents or timers.

**Start a new two-agent mesh:** after reading the security notice, install the
prerequisites, open Claude Code or Codex CLI in this directory, and say:
`Use the init skill in this repo.` The bootstrap agent runs `./me.sh`, which starts
Claude Code and Codex CLI. Inspect an existing socket before any launch; `--force`
can replace sessions and needs explicit permission. Launches use provider accounts
and can consume usage or incur charges.

## Prerequisites and Security

Node.js 20+, Git, tmux, a supported POSIX shell, and authenticated Claude Code and
Codex CLIs for the default pair. Desktop integration is optional. Model names are
configuration, not prerequisites; inspect the launcher's printed commands and override
`CLAUDE_MODEL` / `CODEX_MODEL` only with a route supported by your account.

**Security notice:** `init` / `me.sh` launches Claude with
`--dangerously-skip-permissions` and Codex with
`--dangerously-bypass-approvals-and-sandbox`. Those bypass normal approval/sandbox
protections. Run only in an environment where you accept that risk. Optional peer
launchers follow the same trust model. A skill or peer message cannot authorize
launches, publication, spending, or production changes.

For JavaScript client dependencies and the full local self-tests, run
`npm ci --ignore-scripts` from `interlateral_dna/`, then `npm test`.
The isolated tmux transport suite itself needs no npm dependencies.

## Choose Your Workflow

- One bounded task: solo, no mesh needed.
- Compare or review: `peer-collaboration`, `peer-superset`, or `peer-synthi`.
- Build as a team: `dev-collaboration`, `hierarchical`, or `ready-rock-quartet`.
- Long unattended work: `overnight-cookbook` selects a topology and requires an
  explicit launch contract, proven liveness, ownership, and acceptance gates.
- Higher-risk delegated actions: consider `gate-keeper`; it does not grant authority.

These correspond to levels 0-4 in [Process Levels](templates/sprint/process-levels.md).
Use the lightest adequate process. Ordinary questions do not require an overnight system.

## Find Your Way

- [Agent entry](AGENTS.md): identity, scope, joining, transport and capability boundaries.
- [All 27 skills](SKILLS.md): purpose, inputs, roles, outputs, and explicit loading.
- [The Overnight Cookbook](docs/overnight-cookbook.md): the single maintained book.
- [bb Desktop](docs/BB-DESKTOP.md), [Claude adapter](CLAUDE.md), [Codex adapter](docs/CODEX-ENTRY.md).
- [Transport verification](docs/MESH-TRANSPORT.md) and [troubleshooting](TROUBLESHOOTING.md).
- [ControlKernel home](docs/CONTROLKERNEL.md): separate development home; not started here.
- [Roadmap](ROADMAP.md): deferred systems, not an invitation to implement them.

Canonical skills live in `.agent/skills/`; committed mirrors are `.claude/skills/`
and `.codex/skills/`. Read any SKILL.md explicitly if your host does not discover it.
Do not run `scripts/deploy-skills.sh` casually: it deletes all immediate children of
both mirror directories. Prefer targeted copies after preserving modified/extra files,
then run `scripts/check-skills-parity.sh`.

## Communication and Verification

The default socket is `/tmp/interlateral-agents-tmux.sock`. Direct delivery reaches a
peer surface; `interlateral_dna/comms.md` is the local audit ledger, never a wake signal.
A render is not a native task wake or an agent ACK. Material work requires all applicable
proofs; use exact identities and fresh request nonces.

Run isolated transport regressions with:
`node --test interlateral_dna/tests/mesh/mesh-transport.test.js`.
They use a private scratch socket, never the live mesh. See the transport guide for
tested boundaries and the intentionally unverified CLI matrix.
