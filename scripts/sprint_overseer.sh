#!/usr/bin/env bash
set -euo pipefail

# Generic heartbeat loop for the sprint-overseer skill.
# The script has no judgment of its own. It waits for the overseer terminal
# to be idle, injects a hard-wired wake-up prompt using the CLI-first
# Escape-then-Enter pattern, and stops only when the configured overseer
# closeout artifact contains the configured stop marker. Team completion and
# overseer completion are intentionally separate states.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$IA_ROOT/scripts/tmux-config.sh"

usage() {
  cat <<'EOF'
Usage:
  scripts/sprint_overseer.sh /abs/path/to/sprint.md [OPTIONS]

Options:
  --interval SECONDS    Poll interval in seconds (default: 300)
  --manager SESSION     Sprint lead tmux session (default: ia-claude)
  --overseer SESSION    Overseer tmux session (default: ia-codex)
  --closeout-file PATH  Explicit team-completion artifact to watch
  --done-marker TEXT    Team done marker (default: STATUS: WORKSHOP-READY)
  --stop-file PATH      Explicit overseer-completion artifact to watch (default: closeout-file)
  --stop-marker TEXT    Overseer stop marker (default: done-marker)
  --team-pattern GLOB   Worker session glob for overseer context (default: sprint*)
  --idle-timeout SEC    Max seconds to wait for overseer prompt to go idle before skipping this cycle (default: 120)
  --ack-timeout SEC     Max seconds to wait for HEARTBEAT_ID acknowledgment in overseer log (default: 60)
  --native-file PATH    Write Claude heartbeat payloads to a shared file instead of TUI injection
  --validation-mode     Send a narrow validation prompt instead of a full sprint-overseer prompt
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

SPRINT_FILE="${1:-}"
if [[ -z "$SPRINT_FILE" ]]; then
  usage
  exit 1
fi
shift

if [[ ! -f "$SPRINT_FILE" ]]; then
  echo "ERROR: Sprint file not found: $SPRINT_FILE" >&2
  exit 1
fi

INTERVAL_SEC=300
MANAGER_SESSION="${CC_SESSION:-ia-claude}"
OVERSEER_SESSION="${CODEX_SESSION:-ia-codex}"
DONE_MARKER="STATUS: WORKSHOP-READY"
TEAM_PATTERN="sprint*"
CLOSEOUT_FILE=""
STOP_FILE=""
IDLE_TIMEOUT_SEC=120
STOP_MARKER=""
ACK_TIMEOUT_SEC=60
NATIVE_FILE=""
VALIDATION_MODE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --interval)
      INTERVAL_SEC="$2"
      shift 2
      ;;
    --manager)
      MANAGER_SESSION="$2"
      shift 2
      ;;
    --overseer)
      OVERSEER_SESSION="$2"
      shift 2
      ;;
    --closeout-file)
      CLOSEOUT_FILE="$2"
      shift 2
      ;;
    --stop-file)
      STOP_FILE="$2"
      shift 2
      ;;
    --idle-timeout)
      IDLE_TIMEOUT_SEC="$2"
      shift 2
      ;;
    --ack-timeout)
      ACK_TIMEOUT_SEC="$2"
      shift 2
      ;;
    --native-file)
      NATIVE_FILE="$2"
      shift 2
      ;;
    --done-marker)
      DONE_MARKER="$2"
      shift 2
      ;;
    --stop-marker)
      STOP_MARKER="$2"
      shift 2
      ;;
    --team-pattern)
      TEAM_PATTERN="$2"
      shift 2
      ;;
    --validation-mode)
      VALIDATION_MODE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

SPRINT_DIR="$(cd "$(dirname "$SPRINT_FILE")" && pwd)"
if [[ -z "$CLOSEOUT_FILE" ]]; then
  CLOSEOUT_FILE="$SPRINT_DIR/evidence/sprint_closeout.md"
fi
if [[ -z "$STOP_FILE" ]]; then
  STOP_FILE="$CLOSEOUT_FILE"
fi
if [[ -z "$STOP_MARKER" ]]; then
  STOP_MARKER="$DONE_MARKER"
fi
OVERSEER_LOG="$SPRINT_DIR/sprint-overseer-log.md"
TIMER_LOG="$SPRINT_DIR/sprint-overseer-timer.log"

mkdir -p "$SPRINT_DIR/evidence"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$1" | tee -a "$TIMER_LOG"
}

