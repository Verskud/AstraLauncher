const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { instanceFolder } = require('./game-loader.cjs');

const BACKUP_ID = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9]{8}$/;

function createWorldBackups(userData, isActive = () => false) {
  const busy = new Set();
  const profileRoot = profileId => instanceFolder(userData, profileId);
  const backupRoot = profileId => path.join(userData, 'world-backups', path.basename(profileRoot(profileId)));
  const savesRoot = profileId => path.join(profileRoot(profileId), 'saves');

  async function locked(profileId, action) {
    profileRoot(profileId);
    if (busy.has(profileId)) throw new Error('Операция с копиями этой сборки уже выполняется.');
    if (isActive(profileId)) throw new Error('Сначала закрой игру для этой сборки.');
    busy.add(profileId);
    try { return await action(); }
    finally { busy.delete(profileId); }
  }

  async function recover(profileId) {
    const saves = savesRoot(profileId);
    const previous = `${saves}.restore-previous`;
    const exists = target => fs.access(target).then(() => true, () => false);
    if (await exists(previous)) {
      if (await exists(saves)) await fs.rm(previous, { recursive: true, force: true });
      else await fs.rename(previous, saves);
    }
  }

  async function copyTree(source, destination, stats) {
    await fs.mkdir(destination, { recursive: true });
    for (const entry of await fs.readdir(source, { withFileTypes: true })) {
      const from = path.join(source, entry.name);
      const to = path.join(destination, entry.name);
      const info = await fs.lstat(from);
      if (info.isSymbolicLink()) throw new Error('Символические ссылки в папке миров не копируются.');
      if (info.isDirectory()) await copyTree(from, to, stats);
      else if (info.isFile()) { await fs.copyFile(from, to); stats.files++; stats.bytes += info.size; }
      else throw new Error('В папке миров найден неподдерживаемый файл.');
    }
  }

  async function listUnlocked(profileId) {
    let entries;
    try { entries = await fs.readdir(backupRoot(profileId), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    const backups = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !BACKUP_ID.test(entry.name)) continue;
      try {
        const manifest = JSON.parse(await fs.readFile(path.join(backupRoot(profileId), entry.name, 'manifest.json'), 'utf8'));
        if (manifest.id === entry.name && ['manual', 'auto', 'pre-restore'].includes(manifest.mode)) backups.push(manifest);
      } catch {}
    }
    return backups.sort((a, b) => b.id.localeCompare(a.id));
  }

  async function createUnlocked(profileId, mode, retention) {
    await recover(profileId);
    const saves = savesRoot(profileId);
    let entries;
    try { entries = await fs.readdir(saves, { withFileTypes: true }); }
    catch (error) {
      if (error.code === 'ENOENT' && mode === 'auto') return null;
      if (error.code === 'ENOENT') throw new Error('В этой сборке пока нет миров для копирования.');
      throw error;
    }
    const worlds = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    if (!worlds.length) {
      if (mode === 'auto') return null;
      throw new Error('В этой сборке пока нет миров для копирования.');
    }
    const root = backupRoot(profileId);
    await fs.mkdir(root, { recursive: true });
    const id = `${new Date().toISOString().replaceAll(':', '-').replace('.', '-')}-${crypto.randomBytes(4).toString('hex')}`;
    const staging = path.join(root, `.partial-${id}`);
    const final = path.join(root, id);
    const stats = { files: 0, bytes: 0 };
    try {
      await copyTree(saves, path.join(staging, 'saves'), stats);
      const manifest = { id, createdAt: new Date().toISOString(), mode, worlds, files: stats.files, bytes: stats.bytes };
      await fs.writeFile(path.join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
      await fs.rename(staging, final);
      if (mode === 'auto') {
        const count = Number.isInteger(retention) && retention >= 1 && retention <= 20 ? retention : 5;
        for (const old of (await listUnlocked(profileId)).filter(item => item.mode === 'auto').slice(count)) {
          await fs.rm(path.join(root, old.id), { recursive: true, force: true });
        }
      }
      return manifest;
    } catch (error) {
      await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  async function restoreUnlocked(profileId, backupId) {
    if (!BACKUP_ID.test(String(backupId))) throw new Error('Некорректная копия мира.');
    await recover(profileId);
    const selected = (await listUnlocked(profileId)).find(item => item.id === backupId);
    if (!selected) throw new Error('Копия мира не найдена.');
    const source = path.join(backupRoot(profileId), backupId, 'saves');
    const sourceInfo = await fs.lstat(source);
    if (!sourceInfo.isDirectory() || sourceInfo.isSymbolicLink()) throw new Error('Копия мира повреждена.');
    const saves = savesRoot(profileId);
    const staging = `${saves}.restore-next`;
    const previous = `${saves}.restore-previous`;
    const exists = target => fs.access(target).then(() => true, () => false);
    await fs.mkdir(profileRoot(profileId), { recursive: true });
    await fs.rm(staging, { recursive: true, force: true });
    const hadWorlds = await exists(saves);
    const safety = hadWorlds ? await createUnlocked(profileId, 'pre-restore', 5) : null;
    try {
      await copyTree(source, staging, { files: 0, bytes: 0 });
      if (hadWorlds) await fs.rename(saves, previous);
      try { await fs.rename(staging, saves); }
      catch (error) {
        if (hadWorlds) await fs.rename(previous, saves);
        throw error;
      }
      if (hadWorlds) await fs.rm(previous, { recursive: true, force: true });
      return { restored: selected, safetyBackup: safety };
    } finally {
      await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
    }
  }

  return {
    isBusy: () => busy.size > 0,
    list: profileId => listUnlocked(profileId),
    create: (profileId, mode = 'manual', retention = 5) => locked(profileId, () => createUnlocked(profileId, mode === 'auto' ? 'auto' : 'manual', retention)),
    restore: (profileId, backupId) => locked(profileId, () => restoreUnlocked(profileId, backupId)),
    remove: (profileId, backupId) => locked(profileId, async () => {
      if (!BACKUP_ID.test(String(backupId)) || !(await listUnlocked(profileId)).some(item => item.id === backupId)) throw new Error('Копия мира не найдена.');
      await fs.rm(path.join(backupRoot(profileId), backupId), { recursive: true, force: true });
      return true;
    }),
    folder: profileId => backupRoot(profileId),
  };
}

module.exports = { createWorldBackups };
