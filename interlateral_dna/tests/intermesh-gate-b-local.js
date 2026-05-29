#!/usr/bin/env node
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const WebSocket = require('ws');
const { tokenParts } = require('../lib/envelope');
const { sha256Hex } = require('../lib/json');

const DNA_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(DNA_ROOT, '..');
const NODE = process.execPath;
const meshJs = path.join(DNA_ROOT, 'mesh.js');
const receiverJs = path.join(DNA_ROOT, 'mesh-receiver.js');
const evidenceDir = process.env.GATE_B_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-b-evidence-'));
const homesRoot = process.env.GATE_B_HOMES_ROOT || fs.mkdtempSync(path.join(os.tmpdir(), 'intermesh-gate-b-homes-'));
const receiverRegistry = process.env.INTERMESH_RECEIVER_REGISTRY || path.join(homesRoot, 'receiver-registry.json');

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function makeToken(identity, rooms) {
  const tokenId = randomId('tok_local_gb');
  const tokenSecret = crypto.randomBytes(32).toString('hex');
  return {
    token: `${tokenId}.${tokenSecret}`,
    token_id: tokenId,
    sha256_of_secret: sha256Hex(tokenSecret),
    identity,
    team_id: 'gate-b-local',
    rooms,
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text) return [];
  return text.split('\n').map((line) => JSON.parse(line));
}

function writeHome(name, token, url) {
  const home = path.join(homesRoot, name);
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'token'), token.token);
  fs.chmodSync(path.join(home, 'token'), 0o600);
  writeJson(path.join(home, 'config.json'), { url, targets: {} });
  return home;
}

function runNode(args, options = {}) {
  return childProcess.spawnSync(NODE, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 15_000,
    env: { ...process.env, ...(options.env || {}) },
  });
}

function runNodeAsync(args, options = {}) {
  return new Promise((resolve) => {
    const proc = childProcess.spawn(NODE, args, {
      cwd: REPO_ROOT,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
    }, options.timeout || 15_000);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr, error: null });
    });
    proc.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: 1, signal: null, stdout, stderr, error });
    });
  });
}

function spawnReceiver(home, extraArgs = [], env = {}) {
  return childProcess.spawn(NODE, [receiverJs, 'run', '--foreground', '--home', home, '--heartbeat-ms', '250', ...extraArgs], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await wait(50);
  }
  return null;
}

