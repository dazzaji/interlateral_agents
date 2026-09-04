'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const names = fs.readdirSync(path.join(root, '.agent/skills')).filter(n =>
  fs.statSync(path.join(root, '.agent/skills', n)).isDirectory());
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.name !== '.DS_Store')
    .flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)).map(p => e.name + '/' + p) : [e.name]).sort();
}
test('all 27 canonical skills have catalog entries and frontmatter', () => {
  assert.equal(names.length, 27);
  const catalog = read('SKILLS.md');
  for (const name of names) {
    const p = `.agent/skills/${name}/SKILL.md`, text = read(p);
    assert.ok(catalog.includes(`](${p})`), name);
    assert.match(text, /^---\r?\n/);
    assert.match(text, new RegExp('\\nname: ' + name + '\\r?\\n'));
    assert.match(text, /\ndescription: .+/);
  }
});
test('complete mirrors match and only approved extra discovery remains', () => {
  const source = path.join(root, '.agent/skills');
  for (const mirror of ['.claude/skills', '.codex/skills']) {
    const dest = path.join(root, mirror);
    assert.deepEqual(files(source), files(dest));
    for (const p of files(source)) assert.deepEqual(fs.readFileSync(path.join(source,p)),fs.readFileSync(path.join(dest,p)), p);
  }
  assert.deepEqual(fs.readdirSync(path.join(root,'.agents/skills')).filter(n=>!n.startsWith('.')), ['peer-synthi']);
  for (const p of files(path.join(source,'peer-synthi'))) {
    assert.deepEqual(fs.readFileSync(path.join(source,'peer-synthi',p)),
      fs.readFileSync(path.join(root,'.agents/skills/peer-synthi',p)));
  }
});
test('entry and changed skill Markdown links resolve in a clean tree', () => {
  const docs = ['README.md','SKILLS.md','docs/BB-DESKTOP.md',
    'docs/overnight-cookbook/README.md', ...['desktop-live-comms','overnight-cookbook',
      'overnight-one-desktop','overnight-two-desktop'].map(n=>`.agent/skills/${n}/SKILL.md`)];
  for (const doc of docs) {
    for (const match of read(doc).matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(root,path.dirname(doc),target)), `${doc}: ${target}`);
    }
  }
});
test('starter manifest has no kernel dependency or test runner', () => {
  const p = JSON.parse(read('interlateral_dna/package.json'));
  assert.equal(p.dependencies['better-sqlite3'], undefined);
  assert.equal(p.scripts['test:collab'], undefined);
  assert.equal(fs.existsSync(path.join(root,'interlateral_dna/collab')),false);
});
