const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

function registryPath() {
  return process.env.INTERMESH_RECEIVER_REGISTRY || path.join(os.tmpdir(), 'intermesh-receiver-registry.json');
}

function pidAlive(pid) {
  if (!pid || !Number.isInteger(Number(pid))) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function tokenSha256(tokenFile) {
  const token = fs.readFileSync(tokenFile, 'utf8').trim();
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readRegistry(file = registryPath()) {
  try {
    const registry = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(registry.receivers) ? registry.receivers : [];
  } catch {
    return [];
  }
}

function writeRegistry(receivers, file = registryPath()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({
    updated_at: new Date().toISOString(),
    receivers,
  }, null, 2));
}

function pruneRegistry(file = registryPath()) {
  const receivers = readRegistry(file).filter((entry) => pidAlive(entry.pid));
  writeRegistry(receivers, file);
  return receivers;
}

function registerReceiver({ tokenFile, home, pid = process.pid }) {
  const file = registryPath();
  const token_sha256 = tokenSha256(tokenFile);
  const receivers = pruneRegistry(file).filter((entry) => Number(entry.pid) !== Number(pid));
  const entry = {
    pid,
    home,
    token_sha256,
    started_at: new Date().toISOString(),
  };
  receivers.push(entry);
  writeRegistry(receivers, file);
  return entry;
}

function unregisterReceiver({ pid = process.pid } = {}) {
  const file = registryPath();
  const receivers = readRegistry(file).filter((entry) => Number(entry.pid) !== Number(pid));
  writeRegistry(receivers, file);
}

function activeReceiverForTokenFile(tokenFile) {
  const token_sha256 = tokenSha256(tokenFile);
  return pruneRegistry().find((entry) => entry.token_sha256 === token_sha256) || null;
}

module.exports = {
  activeReceiverForTokenFile,
  registerReceiver,
  registryPath,
  unregisterReceiver,
};
