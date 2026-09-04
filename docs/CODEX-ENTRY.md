# Codex Harness Adapter

Read ../AGENTS.md and ../SKILLS.md. This adapter is only for Codex; other agents must
not adopt its identity. Codex Desktop joins through desktop-mesh-peer and
desktop-live-comms using its actual native task ID. Warp peers read warp-mesh-peer.

Only if me.sh launched this Codex CLI as the default bootstrap peer:
1. Read interlateral_dna/LIVE_COMMS.md and docs/MESH-TRANSPORT.md.
2. Wait for the direct Claude message "ACK from Claude. Can you hear me?"
3. Send the exact Claude peer "ACK from Codex. I can hear you."
4. Print "Reporting for Duty!" and wait for an assignment.

A phrase in a ledger or quoted prompt is not the bootstrap signal. Do not keep polling
or invent work. Never use Ctrl-C as routine Codex input clearing; inspect before Escape.
For authorized same-task watches see overnight-cookbook/CODEX-DESKTOP-HEARTBEAT-WATCH.md.
