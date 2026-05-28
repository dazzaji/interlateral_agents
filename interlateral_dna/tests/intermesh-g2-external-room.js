#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const childProcess = require('child_process');
const { signAdminRequest } = require('../lib/admin-signing');
const { MeshClient } = require('../lib/mesh-client');
const { defaultPaths } = require('../lib/paths');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DNA_ROOT = path.resolve(__dirname, '..');
const EVIDENCE_ROOT = path.join(REPO_ROOT, 'sprint_runs/intermesh-v1/evidence/external-join');
const BASE_URL = process.env.MESH_RENDEZVOUS_URL || 'https://mesh.interlateral.com';
const WS_URL = process.env.MESH_RENDEZVOUS_WS || BASE_URL.replace(/^http/, 'ws');

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonFromString(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function run(command, args, options = {}) {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd || DNA_ROOT,
    env: options.env || process.env,
    encoding: 'utf8',
    timeout: options.timeout || 60000,
  });
  return {
    command: [command, ...args].join(' '),
    cwd: options.cwd || DNA_ROOT,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : null,
  };
}

function rootKey() {
  const key = process.env.MESH_ADMIN_ROOT_KEY || '';
  if (!/^[0-9a-f]{64}$/.test(key)) throw new Error('MESH_ADMIN_ROOT_KEY must be a 64-char lowercase hex key');
  return key;
}

async function adminJson(method, route, bodyObject = null) {
  const url = new URL(route, BASE_URL).toString();
  const body = bodyObject ? JSON.stringify(bodyObject) : '';
  const signed = signAdminRequest({
    rootKeyHex: rootKey(),
    method,
    url,
    body,
    ts: new Date().toISOString(),
    nonce: crypto.randomBytes(32).toString('hex'),
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
  return { ok: response.ok, http_status: response.status, body: payload };
}

async function issueToken({ identity, teamId, roomId, role = 'participant' }) {
  const response = await adminJson('POST', '/admin/tokens/issue', {
    identity,
    display_name: identity,
    team_id: teamId,
    room_ids: [roomId],
    role,
    metadata_label: 'g2-external-room',
  });
  if (!response.ok || !response.body?.token) {
    throw new Error(`token issue failed for ${identity}: ${JSON.stringify(response.body)}`);
  }
  return {
    response,
    token: response.body.token,
    token_id: response.body.token_id,
  };
}

async function health() {
  const response = await fetch(new URL('/health', BASE_URL));
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, http_status: response.status, body };
}

function tokenSecrets(tokens) {
  return tokens
    .map((token) => String(token || '').split('.')[1])
    .filter(Boolean);
}

function looksLikeSensitive(text, rawTokens, rawRootKey) {
  const tokenSecretSet = tokenSecrets(rawTokens);
  const withoutKnownFixture = text.replace(/tok_test_[A-Za-z0-9_]+\.[A-Za-z0-9_-]+/g, 'tok_test_<fixture>');
  return {
    raw_token: rawTokens.some((token) => token && text.includes(token)),
    raw_token_secret: tokenSecretSet.some((secret) => secret && text.includes(secret)),
    root_key: rawRootKey ? text.includes(rawRootKey) : false,
    bearer_header: /Bearer\s+[A-Za-z0-9_.-]+/.test(text),
    full_token_shape: /tok_[A-Za-z0-9_]+\.[A-Za-z0-9_-]{20,}/.test(withoutKnownFixture),
  };
}

function mergeFindings(findings) {
  return findings.some((finding) => Object.values(finding.matches).some(Boolean));
}

function isProbablyText(buffer) {
  if (buffer.length === 0) return true;
  let suspicious = 0;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 7 || (byte > 14 && byte < 32)) suspicious += 1;
  }
  return suspicious / sample.length < 0.02;
}

