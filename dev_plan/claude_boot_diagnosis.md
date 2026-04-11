# Claude Boot ACK False-Positive Diagnosis

SKILL: peer-collaboration
STATUS: DONE
PARTICIPANTS: Codex (PEER_A), Claude Code (PEER_B)

## Summary

Claude did not fail because of a Claude-side ACK bug. The launcher sequence let Codex false-positive on the literal string `ACK from Claude. Can you hear me?` inside Claude's injected boot prompt before Claude actually executed the send command. Codex ACKed early, which interrupted Claude's first response. Claude then recovered and printed `Ready to Rock!`, which made the fault look like a Claude boot hiccup instead of a handshake verification bug.

## Evidence

1. Claude's pane rendered the full injected boot prompt, including the literal watch phrase, before Claude acted on it.
2. `interlateral_dna/comms.md` recorded Codex-to-Claude ACK traffic, but there was no original Claude-to-Codex ACK entry for the handshake.
3. Claude telemetry showed Codex's ACK arriving during Claude's initial processing, followed by `Interrupted · What should Claude do instead?`.

## Root Cause

The watch surface was wrong. `me.sh` told Codex to watch Claude's terminal for the ACK phrase. Because Claude uses split boot (`claude` launch first, prompt injection second), the prompt text itself becomes visible in the pane before Claude executes it. Codex's pane-capture logic cannot distinguish:

- prompt text that contains the ACK phrase
- a real ACK sent by Claude

That prompt leakage produced the false-positive.

## Fix Recommendation

Primary fix:

- Change Codex's boot instructions to verify Claude's ACK via the stamped `interlateral_dna/comms.md` ledger entry from `sender=claude`, instead of scanning Claude's pane text.

Patch scope applied:

- `me.sh`: update `CODEX_PROMPT` to wait for a Claude-stamped ledger entry
- `AGENTS.md`: align the documented wake-up protocol with the launcher behavior

Optional hardening later:

- use a nonce/challenge so the watch token differs from the prompt text
- move handshake verification into the launcher itself for stricter determinism
