#!/usr/bin/env node
const os = require('os');

function getIdentity() {
  return {
    team: process.env.INTERLATERAL_TEAM_ID || 'platform',
    sender: process.env.INTERLATERAL_SENDER || 'relay',
    host: os.hostname(),
    sid: process.env.INTERLATERAL_SESSION_ID || `session_${Date.now()}`,
  };
}

function identityStamp() {
  const id = getIdentity();
  return `[ID team=${id.team} sender=${id.sender} host=${id.host} sid=${id.sid}]`;
}

function stampMessage(message) {
  if (process.env.INTERLATERAL_DISABLE_STAMP === 'true') return message;
  if (!message || typeof message !== 'string') return message;
  if (message.startsWith('[ID ')) return message;
  return `${identityStamp()} ${message}`;
}

module.exports = { getIdentity, identityStamp, stampMessage };
