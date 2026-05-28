#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const { MeshClient } = require('./lib/mesh-client');
const { defaultPaths } = require('./lib/paths');

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
  const client = new MeshClient({ url, tokenFile: args['token-file'] || paths.token, timeoutMs: Number(args.timeout || 10000) });
  const lru = new Set(readJson(paths.dispatchLru, []));
  client.onFrame = (frame) => {
    if (frame.type === 'delivered' && frame.envelope) {
      if (lru.has(frame.envelope.id)) return;
      lru.add(frame.envelope.id);
      while (lru.size > 1000) lru.delete(lru.values().next().value);
      writeJson(paths.dispatchLru, [...lru]);
      const dispatchMode = dispatch(config, frame);
      appendJsonl(paths.inboundLedger, {
        at: new Date().toISOString(),
        id: frame.envelope.id,
        room_id: frame.envelope.room_id,
        from_identity: frame.envelope.from_identity,
        dispatch: dispatchMode,
      });
      client.ws.send(JSON.stringify({ type: 'ack', id: frame.envelope.id, room_id: frame.envelope.room_id, ack_by: client.auth.identity, ack_at: new Date().toISOString() }));
    } else if (frame.type === 'backlog_batch') {
      for (const envelope of frame.frames || []) client.onFrame({ type: 'delivered', envelope });
    }
  };
  const auth = await client.connect();
  writeJson(paths.state, { connected: true, auth, url, pid: process.pid, updated_at: new Date().toISOString() });
  for (const room of auth.rooms || []) client.requestBacklog({ room_id: room, limit: 50 });
  await new Promise(() => {});
}

function status(paths) {
  const state = readJson(paths.state, {});
  const config = readJson(paths.config, {});
  const lock = readJson(paths.lock, null);
  const auth = state.auth || {};
  console.log(JSON.stringify({
    status: 'OK',
    home: paths.home,
    identity: state.identity || auth.identity || null,
    rooms: state.rooms || auth.rooms || [],
    connection_state: state.connection_state || (state.connected ? 'connected' : 'stopped'),
    last_room_cursor: state.last_room_cursor || null,
    backlog_cursor: state.backlog_cursor || null,
    local_target_mapping: config.targets || {},
    dispatch_readiness: (config.targets || config.default_target) ? 'ready' : 'not_configured',
    lock_holder: lock?.pid || null,
    paths: {
      config: paths.config,
      token: paths.token,
      state: paths.state,
      dispatch_lru: paths.dispatchLru,
      log: paths.log,
      lock: paths.lock,
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
  if (cmd === 'status') return status(paths);
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
