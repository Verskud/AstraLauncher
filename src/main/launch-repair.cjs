const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { instanceFolder } = require('./game-loader.cjs');

const FORGE_SKIN_VERSION = 'Rcbx2QhV';
const knownHashes = new Set([
  '8f928df3842de8f7d166256147f108d943d66b12575e115c1d90407db1b3f5b99aa551b1d94b58354dc838cf787f34a1107b7f16fb09c396181f5953d9988400',
  '8c65193c46c1435ddea571901f1dd04cc179179f59f1c1a0449349de04722b9c1b6e5efaec166975e05d2fa0b05f6c07c9d5d93a05f1c9a57fece2a0d0fc1ce7',
  '1c3ee525200d3dff69b19d4667f0c40155d0a8eedcfed4749ec8883fcf169bcf1123942a87ca73ecf46002fded35ec653bb902b0d3900c42f4eab0323793daf2',
]);
function skinVersionFor(profile) { return profile.loader === 'Forge' && profile.version === '1.20.1' ? FORGE_SKIN_VERSION : undefined; }

async function repairSkinConflict(userData, profile, onProgress = () => {}, provider) {
  if (!skinVersionFor(profile)) return false;
  const directory = instanceFolder(userData, profile.id), mods = path.join(directory, 'mods');
  let names;
  try { names = await fs.readdir(mods); } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  const affected = [];
  for (const name of names.filter(name => /CustomSkinLoader_Universal-15\.(?:0(?:\.1)?|1)\.jar$/i.test(name))) {
    const file = path.join(mods, name), stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;
    const hash = crypto.createHash('sha512').update(await fs.readFile(file)).digest('hex');
    if ((provider?.knownHashes || knownHashes).has(hash)) affected.push(name);
  }
  if (!affected.length) return false;
  const download = provider || require('./download.cjs');
  const resolved = await download.resolveModrinth({ source: 'modrinth', kind: 'mods', id: 'idMHQ4n2', gameVersion: profile.version, loader: 'forge', versionId: FORGE_SKIN_VERSION });
  if (path.basename(resolved.filename) !== resolved.filename || !/\.jar$/i.test(resolved.filename)) throw new Error('Некорректный файл исправления скинов.');
  onProgress({ phase: 'loader', message: 'Исправляем конфликт CustomSkinLoader с Forge 1.20.1. Старый мод сохраняется в резервной копии…' });
  const bytes = await download.fetchResolved(resolved);
  const backup = path.join(directory, '.astra-repairs', crypto.randomUUID());
  const target = path.join(mods, resolved.filename), temporary = target + '.repair-part';
  await fs.mkdir(backup, { recursive: true });
  const moved = [];
  let installed = false;
  try {
    await fs.writeFile(temporary, bytes, { flag: 'wx' });
    for (const name of [...affected, ...(names.includes(resolved.filename) ? [resolved.filename] : [])]) {
      const file = path.join(mods, name);
      if (!(await fs.lstat(file)).isFile()) throw new Error('Небезопасный файл мода скинов.');
      await fs.rename(file, path.join(backup, name)); moved.push(name);
    }
    await fs.rename(temporary, target); installed = true;
    return true;
  } catch (error) {
    if (installed) await fs.rm(target, { force: true });
    for (const name of moved.reverse()) await fs.rename(path.join(backup, name), path.join(mods, name));
    throw error;
  } finally { await fs.rm(temporary, { force: true }); }
}
module.exports = { repairSkinConflict, skinVersionFor };
