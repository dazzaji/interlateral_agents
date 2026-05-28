#!/usr/bin/env node
const fs = require('fs');
const { MeshClient, buildEnvelope } = require('./lib/mesh-client');
const { defaultPaths } = require('./lib/paths');
const { deriveEnvelopeKey, signSendEnvelope, tokenParts } = require('./lib/envelope');

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
  node interlateral_dna/mesh.js send --to ID --room ROOM --text TEXT [--url WSS] [--token-file FILE]
  node interlateral_dna/mesh.js sign-demo --token TOKEN --from ID --to ID --room ROOM --text TEXT
`);
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
    const client = new MeshClient({
      url: args.url || process.env.MESH_RENDEZVOUS_WS || 'wss://mesh.interlateral.com',
      tokenFile: args['token-file'] || paths.token,
    });
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
    client.close();
    return;
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
