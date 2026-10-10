const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { openZip } = require('../src/main/zip-reader.cjs');
const { createModpackInstaller, parseIndex } = require('../src/main/modpack.cjs');
const testRoot = path.join(__dirname, '.modpack-test');
async function tempFolder() { await fs.mkdir(testRoot, { recursive: true }); return fs.mkdtemp(path.join(testRoot, 'case-')); }
after(async () => { await fs.rm(testRoot, { recursive: true, force: true }); });

const table = Array.from({ length: 256 }, (_, index) => { let value = index; for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1; return value >>> 0; });
function crc32(bytes) { let value = 0xffffffff; for (const byte of bytes) value = table[(value ^ byte) & 255] ^ value >>> 8; return (value ^ 0xffffffff) >>> 0; }
function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const title = Buffer.from(name), bytes = Buffer.from(value);
    const local = Buffer.alloc(30), central = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(0x800, 6); local.writeUInt32LE(crc32(bytes), 14); local.writeUInt32LE(bytes.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(title.length, 26);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(0x800, 8); central.writeUInt32LE(crc32(bytes), 16); central.writeUInt32LE(bytes.length, 20); central.writeUInt32LE(bytes.length, 24); central.writeUInt16LE(title.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, title, bytes); centrals.push(central, title);
    offset += local.length + title.length + bytes.length;
  }
  const directory = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(entries).length, 8); end.writeUInt16LE(Object.keys(entries).length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

test('mrpack installs verified files and layered client overrides into a new instance', async () => {
  const temp = await tempFolder();
  const oldFetch = global.fetch;
  try {
    const mod = Buffer.from('mod bytes');
    const manifest = { formatVersion: 1, game: 'minecraft', name: 'Test Pack', files: [{ path: 'mods/test.jar', downloads: ['https://cdn.modrinth.com/data/test.jar'], fileSize: mod.length, hashes: { sha512: crypto.createHash('sha512').update(mod).digest('hex') } }], dependencies: { minecraft: '1.21.1', 'fabric-loader': '0.16.0' } };
    const archive = path.join(temp, 'sample.mrpack');
    await fs.writeFile(archive, zip({ 'modrinth.index.json': JSON.stringify(manifest), 'overrides/config/test.txt': 'base', 'client-overrides/config/test.txt': 'client' }));
    global.fetch = async () => new Response(mod);
    const installer = createModpackInstaller({ userData: temp });
    const installed = await installer.install({ path: archive });
    assert.equal(installed.profile.loader, 'Fabric');
    assert.equal(installed.profile.loaderVersion, '0.16.0');
    assert.equal(await fs.readFile(path.join(installed.folder, 'mods/test.jar'), 'utf8'), 'mod bytes');
    assert.equal(await fs.readFile(path.join(installed.folder, 'config/test.txt'), 'utf8'), 'client');
    assert.deepEqual((await installer.recover()).map(item => item.id), [installed.profile.id]);
  } finally { global.fetch = oldFetch; await fs.rm(temp, { recursive: true, force: true }); }
});

test('bad checksum rolls back without leaving an instance', async () => {
  const temp = await tempFolder();
  const oldFetch = global.fetch;
  try {
    const manifest = { formatVersion: 1, game: 'minecraft', name: 'Broken Pack', files: [{ path: 'mods/test.jar', downloads: ['https://cdn.modrinth.com/data/test.jar'], fileSize: 3, hashes: { sha512: '0'.repeat(128) } }], dependencies: { minecraft: '1.21.1' } };
    const archive = path.join(temp, 'broken.mrpack');
    await fs.writeFile(archive, zip({ 'modrinth.index.json': JSON.stringify(manifest) }));
    global.fetch = async () => new Response('bad');
    const installer = createModpackInstaller({ userData: temp });
    await assert.rejects(installer.install({ path: archive }), /Контрольная сумма/);
    assert.deepEqual(await fs.readdir(path.join(temp, 'instances')), []);
  } finally { global.fetch = oldFetch; await fs.rm(temp, { recursive: true, force: true }); }
});

test('cancel removes files downloaded before cancellation', async () => {
  const temp = await tempFolder();
  const oldFetch = global.fetch;
  try {
    const bytes = Buffer.from('mod');
    const hash = crypto.createHash('sha512').update(bytes).digest('hex');
    const file = name => ({ path: `mods/${name}.jar`, downloads: [`https://cdn.modrinth.com/${name}.jar`], fileSize: bytes.length, hashes: { sha512: hash } });
    const manifest = { formatVersion: 1, game: 'minecraft', name: 'Cancel Pack', files: [file('one'), file('two')], dependencies: { minecraft: '1.21.1' } };
    const archive = path.join(temp, 'cancel.mrpack');
    await fs.writeFile(archive, zip({ 'modrinth.index.json': JSON.stringify(manifest) }));
    global.fetch = async () => new Response(bytes);
    let installer;
    installer = createModpackInstaller({ userData: temp, onProgress: progress => { if (progress.completed === 1) installer.cancel(); } });
    await assert.rejects(installer.install({ path: archive }), /отменена/);
    assert.deepEqual(await fs.readdir(path.join(temp, 'instances')), []);
  } finally { global.fetch = oldFetch; await fs.rm(temp, { recursive: true, force: true }); }
});

test('rejects traversal in both manifest and archive', async () => {
  const base = { formatVersion: 1, game: 'minecraft', name: 'Unsafe', files: [{ path: '../outside.jar', downloads: ['https://cdn.modrinth.com/x'], fileSize: 0, hashes: { sha512: '0'.repeat(128) } }], dependencies: { minecraft: '1.21.1' } };
  assert.throws(() => parseIndex(Buffer.from(JSON.stringify(base))), /небезопасный путь/);
  const temp = await tempFolder();
  try {
    const archive = path.join(temp, 'unsafe.mrpack');
    await fs.writeFile(archive, zip({ '../outside': 'bad' }));
    await assert.rejects(openZip(archive), /небезопасный путь/);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
