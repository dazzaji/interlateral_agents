#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { signAdminRequest } = require('../lib/admin-signing');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function required(args, key) {
  if (!args[key]) throw new Error(`missing --${key}`);
  return args[key];
}

function safePathSegment(value) {
  const safe = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (!safe || safe === '.' || safe === '..') throw new Error('identity does not produce a safe invite path segment');
  return safe;
}

async function adminFetch({ method, route, bodyObject, baseUrl, rootKeyHex }) {
  const url = new URL(route, baseUrl).toString();
  const body = JSON.stringify(bodyObject);
  const ts = new Date().toISOString();
  const nonce = crypto.randomBytes(32).toString('hex');
  const signed = signAdminRequest({ rootKeyHex, method, url, body, ts, nonce });
  const response = await fetch(url, {
    method,
    headers: { ...signed.headers, 'Content-Type': 'application/json' },
    body,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.error || payload.code || `HTTP ${response.status}`);
  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const identity = required(args, 'identity');
  const room = required(args, 'room');
  const team = required(args, 'team');
  const branch = args.branch || '<branch-or-tag-after-Dazza-pushes-InterMesh>';
  const target = args.to || '<target-identity-from-Dazza>';
  const baseUrl = args.url || process.env.MESH_RENDEZVOUS_URL || 'https://mesh.interlateral.com';
  const rootKeyHex = process.env.MESH_ADMIN_ROOT_KEY || '';
  if (!/^[0-9a-f]{64}$/.test(rootKeyHex)) throw new Error('MESH_ADMIN_ROOT_KEY must be set to 64 lowercase hex chars');

  const issued = await adminFetch({
    method: 'POST',
    route: '/admin/tokens/issue',
    baseUrl,
    rootKeyHex,
    bodyObject: {
      identity,
      display_name: args['display-name'] || identity,
      team_id: team,
      room_ids: [room],
      role: args.role || 'participant',
      metadata_label: 'external-agent-onboarding',
      expires_at: args.expires_at || null,
    },
  });

  const inviteRoot = path.join(os.homedir(), '.config', 'interlateral', 'intermesh-invites', safePathSegment(identity));
  fs.rmSync(inviteRoot, { recursive: true, force: true });
  fs.mkdirSync(inviteRoot, { recursive: true, mode: 0o700 });
  const tokenFile = path.join(inviteRoot, 'TOKEN.private.txt');
  fs.writeFileSync(tokenFile, `${issued.token}\n`, { mode: 0o600 });
  fs.chmodSync(tokenFile, 0o600);

  const handoff = `# InterMesh Participant Handoff

Give this file and INTERMESH_AGENT_SKILL.md to your agent.

## Your Join Details

- Participant display name: ${args['display-name'] || identity}
- Agent identity assigned by Dazza: ${identity}
- Team ID: ${team}
- Room ID: ${room}
- Target identity for first test message: ${target}
- InterMesh WebSocket URL: wss://mesh.interlateral.com
- InterMesh health URL: https://mesh.interlateral.com/health
- Repository URL: https://github.com/dazzaji/interlateral_agents
- Repository branch/tag to use: ${branch}
- Raw token delivery channel: separate private message from Dazza
- Token ID for operator reference: ${issued.token_id}

## Human Prompt

\`\`\`text
Use the InterMesh agent skill and this handoff packet to join the room. Install
what you need, start the receiver, send a test message to ${target}, and report
your status plus any errors. Do not reveal the raw token.
\`\`\`
`;

  const handoffFile = path.join(inviteRoot, 'HANDOFF.safe.md');
  fs.writeFileSync(handoffFile, handoff, { mode: 0o600 });
  fs.chmodSync(handoffFile, 0o600);

  console.log(JSON.stringify({
    status: 'OK',
    identity,
    team,
    room,
    token_id: issued.token_id,
    token_private_file: tokenFile,
    handoff_safe_file: handoffFile,
    note: 'Raw token was written only to TOKEN.private.txt. Send it out of band; do not commit or paste it into public/shared logs.',
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
