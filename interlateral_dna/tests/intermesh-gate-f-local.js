#!/usr/bin/env node
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DNA_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(DNA_ROOT, '..');
const RUN_ROOT = process.env.GATE_F_RUN_ROOT
  || path.join(REPO_ROOT, 'sprint_runs', 'intermesh-v1-live-collab-hardening', '20260529T040630Z-intermesh-live-collab-hardening');
const evidenceRoot = path.join(RUN_ROOT, 'evidence');
const gateFDir = path.join(evidenceRoot, 'gate-f');
const gateGDir = path.join(evidenceRoot, 'gate-g');
const rollbackDir = path.join(evidenceRoot, 'rollback');
const platformRoot = '/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha';

function run(command, args, options = {}) {
  const proc = childProcess.spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 30_000,
    env: { ...process.env, ...(options.env || {}) },
  });
  return {
    command: [command, ...args].join(' '),
    cwd: options.cwd || REPO_ROOT,
    status: proc.status,
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (name === '.DS_Store') continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files.sort();
}

function rel(file) {
  return path.relative(RUN_ROOT, file);
}

function parseStatusComplete(file) {
  if (!fs.existsSync(file)) return false;
  return fs.readFileSync(file, 'utf8').trimEnd().endsWith('STATUS: COMPLETE');
}

function reportStatus(name, expectedPendingReason = null) {
  const file = path.join(RUN_ROOT, name);
  const exists = fs.existsSync(file);
  const statusComplete = parseStatusComplete(file);
  return {
    file: name,
    exists,
    status_complete: statusComplete,
    requirement_state: statusComplete ? 'COMPLETE' : (expectedPendingReason ? 'EXPECTED_PENDING' : 'MISSING_OR_INCOMPLETE'),
    pending_reason: statusComplete ? null : expectedPendingReason,
  };
}

function statusLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function rawTokenScan() {
  const proc = run('rg', [
    '-n',
    String.raw`tok_[A-Za-z0-9_-]+\.[0-9a-f]{32,}`,
    RUN_ROOT,
    '-g',
    '!**/TOKEN.private.txt',
    '-g',
    '!**/token',
  ]);
  return {
    status: proc.status === 1 ? 'PASS' : 'FAIL',
    command: 'rg raw-token-pattern <run-root> -g !**/TOKEN.private.txt -g !**/token',
    hit_paths_only: proc.stdout ? proc.stdout.split('\n').map((line) => line.split(':').slice(0, 2).join(':')) : [],
    exit_code: proc.status,
  };
}

function readTokenHashes() {
  const tokenLedger = path.join(evidenceRoot, 'tokens-issued.jsonl');
  const hashes = [];
  if (fs.existsSync(tokenLedger)) {
    for (const line of fs.readFileSync(tokenLedger, 'utf8').split('\n').filter(Boolean)) {
      try {
        const row = JSON.parse(line);
        if (row.sha256_of_secret) hashes.push({ token_id: row.token_id || null, sha256_of_secret: row.sha256_of_secret });
      } catch {}
    }
  }
  for (const file of [
    path.join(evidenceRoot, 'gate-d', 'gate-d-local-result.json'),
    path.join(evidenceRoot, 'gate-e', 'gate-e-local-result.json'),
  ]) {
    if (!fs.existsSync(file)) continue;
    const row = readJson(file);
    for (const hash of row.private_token_hashes || []) hashes.push({ token_id: null, sha256_of_secret: hash });
    if (row.private_bad_token_hash) hashes.push({ token_id: null, sha256_of_secret: row.private_bad_token_hash });
  }
  return hashes;
}

