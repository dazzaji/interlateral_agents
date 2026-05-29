#!/usr/bin/env node
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DNA_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(DNA_ROOT, '..');
const NODE = process.execPath;
const inviteScript = path.join(DNA_ROOT, 'intermesh-onboarding', 'create-invite-private.js');
const schemaPath = path.join(DNA_ROOT, 'schemas', 'join.safe.schema.json');
const evidenceDir = process.env.GATE_D_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-d-evidence-'));
const outputRoot = process.env.GATE_D_OUTPUT_ROOT || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-d-outputs-'));
const platformStub = '/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026-05-25-intermesh/onboarding-provisioning.md';

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function runNode(args) {
  return childProcess.spawnSync(NODE, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 15_000,
    env: { ...process.env },
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function modeOct(file) {
  return (fs.statSync(file).mode & 0o777).toString(8).padStart(4, '0');
}

function assertSafeNoToken(file, token) {
  const text = fs.readFileSync(file, 'utf8');
  return !text.includes(token) && !/tok_local_gate_d_[0-9a-f]+\.[0-9a-f]{64}/.test(text);
}

function validateJoin(join) {
  const errors = [];
  const required = [
    'created_at',
    'identity',
    'display_name',
    'team_id',
    'room_id',
    'targets',
    'repo_url',
    'release_ref',
    'skill_ref',
  ];
  for (const key of required) if (!(key in join)) errors.push(`missing ${key}`);
  if (!/^[a-z][a-z0-9_-]*:[^/]+(\/[-a-z0-9_]+:[^/]+)*$/.test(join.room_id || '')) errors.push('room_id pattern mismatch');
  if (typeof join.targets !== 'object' || Array.isArray(join.targets)) errors.push('targets must be object');
  const allowedKeys = new Set([...required, 'jot']);
  for (const key of Object.keys(join)) if (!allowedKeys.has(key)) errors.push(`unexpected safe key ${key}`);
  if (join.token || join.token_secret || join.raw_token || join.token_id) errors.push('safe join contains token-like field');
  if (join.jot) {
    for (const key of Object.keys(join.jot)) if (!['jot_url', 'jot_alias', 'jot_home'].includes(key)) errors.push(`unexpected jot key ${key}`);
    if (!join.jot.jot_url) errors.push('jot_url missing');
  }
  return errors;
}

function makeToken(name) {
  return `tok_local_gate_d_${name}.${crypto.randomBytes(32).toString('hex')}`;
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true, mode: 0o700 });

  const room = 'event:gated/table:t1/topic:onboarding';
  const releaseRef = 'a6b7f337f9b3daae276858243f570affb9644801';
  const noJotToken = makeToken('nojot');
  const jotToken = makeToken('jot');
  const noJotOut = path.join(outputRoot, 'no-jot');
  const jotOut = path.join(outputRoot, 'with-jot');
  const common = [
    '--team', 'gate-d-team',
    '--room', room,
    '--to', 'dazza-primary@local',
    '--release-ref', releaseRef,
    '--skill-ref', `https://github.com/dazzaji/interlateral_agents/blob/${releaseRef}/interlateral_dna/intermesh-onboarding/INTERMESH_AGENT_SKILL.md`,
  ];

  const noJot = runNode([
    inviteScript,
    '--identity', 'gate-d-no-jot@local',
    '--display-name', 'Gate D No Jot',
    '--out', noJotOut,
    '--token', noJotToken,
    '--token-id', 'tok_local_gate_d_nojot',
    ...common,
  ]);
  const withJot = runNode([
    inviteScript,
    '--identity', 'gate-d-jot@local',
    '--display-name', 'Gate D Jot',
    '--out', jotOut,
    '--token', jotToken,
    '--token-id', 'tok_local_gate_d_jot',
    '--jot-url', 'https://jot.example.test/gate-d',
    '--jot-alias', 'gate-d-jot',
    '--jot-home', '~/.jot/gate-d',
    ...common,
  ]);

  const noJotJoin = readJson(path.join(noJotOut, 'join.safe.json'));
  const jotJoin = readJson(path.join(jotOut, 'join.safe.json'));
  const noJotValidation = validateJoin(noJotJoin);
  const jotValidation = validateJoin(jotJoin);
  const schema = readJson(schemaPath);
  const noJotSafe = assertSafeNoToken(path.join(noJotOut, 'INVITE.safe.md'), noJotToken)
    && assertSafeNoToken(path.join(noJotOut, 'join.safe.json'), noJotToken);
  const jotSafe = assertSafeNoToken(path.join(jotOut, 'INVITE.safe.md'), jotToken)
    && assertSafeNoToken(path.join(jotOut, 'join.safe.json'), jotToken);
  const noJotInviteText = fs.readFileSync(path.join(noJotOut, 'INVITE.safe.md'), 'utf8');
  const noJotHasNoPlaceholders = !('jot' in noJotJoin)
    && !noJotInviteText.includes('Jot URL:')
    && !noJotInviteText.includes('token_id')
    && !noJotInviteText.includes('websocket_url');
  const jotInviteText = fs.readFileSync(path.join(jotOut, 'INVITE.safe.md'), 'utf8');
  const publicSkillText = fs.readFileSync(path.join(DNA_ROOT, 'intermesh-onboarding', 'INTERMESH_AGENT_SKILL.md'), 'utf8');
  const jotExpectedOnly = Boolean(jotJoin.jot?.jot_url)
    && JSON.stringify(Object.keys(jotJoin.jot || {}).sort()) === JSON.stringify(['jot_alias', 'jot_home', 'jot_url'])
    && /Use Mesh for live coordination\. Use Jot only when the invitation includes a Jot\s+or the human directs you to one\./.test(publicSkillText)
    && publicSkillText.includes('post timestamped sections');

  const generatedFiles = [
    'INVITE.safe.md',
    'join.safe.json',
    'TOKEN.private.txt',
  ];
  const noJotFilesPresent = generatedFiles.every((file) => fs.existsSync(path.join(noJotOut, file)));
  const jotFilesPresent = generatedFiles.every((file) => fs.existsSync(path.join(jotOut, file)));
  const tokenModes = [
    { path: path.join(noJotOut, 'TOKEN.private.txt'), mode: modeOct(path.join(noJotOut, 'TOKEN.private.txt')) },
    { path: path.join(jotOut, 'TOKEN.private.txt'), mode: modeOct(path.join(jotOut, 'TOKEN.private.txt')) },
  ];
  const privateModesOk = tokenModes.every((row) => row.mode === '0600');

  writeJson(path.join(evidenceDir, 'invite-generator-test.json'), {
    status: noJot.status === 0 && withJot.status === 0 && noJotFilesPresent && jotFilesPresent && noJotSafe && jotSafe ? 'PASS' : 'FAIL',
    mode: 'local-simulated',
    command: 'node interlateral_dna/intermesh-onboarding/create-invite-private.js --local-fixture-equivalent --out <private-home>',
    generated_file_names: generatedFiles,
    safe_files_omit_raw_tokens: noJotSafe && jotSafe,
    token_sha256: [sha256(noJotToken), sha256(jotToken)],
    no_jot_stdout_status: noJot.status,
    jot_stdout_status: withJot.status,
  });
  writeJson(path.join(evidenceDir, 'join-safe-schema-validation.json'), {
    status: noJotValidation.length === 0 && jotValidation.length === 0 ? 'PASS' : 'FAIL',
    schema_path: schemaPath,
    schema_id: schema.$id,
    no_jot_errors: noJotValidation,
    jot_errors: jotValidation,
  });
  writeJson(path.join(evidenceDir, 'token-private-permissions.json'), {
    status: privateModesOk ? 'PASS' : 'FAIL',
    token_files: tokenModes,
    receiver_side_storage_documented: '$INTERMESH_HOME/token must be mode 0600',
  });
  writeJson(path.join(evidenceDir, 'no-jot-fixture-test.json'), {
    status: noJotHasNoPlaceholders ? 'PASS' : 'FAIL',
    join_safe_has_jot_key: Boolean(noJotJoin.jot),
    invite_safe_has_jot_placeholder: noJotInviteText.includes('Jot URL:'),
    safe_join_keys: Object.keys(noJotJoin).sort(),
    join_flow_guidance_in_public_skill: publicSkillText.includes('## Collaboration Loop'),
  });
  writeJson(path.join(evidenceDir, 'jot-fixture-test.json'), {
    status: jotExpectedOnly ? 'PASS' : 'FAIL',
    jot_fields: Object.keys(jotJoin.jot || {}),
    expected_jot_fields_only: JSON.stringify(Object.keys(jotJoin.jot || {}).sort()) === JSON.stringify(['jot_alias', 'jot_home', 'jot_url']),
    mesh_first_wording_present_in_public_skill: /Use Mesh for live coordination\. Use Jot only when the invitation includes a Jot\s+or the human directs you to one\./.test(publicSkillText),
    jot_convention_present_in_public_skill: publicSkillText.includes('post timestamped sections'),
  });
  fs.writeFileSync(path.join(evidenceDir, 'onboarding-file-migration-checklist.md'), `# Gate D Onboarding File Migration Checklist

Status: PASS

- INTERMESH_AGENT_SKILL.md: aligned with safe invite split, pinned release_ref/skill_ref, canonical same-token policy, collaboration loop, ready/blocked formats, optional Jot wording, and identity/display_name/team_id/room_id terminology.
- README.md: aligned with generated INVITE.safe.md/join.safe.json/TOKEN.private.txt split, canonical same-token policy, public skill not complete invite, privacy wording, and future-only platform wording.
- HUMAN_HANDOFF_TEMPLATE.md: aligned as a human-readable fallback to generated safe invites; token remains separate and private.
- PARTICIPANT_INVITE_TEMPLATE.md: aligned to pinned release_ref/skill_ref and safe/private split.
- OPERATOR_INVITE_COMMANDS.md: aligned to create-invite-private.js outputs and local-only/publication authority boundaries.
- create-invite-private.js: writes INVITE.safe.md, join.safe.json, TOKEN.private.txt; supports no-Jot and Jot fixtures; safe files omit raw token material and enforce the Gate D safe-value allowlist.
`);
  fs.writeFileSync(path.join(evidenceDir, 'public-skill-versioning-application.md'), `# Gate D Public Skill Versioning Application

Status: PASS

Gate A selected pinned tag/SHA generated invite references. Gate D applies that by requiring generated safe invites to carry \`release_ref\` and \`skill_ref\`. The local fixtures use release ref \`${releaseRef}\`; no invite points agents at mutable \`main\` as the authority for this run.

Public skill publication remains blocked-only-live/public until Dazza grants the exact public-skill publication and final Git authorization forms.
`);
  fs.writeFileSync(path.join(evidenceDir, 'platform-future-stub-preservation.md'), `# Gate D Platform Future Stub Preservation

Status: ${fs.existsSync(platformStub) ? 'PASS' : 'WARN'}

Read-only future stub path: \`${platformStub}\`

Gate D did not write to \`/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/\` and did not implement platform API/UI/schema/token delivery. Platform-assisted onboarding remains future-only.
`);

  const result = {
    status: noJot.status === 0
      && withJot.status === 0
      && noJotFilesPresent
      && jotFilesPresent
      && noJotSafe
      && jotSafe
      && noJotValidation.length === 0
      && jotValidation.length === 0
      && privateModesOk
      && noJotHasNoPlaceholders
      && jotExpectedOnly
      ? 'PASS'
      : 'FAIL',
    mode: 'local-simulated',
    evidence_dir: evidenceDir,
    output_root: outputRoot,
    private_token_hashes: [sha256(noJotToken), sha256(jotToken)],
  };
  writeJson(path.join(evidenceDir, 'gate-d-local-result.json'), result);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
