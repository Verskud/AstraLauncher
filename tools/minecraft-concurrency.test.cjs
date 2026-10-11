const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { createInstaller } = require('../src/main/minecraft-install.cjs');
const hash = bytes => crypto.createHash('sha1').update(bytes).digest('hex');
test('Minecraft assets use a bounded pool of twelve workers', async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.concurrency-'));
  const objects = {};
  const resources = new Map();
  for (let i = 0; i < 30; i++) {
    const bytes = Buffer.from(`asset-${i}`), digest = hash(bytes);
    objects[`asset-${i}`] = { hash: digest };
    resources.set(`https://resources.download.minecraft.net/${digest.slice(0, 2)}/${digest}`, bytes);
  }
  const index = Buffer.from(JSON.stringify({ objects }));
  const metadata = Buffer.from(JSON.stringify({ id: 'pool-test', libraries: [], downloads: { client: { url: 'https://piston-data.mojang.com/client.jar', sha1: hash(Buffer.from('client')) } }, assetIndex: { id: 'pool', url: 'https://piston-meta.mojang.com/index.json', sha1: hash(index) } }));
  resources.set('https://piston-data.mojang.com/client.jar', Buffer.from('client'));
  resources.set('https://piston-meta.mojang.com/index.json', index);
  resources.set('https://piston-meta.mojang.com/version.json', metadata);
  resources.set('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json', Buffer.from(JSON.stringify({ versions: [{ id: 'pool-test', url: 'https://piston-meta.mojang.com/version.json', sha1: hash(metadata) }] })));
  let active = 0, peak = 0;
  const installer = createInstaller({ root, requestImpl: async url => ({ status: 200, body: Readable.from((async function* () {
    active++; peak = Math.max(peak, active);
    try { await new Promise(resolve => setTimeout(resolve, 20)); yield resources.get(url); }
    finally { active--; }
  })()) }) });
  try { await installer.install('pool-test'); assert.equal(peak, 12); assert.equal(active, 0); }
  finally { await fs.rm(root, { recursive: true, force: true }); }
});
