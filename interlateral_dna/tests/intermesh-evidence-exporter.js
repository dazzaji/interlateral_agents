#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const RAW_TOKEN_PATTERN = /\btok_[A-Za-z0-9_-]+\.[0-9a-f]{32,}\b/;
const SECRET_KEYS = new Set(['token', 'token_secret', 'raw_token', 'secret', 'raw_secret']);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[name] = true;
    } else {
      args[name] = next;
      i += 1;
    }
  }
  return args;
}

function required(args, key) {
  if (!args[key]) throw new Error(`missing --${key}`);
  return args[key];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assertNoRawTokenMaterial(value, label) {
  const problems = [];
  function visit(node, trail) {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
      if (RAW_TOKEN_PATTERN.test(node)) problems.push(`${trail} contains raw token-shaped value`);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${trail}[${index}]`));
      return;
    }
    if (typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        const childTrail = `${trail}.${key}`;
        if (SECRET_KEYS.has(key)) problems.push(`${childTrail} is a secret-bearing key`);
        visit(child, childTrail);
      }
    }
  }
  visit(value, label);
  if (problems.length) {
    const error = new Error(`raw token material detected before evidence write: ${problems.join('; ')}`);
    error.code = 'raw_token_material_detected';
    throw error;
  }
}

function countBy(messages, key) {
  const counts = {};
  for (const message of messages) {
    const value = message[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function normalizeParticipant(participant) {
  return {
    identity: participant.identity,
    display_name: participant.display_name || null,
    last_seen: participant.last_seen || null,
  };
}

function buildManifest(input) {
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const manifest = {
    schema: 'intermesh.evidence.sample.v1',
    exported_at: new Date().toISOString(),
    mode: input.mode || 'local-simulated',
    room_id: input.room_id,
    team_id: input.team_id,
    token_ids: Array.isArray(input.token_ids) ? input.token_ids : [],
    participants: (input.participants || []).map(normalizeParticipant),
    last_seen: Object.fromEntries((input.participants || []).map((participant) => [
      participant.identity,
      participant.last_seen || null,
    ])),
    message_counts: {
      total: messages.length,
      by_from_identity: countBy(messages, 'from_identity'),
      by_to_identity: countBy(messages, 'to_identity'),
    },
    message_ids: messages.map((message) => message.id),
    receiver_status: {
      before: input.receiver_status_before || null,
      after_live_send: input.receiver_status_after_live_send || null,
      after_backlog_replay: input.receiver_status_after_backlog_replay || null,
    },
    transcript_export: {
      mode: input.transcript_export_mode || 'metadata-only',
      payload_included: false,
    },
  };

  if (input.jot && input.jot.jot_url) {
    manifest.jot = {
      jot_url: input.jot.jot_url,
      heading_summary: Array.isArray(input.jot.heading_summary) ? input.jot.heading_summary : [],
    };
  }

  return manifest;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function writeMarkdown(file, manifest) {
  const lines = [
    '# InterMesh Evidence Sample',
    '',
    `- mode: ${manifest.mode}`,
    `- room_id: ${manifest.room_id}`,
    `- team_id: ${manifest.team_id}`,
    `- token_ids: ${manifest.token_ids.join(', ')}`,
    `- participants: ${manifest.participants.map((participant) => participant.identity).join(', ')}`,
    `- message_count: ${manifest.message_counts.total}`,
    `- message_ids: ${manifest.message_ids.join(', ')}`,
    `- transcript_export_mode: ${manifest.transcript_export.mode}`,
    `- transcript_payload_included: ${manifest.transcript_export.payload_included}`,
  ];
  if (manifest.jot) {
    lines.push(`- jot_url: ${manifest.jot.jot_url}`);
    lines.push(`- jot_heading_summary: ${manifest.jot.heading_summary.join(' | ')}`);
  }
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputFile = required(args, 'input');
  const outDir = required(args, 'out');
  const input = readJson(inputFile);

  assertNoRawTokenMaterial(input, 'input');
  const manifest = buildManifest(input);
  assertNoRawTokenMaterial(manifest, 'manifest');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
  writeJson(path.join(outDir, 'manifest.json'), manifest);
  writeMarkdown(path.join(outDir, 'summary.md'), manifest);

  console.log(JSON.stringify({
    status: 'PASS',
    output_dir: outDir,
    manifest_file: path.join(outDir, 'manifest.json'),
    transcript_export_mode: manifest.transcript_export.mode,
    jot_included: Boolean(manifest.jot),
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: 'FAIL',
    code: error.code || 'evidence_export_failed',
    error: error.message,
  }, null, 2));
  process.exit(1);
}
