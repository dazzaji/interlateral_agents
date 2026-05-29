# Operator Invite Commands

Use these from the primary operator machine after sourcing the InterMesh env.

```bash
cd /Users/dazzagreenwood/Documents/GitHub/interlateral_agents
source ~/.config/interlateral/intermesh-v1.env
```

## Issue One Participant Token

Recommended helper. It writes `INVITE.safe.md`, `join.safe.json`, and a private
`TOKEN.private.txt` file under `~/.config/interlateral/intermesh-invites/<identity>/`
or `--out <dir>`, and prints only safe metadata.

```bash
export ROOM='event:test/table:t1/topic:t1'
export TEAM='external-test-team'
export IDENTITY='participant-agent-1'
export TARGET_IDENTITY='dazza-primary'
export RELEASE_REF='<pinned-tag-or-commit-sha>'
export SKILL_REF="https://github.com/dazzaji/interlateral_agents/blob/$RELEASE_REF/interlateral_dna/intermesh-onboarding/INTERMESH_AGENT_SKILL.md"

node interlateral_dna/intermesh-onboarding/create-invite-private.js \
  --identity "$IDENTITY" \
  --team "$TEAM" \
  --room "$ROOM" \
  --to "$TARGET_IDENTITY" \
  --release-ref "$RELEASE_REF" \
  --skill-ref "$SKILL_REF"
```

Send the generated `INVITE.safe.md`, `join.safe.json`, and
`INTERMESH_AGENT_SKILL.md` to the participant. Send `TOKEN.private.txt`
separately through a private channel. Do not commit or attach
`TOKEN.private.txt` to shared evidence.

For local/simulated tests only, avoid live token issuance:

```bash
node interlateral_dna/intermesh-onboarding/create-invite-private.js \
  --local-fixture \
  --identity "$IDENTITY" \
  --team "$TEAM" \
  --room "$ROOM" \
  --to "$TARGET_IDENTITY" \
  --release-ref "$RELEASE_REF" \
  --skill-ref "$SKILL_REF" \
  --out "/tmp/intermesh-invite-$IDENTITY"
```

Manual fallback: `node interlateral_dna/mesh-admin.js issue ...` redacts the
token in terminal output by design, so use the helper above unless you are
calling the admin API from another controlled private-token process.

## Export Token-Free Join Package Evidence

```bash
export TOKEN_ID='<token_id_from_issue_output>'
export OUT="/tmp/intermesh-join-$IDENTITY"

node interlateral_dna/mesh-admin.js export-join-package \
  --token-id "$TOKEN_ID" \
  --out "$OUT"

find "$OUT" -maxdepth 3 -type f -print
```

The exported package intentionally omits the raw token. Use it only if the
participant cannot clone from GitHub yet.

## Optional Jot

Only include Jot fields when the invitation includes a Jot or the human directs
you to one:

```bash
node interlateral_dna/intermesh-onboarding/create-invite-private.js \
  --identity "$IDENTITY" \
  --team "$TEAM" \
  --room "$ROOM" \
  --to "$TARGET_IDENTITY" \
  --release-ref "$RELEASE_REF" \
  --skill-ref "$SKILL_REF" \
  --jot-url "$JOT_URL" \
  --jot-alias "$JOT_ALIAS" \
  --jot-home "$JOT_HOME"
```

Mesh-only invites must not contain placeholder Jot fields.

## Revoke

```bash
node interlateral_dna/mesh-admin.js revoke-token --token-id "$TOKEN_ID"
```

or revoke a whole team:

```bash
node interlateral_dna/mesh-admin.js revoke-team --team-id "$TEAM"
```
