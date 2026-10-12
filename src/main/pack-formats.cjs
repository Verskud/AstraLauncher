const path = require('node:path');
const { openZip, safePath } = require('./zip-reader.cjs');
const { validateProfile } = require('./game-loader.cjs');

const excluded = new Set(['logs', 'crash-reports', '.mixin.out', '.git', '.env', '__macosx', 'astra-pack.json', 'astra-skins.json', 'launcher_accounts.json', 'accounts.json', 'integrations.json', 'usercache.json', 'usernamecache.json', 'servers.dat', 'servers.dat_old']);
const gameFolders = new Set(['mods', 'config', 'defaultconfigs', 'resourcepacks', 'shaderpacks', 'texturepacks', 'saves', 'scripts', 'kubejs', 'datapacks', 'global_packs', 'paxi', 'resources', 'customskinloader']);
const loaderIds = { forge: 'Forge', neoforge: 'NeoForge', fabric: 'Fabric', quilt: 'Quilt' };

function profileMetadata(input) {
  const name = String(input.name || '').trim().slice(0, 48);
  if (!name) throw new Error('Укажи название сборки.');
  const profile = { name, version: input.version, loader: input.loader || 'Vanilla', loaderVersion: input.loaderVersion || '', art: input.art || 'forest' };
  validateProfile({ ...profile, id: '00000000-0000-0000-0000-000000000000' });
  if (typeof profile.loaderVersion !== 'string' || profile.loaderVersion && !/^[A-Za-z0-9._+-]{1,80}$/.test(profile.loaderVersion)) throw new Error('Некорректная версия загрузчика в сборке.');
  return profile;
}

function parseLoader(list, version) {
  if (!Array.isArray(list)) throw new Error('В сборке нет корректного списка загрузчиков.');
  const selected = list.filter(item => item.primary === true);
  if (selected.length > 1 || !selected.length && list.length > 1) throw new Error('Сборка содержит несколько загрузчиков без однозначного основного.');
  const item = selected[0] || list[0];
  if (!item) return { loader: 'Vanilla', loaderVersion: '' };
  const match = /^(forge|neoforge|fabric|quilt)(?:-loader)?-(.+)$/i.exec(item.id || '');
  if (!match) throw new Error('Загрузчик из архива пока не поддерживается.');
  let loaderVersion = match[2];
  if (match[1].toLowerCase() === 'forge' && loaderVersion.startsWith(version + '-')) loaderVersion = loaderVersion.slice(version.length + 1);
  return { loader: loaderIds[match[1].toLowerCase()], loaderVersion };
}

async function readJson(zip, entry) {
  if (entry.isDirectory || entry.unpacked > 4 * 1024 * 1024) throw new Error('Описание сборки слишком большое или некорректное.');
  try { return JSON.parse((await zip.read(entry)).toString('utf8').replace(/^\uFEFF/, '')); }
  catch (error) { throw new Error(`Не удалось прочитать ${entry.name}: ${error.message}`); }
}

function extraction(zip, prefix, strict = false) {
  const files = [], targets = new Set();
  for (const entry of zip.entries) {
    if (entry.isDirectory || !entry.name.startsWith(prefix)) continue;
    const relative = safePath(entry.name.slice(prefix.length));
    if (relative.split('/').some(part => excluded.has(part.toLowerCase()))) {
      if (strict) throw new Error('В архиве найден служебный файл.');
      continue;
    }
    const key = relative.toLowerCase();
    if (targets.has(key)) throw new Error('В архиве повторяется путь файла сборки.');
    targets.add(key);
    files.push({ entry, path: relative });
  }
  return files;
}

