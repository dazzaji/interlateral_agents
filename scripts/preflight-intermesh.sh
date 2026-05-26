#!/bin/bash
# preflight-intermesh.sh — Pre-flight checks for the intermesh-v1 cross-machine sprint.
#
# READ-ONLY. Does not mutate anything. Reports PASS / FAIL / SKIP per check.
# Run on every participating machine BEFORE Phase 0 G-CRED.
#
# Usage:
#   ./scripts/preflight-intermesh.sh                # run all checks
#   ./scripts/preflight-intermesh.sh --json         # machine-readable output
#   ./scripts/preflight-intermesh.sh --verbose      # print remediation hints
#
# Exit codes:
#   0 — all required checks passed
#   1 — at least one required check failed
#   2 — invocation error

set -u

JSON=0
VERBOSE=0
for arg in "$@"; do
    case "$arg" in
        --json) JSON=1 ;;
        --verbose|-v) VERBOSE=1 ;;
        --help|-h)
            sed -n '2,16p' "$0"
            exit 0
            ;;
        *)
            echo "Unknown flag: $arg" >&2
            exit 2
            ;;
    esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL_COUNT=0
PASS_COUNT=0
SKIP_COUNT=0
RESULTS=()

# --- helpers ----------------------------------------------------------------

record() {
    local id="$1" status="$2" detail="$3" hint="${4:-}"
    RESULTS+=("$id|$status|$detail|$hint")
    case "$status" in
        PASS) ((PASS_COUNT++)) ;;
        FAIL) ((FAIL_COUNT++)) ;;
        SKIP) ((SKIP_COUNT++)) ;;
    esac
}

have() { command -v "$1" >/dev/null 2>&1; }

version_at_least() {
    # version_at_least <got> <want>  → 0 if got >= want
    local got="$1" want="$2"
    [[ "$(printf '%s\n%s\n' "$want" "$got" | sort -V | head -n1)" == "$want" ]]
}

# --- checks -----------------------------------------------------------------

check_repo_root() {
    if [[ -d "$REPO_ROOT/interlateral_dna" && -f "$REPO_ROOT/me.sh" ]]; then
        record repo PASS "$REPO_ROOT"
    else
        record repo FAIL "not in interlateral_agents repo" "cd into the repo and re-run"
    fi
}

check_node() {
    if ! have node; then
        record node FAIL "node not installed" "Install Node.js 20+ from nodejs.org or brew install node"
        return
    fi
    local v
    v="$(node --version 2>/dev/null | sed 's/^v//')"
    if version_at_least "$v" "20.0.0"; then
        record node PASS "v$v"
    else
        record node FAIL "v$v (need >= 20.0.0)" "Upgrade Node: brew upgrade node or use nvm"
    fi
}

check_tmux() {
    if ! have tmux; then
        record tmux FAIL "tmux not installed" "brew install tmux"
        return
    fi
    local v
    v="$(tmux -V 2>/dev/null | awk '{print $2}')"
    record tmux PASS "$v"
}

check_claude_cli() {
    if ! have claude; then
        record claude_cli FAIL "claude CLI not installed" "Install Claude Code from claude.com/code"
        return
    fi
    record claude_cli PASS "$(claude --version 2>&1 | head -n1)"
}

check_codex_cli() {
    if ! have codex; then
        record codex_cli FAIL "codex CLI not installed" "Install Codex CLI per Codex docs"
        return
    fi
    record codex_cli PASS "$(codex --version 2>&1 | head -n1)"
}

check_cloudflared() {
    if ! have cloudflared; then
        record cloudflared FAIL "cloudflared not installed" "brew install cloudflare/cloudflare/cloudflared"
        return
    fi
    record cloudflared PASS "$(cloudflared --version 2>&1 | head -n1)"
}

check_op_cli() {
    if ! have op; then
        record op_cli FAIL "1Password CLI (op) not installed" "brew install --cask 1password-cli"
        return
    fi
    local v
    v="$(op --version 2>/dev/null)"
    if op account list >/dev/null 2>&1; then
        record op_cli PASS "v$v, signed in"
    else
        record op_cli FAIL "v$v, NOT signed in" "Run: eval \$(op signin)"
    fi
}

