#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { signAdminRequest } = require('../lib/admin-signing');

const DEFAULT_REPO_URL = 'https://github.com/dazzaji/interlateral_agents';
const DEFAULT_BASE_URL = process.env.MESH_RENDEZVOUS_URL || 'https://mesh.interlateral.com';
const DEFAULT_SKILL_REF = 'interlateral_dna/intermesh-onboarding/INTERMESH_AGENT_SKILL.md';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[name] = true;
    } else {
      args[name] = next;
      i += 1;
    }
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

function currentCommit() {
  try {
    return require('child_process')
      .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.resolve(__dirname, '..', '..'), encoding: 'utf8' })
      .trim();
  } catch {
    return 'unknown-local-head';
  }
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

function generatedToken(identity) {
  return {
    token: `tok_local_invite_${crypto.randomBytes(8).toString('hex')}.${crypto.randomBytes(32).toString('hex')}`,
    token_id: `tok_local_invite_${safePathSegment(identity)}`,
  };
}

async function issueToken(args, identity, room, team) {
  if (args.token || args['fixture-token']) {
    return {
      token: args.token || generatedToken(identity).token,
      token_id: args['token-id'] || `tok_fixture_${safePathSegment(identity)}`,
    };
  }
  if (args['local-fixture']) {
    return generatedToken(identity);
  }
  const rootKeyHex = process.env.MESH_ADMIN_ROOT_KEY || '';
  if (!/^[0-9a-f]{64}$/.test(rootKeyHex)) throw new Error('MESH_ADMIN_ROOT_KEY must be set to 64 lowercase hex chars, or use --local-fixture for non-live tests');
  return adminFetch({
    method: 'POST',
    route: '/admin/tokens/issue',
    baseUrl: args.url || DEFAULT_BASE_URL,
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
}

function safeJoin(args, issued, identity, room, team, target) {
  const releaseRef = args['release-ref'] || args.branch || currentCommit();
  const join = {
    created_at: new Date().toISOString(),
    identity,
    display_name: args['display-name'] || identity,
    team_id: team,
    room_id: room,
    targets: target ? { first_test: target } : {},
    repo_url: args['repo-url'] || DEFAULT_REPO_URL,
    release_ref: releaseRef,
    skill_ref: args['skill-ref'] || `${DEFAULT_REPO_URL}@${releaseRef}:${DEFAULT_SKILL_REF}`,
  };
  if (args['jot-url']) {
    join.jot = {
      jot_url: args['jot-url'],
      jot_alias: args['jot-alias'] || null,
      jot_home: args['jot-home'] || null,
    };
  }
  return join;
}

function inviteMarkdown(join) {
  const target = join.targets?.first_test || '<target identity from room lead>';
  const jotBlock = join.jot ? `
## Optional Jot

- Jot URL: ${join.jot.jot_url}
- Jot alias: ${join.jot.jot_alias || ''}
- Jot home: ${join.jot.jot_home || ''}
` : '';

  return `# InterMesh Safe Invite

## Join Details

- identity: ${join.identity}
- display_name: ${join.display_name}
- team_id: ${join.team_id}
- room_id: ${join.room_id}
- targets.first_test: ${target}
- repo_url: ${join.repo_url}
- release_ref: ${join.release_ref}
- skill_ref: ${join.skill_ref}
- created_at: ${join.created_at}
${jotBlock}`;
}

function writeOutputs(outDir, join, token) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
  const inviteFile = path.join(outDir, 'INVITE.safe.md');
  const joinFile = path.join(outDir, 'join.safe.json');
  const tokenFile = path.join(outDir, 'TOKEN.private.txt');
  fs.writeFileSync(inviteFile, inviteMarkdown(join), { mode: 0o600 });
  fs.writeFileSync(joinFile, JSON.stringify(join, null, 2), { mode: 0o600 });
  fs.writeFileSync(tokenFile, `${token}\n`, { mode: 0o600 });
  fs.chmodSync(tokenFile, 0o600);
  return { inviteFile, joinFile, tokenFile };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const identity = required(args, 'identity');
  const room = required(args, 'room');
  const team = required(args, 'team');
  const target = args.to || '';
  const issued = await issueToken(args, identity, room, team);
  const join = safeJoin(args, issued, identity, room, team, target);
  const outDir = args.out || path.join(os.homedir(), '.config', 'interlateral', 'intermesh-invites', safePathSegment(identity));
  const files = writeOutputs(outDir, join, issued.token);

  console.log(JSON.stringify({
    status: 'OK',
    identity,
    team_id: team,
    room_id: room,
    invite_safe_file: files.inviteFile,
    join_safe_file: files.joinFile,
    token_private_file: files.tokenFile,
    note: 'Safe files contain no raw token. Send TOKEN.private.txt through a separate private channel and do not commit it.',
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