async function describeArchive(zip, filename, settings) {
  const entries = zip.entries.filter(item => !item.isDirectory && !item.name.startsWith('__MACOSX/'));
  const known = ['astra-export.json', 'modrinth.index.json', 'mmc-pack.json', 'manifest.json', 'minecraftinstance.json'];
  const roots = [...new Set(entries.filter(item => known.includes(path.posix.basename(item.name))).map(item => item.name.slice(0, -path.posix.basename(item.name).length)))].filter(prefix => entries.every(item => item.name.startsWith(prefix) || /^(?:readme|license|changelog)[^/]*$/i.test(item.name))).sort((a,b) => a.length - b.length);
  for (const prefix of roots) {
    const find = name => entries.find(entry => entry.name === prefix + name);
    const astra = find('astra-export.json');
    if (astra) {
      const data = await readJson(zip, astra);
      if (data.format !== 'astra-instance-v1') throw new Error('Неподдерживаемый формат экспорта ASTRA.');
      if (entries.some(entry => entry.name.startsWith(prefix) && entry !== astra && !entry.name.startsWith(prefix + 'instance/'))) throw new Error('Некорректный путь в ZIP-сборке ASTRA.');
      return { type: 'astra', manifest: profileMetadata(data.profile), extracted: extraction(zip, prefix + 'instance/', true) };
    }
    const modrinth = find('modrinth.index.json');
    if (modrinth) return { type: 'modrinth', index: await readJson(zip, modrinth), prefix };
    const prism = find('mmc-pack.json');
    if (prism) {
      const data = await readJson(zip, prism);
      if (data.formatVersion !== 1 || !Array.isArray(data.components)) throw new Error('Неподдерживаемый формат сборки Prism / MultiMC.');
      const minecraft = data.components.filter(item => item.uid === 'net.minecraft');
      const loaders = data.components.filter(item => ['net.minecraftforge', 'net.neoforged', 'net.fabricmc.fabric-loader', 'org.quiltmc.quilt-loader'].includes(item.uid));
      if (minecraft.length !== 1 || loaders.length > 1) throw new Error('В сборке Prism не указана однозначная версия Minecraft или загрузчика.');
      let name = path.basename(filename).replace(/\.(zip|mrpack)$/i, '');
      const cfg = find('instance.cfg');
      if (cfg && cfg.unpacked <= 100000) name = /^name=(.+)$/m.exec((await zip.read(cfg)).toString('utf8'))?.[1].trim() || name;
      const loader = loaders[0];
      const names = { 'net.minecraftforge': 'Forge', 'net.neoforged': 'NeoForge', 'net.fabricmc.fabric-loader': 'Fabric', 'org.quiltmc.quilt-loader': 'Quilt' };
      const gamePrefix = entries.some(entry => entry.name.startsWith(prefix + 'minecraft/')) ? prefix + 'minecraft/' : prefix + '.minecraft/';
      const extracted = extraction(zip, gamePrefix);
      if (!extracted.length) throw new Error('В экспорте Prism нет игровой папки minecraft или .minecraft.');
      return { type: 'prism', manifest: profileMetadata({ name, version: minecraft[0].version, loader: loader ? names[loader.uid] : 'Vanilla', loaderVersion: loader?.version }), extracted };
    }
    const curse = find('manifest.json');
    if (curse) {
      const data = await readJson(zip, curse);
      if (data.manifestType !== 'minecraftModpack') continue;
      if (data.manifestVersion !== 1 || !Array.isArray(data.files) || data.files.length > 5000 || typeof data.minecraft?.version !== 'string') throw new Error('Неподдерживаемый манифест CurseForge.');
      const overrides = safePath(data.overrides || 'overrides');
      const seen = new Set();
      const files = data.files.map(item => {
        if (!Number.isSafeInteger(item.projectID) || item.projectID <= 0 || !Number.isSafeInteger(item.fileID) || item.fileID <= 0) throw new Error('Некорректный ID файла CurseForge в сборке.');
        if (seen.has(item.fileID)) throw new Error('В манифесте CurseForge повторяется файл.');
        seen.add(item.fileID);
        return { source: 'curseforge', projectID: item.projectID, fileID: item.fileID, required: item.required !== false };
      });
      return { type: 'curseforge', manifest: { ...profileMetadata({ name: data.name || path.basename(filename, '.zip'), version: data.minecraft.version, ...parseLoader(data.minecraft.modLoaders, data.minecraft.version) }), files }, extracted: extraction(zip, prefix + overrides + '/') };
    }
    const installed = find('minecraftinstance.json');
    if (installed) {
      const data = await readJson(zip, installed);
      const version = data.minecraftVersion || data.gameVersion || data.baseModLoader?.minecraftVersion;
      if (typeof version !== 'string') throw new Error('В профиле CurseForge не указана версия Minecraft.');
      const id = data.baseModLoader?.name || data.baseModLoader?.id;
      const loader = typeof id === 'string' ? parseLoader([{ id }], version) : { loader: 'Vanilla' };
      return { type: 'curseforge-installed', manifest: profileMetadata({ name: data.name || path.basename(filename, '.zip'), version, ...loader }), extracted: extraction(zip, prefix).filter(item => item.entry !== installed) };
    }
  }
  let prefix = '';
  const firstParts = new Set(entries.map(entry => entry.name.split('/')[0]));
  if (firstParts.size === 1 && entries.every(entry => entry.name.includes('/')) && !gameFolders.has([...firstParts][0].toLowerCase())) prefix = [...firstParts][0] + '/';
  if (entries.some(entry => entry.name.startsWith(prefix + 'minecraft/'))) prefix += 'minecraft/';
  else if (entries.some(entry => entry.name.startsWith(prefix + '.minecraft/'))) prefix += '.minecraft/';
  const extracted = extraction(zip, prefix);
  if (!extracted.some(item => gameFolders.has(item.path.split('/')[0].toLowerCase()))) throw new Error('В архиве нет сборки Minecraft. Поддерживаются CurseForge, Modrinth, Prism / MultiMC, ASTRA и ZIP игровой папки с mods или config. RAR и 7z сначала распакуй и сохрани как ZIP.');
  const name = path.basename(filename).replace(/\.(zip|mrpack)$/i, '').slice(0, 48);
  if (!settings) return { type: 'folder', needsSettings: true, name };
  return { type: 'folder', manifest: profileMetadata({ ...settings, name: settings.name || name }), extracted };
}

async function inspectArchive(filename) {
  const zip = await openZip(filename, { maxEntry: 1024 * 1024 * 1024, maxTotal: 8 * 1024 * 1024 * 1024 });
  try { const result = await describeArchive(zip, filename); return { type: result.type, needsSettings: !!result.needsSettings, name: result.name || result.manifest?.name || result.index?.name }; }
  finally { await zip.close(); }
}

module.exports = { describeArchive, inspectArchive, profileMetadata };
