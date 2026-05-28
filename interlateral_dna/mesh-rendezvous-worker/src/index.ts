type Env = {
  MESH_REGISTRY: DurableObjectNamespace;
  MESH_ROOM: DurableObjectNamespace;
  MESH_ADMIN_ROOT_KEY?: string;
};

type TokenRecord = {
  token_id: string;
  token_secret_hash: string;
  identity: string;
  display_name: string;
  team_id: string;
  room_ids: string[];
  role: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  metadata_label: string | null;
  created_by: string;
  last_seen_at: string | null;
};

const encoder = new TextEncoder();
const ROOM_RE = /^[a-z][a-z0-9_-]{0,31}:[a-z0-9][a-z0-9_-]{0,63}(\/[a-z][a-z0-9_-]{0,31}:[a-z0-9][a-z0-9_-]{0,63}){0,3}$/;
const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ADMIN_KEY_ID = 'root-v1';
const RATE_WINDOW_MS = 10_000;
const PER_TOKEN_SEND_LIMIT = 20;
const PER_ROOM_SEND_LIMIT = 60;
const BACKLOG_ROOM_LIMIT = 20;
const REPLAY_NONCE_RETENTION_MS = 10 * 60 * 1000;
const REPLAY_NONCE_CAP_PER_IDENTITY = 500;
const ROOM_AUDIT_CAP = 500;

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomHex(bytes = 32): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string | ArrayBuffer): Promise<string> {
  const data = typeof input === 'string' ? encoder.encode(input) : input;
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2) throw new Error('bad hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(keyBytes: Uint8Array, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

async function hkdf(secret: Uint8Array, salt: string, info: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: encoder.encode(salt),
    info: encoder.encode(info),
  }, key, 256);
  return new Uint8Array(bits);
}

function canonicalBodyJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalBodyJson(item)).join(',')}]`;
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalBodyJson(object[key])}`).join(',')}}`;
  }
  throw new Error('unsupported body json');
}

async function canonicalSendPayload(envelope: any): Promise<string> {
  const bodyHash = await sha256Hex(canonicalBodyJson(envelope.body));
  return [
    'intermesh.v1',
    envelope.id,
    envelope.nonce,
    envelope.room_id,
    envelope.to_identity,
    envelope.from_identity,
    envelope.created_at,
    bodyHash,
  ].join('\n');
}

async function deriveEnvelopeKey(tokenId: string, tokenSecret: string): Promise<Uint8Array> {
  return hkdf(encoder.encode(tokenSecret), tokenId, 'intermesh-v1/envelope');
}

async function deriveAdminKey(rootKeyHex: string): Promise<Uint8Array> {
  if (!/^[0-9a-f]{64}$/.test(rootKeyHex || '')) throw new Error('bad admin root key shape');
  return hkdf(hexToBytes(rootKeyHex), 'intermesh-v1/admin', 'intermesh-v1/admin/request-signing');
}

function canonicalQuery(params: URLSearchParams): string {
  const pairs = [...params.entries()];
  pairs.sort((a, b) => {
    const left = `${encodeURIComponent(a[0])}=${encodeURIComponent(a[1])}`;
    const right = `${encodeURIComponent(b[0])}=${encodeURIComponent(b[1])}`;
    return left < right ? -1 : left > right ? 1 : 0;
  });
  return pairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}

async function canonicalAdminPayload(request: Request, body: string, ts: string, nonce: string): Promise<string> {
  const url = new URL(request.url);
  return [
    request.method.toUpperCase(),
    url.pathname,
    canonicalQuery(url.searchParams),
    body ? await sha256Hex(body) : EMPTY_HASH,
    ts,
    nonce,
  ].join('\n');
}

function roomOk(roomId: string): boolean {
  return typeof roomId === 'string'
    && roomId.normalize('NFC') === roomId
    && new TextEncoder().encode(roomId).length <= 160
    && ROOM_RE.test(roomId);
}

function sqlJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

async function parseJson(request: Request): Promise<any> {
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

function getRegistry(env: Env): DurableObjectStub {
  return env.MESH_REGISTRY.get(env.MESH_REGISTRY.idFromName('registry-v1'));
}

function getRoom(env: Env): DurableObjectStub {
  return env.MESH_ROOM.get(env.MESH_ROOM.idFromName('global-v1'));
}

async function verifyAdmin(request: Request, env: Env, body: string, state: DurableObjectState): Promise<Response | null> {
  const rootKey = env.MESH_ADMIN_ROOT_KEY;
  if (!rootKey) return json({ error: 'admin key not configured' }, 503);
  const keyId = request.headers.get('X-Intermesh-Admin-Key-Id');
  const ts = request.headers.get('X-Intermesh-Admin-Ts');
  const nonce = request.headers.get('X-Intermesh-Admin-Nonce');
  const sig = request.headers.get('X-Intermesh-Admin-Sig') || '';
  if (keyId !== ADMIN_KEY_ID || !ts || !nonce || !sig.startsWith('hmac-sha256:')) {
    return json({ error: 'missing admin signature' }, 401);
  }
  if (Math.abs(Date.now() - Date.parse(ts)) > 5 * 60 * 1000) return json({ error: 'stale admin timestamp' }, 401);
  const seen = state.storage.sql.exec('SELECT nonce FROM admin_nonces WHERE key_id = ? AND nonce = ?', keyId, nonce).toArray();
  if (seen.length) return json({ error: 'admin replay' }, 401);
  const payload = await canonicalAdminPayload(request, body, ts, nonce);
  const expected = await hmacHex(await deriveAdminKey(rootKey), payload);
  if (expected !== sig.slice('hmac-sha256:'.length)) return json({ error: 'bad admin signature' }, 401);
  state.storage.sql.exec('INSERT INTO admin_nonces (key_id, nonce, ts) VALUES (?, ?, ?)', keyId, nonce, ts);
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({ status: 'ok', service: 'intermesh-v1', time: nowIso() });
    }
    if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/internal/')) {
      return getRegistry(env).fetch(request);
    }
    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      return getRoom(env).fetch(request);
    }
    return json({ error: 'not found' }, 404);
  },
};

export class MeshRegistry {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS tokens (token_id TEXT PRIMARY KEY, token_secret_hash TEXT NOT NULL, identity TEXT NOT NULL, display_name TEXT NOT NULL, team_id TEXT NOT NULL, room_ids TEXT NOT NULL, role TEXT NOT NULL, issued_at TEXT NOT NULL, expires_at TEXT, revoked_at TEXT, metadata_label TEXT, created_by TEXT NOT NULL, last_seen_at TEXT)');
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS admin_nonces (key_id TEXT NOT NULL, nonce TEXT NOT NULL, ts TEXT NOT NULL, PRIMARY KEY (key_id, nonce))');
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS audit (ts TEXT NOT NULL, kind TEXT NOT NULL, subject TEXT, payload TEXT)');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/internal/auth') return this.auth(await parseJson(request));
    if (url.pathname === '/internal/token') return this.tokenStatus(await parseJson(request));

    const body = request.method === 'GET' ? '' : await request.clone().text();
    const adminFailure = await verifyAdmin(request, this.env, body, this.state);
    if (adminFailure) return adminFailure;
    const payload = body ? JSON.parse(body) : {};

    if (url.pathname === '/admin/tokens/issue' && request.method === 'POST') return this.issue(payload);
    if (url.pathname === '/admin/teams/issue' && request.method === 'POST') return this.issueTeam(payload);
    if (url.pathname === '/admin/tokens' && request.method === 'GET') return this.list(url.searchParams.get('team_id'));
    if (url.pathname === '/admin/tokens/revoke' && request.method === 'POST') return this.revokeToken(payload.token_id);
    if (url.pathname === '/admin/teams/revoke' && request.method === 'POST') return this.revokeTeam(payload.team_id);
    if (url.pathname === '/admin/rooms/close' && request.method === 'POST') return this.closeRoom(payload.room_id);
    if (url.pathname === '/admin/rooms/inspect' && request.method === 'GET') return getRoom(this.env).fetch(new Request('https://internal/inspect'));
    if (url.pathname === '/admin/audit' && request.method === 'GET') return this.audit(url.searchParams.get('room_id'), url.searchParams.get('with_payload') === 'true');
    if (url.pathname === '/admin/join-package' && request.method === 'POST') return this.joinPackage(payload.token_id);
    if (url.pathname === '/admin/emergency/revoke-all' && request.method === 'POST') return this.revokeRoom(payload.room_id);
    return json({ error: 'admin not found' }, 404);
  }

  async auth(payload: any): Promise<Response> {
    const { token_id, token_secret, nonce, ts } = payload;
    if (!token_id || !token_secret || !nonce || !ts) return json({ ok: false, code: 'missing_token' }, 401);
    if (Math.abs(Date.now() - Date.parse(ts)) > 5 * 60 * 1000) return json({ ok: false, code: 'stale_timestamp' }, 401);
    const rows = this.state.storage.sql.exec('SELECT * FROM tokens WHERE token_id = ?', token_id).toArray() as any[];
    if (!rows.length) return json({ ok: false, code: 'token_invalid' }, 401);
    const token = rows[0] as any;
    if (token.revoked_at) return json({ ok: false, code: 'token_revoked' }, 401);
    if (token.expires_at && Date.parse(token.expires_at) < Date.now()) return json({ ok: false, code: 'token_invalid' }, 401);
    if (token.token_secret_hash !== await sha256Hex(token_secret)) return json({ ok: false, code: 'token_invalid' }, 401);
    this.state.storage.sql.exec('UPDATE tokens SET last_seen_at = ? WHERE token_id = ?', nowIso(), token_id);
    return json({
      ok: true,
      token: {
        token_id: token.token_id,
        identity: token.identity,
        display_name: token.display_name,
        team_id: token.team_id,
        room_ids: JSON.parse(token.room_ids),
        role: token.role,
        issued_at: token.issued_at,
      },
    });
  }

  async tokenStatus(payload: any): Promise<Response> {
    const rows = this.state.storage.sql.exec('SELECT token_id, revoked_at FROM tokens WHERE token_id = ?', payload.token_id).toArray() as any[];
    return json({ ok: !!rows.length, revoked_at: rows[0]?.revoked_at || null });
  }

  async issue(payload: any): Promise<Response> {
    const roomIds = payload.room_ids || [];
    if (!payload.identity || !Array.isArray(roomIds) || !roomIds.every(roomOk)) return json({ error: 'bad issue payload' }, 400);
    const tokenId = `tok_${randomHex(16)}`;
    const tokenSecret = randomHex(32);
    const issuedAt = nowIso();
    this.state.storage.sql.exec(
      'INSERT INTO tokens (token_id, token_secret_hash, identity, display_name, team_id, room_ids, role, issued_at, expires_at, revoked_at, metadata_label, created_by, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)',
      tokenId, await sha256Hex(tokenSecret), payload.identity, payload.display_name || payload.identity, payload.team_id || 'default', sqlJson(roomIds), payload.role || 'participant', issuedAt, payload.expires_at || null, payload.metadata_label || null, 'mesh-admin',
    );
    return json({ token_id: tokenId, token: `${tokenId}.${tokenSecret}`, identity: payload.identity, team_id: payload.team_id || 'default', room_ids: roomIds, issued_at: issuedAt });
  }

  async issueTeam(payload: any): Promise<Response> {
    const count = Math.max(1, Math.min(50, Number(payload.count || 1)));
    const tokens = [];
    for (let i = 0; i < count; i += 1) {
      const issued = await this.issue({
        identity: `${payload.identity_prefix || 'guest'}-${i + 1}@${payload.team_id}`,
        display_name: `${payload.identity_prefix || 'guest'} ${i + 1}`,
        team_id: payload.team_id,
        room_ids: payload.room_ids,
        role: payload.role || 'participant',
      });
      tokens.push(await issued.json());
    }
    return json({ tokens });
  }

  list(teamId: string | null): Response {
    const sql = teamId ? 'SELECT * FROM tokens WHERE team_id = ?' : 'SELECT * FROM tokens';
    const rows = (teamId ? this.state.storage.sql.exec(sql, teamId) : this.state.storage.sql.exec(sql)).toArray() as any[];
    return json({
      tokens: rows.map((row) => {
        const { token_secret_hash: _tokenSecretHash, ...safeRow } = row;
        return { ...safeRow, room_ids: JSON.parse(row.room_ids) };
      }),
    });
  }

  async revokeToken(tokenId: string): Promise<Response> {
    this.state.storage.sql.exec('UPDATE tokens SET revoked_at = ? WHERE token_id = ?', nowIso(), tokenId);
    await getRoom(this.env).fetch(new Request('https://internal/internal/revoke', { method: 'POST', body: JSON.stringify({ token_ids: [tokenId] }) }));
    return json({ status: 'revoked', token_id: tokenId });
  }

  async revokeTeam(teamId: string): Promise<Response> {
    const rows = this.state.storage.sql.exec('SELECT token_id FROM tokens WHERE team_id = ? AND revoked_at IS NULL', teamId).toArray() as any[];
    const ids = rows.map((row) => row.token_id);
    this.state.storage.sql.exec('UPDATE tokens SET revoked_at = ? WHERE team_id = ?', nowIso(), teamId);
    await getRoom(this.env).fetch(new Request('https://internal/internal/revoke', { method: 'POST', body: JSON.stringify({ token_ids: ids }) }));
    return json({ status: 'revoked', team_id: teamId, token_ids: ids });
  }

  async revokeRoom(roomId: string): Promise<Response> {
    const rows = this.state.storage.sql.exec('SELECT token_id, room_ids FROM tokens WHERE revoked_at IS NULL').toArray() as any[];
    const ids = rows.filter((row) => JSON.parse(row.room_ids).includes(roomId)).map((row) => row.token_id);
    for (const id of ids) this.state.storage.sql.exec('UPDATE tokens SET revoked_at = ? WHERE token_id = ?', nowIso(), id);
    await getRoom(this.env).fetch(new Request('https://internal/internal/revoke', { method: 'POST', body: JSON.stringify({ token_ids: ids }) }));
    return json({ status: 'revoked', room_id: roomId, token_ids: ids });
  }

  async closeRoom(roomId: string): Promise<Response> {
    await getRoom(this.env).fetch(new Request('https://internal/internal/close-room', { method: 'POST', body: JSON.stringify({ room_id: roomId }) }));
    return json({ status: 'closed', room_id: roomId });
  }

  audit(roomId: string | null, withPayload: boolean): Response {
    let auditRowId: number | null = null;
    if (withPayload) {
      this.state.storage.sql.exec(
        'INSERT INTO audit (ts, kind, subject, payload) VALUES (?, ?, ?, ?)',
        nowIso(),
        'payload_tail',
        roomId || null,
        JSON.stringify({ room_id: roomId, with_payload: true }),
      );
      auditRowId = (this.state.storage.sql.exec('SELECT last_insert_rowid() AS id').toArray()[0] as any)?.id || null;
    }
    const rows = roomId
      ? this.state.storage.sql.exec('SELECT rowid AS audit_row_id, ts, kind, subject, payload FROM audit WHERE subject = ? ORDER BY ts DESC LIMIT 500', roomId).toArray()
      : this.state.storage.sql.exec('SELECT rowid AS audit_row_id, ts, kind, subject, payload FROM audit ORDER BY ts DESC LIMIT 500').toArray();
    return json({ audit_row_id: auditRowId, audit: rows });
  }

  joinPackage(tokenId: string): Response {
    const rows = this.state.storage.sql.exec('SELECT token_id, identity, team_id, room_ids, role FROM tokens WHERE token_id = ?', tokenId).toArray() as any[];
    if (!rows.length) return json({ error: 'token not found' }, 404);
    const row = rows[0] as any;
    return json({
      README: 'Place the one-time token in ~/.interlateral/intermesh/token with mode 0600, then run mesh-receiver.js start.',
      config: { url: 'wss://mesh.interlateral.com', identity: row.identity, team_id: row.team_id, room_ids: JSON.parse(row.room_ids), role: row.role },
    });
  }
}

export class MeshRoom {
  state: DurableObjectState;
  env: Env;
  sessionKeys: Map<string, string>;
  tokenWindows: Map<string, number[]>;
  roomWindows: Map<string, number[]>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessionKeys = new Map();
    this.tokenWindows = new Map();
    this.roomWindows = new Map();
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS messages (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL, room_id TEXT NOT NULL, to_identity TEXT NOT NULL, from_identity TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL)');
    this.state.storage.sql.exec('CREATE UNIQUE INDEX IF NOT EXISTS messages_unique ON messages(id, room_id, from_identity)');
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS envelope_nonces (room_id TEXT NOT NULL, from_identity TEXT NOT NULL, nonce TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (room_id, from_identity, nonce))');
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS audit (ts TEXT NOT NULL, kind TEXT NOT NULL, room_id TEXT, payload TEXT)');
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS closed_rooms (room_id TEXT PRIMARY KEY, closed_at TEXT NOT NULL)');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/internal/revoke') return this.revoke(await parseJson(request));
    if (url.pathname === '/internal/close-room') return this.closeRoom(await parseJson(request));
    if (url.pathname === '/inspect') return this.inspect();
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'websocket required' }, 426);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ authenticated: false, connected_at: nowIso() });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    let frame: any;
    try {
      frame = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      ws.send(JSON.stringify({ type: 'error', code: 'server_error', message: 'bad json' }));
      return;
    }
    const attachment = (ws.deserializeAttachment() || {}) as any;
    if (!attachment.authenticated) {
      if (frame.type !== 'auth') {
        ws.send(JSON.stringify({ type: 'error', code: 'missing_token', message: 'auth first' }));
        ws.close(1008, 'auth required');
        return;
      }
      await this.handleAuth(ws, frame);
      return;
    }
    if (frame.type === 'send') return this.handleSend(ws, attachment, frame);
    if (frame.type === 'backlog_request') return this.handleBacklog(ws, attachment, frame);
    if (frame.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', server_time: nowIso() }));
      return;
    }
    if (frame.type === 'ack') return this.handleAck(ws, attachment, frame);
    ws.send(JSON.stringify({ type: 'error', code: 'server_error', message: 'unsupported frame' }));
  }

  async handleAuth(ws: WebSocket, frame: any): Promise<void> {
    const authResponse = await getRegistry(this.env).fetch(new Request('https://internal/internal/auth', {
      method: 'POST',
      body: JSON.stringify(frame),
    }));
    const auth = await authResponse.json() as any;
    if (!auth.ok) {
      ws.send(JSON.stringify({ type: 'error', code: auth.code || 'token_invalid' }));
      ws.close(1008, auth.code || 'token_invalid');
      return;
    }
    const openRoomIds = [];
    for (const roomId of auth.token.room_ids) {
      if (!(await this.isRoomClosed(roomId))) openRoomIds.push(roomId);
    }
    if (!openRoomIds.length) {
      ws.send(JSON.stringify({ type: 'error', code: 'room_forbidden', message: 'all token rooms are closed' }));
      ws.close(1008, 'room_forbidden');
      return;
    }
    const sessionId = randomHex(16);
    const envelopeKey = await deriveEnvelopeKey(frame.token_id, frame.token_secret);
    this.sessionKeys.set(sessionId, bytesToHex(envelopeKey.buffer));
    const attachment = {
      authenticated: true,
      session_id: sessionId,
      token_id: auth.token.token_id,
      identity: auth.token.identity,
      team_id: auth.token.team_id,
      role: auth.token.role,
      room_ids: openRoomIds,
      issued_at: auth.token.issued_at,
    };
    for (const other of this.state.getWebSockets()) {
      const otherAttachment = (other.deserializeAttachment() || {}) as any;
      if (other !== ws && otherAttachment.token_id === attachment.token_id) {
        other.send(JSON.stringify({ type: 'error', code: 'token_reauth', message: 'new socket authenticated' }));
        if (otherAttachment.session_id) this.sessionKeys.delete(otherAttachment.session_id);
        setTimeout(() => other.close(4001, 'token_reauth'), 5000);
      }
    }
    ws.serializeAttachment(attachment);
    ws.send(JSON.stringify({ type: 'auth_ok', identity: attachment.identity, team_id: attachment.team_id, role: attachment.role, rooms: attachment.room_ids, server_time: nowIso() }));
  }

  webSocketClose(ws: WebSocket): void {
    this.cleanupSessionKey(ws);
  }

  webSocketError(ws: WebSocket): void {
    this.cleanupSessionKey(ws);
  }

  cleanupSessionKey(ws: WebSocket): void {
    const attachment = (ws.deserializeAttachment() || {}) as any;
    if (attachment.session_id) this.sessionKeys.delete(attachment.session_id);
  }

  async handleSend(ws: WebSocket, attachment: any, frame: any): Promise<void> {
    const envelope = frame.envelope;
    if (!envelope || envelope.from_identity !== attachment.identity) return this.sendError(ws, 'identity_mismatch', envelope?.id);
    if (!roomOk(envelope.room_id)) return this.sendError(ws, 'bad_room_id', envelope.id);
    if (!attachment.room_ids.includes(envelope.room_id)) return this.sendError(ws, 'room_forbidden', envelope.id);
    if (await this.isRoomClosed(envelope.room_id)) return this.sendError(ws, 'room_forbidden', envelope.id);
    if (Math.abs(Date.now() - Date.parse(envelope.created_at)) > 5 * 60 * 1000) return this.sendError(ws, 'stale_timestamp', envelope.id);
    if (new TextEncoder().encode(JSON.stringify(envelope.body || {})).length > 256 * 1024) return this.sendError(ws, 'payload_too_large', envelope.id);
    const sessionKeyHex = this.sessionKeys.get(attachment.session_id);
    if (!sessionKeyHex) return this.sendError(ws, 'token_reauth', envelope.id);
    const expected = await hmacHex(hexToBytes(sessionKeyHex), await canonicalSendPayload(envelope));
    if (frame.sig !== `hmac-sha256:${expected}`) return this.sendError(ws, 'bad_hmac', envelope.id);
    const duplicateId = this.state.storage.sql.exec(
      'SELECT id FROM messages WHERE id = ? AND room_id = ? AND from_identity = ?',
      envelope.id,
      envelope.room_id,
      envelope.from_identity,
    ).toArray();
    const duplicateNonce = this.state.storage.sql.exec(
      'SELECT nonce FROM envelope_nonces WHERE room_id = ? AND from_identity = ? AND nonce = ?',
      envelope.room_id,
      envelope.from_identity,
      envelope.nonce,
    ).toArray();
    if (duplicateId.length || duplicateNonce.length) return this.sendError(ws, 'replay', envelope.id);
    const tokenLimit = this.consumeRate(this.tokenWindows, attachment.token_id, PER_TOKEN_SEND_LIMIT);
    if (!tokenLimit.ok) return this.sendError(ws, 'rate_limited_token', envelope.id);
    const roomLimit = this.consumeRate(this.roomWindows, envelope.room_id, PER_ROOM_SEND_LIMIT);
    if (!roomLimit.ok) return this.sendError(ws, 'rate_limited_room', envelope.id);
    this.state.storage.sql.exec('INSERT INTO envelope_nonces (room_id, from_identity, nonce, created_at) VALUES (?, ?, ?, ?)', envelope.room_id, envelope.from_identity, envelope.nonce, envelope.created_at);
    this.pruneReplayNonces(envelope.room_id, envelope.from_identity);
    this.state.storage.sql.exec('INSERT INTO messages (id, room_id, to_identity, from_identity, envelope, created_at) VALUES (?, ?, ?, ?, ?, ?)', envelope.id, envelope.room_id, envelope.to_identity, envelope.from_identity, JSON.stringify(envelope), envelope.created_at);
    this.enforceBacklogLimit(envelope.room_id);
    const rows = this.state.storage.sql.exec('SELECT seq FROM messages WHERE id = ? AND room_id = ? AND from_identity = ?', envelope.id, envelope.room_id, envelope.from_identity).toArray() as any[];
    const roomSeq = rows[0]?.seq || null;
    ws.send(JSON.stringify({ type: 'accepted', id: envelope.id, room_id: envelope.room_id, room_seq: roomSeq }));
    await this.route(envelope.room_id, envelope.to_identity, { type: 'delivered', envelope, id: envelope.id, room_id: envelope.room_id, to_identity: envelope.to_identity, dispatch: 'attempted' });
  }

  consumeRate(windows: Map<string, number[]>, key: string, limit: number): { ok: boolean; count: number } {
    const currentTime = Date.now();
    const current = (windows.get(key) || []).filter((ts) => currentTime - ts < RATE_WINDOW_MS);
    if (current.length >= limit) {
      windows.set(key, current);
      return { ok: false, count: current.length };
    }
    current.push(currentTime);
    windows.set(key, current);
    return { ok: true, count: current.length };
  }

  enforceBacklogLimit(roomId: string): void {
    const rows = this.state.storage.sql.exec(
      'SELECT seq FROM messages WHERE room_id = ? ORDER BY seq DESC LIMIT 1 OFFSET ?',
      roomId,
      BACKLOG_ROOM_LIMIT - 1,
    ).toArray() as any[];
    const cutoff = rows[0]?.seq;
    if (!cutoff) return;
    const dropped = this.state.storage.sql.exec('SELECT COUNT(*) AS count FROM messages WHERE room_id = ? AND seq < ?', roomId, cutoff).toArray() as any[];
    const count = dropped[0]?.count || 0;
    if (!count) return;
    this.state.storage.sql.exec('DELETE FROM messages WHERE room_id = ? AND seq < ?', roomId, cutoff);
    this.state.storage.sql.exec(
      'INSERT INTO audit (ts, kind, room_id, payload) VALUES (?, ?, ?, ?)',
      nowIso(),
      'backlog_overflow',
      roomId,
      JSON.stringify({ dropped: count, retained: BACKLOG_ROOM_LIMIT }),
    );
    this.pruneRoomAudit();
  }

  pruneReplayNonces(roomId: string, fromIdentity: string): void {
    const cutoff = new Date(Date.now() - REPLAY_NONCE_RETENTION_MS).toISOString();
    this.state.storage.sql.exec('DELETE FROM envelope_nonces WHERE created_at < ?', cutoff);
    this.state.storage.sql.exec(
      `DELETE FROM envelope_nonces
       WHERE room_id = ? AND from_identity = ? AND rowid NOT IN (
         SELECT rowid FROM envelope_nonces
         WHERE room_id = ? AND from_identity = ?
         ORDER BY created_at DESC
         LIMIT ?
       )`,
      roomId,
      fromIdentity,
      roomId,
      fromIdentity,
      REPLAY_NONCE_CAP_PER_IDENTITY,
    );
  }

  pruneRoomAudit(): void {
    this.state.storage.sql.exec(
      `DELETE FROM audit
       WHERE rowid NOT IN (
         SELECT rowid FROM audit ORDER BY rowid DESC LIMIT ?
       )`,
      ROOM_AUDIT_CAP,
    );
  }

  async handleBacklog(ws: WebSocket, attachment: any, frame: any): Promise<void> {
    const roomId = frame.room_id;
    if (!roomOk(roomId)) return this.sendError(ws, 'bad_room_id');
    if (!attachment.room_ids.includes(roomId)) return this.sendError(ws, 'room_forbidden');
    if (await this.isRoomClosed(roomId)) return this.sendError(ws, 'room_forbidden');
    const limit = Math.max(1, Math.min(200, Number(frame.limit || 50)));
    const rows = this.state.storage.sql.exec(
      'SELECT seq, envelope FROM messages WHERE room_id = ? AND to_identity = ? AND seq > ? ORDER BY seq ASC LIMIT ?',
      roomId,
      attachment.identity,
      Number(frame.after_id || 0),
      limit,
    ).toArray() as any[];
    ws.send(JSON.stringify({ type: 'backlog_batch', room_id: roomId, frames: rows.map((row) => ({ ...JSON.parse(row.envelope), via_backlog: true, room_seq: row.seq })), has_more: rows.length === limit }));
  }

  async handleAck(ws: WebSocket, attachment: any, frame: any): Promise<void> {
    const roomId = frame.room_id || frame.envelope?.room_id;
    if (!roomOk(roomId)) return this.sendError(ws, 'bad_room_id', frame.id || null);
    if (!attachment.room_ids.includes(roomId)) return this.sendError(ws, 'room_forbidden', frame.id || null);
    if (await this.isRoomClosed(roomId)) return this.sendError(ws, 'room_forbidden', frame.id || null);
    if (frame.ack_by && frame.ack_by !== attachment.identity) return this.sendError(ws, 'identity_mismatch', frame.id || null);
    const rows = this.state.storage.sql.exec(
      'SELECT from_identity, to_identity FROM messages WHERE id = ? AND room_id = ? ORDER BY seq DESC LIMIT 1',
      frame.id,
      roomId,
    ).toArray() as any[];
    const message = rows[0];
    if (!message || message.to_identity !== attachment.identity) return this.sendError(ws, 'identity_mismatch', frame.id || null);
    await this.route(roomId, message.from_identity, {
      type: 'ack',
      id: frame.id,
      room_id: roomId,
      ack_by: attachment.identity,
      ack_at: nowIso(),
    });
  }

  async route(roomId: string, toIdentity: string, payload: unknown): Promise<void> {
    for (const socket of this.state.getWebSockets()) {
      const attachment = (socket.deserializeAttachment() || {}) as any;
      if (attachment.authenticated && attachment.identity === toIdentity && attachment.room_ids.includes(roomId)) {
        socket.send(JSON.stringify(payload));
      }
    }
  }

  sendError(ws: WebSocket, code: string, id: string | null = null): void {
    ws.send(JSON.stringify({ type: 'error', code, id }));
  }

  async isRoomClosed(roomId: string): Promise<boolean> {
    const rows = this.state.storage.sql.exec('SELECT room_id FROM closed_rooms WHERE room_id = ?', roomId).toArray();
    return rows.length > 0;
  }

  async revoke(payload: any): Promise<Response> {
    const ids = new Set(payload.token_ids || []);
    for (const socket of this.state.getWebSockets()) {
      const attachment = (socket.deserializeAttachment() || {}) as any;
      if (ids.has(attachment.token_id)) {
        socket.send(JSON.stringify({ type: 'error', code: 'token_revoked' }));
        if (attachment.session_id) this.sessionKeys.delete(attachment.session_id);
        socket.close(4003, 'token_revoked');
      }
    }
    return json({ status: 'ok', closed: ids.size });
  }

  async closeRoom(payload: any): Promise<Response> {
    if (!roomOk(payload.room_id)) return json({ error: 'bad_room_id' }, 400);
    this.state.storage.sql.exec('INSERT OR REPLACE INTO closed_rooms (room_id, closed_at) VALUES (?, ?)', payload.room_id, nowIso());
    for (const socket of this.state.getWebSockets()) {
      const attachment = (socket.deserializeAttachment() || {}) as any;
      if (attachment.room_ids?.includes(payload.room_id)) {
        socket.send(JSON.stringify({ type: 'error', code: 'room_closed', room_id: payload.room_id }));
        if (attachment.session_id) this.sessionKeys.delete(attachment.session_id);
        socket.close(4004, 'room_closed');
      }
    }
    return json({ status: 'ok' });
  }

  inspect(): Response {
    return json({
      sockets: this.state.getWebSockets().map((socket) => {
        const attachment = (socket.deserializeAttachment() || {}) as any;
        return { token_id: attachment.token_id || null, identity: attachment.identity || null, rooms: attachment.room_ids || [] };
      }),
      message_count: (this.state.storage.sql.exec('SELECT COUNT(*) AS count FROM messages').toArray()[0] as any)?.count || 0,
      closed_rooms: this.state.storage.sql.exec('SELECT * FROM closed_rooms ORDER BY closed_at DESC').toArray(),
      audit: this.state.storage.sql.exec('SELECT rowid AS audit_row_id, ts, kind, room_id, payload FROM audit ORDER BY rowid DESC LIMIT 100').toArray(),
    });
  }
}
