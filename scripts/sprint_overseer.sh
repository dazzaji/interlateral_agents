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

wake_overseer() {
  local prompt
  if team_done_ready; then
    prompt="HEARTBEAT WAKE-UP: TEAM COMPLETED — Perform Joint ACK now.

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
5. Append a checkpoint entry to $OVERSEER_LOG.
6. If the sprint is truly complete from the overseer perspective, write the overseer closeout with $STOP_MARKER.

This is not a reminder to think about it later.
Do the Joint ACK / overseer closeout work now.
Do not just acknowledge.
End with exactly: Check-in complete and log updated."
  else
    prompt="HEARTBEAT WAKE-UP: Perform one overseer poll NOW.

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
6. Append a checkpoint entry to $OVERSEER_LOG.

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

  if [[ "$OVERSEER_SESSION" == *codex* ]]; then
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
log "  Overseer log:     $OVERSEER_LOG"
log "  Timer log:        $TIMER_LOG"

CHECKPOINT=0
while true; do
  if overseer_done_ready; then
    log "Overseer stop file contains '$STOP_MARKER'; stopping timer"
    exit 0
  fi

  if run_tmux has-session -t "$OVERSEER_SESSION" 2>/dev/null; then
    CHECKPOINT=$((CHECKPOINT + 1))
    if wait_for_idle "$OVERSEER_SESSION" "$IDLE_TIMEOUT_SEC"; then
      wake_overseer
      log "Checkpoint $CHECKPOINT: heartbeat prompt sent to $OVERSEER_SESSION"
    else
      log "Checkpoint $CHECKPOINT: $OVERSEER_SESSION stayed busy for ${IDLE_TIMEOUT_SEC}s; skipped this cycle to avoid corrupting input"
    fi
  else
    log "WARNING: Overseer session $OVERSEER_SESSION not found; skipping this cycle"
  fi

  sleep "$INTERVAL_SEC"
done
