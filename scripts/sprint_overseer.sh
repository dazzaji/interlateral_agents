#!/usr/bin/env bash
set -euo pipefail

# Generic mechanical wake-up loop for the sprint-overseer skill.
# The script has no judgment of its own. It only wakes an overseer agent
# on a fixed cadence and stops when the sprint closeout file contains the
# configured done marker.

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
  --done-marker TEXT    Closeout done marker (default: STATUS: WORKSHOP-READY)
  --team-pattern GLOB   Worker session glob for overseer context (default: sprint*)
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
    --done-marker)
      DONE_MARKER="$2"
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
CLOSEOUT_FILE="$SPRINT_DIR/evidence/sprint_closeout.md"
OVERSEER_LOG="$SPRINT_DIR/sprint-overseer-log.md"
TIMER_LOG="$SPRINT_DIR/sprint-overseer-timer.log"

mkdir -p "$SPRINT_DIR/evidence"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$1" | tee -a "$TIMER_LOG"
}

closeout_ready() {
  [[ -f "$CLOSEOUT_FILE" ]] && grep -q "$DONE_MARKER" "$CLOSEOUT_FILE" 2>/dev/null
}

wake_overseer() {
  local prompt
  prompt="Perform Check-In now.

Current time: $(date '+%Y-%m-%d %H:%M:%S %Z')

Use the sprint-overseer skill.
Sprint file: $SPRINT_FILE
Manager session: $MANAGER_SESSION
Sprint team pattern: $TEAM_PATTERN
Overseer log: $OVERSEER_LOG
Done marker: $DONE_MARKER

Execute the periodic check-in process:
1. Re-read the sprint file.
2. Inspect the manager terminal.
3. Inspect worker sessions matching $TEAM_PATTERN.
4. Inspect evidence in $SPRINT_DIR/evidence/.
5. Classify on-track, off-track, or idle/stalled.
6. Append a checkpoint entry to $OVERSEER_LOG.

Nudge only for real stalls or drift. End with: Check-in complete and log updated."

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
log "  Done marker:      $DONE_MARKER"
log "  Closeout file:    $CLOSEOUT_FILE"
log "  Overseer log:     $OVERSEER_LOG"
log "  Timer log:        $TIMER_LOG"

CHECKPOINT=0
while true; do
  if closeout_ready; then
    log "Closeout file contains '$DONE_MARKER'; stopping timer"
    exit 0
  fi

  if run_tmux has-session -t "$OVERSEER_SESSION" 2>/dev/null; then
    CHECKPOINT=$((CHECKPOINT + 1))
    wake_overseer
    log "Checkpoint $CHECKPOINT: wake prompt sent to $OVERSEER_SESSION"
  else
    log "WARNING: Overseer session $OVERSEER_SESSION not found; skipping this cycle"
  fi

  sleep "$INTERVAL_SEC"
done
