#!/usr/bin/env node
const crypto = require('crypto');
const { canonicalBodyJson, sha256Hex, timingSafeEqualHex } = require('./json');

const PROTOCOL = 'intermesh.v1';
const ENVELOPE_INFO = 'intermesh-v1/envelope';
const SIG_PREFIX = 'hmac-sha256:';

function requireField(object, field) {
  const value = object && object[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`missing envelope field: ${field}`);
  }
  return value;
}

function validateCreatedAt(createdAt) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(createdAt)) {
    throw new Error('created_at must be UTC ISO 8601 with exactly three fractional digits');
  }
}

function canonicalSendPayload(envelope) {
  const protocol = requireField(envelope, 'protocol');
  if (protocol !== PROTOCOL) {
    throw new Error(`unsupported protocol: ${protocol}`);
  }
  const id = requireField(envelope, 'id');
  const nonce = requireField(envelope, 'nonce');
  const roomId = requireField(envelope, 'room_id');
  const toIdentity = requireField(envelope, 'to_identity');
  const fromIdentity = requireField(envelope, 'from_identity');
  const createdAt = requireField(envelope, 'created_at');
  validateCreatedAt(createdAt);
  if (!envelope.body || typeof envelope.body !== 'object') {
    throw new Error('missing envelope body');
  }
  const bodyHash = sha256Hex(canonicalBodyJson(envelope.body));
  return [
    PROTOCOL,
    id,
    nonce,
    roomId,
    toIdentity,
    fromIdentity,
    createdAt,
    bodyHash,
  ].join('\n');
}

function deriveEnvelopeKey(tokenId, tokenSecret) {
  if (!tokenId || !tokenSecret) {
    throw new Error('token_id and token_secret are required');
  }
  return crypto.hkdfSync(
    'sha256',
    Buffer.from(tokenSecret, 'utf8'),
    Buffer.from(tokenId, 'utf8'),
    Buffer.from(ENVELOPE_INFO, 'utf8'),
    32,
  );
}

function signSendEnvelope(envelopeKey, envelope) {
  const key = Buffer.isBuffer(envelopeKey) ? envelopeKey : Buffer.from(envelopeKey);
  const mac = crypto.createHmac('sha256', key).update(canonicalSendPayload(envelope), 'utf8').digest('hex');
  return `${SIG_PREFIX}${mac}`;
}

function verifySendEnvelope(envelopeKey, envelope, sig) {
  if (typeof sig !== 'string' || !sig.startsWith(SIG_PREFIX)) return false;
  const expected = signSendEnvelope(envelopeKey, envelope).slice(SIG_PREFIX.length);
  const actual = sig.slice(SIG_PREFIX.length);
  return timingSafeEqualHex(expected, actual);
}

function tokenParts(token) {
  const trimmed = String(token || '').trim();
  const dot = trimmed.indexOf('.');
  if (dot <= 0 || dot === trimmed.length - 1) {
    throw new Error('token must be token_id.token_secret');
  }
  return {
    token_id: trimmed.slice(0, dot),
    token_secret: trimmed.slice(dot + 1),
  };
}

function selfTest() {
  const body = { text: 'hello', content_type: 'text/markdown' };
  const envelope = {
    protocol: 'intermesh.v1',
    id: '01J00000000000000000000001',
    nonce: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    kind: 'message',
    room_id: 'event:demo/topic:t1',
    to_identity: 'claude@team-alpha',
    from_identity: 'codex@team-alpha',
    created_at: '2026-05-27T00:00:00.000Z',
    body,
  };
  const key = deriveEnvelopeKey(
    'tok_test_01HZY7K8V4S3Q2P1N0M9L8K7J6',
    'test-only-secret-not-live-000000000000000000000000000001',
  );
  const results = {
    canonical_body_json: canonicalBodyJson(body),
    canonical_body_hash: sha256Hex(canonicalBodyJson(body)),
    canonical_send_payload: canonicalSendPayload(envelope),
    envelope_key_hex: Buffer.from(key).toString('hex'),
    sig: signSendEnvelope(key, envelope),
  };
  const expected = {
    canonical_body_json: '{"content_type":"text/markdown","text":"hello"}',
    canonical_body_hash: 'dbd97b8d9444407e1b3fb8427e4b1898a198de4f5720a09346ee3556a5414746',
    envelope_key_hex: '137c0c0f01a7274ff8ce4bf46ba9703e508d4aec6f1e4c01496ad28ae5706b3d',
    sig: 'hmac-sha256:ababdef4420a0669c6c577c694cea092222759d6f5c17c7cfed97073272a3254',
  };
  const pass = Object.entries(expected).every(([keyName, value]) => results[keyName] === value);
  return { status: pass ? 'PASS' : 'FAIL', results, expected };
}

if (require.main === module) {
  if (process.argv[2] !== 'self-test') {
    console.error('Usage: node interlateral_dna/lib/envelope.js self-test');
    process.exit(1);
  }
  const result = selfTest();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

module.exports = {
  PROTOCOL,
  canonicalBodyJson,
  canonicalSendPayload,
  deriveEnvelopeKey,
  signSendEnvelope,
  verifySendEnvelope,
  tokenParts,
  selfTest,
};
