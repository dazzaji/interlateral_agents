'use strict';
// launch-cc-peer.test.js: dry-run checks for scripts/launch-cc-peer.sh and the me.sh model guard.
// Run: node --test interlateral_dna/tests/launch-cc-peer.test.js
// Dry runs never create a tmux session or start Claude. Tests that reach tmux or
// claude put stub executables first on PATH, so the real tools are never run.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const launcher = path.join(root, 'scripts/launch-cc-peer.sh');
const meSh = path.join(root, 'me.sh');

function run(script, args, env = {}) {
  const base = { ...process.env };
  delete base.CLAUDE_MODEL;
  delete base.CLAUDE_EFFORT;
  delete base.CLAUDE_ARGS;
  delete base.LAUNCH_DRY_RUN;
  const r = spawnSync('bash', [script, ...args], {
    cwd: root,
    env: { ...base, ...env },
    encoding: 'utf8',
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

test('default dry run resolves claude-opus-5-5 at high effort', () => {
  const r = run(launcher, ['--dry-run', 'ia-claude-peer-test']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^Model: claude-opus-5-5$/m);
  assert.match(r.out, /^Effort: high$/m);
  assert.match(r.out, /claude --dangerously-skip-permissions --model 'claude-opus-5-5' --effort 'high'$/m);
  assert.match(r.out, /^Session: ia-claude-peer-test$/m);
});

test('LAUNCH_DRY_RUN=1 behaves like --dry-run and keeps positional prompt', () => {
  const r = run(launcher, ['ia-claude-peer-test', 'Read', 'CLAUDE.md'], { LAUNCH_DRY_RUN: '1' });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^Dry run:/m);
  assert.match(r.out, /^Startup prompt: Read CLAUDE\.md$/m);
});

test('CLAUDE_MODEL and CLAUDE_EFFORT override defaults; --effort flag wins over env', () => {
  let r = run(launcher, ['--dry-run', 'ia-claude-peer-test'], { CLAUDE_MODEL: 'claude-sonnet-5', CLAUDE_EFFORT: 'xhigh' });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^Model: claude-sonnet-5$/m);
  assert.match(r.out, /^Effort: xhigh$/m);
  r = run(launcher, ['--effort', 'max', '--dry-run', 'ia-claude-peer-test'], { CLAUDE_EFFORT: 'low' });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^Effort: max$/m);
  r = run(launcher, ['--effort=medium', '--dry-run', 'ia-claude-peer-test']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^Effort: medium$/m);
});

test('invalid effort is rejected', () => {
  const r = run(launcher, ['--dry-run', 'ia-claude-peer-test'], { CLAUDE_EFFORT: 'turbo' });
  assert.equal(r.code, 2);
  assert.match(r.err, /invalid effort 'turbo'/);
});

// The whitelist is an exact match, not a pattern: glob characters and partial
// or padded values must not slip through.
for (const effort of ['h*', '*', 'hig?', '[h]igh', 'high ', ' high', 'low medium', 'HIGH']) {
  test(`effort ${JSON.stringify(effort)} is rejected (exact match only)`, () => {
    const r = run(launcher, ['--dry-run', 'ia-claude-peer-test'], { CLAUDE_EFFORT: effort });
    assert.equal(r.code, 2, r.out);
    assert.match(r.err, /invalid effort/);
    assert.doesNotMatch(r.out, /^Command:/m);
  });
}

// Stub bin dir: executables written here shadow the real tools on PATH.
function stubDir(stubs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-launch-stub-'));
  for (const [name, body] of Object.entries(stubs)) {
    const file = path.join(dir, name);
    fs.writeFileSync(file, `#!/bin/bash\n${body}\n`);
    fs.chmodSync(file, 0o755);
  }
  return dir;
}

// A tmux stub that records every call and fails loudly.
const loudTmux = (marker) =>
  `echo "stub tmux invoked: $*" >> '${marker}'\necho "stub tmux must not be invoked: $*" >&2\nexit 99`;

