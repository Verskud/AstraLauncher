const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { repairSkinConflict, skinVersionFor } = require('../src/main/launch-repair.cjs');
const { matchesLoaderProfile, getLoaderProfile } = require('../src/main/game-loader.cjs');
const profile = { id: '00000000-0000-0000-0000-000000000001', version: '1.20.1', loader: 'Forge', loaderVersion: '47.4.20' };

test('loader selection rejects another installed Forge version and reuses a correct pinned cache', async () => {
  const wrong = { id: '1.20.1-forge-47.4.10', inheritsFrom: '1.20.1' };
  const correct = { id: '1.20.1-forge-47.4.20', inheritsFrom: '1.20.1' };
  assert.equal(matchesLoaderProfile(profile, wrong, '1.20.1-47.4.20'), false);
  assert.equal(matchesLoaderProfile(profile, correct, '1.20.1-47.4.20'), true);
  assert.equal(matchesLoaderProfile({ version: '1.21.1', loader: 'NeoForge' }, { id: 'neoforge-21.1.257', inheritsFrom: '1.21.1' }, '21.1.257'), true);
  const root = await fs.mkdtemp(path.join(__dirname, '.loader-cache-'));
  try {
    const folder = path.join(root, 'loaders', 'forge', '1.20.1--47.4.20');
    await fs.mkdir(folder, { recursive: true }); await fs.writeFile(path.join(folder, 'profile.json'), JSON.stringify(correct));
    assert.deepEqual(await getLoaderProfile(profile, root, 'no-java-needed'), correct);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('known conflicting skin mod is replaced with Forge build and originals are backed up; network failure preserves it', async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.skin-repair-'));
  const oldBytes = Buffer.from('old verified skin mod'), newBytes = Buffer.from('compatible forge skin mod');
  const oldName = 'CustomSkinLoader_Universal-15.0.jar', newName = 'CustomSkinLoader_ForgeV2-14.28.jar';
  const provider = { knownHashes: new Set([crypto.createHash('sha512').update(oldBytes).digest('hex')]), resolveModrinth: async request => { assert.equal(request.versionId, 'Rcbx2QhV'); return { filename: newName }; }, fetchResolved: async () => newBytes };
  try {
    const mods = path.join(root, 'instances', profile.id, 'mods');
    await fs.mkdir(mods, { recursive: true }); await fs.writeFile(path.join(mods, oldName), oldBytes);
    await assert.rejects(repairSkinConflict(root, profile, () => {}, { ...provider, fetchResolved: async () => { throw new Error('network'); } }), /network/);
    assert.deepEqual(await fs.readFile(path.join(mods, oldName)), oldBytes);
    assert.equal(await repairSkinConflict(root, profile, () => {}, provider), true);
    assert.deepEqual(await fs.readFile(path.join(mods, newName)), newBytes);
    await assert.rejects(fs.stat(path.join(mods, oldName)), { code: 'ENOENT' });
    const backups = path.join(root, 'instances', profile.id, '.astra-repairs');
    const [backup] = await fs.readdir(backups);
    assert.deepEqual(await fs.readFile(path.join(backups, backup, oldName)), oldBytes);
    assert.equal(await repairSkinConflict(root, profile, () => {}, provider), false);
    assert.equal(skinVersionFor({ ...profile, loader: 'Fabric' }), undefined);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
