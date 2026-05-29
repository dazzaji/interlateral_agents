#!/usr/bin/env node
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DNA_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(DNA_ROOT, '..');
const NODE = process.execPath;
const exporter = path.join(DNA_ROOT, 'tests', 'intermesh-evidence-exporter.js');
const evidenceDir = process.env.GATE_E_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-e-evidence-'));
const fixtureRoot = process.env.GATE_E_FIXTURE_ROOT || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-e-fixtures-'));
const privateBadFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-e-bad-fixture-'));

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function runNode(args) {
  return childProcess.spawnSync(NODE, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 15_000,
    env: { ...process.env },
  });
}

function hasRawTokenMaterial(value) {
  return /\btok_[A-Za-z0-9_-]+\.[0-9a-f]{32,}\b/.test(
    typeof value === 'string' ? value : JSON.stringify(value),
  );
}

function sampleInput({ jot = false } = {}) {
  const base = {
    mode: 'local-simulated',
    room_id: 'event:gatee/table:t1/topic:evidence',
    team_id: 'gate-e-team',
    token_ids: ['tok_local_gate_e_alice', 'tok_local_gate_e_bob'],
    participants: [
      { identity: 'gate-e-alice@local', display_name: 'Gate E Alice', last_seen: '2026-05-29T05:00:01.000Z' },
      { identity: 'gate-e-bob@local', display_name: 'Gate E Bob', last_seen: '2026-05-29T05:00:05.000Z' },
    ],
    messages: [
      {
        id: '01JGE000000000000000000001',
        from_identity: 'gate-e-alice@local',
        to_identity: 'gate-e-bob@local',
        created_at: '2026-05-29T05:00:02.000Z',
      },
      {
        id: '01JGE000000000000000000002',
        from_identity: 'gate-e-bob@local',
        to_identity: 'gate-e-alice@local',
        created_at: '2026-05-29T05:00:06.000Z',
      },
    ],
    receiver_status_before: {
      connection_state: 'unknown',
      process_alive: false,
      websocket_authenticated: false,
      inbound_count: 0,
    },
    receiver_status_after_live_send: {
      connection_state: 'connected',
      process_alive: true,
      websocket_authenticated: true,
      inbound_count: 1,
      last_received_message_at: '2026-05-29T05:00:02.000Z',
    },
    receiver_status_after_backlog_replay: {
      connection_state: 'connected',
      process_alive: true,
      websocket_authenticated: true,
      inbound_count: 2,
      last_backlog_pull_at: '2026-05-29T05:00:08.000Z',
      duplicate_messages_added: 0,
    },
    transcript_export_mode: 'metadata-only',
  };
  if (jot) {
    base.jot = {
      jot_url: 'https://jot.example.test/gate-e',
      heading_summary: ['Ready state', 'Evidence notes', 'Open human actions'],
    };
  }
  return base;
}

function writeOperatorReadiness(file) {
  fs.writeFileSync(file, `# Gate E Operator Readiness Draft

Status: PASS

This is a Gate E draft/input for Gate F. Gate F still finalizes \`human-assisted-external-test-plan.md\`.

Remaining human-assisted external testing burden:

- Generate a final invite from the reviewed generator.
- Send \`INVITE.safe.md\` and \`join.safe.json\` through a non-secret channel.
- Send \`TOKEN.private.txt\` through a separate private human-controlled channel.
- Watch receiver status before first send, after live send, and after backlog replay.
- Run the final external participant test and compare the non-secret evidence manifest.

Blocked pending exact Dazza authorization:

- Live token issue/use/revoke.
- Live smoke or real-room mutation.
- Public skill publication.
- Final commit, merge, push, PR creation, or release publication.
- Worker/Durable Object source edits or deploys unless exact Dazza authorization names that scope.
`);
}

