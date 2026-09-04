# Runbook — Verify the unattended-liveness rig (M3H / M17-as-amended)

Run before every unattended reliance, and after any change to heartbeat writer, supervisor,
or alert channel. Uses a FIXTURE heartbeat — never backdate the production file (racing a live
writer produces flaky evidence).

## 1. Static state
Supervisor job present (`launchctl list | grep <label>` or crontab); automation registry entry
(M8) current; heartbeat file 0600 in 0700 dir; incident log writable.

## 2. Live heartbeat semantics
Observe one real tick: `WAKE_SEEN` appended at entry; `HEALTH_VALIDATED` appended after
validation; `seq` advanced by 1; `generation` matches the run manifest.

## 3. Fault matrix — point the supervisor at a fixture copy (env/flag), then verify EACH alerts
Stale (older than threshold; on macOS create with
`touch -t "$(date -v-4H +%Y%m%d%H%M)" fixture` — Linux: `touch -d '4 hours ago' fixture`);
missing file; unreadable file; malformed JSON; wrong session/run/generation; non-advancing seq
across two checks; future `wake_seen_at` beyond skew allowance; `next_wake_expected_by`
breached; `WAKE_SEEN` present but `HEALTH_VALIDATED` absent > one tick.

## 4. Real background path (the test that matters)
Trigger via the OS scheduler itself — macOS: `launchctl kickstart -k gui/$(id -u)/<label>` — not
an interactive shell run. Verify from background context: incident OPENED in the log; local
notification fired; phone message actually arrived on the Principal's phone; behavior with the
screen locked; a delivery-failure case (e.g., Messages signed out) is detected or safely
simulated and logged.

## 5. Incident semantics
Duplicate suppression within the rate window; escalation send at 2× threshold; ACK via the ack
file / monitored reply clears to `ACKED`; a fresh valid generation-fenced heartbeat moves
`ACKED`/`OPEN` → `RECOVERY_VERIFY` → `HEALTHY`; incident `CLOSED` lines are timestamped and
non-sensitive.

## 6. Wake ingress (M17-as-amended)
From the Principal's actual phone: open the session's remote ingress (label from the private
standing orders), send "ping", verify an authenticated reply from the CORRECT session identity,
then date-stamp the private standing-orders instance. Also verify the desktop-message path.

## 7. Retirement drill
Disable the supervisor; verify no orphaned job remains; confirm tombstone written.

Record date + operator + per-case results in the private standing-orders instance; a
non-sensitive summary line goes to the run ledger.
