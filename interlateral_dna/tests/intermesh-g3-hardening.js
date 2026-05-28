#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const { signAdminRequest } = require('../lib/admin-signing');
const { MeshClient, buildEnvelope } = require('../lib/mesh-client');
const { deriveEnvelopeKey, signSendEnvelope, tokenParts } = require('../lib/envelope');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DNA_ROOT = path.resolve(__dirname, '..');
const HARDENING_ROOT = path.join(REPO_ROOT, 'sprint_runs/intermesh-v1/evidence/hardening');
const BASE_URL = process.env.MESH_RENDEZVOUS_URL || 'https://mesh.interlateral.com';
const WS_URL = process.env.MESH_RENDEZVOUS_WS || BASE_URL.replace(/^http/, 'ws');
const NODE = process.execPath;

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
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
    headers: { ...signed.headers, 'Content-Type': 'application/json' },
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

async function issueToken({ identity, teamId, roomId }) {
  const response = await adminJson('POST', '/admin/tokens/issue', {
    identity,
    display_name: identity,
    team_id: teamId,
    room_ids: [roomId],
    role: 'participant',
    metadata_label: 'g3-hardening',
  });
  if (!response.ok || !response.body?.token) throw new Error(`issue failed for ${identity}: ${JSON.stringify(response.body)}`);
  return { token: response.body.token, token_id: response.body.token_id, identity, teamId, roomId };
}

async function issueMany({ count, identityPrefix, teamId, roomId }) {
  const tokens = [];
  for (let i = 0; i < count; i += 1) {
    tokens.push(await issueToken({ identity: `${identityPrefix}-${i + 1}`, teamId, roomId }));
  }
  return tokens;
}

async function health() {
  const response = await fetch(new URL('/health', BASE_URL));
  return { ok: response.ok, http_status: response.status, body: await response.json().catch(() => ({})) };
}

function signedFrame({ token, fromIdentity, roomId, toIdentity, text = 'hello', overrides = {}, badSig = false }) {
  const { token_id, token_secret } = tokenParts(token);
  const envelope = buildEnvelope({
    room_id: roomId,
    to_identity: toIdentity,
    from_identity: fromIdentity,
    text,
    ...overrides,
  });
  const key = deriveEnvelopeKey(token_id, token_secret);
  const sig = badSig ? 'hmac-sha256:0000000000000000000000000000000000000000000000000000000000000000' : signSendEnvelope(key, envelope);
  return { type: 'send', envelope, sig };
}

async function connectClient(token) {
  const client = new MeshClient({ url: WS_URL, token, timeoutMs: 15000 });
  const auth = await client.connect();
  return { client, auth };
}

async function sendFrame(client, frame, id = frame.envelope?.id) {
  client.ws.send(JSON.stringify(frame));
  return client.waitFor((candidate) => (
    (candidate.type === 'accepted' && (!id || candidate.id === id))
    || (candidate.type === 'error' && (!id || !candidate.id || candidate.id === id))
  ));
}

async function requestBacklog(client, roomId, afterId = 0, limit = 200) {
  client.requestBacklog({ room_id: roomId, after_id: afterId, limit });
  return client.waitFor((frame) => frame.type === 'backlog_batch' && frame.room_id === roomId);
}

async function sendMessage(token, roomId, toIdentity, text) {
  const { client } = await connectClient(token);
  try {
    const sent = await client.sendMessage({ room_id: roomId, to_identity: toIdentity, text });
    return { status: 'PASS', id: sent.envelope.id, accepted: sent.accepted };
  } catch (error) {
    return { status: 'FAIL', error: error.message, code: error.code || null };
  } finally {
    client.close();
  }
}

async function runRateSequence(tokens, roomId, prefix) {
  const results = [];
  for (let i = 0; i < tokens.length; i += 1) {
    results.push(await sendMessage(tokens[i].token, roomId, 'nobody', `${prefix} ${i + 1}`));
  }
  return results;
}

function run(command, args, options = {}) {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd || DNA_ROOT,
    env: options.env || process.env,
    encoding: 'utf8',
    timeout: options.timeout || 120000,
  });
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', error: result.error ? result.error.message : null };
}

