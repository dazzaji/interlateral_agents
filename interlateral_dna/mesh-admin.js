#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { signAdminRequest, selfTest: adminSigningSelfTest } = require('./lib/admin-signing');
const { validateRoomId } = require('./lib/room-id');

const DEFAULT_URL = process.env.MESH_RENDEZVOUS_URL || 'https://mesh.interlateral.com';

function usage() {
  console.log(`Usage:
  node interlateral_dna/mesh-admin.js self-test
  node interlateral_dna/mesh-admin.js issue --identity ID --room ROOM [--team-id TEAM] [--role participant]
  node interlateral_dna/mesh-admin.js issue-team --team-id TEAM --room ROOM --count N [--identity-prefix guest]
  node interlateral_dna/mesh-admin.js list [--team-id TEAM]
  node interlateral_dna/mesh-admin.js revoke-token --token-id TOKEN_ID
  node interlateral_dna/mesh-admin.js revoke-team --team-id TEAM
  node interlateral_dna/mesh-admin.js close-room --room ROOM
  node interlateral_dna/mesh-admin.js inspect-room --room ROOM
  node interlateral_dna/mesh-admin.js export-audit --room ROOM [--with-payload --authorize-payload-export]
  node interlateral_dna/mesh-admin.js export-join-package --token-id TOKEN_ID --out DIR
  node interlateral_dna/mesh-admin.js emergency-revoke-all --room ROOM

Options:
  --url URL              HTTPS Worker base URL
  --root-key-file FILE   File containing MESH_ADMIN_ROOT_KEY
  --audit-file FILE      Local admin-payload export audit JSONL path
  --fixture-response-file FILE  Local/simulated export-audit response JSON

Notes:
  inspect-room sockets are an active-socket snapshot only; sockets: [] is not
  proof that no participant was recently present under WebSocket hibernation.
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function rootKey(args) {
  if (args['root-key-file']) {
    return fs.readFileSync(args['root-key-file'], 'utf8').trim();
  }
  if (process.env.MESH_ADMIN_ROOT_KEY) return process.env.MESH_ADMIN_ROOT_KEY.trim();
  throw new Error('MESH_ADMIN_ROOT_KEY or --root-key-file is required');
}

function redact(value) {
  if (typeof value !== 'string') return value;
  if (value.includes('.')) {
    const [id] = value.split('.');
    return `${id}.<redacted>`;
  }
  if (value.length > 16) return `${value.slice(0, 8)}...${value.slice(-4)}`;
  return value;
}

function validateRooms(rooms) {
  for (const room of rooms) {
    const result = validateRoomId(room);
    if (!result.ok) throw new Error(`${result.code}: ${result.reason}`);
  }
}

function bodyJson(value) {
  return JSON.stringify(value);
}

function payloadExportAuthorized(args) {
  return Boolean(args['authorize-payload-export'] || process.env.INTERMESH_ADMIN_PAYLOAD_EXPORT_LOCAL_OK === 'local-simulated');
}

function requirePayloadExportAuthorization(args) {
  if (!args['with-payload']) return;
  if (!payloadExportAuthorized(args)) {
    const err = new Error('Admin payload export requires --with-payload plus --authorize-payload-export or INTERMESH_ADMIN_PAYLOAD_EXPORT_LOCAL_OK=local-simulated.');
    err.code = 'admin_payload_export_authorization_required';
    throw err;
  }
}

function appendAdminAudit(args, row) {
  const auditFile = args['audit-file'] || process.env.INTERMESH_ADMIN_AUDIT_FILE;
  if (!auditFile) return null;
  fs.mkdirSync(path.dirname(auditFile), { recursive: true });
  fs.appendFileSync(auditFile, JSON.stringify(row) + '\n');
  return auditFile;
}

function parseRoomParts(roomId) {
  const parts = {};
  for (const segment of String(roomId || '').split('/')) {
    const index = segment.indexOf(':');
    if (index > 0) parts[segment.slice(0, index)] = segment.slice(index + 1);
  }
  return parts;
}

function copyJoinPackageFiles(outDir, joinPackage, tokenId) {
  const root = __dirname;
  const firstRoom = joinPackage.config?.room_ids?.[0] || '';
  const roomParts = parseRoomParts(firstRoom);
  const packageJson = {
    name: 'intermesh-join-package',
    version: '0.1.0',
    private: true,
    description: 'Minimal InterMesh participant join package.',
    bin: {
      mesh: './bin/mesh.js',
      'mesh-receiver': './bin/mesh-receiver.js',
    },
    scripts: {
      status: 'node mesh.js status',
      send: 'node mesh.js send',
      receiver: 'node mesh-receiver.js',
    },
    dependencies: {
      ws: '^8.20.0',
    },
  };
  const configExample = {
    url: joinPackage.config?.url || 'wss://mesh.interlateral.com',
    identity_note: 'The authoritative identity is assigned by the server and returned in auth_ok.identity.',
    team_id: joinPackage.config?.team_id || null,
    room_id: firstRoom || null,
    room_ids: joinPackage.config?.room_ids || [],
    event_slug: roomParts.event || null,
    table_id: roomParts.table || null,
    topic_id: roomParts.topic || null,
    jot_url: joinPackage.config?.jot_url || null,
    participant_role: joinPackage.config?.role || 'participant',
    targets: {},
  };
  const readme = `# InterMesh Join Package

This is a minimal InterMesh participant package. It is intentionally not a full repository clone.

## Install

1. Install dependencies with \`npm install --omit=dev\`.
2. Copy \`config.example.json\` to \`.intermesh/config.json\`.
3. Put the one-time token provided by the event operator in \`.intermesh/token\` and set mode \`0600\`.

Do not paste the raw token into chat, logs, screenshots, or evidence files.

## First Commands

\`\`\`bash
node mesh.js status --home .intermesh
node mesh-receiver.js run --foreground --home .intermesh
node mesh.js send --home .intermesh --room "${firstRoom}" --to OTHER_IDENTITY --text "hello"
\`\`\`

The participant identity is server-assigned. Trust the \`auth_ok.identity\` returned after connection, not a self-asserted local name.

## Scope

- Worker URL: \`${configExample.url}\`
- Team: \`${configExample.team_id || ''}\`
- Room: \`${firstRoom}\`
- Role: \`${configExample.participant_role}\`
- Token id for operator reference: \`${tokenId || ''}\`
`;

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'bin'), { recursive: true });
  fs.cpSync(path.join(root, 'lib'), path.join(outDir, 'lib'), { recursive: true });
  fs.copyFileSync(path.join(root, 'mesh.js'), path.join(outDir, 'mesh.js'));
  fs.copyFileSync(path.join(root, 'mesh-receiver.js'), path.join(outDir, 'mesh-receiver.js'));
  fs.writeFileSync(path.join(outDir, 'bin', 'mesh.js'), "#!/usr/bin/env node\nrequire('../mesh.js');\n");
  fs.writeFileSync(path.join(outDir, 'bin', 'mesh-receiver.js'), "#!/usr/bin/env node\nrequire('../mesh-receiver.js');\n");
  fs.chmodSync(path.join(outDir, 'bin', 'mesh.js'), 0o755);
  fs.chmodSync(path.join(outDir, 'bin', 'mesh-receiver.js'), 0o755);
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(path.join(outDir, 'README-join.md'), readme);
  fs.writeFileSync(path.join(outDir, 'config.example.json'), JSON.stringify(configExample, null, 2));
  fs.writeFileSync(path.join(outDir, '.intermesh-token.example'), 'paste-operator-provided-token-here\n');
  fs.writeFileSync(path.join(outDir, 'join-package.json'), JSON.stringify({
    ...joinPackage,
    token_id: tokenId || null,
    token_delivery: 'separate operator channel; raw token intentionally omitted from package',
  }, null, 2));
}

