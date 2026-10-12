const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeZip } = require('../src/main/zip-writer.cjs');
const { importFiles } = require('../src/main/local-content.cjs');

(async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.local-content-'));
  const profile = { id: crypto.randomUUID(), version: '1.21.1', loader: 'Fabric' };
  const instance = path.join(root, 'instances', profile.id);
  const archive = async (name, entries) => { const filename = path.join(root, name); await writeZip(filename, Object.entries(entries).map(([name, data]) => ({ name, bytes: Buffer.from(typeof data === 'string' ? data : JSON.stringify(data)) }))); return filename; };
  try {
    const mod = await archive('test.jar', { 'fabric.mod.json': { id: 'test', name: 'Test mod', version: '1.0', depends: { minecraft: '1.21.1' } } });
    const result = await importFiles(root, profile, 'mods', [mod]);
    assert.equal(result.installed.length, 1);
    assert.equal(result.installed[0].name, 'Test mod');
    assert.deepEqual(await fs.readFile(path.join(instance, 'mods', 'test.jar')), await fs.readFile(mod));
    assert.equal((await importFiles(root, profile, 'mods', [mod])).skipped.length, 1);
    // The game copy stays independent of a downloaded source changed afterwards.
    const before = await fs.readFile(path.join(instance, 'mods', 'test.jar'));
    await fs.writeFile(mod, 'changed');
    assert.deepEqual(await fs.readFile(path.join(instance, 'mods', 'test.jar')), before);
    const otherFolder = path.join(root, 'other'); await fs.mkdir(otherFolder);
    const collision = path.join(otherFolder, 'test.jar');
    await writeZip(collision, [{ name: 'fabric.mod.json', bytes: Buffer.from(JSON.stringify({ id: 'test', version: '2.0' })) }]);
    await assert.rejects(importFiles(root, profile, 'mods', [collision]), /уже есть другой файл/);
    assert.deepEqual(await fs.readFile(path.join(instance, 'mods', 'test.jar')), before);
    const duplicate = await archive('different-name.jar', { 'fabric.mod.json': { id: 'test', version: '2.0' } });
    await assert.rejects(importFiles(root, profile, 'mods', [duplicate]), /две версии мода/);
    const good = await archive('good.jar', { 'fabric.mod.json': { id: 'good', version: '1.0' } });
    const wrong = await archive('wrong.jar', { 'fabric.mod.json': { id: 'wrong', version: '1.0', depends: { minecraft: '1.20.1' } } });
    await assert.rejects(importFiles(root, profile, 'mods', [good, wrong]), /не подходит для Minecraft/);
    await assert.rejects(fs.access(path.join(instance, 'mods', 'good.jar')), { code: 'ENOENT' });
    const second = await archive('second.jar', { 'fabric.mod.json': { id: 'second', version: '1.0' } });
    const originalOpen = fs.open;
    fs.open = async (filename, flags, ...args) => {
      if (filename === path.join(instance, 'mods', 'second.jar') && flags === 'wx') throw Object.assign(new Error('Simulated disk failure'), { code: 'EIO' });
      return originalOpen(filename, flags, ...args);
    };
    try { await assert.rejects(importFiles(root, profile, 'mods', [good, second]), /Simulated disk failure/); }
    finally { fs.open = originalOpen; }
    await assert.rejects(fs.access(path.join(instance, 'mods', 'good.jar')), { code: 'ENOENT' });
    assert.deepEqual(await fs.readFile(path.join(instance, 'mods', 'test.jar')), before);
    const forge = await archive('forge.jar', { 'META-INF/mods.toml': 'modLoader="javafml"' });
    await assert.rejects(importFiles(root, profile, 'mods', [forge]), /не подходит к загрузчику/);
    await assert.rejects(importFiles(root, { ...profile, loader: 'Vanilla' }, 'mods', [good]), /выбери загрузчик/);
    const pack = await archive('resources.zip', { 'pack.mcmeta': { pack: { pack_format: 34, description: 'Test' } }, 'manifest.json': { name: 'unrelated manifest' } });
    await importFiles(root, profile, 'resources', [pack]);
    assert.deepEqual(await fs.readFile(path.join(instance, 'resourcepacks', 'resources.zip')), await fs.readFile(pack));
    const shaders = await archive('shaders.zip', { 'shaders/main.vsh': 'shader' });
    await importFiles(root, profile, 'shaders', [shaders]);
    await assert.rejects(importFiles(root, profile, 'resources', [shaders]), /pack.mcmeta/);
    const cfPack = await archive('modpack.zip', { 'manifest.json': { manifestType: 'minecraftModpack', minecraft: { version: '1.21.1' }, files: [] } });
    await assert.rejects(importFiles(root, profile, 'resources', [cfPack]), /архив сборки/);
    // Conflicts with already installed dependency versions are detected as a batch.
    const dependent = await archive('dependent.jar', { 'fabric.mod.json': { id: 'dependent', version: '1.0', depends: { test: '>=2.0' } } });
    await assert.rejects(importFiles(root, profile, 'mods', [dependent]), /требует test/);
    assert.equal((await fs.readdir(instance)).some(name => name.startsWith('.content-import-')), false);
    console.log('Local content OK: file copies, repeats, no overwrites, batch rollback, version/loader conflicts, dependency conflicts, resource/shader ZIPs, modpack rejection.');
  } finally {
    const absolute = path.resolve(root);
    if (!absolute.startsWith(path.resolve(__dirname) + path.sep)) throw new Error('Unsafe cleanup target');
    await fs.rm(absolute, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
