#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CANONICAL_DIR="$REPO_ROOT/.agent/skills"
TARGET_DIRS=("$REPO_ROOT/.claude/skills" "$REPO_ROOT/.codex/skills")

if [[ ! -d "$CANONICAL_DIR" ]]; then
    echo "Canonical skills directory not found: $CANONICAL_DIR" >&2
    exit 1
fi

status=0
for target in "${TARGET_DIRS[@]}"; do
    if [[ ! -d "$target" ]]; then
        echo "Missing deployed skills directory: $target" >&2
        status=1
        continue
    fi
    if ! diff -qr -x '.DS_Store' "$CANONICAL_DIR" "$target"; then
        echo "Skill deployment mismatch: $target does not match $CANONICAL_DIR" >&2
        status=1
    fi
done

exit "$status"