check_jq() {
    if have jq; then
        record jq PASS "$(jq --version)"
    else
        record jq FAIL "jq not installed" "brew install jq"
    fi
}

check_curl() {
    if have curl; then
        record curl PASS "$(curl --version | head -n1 | awk '{print $1, $2}')"
    else
        record curl FAIL "curl not installed" "macOS ships curl; check PATH"
    fi
}

check_openssl_entropy() {
    if ! have openssl; then
        record openssl FAIL "openssl not installed" "brew install openssl"
        return
    fi
    local bytes
    bytes="$(openssl rand -hex 32 2>/dev/null | wc -c | tr -d ' ')"
    if [[ "$bytes" == "65" ]]; then  # 64 hex chars + newline
        record openssl PASS "rand 32 bytes OK"
    else
        record openssl FAIL "rand returned $bytes chars (expected 65)" "Reinstall openssl"
    fi
}

check_interlateral_dir() {
    if [[ -d "$HOME/.interlateral" ]]; then
        local mode
        mode="$(stat -f '%Lp' "$HOME/.interlateral" 2>/dev/null || stat -c '%a' "$HOME/.interlateral" 2>/dev/null)"
        if [[ "$mode" == "700" ]]; then
            record interlateral_dir PASS "~/.interlateral exists, chmod 700"
        else
            record interlateral_dir FAIL "~/.interlateral mode is $mode, want 700" "chmod 700 ~/.interlateral"
        fi
    else
        record interlateral_dir SKIP "~/.interlateral does not exist yet" "Will be created by setup: mkdir -p ~/.interlateral && chmod 700 ~/.interlateral"
    fi
}

