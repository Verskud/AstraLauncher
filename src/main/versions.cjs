const fs = require('node:fs/promises');
const path = require('node:path');
const { app } = require('electron');

const MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const bundled = require('./data/minecraft-versions.json');
const cacheFile = () => path.join(app.getPath('userData'), 'minecraft-versions.json');
const allowedTypes = new Set(['release', 'snapshot', 'old_beta', 'old_alpha']);
const maxAge = 6 * 60 * 60 * 1000;
let cached = null;
let refreshPromise = null;

function normalize(data) {
  if (!Array.isArray(data?.versions) || data.versions.length < 100) throw new Error('Каталог версий Minecraft неполный.');
  const versions = data.versions.filter(item =>
    typeof item.id === 'string' && /^[a-zA-Z0-9._ -]{1,64}$/.test(item.id) &&
    allowedTypes.has(item.type) && typeof item.releaseTime === 'string'
  ).map(({ id, type, releaseTime }) => ({ id, type, releaseTime }));
  if (versions.length !== data.versions.length || new Set(versions.map(item => item.id)).size !== versions.length ||
      !versions.some(item => item.id === data.latest?.release && item.type === 'release') ||
      !versions.some(item => item.id === data.latest?.snapshot && item.type === 'snapshot')) {
    throw new Error('Каталог версий Minecraft повреждён.');
  }
  return {
    updatedAt: new Date().toISOString(),
    latest: {
      release: String(data.latest?.release || ''),
      snapshot: String(data.latest?.snapshot || ''),
    },
    versions,
  };
}

async function list() {
  if (!cached) {
    try {
      const data = JSON.parse(await fs.readFile(cacheFile(), 'utf8'));
      cached = normalize(data);
      cached.updatedAt = data.updatedAt;
    } catch { cached = bundled; }
  }
  return { ...cached, source: cached === bundled ? 'bundled' : 'cache' };
}

async function refresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const current = await list();
    if (current.source === 'cache' && Date.now() - Date.parse(current.updatedAt) < maxAge) return current;
    const response = await fetch(MANIFEST_URL, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Mojang ответил кодом ${response.status}.`);
    const manifest = normalize(await response.json());
    await fs.mkdir(path.dirname(cacheFile()), { recursive: true });
    await fs.writeFile(cacheFile(), JSON.stringify(manifest), { mode: 0o600 });
    cached = manifest;
    return { ...manifest, source: 'live' };
  })();
  try { return await refreshPromise; }
  finally { refreshPromise = null; }
}

module.exports = { list, refresh, normalize };
