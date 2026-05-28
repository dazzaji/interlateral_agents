const os = require('os');
const path = require('path');

function expandHome(value) {
  if (!value) return value;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return value;
}

function intermeshHome(override) {
  return path.resolve(expandHome(override || process.env.INTERMESH_HOME || '~/.interlateral/intermesh'));
}

function defaultPaths(homeOverride) {
  const home = intermeshHome(homeOverride);
  return {
    home,
    config: path.join(home, 'config.json'),
    token: path.join(home, 'token'),
    state: path.join(home, 'receiver-state.json'),
    dispatchLru: path.join(home, 'dispatch-lru.json'),
    log: path.join(home, 'receiver.log'),
    lock: path.join(home, 'receiver.lock'),
    outboundLedger: path.join(home, 'outbound-ledger.jsonl'),
    inboundLedger: path.join(home, 'inbound-ledger.jsonl'),
  };
}

module.exports = {
  expandHome,
  intermeshHome,
  defaultPaths,
};
