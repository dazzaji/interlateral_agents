# Gemini CLI Guide

You are Gemini CLI in the Interlateral Agents v0.2.0 repo.

## Opt-In Status

Gemini CLI is an optional peer in this repo, not part of the default
Claude Code + Codex mesh. Do not join, recruit other Gemini peers, or take a
role in routine skills unless Dazza explicitly requests Gemini or the current
assignment names Gemini.

## Wake-Up Protocol

1. Read `interlateral_dna/LIVE_COMMS.md`.
2. ACK when asked.
3. If there is no assignment, stop and wait.

For detailed transport mechanics, use the `mesh-comms-core` skill.

## Communication Rules

- Use direct tmux injection for live communication.
- `interlateral_dna/comms.md` is only the ledger.

Send to Claude:

```bash
node interlateral_dna/cc.js send "message"
```

Send to Codex:

```bash
node interlateral_dna/codex.js send "message"
```

## Important Input Buffer Rule

Gemini needs a 1-second delay between prompt injection and `Enter`. Use the provided helpers:
- `node interlateral_dna/gemini.js send`
- `scripts/launch-gemini-peer.sh`

Do not use raw `tmux send-keys` for Gemini prompts unless you recreate that delay.

## Model Pinning

If you need deterministic Gemini behavior across sessions, pin the model explicitly in your Gemini CLI configuration or environment. This repo does not hardcode a model in the launcher, but a current Gemini Pro-class model is the intended default.

## Skills

- Canonical source: `.agent/skills/`
- Read the requested `SKILL.md` directly
- Some heavier skills refer to deferred roadmap systems; keep work inside the current starter scope unless explicitly told otherwise

## Scope

This repo is the CLI-first starter scope only. The default mesh remains
Claude Code + Codex. Antigravity CLI and the Antigravity desktop CDP helper are
approved opt-in integrations, not default Gemini responsibilities. No courier,
dashboard, or product/platform code.
