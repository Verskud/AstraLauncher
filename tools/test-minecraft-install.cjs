const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { createInstaller } = require('../src/main/minecraft-install.cjs');

const hash = value => crypto.createHash('sha1').update(value).digest('hex');
const bytes = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
const base = 'https://piston-meta.mojang.com/';
const client = bytes('client-jar');
const client2 = bytes('other-client-jar');
const library = bytes('library-jar');
const asset = bytes('asset-file');
const index = bytes({ objects: { 'minecraft/sounds/test.ogg': { hash: hash(asset), size: asset.length } } });
const metadata = bytes({ id: 'test-1', downloads: { client: { url: 'https://piston-data.mojang.com/client.jar', sha1: hash(client) } }, assetIndex: { id: 'test-index', url: `${base}index.json`, sha1: hash(index) }, libraries: [
  { downloads: { artifact: { url: 'https://libraries.minecraft.net/test/lib.jar', path: 'test/lib.jar', sha1: hash(library) } } },
  { rules: [{ action: 'allow', os: { name: 'osx' } }], downloads: { artifact: { url: 'https://libraries.minecraft.net/osx.jar', path: 'test/osx.jar', sha1: hash(library) } } },
] });
const metadata2 = bytes({ ...JSON.parse(metadata), id: 'test-2', downloads: { client: { url: 'https://piston-data.mojang.com/client2.jar', sha1: hash(client2) } } });
const manifest = bytes({ versions: [{ id: 'test-1', url: `${base}test-1.json`, sha1: hash(metadata) }, { id: 'test-2', url: `${base}test-2.json`, sha1: hash(metadata2) }] });
const resources = new Map([
  [`${base}mc/game/version_manifest_v2.json`, manifest],
  [`${base}test-1.json`, metadata], [`${base}index.json`, index],
  [`${base}test-2.json`, metadata2],
  ['https://piston-data.mojang.com/client.jar', client],
  ['https://piston-data.mojang.com/client2.jar', client2],
  ['https://libraries.minecraft.net/test/lib.jar', library],
  [`https://resources.download.minecraft.net/${hash(asset).slice(0, 2)}/${hash(asset)}`, asset],
]);

(async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.astra-minecraft-test-'));
  const requests = [];
  const progress = [];
  const requestImpl = async url => {
    requests.push(url);
    return resources.has(url) ? { status: 200, body: Readable.from([resources.get(url)]) } : { status: 404, body: Readable.from(['missing']) };
  };
  try {
    const installer = createInstaller({ root, requestImpl, onProgress: value => progress.push(value) });
    const first = await installer.install('test-1');
    assert.equal(first.installed, true);
    assert.equal(first.files, 3);
    assert.equal((await installer.status('test-1')).installed, true);
    assert.equal(progress.at(-1).phase, 'done');
    assert.equal(requests.includes('https://libraries.minecraft.net/osx.jar'), false);
    const count = requests.length;
    await installer.install('test-1');
    assert.equal(requests.length, count + 1, 'Повторная установка использует проверенные файлы и запрашивает только манифест');
    const clientPath = path.join(root, 'versions/test-1/test-1.jar');
    await fs.writeFile(clientPath, 'corrupted');
    await installer.install('test-1');
    assert.equal((await fs.readFile(clientPath)).toString(), 'client-jar');
    await assert.rejects(installer.install('../escape'));
    const cancelRoot = path.join(root, 'cancelled');
    await createInstaller({ root: cancelRoot, requestImpl }).install('test-1');
    await fs.writeFile(path.join(cancelRoot, 'versions/test-1/test-1.jar'), 'corrupted');
    const cancellation = createInstaller({ root: cancelRoot, requestImpl: (url, { signal }) => {
      if (url === 'https://piston-data.mojang.com/client.jar') return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
      return requestImpl(url);
    } });
    const pending = cancellation.install('test-1');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(await cancellation.cancel(), true);
    assert.equal((await pending).cancelled, true);
    assert.equal((await cancellation.status('test-1')).installed, false);
    await assert.rejects(fs.access(path.join(cancelRoot, 'versions/test-1')));
    await assert.rejects(fs.access(path.join(cancelRoot, 'libraries/test/lib.jar')));
    await assert.rejects(fs.access(path.join(cancelRoot, `assets/objects/${hash(asset).slice(0,2)}/${hash(asset)}`)));
    await assert.rejects(fs.access(path.join(cancelRoot, 'assets/indexes/test-index.json')));
    const sharedRoot = path.join(root, 'shared');
    const shared = createInstaller({ root: sharedRoot, requestImpl });
    await shared.install('test-1');
    await shared.install('test-2');
    await fs.writeFile(path.join(sharedRoot, 'versions/test-1/test-1.jar'), 'corrupted');
    const sharedCancel = createInstaller({ root: sharedRoot, requestImpl: (url, { signal }) => {
      if (url === 'https://piston-data.mojang.com/client.jar') return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
      return requestImpl(url);
    } });
    const pendingShared = sharedCancel.install('test-1');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(await sharedCancel.cancel(), true);
    assert.equal((await pendingShared).cancelled, true);
    assert.equal((await sharedCancel.status('test-2')).installed, true);
    await fs.access(path.join(sharedRoot, 'libraries/test/lib.jar'));
    await fs.access(path.join(sharedRoot, `assets/objects/${hash(asset).slice(0,2)}/${hash(asset)}`));
    await assert.rejects(fs.access(path.join(sharedRoot, 'versions/test-1')));
    const failureRoot = path.join(root, 'failure');
    const failureProgress = [];
    const failing = createInstaller({ root: failureRoot, onProgress: value => failureProgress.push(value), requestImpl: url => {
      if (url.includes('resources.download.minecraft.net')) return Promise.resolve({ status: 503, body: Readable.from(['busy']) });
      return requestImpl(url);
    } });
    await assert.rejects(failing.install('test-1'), /503/);
    assert.equal(failureProgress.at(-1).phase, 'error');
    assert.equal((await failing.status('test-1')).installed, false);
    await createInstaller({ root: failureRoot, requestImpl }).install('test-1');
    assert.equal((await failing.status('test-1')).installed, true);
    console.log('Minecraft installer: download, checksum repair, cache, Windows libraries, cancellation OK');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
