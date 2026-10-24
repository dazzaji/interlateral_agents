#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DNA_DIR="$REPO_ROOT/interlateral_dna"
DEFAULT_PROMPT="Read CLAUDE.md first, then wait for instructions."
DEFAULT_CLAUDE_MODEL="claude-opus-5-5"
DEFAULT_CLAUDE_EFFORT="high"
VALID_EFFORT_LIST=(low medium high xhigh max)
VALID_EFFORTS="${VALID_EFFORT_LIST[*]}"

usage() {
    cat <<'USAGE'
Usage:
  scripts/launch-cc-peer.sh [--effort LEVEL] [--dry-run] [SESSION_NAME] [STARTUP PROMPT...]

Options (must come before SESSION_NAME):
  --effort LEVEL   Claude Code effort level: low, medium, high, xhigh, max (default: high)
  --dry-run        Print the resolved model, effort and launch command, then exit
                   without creating a tmux session or starting Claude
  -h, --help       Show this help

Environment overrides:
  CLAUDE_MODEL     Default: claude-opus-5-5 (any claude-opus-4-7 variant is refused)
  CLAUDE_EFFORT    Default: high (the --effort flag wins over this)
  LAUNCH_DRY_RUN   Set to 1 for the same behavior as --dry-run
USAGE
}

EFFORT_FLAG=""
DRY_RUN="${LAUNCH_DRY_RUN:-0}"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --effort)
            [[ $# -ge 2 ]] || { echo "Error: --effort requires a value ($VALID_EFFORTS)" >&2; exit 2; }
            EFFORT_FLAG="$2"
            shift 2
            ;;
        --effort=*)
            EFFORT_FLAG="${1#--effort=}"
            shift
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "Error: unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
        *)
            break
            ;;
    esac
done

CLAUDE_MODEL="${CLAUDE_MODEL:-$DEFAULT_CLAUDE_MODEL}"
CLAUDE_EFFORT="${EFFORT_FLAG:-${CLAUDE_EFFORT:-$DEFAULT_CLAUDE_EFFORT}}"

# House rule: Claude Opus 4.7 must not be used. Refuse any spelling of it.
MODEL_LC="$(printf '%s' "$CLAUDE_MODEL" | tr '[:upper:]' '[:lower:]')"
if [[ "$MODEL_LC" =~ opus[-_.]?4[-_.]7 ]]; then
    echo "Error: refusing to launch with model '$CLAUDE_MODEL': Claude Opus 4.7 is not permitted." >&2
    echo "Unset CLAUDE_MODEL to use the default ($DEFAULT_CLAUDE_MODEL), or choose another model." >&2
    exit 1
fi

# Exact, quoted equality against each allowed value: no pattern or substring match.
EFFORT_OK=0
for allowed in "${VALID_EFFORT_LIST[@]}"; do
    if [[ "$CLAUDE_EFFORT" == "$allowed" ]]; then
        EFFORT_OK=1
        break
    fi
done
if [[ "$EFFORT_OK" != "1" ]]; then
    echo "Error: invalid effort '$CLAUDE_EFFORT' (expected one of: $VALID_EFFORTS)" >&2
    exit 2
fi

source "$SCRIPT_DIR/tmux-config.sh"
unset TMUX

SESSION_NAME="${1:-}"
SESSION_NOTE=""
if [[ -n "$SESSION_NAME" ]]; then
    shift
elif [[ "$DRY_RUN" == "1" ]]; then
    # Dry run must not touch tmux, so do not list sessions to pick the next name.
    SESSION_NAME="ia-claude-peer-NN"
    SESSION_NOTE=" (placeholder: the next free ia-claude-peer-NN is chosen at launch)"
else
    SESSION_NAME="$(next_peer_session_name "ia-claude-peer")"
fi
if [[ "$SESSION_NAME" =~ [/\.\.]|^\.\. ]]; then
    echo "Error: session name must not contain '/' or '..': $SESSION_NAME" >&2
    exit 1
