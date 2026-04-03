# LIVE COMMS: Tri-Agent Active Communication Reference

**READ THIS FIRST. THIS IS THE CANONICAL REFERENCE.**

This document teaches ALL agents (CC, AG, Codex) how to communicate with each other using **active terminal injection** - the ONLY reliable method for real-time inter-agent communication.

---

## THE GOLDEN RULE

**NEVER assume another agent will poll comms.md. ALWAYS inject directly into their terminal.**

Writing to comms.md alone is like leaving a voicemail for someone whose phone is off. They will NEVER see it until manually poked. The system will fail silently.

---

## COMMUNICATION MATRIX

### How to SEND to Each Agent

| If YOU are... | To reach CC | To reach AG | To reach Codex | To reach Gemini |
|---------------|-------------|-------------|----------------|-----------------|
| **CC** | (self) | `node ag.js send "msg"` | `node codex.js send "msg"` | `node gemini.js send "msg"` |
| **AG** | `node cc.js send "msg"` | (self) | `node codex.js send "msg"` | `node gemini.js send "msg"` |
| **Codex** | Write to `codex_outbox/*.msg` | Write to `codex_outbox/*.msg` | (self) | Write to `codex_outbox/*.msg` |
| **Gemini** | `node cc.js send "msg"` | `node ag.js send "msg"` | `node codex.js send "msg"` | (self) |

### CRITICAL: Always Use Control Scripts, Never Raw tmux

**WRONG (message gets stuck in input box):**
```bash
tmux send-keys -t gemini "message" Enter  # BROKEN - race condition
```

**CORRECT (has required 1-second delay):**
```bash
node gemini.js send "message"  # WORKS - delay built in
```

All CLI agents (CC, Codex, Gemini) have input buffer race conditions. The control scripts (`cc.js`, `codex.js`, `gemini.js`) include a 1-second delay between sending text and hitting Enter. Raw `tmux send-keys` does not.

### Codex Outbox Format (for Codex → CC or Codex → AG)

```bash
# IMPORTANT: Use full path from repo root for cold-start safety

# To CC:
echo '{"target":"cc","msg":"[Codex] Your message here"}' > interlateral_dna/codex_outbox/$(date +%s).msg

# To AG:
echo '{"target":"ag","msg":"[Codex] Your message here"}' > interlateral_dna/codex_outbox/$(date +%s).msg
```

**Requires:** `courier.js` must be running to deliver messages. Start with:
```bash
cd interlateral_dna && node courier.js > /tmp/courier.log 2>&1 &
```

---

## HOW TO READ/OBSERVE Other Agents

| If YOU are... | To see CC's terminal | To see AG's conversation | To see Codex's terminal | To see Gemini's terminal |
|---------------|---------------------|-------------------------|------------------------|--------------------------|
| **CC** | (self) | `node ag.js read` | `tmux capture-pane -t codex -p` | `tmux capture-pane -t gemini -p` |
| **AG** | `tmux capture-pane -t claude -p` | (self) | `tmux capture-pane -t codex -p` | `tmux capture-pane -t gemini -p` |
| **Codex** | Read `comms.md` | Read `comms.md` | (self) | Read `comms.md` |
| **Gemini** | `tmux capture-pane -t claude -p` | `node ag.js read` | `tmux capture-pane -t codex -p` | (self) |

### Important: `node ag.js read`

This command returns AG's chat panel content as TEXT. Use it to see:
- What AG has been doing
- AG's conversation history
- AG's responses to other agents

**Example:**
```bash
node ag.js read | tail -50  # Last ~50 lines of AG conversation
```

---

## THE LEDGER + WHIP PATTERN

Every communication should do BOTH:

1. **WHIP (Active Injection):** Send the message via terminal injection (wakes them up)
2. **LEDGER (Passive Record):** Log to comms.md (creates audit trail)

**Wrong:**
```
[AG writes to comms.md and waits]
[Codex never sees it because they're not polling]
[System fails silently]
```

**Right:**
```
[AG writes to comms.md for the record]
[AG runs: node codex.js send "Check comms.md for details"]
[Codex wakes up and reads comms.md]
[System works]
```

---

## COURIER SETUP (Required for Codex Outbound)

The courier enables Codex to send to CC and AG despite sandbox restrictions.

**Start courier (with logging):**
```bash
cd interlateral_dna && node courier.js > /tmp/courier.log 2>&1 &
```

**Verify it's running:**
```bash
ps aux | grep courier
# Check the log (only available if started with redirection above):
tail -f /tmp/courier.log
```

**If courier is not running, Codex outbound messages will NOT be delivered.**

---

## TROUBLESHOOTING

### "Agent didn't respond"

1. Did you use active injection or just write to comms.md?
2. Is the target agent's tmux session running? (`tmux list-sessions`)
3. For Codex outbound: Is courier.js running?

### "Codex can't send to CC/AG"

1. Courier must be running
2. Codex writes to `codex_outbox/*.msg` (not direct tmux)
3. Check `/tmp/courier.log` for errors

### "AG seems idle"

AG doesn't poll. You must inject: `node ag.js send "wake up message"`

### "I can't see what AG did"

Use `node ag.js read` to get AG's conversation as text.

---

## QUICK REFERENCE CARD

```
┌──────────────────────────────────────────────────────────────┐
│                    LIVE COMMS CHEAT SHEET                    │
├──────────────────────────────────────────────────────────────┤
│  CC → AG:      node ag.js send "msg"                         │
│  CC → Codex:   node codex.js send "msg"                      │
│  CC → Gemini:  node gemini.js send "msg"                     │
│  AG → CC:      node cc.js send "msg"                         │
│  AG → Codex:   node codex.js send "msg"                      │
│  AG → Gemini:  node gemini.js send "msg"                     │
│  Gemini → CC:  node cc.js send "msg"                         │
│  Gemini → AG:  node ag.js send "msg"                         │
│  Codex → *:    echo '{"target":"cc","msg":"..."}' > outbox   │
├──────────────────────────────────────────────────────────────┤
│  See AG:       node ag.js read                               │
│  See Codex:    tmux capture-pane -t codex -p                 │
│  See Gemini:   tmux capture-pane -t gemini -p                │
│  See CC:       tmux capture-pane -t claude -p                │
├──────────────────────────────────────────────────────────────┤
│  ⚠️  NEVER use raw 'tmux send-keys' - use the .js scripts!   │
└──────────────────────────────────────────────────────────────┘
```

---

## IMPORTANT LESSONS LEARNED

1. **AG will naturally forget** to use active injection and default to comms.md. This WILL fail. AG must be reminded.

2. **Codex cannot use tmux directly** due to sandbox. That's why courier.js exists.

3. **`node ag.js read` exists** and should be used to observe AG's conversation. Don't rely only on screenshots.

4. **comms.md is for audit, not signaling.** It's the ledger, not the messenger.

5. **NEVER use raw `tmux send-keys` for CLI agents.** All CLI agents (CC, Codex, Gemini) have input buffer race conditions. Messages will appear in the text box but won't submit. ALWAYS use the control scripts (`cc.js`, `codex.js`, `gemini.js`) which have a 1-second delay built in.

6. **Gemini CLI is quad-agent #4.** Same communication patterns as Codex. Use `node gemini.js send` to reach it.

---

*Last updated: 2026-01-28 after discovering raw tmux send-keys leaves messages stuck in Gemini's input box.*
