#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MeshClient, buildEnvelope } = require('./lib/mesh-client');
const { defaultPaths } = require('./lib/paths');
const { deriveEnvelopeKey, signSendEnvelope, tokenParts } = require('./lib/envelope');
const { activeReceiverForTokenFile } = require('./lib/receiver-registry');

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

function usage() {
  console.log(`Usage:
  node interlateral_dna/mesh.js self-test
  node interlateral_dna/mesh.js status [--home DIR]
  node interlateral_dna/mesh.js inbox [--home DIR] [--room ROOM] [--json] [--export-transcript FILE]
  node interlateral_dna/mesh.js watch [--home DIR] [--room ROOM] [--json] [--limit N]
  node interlateral_dna/mesh.js send --to ID --room ROOM --text TEXT [--url WSS] [--token-file FILE]
  node interlateral_dna/mesh.js sign-demo --token TOKEN --from ID --to ID --room ROOM --text TEXT

Token/session policy:
  v1 does not support using the same token for a persistent receiver and one-off
  sends at the same time, including explicit --token-file or copied-token homes
  on the same local machine. Use separate receiver and sender tokens/homes for
  sustained collaboration. Concurrent sends from the same token/home are also
  unsupported and return same_token_concurrent_unsupported.
`);
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text) return [];
  return text.split('\n').flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

function pidAlive(pid) {
  if (!pid || !Number.isInteger(Number(pid))) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function guardReceiverTokenReuse(paths, args) {
  const tokenFile = args['token-file'] || paths.token;
  if (fs.existsSync(tokenFile)) {
    const receiver = activeReceiverForTokenFile(tokenFile);
    if (receiver) {
      throw makeError(
        'same_token_receiver_send_unsupported',
        `A receiver is already running with this token from home ${receiver.home || 'unknown'}. v1 does not support one-off sends from the same token as a persistent receiver; use a separate sender token/home.`,
      );
    }
  }
  if (tokenFile !== paths.token) return;
  const lock = readJson(paths.lock, null);
  if (lock?.pid && pidAlive(lock.pid)) {
    throw makeError(
      'same_token_receiver_send_unsupported',
      'A receiver is already running for this home. v1 does not support one-off sends from the same token/home as a persistent receiver; use a separate sender token/home.',
    );
  }
}

function acquireSendLock(paths) {
  fs.mkdirSync(paths.home, { recursive: true });
  try {
    const fd = fs.openSync(paths.sendLock, 'wx');
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err.code === 'EEXIST') {
      const lock = readJson(paths.sendLock, null);
      if (lock?.pid && !pidAlive(lock.pid)) {
        fs.rmSync(paths.sendLock, { force: true });
        return acquireSendLock(paths);
      }
      throw makeError(
        'same_token_concurrent_unsupported',
        'Concurrent sends from the same token/home are unsupported in v1. Wait for the active send to finish or use a separate sender token/home.',
      );
    }
    throw err;
  }
}

function releaseSendLock(paths) {
  const lock = readJson(paths.sendLock, null);
  if (!lock?.pid || Number(lock.pid) === process.pid) fs.rmSync(paths.sendLock, { force: true });
}

function bodyText(row) {
  if (typeof row.body?.text === 'string') return row.body.text;
  if (row.body === null || row.body === undefined) return '';
  return JSON.stringify(row.body);
}

function localAuthenticatedIdentity(paths) {
  if (!fs.existsSync(paths.token)) {
    throw makeError('local_token_required', 'A local participant token file is required before rendering participant-owned payloads.');
  }
  const state = readJson(paths.state, {});
  const identity = state.identity || state.auth?.identity || null;
  if (!identity) {
    throw makeError('local_identity_unavailable', 'No authenticated local receiver identity was found; run the receiver or import authenticated receiver state before using inbox.');
  }
  return identity;
}

function filteredMessages(paths, args) {
  const identity = localAuthenticatedIdentity(paths);
  const allMessages = readJsonl(paths.messageStore);
  const room = args.room || null;
  const own = allMessages.filter((row) => row.to_identity === identity && (!room || row.room_id === room));
  return {
    identity,
    room,
    allMessages,
    own,
    hiddenForeignCount: allMessages.filter((row) => row.to_identity !== identity && (!room || row.room_id === room)).length,
  };
}

function writeTranscript(file, identity, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = [
    '# InterMesh Transcript',
    '',
    `Recipient identity: ${identity}`,
    'Payload scope: local recipient-owned messages only.',
    'Sensitive: contains message payload bodies; no raw tokens are included.',
    '',
  ];
  for (const row of rows) {
    lines.push(`- ${row.at || row.created_at || ''} ${row.from_identity} -> ${row.to_identity} (${row.room_id})`);
    lines.push('');
    lines.push('```text');
    lines.push(bodyText(row));
    lines.push('```');
    lines.push('');
  }
  fs.writeFileSync(file, lines.join('\n'));
}

function inbox(paths, args) {
  const { identity, room, allMessages, own, hiddenForeignCount } = filteredMessages(paths, args);
  const limit = Number(args.limit || own.length || 50);
  const rows = own.slice(-limit);
  if (args['export-transcript']) writeTranscript(args['export-transcript'], identity, rows);
  const payload = {
    status: 'OK',
    command: 'inbox',
    identity,
    room,
    payload_scope: 'local-recipient-owned',
    payload_included: true,
    total_local_messages: allMessages.length,
    rendered_count: rows.length,
    foreign_payloads_hidden: hiddenForeignCount,
    transcript_exported_to: args['export-transcript'] || null,
    messages: rows.map((row) => ({
      at: row.at || null,
      id: row.id,
      room_id: row.room_id,
      from_identity: row.from_identity,
      to_identity: row.to_identity,
      body: row.body || null,
    })),
  };
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  for (const row of rows) console.log(`${row.at || ''} ${row.from_identity} -> ${row.to_identity}: ${bodyText(row)}`);
}

