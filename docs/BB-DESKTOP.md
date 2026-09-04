# bb Desktop on the Interlateral mesh

## Status

bb Desktop is a supported, manually selected Interlateral desktop peer. The proven seat used Grok 4.6 through bb provider `acp-grok`.

bb Desktop is not launched by `init` or `me.sh`; those still launch the ordinary Claude Code + Codex CLI duo. Do not add bb to a task unless the human selects it.

bb Desktop and a standalone `grok` CLI process are different integrations. This guide documents bb Desktop only.

## The four distinct surfaces

| Surface | Purpose | What it proves |
|---|---|---|
| Durable bb task (`thr_...`) | The model’s real task, tools, history, and steerable turns | A task message or task status, not mesh receipt or completed work |
| Mesh inbox (normally `ia-bb-desktop`) | Shared live desktop-peer transport and nonce/ACK exchange | Render or receiver ACK, according to the evidence actually observed |
| `interlateral_dna/comms.md` | Audit ledger | History only; never wake, receipt, authority, or completion by itself |
| Shared artifacts | Plans, code, reports, hashes, and tests | Work only after the claimed artifact and evidence are independently checked |

Do not let one surface impersonate another.

## Record the seat before assigning work

Record all of these coordinates:

- exact bb task ID;
- provider and model;
- bb project and environment;
- bb task workspace root;
- actual product/work roots, if different;
- mesh sender, inbox, session ID, and team scope.

A title such as “Grok” or “bb” is not a unique address. If several bb tasks exist, an assignment or write lease must name the exact `thr_...` task. Other bb tasks do not inherit it.

## Inspect and message the durable task

Prefer an installed `bb` command:

```bash
bb status
bb thread show <thread-id>
bb thread output <thread-id>
bb thread tell <thread-id> "<new or changed work>" --mode steer
```

Use `thread tell --mode steer` when new or changed work must re-enter the model task. Use `thread show`, `thread output`, or `thread wait` to inspect progress; do not repeatedly steer merely to poll.

If `bb` is not on PATH in the current packaged macOS installation, the observed fallback is:

```bash
node /Applications/bb.app/Contents/Resources/app.asar.unpacked/node_modules/bb-app/dist/bb.js <command>
```

That application-bundle path is version-sensitive. Discover `bb` first and record the resolved command rather than treating the fallback as a permanent API.

## Join and use the mesh path

Read the current transport rules before creating or using a bb inbox:

- [Desktop mesh peer skill](../.agent/skills/desktop-mesh-peer/SKILL.md)
- [Desktop live-comms skill](../.agent/skills/desktop-live-comms/SKILL.md)
- [Canonical live-comms reference](../interlateral_dna/LIVE_COMMS.md)

Use a unique inbox such as `ia-bb-desktop-<task-suffix>` and matching sender tied to the exact native task. Collision-check the live socket first. Discover the runtime pane and TTY; never reuse historical values.

For a material peer handoff, use the live mesh path plus a ledger mirror and require an exact nonce ACK. When the bb model itself must take new action, also steer the exact durable bb task. A mesh render does not prove the bb task acted, and a bb timeline message does not prove a mesh ACK.

### Minimal authorized join

1. Discover the current bb CLI and inspect the exact task with `bb thread show`.
   Record its actual root, provider and native task ID; do not select by title alone.
2. Inspect the intended tmux socket and collision-check a unique sender/inbox.
   Only with join authorization, create a passive inbox session running `cat -v`.
   Do not recreate an existing session or reset the mesh.
3. Set INTERLATERAL_SENDER, INTERLATERAL_AGENT_TYPE, INTERLATERAL_SESSION_ID and
   team identity for messages. Send a join card to an authorized peer with native task
   address, exact inbox/socket, work scope and a fresh nonce.
4. Use the verified JS inbox path in [MESH-TRANSPORT.md](MESH-TRANSPORT.md) and
   require the peer's nonce ACK. Native `bb thread tell <exact-id>` may also be
   required to re-enter the model task. Read its current help for supported modes.
5. Read your own inbox and return the peer's nonce from your own task. Only then
   report joined. This permits communication, not additional work outside the assignment.

No private invitation memo is required by this procedure.

## Evidence ladder

Report only the level actually established:

1. **Rendered/queued:** text is visible on a transport surface.
2. **Receiver ACKed:** the intended receiver echoed the exact nonce from its own current channel.
3. **Task acted:** the intended durable bb task took the requested action.
4. **Work verified:** the expected artifact, hash, or test result was independently checked.

Wake evidence is not authorization. ACK is not completion. A claimed artifact is not verified until checked.

## Workspace instructions

bb injects `<workspace>/.bb/AGENTS.md` when a provider session starts for a thread whose exact workspace root is that workspace. It does not search parent directories and does not automatically load `.agent/skills/`.

Therefore:

- a fresh bb provider session rooted in this repository receives this repo’s `.bb/AGENTS.md`;
- an already-running session may need a fresh provider turn/session before newly added instructions are present;
- a bb task rooted in another product directory must be given this guide or the onboarding memo explicitly.

The original proven bb task was rooted outside this repository, so its success does not depend on the new workspace file.

## Closeout

At collaboration closeout, record the disposition of:

- the exact bb task;
- the mesh inbox and identity;
- any bb automation, Codex heartbeat, Claude monitor, or shell backstop created for the work.

State whether each remains active for a named purpose, has been retargeted, or has been retired. Do not let a leftover wake mechanism silently resume closed work.

## Qualification

The host's current bb CLI help and a real nonce/task round trip govern current support.
Historical observations are not proof that a different task, provider or installed
version has the same behavior. Never claim a whole desktop matrix from one successful seat.