team_done_ready() {
  [[ -f "$CLOSEOUT_FILE" ]] && grep -q "$DONE_MARKER" "$CLOSEOUT_FILE" 2>/dev/null
}

overseer_done_ready() {
  [[ -f "$STOP_FILE" ]] && grep -q "$STOP_MARKER" "$STOP_FILE" 2>/dev/null
}

# --- Launch Preflight ---
# Verify the timer can actually do its job before entering the main loop.
# This catches the Sprint 5.5 failure mode: timer "started" but target is wrong.
preflight_check() {
  local ok=true

  if [[ ! -f "$SPRINT_FILE" ]]; then
    log "PREFLIGHT FAIL: Sprint file not found: $SPRINT_FILE"
    ok=false
  fi

  if ! run_tmux has-session -t "$OVERSEER_SESSION" 2>/dev/null; then
    log "PREFLIGHT FAIL: Overseer session $OVERSEER_SESSION not found on shared socket"
    ok=false
  else
    # Check pane is running a CLI, not a bare shell
    local pane_cmd
    pane_cmd="$(pane_current_command "$OVERSEER_SESSION")"
    if ! pane_seems_cli "$OVERSEER_SESSION"; then
      log "PREFLIGHT FAIL: Overseer pane $OVERSEER_SESSION is running '$pane_cmd' (expected claude, codex, or gemini CLI)"
      ok=false
    else
      log "PREFLIGHT OK: Overseer pane running '$pane_cmd'"
    fi
  fi

  if ! run_tmux has-session -t "$MANAGER_SESSION" 2>/dev/null; then
    log "PREFLIGHT FAIL: Manager session $MANAGER_SESSION not found on shared socket"
    ok=false
  else
    local manager_cmd
    manager_cmd="$(pane_current_command "$MANAGER_SESSION")"
    if ! pane_seems_cli "$MANAGER_SESSION"; then
      log "PREFLIGHT FAIL: Manager pane $MANAGER_SESSION is running '$manager_cmd' (expected claude, codex, or gemini CLI)"
      ok=false
    else
      log "PREFLIGHT OK: Manager pane running '$manager_cmd'"
    fi
  fi

  if [[ -f "$STOP_FILE" ]] && grep -q "$STOP_MARKER" "$STOP_FILE" 2>/dev/null; then
    log "PREFLIGHT FAIL: Stop file already contains '$STOP_MARKER' — timer would exit immediately"
    ok=false
  fi

  if [[ "$ok" == "false" ]]; then
    log "PREFLIGHT FAILED — timer will not start. Fix the issues above and retry."
    exit 1
  fi

  log "PREFLIGHT PASSED — all checks green"
}

# --- Heartbeat Acknowledgment ---
# Generate a unique heartbeat ID per cycle. The overseer must echo this ID
# in the overseer log for the cycle to count as acknowledged.
generate_heartbeat_id() {
  printf 'HB-%s-%04d-%d' "$(date -u '+%Y%m%dT%H%M%SZ')" "$CHECKPOINT" "$$"
}

check_heartbeat_ack() {
  local hb_id="$1"
  local max_wait="${2:-60}"
  local elapsed=0
  while (( elapsed < max_wait )); do
    if [[ -f "$OVERSEER_LOG" ]] && grep -Fq "HEARTBEAT_ID: $hb_id" "$OVERSEER_LOG" 2>/dev/null; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  return 1
}

build_validation_prompt() {
  local hb_id="$1"
  cat <<EOF
HEARTBEAT VALIDATION [$hb_id]

This is a heartbeat transport/wake-up validation, not a sprint poll.

Do exactly this now:
1. Create $OVERSEER_LOG if it does not exist.
2. Append this exact block:

## $(date '+%Y-%m-%d %H:%M:%S %Z') — Validation heartbeat
HEARTBEAT_ID: $hb_id
STATUS: TIMER-ACK

3. End your reply with exactly: TIMER-ACK-$hb_id

No other analysis. No sprint work.
EOF
}

