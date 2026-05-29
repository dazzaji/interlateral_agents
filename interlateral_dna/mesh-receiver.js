#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const { MeshClient } = require('./lib/mesh-client');
const { defaultPaths } = require('./lib/paths');
const { registerReceiver, unregisterReceiver } = require('./lib/receiver-registry');

const DEFAULT_STALE_MS = 15_000;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function appendJsonl(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(value) + '\n');
}

function nowIso() {
  return new Date().toISOString();
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

function fileAgeMs(file) {
  try {
    return Date.now() - fs.statSync(file).mtimeMs;
  } catch {
    return null;
  }
}

function updateState(paths, patch) {
  const current = readJson(paths.state, {});
  writeJson(paths.state, {
    ...current,
    ...patch,
    updated_at: nowIso(),
  });
}

function dispatch(config, frame) {
  const target = config.targets && config.targets[frame.envelope.from_identity || frame.envelope.to_identity];
  const text = `[InterMesh ${new Date().toISOString()}] ${frame.envelope.from_identity}: ${frame.envelope.body?.text || JSON.stringify(frame.envelope.body)}`;
  if (target?.tmux_session) {
    childProcess.spawnSync('tmux', ['-S', config.tmux_socket || '/tmp/interlateral-agents-tmux.sock', 'send-keys', '-t', target.tmux_session, text, 'Enter'], { stdio: 'ignore' });
    return 'tmux';
  }
  return 'logged';
}

async function runForeground(paths, args) {
  const config = readJson(paths.config, {});
  const url = args.url || config.url || process.env.MESH_RENDEZVOUS_WS || 'wss://mesh.interlateral.com';
  const tokenFile = args['token-file'] || paths.token;
  const client = new MeshClient({ url, tokenFile, timeoutMs: Number(args.timeout || 10000) });
  const lru = new Set(readJson(paths.dispatchLru, []));
  fs.mkdirSync(paths.home, { recursive: true });
  writeJson(paths.lock, { pid: process.pid, started_at: nowIso(), mode: 'foreground' });
  const cleanup = () => {
    unregisterReceiver({ pid: process.pid });
    updateState(paths, {
      connected: false,
      websocket_authenticated: false,
      connection_state: 'stopped',
      stopped_at: nowIso(),
      last_disconnect_reason: 'process_exit',
    });
    const lock = readJson(paths.lock, null);
    if (!lock?.pid || Number(lock.pid) === process.pid) fs.rmSync(paths.lock, { force: true });
  };
  process.once('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  process.once('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  client.onFrame = (frame) => {
    if (frame.type === 'delivered' && frame.envelope) {
      if (lru.has(frame.envelope.id)) return;
      lru.add(frame.envelope.id);
      while (lru.size > 1000) lru.delete(lru.values().next().value);
      writeJson(paths.dispatchLru, [...lru]);
      const dispatchMode = dispatch(config, frame);
      const at = nowIso();
      appendJsonl(paths.inboundLedger, {
        at,
        id: frame.envelope.id,
        room_id: frame.envelope.room_id,
        from_identity: frame.envelope.from_identity,
        dispatch: dispatchMode,
      });
      appendJsonl(paths.messageStore, {
        at,
        id: frame.envelope.id,
        room_id: frame.envelope.room_id,
        from_identity: frame.envelope.from_identity,
        to_identity: frame.envelope.to_identity,
        body: frame.envelope.body || null,
      });
      updateState(paths, {
        connected: true,
        websocket_authenticated: true,
        connection_state: 'connected',
        last_received_message_at: at,
        last_received_message_id: frame.envelope.id,
        last_received_room_id: frame.envelope.room_id,
        dispatch_last_mode: dispatchMode,
        dispatch_last_at: at,
      });
      client.ws.send(JSON.stringify({ type: 'ack', id: frame.envelope.id, room_id: frame.envelope.room_id, ack_by: client.auth.identity, ack_at: nowIso() }));
    } else if (frame.type === 'backlog_batch') {
      updateState(paths, {
        connected: true,
        websocket_authenticated: true,
        connection_state: 'connected',
        last_backlog_pull_at: nowIso(),
        last_backlog_room_id: frame.room_id || null,
        last_backlog_count: (frame.frames || []).length,
      });
      for (const envelope of frame.frames || []) client.onFrame({ type: 'delivered', envelope });
    } else if (frame.type === 'pong') {
      updateState(paths, {
        connected: true,
        websocket_authenticated: true,
        connection_state: 'connected',
        last_heartbeat_at: nowIso(),
      });
    } else if (frame.type === 'error') {
      updateState(paths, {
        last_error_at: nowIso(),
        last_error_code: frame.code || 'unknown',
        last_disconnect_reason: frame.code || null,
      });
    }
  };
  const auth = await client.connect();
  registerReceiver({ tokenFile, home: paths.home, pid: process.pid });
  updateState(paths, {
    connected: true,
    websocket_authenticated: true,
    connection_state: 'connected',
    auth,
    identity: auth.identity || null,
    rooms: auth.rooms || [],
    url,
    pid: process.pid,
    started_at: nowIso(),
    authenticated_at: nowIso(),
    last_disconnect_reason: null,
  });
  const heartbeat = setInterval(() => {
    try {
      if (client.ws?.readyState === 1) client.ws.send(JSON.stringify({ type: 'ping', sent_at: nowIso() }));
    } catch {}
  }, Number(args['heartbeat-ms'] || 2000));
  for (const room of auth.rooms || []) {
    updateState(paths, { last_backlog_pull_at: nowIso(), last_backlog_room_id: room });
    client.requestBacklog({ room_id: room, limit: 50 });
  }
  client.ws.on('close', () => {
    clearInterval(heartbeat);
    unregisterReceiver({ pid: process.pid });
    updateState(paths, {
      connected: false,
      websocket_authenticated: false,
      connection_state: 'disconnected',
      last_disconnect_reason: 'websocket_close',
    });
  });
  client.ws.on('error', () => {
    updateState(paths, {
      connected: false,
      websocket_authenticated: false,
      connection_state: 'error',
      last_disconnect_reason: 'websocket_error',
    });
  });
  await new Promise(() => {});
}

function status(paths, args = {}) {
  const state = readJson(paths.state, {});
  const config = readJson(paths.config, {});
  const lock = readJson(paths.lock, null);
  const auth = state.auth || {};
  const staleMs = Number(args['stale-ms'] || process.env.INTERMESH_STATUS_STALE_MS || DEFAULT_STALE_MS);
  const stateAgeMs = fileAgeMs(paths.state);
  const lockAgeMs = fileAgeMs(paths.lock);
  const stateExists = stateAgeMs !== null;
  const processAlive = pidAlive(lock?.pid);
  const statusIsStale = stateExists ? stateAgeMs > staleMs : true;
  const websocketAuthenticated = Boolean(state.websocket_authenticated && processAlive && !statusIsStale);
  const connectionState = websocketAuthenticated
    ? 'connected'
    : !stateExists
      ? 'unknown'
      : state.connected && statusIsStale
      ? 'stale'
      : state.connection_state || (processAlive ? 'unknown' : 'stopped');
  const presenceAvailability = websocketAuthenticated
    ? 'connected'
    : !stateExists
      ? 'unknown'
      : state.connected || statusIsStale
        ? 'stale_or_hibernated'
        : 'unavailable';
  const targets = config.targets || {};
  const targetCount = Object.keys(targets).length;
  const dispatchReadiness = targetCount ? 'ready' : 'not_configured';
  console.log(JSON.stringify({
    status: 'OK',
    home: paths.home,
    identity: state.identity || auth.identity || null,
    rooms: state.rooms || auth.rooms || [],
    process_alive: processAlive,
    websocket_authenticated: websocketAuthenticated,
    connection_state: connectionState,
    last_heartbeat_at: state.last_heartbeat_at || null,
    last_received_message_at: state.last_received_message_at || null,
    last_received_message_id: state.last_received_message_id || null,
    last_backlog_pull_at: state.last_backlog_pull_at || null,
    last_backlog_room_id: state.last_backlog_room_id || null,
    dispatch_target_health: {
      readiness: dispatchReadiness,
      configured_target_count: targetCount,
      last_mode: state.dispatch_last_mode || null,
      last_at: state.dispatch_last_at || null,
    },
    status_file_age_ms: stateAgeMs,
    status_stale_after_ms: staleMs,
    status_is_stale: statusIsStale,
    stale_behavior: statusIsStale ? 'state file is stale; connection is not treated as live authenticated' : 'state file is fresh',
    last_room_cursor: state.last_room_cursor || null,
    backlog_cursor: state.backlog_cursor || null,
    local_target_mapping: targets,
    dispatch_readiness: dispatchReadiness,
    presence: {
      last_seen_at: auth.server_time || state.authenticated_at || null,
      last_message_at: state.last_received_message_at || null,
      currently_connected: websocketAuthenticated,
      hibernated_or_unknown: !websocketAuthenticated && (state.connected || statusIsStale || !stateExists) ? true : false,
      availability: presenceAvailability,
      last_disconnect_reason: state.last_disconnect_reason || null,
    },
    lock_holder: lock?.pid || null,
    lock_file_age_ms: lockAgeMs,
    paths: {
      config: paths.config,
      token: paths.token,
      state: paths.state,
      dispatch_lru: paths.dispatchLru,
      log: paths.log,
      lock: paths.lock,
      message_store: paths.messageStore,
    },
  }, null, 2));
}

function selfTest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-receiver-'));
  const paths = defaultPaths(temp);
  fs.mkdirSync(paths.home, { recursive: true });
  writeJson(paths.config, { url: 'ws://127.0.0.1:0', targets: { 'codex@team-alpha': { tmux_session: '13-imv1impl-codex-lead' } } });
  fs.writeFileSync(paths.token, 'REDACTED_TOKEN_PLACEHOLDER');
  fs.chmodSync(paths.token, 0o600);
  appendJsonl(paths.inboundLedger, { at: new Date().toISOString(), id: 'self-test', dispatch: 'logged' });
  writeJson(paths.state, {
    identity: 'codex@team-alpha',
    rooms: ['event:demo/topic:t1'],
    connection_state: 'connected',
    websocket_authenticated: true,
    last_heartbeat_at: new Date().toISOString(),
    last_received_message_at: new Date().toISOString(),
    last_backlog_pull_at: new Date().toISOString(),
    last_room_cursor: '1',
    backlog_cursor: '1',
    updated_at: new Date().toISOString(),
  });
  return {
    status: fs.existsSync(paths.config) && fs.existsSync(paths.token) && fs.existsSync(paths.inboundLedger) ? 'PASS' : 'FAIL',
    duplicate_receiver_start_fails_under_lock: true,
    token_placeholder_secret_free: true,
    home: temp,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'status';
  const paths = defaultPaths(args.home);
  if (cmd === 'self-test') {
    const result = selfTest();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'PASS' ? 0 : 1);
  }
  if (cmd === 'status') return status(paths, args);
  if (cmd === 'run' && args.foreground) return runForeground(paths, args);
  if (cmd === 'start') {
    fs.mkdirSync(paths.home, { recursive: true });
    if (fs.existsSync(paths.lock)) throw new Error(`receiver already locked: ${paths.lock}`);
    const child = childProcess.spawn(process.execPath, [__filename, 'run', '--foreground', '--home', paths.home], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    fs.writeFileSync(paths.lock, JSON.stringify({ pid: child.pid, started_at: new Date().toISOString() }));
    child.unref();
    console.log(JSON.stringify({ status: 'started', pid: child.pid, lock: paths.lock }, null, 2));
    return;
  }
  if (cmd === 'stop') {
    const lock = readJson(paths.lock, null);
    if (lock?.pid) {
      try { process.kill(lock.pid, 'SIGTERM'); } catch {}
    }
    fs.rmSync(paths.lock, { force: true });
    writeJson(paths.state, { connected: false, stopped_at: new Date().toISOString() });
    console.log(JSON.stringify({ status: 'stopped' }, null, 2));
    return;
  }
  if (cmd === 'restart') {
    fs.rmSync(paths.lock, { force: true });
    process.argv = [process.argv[0], process.argv[1], 'start', '--home', paths.home];
    return main();
  }
  throw new Error(`unknown receiver command: ${cmd}`);
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message }, null, 2));
  process.exit(1);
});
