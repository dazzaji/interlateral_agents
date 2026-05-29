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
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(path.dirname(auditFile), { recursive: true });
  fs.appendFileSync(auditFile, JSON.stringify(row) + '\n');
  return auditFile;
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
  requirePayloadExportAuthorization(args);
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
  let result = {
    status: response.ok ? 'OK' : 'ERROR',
    metadata_only_default: !args['with-payload'],
    with_payload_admin_signed: Boolean(args['with-payload']),
    response: text ? JSON.parse(text) : null,
  };
  if (args['with-payload'] && response.ok) {
    const auditRow = {
      at: new Date().toISOString(),
      kind: 'admin_payload_export',
      room_id: room,
      sensitive_output: true,
      authorization: args['authorize-payload-export'] ? 'explicit-cli-flag' : 'environment',
    };
    result = {
      ...result,
      sensitive_output: true,
      payload_export_authorized: true,
      local_audit_file: appendAdminAudit(args, auditRow),
      local_audit_row: auditRow,
    };
  }
  console.log(JSON.stringify(result, null, 2));
}

const crypto = require('crypto');
main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message, code: err.code }, null, 2));
  process.exit(1);
});
