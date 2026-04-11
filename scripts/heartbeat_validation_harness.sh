#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$IA_ROOT/scripts/tmux-config.sh"

usage() {
  cat <<'EOF'
Usage:
  scripts/heartbeat_validation_harness.sh [OPTIONS]

Options:
  --workdir PATH       Directory to create the disposable validation packet in
  --overseer SESSION   Overseer session to validate (default: ia-claude)
  --manager SESSION    Manager session for timer preflight (default: the other primary CLI)
  --interval SEC       Heartbeat interval for validation run (default: 30)
  --idle-timeout SEC   Idle timeout for validation run (default: 15)
  --ack-timeout SEC    Ack timeout for validation run (default: 45)
  --run                Run sprint_overseer.sh immediately in validation mode
  -h, --help           Show this help

This harness creates a disposable sprint file plus evidence/closeout paths
for heartbeat transport validation. It is meant for Tests 0-2:
launch, visible injection, and acknowledged log write.
EOF
}

WORKDIR=""
OVERSEER_SESSION="${CC_SESSION:-ia-claude}"
MANAGER_SESSION=""
INTERVAL_SEC=30
IDLE_TIMEOUT_SEC=15
ACK_TIMEOUT_SEC=45
RUN_TIMER=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workdir)
      WORKDIR="$2"
      shift 2
      ;;
    --overseer)
      OVERSEER_SESSION="$2"
      shift 2
      ;;
    --manager)
      MANAGER_SESSION="$2"
      shift 2
      ;;
    --interval)
      INTERVAL_SEC="$2"
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
    --run)
      RUN_TIMER=1
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

if [[ -z "$MANAGER_SESSION" ]]; then
  if [[ "$OVERSEER_SESSION" == "${CC_SESSION:-ia-claude}" ]]; then
    MANAGER_SESSION="${CODEX_SESSION:-ia-codex}"
  else
    MANAGER_SESSION="${CC_SESSION:-ia-claude}"
  fi
fi

if [[ -z "$WORKDIR" ]]; then
  WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/interlateral-heartbeat-validation.XXXXXX")"
else
  mkdir -p "$WORKDIR"
fi

SPRINT_FILE="$WORKDIR/heartbeat_validation_sprint.md"
EVIDENCE_DIR="$WORKDIR/evidence"
EVIDENCE_FILE="$EVIDENCE_DIR/heartbeat_validation_proof.md"
STOP_FILE="$EVIDENCE_DIR/heartbeat_validation_overseer_closeout.md"

mkdir -p "$EVIDENCE_DIR"

cat > "$SPRINT_FILE" <<EOF
# Heartbeat Validation Sprint

Purpose: validate timer transport, fresh-turn wake-up, and HEARTBEAT_ID acknowledgment.

Mode: validation only
Manager session: $MANAGER_SESSION
Overseer session: $OVERSEER_SESSION
Evidence file: $EVIDENCE_FILE
Overseer closeout file: $STOP_FILE

Done marker: STATUS: DONE
Overseer stop marker: STATUS: OVERSEER-DONE

Acceptance criteria:
1. Timer launch preflight passes.
2. Timer log records heartbeat dispatch on cadence.
3. Overseer log contains HEARTBEAT_ID acknowledgments for validation cycles.

This packet is disposable. Do not use it for real sprint execution.
EOF

cat > "$EVIDENCE_FILE" <<'EOF'
# Heartbeat Validation Evidence

STATUS: IN-PROGRESS
EOF

cat <<EOF
Heartbeat validation packet created.

Workdir:
  $WORKDIR

Sprint file:
  $SPRINT_FILE

Evidence file:
  $EVIDENCE_FILE

Overseer closeout file:
  $STOP_FILE

Suggested watch commands:
  source "$IA_ROOT/scripts/tmux-config.sh"
  tmux -S "$TMUX_SOCKET" capture-pane -t "$OVERSEER_SESSION" -p | tail -40
  tail -f "$WORKDIR/sprint-overseer-timer.log"
  tail -f "$WORKDIR/sprint-overseer-log.md"

Validation timer command:
  "$IA_ROOT/scripts/sprint_overseer.sh" "$SPRINT_FILE" \\
    --manager "$MANAGER_SESSION" \\
    --overseer "$OVERSEER_SESSION" \\
    --closeout-file "$EVIDENCE_FILE" \\
    --done-marker "STATUS: DONE" \\
    --stop-file "$STOP_FILE" \\
    --stop-marker "STATUS: OVERSEER-DONE" \\
    --interval "$INTERVAL_SEC" \\
    --idle-timeout "$IDLE_TIMEOUT_SEC" \\
    --ack-timeout "$ACK_TIMEOUT_SEC" \\
    --validation-mode
EOF

if (( RUN_TIMER == 1 )); then
  exec "$IA_ROOT/scripts/sprint_overseer.sh" "$SPRINT_FILE" \
    --manager "$MANAGER_SESSION" \
    --overseer "$OVERSEER_SESSION" \
    --closeout-file "$EVIDENCE_FILE" \
    --done-marker "STATUS: DONE" \
    --stop-file "$STOP_FILE" \
    --stop-marker "STATUS: OVERSEER-DONE" \
    --interval "$INTERVAL_SEC" \
    --idle-timeout "$IDLE_TIMEOUT_SEC" \
    --ack-timeout "$ACK_TIMEOUT_SEC" \
    --validation-mode
fi
