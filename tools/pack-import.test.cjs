const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { writeZip } = require('../src/main/zip-writer.cjs');
const { createModpackInstaller } = require('../src/main/modpack.cjs');
const { inspectArchive } = require('../src/main/pack-formats.cjs');

async function fixture(work) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'astra-pack-import-'));
  const original = global.fetch;
  try { await work(root); }
  finally { global.fetch = original; await fs.rm(root, { recursive: true, force: true }); }
}
async function archive(root, records, name = 'pack.zip') {
  const filename = path.join(root, name);
  await fs.rm(filename, { force: true });
  await writeZip(filename, Object.entries(records).map(([name, value]) => ({ name, bytes: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) })));
  return filename;
}
function curse(files = []) { return { manifestType: 'minecraftModpack', manifestVersion: 1, name: 'Curse Pack', minecraft: { version: '1.20.1', modLoaders: [{ id: 'forge-47.3.0', primary: true }] }, overrides: 'overrides', files }; }
const reference = { projectID: 100, fileID: 200, required: true };

test('Prism and MultiMC exports preserve exact loader, files, and wrapper folder without copying credentials', () => fixture(async root => {
  for (const gameFolder of ['minecraft', '.minecraft']) {
    const filename = await archive(root, { 'Wrapped/mmc-pack.json': { formatVersion: 1, components: [{ uid: 'net.minecraft', version: '1.21.1' }, { uid: 'net.neoforged', version: '21.1.250' }] }, 'Wrapped/instance.cfg': '[General]\r\nname=My Create Pack\r\n', [`Wrapped/${gameFolder}/mods/create.jar`]: 'create', [`Wrapped/${gameFolder}/mods/test.jar.disabled`]: 'disabled', [`Wrapped/${gameFolder}/config/options.json`]: '{}', [`Wrapped/${gameFolder}/accounts.json`]: 'secret', [`Wrapped/${gameFolder}/logs/latest.log`]: 'private', [`Wrapped/${gameFolder}/saves/World/level.dat`]: 'world' });
    const result = await createModpackInstaller({ userData: root }).install({ path: filename });
    assert.equal(result.format, 'prism'); assert.equal(result.profile.name, 'My Create Pack'); assert.equal(result.profile.loader, 'NeoForge'); assert.equal(result.profile.loaderVersion, '21.1.250');
    assert.equal(await fs.readFile(path.join(result.folder, 'mods/create.jar'), 'utf8'), 'create');
    assert.equal(await fs.readFile(path.join(result.folder, 'mods/test.jar.disabled'), 'utf8'), 'disabled');
    assert.equal(await fs.readFile(path.join(result.folder, 'saves/World/level.dat'), 'utf8'), 'world');
    await assert.rejects(fs.stat(path.join(result.folder, 'accounts.json')), { code: 'ENOENT' });
    await assert.rejects(fs.stat(path.join(result.folder, 'logs')), { code: 'ENOENT' });
  }
}));

test('Modrinth format is detected inside a ZIP instead of relying on extension', () => fixture(async root => {
  const filename = await archive(root, { 'Pack/modrinth.index.json': { formatVersion: 1, game: 'minecraft', name: 'Renamed', dependencies: { minecraft: '1.21.1', 'fabric-loader': '0.16.0' }, files: [] }, 'Pack/overrides/config/test.txt': 'base', 'Pack/client-overrides/config/test.txt': 'client' });
  const result = await createModpackInstaller({ userData: root }).install({ path: filename });
  assert.equal(result.format, 'modrinth'); assert.equal(result.profile.loaderVersion, '0.16.0');
  assert.equal(await fs.readFile(path.join(result.folder, 'config/test.txt'), 'utf8'), 'client');
}));

test('ASTRA ZIP imports through the same installer, with a new ID and complete statistics', () => fixture(async root => {
  const filename = await archive(root, { 'astra-export.json': { format: 'astra-instance-v1', profile: { id: 'old-id', name: 'Export', version: '1.21.1', loader: 'Quilt', loaderVersion: '0.27.1', art: 'snow' } }, 'instance/mods/test.jar': 'mod', 'instance/config/test.json': '{}' });
  const result = await createModpackInstaller({ userData: root }).install({ path: filename });
  assert.notEqual(result.profile.id, 'old-id'); assert.equal(result.profile.art, 'snow'); assert.equal(result.files, 1); assert.equal(result.overrides, 1);
}));

test('ordinary ZIP prompts for versions, then imports game files without inventing a loader', () => fixture(async root => {
  const filename = await archive(root, { 'MyPack/mods/test.jar': 'mod', 'MyPack/config/test.json': '{}' }, 'Custom.zip');
  assert.deepEqual(await inspectArchive(filename), { type: 'folder', needsSettings: true, name: 'Custom' });
  const installer = createModpackInstaller({ userData: root });
  await assert.rejects(installer.install({ path: filename }), /Укажи их/);
  const result = await installer.install({ path: filename, settings: { name: 'Custom Pack', version: '1.20.1', loader: 'Forge', loaderVersion: '47.3.0' } });
  assert.equal(result.profile.loaderVersion, '47.3.0'); assert.equal(await fs.readFile(path.join(result.folder, 'mods/test.jar'), 'utf8'), 'mod');
}));

