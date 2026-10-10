import { mkdir, writeFile } from 'node:fs/promises';

const url = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Mojang responded with ${response.status}`);
const data = await response.json();
const allowedTypes = new Set(['release', 'snapshot', 'old_beta', 'old_alpha']);
if (!Array.isArray(data.versions) || data.versions.length < 100) throw new Error('Incomplete version manifest');
const versions = data.versions.filter(item =>
  typeof item.id === 'string' && /^[a-zA-Z0-9._ -]{1,64}$/.test(item.id) &&
  allowedTypes.has(item.type) && typeof item.releaseTime === 'string'
).map(({ id, type, releaseTime }) => ({ id, type, releaseTime }));
if (versions.length !== data.versions.length || new Set(versions.map(item => item.id)).size !== versions.length) throw new Error('Version manifest contains unsupported or duplicate IDs');
const output = {
  updatedAt: new Date().toISOString(),
  latest: { release: data.latest.release, snapshot: data.latest.snapshot },
  versions,
};
await mkdir('src/main/data', { recursive: true });
await writeFile('src/main/data/minecraft-versions.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(`Saved ${versions.length} official Minecraft versions.`);