function scanEvidence(evidenceDir, rawTokens) {
  const rawRootKey = process.env.MESH_ADMIN_ROOT_KEY || '';
  const findings = [];
  const checkedFiles = [];
  const skipDirs = new Set(['node_modules']);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(file);
      } else if (entry.isFile()) {
        const buffer = fs.readFileSync(file);
        checkedFiles.push(path.relative(evidenceDir, file));
        if (file.endsWith('.tar.gz')) {
          const inflated = zlib.gunzipSync(buffer).toString('latin1');
          const matches = looksLikeSensitive(inflated, rawTokens, rawRootKey);
          if (Object.values(matches).some(Boolean)) findings.push({ file: path.relative(evidenceDir, file), mode: 'tar-gunzip', matches });
        } else if (isProbablyText(buffer)) {
          const matches = looksLikeSensitive(buffer.toString('utf8'), rawTokens, rawRootKey);
          if (Object.values(matches).some(Boolean)) findings.push({ file: path.relative(evidenceDir, file), mode: 'text', matches });
        }
      }
    }
  }

  walk(evidenceDir);
  return {
    status: mergeFindings(findings) ? 'FAIL' : 'PASS',
    checked_at: new Date().toISOString(),
    checked_files: checkedFiles.sort(),
    findings,
  };
}

function writeHome(home, token, roomId) {
  const paths = defaultPaths(home);
  fs.mkdirSync(paths.home, { recursive: true });
  fs.writeFileSync(paths.token, token);
  fs.chmodSync(paths.token, 0o600);
  writeJson(paths.config, {
    url: WS_URL,
    room_ids: [roomId],
    targets: {},
  });
  return paths;
}

