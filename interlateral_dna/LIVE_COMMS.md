# LIVE COMMS: Interlateral Agents v0.1

This is the canonical reference for direct comms in the starter-scope repo. v0.1 is CLI-first and tmux-first: Claude Code, Codex, and Gemini CLI all communicate by injecting directly into each other's tmux panes.

## Golden Rule

Never rely on `comms.md` alone. `comms.md` is the ledger, not the messenger.

Every meaningful handoff should do both:

1. Send directly with `node interlateral_dna/*.js send "message"`
2. Let the control script append the stamped message to `interlateral_dna/comms.md`

## Current Sessions

`me.sh` boots two agents by default:

- Claude Code: `ia-claude`
- Codex: `ia-codex`

Gemini CLI is available via `scripts/launch-gemini-peer.sh` and uses session names like `ia-gemini-peer-NN`.

- Shared tmux socket: `/tmp/interlateral-agents-tmux.sock`

These values are defined in `scripts/tmux-config.sh`.

## Send Matrix

| Sender | Claude | Codex | Gemini |
|---|---|---|---|
| Claude | self | `node interlateral_dna/codex.js send "msg"` | `node interlateral_dna/gemini.js send "msg"` |
| Codex | `node interlateral_dna/cc.js send "msg"` | self | `node interlateral_dna/gemini.js send "msg"` |
| Gemini | `node interlateral_dna/cc.js send "msg"` | `node interlateral_dna/codex.js send "msg"` | self |

## Why The Control Scripts Matter

Do not use raw `tmux send-keys` for agent-to-agent messages. Claude, Codex, and Gemini all need a short delay between text injection and `Enter`, otherwise messages can remain stuck in the input buffer.

Use:

```bash
node interlateral_dna/cc.js send "message"
node interlateral_dna/codex.js send "message"
node interlateral_dna/gemini.js send "message"
```

## Observation

For quick observation, use tmux capture on the shared socket:

```bash
source scripts/tmux-config.sh
agent_capture_deep "$CC_SESSION" 120
agent_capture_deep "$CODEX_SESSION" 120
agent_capture_deep "$GEMINI_SESSION" 120
```

`node interlateral_dna/gemini.js read` is also available when Gemini is running.

## Identity Stamping

Identity stamping is on by default. Messages are prefixed with a stable header:

```text
[ID team=agents sender=codex agent_type=codex host=... sid=...]
```

This lets a shared `comms.md` remain readable when multiple peers are active at once.

## Troubleshooting

If a peer does not respond:

1. Check that the target session exists on the shared socket.
2. Confirm the pane is running the agent CLI, not an idle shell.
3. Re-send via the control script instead of raw tmux.

If a launcher helper creates a new peer, it should join the same socket and use the same control scripts. There is no courier fallback in v0.1.

---

## How Injection Works

All three CLI agents (Claude Code, Codex, Gemini CLI) use TUI frameworks with autocomplete overlays that intercept `Enter` sent programmatically via tmux. Bare `Enter` or `C-m` creates a newline in the input box instead of submitting. This affects all programmatic input: tmux `send-keys`, VS Code `terminal.sendText()`, AppleScript, etc.

**The fix: Escape-then-Enter.** `Escape` dismisses the autocomplete/suggestion overlay. After that, `Enter` actually submits. This is the primary proven pattern — tested on Claude Code, Codex, and Gemini CLI at scale in 10+ agent systems.

```bash
# 1. Send prompt text in literal mode (-l preserves special chars)
tmux send-keys -t "$SESSION" -l "Your follow-up prompt here"
# 2. Brief pause for TUI to register text
sleep 0.3
# 3. Escape dismisses autocomplete overlay
tmux send-keys -t "$SESSION" Escape
# 4. Brief pause
sleep 0.1
# 5. Enter now submits
tmux send-keys -t "$SESSION" Enter
```

For long or multi-line prompts, use tmux's paste buffer instead of `send-keys -l`:

```bash
printf '%s' "$prompt" | tmux load-buffer -
tmux paste-buffer -t "$SESSION"
sleep 0.3
tmux send-keys -t "$SESSION" Escape
sleep 0.1
tmux send-keys -t "$SESSION" Enter
```

The control scripts (`cc.js`, `codex.js`, `gemini.js`) and the helper functions in `scripts/tmux-config.sh` (`agent_send`, `codex_send_clean`, `agent_send_long`, `agent_send_long_delayed`) all implement this pattern. Always use them rather than raw `tmux send-keys`.

## Safety: C-c Behavior Per CLI

**This is critical.** `C-c` behaves differently across CLI agents:

| CLI | C-c behavior | Safe to use for clearing input? |
|-----|-------------|--------------------------------|
| Claude Code | Cancels current operation | YES |
| Gemini CLI | Cancels current operation | YES |
| Codex | **KILLS the entire CLI process** | **NO — NEVER send C-c to Codex** |

For Codex, use `Escape` only to clear stuck input. Sending `C-c` will terminate the Codex CLI and you will lose the session.

## Clearing Stuck Input

If the input buffer has residual text from a failed send, clear it before sending a new prompt.

