#!/usr/bin/env node
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const commands = [
  ['lib/envelope.js', ['self-test']],
  ['lib/admin-signing.js', ['self-test']],
  ['mesh.js', ['self-test']],
  ['mesh-admin.js', ['self-test']],
  ['mesh-receiver.js', ['self-test']],
  ['mesh-tail.js', ['self-test']],
  ['mesh-rendezvous-worker/scripts/local-smoke.js', []],
];

const results = [];
for (const [file, args] of commands) {
  const fullPath = path.join(root, file);
  const proc = childProcess.spawnSync(node, [fullPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: '',
      CF_API_TOKEN: '',
      MESH_ADMIN_ROOT_KEY: '',
    },
  });
  results.push({ file, status: proc.status, stdout: proc.stdout.trim(), stderr: proc.stderr.trim() });
}

const failed = results.filter((result) => result.status !== 0);
const localSmoke = fs.readFileSync(path.join(root, 'mesh-rendezvous-worker/scripts/local-smoke.js'), 'utf8');
const forbiddenStaticAcceptanceWrites = [
  'local-health.json',
  'tokenless-auth.json',
  'wrangler-local-config.txt',
].filter((name) => localSmoke.includes(name));
const status = failed.length || forbiddenStaticAcceptanceWrites.length ? 'FAIL' : 'PASS';
console.log(JSON.stringify({
  status,
  results,
  local_smoke_no_acceptance_side_effects: forbiddenStaticAcceptanceWrites.length === 0,
  forbidden_static_acceptance_writes: forbiddenStaticAcceptanceWrites,
}, null, 2));
process.exit(status === 'PASS' ? 0 : 1);
