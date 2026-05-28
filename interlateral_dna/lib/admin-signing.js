#!/usr/bin/env node
const crypto = require('crypto');
const { sha256Hex, timingSafeEqualHex } = require('./json');

const ADMIN_KEY_ID = 'root-v1';
const ADMIN_SALT = 'intermesh-v1/admin';
const ADMIN_INFO = 'intermesh-v1/admin/request-signing';
const SIG_PREFIX = 'hmac-sha256:';

function deriveAdminRequestKey(rootKeyHex) {
  if (!/^[0-9a-f]{64}$/.test(String(rootKeyHex || ''))) {
    throw new Error('MESH_ADMIN_ROOT_KEY must be 64 lowercase hex characters');
  }
  return crypto.hkdfSync(
    'sha256',
    Buffer.from(rootKeyHex, 'hex'),
    Buffer.from(ADMIN_SALT, 'utf8'),
    Buffer.from(ADMIN_INFO, 'utf8'),
    32,
  );
}

function canonicalQueryString(searchParams) {
  const pairs = [];
  for (const [key, value] of searchParams.entries()) {
    pairs.push([key, value]);
  }
  pairs.sort((a, b) => {
    const left = `${encodeURIComponent(a[0])}=${encodeURIComponent(a[1])}`;
    const right = `${encodeURIComponent(b[0])}=${encodeURIComponent(b[1])}`;
    return Buffer.compare(Buffer.from(left), Buffer.from(right));
  });
  return pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function canonicalAdminPayload({ method, path, query = '', body = '', ts, nonce }) {
  if (!method || !path || !ts || !nonce) {
    throw new Error('method, path, ts, and nonce are required');
  }
  const queryString = typeof query === 'string'
    ? query.replace(/^\?/, '')
    : canonicalQueryString(query);
  return [
    String(method).toUpperCase(),
    path.startsWith('/') ? path : `/${path}`,
    queryString,
    sha256Hex(Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8')),
    ts,
    nonce,
  ].join('\n');
}

function signAdminPayload(adminRequestKey, payload) {
  const key = Buffer.isBuffer(adminRequestKey) ? adminRequestKey : Buffer.from(adminRequestKey);
  const mac = crypto.createHmac('sha256', key).update(payload, 'utf8').digest('hex');
  return `${SIG_PREFIX}${mac}`;
}

function signAdminRequest({ rootKeyHex, method, url, body = '', ts, nonce }) {
  const parsed = new URL(url, 'https://mesh.interlateral.com');
  const key = deriveAdminRequestKey(rootKeyHex);
  const payload = canonicalAdminPayload({
    method,
    path: parsed.pathname,
    query: canonicalQueryString(parsed.searchParams),
    body,
    ts,
    nonce,
  });
  return {
    payload,
    headers: {
      'X-Intermesh-Admin-Key-Id': ADMIN_KEY_ID,
      'X-Intermesh-Admin-Ts': ts,
      'X-Intermesh-Admin-Nonce': nonce,
      'X-Intermesh-Admin-Sig': signAdminPayload(key, payload),
    },
  };
}

function verifyAdminSignature({ rootKeyHex, method, url, body = '', ts, nonce, sig }) {
  if (typeof sig !== 'string' || !sig.startsWith(SIG_PREFIX)) return false;
  const signed = signAdminRequest({ rootKeyHex, method, url, body, ts, nonce });
  return timingSafeEqualHex(
    signed.headers['X-Intermesh-Admin-Sig'].slice(SIG_PREFIX.length),
    sig.slice(SIG_PREFIX.length),
  );
}

function selfTest() {
  const rootKeyHex = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  const body = '{"identity":"claude@team-alpha","room_ids":["event:demo/topic:t1"],"role":"participant"}';
  const ts = '2026-05-27T00:00:00.000Z';
  const nonce = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const url = '/admin/tokens/issue?dry_run=true&room=event%3Ademo%2Ftopic%3At1';
  const key = deriveAdminRequestKey(rootKeyHex);
  const signed = signAdminRequest({ rootKeyHex, method: 'POST', url, body, ts, nonce });
  const result = {
    status: 'PASS',
    admin_request_key_hex: Buffer.from(key).toString('hex'),
    body_hash: sha256Hex(body),
    canonical_admin_payload: signed.payload,
    sig: signed.headers['X-Intermesh-Admin-Sig'],
  };
  const expected = {
    admin_request_key_hex: '7e919caa054f732273c2dc53c514bfde4ea8d519a2e1057095fe38b8bed21c7d',
    body_hash: '0b1a905559a7ccc0737a39f12723e204f986636321d6a1ba09c9806e8213f355',
    sig: 'hmac-sha256:2fe78568e59543f8658abd55342a4afcd78bf3c3675a8e6ee67e1b1f1c7bd15e',
  };
  for (const [keyName, value] of Object.entries(expected)) {
    if (result[keyName] !== value) result.status = 'FAIL';
  }
  result.expected = expected;
  return result;
}

if (require.main === module) {
  if (process.argv[2] !== 'self-test') {
    console.error('Usage: node interlateral_dna/lib/admin-signing.js self-test');
    process.exit(1);
  }
  const result = selfTest();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

module.exports = {
  ADMIN_KEY_ID,
  canonicalQueryString,
  canonicalAdminPayload,
  deriveAdminRequestKey,
  signAdminPayload,
  signAdminRequest,
  verifyAdminSignature,
  selfTest,
};
