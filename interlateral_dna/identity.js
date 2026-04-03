#!/usr/bin/env node
const os = require('os');

function getIdentity() {
  return {
    team: process.env.INTERLATERAL_TEAM_ID || 'agents',
    sender: process.env.INTERLATERAL_SENDER || 'relay',
    agent_type: process.env.INTERLATERAL_AGENT_TYPE || '',
    host: os.hostname(),
    sid: process.env.INTERLATERAL_SESSION_ID || `session_${Date.now()}`,
  };
}

function identityStamp() {
  const id = getIdentity();
  const parts = [
    `team=${id.team}`,
    `sender=${id.sender}`,
    id.agent_type ? `agent_type=${id.agent_type}` : null,
    `host=${id.host}`,
    `sid=${id.sid}`,
  ].filter(Boolean);
  return `[ID ${parts.join(' ')}]`;
}

function stampMessage(message) {
  if (process.env.INTERLATERAL_DISABLE_STAMP === 'true') return message;
  if (!message || typeof message !== 'string') return message;
  if (message.startsWith('[ID ')) return message;
  return `${identityStamp()} ${message}`;
}

module.exports = { getIdentity, identityStamp, stampMessage };