function waitForLedger(paths, expectedId, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (fs.existsSync(paths.inboundLedger)) {
      const ledger = fs.readFileSync(paths.inboundLedger, 'utf8');
      if (ledger.includes(expectedId)) return true;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  return false;
}

async function tryConnect(token) {
  const client = new MeshClient({ url: WS_URL, token, timeoutMs: 10000 });
  try {
    const auth = await client.connect();
    client.close();
    return { status: 'PASS', auth };
  } catch (error) {
    client.close();
    return { status: 'FAIL', error: error.message, code: error.code || null };
  }
}

async function trySend(token, roomId, toIdentity, text) {
  const client = new MeshClient({ url: WS_URL, token, timeoutMs: 10000 });
  try {
    const sent = await client.sendMessage({ room_id: roomId, to_identity: toIdentity, text });
    client.close();
    return { status: 'PASS', envelope_id: sent.envelope.id };
  } catch (error) {
    client.close();
    return { status: 'FAIL', error: error.message, code: error.code || null };
  }
}

async function main() {
  const timestamp = stamp();
  const evidenceDir = path.join(EVIDENCE_ROOT, `g2-external-room-${timestamp}`);
  const packageDir = path.join(evidenceDir, 'package/intermesh-join-package');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), `intermesh-g2-${timestamp}-`));
  const rawTokens = [];
  const tokenIds = [];
  let receiver = null;
  let exitCode = 1;

  const roomJoin = `event:g2/table:join-${timestamp.toLowerCase().replace(/z$/, '')}`;
  const roomOther = `event:g2/table:other-${timestamp.toLowerCase().replace(/z$/, '')}`;
  const roomClose = `event:g2/table:close-${timestamp.toLowerCase().replace(/z$/, '')}`;

  try {
    fs.mkdirSync(packageDir, { recursive: true });
    const healthProof = await health();

    const tokenA = await issueToken({ identity: 'g2-package-a', teamId: 'g2-team-a', roomId: roomJoin });
    const tokenB = await issueToken({ identity: 'g2-package-b', teamId: 'g2-team-a', roomId: roomJoin });
    const tokenOther = await issueToken({ identity: 'g2-other', teamId: 'g2-team-b', roomId: roomOther });
    const tokenClose = await issueToken({ identity: 'g2-close', teamId: 'g2-team-c', roomId: roomClose });
    for (const issued of [tokenA, tokenB, tokenOther, tokenClose]) {
      rawTokens.push(issued.token);
      tokenIds.push(issued.token_id);
    }

    const exportPackage = run(process.execPath, [
      path.join(DNA_ROOT, 'mesh-admin.js'),
      'export-join-package',
      '--token-id',
      tokenA.token_id,
      '--out',
      packageDir,
      '--url',
      BASE_URL,
    ]);
    if (exportPackage.status !== 0) throw new Error(`join package export failed: ${exportPackage.stderr || exportPackage.stdout}`);

    const tarFile = path.join(evidenceDir, 'intermesh-join-package.tar.gz');
    const tar = run('tar', ['-czf', tarFile, '-C', path.dirname(packageDir), path.basename(packageDir)], { cwd: evidenceDir });
    if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);
    const tarHash = crypto.createHash('sha256').update(fs.readFileSync(tarFile)).digest('hex');
    fs.writeFileSync(path.join(evidenceDir, 'package-manifest.sha256'), `${tarHash}  ${tarFile}\n`);
    const tree = run('find', ['.', '-maxdepth', '3', '-type', 'f', '-print'], { cwd: packageDir });
    fs.writeFileSync(path.join(evidenceDir, 'package-tree.txt'), tree.stdout.replace(/^\.\//gm, 'PACKAGE/'));

    const externalA = path.join(tmpRoot, 'external-a');
    const externalB = path.join(tmpRoot, 'external-b');
    fs.cpSync(packageDir, externalA, { recursive: true });
    fs.cpSync(packageDir, externalB, { recursive: true });
    const installA = run('npm', ['install', '--omit=dev', '--silent'], { cwd: externalA, timeout: 120000 });
    const installB = run('npm', ['install', '--omit=dev', '--silent'], { cwd: externalB, timeout: 120000 });
    if (installA.status !== 0 || installB.status !== 0) throw new Error(`package npm install failed: A=${installA.stderr} B=${installB.stderr}`);

    const homeA = path.join(tmpRoot, 'home-a');
    const homeB = path.join(tmpRoot, 'home-b');
    const pathsA = writeHome(homeA, tokenA.token, roomJoin);
    const pathsB = writeHome(homeB, tokenB.token, roomJoin);

    receiver = childProcess.spawn(process.execPath, [path.join(externalB, 'mesh-receiver.js'), 'run', '--foreground', '--home', homeB], {
      cwd: externalB,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusA = run(process.execPath, [path.join(externalA, 'mesh.js'), 'status', '--home', homeA], { cwd: externalA });
    const textAB = `hello from g2 package ${timestamp}`;
    const sendAB = run(process.execPath, [path.join(externalA, 'mesh.js'), 'send', '--home', homeA, '--room', roomJoin, '--to', 'g2-package-b', '--text', textAB], { cwd: externalA });
    const sendABPayload = readJsonFromString(sendAB.stdout, {});
    const inboundSeen = sendABPayload.id ? waitForLedger(pathsB, sendABPayload.id) : false;

    const invalidRoom = await trySend(tokenA.token, 'bad room id', 'g2-package-b', 'invalid room should fail');
    const unauthorizedRoom = await trySend(tokenA.token, roomOther, 'g2-other', 'unauthorized room should fail');
    const crossRoom = await trySend(tokenA.token, roomOther, 'g2-other', 'cross-room should fail');
    const teamRevoke = await adminJson('POST', '/admin/teams/revoke', { team_id: 'g2-team-a' });
    const postRevoke = await tryConnect(tokenA.token);
    const otherTeamAfterRevoke = await tryConnect(tokenOther.token);
    const closeRoom = await adminJson('POST', '/admin/rooms/close', { room_id: roomClose });
    const sendAfterClose = await trySend(tokenClose.token, roomClose, 'nobody', 'closed room should fail');

    const transcript = `# G2 External Room Transcript

Evidence mode: local/container simulated external participant.
Worker health OK: ${healthProof.ok}
Package export exit: ${exportPackage.status}
Package npm install A exit: ${installA.status}
Package npm install B exit: ${installB.status}
A status exit: ${statusA.status}
A send to B exit: ${sendAB.status}
B inbound ledger has message: ${inboundSeen}
Invalid room code: ${invalidRoom.code}
Unauthorized room code: ${unauthorizedRoom.code}
Cross-room send code: ${crossRoom.code}
Post-revoke connect code: ${postRevoke.code}
Closed-room send code: ${sendAfterClose.code}

Raw tokens were written only under an OS temp runtime directory and removed after evidence capture.
`;
    fs.writeFileSync(path.join(evidenceDir, 'transcript.md'), transcript);

    const packageJson = readJson(path.join(packageDir, 'package.json'), {});
    const configExample = readJson(path.join(packageDir, 'config.example.json'), {});
    const joinPackageJson = readJson(path.join(packageDir, 'join-package.json'), {});
    const rawPackageText = fs.readdirSync(packageDir, { recursive: true })
      .filter((name) => fs.statSync(path.join(packageDir, name)).isFile())
      .map((name) => fs.readFileSync(path.join(packageDir, name), 'utf8'))
      .join('\n');

    const packageProof = {
      tar: path.basename(tarFile),
      manifest: fs.readFileSync(path.join(evidenceDir, 'package-manifest.sha256'), 'utf8').trim(),
      has_readme: fs.existsSync(path.join(packageDir, 'README-join.md')),
      has_package_json: Boolean(packageJson.name),
      has_bin_mesh: fs.existsSync(path.join(packageDir, 'bin/mesh.js')),
      has_config_example: Boolean(configExample.room_id),
      has_token_example: fs.existsSync(path.join(packageDir, '.intermesh-token.example')),
      has_event_slug: Boolean(configExample.event_slug),
      has_table_or_topic: Boolean(configExample.table_id || configExample.topic_id),
      has_room_id: Boolean(configExample.room_id),
      has_jot_url_field: Object.prototype.hasOwnProperty.call(configExample, 'jot_url'),
      has_participant_role: Boolean(configExample.participant_role),
      server_assigned_identity_note: rawPackageText.includes('auth_ok.identity'),
      raw_token_in_package: rawTokens.some((token) => rawPackageText.includes(token)),
      raw_token_omitted_from_join_json: !rawTokens.some((token) => JSON.stringify(joinPackageJson).includes(token)),
    };

    const roomScope = {
      status: (
        sendAB.status === 0
        && inboundSeen
        && invalidRoom.code === 'bad_room_id'
        && unauthorizedRoom.code === 'room_forbidden'
        && crossRoom.code === 'room_forbidden'
        && teamRevoke.ok
        && postRevoke.code === 'token_revoked'
        && otherTeamAfterRevoke.status === 'PASS'
        && closeRoom.ok
        && sendAfterClose.code === 'room_forbidden'
      ) ? 'PASS' : 'FAIL',
      same_room: { send_exit: sendAB.status, inbound_seen: inboundSeen },
      invalid_room: invalidRoom,
      unauthorized_room: unauthorizedRoom,
      cross_room: crossRoom,
      team_revoke: teamRevoke,
      other_team_after_revoke: otherTeamAfterRevoke,
      room_close: { close_room: closeRoom, send_after_close: sendAfterClose },
    };
    writeJson(path.join(evidenceDir, 'room-scope.json'), roomScope);

    const postRevocation = {
      status: (teamRevoke.ok && postRevoke.code === 'token_revoked' && otherTeamAfterRevoke.status === 'PASS') ? 'PASS' : 'FAIL',
      team_revoke: teamRevoke,
      post_revoke: postRevoke,
      other_team_after_revoke: otherTeamAfterRevoke,
    };
    writeJson(path.join(evidenceDir, 'post-revocation.json'), postRevocation);

    const cleanup = [];
    for (const token_id of tokenIds) {
      cleanup.push(await adminJson('POST', '/admin/tokens/revoke', { token_id }));
    }

    const overall = {
      status: (
        healthProof.ok
        && packageProof.has_readme
        && packageProof.has_package_json
        && packageProof.has_bin_mesh
        && packageProof.has_config_example
        && packageProof.has_token_example
        && packageProof.has_event_slug
        && packageProof.has_table_or_topic
        && packageProof.has_room_id
        && packageProof.has_jot_url_field
        && packageProof.has_participant_role
        && packageProof.server_assigned_identity_note
        && !packageProof.raw_token_in_package
        && packageProof.raw_token_omitted_from_join_json
        && statusA.status === 0
        && sendAB.status === 0
        && inboundSeen
        && roomScope.status === 'PASS'
        && postRevocation.status === 'PASS'
        && cleanup.every((entry) => entry.ok)
      ) ? 'PASS' : 'FAIL',
      health: healthProof,
      package: packageProof,
      transcript: { statusA: statusA.status, sendAB: sendAB.status, inbound_seen: inboundSeen },
      cleanup,
    };
    writeJson(path.join(evidenceDir, 'g2-overall.json'), overall);

    const secretScan = scanEvidence(evidenceDir, rawTokens);
    writeJson(path.join(evidenceDir, 'secret-scan.json'), secretScan);

    exitCode = overall.status === 'PASS' && secretScan.status === 'PASS' ? 0 : 1;
    console.log(JSON.stringify({ status: exitCode === 0 ? 'PASS' : 'FAIL', evidenceDir }, null, 2));
  } finally {
    if (receiver && receiver.pid) {
      try { process.kill(receiver.pid, 'SIGTERM'); } catch {}
    }
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