**Claude Code** (C-c safe):
```bash
tmux send-keys -t "$SESSION" Escape
sleep 0.3
tmux send-keys -t "$SESSION" C-c
sleep 0.5
```

**Gemini CLI** (C-c safe):
```bash
tmux send-keys -t "$SESSION" Escape
sleep 0.3
tmux send-keys -t "$SESSION" C-c
sleep 0.5
```

**Codex** (Escape only — C-c KILLS the process):
```bash
tmux send-keys -t "$SESSION" Escape
sleep 0.3
# Do NOT send C-c to Codex — it terminates the CLI!
```

## Idle Detection

Before dispatching a prompt, confirm the CLI is at its input prompt and not mid-response. Each CLI uses a different idle indicator:

| CLI | Idle indicator | Busy indicator |
|-----|----------------|----------------|
| Claude Code | `❯` prompt | Streaming text / tool output |
| Codex | `›` prompt | Streaming text / tool output |
| Gemini CLI | `Type your message` | Spinner (`⠼` and similar) |

Check idle state by capturing the pane tail:

```bash
tmux capture-pane -t "$SESSION" -p | tail -8
```

The `pane_idle` and `wait_for_idle` functions in `scripts/tmux-config.sh` automate this. Always check idle before sending follow-up prompts — sending to a busy agent can corrupt its input or be ignored.

## Headless / Non-Interactive Mode

All three CLIs support a headless mode that bypasses the TUI entirely. This is useful for scripted automation, dispatching one-shot tasks, and maintaining conversation context across calls.

**Claude Code:**

| Mode | Command |
|------|---------|
| Headless one-shot | `claude -p --dangerously-skip-permissions "task"` |
| Headless follow-up (same conversation) | `claude -p --dangerously-skip-permissions --continue "next"` |
| Resume by session ID | `claude -p --resume SESSION_ID "continue"` |
| Capture session ID | `session_id=$(claude -p --output-format json "task" \| jq -r '.session_id')` |

**Codex:**

| Mode | Command |
|------|---------|
| Headless one-shot | `codex exec -m gpt-5.4 --yolo "task"` |
| Resume session | `codex resume SESSION_ID` |

**Gemini CLI:**

| Mode | Command |
|------|---------|
| Headless one-shot | `gemini -m gemini-3.1-pro-preview -p "task"` |
| Resume most recent | `gemini -m gemini-3.1-pro-preview --resume latest` |

### Headless Inside tmux With Output Capture

```bash
tmux send-keys -t "$SESSION" \
  'claude --print --dangerously-skip-permissions "task" 2>&1 | tee /tmp/output.txt' Enter
```

### Bound Runtime (Prevent Stuck Agents)

When dispatching headless agents, use a hard timeout so a hung process cannot block the lane:

```bash
# Linux
timeout 420 claude -p --dangerously-skip-permissions "task" | tee /tmp/output.txt

# macOS (requires: brew install coreutils)
gtimeout 420 claude -p --dangerously-skip-permissions "task" | tee /tmp/output.txt
```

Exit codes: `0` = completed normally, `124` = killed by timeout.

### Continuous Headless Loop

For autonomous work where an agent should keep picking up tasks:

```bash
while true; do
  claude -p --dangerously-skip-permissions --continue \
    "Continue working. Read TASKS.md for context and update it when done."
  sleep 1
done
```

## Prompt Shape Rules

When dispatching prompts to other agents (via injection or headless mode), follow these rules:

1. **Short** — one focused instruction block, not a multi-page brief
2. **Imperative** — "Do X, then do Y, then stop"
3. **First-action focused** — the first instruction should be the coordination action (e.g., ACK handshake), not broad orientation

Avoid broad orientation before the required coordination step. Agents that receive overly broad startup prompts may drift into side work before completing the handshake.

For long content that must be sent, use `agent_send_long` / paste-buffer, but keep the prompt itself concise.

## CLI Launch Flags and Models

### Permission / Sandbox Bypass

All agents in this system run in full-permissions, no-sandbox mode by default. The flags used vary — this repo's launchers use specific flags, but the CLIs accept other forms too.

**This repo's launchers use:**

| CLI | Flag used in this repo | Launcher file |
|-----|----------------------|---------------|
| Claude Code | `--dangerously-skip-permissions` | `me.sh` |
| Codex | `--yolo` | `me.sh`, `scripts/launch-codex-peer.sh` |
| Gemini CLI | `--approval-mode=auto_edit` | `scripts/launch-gemini-peer.sh` |

**General CLI equivalents (for manual or headless use):**

| CLI | Alternative flags |
|-----|------------------|
| Claude Code | `--dangerously-skip-permissions` (only option) |
| Codex | `--yolo` or `--dangerously-bypass-approvals-and-sandbox` (both work) |
| Gemini CLI | `-y` (yolo) or `--approval-mode=auto_edit` |

These flags are required for unattended multi-agent operation. Without them, agents will block on permission prompts that no one is there to approve. When launching agents manually or in headless mode, use the flags shown above.

### Default Models