async function adminFetch(args, method, route, bodyObject = null) {
  const base = args.url || DEFAULT_URL;
  const url = new URL(route, base).toString();
  const body = bodyObject ? bodyJson(bodyObject) : '';
  const ts = new Date().toISOString();
  const nonce = crypto.randomBytes(32).toString('hex');
  const signed = signAdminRequest({
    rootKeyHex: rootKey(args),
    method,
    url,
    body,
    ts,
    nonce,
  });
  const response = await fetch(url, {
    method,
    headers: {
      ...signed.headers,
      'Content-Type': 'application/json',
    },
    body: body || undefined,
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { text };
  }
  if (!response.ok) {
    const err = new Error(payload.error || payload.code || `HTTP ${response.status}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

async function command(args) {
  const cmd = args._[0];
  if (cmd === 'self-test') {
    const result = adminSigningSelfTest();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'PASS' ? 0 : 1);
  }
  if (!cmd || cmd === 'help') {
    usage();
    return;
  }

  let result;
  if (cmd === 'issue') {
    const room = args.room;
    validateRooms([room]);
    result = await adminFetch(args, 'POST', '/admin/tokens/issue', {
      identity: args.identity,
      display_name: args['display-name'] || args.identity,
      team_id: args['team-id'] || 'default',
      room_ids: [room],
      role: args.role || 'participant',
      metadata_label: args.label || 'mesh-admin',
      expires_at: args.expires_at || null,
    });
  } else if (cmd === 'issue-team') {
    const room = args.room;
    validateRooms([room]);
    result = await adminFetch(args, 'POST', '/admin/teams/issue', {
      team_id: args['team-id'],
      room_ids: [room],
      count: Number(args.count || 1),
      identity_prefix: args['identity-prefix'] || 'guest',
      role: args.role || 'participant',
    });
  } else if (cmd === 'list') {
    const query = args['team-id'] ? `?team_id=${encodeURIComponent(args['team-id'])}` : '';
    result = await adminFetch(args, 'GET', `/admin/tokens${query}`);
  } else if (cmd === 'revoke-token') {
    result = await adminFetch(args, 'POST', '/admin/tokens/revoke', { token_id: args['token-id'] });
  } else if (cmd === 'revoke-team') {
    result = await adminFetch(args, 'POST', '/admin/teams/revoke', { team_id: args['team-id'] });
  } else if (cmd === 'close-room') {
    validateRooms([args.room]);
    result = await adminFetch(args, 'POST', '/admin/rooms/close', { room_id: args.room });
  } else if (cmd === 'inspect-room') {
    validateRooms([args.room]);
    result = await adminFetch(args, 'GET', `/admin/rooms/inspect?room_id=${encodeURIComponent(args.room)}`);
    result.inspect_room_presence_note = 'sockets is an active-socket snapshot only; sockets: [] is not proof that no participant was recently present under WebSocket hibernation.';
  } else if (cmd === 'export-audit') {
    validateRooms([args.room]);
    requirePayloadExportAuthorization(args);
    const query = `room_id=${encodeURIComponent(args.room)}${args['with-payload'] ? '&with_payload=true' : ''}`;
    result = args['fixture-response-file']
      ? JSON.parse(fs.readFileSync(args['fixture-response-file'], 'utf8'))
      : await adminFetch(args, 'GET', `/admin/audit?${query}`);
    if (args['with-payload']) {
      const auditRow = {
        at: new Date().toISOString(),
        kind: 'admin_payload_export',
        room_id: args.room,
        sensitive_output: true,
        authorization: args['authorize-payload-export'] ? 'explicit-cli-flag' : 'environment',
      };
      const auditFile = appendAdminAudit(args, auditRow);
      result = {
        status: 'OK',
        sensitive_output: true,
        payload_export_authorized: true,
        local_audit_file: auditFile,
        local_audit_row: auditRow,
        response: result,
      };
    }
  } else if (cmd === 'export-join-package') {
    result = await adminFetch(args, 'POST', '/admin/join-package', { token_id: args['token-id'] });
    if (args.out) {
      copyJoinPackageFiles(args.out, result, args['token-id']);
    }
  } else if (cmd === 'emergency-revoke-all') {
    validateRooms([args.room]);
    result = await adminFetch(args, 'POST', '/admin/emergency/revoke-all', { room_id: args.room });
  } else {
    throw new Error(`unknown command: ${cmd}`);
  }

  console.log(JSON.stringify(result, (key, value) => (
    key === 'token' || key === 'token_secret' ? redact(value) : value
  ), 2));
}

command(parseArgs(process.argv.slice(2))).then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(JSON.stringify({
    status: 'ERROR',
    error: err.message,
    code: err.code,
    http_status: err.status,
  }, null, 2));
  process.exit(1);
});