async function main() {
  fs.rmSync(evidenceDir, { recursive: true, force: true });
  fs.mkdirSync(evidenceDir, { recursive: true, mode: 0o700 });
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
  fs.mkdirSync(fixtureRoot, { recursive: true, mode: 0o700 });

  const meshInputFile = path.join(fixtureRoot, 'mesh-only-input.json');
  const jotInputFile = path.join(fixtureRoot, 'jot-input.json');
  const badInputFile = path.join(privateBadFixtureRoot, 'bad-raw-token-input.json');
  const meshOut = path.join(evidenceDir, 'mesh-only-evidence-sample');
  const jotOut = path.join(evidenceDir, 'jot-evidence-sample');
  const badOut = path.join(evidenceDir, 'prewrite-should-not-exist');
  const rawToken = `tok_local_gate_e_bad.${crypto.randomBytes(32).toString('hex')}`;

  writeJson(meshInputFile, sampleInput());
  writeJson(jotInputFile, sampleInput({ jot: true }));
  writeJson(badInputFile, { ...sampleInput(), accidental_token: rawToken });

  const meshRun = runNode([exporter, '--input', meshInputFile, '--out', meshOut]);
  const jotRun = runNode([exporter, '--input', jotInputFile, '--out', jotOut]);
  const badRun = runNode([exporter, '--input', badInputFile, '--out', badOut]);

  const meshManifest = fs.existsSync(path.join(meshOut, 'manifest.json')) ? readJson(path.join(meshOut, 'manifest.json')) : {};
  const jotManifest = fs.existsSync(path.join(jotOut, 'manifest.json')) ? readJson(path.join(jotOut, 'manifest.json')) : {};
  const badWrote = fs.existsSync(badOut);
  const meshHasNoJot = !('jot' in meshManifest) && !JSON.stringify(meshManifest).includes('jot_url');
  const jotExpected = Boolean(jotManifest.jot?.jot_url)
    && Array.isArray(jotManifest.jot.heading_summary)
    && jotManifest.jot.heading_summary.length === 3;
  const receiverStatus = meshManifest.receiver_status || {};
  const receiverStatusComplete = Boolean(
    receiverStatus.before
    && receiverStatus.after_live_send
    && receiverStatus.after_backlog_replay
    && receiverStatus.after_live_send.inbound_count === 1
    && receiverStatus.after_backlog_replay.inbound_count === 2,
  );
  const capturesRequired = Boolean(
    meshManifest.room_id
    && meshManifest.team_id
    && Array.isArray(meshManifest.token_ids)
    && meshManifest.token_ids.every((tokenId) => !tokenId.includes('.'))
    && Array.isArray(meshManifest.participants)
    && meshManifest.participants.every((participant) => participant.identity && 'last_seen' in participant)
    && meshManifest.message_counts?.total === 2
    && meshManifest.message_ids?.length === 2
    && meshManifest.transcript_export?.mode === 'metadata-only'
  );

  writeJson(path.join(evidenceDir, 'evidence-exporter-test.json'), {
    status: meshRun.status === 0 && jotRun.status === 0 && capturesRequired ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    exporter: path.relative(REPO_ROOT, exporter),
    mesh_only_exit_code: meshRun.status,
    jot_exit_code: jotRun.status,
    captures_non_secret_room_id: Boolean(meshManifest.room_id),
    captures_non_secret_team_id: Boolean(meshManifest.team_id),
    captures_token_ids_only: Array.isArray(meshManifest.token_ids) && meshManifest.token_ids.every((tokenId) => !tokenId.includes('.')),
    captures_participant_identities_and_last_seen: meshManifest.participants?.every((participant) => participant.identity && 'last_seen' in participant) || false,
    captures_message_counts_and_ids: meshManifest.message_counts?.total === 2 && meshManifest.message_ids?.length === 2,
    captures_receiver_status: receiverStatusComplete,
    captures_transcript_export_mode: meshManifest.transcript_export?.mode === 'metadata-only',
  });
  writeJson(path.join(evidenceDir, 'exporter-prewrite-token-detection-test.json'), {
    status: badRun.status !== 0 && !badWrote ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    bad_exit_code: badRun.status,
    wrote_output_before_rejecting: badWrote,
    token_pattern_detected_before_write: badRun.stderr.includes('raw_token_material_detected') || badRun.stderr.includes('raw token material detected'),
  });
  writeJson(path.join(evidenceDir, 'receiver-status-before-after.json'), {
    status: receiverStatusComplete ? 'PASS' : 'FAIL',
    room_id: meshManifest.room_id,
    receiver_status: receiverStatus,
  });
  writeJson(path.join(evidenceDir, 'mesh-only-evidence-sample-check.json'), {
    status: meshRun.status === 0 && meshHasNoJot ? 'PASS' : 'FAIL',
    manifest: path.join(meshOut, 'manifest.json'),
    contains_jot_fields: !meshHasNoJot,
  });
  writeJson(path.join(evidenceDir, 'jot-evidence-sample-check.json'), {
    status: jotRun.status === 0 && jotExpected ? 'PASS' : 'FAIL',
    manifest: path.join(jotOut, 'manifest.json'),
    jot_url_present: Boolean(jotManifest.jot?.jot_url),
    heading_summary_count: jotManifest.jot?.heading_summary?.length || 0,
  });
  writeOperatorReadiness(path.join(evidenceDir, 'operator-readiness.md'));

  const readinessText = fs.readFileSync(path.join(evidenceDir, 'operator-readiness.md'), 'utf8');
  const readinessOk = [
    'Generate a final invite',
    'Send `INVITE.safe.md`',
    'Send `TOKEN.private.txt`',
    'Watch receiver status',
    'Run the final external participant test',
    'Blocked pending exact Dazza authorization',
  ].every((text) => readinessText.includes(text));
  const evidenceText = JSON.stringify({
    meshManifest,
    jotManifest,
    exporterTest: readJson(path.join(evidenceDir, 'evidence-exporter-test.json')),
    prewriteTest: readJson(path.join(evidenceDir, 'exporter-prewrite-token-detection-test.json')),
  });
  const result = {
    status: meshRun.status === 0
      && jotRun.status === 0
      && badRun.status !== 0
      && !badWrote
      && capturesRequired
      && meshHasNoJot
      && jotExpected
      && receiverStatusComplete
      && readinessOk
      && !hasRawTokenMaterial(evidenceText)
      ? 'PASS'
      : 'FAIL',
    mode: 'local-simulated',
    evidence_dir: evidenceDir,
    mesh_only_sample: meshOut,
    jot_sample: jotOut,
    private_bad_token_hash: crypto.createHash('sha256').update(rawToken).digest('hex'),
  };
  writeJson(path.join(evidenceDir, 'gate-e-local-result.json'), result);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
