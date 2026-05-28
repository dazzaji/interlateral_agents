const ROOM_RE = /^[a-z][a-z0-9_-]{0,31}:[a-z0-9][a-z0-9_-]{0,63}(\/[a-z][a-z0-9_-]{0,31}:[a-z0-9][a-z0-9_-]{0,63}){0,3}$/;

function validateRoomId(roomId) {
  if (typeof roomId !== 'string' || roomId.length === 0) {
    return { ok: false, code: 'bad_room_id', reason: 'room_id is required' };
  }
  const normalized = roomId.normalize('NFC');
  if (normalized !== roomId) {
    return { ok: false, code: 'bad_room_id', reason: 'room_id must be NFC normalized' };
  }
  if (Buffer.byteLength(roomId, 'utf8') > 160) {
    return { ok: false, code: 'bad_room_id', reason: 'room_id exceeds 160 bytes' };
  }
  if (!ROOM_RE.test(roomId)) {
    return { ok: false, code: 'bad_room_id', reason: 'room_id grammar mismatch' };
  }
  return { ok: true };
}

function assertRoomId(roomId) {
  const result = validateRoomId(roomId);
  if (!result.ok) {
    const err = new Error(result.reason);
    err.code = result.code;
    throw err;
  }
  return roomId;
}

module.exports = {
  ROOM_RE,
  validateRoomId,
  assertRoomId,
};