function watch(paths, args) {
  const room = args.room || null;
  const limit = Number(args.limit || 50);
  const inbound = readJsonl(paths.inboundLedger).map((row) => ({ ...row, direction: 'inbound' }));
  const outbound = readJsonl(paths.outboundLedger).map((row) => ({ ...row, direction: 'outbound' }));
  const messages = readJsonl(paths.messageStore).map((row) => ({
    at: row.at || null,
    id: row.id,
    room_id: row.room_id,
    from_identity: row.from_identity,
    to_identity: row.to_identity,
    direction: 'message-store',
  }));
  const rows = [...inbound, ...outbound, ...messages]
    .filter((row) => !room || row.room_id === room)
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
    .slice(-limit);
  const payload = {
    status: 'OK',
    command: 'watch',
    room,
    metadata_only_default: true,
    payload_included: false,
    entries: rows.map((row) => ({
      at: row.at || null,
      id: row.id || null,
      room_id: row.room_id || null,
      direction: row.direction,
      from_identity: row.from_identity || null,
      to_identity: row.to_identity || null,
      accepted: row.accepted ?? null,
      dispatch: row.dispatch || null,
    })),
  };
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  for (const row of payload.entries) console.log(`${row.at || ''} ${row.direction} ${row.room_id || ''} ${row.from_identity || ''} -> ${row.to_identity || ''} ${row.id || ''}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  const paths = defaultPaths(args.home);
  if (cmd === 'self-test') {
    const result = selfTest();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'PASS' ? 0 : 1);
  }
  if (cmd === 'status') {
    const config = fs.existsSync(paths.config) ? JSON.parse(fs.readFileSync(paths.config, 'utf8')) : {};
    console.log(JSON.stringify({
      status: 'ok',
      home: paths.home,
      token_file_exists: fs.existsSync(paths.token),
      config,
    }, null, 2));
    return;
  }
  if (cmd === 'inbox') {
    inbox(paths, args);
    return;
  }
  if (cmd === 'watch') {
    watch(paths, args);
    return;
  }
  if (cmd === 'sign-demo') {
    const token = args.token || 'tok_test_01HZY7K8V4S3Q2P1N0M9L8K7J6.test-only-secret-not-live-000000000000000000000000000001';
    const { token_id, token_secret } = tokenParts(token);
    const envelope = buildEnvelope({
      room_id: args.room || 'event:demo/topic:t1',
      from_identity: args.from || 'codex@team-alpha',
      to_identity: args.to || 'claude@team-alpha',
      text: args.text || 'hello',
      id: args.id || '01J00000000000000000000001',
      nonce: args.nonce || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      created_at: args.created_at || '2026-05-27T00:00:00.000Z',
    });
    console.log(JSON.stringify({
      status: 'ok',
      token_id,
      envelope,
      sig: signSendEnvelope(deriveEnvelopeKey(token_id, token_secret), envelope),
    }, null, 2));
    return;
  }
  if (cmd === 'send') {
    guardReceiverTokenReuse(paths, args);
    acquireSendLock(paths);
    const client = new MeshClient({
      url: args.url || process.env.MESH_RENDEZVOUS_WS || 'wss://mesh.interlateral.com',
      tokenFile: args['token-file'] || paths.token,
    });
    try {
      const result = await client.sendMessage({
        room_id: args.room,
        to_identity: args.to,
        text: args.text || args._.slice(1).join(' '),
      });
      fs.mkdirSync(paths.home, { recursive: true });
      fs.appendFileSync(paths.outboundLedger, JSON.stringify({
        at: new Date().toISOString(),
        id: result.envelope.id,
        room_id: result.envelope.room_id,
        to_identity: result.envelope.to_identity,
        accepted: result.accepted,
      }) + '\n');
      console.log(JSON.stringify({ status: 'accepted', id: result.envelope.id, accepted: result.accepted }, null, 2));
    } finally {
      client.close();
      releaseSendLock(paths);
    }
    process.exit(0);
  }
  usage();
  process.exit(cmd ? 1 : 0);
}

function selfTest() {
  const token = 'tok_test_01HZY7K8V4S3Q2P1N0M9L8K7J6.test-only-secret-not-live-000000000000000000000000000001';
  const { token_id, token_secret } = tokenParts(token);
  const envelope = buildEnvelope({
    room_id: 'event:demo/topic:t1',
    from_identity: 'codex@team-alpha',
    to_identity: 'claude@team-alpha',
    text: 'hello',
    id: '01J00000000000000000000001',
    nonce: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    created_at: '2026-05-27T00:00:00.000Z',
  });
  const sig = signSendEnvelope(deriveEnvelopeKey(token_id, token_secret), envelope);
  const expected = 'hmac-sha256:ababdef4420a0669c6c577c694cea092222759d6f5c17c7cfed97073272a3254';
  return {
    status: sig === expected ? 'PASS' : 'FAIL',
    default_url: 'wss://mesh.interlateral.com',
    server_assigned_from_identity: true,
    envelope,
    sig,
    expected,
  };
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message, code: err.code }, null, 2));
  process.exit(1);
});