fi
STARTUP_PROMPT="${*:-$DEFAULT_PROMPT}"
LOG_FILE="$DNA_DIR/${SESSION_NAME}.log"
TEAM_ID="${INTERLATERAL_TEAM_ID:-agents}"
SESSION_ID="${INTERLATERAL_SESSION_ID:-peer_$(date +%s)}"
SENDER="${INTERLATERAL_SENDER:-claude-peer}"
AGENT_TYPE="${INTERLATERAL_AGENT_TYPE:-claude}"

# Claude Code exposes effort as a CLI flag (--effort low|medium|high|xhigh|max).
# If the installed CLI lacks it, launch without the flag and warn: effort must
# then be requested in the session's first message.
EFFORT_ARG=" --effort '$CLAUDE_EFFORT'"
if [[ "$DRY_RUN" != "1" ]]; then
    for cmd in tmux claude; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            echo "Missing required command: $cmd" >&2
            exit 1
        fi
    done
    # Read the whole help text before matching. Piping into grep -q under
    # pipefail can SIGPIPE claude and report a false "flag missing".
    CLAUDE_HELP="$(claude --help 2>&1 || true)"
    if [[ "$CLAUDE_HELP" != *"--effort"* ]]; then
        echo "Warning: this claude CLI has no --effort flag; launching without it." >&2
        echo "Warning: ask for effort '$CLAUDE_EFFORT' in the session's first message instead." >&2
        EFFORT_ARG=""
    fi
fi

LAUNCH_CMD="cd '$REPO_ROOT' && export TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TMUX_SOCKET='$TMUX_SOCKET' INTERLATERAL_TEAM_ID='$TEAM_ID' INTERLATERAL_SENDER='$SENDER' INTERLATERAL_AGENT_TYPE='$AGENT_TYPE' INTERLATERAL_SESSION_ID='${SESSION_ID}_${SESSION_NAME}' CC_TMUX_SESSION='$SESSION_NAME' CODEX_TMUX_SESSION='$CODEX_SESSION' GEMINI_TMUX_SESSION='$GEMINI_SESSION' && claude --dangerously-skip-permissions --model '$CLAUDE_MODEL'${EFFORT_ARG}"

if [[ "$DRY_RUN" == "1" ]]; then
    echo "Dry run: no tmux session created, Claude not started"
    echo "Socket: $TMUX_SOCKET"
    echo "Session: $SESSION_NAME$SESSION_NOTE"
    echo "Model: $CLAUDE_MODEL"
    echo "Effort: $CLAUDE_EFFORT"
    echo "Command: $LAUNCH_CMD"
    echo "Startup prompt: $STARTUP_PROMPT"
    exit 0
fi

if run_tmux has-session -t "=$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists on $TMUX_SOCKET" >&2
    exit 1
fi

run_tmux new-session -d -s "$SESSION_NAME" -c "$REPO_ROOT"
: > "$LOG_FILE"
run_tmux pipe-pane -o -t "$SESSION_NAME" "cat >> '$LOG_FILE'"

run_tmux send-keys -t "$SESSION_NAME" "$LAUNCH_CMD" Enter

if prepare_claude_for_boot "$SESSION_NAME" 30; then
    echo "Claude peer prompt detected, injecting startup prompt..."
else
    echo "Warning: Claude peer prompt not detected; injecting startup prompt anyway" >&2
fi
claude_send_long "$SESSION_NAME" "$STARTUP_PROMPT" "claude_peer_${SESSION_NAME}_$$"

echo "Launched Claude peer"
echo "Socket: $TMUX_SOCKET"
echo "Session: $SESSION_NAME"
echo "Model: $CLAUDE_MODEL"
if [[ -n "$EFFORT_ARG" ]]; then
    echo "Effort: $CLAUDE_EFFORT"
else
    echo "Effort: $CLAUDE_EFFORT (not passed: CLI lacks --effort; set it in the first message)"
fi
echo "Log: $LOG_FILE"
