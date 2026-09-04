---
name: overnight-two-desktop
description: Coordinate a requested unattended sprint with two explicitly selected desktop control surfaces and independent gated review. Requires proven re-entry on both and a current-run human opt-in.
---

# Overnight: Two Desktops

STOP unless the human explicitly selected two desktop agents for this run.
Otherwise use overnight-one-desktop. Independent review alone does not require two
desktops. bb is an optional named peer, not an inferred third topology.

Roles: one runner/gate-captain/human relay, one cross-provider independent
gatekeeper/co-overseer. Both need qualified native task re-entry and explicit native
task/inbox identities. The gatekeeper does not implement. Additional workers need
separate authorization and single-writer leases. Read desktop-live-comms,
desktop-multi-agent and mesh-comms-core. Both overseers must ACK final closeout.

## Contract and Preflight

Read the canonical [Overnight Cookbook](../../../docs/overnight-cookbook.md), especially
chapters 2, 4-12, 16, 18-20 and Appendices A, I and J. These are the maintained
procedures; historical Part A/B/C and M-number references are not separate authorities.

Confirm back the resolved run contract before starting: exact project/branch, human
goal, allowed writes, forbidden effects, named writer and independent reviewer, model
and harness routes, budget/time limits, first useful delivery, expected unattended
period, alert owner/SLA, and local versus external acceptance. A skill is not a launch
or spending authorization. Preserve dirty/staged work and identify single-writer leases.

Prove a real first round trip with each critical-path peer and one harmless tool action.
Render, task re-entry, nonce ACK and completed work are separate evidence. Qualify a
next-turn mechanism after arming; a process or scheduled-task ID is not proof it wakes
the model. Keep a lifecycle sentinel responsible until joint closeout. Reconcile the
whole current outstanding request set before moving a cursor; a shallow ledger tail
cannot prove no work is pending.

Before unattended reliance, exercise the fixture fault matrix in
[the liveness runbook](../../../docs/overnight-cookbook/runbooks/verify-unattended-liveness-rig.md).
Use structured, generation-fenced heartbeat records; distinguish WAKE_SEEN from
HEALTH_VALIDATED. Test credentials and the actual human wake ingress before absence.
Supervision must survive the agent's credential failure. Declare shared-host failure
domains: use an independent observer or record the human's explicit risk acceptance.
A substitute verifier does not cancel the duty to alert the human to a dead gatekeeper.
If a required mechanism is unavailable, report UNPROVEN/BLOCKED; do not invent it.

## Operating Loop

Read own inbox, reconcile scoped outstanding nonces and artifacts, then classify progress,
liveness and health separately. A missed ACK is an investigation trigger, not death or
permission to replace a peer. Mirror material direct sends to the ledger and require
receiver ACK; uncertainty requires inspection before retry. See desktop-live-comms for
desktop lanes and mesh-comms-core for CLI lanes.

Deliver useful increments during the first hour. Use bounded review/repair rounds with
clear acceptance and escalation; do not let process work substitute for product work.
Only release the next specifically authorized milestone after an independent reviewer
reruns relevant proof. The runner recommends; it cannot mint its own gate approval.
Relayed human instructions need quoted/file-backed evidence and must not conflict with
the latest direct request. Maintain checkpoints, decision/change records, hashes, and
the automation registry. No secret values in evidence or comms.

For a Claude Code wedge, use the cookbook's qualified signature and recovery ladder
(Appendix I.4), not spinner appearance alone. Preserve CPU/children/RSS, checkpoint,
staged state and open nonces. At most one controlled Escape after the full signature,
then verify postconditions and record RESUME. Diagnose recurrence; no blind restart.
Historical watchdog environment knobs require runtime support checks, not assumption.
Run heavy verification as bounded commands with retained output. Track stall/detection
latency and useful progress, not just wake counts.

## Acceptance and Closeout

Stage 1 is local implementation plus independent review/tests and integrity checks.
Stage 2 is any required credentialed, external, web, or human acceptance. Never claim
Stage 1 proves Stage 2. Complete the final handoff, required peer closeout ACKs and
human report before retiring the task-owned supervision; record what remains active.
No push, merge, deployment, production mutation or new agent without the specific
authority in the contract. Never use Ctrl-C as routine Codex clearing.

Report: topology; exact roles/task IDs; artifact hashes; proof commands/results;
Stage-1/Stage-2 status; liveness evidence; unresolved blockers; next human decision.