| CLI | Default model | Notes |
|-----|--------------|-------|
| Claude Code | Opus 4.6 | Default when launched normally |
| Codex | gpt-5.4 (heavy reasoning) | Specify with `-m gpt-5.4` |
| Gemini CLI | gemini-3.1-pro-preview | Specify with `-m gemini-3.1-pro-preview` |

### Available Model Variants

Other models are available for specific use cases. Requirements from the user or from a skill's SKILL.md will tell you when to use a non-default model.

**Codex variants:**

| Model | Flag | Characteristics |
|-------|------|-----------------|
| gpt-5.4 (default) | `-m gpt-5.4` | Heavy reasoning, general work |
| gpt-5.3-codex-spark | `-m gpt-5.3-codex-spark` | Faster output (~1000 tok/s), lighter reasoning |

**Warning:** Do NOT use `codex-5.3` or `codex-5.2` model names with ChatGPT-linked auth — they will error.

**Gemini variants:**

| Model | Flag |
|-------|------|
| gemini-3.1-pro-preview (default) | `-m gemini-3.1-pro-preview` |

**Claude Code variants:**

Claude Code model selection is handled via its own configuration. The default (Opus 4.6) is used unless explicitly overridden.

### Full CLI Launch Reference

**Claude Code:**

| Mode | Command |
|------|---------|
| Interactive (full perms) | `claude --dangerously-skip-permissions` |
| Interactive + first prompt | `claude --dangerously-skip-permissions "prompt"` |
| Headless one-shot | `claude -p --dangerously-skip-permissions "task"` |
| Headless follow-up | `claude -p --dangerously-skip-permissions --continue "next"` |
| Resume by session | `claude -p --resume SESSION_ID "continue"` |

**Codex (this repo uses `--yolo`):**

| Mode | Command |
|------|---------|
| Interactive (repo default) | `codex -m gpt-5.4 --yolo` |
| Interactive + first prompt | `codex -m gpt-5.4 --yolo "prompt"` |
| Headless one-shot | `codex exec -m gpt-5.4 --yolo "task"` |
| Resume session | `codex resume SESSION_ID` |

**Gemini CLI (this repo uses `--approval-mode=auto_edit`):**

| Mode | Command |
|------|---------|
| Interactive (repo default) | `gemini -m gemini-3.1-pro-preview --approval-mode=auto_edit` |
| Interactive + first prompt | `gemini -m gemini-3.1-pro-preview --approval-mode=auto_edit "prompt"` |
| Headless one-shot | `gemini -m gemini-3.1-pro-preview -p "task"` |
| Resume session | `gemini -m gemini-3.1-pro-preview --resume latest` |

## Split Boot Strategy

Different CLIs require different boot strategies. This repo's launchers implement these:

| CLI | Strategy | Reason |
|-----|----------|--------|
| Codex | First prompt as CLI argument | Codex's TUI settles quickly; CLI-arg works reliably |
| Claude Code | Bare launch, wait for `❯` idle prompt, then inject | Claude's heavier TUI startup can truncate/mangle long CLI-arg prompts |
| Gemini CLI | Bare launch with `--approval-mode=auto_edit`, wait for idle, then inject via `agent_send_long_delayed` with 1s delay | Gemini needs the delay between paste and submit; `launch-gemini-peer.sh` handles this |

If building launchers or dispatching new peer agents, test the boot path independently — do not assume all CLIs behave the same at startup.

## Reading Worker Output

```bash
# Current visible pane content
tmux capture-pane -t "$SESSION" -p | tail -120

# Deep scrollback (last 200 lines)
tmux capture-pane -t "$SESSION" -p -S -200

# Save to file
tmux capture-pane -t "$SESSION" -p -S -500 > logs/output.txt
```

The helpers `agent_capture_recent` and `agent_capture_deep` in `scripts/tmux-config.sh` wrap these patterns.

## Session Health and Management

```bash
# Check if a session exists
tmux has-session -t "$SESSION" 2>/dev/null && echo "ALIVE" || echo "DEAD"

# List all sessions on the shared socket
tmux -S "$INTERLATERAL_TMUX_SOCKET" list-sessions 2>/dev/null

# Kill a single session
tmux kill-session -t "$SESSION"
```

## Verified Test Results

The Escape-then-Enter pattern and related techniques have been tested across CLI versions:

| Pattern | Claude Code | Codex | Gemini CLI |
|---------|-------------|-------|------------|
| Plain `Enter` follow-up | FAIL | FAIL | FAIL |
| `C-m` alone | FAIL | FAIL | not tested |
| `-l` text then Escape then Enter | **PASS** | **PASS** | **PASS** |
| paste-buffer then Escape then Enter | **PASS** | **PASS** | **PASS** |
| `C-c` buffer clear | Safe | **KILLS CLI** | Safe |
| `Escape` buffer clear | Safe | Safe | Safe |
| Idle detection | **PASS** | **PASS** | **PASS** |
| Headless `-p` mode | **PASS** | **PASS** (`exec`) | **PASS** |
| First prompt as CLI arg | **PASS** | **PASS** | **PASS** |
