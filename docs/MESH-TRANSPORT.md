# Verified JS Mesh Transport

cc.js, codex.js, gemini.js, and agy.js use mesh-transport.js. Their environment target
(CC_TMUX_SESSION, CODEX_TMUX_SESSION, GEMINI_TMUX_SESSION, AGY_TMUX_SESSION) must name
an exact session, or session:window.pane if it has multiple panes. Prefix matches fail.
Set INTERLATERAL_REQUEST_NONCE to the stable request nonce for retries.

The helper resolves an exact pane, discovers its current PTY, and frames the complete
message with a new attempt UUID, pane ID, and SHA-256. It refuses shells, unknown
processes (including generic node wrappers), invalid PTYs and terminal control bytes.
Messages are limited to 16,384 UTF-8 bytes, including the identity stamp. Longer work
should use a file path and hash. CLI names recognized are claude, codex, gemini, agy;
recognition is a routing guard, not cryptographic authentication or proof of idleness.
Check the intended CLI is idle before sending. No terminal transport eliminates every
process-exit race; do not use it as an authorization/security boundary.

JSON receipt lines in comms.md record sender, requested and resolved target, pane ID,
request nonce, attempt ID, payload hash, and state:
- REFUSED: no message write attempted.
- DELIVERY_UNCERTAIN: a write may have happened, but complete fresh rendering is unproven.
  Inspect the receiver before retrying; never blindly resend.
- DELIVERED_RENDERED: the complete fresh frame appeared. This corresponds to the
  desktop workflow's QUEUED_RENDERED, not DELIVERED_ACKED.

cat inboxes receive a direct runtime-PTY write. TUI delivery uses bracketed paste and
provider-specific submit keys with process rechecks. agy retains its foreground and
screen-readiness checks; --force cannot bypass the shared shell/unknown guard.

These changes do NOT upgrade scripts/tmux-config.sh or agent_send_logged. Those older
paths still require independent exact-recipient and render checks. Do not double-send
just to obtain a ledger entry: the JS helpers already append one.

A desktop inbox is passive. Use the host's supported native task messaging when the
model must wake, and require a receiver-originated nonce ACK. A local process being
alive does not prove its credentials or model are usable.

## Verification Boundary

The scratch regression suite exercises real cat inboxes, shell refusal, exact/ambiguous
targets, distinct resend attempts, structured receipts, stale capture, invalid PTY,
truncation, and terminal-control rejection. A shell is NEVER a stand-in proving CLI
operation. The current CLI/provider matrix remains unverified after this patch until
an authorized actual CLI completes a fresh nonce round trip. Do not launch new agents
just to make that claim. Native task wake and ACK require separate live evidence.

Run: node --test interlateral_dna/tests/mesh/mesh-transport.test.js