async function startServer(tokens) {
  const server = http.createServer();
  const wss = new WebSocket.Server({ server });
  const sockets = new Map();
  const authBySocket = new WeakMap();
  const messages = [];

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let frame;
      try {
        frame = JSON.parse(String(raw));
      } catch {
        ws.send(JSON.stringify({ type: 'error', code: 'bad_json' }));
        return;
      }
      const current = authBySocket.get(ws);
      if (!current) {
        if (frame.type !== 'auth') {
          ws.send(JSON.stringify({ type: 'error', code: 'missing_token' }));
          return;
        }
        const candidate = tokens.get(frame.token_id);
        if (!candidate) {
          ws.send(JSON.stringify({ type: 'error', code: 'token_invalid' }));
          return;
        }
        const parsed = tokenParts(candidate.token);
        if (parsed.token_secret !== frame.token_secret) {
          ws.send(JSON.stringify({ type: 'error', code: 'token_invalid' }));
          return;
        }
        const old = sockets.get(frame.token_id);
        if (old && old !== ws && old.readyState === WebSocket.OPEN) {
          old.send(JSON.stringify({ type: 'error', code: 'token_reauth', message: 'new socket authenticated' }));
          setTimeout(() => old.close(4001, 'token_reauth'), 100);
        }
        const auth = {
          token_id: frame.token_id,
          identity: candidate.identity,
          team_id: candidate.team_id,
          rooms: candidate.rooms,
        };
        authBySocket.set(ws, auth);
        sockets.set(frame.token_id, ws);
        ws.send(JSON.stringify({ type: 'auth_ok', identity: auth.identity, team_id: auth.team_id, role: 'participant', rooms: auth.rooms, server_time: nowIso() }));
        return;
      }
      if (frame.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', server_time: nowIso() }));
        return;
      }
      if (frame.type === 'send') {
        const envelope = frame.envelope || {};
        if (envelope.from_identity !== current.identity) {
          ws.send(JSON.stringify({ type: 'error', code: 'identity_mismatch', id: envelope.id || null }));
          return;
        }
        messages.push(envelope);
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'accepted', id: envelope.id, room_id: envelope.room_id, room_seq: messages.length }));
        }, 400);
        for (const other of wss.clients) {
          const otherAuth = authBySocket.get(other);
          if (other.readyState === WebSocket.OPEN && otherAuth?.identity === envelope.to_identity && otherAuth.rooms.includes(envelope.room_id)) {
            other.send(JSON.stringify({ type: 'delivered', envelope, id: envelope.id, room_id: envelope.room_id, to_identity: envelope.to_identity, dispatch: 'attempted' }));
          }
        }
        return;
      }
      if (frame.type === 'backlog_request') {
        const rows = messages.filter((message) => message.room_id === frame.room_id && message.to_identity === current.identity);
        ws.send(JSON.stringify({ type: 'backlog_batch', room_id: frame.room_id, frames: rows.map((message, index) => ({ ...message, via_backlog: true, room_seq: index + 1 })), has_more: false }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    url: `ws://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => {
      for (const client of wss.clients) {
        try { client.close(); } catch {}
      }
      wss.close(() => server.close(resolve));
    }),
  };
}

function send(home, url, room, to, text, env = {}, extraArgs = []) {
  return runNodeAsync([meshJs, 'send', '--home', home, '--url', url, '--room', room, '--to', to, '--text', text, ...extraArgs], { env });
}

function status(home, staleMs = 15000) {
  const proc = runNode([receiverJs, 'status', '--home', home, '--stale-ms', String(staleMs)]);
  return { proc, json: proc.stdout ? JSON.parse(proc.stdout) : null };
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.rmSync(homesRoot, { recursive: true, force: true });
  fs.mkdirSync(homesRoot, { recursive: true });
  const room = `event:gateb/topic:${crypto.randomBytes(4).toString('hex')}`;
  const receiverToken = makeToken('gate-b-receiver@local', [room]);
  const senderToken = makeToken('gate-b-sender@local', [room]);
  const tokens = new Map([
    [receiverToken.token_id, receiverToken],
    [senderToken.token_id, senderToken],
  ]);
  const server = await startServer(tokens);
  const receiverHome = writeHome('receiver', receiverToken, server.url);
  const senderHome = writeHome('sender', senderToken, server.url);
  const copiedTokenHome = writeHome('copied-token-sender', receiverToken, server.url);
  const testEnv = { INTERMESH_RECEIVER_REGISTRY: receiverRegistry };
  let receiver = null;
  const cleanup = async () => {
    if (receiver && !receiver.killed) receiver.kill('SIGTERM');
    await wait(200);
    await server.close();
  };

  try {
    receiver = spawnReceiver(receiverHome, [], testEnv);
    await waitFor(() => {
      const current = status(receiverHome).json;
      return current?.websocket_authenticated ? current : null;
    }, 5000);

    const liveStarted = Date.now();
    const liveSend = await send(senderHome, server.url, room, receiverToken.identity, 'gate b live receive', testEnv);
    const liveRows = await waitFor(() => {
      const rows = readJsonl(path.join(receiverHome, 'inbound-ledger.jsonl'));
      return rows.length >= 1 ? rows : null;
    }, 5000) || [];
    const liveLatencyMs = liveRows.length ? Date.now() - liveStarted : null;
    const liveStatus = status(receiverHome).json;

    receiver.kill('SIGTERM');
    await wait(500);
    receiver = spawnReceiver(receiverHome, [], testEnv);
    await wait(1000);
    const afterBacklogRows = readJsonl(path.join(receiverHome, 'inbound-ledger.jsonl'));
    const lru = readJson(path.join(receiverHome, 'dispatch-lru.json'), []);
    const backlogStatus = status(receiverHome).json;

    const sameHomeGuard = await send(receiverHome, server.url, room, senderToken.identity, 'should fail same home', testEnv);
    const explicitTokenGuard = await send(
      senderHome,
      server.url,
      room,
      senderToken.identity,
      'should fail explicit receiver token',
      testEnv,
      ['--token-file', path.join(receiverHome, 'token')],
    );
    const copiedTokenGuard = await send(copiedTokenHome, server.url, room, senderToken.identity, 'should fail copied receiver token', testEnv);

    const parallel = await Promise.all([0, 1].map((index) => new Promise((resolve) => {
      const proc = childProcess.spawn(NODE, [meshJs, 'send', '--home', senderHome, '--url', server.url, '--room', room, '--to', receiverToken.identity, '--text', `parallel ${index}`], {
        cwd: REPO_ROOT,
        env: { ...process.env, ...testEnv },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });
      proc.on('close', (exitCode) => resolve({ exit_code: exitCode, stdout, stderr }));
    })));

    const staleHome = path.join(homesRoot, 'stale-status');
    fs.mkdirSync(staleHome, { recursive: true });
    writeJson(path.join(staleHome, 'receiver-state.json'), {
      connected: true,
      websocket_authenticated: true,
      identity: 'stale@local',
      rooms: [room],
      updated_at: nowIso(),
    });
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(path.join(staleHome, 'receiver-state.json'), staleTime, staleTime);
    const staleStatus = status(staleHome, 1).json;

    const unknownHome = path.join(homesRoot, 'unknown-status');
    fs.mkdirSync(unknownHome, { recursive: true });
    writeJson(path.join(unknownHome, 'config.json'), { url: server.url, targets: {} });
    const unknownStatus = status(unknownHome, 1).json;

    const result = {
      status: liveSend.status === 0
        && liveRows.length === 1
        && afterBacklogRows.length === 1
        && sameHomeGuard.status !== 0
        && explicitTokenGuard.status !== 0
        && copiedTokenGuard.status !== 0
        && parallel.some((entry) => entry.exit_code !== 0)
        && staleStatus.connection_state === 'stale'
        && unknownStatus.connection_state === 'unknown'
        && unknownStatus.presence?.currently_connected === false
        ? 'PASS'
        : 'FAIL',
      mode: 'local-simulated',
      room_id: room,
      evidence_dir: evidenceDir,
      homes_root: homesRoot,
      receiver_registry: {
        path: receiverRegistry,
        raw_tokens_stored: false,
      },
      token_records: [receiverToken, senderToken].map((token) => ({
        mode: 'local-test',
        token_id: token.token_id,
        sha256_of_secret: token.sha256_of_secret,
        identity: token.identity,
        room_id: room,
        team_id: token.team_id,
      })),
      live_receive: {
        status: liveSend.status === 0 && liveRows.length === 1 ? 'PASS' : 'FAIL',
        observed_latency_ms: liveLatencyMs,
        send_exit_code: liveSend.status,
        send_signal: liveSend.signal || null,
        send_error: liveSend.error ? liveSend.error.message : null,
        send_stderr_shape: liveSend.stderr ? 'stderr-present' : 'empty',
        send_stderr: liveSend.stderr.trim().slice(0, 500),
        inbound_count_before_restart: liveRows.length,
        receiver_status: {
          connection_state: liveStatus.connection_state,
          process_alive: liveStatus.process_alive,
          websocket_authenticated: liveStatus.websocket_authenticated,
          last_received_message_at: liveStatus.last_received_message_at,
        },
      },
      backlog_duplicate: {
        status: afterBacklogRows.length === 1 && lru.length === 1 ? 'PASS' : 'FAIL',
        inbound_count_after_restart_backlog: afterBacklogRows.length,
        dispatch_lru_count: lru.length,
      },
      token_session: {
        status: sameHomeGuard.status !== 0 && explicitTokenGuard.status !== 0 && copiedTokenGuard.status !== 0 ? 'PASS' : 'FAIL',
        dual_token_send_exit_code: liveSend.status,
        same_home_receiver_send_exit_code: sameHomeGuard.status,
        same_home_error_code: sameHomeGuard.stderr.includes('same_token_receiver_send_unsupported') ? 'same_token_receiver_send_unsupported' : null,
        explicit_token_file_send_exit_code: explicitTokenGuard.status,
        explicit_token_file_error_code: explicitTokenGuard.stderr.includes('same_token_receiver_send_unsupported') ? 'same_token_receiver_send_unsupported' : null,
        copied_token_home_send_exit_code: copiedTokenGuard.status,
        copied_token_home_error_code: copiedTokenGuard.stderr.includes('same_token_receiver_send_unsupported') ? 'same_token_receiver_send_unsupported' : null,
      },
      parallel_send: {
        status: parallel.some((entry) => entry.exit_code !== 0) ? 'PASS' : 'FAIL',
        results: parallel.map((entry) => ({
          exit_code: entry.exit_code,
          error_code: entry.stderr.includes('same_token_concurrent_unsupported') ? 'same_token_concurrent_unsupported' : null,
        })),
      },
      status_presence: {
        status: staleStatus.connection_state === 'stale'
          && staleStatus.status_is_stale
          && unknownStatus.connection_state === 'unknown'
          && unknownStatus.presence?.currently_connected === false
          && unknownStatus.presence?.availability === 'unknown'
          ? 'PASS'
          : 'FAIL',
        live_status_fields_present: [
          'process_alive',
          'websocket_authenticated',
          'last_heartbeat_at',
          'last_received_message_at',
          'last_backlog_pull_at',
          'dispatch_target_health',
          'status_file_age_ms',
          'presence',
        ].every((field) => Object.prototype.hasOwnProperty.call(liveStatus, field)),
        stale_connection_state: staleStatus.connection_state,
        stale_status_is_stale: staleStatus.status_is_stale,
        hibernated_or_unknown: staleStatus.presence?.hibernated_or_unknown,
        stale_availability: staleStatus.presence?.availability,
        unknown_connection_state: unknownStatus.connection_state,
        unknown_currently_connected: unknownStatus.presence?.currently_connected,
        unknown_hibernated_or_unknown: unknownStatus.presence?.hibernated_or_unknown,
        unknown_availability: unknownStatus.presence?.availability,
      },
    };

    writeJson(path.join(evidenceDir, 'gate-b-local-result.json'), result);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'PASS' ? 0 : 1;
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'ERROR', error: error.message }, null, 2));
  process.exit(1);
});