wake_overseer() {
  local hb_id="$1"
  local prompt
  if (( VALIDATION_MODE == 1 )); then
    prompt="$(build_validation_prompt "$hb_id")"
  elif team_done_ready; then
    prompt="HEARTBEAT WAKE-UP [$hb_id]: TEAM COMPLETED — Perform Joint ACK now.

Current time: $(date '+%Y-%m-%d %H:%M:%S %Z')

Use the sprint-overseer skill.
Sprint file: $SPRINT_FILE
Manager session: $MANAGER_SESSION
Sprint team pattern: $TEAM_PATTERN
Overseer log: $OVERSEER_LOG
Team evidence file: $CLOSEOUT_FILE
Team done marker: $DONE_MARKER
Overseer stop file: $STOP_FILE
Overseer stop marker: $STOP_MARKER

Execute the post-team completion process:
1. Review the sprint evidence file and the latest live state now.
2. Verify all declared health checks and regression surfaces.
3. Inspect the team terminals only as needed to confirm the final gate state.
4. Coordinate with your peer overseer for Joint ACK.
5. Append a checkpoint entry to $OVERSEER_LOG that includes this heartbeat ID: $hb_id
6. If the sprint is truly complete from the overseer perspective, write the overseer closeout with $STOP_MARKER.

IMPORTANT: Your checkpoint entry in $OVERSEER_LOG MUST include the exact line:
HEARTBEAT_ID: $hb_id

This is not a reminder to think about it later.
Do the Joint ACK / overseer closeout work now.
Do not just acknowledge.
End with exactly: Check-in complete and log updated."
  else
    prompt="HEARTBEAT WAKE-UP [$hb_id]: Perform one overseer poll NOW.

Current time: $(date '+%Y-%m-%d %H:%M:%S %Z')

Use the sprint-overseer skill.
Sprint file: $SPRINT_FILE
Manager session: $MANAGER_SESSION
Sprint team pattern: $TEAM_PATTERN
Overseer log: $OVERSEER_LOG
Team evidence file: $CLOSEOUT_FILE
Team done marker: $DONE_MARKER
Overseer stop file: $STOP_FILE
Overseer stop marker: $STOP_MARKER

Execute the periodic check-in process:
1. Re-read the sprint file.
2. Inspect the manager terminal.
3. Inspect worker sessions matching $TEAM_PATTERN.
4. Inspect evidence in $SPRINT_DIR/evidence/.
5. Classify on-track, off-track, or idle/stalled.
6. Append a checkpoint entry to $OVERSEER_LOG that includes this heartbeat ID: $hb_id

IMPORTANT: Your checkpoint entry in $OVERSEER_LOG MUST include the exact line:
HEARTBEAT_ID: $hb_id

OVERRIDE AUTHORITY:
If you independently judge the sprint substantively complete according to the declared
health checks, regression surfaces, and Joint Overseer ACK criteria — even if the team
has not yet written $DONE_MARKER — you are explicitly authorized to:
- Write the team's done marker yourself into $CLOSEOUT_FILE with a note:
  OVERRIDE-BY-OVERSEERS: <one-line reason>
- Immediately switch to Joint ACK + overseer closeout work

Use this authority only after you have verified the sprint is complete.
If your peer overseer is also active, coordinate first.
If you are the only active overseer, proceed only after two consecutive check-ins
with no team progress and a complete live verification.

This is not a reminder to think about polling later.
Do the poll now. Do not just acknowledge.
Nudge only for real stalls or drift.
End with exactly: Check-in complete and log updated."
  fi

  if [[ -n "$NATIVE_FILE" && "$OVERSEER_SESSION" == *claude* ]]; then
    mkdir -p "$(dirname "$NATIVE_FILE")"
    printf '%s' "$prompt" > "$NATIVE_FILE"
    log "Checkpoint $CHECKPOINT [$hb_id]: STATE WRITTEN to $NATIVE_FILE"
  elif [[ "$OVERSEER_SESSION" == *codex* ]]; then
    codex_send_clean "$OVERSEER_SESSION" "$prompt"
  else
    agent_send_long "$OVERSEER_SESSION" "$prompt"
  fi
}

log "Sprint overseer timer started"
log "  Sprint file:      $SPRINT_FILE"
log "  Manager session:  $MANAGER_SESSION"
log "  Overseer session: $OVERSEER_SESSION"
log "  Worker pattern:   $TEAM_PATTERN"
log "  Interval:         ${INTERVAL_SEC}s"
log "  Idle timeout:     ${IDLE_TIMEOUT_SEC}s"
log "  Team done marker: $DONE_MARKER"
log "  Team file:        $CLOSEOUT_FILE"
log "  Stop marker:      $STOP_MARKER"
log "  Stop file:        $STOP_FILE"
if [[ -n "$NATIVE_FILE" ]]; then
  log "  Native file:      $NATIVE_FILE"