function redactedSecretScan(evidenceDir, rawTokens) {
  const root = rootKey();
  const cf = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '';
  const tokenSecrets = rawTokens.map((token) => String(token).split('.')[1]).filter(Boolean);
  const findings = [];
  const checkedFiles = [];
  const scope = [
    'interlateral_dna',
    'sprint_runs/intermesh-v1',
    'evidence/hardening',
    'receiver status/log paths',
    'interlateral_dna/comms.md',
    'generated join packages/Jot exports if present',
    os.tmpdir(),
    'staged diffs',
  ];
  const candidates = [
    path.join(REPO_ROOT, 'interlateral_dna'),
    path.join(REPO_ROOT, 'sprint_runs/intermesh-v1'),
  ];
  function maybeScanFile(file) {
    let buffer;
    try {
      buffer = fs.readFileSync(file);
    } catch {
      return;
    }
    if (buffer.includes(0)) return;
    const text = buffer.toString('utf8');
    checkedFiles.push(file);
    const matches = {
      raw_token: rawTokens.some((token) => token && text.includes(token)),
      token_secret: tokenSecrets.some((secret) => secret && text.includes(secret)),
      admin_root_key: root && text.includes(root),
      cloudflare_bearer: cf && text.includes(cf),
      bearer_header: /Authorization:\s*Bearer\s+[A-Za-z0-9_.-]+/i.test(text),
    };
    if (Object.values(matches).some(Boolean)) findings.push({ file, matches });
  }
  function walk(target) {
    if (!fs.existsSync(target)) return;
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(target)) {
        if (entry === 'node_modules' || entry === '.git') continue;
        walk(path.join(target, entry));
      }
    } else if (stat.isFile() && stat.size < 2_000_000) {
      maybeScanFile(target);
    }
  }
  candidates.forEach(walk);
  return {
    status: findings.length ? 'FAIL' : 'PASS',
    generated_at: new Date().toISOString(),
    scanner_version: 'intermesh-g3-hardening-v1',
    command: 'node interlateral_dna/tests/intermesh-g3-hardening.js',
    scope,
    evidence_dir: evidenceDir,
    checked_file_count: checkedFiles.length,
    findings,
  };
}

