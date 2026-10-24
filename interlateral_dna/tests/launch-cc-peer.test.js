'use strict';
// launch-cc-peer.test.js: dry-run checks for scripts/launch-cc-peer.sh and the me.sh model guard.
// Run: node --test interlateral_dna/tests/launch-cc-peer.test.js
// Dry runs never create a tmux session or start Claude; a session name is always
// passed so the launcher does not list sessions on any tmux socket.
const { test } = require('node:test');
const assert = require('node:assert/strict');
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
