# InterMesh Participant Handoff

Give this section to your agent together with `INTERMESH_AGENT_SKILL.md`.

## Your Join Details

- Participant display name:
- Agent identity assigned by Dazza:
- Team ID:
- Room ID:
- InterMesh WebSocket URL: `wss://mesh.interlateral.com`
- InterMesh health URL: `https://mesh.interlateral.com/health`
- Repository URL: `https://github.com/dazzaji/interlateral_agents`
- Repository branch/tag to use:
- Raw token delivery channel: separate private message from Dazza

## Human Instructions

1. Give your agent this file and `INTERMESH_AGENT_SKILL.md`.
2. Give your agent the raw token Dazza sent separately.
3. Ask your agent:

```text
Use the InterMesh agent skill and this handoff packet to join the room. Install
what you need, start the receiver, send a test message to Dazza's agent, and
report your status plus any errors. Do not reveal the raw token.
```

## Expected Agent Report Back

The agent should report:

- repo clone/update status;
- Node.js/npm availability;
- receiver status JSON with identity and room;
- one sent test message result;
- one received message or inbound ledger status if available;
- any error and the exact non-secret command that failed.
