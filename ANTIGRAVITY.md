# Antigravity on the Interlateral Mesh

Antigravity (Google, released at I/O 2026) can join the Interlateral mesh two
ways. They are independent — pick one per peer.

Antigravity is always opt-in. `init` / `me.sh` do not launch the CLI peer, do
not attach the desktop app, and collaboration skills should not recruit either
Antigravity path unless Principal Human explicitly requests it or the assignment names it.

## 1. Antigravity CLI peer — recommended

The Antigravity **CLI** (`agy`, Gemini 3.5 Flash) joins as a native CLI mesh
peer, exactly like Codex CLI and Gemini CLI: headless in a tmux session,
messages by direct injection, no permission-prompt cards.

This is the preferred integration. See the **`agy-cli-peer`** skill for the full
procedure. Summary:

- Binary: `~/.local/bin/agy` (`curl -fsSL https://antigravity.google/cli/install.sh | bash`)
- Session: `ia-agy` on `/tmp/interlateral-agents-tmux.sock`
- Identity: `INTERLATERAL_SENDER=agy`, `INTERLATERAL_AGENT_TYPE=agy`
- Launch interactive with `agy -i '<prompt>' --dangerously-skip-permissions --add-dir <repo>`
- Helper: `interlateral_dna/agy.js` (`send` / `status` / `read`)
- TUI submits on a plain `Enter` (not Escape-then-Enter like Codex)
- First run shows an onboarding wizard (theme + ToS) — advance with `Enter`

## 2. Antigravity desktop app via CDP — fallback

The Antigravity 2.0 **desktop app** can be driven over the Chrome DevTools
Protocol with `interlateral_dna/ag.js` (puppeteer-core). Use this only when the
visible desktop app specifically must be the peer; otherwise prefer the CLI.

Requirements:

- Launch the app with the debug port:
  ```bash
  open -a "Antigravity" --args --remote-debugging-port=9222
  ```
  The app must be fully quit first — `open` ignores `--args` for a running app.
- `puppeteer-core` and `ws` installed in `interlateral_dna/`
  (`cd interlateral_dna && npm install`). They are declared dependencies in
  `interlateral_dna/package.json` solely to support this `ag.js` CDP fallback
  — the CLI peer path needs no npm packages.
- The app on a conversation page (not the Launchpad).

Commands:

```bash
node interlateral_dna/ag.js status            # CDP connection + page
node interlateral_dna/ag.js send "message"    # type into the live chat pane
node interlateral_dna/ag.js read              # read the chat pane text
node interlateral_dna/ag.js screenshot [path] # capture the pane
node interlateral_dna/ag.js watch [ms]        # poll for changes
```

`ag.js` injects into the conversation page's `contenteditable` input via
`execCommand` and submits with `Enter`. It only connects to loopback CDP
endpoints, only accepts loopback WebSocket debugger URLs, only considers
loopback-hosted pages, and prefers Antigravity 2.0 conversation URLs
(`/c/<uuid>`). Legacy fallback selectors still rely on local page shape
(`workbench.html`, Manager title), so keep the debug port private and confirm
`ag.js status` points at the expected Antigravity window before sending.

Privacy note: the CDP path records conversation content locally. Sent messages
go to `interlateral_dna/ag_log.md`, and `read`/`watch` write full page text to
`.antigravitycli/ag_telemetry.log`. Both are git-ignored, but they are plaintext on
disk — treat them as you would any local chat transcript.

### Why CDP is the fallback, not the default

- The desktop app's permission engine (`~/.gemini/config/config.json`,
  `userSettings.globalPermissionGrants`) prompts per command token. Granting
  each token and relaunching after every config change is fragile.
- The CLI's `--dangerously-skip-permissions` flag is a clean, supported
  prompt-free mode. The desktop app has no equivalent single switch.
- The CLI peer needs no Electron, no debug port, no puppeteer.

## Desktop inbox peer

Separately, an Antigravity desktop *operator* can hold a passive tmux inbox
session (`ia-antigravity-desktop`) like Claude Desktop / Codex Desktop. That is
the `desktop-mesh-peer` path and does not provide programmatic live comms — it
relies on the desktop app reading the inbox. The CLI peer above is the only
fully programmatic Antigravity mesh integration.
