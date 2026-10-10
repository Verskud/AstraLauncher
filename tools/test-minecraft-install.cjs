const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createInstaller } = require('../src/main/minecraft-install.cjs');

const hash = value => crypto.createHash('sha1').update(value).digest('hex');
const bytes = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
const base = 'https://piston-meta.mojang.com/';
const client = bytes('client-jar');
const library = bytes('library-jar');
const asset = bytes('asset-file');
const index = bytes({ objects: { 'minecraft/sounds/test.ogg': { hash: hash(asset), size: asset.length } } });
const metadata = bytes({ id: 'test-1', downloads: { client: { url: 'https://piston-data.mojang.com/client.jar', sha1: hash(client) } }, assetIndex: { id: 'test-index', url: `${base}index.json`, sha1: hash(index) }, libraries: [
  { downloads: { artifact: { url: 'https://libraries.minecraft.net/test/lib.jar', path: 'test/lib.jar', sha1: hash(library) } } },
  { rules: [{ action: 'allow', os: { name: 'osx' } }], downloads: { artifact: { url: 'https://libraries.minecraft.net/osx.jar', path: 'test/osx.jar', sha1: hash(library) } } },
] });
const manifest = bytes({ versions: [{ id: 'test-1', url: `${base}test-1.json`, sha1: hash(metadata) }] });
const resources = new Map([
  [`${base}mc/game/version_manifest_v2.json`, manifest],
  [`${base}test-1.json`, metadata], [`${base}index.json`, index],
  ['https://piston-data.mojang.com/client.jar', client],
  ['https://libraries.minecraft.net/test/lib.jar', library],
  [`https://resources.download.minecraft.net/${hash(asset).slice(0, 2)}/${hash(asset)}`, asset],
]);

(async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.astra-minecraft-test-'));
  const requests = [];
  const progress = [];
  const fetchImpl = async url => {
    requests.push(url);
    return resources.has(url) ? new Response(resources.get(url), { status: 200 }) : new Response('missing', { status: 404 });
  };
  try {
    const installer = createInstaller({ root, fetchImpl, onProgress: value => progress.push(value) });
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
    const cancellation = createInstaller({ root: path.join(root, 'cancelled'), fetchImpl: (url, { signal }) => {
      if (url === 'https://piston-data.mojang.com/client.jar') return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
      return fetchImpl(url);
    } });
    const pending = cancellation.install('test-1');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(cancellation.cancel(), true);
    await assert.rejects(pending, /Загрузка отменена/);
    assert.equal((await cancellation.status('test-1')).installed, false);
    console.log('Minecraft installer: download, checksum repair, cache, Windows libraries, cancellation OK');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