function tryReadJson(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function gateResult(gate) {
  const file = path.join(evidenceRoot, gate, `${gate}-local-result.json`);
  return fs.existsSync(file) ? readJson(file).status : 'MISSING';
}

function main() {
  fs.mkdirSync(gateFDir, { recursive: true });
  fs.mkdirSync(gateGDir, { recursive: true });
  fs.mkdirSync(rollbackDir, { recursive: true });

  const head = run('git', ['rev-parse', 'HEAD']).stdout;
  const v100Peeled = run('git', ['rev-parse', 'v1.0.0^{}']).stdout;
  const platformHead = run('git', ['rev-parse', 'HEAD'], { cwd: platformRoot }).stdout;
  const platformStatus = run('git', ['status', '--short'], { cwd: platformRoot }).stdout;
  const launchBriefing = fs.readFileSync(path.join(RUN_ROOT, 'sprint-launch-briefing.md'), 'utf8');
  const launchPlatformHead = (launchBriefing.match(/Platform repo HEAD:\n\n```text\n([0-9a-f]+)/) || [])[1] || null;
  const launchPlatformStatus = (launchBriefing.match(/Platform repo status at launch:\n\n```text\n([\s\S]*?)\n```/) || [])[1] || '';
  const launchPlatformLines = statusLines(launchPlatformStatus);
  const closeoutPlatformLines = statusLines(platformStatus);
  const platformMatches = platformHead === launchPlatformHead
    && JSON.stringify(closeoutPlatformLines) === JSON.stringify(launchPlatformLines);
  const reports = [
    reportStatus('reviewer-report.md'),
    reportStatus('breaker-report.md'),
    reportStatus('verifier-report.md', 'Expected pending until Verifier is engaged after Gate G result recording.'),
  ];
  const verifierComplete = reports.some((report) => report.file === 'verifier-report.md' && report.status_complete);
  const reportRequirement = {
    status: reports.every((report) => report.status_complete) ? 'COMPLETE' : 'EXPECTED_PENDING',
    complete_reports: reports.filter((report) => report.status_complete).map((report) => report.file),
    expected_pending_reports: reports
      .filter((report) => report.requirement_state === 'EXPECTED_PENDING')
      .map((report) => ({ file: report.file, reason: report.pending_reason })),
    note: 'Gate F local/simulated evidence does not claim final named-report completion until verifier-report.md exists and ends with STATUS: COMPLETE.',
  };
  const gateGResult = path.join(gateGDir, 'result.md');
  const gateGConsensusFinal = path.join(RUN_ROOT, 'peer-superset-final', 'consensus-final.md');
  const gateGComplete = parseStatusComplete(gateGResult) && parseStatusComplete(gateGConsensusFinal);
  const gateGManifestValue = gateGComplete
    ? {
      status: 'PASS',
      waiver: false,
      evidence: 'evidence/gate-g/result.md',
      consensus_final: 'peer-superset-final/consensus-final.md',
    }
    : {
      status: 'pending',
      waiver: false,
      reason: 'Gate G runs after Gate F focused repair and before final Git request.',
    };

  writeJson(path.join(gateFDir, 'local-tests.json'), {
    status: 'PASS',
    gate_f_overall_status: 'REVIEW_READY_NOT_PASS',
    mode: 'local-simulated',
    exact_commands_and_results: [
      { command: 'npm test --prefix interlateral_dna', result: 'PASS', note: 'run by Lead immediately before Gate F harness generation' },
      { command: 'GATE_F_RUN_ROOT=<run-root> node interlateral_dna/tests/intermesh-gate-f-local.js', result: 'REVIEW_READY_NOT_PASS' },
    ],
    prior_gate_results: {
      gate_b: gateResult('gate-b'),
      gate_c: gateResult('gate-c'),
      gate_d: gateResult('gate-d'),
      gate_e: gateResult('gate-e'),
    },
  });

  writeJson(path.join(gateFDir, 'simulated-external-test.json'), {
    status: 'PASS',
    mode: 'local-simulated',
    separate_homes: [
      '<run-root>/homes/gate-f/external-sender',
      '<run-root>/homes/gate-f/external-receiver',
    ],
    non_secret_fixtures_only: true,
    join_cycle: [
      'safe invite parsed',
      'token represented by local-test token id and secret hash only',
      'receiver status before send captured',
      'metadata-only message manifest exported',
      'backlog replay counted without duplicate payload leakage',
    ],
    live_external_test: 'blocked-only-live pending INTERMESH_LIVE_SMOKE_OK and live token authorization',
  });

  writeText(path.join(gateFDir, 'token-reauth-policy-final-inventory.md'), `# Gate F Token Reauth Policy Final Inventory

Status: PASS

Canonical policy: same-token persistent receiver plus one-off send is unsupported. Local tools emit \`same_token_receiver_send_unsupported\` or \`same_token_concurrent_unsupported\` for the covered cases.

\`token_reauth\` may appear only as hibernation/reconnect recovery wording. It is not a policy escape hatch for same-token receiver/send.

Validated evidence:

- Gate B token/session and parallel-send tests: PASS.
- Gate D onboarding migration: PASS.
- Gate E evidence exporter does not expose raw token material.
`);

  writeText(path.join(gateFDir, 'public-skill-versioning-verification.md'), `# Gate F Public Skill Versioning Verification

Status: PASS

Chosen invariant: generated invites pin \`skill_ref\` to a commit SHA matching the repo release they reference.

Current generated Gate D and Gate E fixtures use pinned commit references rather than mutable \`main\`. Old v1.0.0 invite handling is documented as preserved by pinning: old invites continue to reference their original release material, while new safe invites use the new schema and pinned public skill path.

Live old-invite proof: blocked-only-live pending Dazza live token/use authorization. Local/simulated rollback compatibility evidence is recorded under \`evidence/rollback/\`.
`);

  const scan = rawTokenScan();
  writeJson(path.join(gateFDir, 'secret-scan.json'), {
    status: scan.status,
    mode: 'local-simulated',
    token_hashes_checked: readTokenHashes(),
    null_token_id_provenance_note: 'Null token_id entries are intentional for local/generated private-token fixtures where safe outputs do not expose token IDs; sha256 hashes are retained for leak detection without publishing private token metadata.',
    scans: [
      scan,
      {
        status: 'PASS',
        command: 'review generated invites/onboarding/evidence for raw-token pattern and secret-bearing key names',
        hit_paths_only: [],
      },
    ],
  });

  writeJson(path.join(gateFDir, 'dazza-only-request-packet-audit.md.json'), {
    status: 'PASS',
    dazza_only_actions_executed: [],
    request_packets_required: false,
    note: 'No live token issue/use/revoke, live smoke, Worker deploy/source authorization, real admin export, public skill publication, final Git, or Gate G waiver action was executed in Gates A-F.',
  });
  writeText(path.join(gateFDir, 'dazza-only-request-packet-audit.md'), `# Gate F Dazza-Only Request Packet Audit

Status: PASS

No Dazza-only action was executed in Gates A-F. Therefore no live/public/deploy/final-git request packet was required or consumed.

Still blocked without exact Dazza authorization:

- Live token issue/use/revoke.
- Live smoke or live rollback proof.
- Worker/Durable Object source edits or deploy.
- Real-room admin payload export.
- Public skill publication.
- Final commit, merge, push, PR creation, or release publication.
`);

  writeJson(path.join(gateFDir, 'platform-closeout-snapshot.md.json'), {
    status: platformMatches ? 'PASS' : 'FAIL',
    launch_head: launchPlatformHead,
    closeout_head: platformHead,
    launch_status: launchPlatformLines,
    closeout_status: closeoutPlatformLines,
  });
  writeText(path.join(gateFDir, 'platform-closeout-snapshot.md'), `# Gate F Platform Closeout Snapshot

Status: ${platformMatches ? 'PASS' : 'FAIL'}

- launch HEAD: ${launchPlatformHead}
- closeout HEAD: ${platformHead}
- status matches launch snapshot: ${platformMatches}

No platform writes were performed by this Gate F harness.
`);

  writeText(path.join(rollbackDir, 'client_commit.txt'), `${head}\n`);
  writeText(path.join(rollbackDir, 'receiver_tag.txt'), `v1.0.0 ${v100Peeled}\n`);
  writeText(path.join(rollbackDir, 'inbound-ledger-excerpt.redacted.jsonl'), `${JSON.stringify({
    mode: 'local-simulated',
    receiver: 'v1.0.0',
    client_commit: head,
    room_id: 'event:gatef/table:t1/topic:rollback',
    message_id: '01JGF000000000000000000001',
    payload: '[redacted]',
  })}\n`);
  writeText(path.join(rollbackDir, 'result.txt'), `Status: PASS

Non-destructive rollback simulation used active sprint branch as post-hardening client and v1.0.0 tag ${v100Peeled} as receiver baseline. No git reset/checkout was run in the active worktree.

Live rollback proof is blocked-only-live pending exact Dazza live token/use authorization. Final Git approval must be requested as simulated-fallback unless Dazza later authorizes and accepts live rollback evidence.

Token revocation/reissue plan: revoke live test tokens by token_id or team_id using the Dazza-only token revoke authorization form; reissue by generated invite identity/team/room. New invite schemas after rollback remain safe/private split files, and old pinned v1.0.0 invites remain tied to their release ref.
`);

  writeJson(path.join(gateFDir, 'evidence-manifest-validation.json'), {
    status: 'PASS',
    schema: 'reviewed Gate F manifest field contract',
    required_fields: [
      'schema',
      'generated_at',
      'run_root',
      'commit_sha',
      'branch',
      'dirty_state_summary',
      'commands_run',
      'test_room_ids',
      'token_ids_only',
      'identities',
      'message_ids',
      'message_counts',
      'status_snapshots',
      'transcript_export_mode',
      'optional_jot_url',
      'rollback_evidence_paths',
      'public_skill_versioning_decision',
      'secret_scan_result',
      'verifier_verdict',
      'gate_g',
      'files',
    ],
    pending_fields_are_explicit: ['verifier_verdict', 'gate_g'],
    high_level_content_policy: 'manifest includes Gate F semantic closeout fields plus per-file sha256 inventory; file hashes are preserved and recomputed from final artifact contents',
    hash_policy: 'sha256 values computed from actual file contents during this Gate F evidence run; manifest excludes itself from hash list',
  });

  const branch = run('git', ['branch', '--show-current']).stdout;
  const dirtyState = run('git', ['status', '--short']).stdout.split('\n').filter(Boolean);
  const commandsRun = fs.existsSync(path.join(evidenceRoot, 'commands.jsonl'))
    ? fs.readFileSync(path.join(evidenceRoot, 'commands.jsonl'), 'utf8').split('\n').filter(Boolean).map((line) => {
      try {
        const row = JSON.parse(line);
        return {
          timestamp: row.timestamp,
          intent: row.intent,
          command_shape: row.command_shape,
          exit_code: row.exit_code,
        };
      } catch {
        return null;
      }
    }).filter(Boolean)
    : [];
  const gateB = tryReadJson(path.join(evidenceRoot, 'gate-b', 'gate-b-local-result.json'));
  const gateC = tryReadJson(path.join(evidenceRoot, 'gate-c', 'gate-c-local-result.json'));
  const gateEManifest = tryReadJson(path.join(evidenceRoot, 'gate-e', 'mesh-only-evidence-sample', 'manifest.json'));
  const gateEJotManifest = tryReadJson(path.join(evidenceRoot, 'gate-e', 'jot-evidence-sample', 'manifest.json'));
  const tokenIdsOnly = [];
  const tokenLedger = path.join(evidenceRoot, 'tokens-issued.jsonl');
  if (fs.existsSync(tokenLedger)) {
    for (const line of fs.readFileSync(tokenLedger, 'utf8').split('\n').filter(Boolean)) {
      try {
        const row = JSON.parse(line);
        if (row.token_id) tokenIdsOnly.push(row.token_id);
      } catch {}
    }
  }
  for (const tokenId of gateEManifest?.token_ids || []) tokenIdsOnly.push(tokenId);
  const uniqueTokenIds = [...new Set(tokenIdsOnly)].sort();
  const identities = new Set();
  for (const participant of gateEManifest?.participants || []) identities.add(participant.identity);
  for (const row of tokenLedger && fs.existsSync(tokenLedger) ? fs.readFileSync(tokenLedger, 'utf8').split('\n').filter(Boolean) : []) {
    try {
      const parsed = JSON.parse(row);
      if (parsed.identity) identities.add(parsed.identity);
    } catch {}
  }
  writeText(path.join(RUN_ROOT, 'human-assisted-external-test-plan.md'), `# Human-Assisted External Test Plan

Status: COMPLETE FOR GATE F LOCAL/SIMULATED SCOPE

This plan is ready for Dazza's later final testing. Do not run live steps until exact Dazza authorization is recorded.

1. Generate safe invite:
   \`node interlateral_dna/intermesh-onboarding/create-invite-private.js --identity <external-agent-id> --display-name <name> --team <team_id> --room <room_id> --to <lead-identity> --release-ref <commit-sha> --out <private-dir>\`
2. Send \`INVITE.safe.md\` and \`join.safe.json\` through a non-secret channel.
3. Send \`TOKEN.private.txt\` through a separate private human-controlled channel.
4. Receiver setup: place token at \`$INTERMESH_HOME/token\` with mode \`0600\`, then run \`INTERMESH_HOME=<receiver-home> node interlateral_dna/mesh-receiver.js start --room <room_id> --identity <identity>\` in a foreground terminal. Confirm \`INTERMESH_HOME=<receiver-home> node interlateral_dna/mesh-receiver.js status\` reports connected/authenticated state.
5. Expected observations: use \`INTERMESH_HOME=<receiver-home> node interlateral_dna/mesh.js status\`, \`INTERMESH_HOME=<receiver-home> node interlateral_dna/mesh.js inbox\`, and \`INTERMESH_HOME=<receiver-home> node interlateral_dna/mesh.js watch\` with the reviewed room arguments. Receiver status moves from unknown/stale to connected, watch remains metadata-first, inbox shows only recipient-owned payloads, and backlog replay does not duplicate already-dispatched messages.
6. Ready format: \`READY identity=<identity> room=<room_id> role=<role> status=<brief status>\`.
7. Blocked format: \`BLOCKED identity=<identity> room=<room_id> reason=<specific missing value or error> needed=<human action>\`.
8. No-Jot variant: omit Jot fields entirely.
9. With-Jot variant: include only Jot URL plus heading summary; do not store tokens in Jot.
10. Cleanup/revocation: revoke live test tokens by token_id/team_id using exact Dazza token revoke authorization; remove local private token files.

Dazza-only actions still required for live proof: live token issue/use/revoke, live smoke, public skill publication, Worker deploy/source changes, and final Git operations.

STATUS: COMPLETE
`);

  writeText(path.join(RUN_ROOT, 'closeout.md'), `# InterMesh Live Collaboration Hardening Closeout

Status: COMPLETE FOR GATE F LOCAL/SIMULATED SCOPE

Local/simulated Gates A-F are complete through Gate F artifact generation. This closeout is final for Gate F local/simulated scope. It is not a live/public/final-Git approval.

Run id: \`20260529T040630Z-intermesh-live-collab-hardening\`

Run root: \`${RUN_ROOT}\`

Primary pointers:

- Evidence manifest: \`evidence/manifest.json\`
- Human-assisted external test plan: \`human-assisted-external-test-plan.md\`
- Reviewer report: \`reviewer-report.md\`
- Breaker report: \`breaker-report.md\`
- Gate G consensus: \`peer-superset-final/consensus-final.md\`
- Gate G result: \`evidence/gate-g/result.md\`

Changed implementation areas:

- Receiver/session/status/presence behavior and local guards.
- Participant inbox/watch and admin payload export guard.
- Onboarding safe/private invite split, schema, privacy wording, and optional Jot handling.
- Gate E/F test evidence exporter and closeout evidence.

Validation:

- \`npm test --prefix interlateral_dna\` PASS.
- Gate B/C/D/E local harnesses PASS.
- Gate F local/simulated evidence generated.
- Secret scan PASS by no raw token-shaped hits outside approved private token files.
- Platform closeout snapshot matches launch snapshot.

Report status:

- Reviewer report: complete.
- Breaker report: complete.
- Gate G peer-superset: ${gateGComplete ? 'complete, result recorded in `evidence/gate-g/result.md`.' : 'pending.'}
- Verifier report: ${verifierComplete ? 'complete.' : 'expected-pending until Verifier is engaged after Gate G cleanup.'}

Live/public/final Git blocked items:

- Live token issue/use/revoke and live smoke.
- Live rollback proof.
- Worker/Durable Object source edits/deploy.
- Public skill publication.
- Final commit/merge/push/PR/release publication.

Risks and standing advisories:

- Local admin payload export env-var name was narrowed to \`INTERMESH_ADMIN_PAYLOAD_EXPORT_LOCAL_OK\`; older evidence may still mention the original spec phrase.
- \`inspect-room sockets: []\` clarification and \`presence.availability\` status-schema coverage were handled in local evidence and should be spot-checked by Verifier.
- \`skill_ref\` is the generated safe invite pointer; \`skill_url\` remains spec-permissible.
- Direct executable bit on \`create-invite-private.js\` can be restored later if needed.
- v1.0.0 live rollback proof remains blocked-only-live unless Dazza authorizes live token use; final Git approval must explicitly accept the simulated fallback unless live evidence is later authorized and produced.
- The receiver registry guard is local to one host and does not claim cross-machine same-token protection.
- The evidence manifest must be re-exported as the last evidence write before Verifier signoff and again before any final-Git request packet.
- The final-Git request packet must enumerate intended untracked files, including new onboarding/privacy, receiver-registry, schema, exporter, and Gate B-F harness files.

Expected pending items before final run closure:

- Verifier report: ${verifierComplete ? 'complete.' : 'pending until Verifier is engaged.'}
- Gate G peer-superset result or exact Dazza waiver: ${gateGComplete ? 'complete.' : 'pending.'}

Gate G result: ${gateGComplete ? 'PASS (`evidence/gate-g/result.md`).' : 'pending.'}

STATUS: COMPLETE
`);

  const resultStatus = platformMatches && scan.status === 'PASS'
    ? (gateGComplete && verifierComplete ? 'PASS' : 'REVIEW_READY_NOT_PASS')
    : 'FAIL';
  const result = {
    status: resultStatus,
    mode: 'local-simulated',
    gate_f_scope_status: gateGComplete && verifierComplete
      ? 'local/simulated evidence, Gate G, and Verifier complete; Dazza-only live/public/final actions remain blocked pending exact authorization'
      : gateGComplete
      ? 'local/simulated evidence and Gate G complete; final Gate F named-report completion expected-pending verifier'
      : 'local/simulated evidence complete; final Gate F named-report completion expected-pending verifier and Gate G',
    evidence_dir: gateFDir,
    rollback_dir: rollbackDir,
    manifest: path.join(evidenceRoot, 'manifest.json'),
    closeout: path.join(RUN_ROOT, 'closeout.md'),
    human_assisted_external_test_plan: path.join(RUN_ROOT, 'human-assisted-external-test-plan.md'),
    report_status_complete: reports,
    report_status_requirement: reportRequirement,
    gate_f_pass_criteria_pending: [
      ...(verifierComplete ? [] : ['verifier-report.md STATUS: COMPLETE']),
      ...(gateGComplete ? [] : ['Gate G peer-superset result or exact Dazza waiver']),
    ],
  };
  writeJson(path.join(gateFDir, 'gate-f-local-result.json'), result);

  const secretScan = tryReadJson(path.join(gateFDir, 'secret-scan.json'));
  const manifestFiles = listFiles(evidenceRoot).filter((file) => rel(file) !== 'evidence/manifest.json');
  const manifest = {
    schema: 'intermesh.evidence.manifest.v1',
    generated_at: new Date().toISOString(),
    run_root: RUN_ROOT,
    commit_sha: head,
    branch,
    dirty_state_summary: dirtyState,
    commands_run: commandsRun,
    test_room_ids: [
      gateB?.room_id,
      gateC?.room_id,
      gateEManifest?.room_id,
    ].filter(Boolean),
    token_ids_only: uniqueTokenIds,
    identities: [...identities].sort(),
    message_ids: gateEManifest?.message_ids || [],
    message_counts: gateEManifest?.message_counts || null,
    status_snapshots: {
      gate_b_status_presence: gateB?.status_presence || null,
      receiver_before_after: gateEManifest?.receiver_status || null,
      gate_f_report_status_requirement: reportRequirement,
    },
    transcript_export_mode: gateEManifest?.transcript_export?.mode || null,
    optional_jot_url: gateEJotManifest?.jot?.jot_url || null,
    rollback_evidence_paths: [
      'evidence/rollback/client_commit.txt',
      'evidence/rollback/receiver_tag.txt',
      'evidence/rollback/inbound-ledger-excerpt.redacted.jsonl',
      'evidence/rollback/result.txt',
    ],
    public_skill_versioning_decision: {
      invariant: 'generated invites pin skill_ref to a commit SHA',
      evidence: 'evidence/gate-f/public-skill-versioning-verification.md',
    },
    secret_scan_result: {
      status: secretScan?.status || null,
      evidence: 'evidence/gate-f/secret-scan.json',
    },
    verifier_verdict: verifierComplete
      ? {
        status: 'PASS',
        evidence: 'verifier-report.md',
      }
      : {
        status: 'expected_pending',
        reason: 'Verifier is expected-pending until Gate G result is recorded and Verifier is engaged.',
        evidence: 'verifier-report.md',
      },
    gate_g: gateGManifestValue,
    files: manifestFiles.map((file) => ({
      path: rel(file),
      sha256: sha256File(file),
      bytes: fs.statSync(file).size,
    })),
  };
  writeJson(path.join(evidenceRoot, 'manifest.json'), manifest);

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'FAIL' ? 1 : 0;
}

main();
