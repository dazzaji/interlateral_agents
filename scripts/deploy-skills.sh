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

for target in "${TARGET_DIRS[@]}"; do
    mkdir -p "$target"
    find "$target" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    while IFS= read -r skill_dir; do
        cp -R "$skill_dir" "$target/"
    done < <(find "$CANONICAL_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
    find "$target" -name '.DS_Store' -delete
    echo "Deployed skills to $target"
done
