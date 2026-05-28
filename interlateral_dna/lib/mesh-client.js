const crypto = require('crypto');
const WebSocket = require('ws');
const fs = require('fs');
const { canonicalBodyJson, sha256Hex } = require('./json');
const {
  PROTOCOL,
  deriveEnvelopeKey,
  signSendEnvelope,
  tokenParts,
} = require('./envelope');
const { validateRoomId } = require('./room-id');

function nowIso() {
  return new Date().toISOString();
}

function randomHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${randomHex(12)}`;
}

function readTokenFile(file) {
  return fs.readFileSync(file, 'utf8').trim();
}

function buildEnvelope({ room_id, to_identity, from_identity, text, body, kind = 'message', id, nonce, created_at }) {
  const roomCheck = validateRoomId(room_id);
  if (!roomCheck.ok) {
    const err = new Error(roomCheck.reason);
    err.code = roomCheck.code;
    throw err;
  }
  return {
    protocol: PROTOCOL,
    id: id || newId(),
    nonce: nonce || randomHex(32),
    kind,
    room_id,
    to_identity,
    from_identity,
    created_at: created_at || nowIso(),
    body: body || {
      content_type: 'text/markdown',
      text: text || '',
    },
  };
}

class MeshClient {
  constructor({ url = 'wss://mesh.interlateral.com', token, tokenFile, timeoutMs = 10000 }) {
    this.url = url;
    this.token = token || (tokenFile ? readTokenFile(tokenFile) : null);
    this.timeoutMs = timeoutMs;
    this.ws = null;
    this.auth = null;
    this.envelopeKey = null;
    this.pending = new Map();
  }

  async connect() {
    if (!this.token) throw new Error('token or tokenFile is required');
    const { token_id, token_secret } = tokenParts(this.token);
    this.tokenId = token_id;
    this.tokenSecret = token_secret;
    this.envelopeKey = deriveEnvelopeKey(token_id, token_secret);
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`connect timeout after ${this.timeoutMs}ms`)), this.timeoutMs);
      this.ws.once('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.ws.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    this.ws.on('message', (raw) => this.handleFrame(raw));
    const authFrame = {
      type: 'auth',
      token_id,
      token_secret,
      ts: nowIso(),
      nonce: randomHex(32),
    };
    this.ws.send(JSON.stringify(authFrame));
    const auth = await this.waitFor((frame) => frame.type === 'auth_ok' || frame.type === 'error');
    if (auth.type === 'error') {
      const err = new Error(auth.message || auth.code);
      err.code = auth.code;
      throw err;
    }
    this.auth = auth;
    return auth;
  }

  handleFrame(raw) {
    let frame;
    try {
      frame = JSON.parse(String(raw));
    } catch {
      return;
    }
    for (const [id, waiter] of this.pending) {
      if (waiter.predicate(frame)) {
        clearTimeout(waiter.timer);
        this.pending.delete(id);
        waiter.resolve(frame);
      }
    }
    if (this.onFrame) this.onFrame(frame);
  }

  waitFor(predicate) {
    const id = newId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`timeout waiting for frame after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      this.pending.set(id, { predicate, resolve, reject, timer });
    });
  }

  async sendMessage({ room_id, to_identity, text, body }) {
    if (!this.auth) await this.connect();
    const envelope = buildEnvelope({
      room_id,
      to_identity,
      from_identity: this.auth.identity,
      text,
      body,
    });
    const frame = {
      type: 'send',
      envelope,
      sig: signSendEnvelope(this.envelopeKey, envelope),
    };
    this.ws.send(JSON.stringify(frame));
    const accepted = await this.waitFor((candidate) => (
      (candidate.type === 'accepted' && candidate.id === envelope.id)
      || (candidate.type === 'error' && (!candidate.id || candidate.id === envelope.id))
    ));
    if (accepted.type === 'error') {
      const err = new Error(accepted.message || accepted.code);
      err.code = accepted.code;
      err.frame = accepted;
      throw err;
    }
    return { envelope, accepted };
  }

  requestBacklog({ room_id, after_id = null, limit = 200 }) {
    this.ws.send(JSON.stringify({ type: 'backlog_request', room_id, after_id, limit }));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

module.exports = {
  MeshClient,
  buildEnvelope,
  nowIso,
  randomHex,
  newId,
  readTokenFile,
  canonicalBodyJson,
  sha256Hex,
};
