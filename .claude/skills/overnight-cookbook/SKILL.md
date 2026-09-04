---
name: overnight-cookbook
description: Select and confirm an overnight or long-running unattended collaboration topology. Use only for a requested unattended run, not ordinary questions or short tasks.
---

# Overnight Selector

Default: one Codex Desktop portal with a durable CLI writer and independent,
cross-provider CLI reviewer. Claude Desktop is off the critical path unless explicitly
selected. Two-desktop is an explicit current-run opt-in, never inferred from old context.
bb is optional only when selected; record its exact task ID and read docs/BB-DESKTOP.md.

1. Read the [canonical cookbook](../../../docs/overnight-cookbook.md), chapter 4 and
   Appendix A (launch contract).
2. Read overnight-one-desktop, or overnight-two-desktop if explicitly requested.
3. Confirm back topology, roles, provider routes, scope, permissions, budget, unattended
   interval, liveness/alert mechanisms, first-hour delivery and acceptance with the human.
4. Wait for the required go; do not launch agents or timers during orientation.

Ordinary tasks use [process levels](../../../templates/sprint/process-levels.md) 0-2.
This selector composes existing skills; it does not introduce a new launcher.
Output: the resolved contract and selected skill, or the specific missing prerequisites.