fi
log "  Overseer log:     $OVERSEER_LOG"
log "  Timer log:        $TIMER_LOG"

# --- Launch Preflight ---
# MANDATORY: The timer MUST pass preflight before entering the main loop.
# The overseer timer is mandatory for every sprint. An agent cannot decide
# to skip it. Only Dazza (the human owner) can waive this requirement.
# WHO STARTS THE TIMER: The human operator or the overseer boot script
# starts the timer BEFORE the team boot sequence. The timer must show at
# least one "Timer alive" entry before the first team prompt is injected.
preflight_check

CHECKPOINT=0
CONSECUTIVE_NO_ACK=0
while true; do
  if overseer_done_ready; then
    log "Overseer stop file contains '$STOP_MARKER'; stopping timer"
    exit 0
  fi

  log "Timer alive — next wake-up in ${INTERVAL_SEC}s (checkpoint $((CHECKPOINT + 1)) pending)"

  if run_tmux has-session -t "$OVERSEER_SESSION" 2>/dev/null; then
    CHECKPOINT=$((CHECKPOINT + 1))
    HB_ID="$(generate_heartbeat_id)"

    if wait_for_idle "$OVERSEER_SESSION" "$IDLE_TIMEOUT_SEC"; then
      wake_overseer "$HB_ID"
      log "Checkpoint $CHECKPOINT [$HB_ID]: heartbeat prompt sent to $OVERSEER_SESSION"

      # Wait for acknowledgment in overseer log
      ACK_WAIT="$ACK_TIMEOUT_SEC"
      if check_heartbeat_ack "$HB_ID" "$ACK_WAIT"; then
        log "Checkpoint $CHECKPOINT [$HB_ID]: ACK confirmed — overseer processed heartbeat"
        CONSECUTIVE_NO_ACK=0
      else
        log "Checkpoint $CHECKPOINT [$HB_ID]: NO ACK after ${ACK_WAIT}s — retrying once"

        if wait_for_idle "$OVERSEER_SESSION" "$IDLE_TIMEOUT_SEC"; then
          wake_overseer "$HB_ID"
          log "Checkpoint $CHECKPOINT [$HB_ID]: retry heartbeat prompt sent to $OVERSEER_SESSION"
          if check_heartbeat_ack "$HB_ID" "$ACK_WAIT"; then
            log "Checkpoint $CHECKPOINT [$HB_ID]: ACK confirmed after retry"
            CONSECUTIVE_NO_ACK=0
          else
            CONSECUTIVE_NO_ACK=$((CONSECUTIVE_NO_ACK + 1))
            log "Checkpoint $CHECKPOINT [$HB_ID]: NO ACK after retry and ${ACK_WAIT}s wait (consecutive no-ack: $CONSECUTIVE_NO_ACK)"

            pane_tail="$(run_tmux capture-pane -t "$OVERSEER_SESSION" -p 2>/dev/null | tail -5 || true)"
            log "Checkpoint $CHECKPOINT [$HB_ID]: overseer pane tail: $pane_tail"

            if (( CONSECUTIVE_NO_ACK >= 3 )); then
              log "WARNING: $CONSECUTIVE_NO_ACK consecutive heartbeats with no ACK — overseer may be unresponsive. Consider escalation."
              if [[ -f "$IA_ROOT/interlateral_dna/comms.md" ]]; then
                printf '%s [TIMER WARNING] %s consecutive heartbeats with no ACK from %s. Sprint: %s\n' \
                  "$(date -u '+%Y-%m-%d %H:%M:%S UTC')" "$CONSECUTIVE_NO_ACK" "$OVERSEER_SESSION" "$SPRINT_FILE" \
                  >> "$IA_ROOT/interlateral_dna/comms.md"
              fi
            fi
          fi
        else
          CONSECUTIVE_NO_ACK=$((CONSECUTIVE_NO_ACK + 1))
          log "Checkpoint $CHECKPOINT [$HB_ID]: retry skipped because $OVERSEER_SESSION did not become idle"
        fi
      fi
    else
      log "Checkpoint $CHECKPOINT: $OVERSEER_SESSION stayed busy for ${IDLE_TIMEOUT_SEC}s; skipped this cycle to avoid corrupting input"
    fi
  else
    log "WARNING: Overseer session $OVERSEER_SESSION not found; skipping this cycle"
  fi

  sleep "$INTERVAL_SEC"
done