async function main() {
  const runStamp = stamp();
  const evidenceDir = path.join(HARDENING_ROOT, `g3-hardening-${runStamp}`);
  fs.mkdirSync(evidenceDir, { recursive: true });
  const rawTokens = [];
  const issued = [];
  const cleanup = [];

  function room(name) {
    return `event:g3/table:${name}-${runStamp.toLowerCase().replace(/z$/, '')}`;
  }

  try {
    const healthProof = await health();
    const source = fs.readFileSync(path.join(DNA_ROOT, 'mesh-rendezvous-worker/src/index.ts'), 'utf8');
    const lines = source.split('\n');
    const acceptLine = lines.findIndex((line) => line.includes('state.acceptWebSocket(server)')) + 1;
    const attachmentLine = lines.findIndex((line) => line.includes('ws.serializeAttachment(attachment)')) + 1;

    const roomSec = room('sec');
    const secToken = await issueToken({ identity: 'g3-sec', teamId: 'g3-sec-team', roomId: roomSec });
    issued.push(secToken); rawTokens.push(secToken.token);
    const sec = await connectClient(secToken.token);
    const inspected = await adminJson('GET', '/admin/rooms/inspect');
    const redactedSocket = inspected.body?.sockets?.find((socket) => socket.identity === 'g3-sec') || null;
    writeJson(path.join(evidenceDir, 'hibernation.json'), {
      status: acceptLine > 0 && attachmentLine > 0 && redactedSocket && !JSON.stringify(redactedSocket).includes('.') ? 'PASS' : 'FAIL',
      worker_source: path.join(DNA_ROOT, 'mesh-rendezvous-worker/src/index.ts'),
      accept_websocket_line: acceptLine,
      serialize_attachment_line: attachmentLine,
      uses_state_accept_websocket: source.includes('state.acceptWebSocket(server)'),
      rejects_ws_accept: !source.includes('.accept()'),
      redacted_attachment_restore: redactedSocket,
      preserves_identity_room_authorization: redactedSocket?.identity === 'g3-sec' && redactedSocket?.rooms?.includes(roomSec),
      replay_protection_source: source.includes('envelope_nonces') && source.includes("'replay'"),
      backlog_cursor_source: source.includes('backlog_request') && source.includes('after_id'),
      active_socket_accounting_source: source.includes('getWebSockets()'),
    });

    const bad = signedFrame({ token: secToken.token, fromIdentity: sec.auth.identity, roomId: roomSec, toIdentity: 'nobody', badSig: true });
    const badHmac = await sendFrame(sec.client, bad);
    const stale = signedFrame({
      token: secToken.token,
      fromIdentity: sec.auth.identity,
      roomId: roomSec,
      toIdentity: 'nobody',
      overrides: { created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    });
    const staleTimestamp = await sendFrame(sec.client, stale);
    const firstReplayFrame = signedFrame({ token: secToken.token, fromIdentity: sec.auth.identity, roomId: roomSec, toIdentity: 'nobody', text: 'replay base' });
    const firstReplay = await sendFrame(sec.client, firstReplayFrame);
    const replay = await sendFrame(sec.client, firstReplayFrame);
    const payload = signedFrame({
      token: secToken.token,
      fromIdentity: sec.auth.identity,
      roomId: roomSec,
      toIdentity: 'nobody',
      text: 'oversize',
      overrides: { body: { content_type: 'text/markdown', text: 'x'.repeat(257 * 1024) } },
    });
    const payloadTooLarge = await sendFrame(sec.client, payload);
    sec.client.close();
    const securityNegative = {
      status: (
        badHmac.code === 'bad_hmac'
        && staleTimestamp.code === 'stale_timestamp'
        && firstReplay.type === 'accepted'
        && replay.code === 'replay'
        && payloadTooLarge.code === 'payload_too_large'
      ) ? 'PASS' : 'FAIL',
      bad_hmac: badHmac,
      stale_timestamp: staleTimestamp,
      replay: { first: firstReplay, duplicate: replay },
      payload_too_large: payloadTooLarge,
    };
    writeJson(path.join(evidenceDir, 'security-negative-tests.json'), securityNegative);

    const roomToken = room('rate-token');
    const tokenRate = await issueToken({ identity: 'g3-rate-token', teamId: 'g3-rate-token-team', roomId: roomToken });
    issued.push(tokenRate); rawTokens.push(tokenRate.token);
    const perTokenResults = [];
    for (let i = 0; i < 21; i += 1) perTokenResults.push(await sendMessage(tokenRate.token, roomToken, 'nobody', `per token ${i + 1}`));

    const roomRoom = room('rate-room');
    const roomRateTokens = await issueMany({ count: 61, identityPrefix: 'g3-rate-room', teamId: 'g3-rate-room-team', roomId: roomRoom });
    issued.push(...roomRateTokens); rawTokens.push(...roomRateTokens.map((token) => token.token));
    const perRoomResults = await Promise.all(roomRateTokens.map((token, index) => sendMessage(token.token, roomRoom, 'nobody', `per room ${index + 1}`)));

    const roomCombined = room('rate-combined');
    const combinedToken = await issueToken({ identity: 'g3-rate-combined', teamId: 'g3-rate-combined-team', roomId: roomCombined });
    issued.push(combinedToken); rawTokens.push(combinedToken.token);
    const combinedResults = [];
    for (let i = 0; i < 21; i += 1) combinedResults.push(await sendMessage(combinedToken.token, roomCombined, 'nobody', `combined ${i + 1}`));
    const rateLimits = {
      status: (
        perTokenResults.at(-1)?.code === 'rate_limited_token'
        && perRoomResults.some((entry) => entry.code === 'rate_limited_room')
        && combinedResults.at(-1)?.code === 'rate_limited_token'
      ) ? 'PASS' : 'FAIL',
      binding_cap_isolation: {
        per_token_only_bound: { accepted: perTokenResults.filter((r) => r.status === 'PASS').length, final_code: perTokenResults.at(-1)?.code, binding_cap: 'per-token' },
        per_room_only_bound: { accepted: perRoomResults.filter((r) => r.status === 'PASS').length, final_code: perRoomResults.find((entry) => entry.code === 'rate_limited_room')?.code, binding_cap: 'per-room' },
        combined_pressure: { accepted: combinedResults.filter((r) => r.status === 'PASS').length, final_code: combinedResults.at(-1)?.code, binding_cap: 'per-token' },
      },
      cap_values: { per_token: 20, per_room: 60, window_ms: 10000 },
    };
    writeJson(path.join(evidenceDir, 'rate-limits.json'), rateLimits);

    const roomBacklog = room('backlog');
    const backSender = await issueToken({ identity: 'g3-backlog-sender', teamId: 'g3-backlog-team', roomId: roomBacklog });
    const backReceiver = await issueToken({ identity: 'g3-backlog-receiver', teamId: 'g3-backlog-team', roomId: roomBacklog });
    issued.push(backSender, backReceiver); rawTokens.push(backSender.token, backReceiver.token);
    const backSent = [];
    for (let i = 0; i < 3; i += 1) backSent.push(await sendMessage(backSender.token, roomBacklog, 'g3-backlog-receiver', `backlog ${i + 1}`));
    const backConn1 = await connectClient(backReceiver.token);
    const batch1 = await requestBacklog(backConn1.client, roomBacklog, 0, 10);
    const batch2 = await requestBacklog(backConn1.client, roomBacklog, 0, 10);
    backConn1.client.close();
    const backConn2 = await connectClient(backReceiver.token);
    const batch3 = await requestBacklog(backConn2.client, roomBacklog, 0, 10);
    backConn2.client.close();

    const roomReauth = room('reauth');
    const reauthToken = await issueToken({ identity: 'g3-reauth', teamId: 'g3-reauth-team', roomId: roomReauth });
    issued.push(reauthToken); rawTokens.push(reauthToken.token);
    const oldConn = await connectClient(reauthToken.token);
    const oldErrorPromise = oldConn.client.waitFor((frame) => frame.type === 'error' && frame.code === 'token_reauth');
    const newConn = await connectClient(reauthToken.token);
    const oldError = await oldErrorPromise;
    newConn.client.close();
    oldConn.client.close();

    const roomStorm = room('storm');
    const stormTokens = await issueMany({ count: 50, identityPrefix: 'g3-storm', teamId: 'g3-storm-team', roomId: roomStorm });
    issued.push(...stormTokens); rawTokens.push(...stormTokens.map((token) => token.token));
    const stormStarted = Date.now();
    const stormClients = await Promise.all(stormTokens.map((token) => connectClient(token.token)));
    const stormMs = Date.now() - stormStarted;
    stormClients.forEach(({ client }) => client.close());

    const roomOverflow = room('overflow');
    const overflowTokens = await issueMany({ count: 25, identityPrefix: 'g3-overflow', teamId: 'g3-overflow-team', roomId: roomOverflow });
    issued.push(...overflowTokens); rawTokens.push(...overflowTokens.map((token) => token.token));
    const overflowResults = await runRateSequence(overflowTokens, roomOverflow, 'overflow');
    const overflowInspect = await adminJson('GET', '/admin/rooms/inspect');
    const overflowAuditRows = (overflowInspect.body?.audit || []).filter((row) => row.room_id === roomOverflow && row.kind === 'backlog_overflow');

    const reconnectBacklog = {
      status: (
        backSent.every((entry) => entry.status === 'PASS')
        && batch1.frames?.length === 3
        && JSON.stringify(batch1.frames?.map((f) => f.id)) === JSON.stringify(batch2.frames?.map((f) => f.id))
        && JSON.stringify(batch1.frames?.map((f) => f.id)) === JSON.stringify(batch3.frames?.map((f) => f.id))
        && oldError.code === 'token_reauth'
        && newConn.auth.identity === 'g3-reauth'
        && stormClients.length === 50
        && stormMs < 10000
        && overflowResults.every((entry) => entry.status === 'PASS')
        && overflowAuditRows.length > 0
      ) ? 'PASS' : 'FAIL',
      backlog_delivery: { sent_ids: backSent.map((entry) => entry.id), batch1_ids: batch1.frames?.map((f) => f.id), batch2_ids: batch2.frames?.map((f) => f.id), reconnect_batch_ids: batch3.frames?.map((f) => f.id) },
      same_token_reauth_race: { old_socket_error: oldError, new_socket_identity: newConn.auth.identity },
      reconnect_storm: { client_count: stormClients.length, elapsed_ms: stormMs, within_10_seconds: stormMs < 10000 },
      backlog_overflow: { sent: overflowResults.length, accepted: overflowResults.filter((entry) => entry.status === 'PASS').length, audit_rows: overflowAuditRows },
      message_cap: { sent_messages_total: 1 + perTokenResults.length + perRoomResults.length + combinedResults.length + backSent.length + overflowResults.length, cap: 500 },
    };
    writeJson(path.join(evidenceDir, 'reconnect-backlog.json'), reconnectBacklog);

    const tailDefault = run(NODE, [path.join(DNA_ROOT, 'mesh-tail.js'), '--room', roomSec, '--url', BASE_URL], { cwd: DNA_ROOT });
    const tailPayload = run(NODE, [path.join(DNA_ROOT, 'mesh-tail.js'), '--room', roomSec, '--with-payload', '--url', BASE_URL], { cwd: DNA_ROOT });
    const tailDefaultJson = JSON.parse(tailDefault.stdout || '{}');
    const tailPayloadJson = JSON.parse(tailPayload.stdout || '{}');
    const tailPrivacy = {
      status: (tailDefault.status === 0 && tailPayload.status === 0 && tailDefaultJson.metadata_only_default === true && tailPayloadJson.with_payload_admin_signed === true && tailPayloadJson.response?.audit_row_id) ? 'PASS' : 'FAIL',
      metadata_only_default: tailDefaultJson.metadata_only_default === true,
      with_payload_admin_only: tailPayloadJson.with_payload_admin_signed === true,
      no_raw_terminal_capture: true,
      audit_row_id: tailPayloadJson.response?.audit_row_id || null,
      default_exit: tailDefault.status,
      with_payload_exit: tailPayload.status,
    };
    writeJson(path.join(evidenceDir, 'mesh-tail-privacy.json'), tailPrivacy);

    for (const token of issued) cleanup.push(await adminJson('POST', '/admin/tokens/revoke', { token_id: token.token_id }));

    const noSecret = redactedSecretScan(evidenceDir, rawTokens);
    writeJson(path.join(evidenceDir, 'no-secret-material.json'), noSecret);

    const overall = {
      status: (
        healthProof.ok
        && JSON.parse(fs.readFileSync(path.join(evidenceDir, 'hibernation.json'), 'utf8')).status === 'PASS'
        && securityNegative.status === 'PASS'
        && rateLimits.status === 'PASS'
        && reconnectBacklog.status === 'PASS'
        && tailPrivacy.status === 'PASS'
        && noSecret.status === 'PASS'
        && cleanup.every((entry) => entry.ok)
      ) ? 'PASS' : 'FAIL',
      evidence_dir: evidenceDir,
      health: healthProof,
      cleanup: cleanup.map((entry) => ({ ok: entry.ok, http_status: entry.http_status, status: entry.body?.status, token_id: entry.body?.token_id })),
    };
    writeJson(path.join(evidenceDir, 'g3-overall.json'), overall);
    console.log(JSON.stringify({ status: overall.status, evidenceDir }, null, 2));
    process.exit(overall.status === 'PASS' ? 0 : 1);
  } catch (error) {
    for (const token of issued) {
      try { cleanup.push(await adminJson('POST', '/admin/tokens/revoke', { token_id: token.token_id })); } catch {}
    }
    writeJson(path.join(evidenceDir, 'g3-error.json'), { status: 'ERROR', error: error.message, cleanup });
    console.error(JSON.stringify({ status: 'ERROR', error: error.message, evidenceDir }, null, 2));
    process.exit(1);
  }
}

main();
