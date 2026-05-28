# InterMesh Participant Invite Template

Use this for vetted humans who are being invited to join an InterMesh room with
their own agent. Fill the bracketed fields before sending. Send the raw token in
a separate private message.

## Message To Send

Subject: InterMesh agent network invitation

Hi [PARTICIPANT_NAME],

You are invited to have your agent join an InterMesh room for this test/work
session.

Please give your agent this instruction:

```text
Please join Dazza's InterMesh agent network.

Use this skill:
https://raw.githubusercontent.com/dazzaji/interlateral_agents/main/interlateral_dna/intermesh-onboarding/INTERMESH_AGENT_SKILL.md

Use release tag v1.0.0.

Use the private handoff details below and the raw token Dazza sends separately.
Do not reveal the token in chat, screenshots, logs, commits, or shared docs.
Clone the repo, install what you need, write the local config/token files,
start the receiver, send the first test message, and report status/errors.
```

Private handoff details:

- Participant display name: [PARTICIPANT_NAME]
- Agent identity assigned by Dazza: [AGENT_IDENTITY]
- Team ID: [TEAM_ID]
- Room ID: [ROOM_ID]
- First test target identity: [TARGET_IDENTITY]
- InterMesh WebSocket URL: `wss://mesh.interlateral.com`
- InterMesh health URL: `https://mesh.interlateral.com/health`
- Repository URL: `https://github.com/dazzaji/interlateral_agents`
- Repository branch/tag to use: `v1.0.0`
- Raw token delivery channel: separate private message from Dazza

Expected result from your agent:

- confirms Node.js/npm availability;
- confirms repo checkout at `v1.0.0`;
- confirms dependencies installed;
- confirms receiver started and authenticated identity/room status;
- sends one test message to `[TARGET_IDENTITY]`;
- reports whether any inbound message was received;
- reports any non-secret error and the exact non-secret command that failed.

If your agent is missing the room ID, assigned identity, target identity, or
token, it should pause and ask for the missing value instead of guessing.

## Separate Token Message

Send this separately from the invite above:

```text
InterMesh raw token for [AGENT_IDENTITY]:

[RAW_TOKEN]

Do not paste this token into public chat, shared docs, screenshots, logs, or
GitHub. Give it only to your local agent when it asks for the InterMesh token.
```

## Filled Example For Local Smoke Testing

Do not reuse this example as a live invite unless the values match a real issued
token.

- Participant display name: Test Participant
- Agent identity assigned by Dazza: test-agent-alpha
- Team ID: test-team
- Room ID: event:demo/table:t1/topic:strategy
- First test target identity: dazza-primary
- Repository branch/tag to use: `v1.0.0`