check_existing_helpers() {
    local missing=()
    for f in interlateral_dna/cc.js interlateral_dna/codex.js interlateral_dna/identity.js me.sh; do
        [[ -f "$REPO_ROOT/$f" ]] || missing+=("$f")
    done
    if [[ ${#missing[@]} -eq 0 ]]; then
        record existing_helpers PASS "cc.js, codex.js, identity.js, me.sh all present"
    else
        record existing_helpers FAIL "missing: ${missing[*]}" "git pull and re-check"
    fi
}

check_git_clean() {
    if ! have git; then
        record git_clean SKIP "git not installed"
        return
    fi
    if (cd "$REPO_ROOT" && git status >/dev/null 2>&1); then
        local dirty
        dirty="$(cd "$REPO_ROOT" && git status --porcelain 2>/dev/null | head -n5)"
        if [[ -z "$dirty" ]]; then
            local branch
            branch="$(cd "$REPO_ROOT" && git rev-parse --abbrev-ref HEAD 2>/dev/null)"
            record git_clean PASS "clean, on branch '$branch'"
        else
            record git_clean SKIP "working tree has uncommitted changes (informational only)"
        fi
    else
        record git_clean FAIL "not a git repo" "cd into the repo and re-run"
    fi
}

check_dns_zone() {
    if ! have dig; then
        record dns_zone SKIP "dig not installed; skipping DNS check"
        return
    fi
    local ns
    ns="$(dig +short NS interlateral.com 2>/dev/null | head -n2 | tr '\n' ',' | sed 's/,$//')"
    if [[ -z "$ns" ]]; then
        record dns_zone FAIL "no NS records for interlateral.com" "Verify domain delegation"
        return
    fi
    if echo "$ns" | grep -qi cloudflare; then
        record dns_zone PASS "NS: $ns (Cloudflare confirmed)"
    else
        record dns_zone FAIL "NS: $ns (does NOT look like Cloudflare)" "Verify delegation in Cloudflare dashboard"
    fi
}

check_cloudflared_auth() {
    if ! have cloudflared; then
        record cloudflared_auth SKIP "cloudflared not installed"
        return
    fi
    # cloudflared stores its cert at ~/.cloudflared/cert.pem after `cloudflared login`
    if [[ -f "$HOME/.cloudflared/cert.pem" ]]; then
        record cloudflared_auth PASS "~/.cloudflared/cert.pem present"
    else
        record cloudflared_auth SKIP "no cert.pem; will be created by 'cloudflared login' in G-CRED"
    fi
}

check_tunnel_list() {
    if ! have cloudflared || [[ ! -f "$HOME/.cloudflared/cert.pem" ]]; then
        record tunnel_list SKIP "cloudflared not authed yet"
        return
    fi
    local out
    out="$(cloudflared tunnel list 2>&1)"
    if echo "$out" | grep -qi "no tunnels"; then
        record tunnel_list PASS "auth works, no tunnels yet"
    elif echo "$out" | grep -qiE "^id|name|created"; then
        local count
        count="$(echo "$out" | tail -n +2 | grep -cE '^[0-9a-f-]{36}' || true)"
        record tunnel_list PASS "$count existing tunnel(s) (informational)"
    else
        record tunnel_list FAIL "unexpected output" "Run 'cloudflared tunnel list' manually and inspect"
    fi
}

check_mesh_secret() {
    if [[ -f "$HOME/.interlateral/mesh.secret" ]]; then
        local mode size
        mode="$(stat -f '%Lp' "$HOME/.interlateral/mesh.secret" 2>/dev/null || stat -c '%a' "$HOME/.interlateral/mesh.secret" 2>/dev/null)"
        size="$(wc -c < "$HOME/.interlateral/mesh.secret" | tr -d ' ')"
        if [[ "$mode" == "600" && "$size" -ge 60 ]]; then
            record mesh_secret PASS "~/.interlateral/mesh.secret present (mode 600, $size bytes)"
        else
            record mesh_secret FAIL "mode=$mode size=$size (want mode 600, size >= 60)" "Regenerate per G-CRED procedure"
        fi
    else
        record mesh_secret SKIP "~/.interlateral/mesh.secret not generated yet (G-CRED will do this)"
    fi
}

check_hostname() {
    record hostname PASS "$(hostname -s)"
}

check_disk_space() {
    local avail
    avail="$(df -h "$HOME" | tail -n1 | awk '{print $4}')"
    record disk_space PASS "$avail free in HOME"
}

# --- run --------------------------------------------------------------------

check_repo_root
check_hostname
check_node
check_tmux
check_claude_cli
check_codex_cli
check_cloudflared
check_op_cli
check_jq
check_curl
check_openssl_entropy
check_interlateral_dir
check_existing_helpers
check_git_clean
check_dns_zone
check_cloudflared_auth
check_tunnel_list
check_mesh_secret
check_disk_space

# --- output -----------------------------------------------------------------

if [[ $JSON -eq 1 ]]; then
    printf '{\n  "hostname": %q,\n  "pass": %d,\n  "fail": %d,\n  "skip": %d,\n  "results": [\n' \
        "$(hostname -s)" "$PASS_COUNT" "$FAIL_COUNT" "$SKIP_COUNT"
    first=1
    for row in "${RESULTS[@]}"; do
        IFS='|' read -r id status detail hint <<<"$row"
        [[ $first -eq 0 ]] && printf ',\n'
        first=0
        printf '    { "id": %q, "status": %q, "detail": %q, "hint": %q }' \
            "$id" "$status" "$detail" "$hint"
    done
    printf '\n  ]\n}\n'
else
    printf '\n=== InterMesh Preflight on %s ===\n\n' "$(hostname -s)"
    for row in "${RESULTS[@]}"; do
        IFS='|' read -r id status detail hint <<<"$row"
        case "$status" in
            PASS) printf '  [\033[32m PASS \033[0m] %-22s  %s\n' "$id" "$detail" ;;
            FAIL) printf '  [\033[31m FAIL \033[0m] %-22s  %s\n' "$id" "$detail"
                  [[ $VERBOSE -eq 1 && -n "$hint" ]] && printf '         hint: %s\n' "$hint" ;;
            SKIP) printf '  [\033[33m SKIP \033[0m] %-22s  %s\n' "$id" "$detail"
                  [[ $VERBOSE -eq 1 && -n "$hint" ]] && printf '         note: %s\n' "$hint" ;;
        esac
    done
    printf '\nSummary: %d PASS, %d FAIL, %d SKIP\n' "$PASS_COUNT" "$FAIL_COUNT" "$SKIP_COUNT"
    if [[ $FAIL_COUNT -gt 0 ]]; then
        printf 'Re-run with --verbose to see remediation hints.\n'
    fi
fi

[[ $FAIL_COUNT -eq 0 ]] && exit 0 || exit 1
