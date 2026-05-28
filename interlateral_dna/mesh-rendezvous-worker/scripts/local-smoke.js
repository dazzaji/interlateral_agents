#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');
const localToml = fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8');
const deployToml = fs.readFileSync(path.join(root, 'wrangler.deploy.toml'), 'utf8');

const checks = [
  ['exports MeshRegistry', /export\s+class\s+MeshRegistry/.test(source)],
  ['exports MeshRoom', /export\s+class\s+MeshRoom/.test(source)],
  ['uses WebSocket hibernation API', /state\.acceptWebSocket\(server\)/.test(source)],
  ['does not use ws.accept()', !/\.accept\(\)/.test(source)],
  ['hibernation attachment excludes envelope key', !/serializeAttachment\([^)]*envelope_key/i.test(source)],
  ['session key is live-memory only', /sessionKeys:\s*Map<string,\s*string>/.test(source) && /this\.sessionKeys\.set\(sessionId/.test(source) && !/state\.storage\.put\(`session_key/.test(source)],
  ['missing live session key forces reauth', /token_reauth/.test(source) && /this\.sessionKeys\.get\(attachment\.session_id\)/.test(source)],
  ['session key is cleaned on close and error', /webSocketClose\(ws: WebSocket\)/.test(source) && /webSocketError\(ws: WebSocket\)/.test(source) && /cleanupSessionKey\(ws\)/.test(source)],
  ['session key created after open-room check', source.indexOf('if (!openRoomIds.length)') < source.indexOf('this.sessionKeys.set(sessionId')],
  ['ack handler validates authenticated identity', /handleAck/.test(source) && /frame\.ack_by && frame\.ack_by !== attachment\.identity/.test(source) && /message\.to_identity !== attachment\.identity/.test(source)],
  ['closed rooms are persisted', /CREATE TABLE IF NOT EXISTS closed_rooms/.test(source) && /INSERT OR REPLACE INTO closed_rooms/.test(source)],
  ['send rejects closed rooms', /isRoomClosed\(envelope\.room_id\)/.test(source)],
  ['backlog rejects closed rooms', /isRoomClosed\(roomId\)/.test(source)],
  ['replay table and error exist', /CREATE TABLE IF NOT EXISTS envelope_nonces/.test(source) && /sendError\(ws,\s*'replay'/.test(source)],
  ['replay nonces are pruned', /REPLAY_NONCE_RETENTION_MS/.test(source) && /REPLAY_NONCE_CAP_PER_IDENTITY/.test(source) && /pruneReplayNonces/.test(source)],
  ['rate limit errors exist', /rate_limited_token/.test(source) && /rate_limited_room/.test(source) && /PER_TOKEN_SEND_LIMIT/.test(source) && /PER_ROOM_SEND_LIMIT/.test(source)],
  ['backlog overflow audit exists and is bounded', /BACKLOG_ROOM_LIMIT/.test(source) && /backlog_overflow/.test(source) && /ROOM_AUDIT_CAP/.test(source) && /pruneRoomAudit/.test(source)],
  ['room audit is inspectable', /SELECT rowid AS audit_row_id, ts, kind, room_id, payload FROM audit/.test(source)],
  ['payload tail audit row exists', /payload_tail/.test(source) && /audit_row_id/.test(source)],
  ['internal registry auth URL keeps /internal path', /https:\/\/internal\/internal\/auth/.test(source) && !/https:\/\/internal\/auth/.test(source)],
  ['internal room control URLs keep /internal path', /https:\/\/internal\/internal\/revoke/.test(source) && /https:\/\/internal\/internal\/close-room/.test(source) && !/https:\/\/internal\/revoke/.test(source) && !/https:\/\/internal\/close-room/.test(source)],
  ['local durable object binding registry', /name\s*=\s*"MESH_REGISTRY"/.test(localToml)],
  ['local durable object binding room', /name\s*=\s*"MESH_ROOM"/.test(localToml)],
  ['deploy custom domain route', /mesh\.interlateral\.com/.test(deployToml) && /custom_domain\s*=\s*true/.test(deployToml)],
  ['sqlite migration for both classes', /new_sqlite_classes\s*=\s*\["MeshRegistry",\s*"MeshRoom"\]/.test(deployToml)],
];

const failures = checks.filter(([, ok]) => !ok);
const checkedAt = new Date().toISOString();
const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  classification: 'PRE_G0A_STATIC_SOURCE_CONFIG_SMOKE',
  gate_acceptance: false,
  checked_at: checkedAt,
  checks: checks.map(([name, ok]) => ({ name, ok })),
  worker_source: path.join(root, 'src/index.ts'),
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
