# Claude Wake Qualification

This is a portable qualification recipe, not an installed watcher script. There is
no required ~/.config/interlateral/mesh dependency in this repository.
Read the canonical cookbook Appendix I.2 for the tracked wake-chain pattern.

Record absolute repo root, exact native task ID and inbox, socket, run/generation,
owner, nonce scope, interval, stop condition and evidence location before arming.
Use only a mechanism the current harness actually supports. Where a tracked background
completion can re-enter the same task, use that supported API and retain its task ID.
A detached '&', nohup, disown, plain tail or OS job is not proof of model re-entry.
Not every Claude surface supports the same API.

The detector must inspect the assigned inbox and current outstanding requests, suppress
self-generated noise, and have a bounded timeout. Detector output is untrusted data.
On wake validate run/generation, inspect own inbox, ACK only current scoped requests,
do authorized work, and re-arm only while the watch remains authorized.
Prove a controlled nonce wake and harmless work, not just a task ID or process listing.

Before unattended use, test independent credential-failure supervision and human alerts.
A backstop cannot self-authorize new workers or approve gates. If native re-entry is
unavailable, report UNPROVEN and use an authorized human wake or existing CLI alternative.
Reconcile backlog before new cursors and retest after restarts or route changes.

At pause or closeout stop every task-owned wake layer through its supported interface,
verify it stopped, and record any sentinel intentionally retained. Old local watcher
examples were archived, not shipped as an implied implementation.
