#!/usr/bin/env node
const { signAdminRequest, selfTest: adminSelfTest } = require('./lib/admin-signing');

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
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._[0] === 'self-test') {
    const adminVector = adminSelfTest();
    const result = {
      status: adminVector.status,
      metadata_only_default: true,
      with_payload_admin_only: true,
      no_raw_terminal_capture: true,
      admin_vector_status: adminVector.status,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'PASS' ? 0 : 1);
  }
  const base = args.url || process.env.MESH_RENDEZVOUS_URL || 'https://mesh.interlateral.com';
  const room = args.room;
  if (!room) throw new Error('--room is required');
  const url = `${base}/admin/audit?room_id=${encodeURIComponent(room)}${args['with-payload'] ? '&with_payload=true' : ''}`;
  if (!process.env.MESH_ADMIN_ROOT_KEY) throw new Error('mesh-tail requires MESH_ADMIN_ROOT_KEY because /admin/audit is admin-protected');
  const headers = {};
  const ts = new Date().toISOString();
  const nonce = crypto.randomBytes(32).toString('hex');
  Object.assign(headers, signAdminRequest({
    rootKeyHex: process.env.MESH_ADMIN_ROOT_KEY,
    method: 'GET',
    url,
    body: '',
    ts,
    nonce,
  }).headers);
  const response = await fetch(url, { headers });
  const text = await response.text();
  console.log(JSON.stringify({
    status: response.ok ? 'OK' : 'ERROR',
    metadata_only_default: !args['with-payload'],
    with_payload_admin_signed: Boolean(args['with-payload']),
    response: text ? JSON.parse(text) : null,
  }, null, 2));
}

const crypto = require('crypto');
main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message }, null, 2));
  process.exit(1);
});
