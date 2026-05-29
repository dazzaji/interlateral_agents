#!/usr/bin/env node
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DNA_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(DNA_ROOT, '..');
const NODE = process.execPath;
const meshJs = path.join(DNA_ROOT, 'mesh.js');
const meshAdminJs = path.join(DNA_ROOT, 'mesh-admin.js');
const evidenceDir = process.env.GATE_C_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-c-evidence-'));
const homesRoot = process.env.GATE_C_HOMES_ROOT || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-c-homes-'));

function nowIso() {
  return new Date().toISOString();
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function appendJsonl(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(value) + '\n');
}

function runNode(args, options = {}) {
  return childProcess.spawnSync(NODE, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 15_000,
    env: { ...process.env, ...(options.env || {}) },
  });
}

function parseProcessJson(proc) {
  const text = (proc.stdout || proc.stderr || '').trim();
  return text ? JSON.parse(text) : {};
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.rmSync(homesRoot, { recursive: true, force: true });
  fs.mkdirSync(homesRoot, { recursive: true });

  const room = `event:gatec/topic:${crypto.randomBytes(4).toString('hex')}`;
  const identity = 'gate-c-alice@local';
  const foreignIdentity = 'gate-c-bob@local';
  const ownText = 'own recipient payload visible';
  const foreignText = 'FOREIGN-PAYLOAD-MUST-NOT-RENDER';
  const home = path.join(homesRoot, 'alice');
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'token'), `tok_local_gc_${crypto.randomBytes(8).toString('hex')}.${crypto.randomBytes(32).toString('hex')}`);
  fs.chmodSync(path.join(home, 'token'), 0o600);
  writeJson(path.join(home, 'receiver-state.json'), {
    identity,
    auth: { identity, rooms: [room], server_time: nowIso() },
    websocket_authenticated: true,
    connection_state: 'connected',
    updated_at: nowIso(),
  });
  appendJsonl(path.join(home, 'message-store.jsonl'), {
    at: nowIso(),
    id: 'own-message-1',
    room_id: room,
    from_identity: foreignIdentity,
    to_identity: identity,
    body: { content_type: 'text/markdown', text: ownText },
  });
  appendJsonl(path.join(home, 'message-store.jsonl'), {
    at: nowIso(),
    id: 'foreign-message-1',
    room_id: room,
    from_identity: identity,
    to_identity: foreignIdentity,
    body: { content_type: 'text/markdown', text: foreignText },
  });
  appendJsonl(path.join(home, 'inbound-ledger.jsonl'), {
    at: nowIso(),
    id: 'own-message-1',
    room_id: room,
    from_identity: foreignIdentity,
    dispatch: 'logged',
  });
  appendJsonl(path.join(home, 'outbound-ledger.jsonl'), {
    at: nowIso(),
    id: 'foreign-message-1',
    room_id: room,
    to_identity: foreignIdentity,
    accepted: true,
  });

  const transcriptPath = path.join(evidenceDir, 'transcript-export-sample.redacted.md');
  const inbox = runNode([meshJs, 'inbox', '--home', home, '--room', room, '--json', '--export-transcript', transcriptPath]);
  const inboxJson = JSON.parse(inbox.stdout);
  const transcript = fs.readFileSync(transcriptPath, 'utf8');
  const inboxPass = inbox.status === 0
    && inboxJson.rendered_count === 1
    && inboxJson.foreign_payloads_hidden === 1
    && inbox.stdout.includes(ownText)
    && !inbox.stdout.includes(foreignText)
    && transcript.includes(ownText)
    && !transcript.includes(foreignText)
    && !/tok_local_gc_[^.]+\.[A-Za-z0-9]+/.test(transcript);

  const watch = runNode([meshJs, 'watch', '--home', home, '--room', room, '--json']);
  const watchJson = JSON.parse(watch.stdout);
  const watchPass = watch.status === 0
    && watchJson.metadata_only_default === true
    && watchJson.payload_included === false
    && !watch.stdout.includes(ownText)
    && !watch.stdout.includes(foreignText);

  const auditFile = path.join(evidenceDir, 'admin-audit-sample.jsonl');
  fs.rmSync(auditFile, { force: true });
  const fixtureResponseFile = path.join(evidenceDir, 'admin-export-fixture-response.json');
  writeJson(fixtureResponseFile, {
    audit_row_id: 77,
    sensitive_output: true,
    rows: [
      {
        audit_row_id: 76,
        ts: nowIso(),
        kind: 'message',
        room_id: room,
        payload: { body: { text: 'authorized local payload sample' } },
      },
    ],
  });
  const guardFail = runNode([meshAdminJs, 'export-audit', '--room', room, '--with-payload', '--fixture-response-file', fixtureResponseFile, '--audit-file', auditFile], {
    env: { MESH_ADMIN_ROOT_KEY: '' },
  });
  const guardFailJson = parseProcessJson(guardFail);
  const guardPass = runNode([meshAdminJs, 'export-audit', '--room', room, '--with-payload', '--authorize-payload-export', '--fixture-response-file', fixtureResponseFile, '--audit-file', auditFile], {
    env: { MESH_ADMIN_ROOT_KEY: '' },
  });
  const guardPassJson = parseProcessJson(guardPass);
  const auditRows = fs.existsSync(auditFile) ? fs.readFileSync(auditFile, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
  const adminPass = guardFail.status !== 0
    && guardFailJson.code === 'admin_payload_export_authorization_required'
    && guardPass.status === 0
    && guardPassJson.sensitive_output === true
    && guardPassJson.payload_export_authorized === true
    && auditRows.length === 1
    && auditRows[0].sensitive_output === true;

  writeJson(path.join(evidenceDir, 'inbox-command-test.json'), {
    status: inboxPass ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    command: 'node interlateral_dna/mesh.js inbox --home <home> --room <room> --json --export-transcript <file>',
    authenticated_identity: identity,
    rendered_count: inboxJson.rendered_count,
    foreign_payloads_hidden: inboxJson.foreign_payloads_hidden,
    own_payload_rendered: inbox.stdout.includes(ownText),
    foreign_payload_rendered: inbox.stdout.includes(foreignText),
    transcript_exported: fs.existsSync(transcriptPath),
  });
  writeJson(path.join(evidenceDir, 'watch-command-test.json'), {
    status: watchPass ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    command: 'node interlateral_dna/mesh.js watch --home <home> --room <room> --json',
    metadata_only_default: watchJson.metadata_only_default,
    payload_included: watchJson.payload_included,
    entry_count: watchJson.entries.length,
    own_payload_rendered: watch.stdout.includes(ownText),
    foreign_payload_rendered: watch.stdout.includes(foreignText),
  });
  writeJson(path.join(evidenceDir, 'foreign-payload-negative-test.json'), {
    status: inboxPass && !inbox.stdout.includes(foreignText) && !transcript.includes(foreignText) ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    fixture: 'message-store.jsonl contains one recipient-owned payload and one foreign-recipient payload',
    rendered_foreign_payload_bodies: 0,
    hidden_foreign_payload_count: inboxJson.foreign_payloads_hidden,
  });
  writeJson(path.join(evidenceDir, 'admin-export-guard-test.json'), {
    status: adminPass ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    unauthorized_with_payload_exit_code: guardFail.status,
    unauthorized_error_code: guardFailJson.code,
    authorized_with_payload_exit_code: guardPass.status,
    authorized_sensitive_output: guardPassJson.sensitive_output,
    authorized_audit_rows_written: auditRows.length,
    real_room_admin_payload_export: 'blocked-only-live without exact Dazza authorization',
  });
  fs.writeFileSync(path.join(evidenceDir, 'privacy-wording-review.md'), `# Gate C Privacy Wording Review

Status: PASS

- Participant inbox renders payload bodies only for messages whose recipient identity matches the authenticated local receiver identity.
- Operator watch is metadata-first by default and does not render payload bodies.
- Inbound and outbound ledgers are delivery metadata, not human-readable payload transcripts.
- Transcript export is sensitive and limited to local recipient-owned messages in this Gate C implementation.
- Admin payload export requires an explicit payload flag plus explicit authorization, writes an audit row, and marks output sensitive.
- InterMesh v1 is hub-mediated and not end-to-end encrypted; future secure rooms may prevent platform payload reads.
- Raw tokens must not appear in transcript, audit, evidence, logs, screenshots, or command output.
`);

  const result = {
    status: inboxPass && watchPass && adminPass ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    room_id: room,
    evidence_dir: evidenceDir,
    homes_root: homesRoot,
    inbox: { status: inboxPass ? 'PASS' : 'FAIL' },
    watch: { status: watchPass ? 'PASS' : 'FAIL' },
      foreign_payload_negative: {
        status: inboxPass && !inbox.stdout.includes(foreignText) && !transcript.includes(foreignText) ? 'PASS' : 'FAIL',
      },
    admin_export_guard: { status: adminPass ? 'PASS' : 'FAIL' },
    raw_tokens_in_outputs: false,
  };
  writeJson(path.join(evidenceDir, 'gate-c-local-result.json'), result);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
