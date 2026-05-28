# Operator Invite Commands

Use these from the primary operator machine after sourcing the InterMesh env.

```bash
cd /Users/dazzagreenwood/Documents/GitHub/interlateral_agents
source ~/.config/interlateral/intermesh-v1.env
```

## Issue One Participant Token

Recommended local-only helper. It writes the raw token to a private `0600`
file under `~/.config/interlateral/intermesh-invites/<identity>/` and prints
only safe metadata.

```bash
export ROOM='event:test/table:t1/topic:t1'
export TEAM='external-test-team'
export IDENTITY='participant-agent-1'
export TARGET_IDENTITY='dazza-primary'
export BRANCH_OR_TAG='<branch-or-tag-after-Dazza-pushes-InterMesh>'

node interlateral_dna/intermesh-onboarding/create-invite-private.js \
  --identity "$IDENTITY" \
  --team "$TEAM" \
  --room "$ROOM" \
  --to "$TARGET_IDENTITY" \
  --branch "$BRANCH_OR_TAG"
```

Send the generated `HANDOFF.safe.md` and `INTERMESH_AGENT_SKILL.md` to the
participant. Send `TOKEN.private.txt` separately through a private channel.
Do not commit or attach `TOKEN.private.txt` to shared evidence.

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

## Revoke

```bash
node interlateral_dna/mesh-admin.js revoke-token --token-id "$TOKEN_ID"
```

or revoke a whole team:

```bash
node interlateral_dna/mesh-admin.js revoke-team --team-id "$TEAM"
```