test('CurseForge manifest downloads the referenced exact files from the official site and keeps overrides', () => fixture(async root => {
  const modFile = await archive(root, { 'META-INF/MANIFEST.MF': 'Manifest-Version: 1.0' }, 'fixture.jar');
  const bytes = await fs.readFile(modFile), requests = [];
  const filename = await archive(root, { 'manifest.json': curse([reference]), 'overrides/config/test.cfg': 'setting', 'overrides/mods/custom.jar': 'bundled' });
  global.fetch = async (url, options) => {
    assert.equal(options.redirect, 'manual'); requests.push(url);
    if (url.includes('curseforge.com')) return new Response(null, { status: 307, headers: { location: 'https://mediafilez.forgecdn.net/files/0/200/test.jar' } });
    return new Response(bytes, { headers: { 'content-length': String(bytes.length) } });
  };
  const result = await createModpackInstaller({ userData: root }).install({ path: filename });
  assert.equal(requests[0], 'https://www.curseforge.com/api/v1/mods/100/files/200/download');
  assert.equal(result.profile.version, '1.20.1'); assert.equal(result.profile.loader, 'Forge'); assert.equal(result.profile.loaderVersion, '47.3.0');
  assert.deepEqual(await fs.readFile(path.join(result.folder, 'mods/test.jar')), bytes);
  assert.equal(await fs.readFile(path.join(result.folder, 'config/test.cfg'), 'utf8'), 'setting');
}));

test('blocked CurseForge file can be supplied manually without a developer key', () => fixture(async root => {
  const selected = await archive(root, { 'META-INF/MANIFEST.MF': 'Manifest-Version: 1.0' }, 'manual.jar');
  const filename = await archive(root, { 'manifest.json': curse([reference]) });
  global.fetch = async () => new Response(null, { status: 403 });
  let prompted = false;
  const result = await createModpackInstaller({ userData: root, manualDownload: async file => { prompted = true; assert.equal(file.url, 'https://www.curseforge.com/projects/100/files/200'); return selected; } }).install({ path: filename });
  assert.equal(prompted, true); assert.deepEqual(await fs.readFile(path.join(result.folder, 'mods/manual.jar')), await fs.readFile(selected));
}));

test('CurseForge downloads reject foreign redirect domains and HTML disguised as a mod, and roll back', () => fixture(async root => {
  const filename = await archive(root, { 'manifest.json': curse([reference]) });
  for (const fetcher of [async () => new Response(null, { status: 307, headers: { location: 'https://example.com/test.jar' } }), async () => new Response('<html>blocked</html>', { headers: { 'content-disposition': 'attachment; filename="test.jar"' } })]) {
    global.fetch = fetcher;
    await assert.rejects(createModpackInstaller({ userData: root }).install({ path: filename }));
    assert.deepEqual(await fs.readdir(path.join(root, 'instances')), []);
  }
}));

test('CurseForge rejects unsafe overrides and ambiguous loaders before contacting the network', () => fixture(async root => {
  const bad = curse(); bad.overrides = '../outside';
  let filename = await archive(root, { 'manifest.json': bad });
  await assert.rejects(createModpackInstaller({ userData: root }).install({ path: filename }), /небезопасный путь/);
  bad.overrides = 'overrides'; bad.minecraft.modLoaders = [{ id: 'forge-47.3.0' }, { id: 'fabric-0.16.0' }];
  filename = await archive(root, { 'manifest.json': bad });
  await assert.rejects(createModpackInstaller({ userData: root }).install({ path: filename }), /несколько загрузчиков/);
}));

test('cancelling an extracted ZIP removes staging and keeps existing instances', () => fixture(async root => {
  const filename = await archive(root, { 'mods/a.jar': 'a', 'mods/b.jar': 'b' });
  let installer;
  installer = createModpackInstaller({ userData: root, onProgress: data => { if (data.completed === 1) installer.cancel(); } });
  await assert.rejects(installer.install({ path: filename, settings: { version: '1.21.1', loader: 'Fabric' } }), /отменена/);
  assert.deepEqual(await fs.readdir(path.join(root, 'instances')), []);
}));

test('a standalone resource pack is not misidentified as an instance', () => fixture(async root => {
  const filename = await archive(root, { 'pack.mcmeta': { pack: { pack_format: 34, description: 'Texture pack' } }, 'assets/test.txt': 'texture' });
  await assert.rejects(inspectArchive(filename), /нет сборки Minecraft/);
}));

test('an installed CurseForge profile preserves its loader and local mods', () => fixture(async root => {
  const filename = await archive(root, { 'minecraftinstance.json': { name: 'Installed', minecraftVersion: '1.21.1', baseModLoader: { name: 'neoforge-21.1.250' } }, 'mods/mod.jar': 'mod', 'config/settings.json': '{}' });
  const result = await createModpackInstaller({ userData: root }).install({ path: filename });
  assert.equal(result.profile.loader, 'NeoForge'); assert.equal(result.profile.loaderVersion, '21.1.250'); assert.equal(result.files, 1);
  await assert.rejects(fs.stat(path.join(result.folder, 'minecraftinstance.json')), { code: 'ENOENT' });
}));
