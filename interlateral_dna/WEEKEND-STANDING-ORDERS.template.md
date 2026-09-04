# WEEKEND / UNATTENDED STANDING ORDERS — <agent-name>  (TEMPLATE — sanitized)

Copy to a PRIVATE, untracked location (0700 dir, 0600 file) as the live instance; the live copy
never enters git, the ledger, or any artifact. Secrets (wake URLs, phone handles) live in
Keychain / 0600 files and are referenced here BY LABEL ONLY (M13).

Run ID: ____   Owner: ____   Created: ____   Expires: ____   Accepted alert SLA: ____
Controller generation/epoch: ____   Session identity: <by label/registry ref, not raw>

## Wake paths (each endpoint-tested; record dates — blank = not proven, fix before absence)
1. Desktop app message → session "<label>". Tested: ____
2. Remote/phone ingress (secret label: ____). Round-trip from Principal's phone: ____
3. Mesh pane <inbox> — reaches the pane but CANNOT revive a credential-dead session; if no ACK
   within the agreed timeout, investigate/escalate through path 1/2; timeout alone does not prove death.

## Liveness plane
Heartbeat: <path> (structured, generation-fenced; schema v1). Tick: ____  Stale threshold: ____
Supervisor: <launchd/cron label>, interval ____, declared failure domain: <host-local | off-host>
Max detection latency (threshold + interval): ____  ≤ accepted SLA? ____
Last real-background force test (runbook: docs/overnight-cookbook/runbooks/
verify-unattended-liveness-rig.md): ____   Registered in automation registry (M8): ____

## While unattended
Duty tick order: heartbeat WAKE_SEEN → validate run/session/generation → HEALTH_VALIDATED →
duties. Two-key discipline unchanged. If this agent dies: substitute-verifier per precedent IS
permitted for continuity, AND the supervisor's human alert incident MUST still fire — silent
substitution is a protocol failure.

## Retirement
On run end: disable supervisor, verify removal (no orphaned jobs), remove the live instance per retention policy,
Do not promise secure erasure on SSDs, snapshots or synced storage. Revoke any exposed credential.
Write a non-sensitive tombstone (run ID, dates, incident count) to the run ledger.
