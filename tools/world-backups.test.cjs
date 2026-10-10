const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createWorldBackups } = require('../src/main/world-backups.cjs');

const PROFILE = '11111111-1111-4111-8111-111111111111';

test('world backups keep manual copies and restore with a safety copy', async t => {
  const root = await fs.mkdtemp(path.join(__dirname, '.tmp-world-backups-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const saves = path.join(root, 'instances', PROFILE, 'saves');
  const world = path.join(saves, 'My World');
  await fs.mkdir(world, { recursive: true });
  await fs.writeFile(path.join(world, 'level.dat'), 'first');
  const backups = createWorldBackups(root);
  const manual = await backups.create(PROFILE);
  assert.equal(manual.mode, 'manual');
  assert.equal(manual.worlds[0], 'My World');
  await fs.writeFile(path.join(world, 'level.dat'), 'second');
  await backups.create(PROFILE, 'auto', 1);
  await backups.create(PROFILE, 'auto', 1);
  assert.equal((await backups.list(PROFILE)).filter(item => item.mode === 'auto').length, 1);
  assert.ok((await backups.list(PROFILE)).some(item => item.id === manual.id));
  const restored = await backups.restore(PROFILE, manual.id);
  assert.equal(await fs.readFile(path.join(world, 'level.dat'), 'utf8'), 'first');
  assert.equal(restored.safetyBackup.mode, 'pre-restore');
  await backups.restore(PROFILE, restored.safetyBackup.id);
  assert.equal(await fs.readFile(path.join(world, 'level.dat'), 'utf8'), 'second');
  await backups.remove(PROFILE, manual.id);
  assert.ok(!(await backups.list(PROFILE)).some(item => item.id === manual.id));
});

test('invalid IDs and active game cannot change world backups', async t => {
  const root = await fs.mkdtemp(path.join(__dirname, '.tmp-world-backups-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const saves = path.join(root, 'instances', PROFILE, 'saves', 'World');
  await fs.mkdir(saves, { recursive: true });
  await fs.writeFile(path.join(saves, 'level.dat'), 'safe');
  const backups = createWorldBackups(root, () => true);
  await assert.rejects(() => backups.create(PROFILE), /Сначала закрой игру/);
  await assert.rejects(() => backups.remove(PROFILE, '../other'), /Сначала закрой игру/);
  await assert.rejects(() => backups.create('../other'), /Некорректная сборка/);
  assert.equal(await fs.readFile(path.join(saves, 'level.dat'), 'utf8'), 'safe');
});
