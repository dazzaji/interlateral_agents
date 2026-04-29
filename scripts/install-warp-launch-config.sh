#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$REPO_ROOT/templates/warp/interlateral-warp-mesh.yaml"
TARGET_DIR="${WARP_LAUNCH_CONFIG_DIR:-$HOME/.warp/launch_configurations}"
TARGET="$TARGET_DIR/interlateral-warp-mesh.yaml"
FORCE=0

usage() {
    cat <<'EOF'
Usage:
  scripts/install-warp-launch-config.sh [--force]

Installs the Interlateral Warp Mesh launch configuration to:
  ~/.warp/launch_configurations/interlateral-warp-mesh.yaml
EOF
}

if [[ "${1:-}" == "--force" ]]; then
    FORCE=1
    shift
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

if [[ "${1:-}" != "" ]]; then
    usage >&2
    exit 2
fi

if [[ ! -f "$TEMPLATE" ]]; then
    echo "Error: missing template: $TEMPLATE" >&2
    exit 1
fi

mkdir -p "$TARGET_DIR"
tmp="$(mktemp "${TMPDIR:-/tmp}/interlateral-warp.XXXXXX")"
trap 'rm -f "$tmp"' EXIT

awk -v repo="$REPO_ROOT" '{ gsub(/__INTERLATERAL_AGENTS_REPO__/, repo); print }' "$TEMPLATE" > "$tmp"

if [[ -f "$TARGET" ]]; then
    if cmp -s "$tmp" "$TARGET"; then
        echo "Warp launch config already up to date: $TARGET"
    elif (( FORCE )); then
        cp "$tmp" "$TARGET"
        echo "Updated Warp launch config: $TARGET"
    else
        echo "Error: $TARGET already exists and differs. Re-run with --force to overwrite." >&2
        exit 1
    fi
else
    cp "$tmp" "$TARGET"
    echo "Installed Warp launch config: $TARGET"
fi

echo 'Open it with:'
echo '  open "warp://launch/interlateral-warp-mesh"'