test('dry run without a session name prints a placeholder and never calls tmux', () => {
  const marker = path.join(os.tmpdir(), `ia-launch-tmux-${process.pid}-dry.log`);
  fs.rmSync(marker, { force: true });
  const dir = stubDir({ tmux: loudTmux(marker) });
  try {
    for (const [args, env] of [[['--dry-run'], {}], [[], { LAUNCH_DRY_RUN: '1' }]]) {
      const r = run(launcher, args, { PATH: `${dir}:/usr/bin:/bin`, ...env });
      assert.equal(r.code, 0, r.err);
      assert.match(r.out, /^Session: ia-claude-peer-NN \(placeholder/m);
      assert.match(r.out, /^Command: /m);
      assert.doesNotMatch(r.err, /stub tmux/);
    }
    assert.equal(fs.existsSync(marker), false, 'tmux was invoked during dry run');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(marker, { force: true });
  }
});

// Non-dry-run probe path. claude is stubbed; tmux is stubbed to report no
// existing session and then refuse new-session, so the launcher stops right
// after the probe. Neither real tmux nor real claude is run. The stub claude
// prints --effort first and then a lot more text, so a probe that stops reading
// early (grep -q under pipefail) would SIGPIPE the writer and false-negative.
function runProbe(helpBody) {
  const marker = path.join(os.tmpdir(), `ia-launch-tmux-${process.pid}-${Math.random().toString(36).slice(2)}.log`);
  const dir = stubDir({
    claude: `if [[ "\${1:-}" == "--help" ]]; then\n${helpBody}\nexit 0\nfi\necho "stub claude must not start a session" >&2\nexit 98`,
    tmux: `echo "$*" >> '${marker}'\ncase " $* " in\n  *" has-session "*) exit 1 ;;\n  *) echo "stub tmux: refusing $*" >&2; exit 97 ;;\nesac`,
  });
  try {
    const r = run(launcher, ['ia-claude-peer-test'], {
      PATH: `${dir}:/usr/bin:/bin`,
      TMUX_SOCKET: path.join(os.tmpdir(), `ia-launch-test-${process.pid}.sock`),
      INTERLATERAL_TMUX_SOCKET: path.join(os.tmpdir(), `ia-launch-test-${process.pid}.sock`),
    });
    const calls = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8') : '';
    return { ...r, calls };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(marker, { force: true });
  }
}

const bigHelpTail = 'for i in $(seq 1 20000); do echo "  --option-$i   filler help text for the probe"; done';

test('effort probe detects --effort in long help output (no SIGPIPE false negative)', () => {
  const r = runProbe(`echo "  --effort <level>   Effort level"\n${bigHelpTail}`);
  assert.doesNotMatch(r.err, /no --effort flag/);
  assert.doesNotMatch(r.err, /stub claude must not start/);
  assert.match(r.err, /stub tmux: refusing .*new-session/);
  assert.match(r.calls, /has-session/);
  assert.notEqual(r.code, 0);
});

test('effort probe warns and drops the flag when help lacks --effort', () => {
  const r = runProbe(`echo "  --model <model>   Model"\n${bigHelpTail}`);
  assert.match(r.err, /no --effort flag; launching without it/);
  assert.match(r.err, /ask for effort 'high'/);
  assert.match(r.err, /stub tmux: refusing .*new-session/);
  assert.notEqual(r.code, 0);
});

for (const model of ['claude-opus-4-7', 'CLAUDE-OPUS-4-7', 'claude-opus-4.7', 'claude-opus-4-7[1m]', 'claude-opus-4-7-20260101']) {
  test(`launcher refuses ${model}`, () => {
    const r = run(launcher, ['--dry-run', 'ia-claude-peer-test'], { CLAUDE_MODEL: model });
    assert.equal(r.code, 1);
    assert.match(r.err, /refusing to launch/);
    assert.doesNotMatch(r.out, /^Command:/m);
  });
}

// me.sh has no dry-run mode. Fence it: a PATH without tmux/claude/codex and a
// throwaway socket, so a broken guard fails on "Missing required command"
// instead of touching real sessions.
const fenced = {
  PATH: '/usr/bin:/bin',
  TMUX_SOCKET: path.join(require('node:os').tmpdir(), `ia-launch-test-${process.pid}.sock`),
  INTERLATERAL_TMUX_SOCKET: path.join(require('node:os').tmpdir(), `ia-launch-test-${process.pid}.sock`),
};

test('me.sh refuses claude-opus-4-7 before any launch step', () => {
  let r = run(meSh, [], { ...fenced, CLAUDE_MODEL: 'claude-opus-4-7' });
  assert.equal(r.code, 1);
  assert.match(r.err, /refusing to launch/);
  r = run(meSh, [], { ...fenced, CLAUDE_ARGS: '--model claude-opus-4-7' });
  assert.equal(r.code, 1);
  assert.match(r.err, /refusing to launch/);
});

test('me.sh help shows the claude-opus-5-5 default', () => {
  const r = run(meSh, ['--help'], fenced);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /CLAUDE_MODEL\s+Default: claude-opus-5-5/);
});
