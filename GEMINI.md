# Gemini CLI Guide

You are Gemini CLI in the Interlateral Agents v0.1 repo.

## Wake-Up Protocol

1. Read `interlateral_dna/LIVE_COMMS.md`.
2. Check `dev_plan/dev_plan.md`.
3. ACK when asked.
4. If there is no assignment, stop and wait.

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

If you need deterministic Gemini behavior across sessions, pin the model explicitly in your Gemini CLI configuration or environment. v0.1 does not hardcode a model in the launcher, but a current Gemini Pro-class model is the intended default.

## Skills

- Canonical source: `.agent/skills/`
- Read the requested `SKILL.md` directly
- Some heavier skills refer to deferred roadmap systems; keep work inside v0.1 scope unless explicitly told otherwise

## Scope

This repo is the CLI-first starter scope only. No AG, no courier, no dashboard, no product/platform code.
