const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { app, shell } = require('electron');
const { getCurseForgeKey } = require('./preferences.cjs');
const { instanceFolder } = require('./game-loader.cjs');

function assertProject(request) {
  if (!['modrinth','curseforge'].includes(request?.source) || !['mods','modpacks','shaders','resources'].includes(request?.kind)) throw new Error('Неизвестный проект.');
  if (request.source === 'modrinth' && !/^[a-zA-Z0-9_-]{1,64}$/.test(request.id)) throw new Error('Некорректный ID проекта.');
  if (request.source === 'curseforge' && !/^\d{1,12}$/.test(String(request.id))) throw new Error('Некорректный ID проекта.');
  if (request.gameVersion && !/^\d+\.\d+(?:\.\d+)?$/.test(request.gameVersion)) throw new Error('Некорректная версия Minecraft.');
  if (request.loader && !['fabric','forge','neoforge','quilt'].includes(request.loader)) throw new Error('Некорректный загрузчик.');
}

async function api(url, key) {
  const headers = { 'User-Agent': 'AstraLauncher/0.8.2' };
  if (key) headers['x-api-key'] = key;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Источник файлов ответил кодом ${response.status}.`);
  return response.json();
}

async function resolveModrinth(request) {
  const url = new URL(`https://api.modrinth.com/v2/project/${request.id}/version`);
  url.searchParams.set('include_changelog', 'false');
  if (request.gameVersion) url.searchParams.set('game_versions', JSON.stringify([request.gameVersion]));
  const loader = request.kind === 'mods' || request.kind === 'modpacks' ? request.loader : request.kind === 'resources' ? 'minecraft' : '';
  if (loader) url.searchParams.set('loaders', JSON.stringify([loader]));
  const versions = await api(url);
  const version = versions.find(v => v.version_type === 'release' && v.files?.length) || versions.find(v => v.files?.length);
  if (!version) throw new Error('Для выбранной версии Minecraft и загрузчика нет файла.');
  const file = version.files.find(f => f.primary) || version.files[0];
  const downloadUrl = new URL(file.url);
  if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname !== 'cdn.modrinth.com') throw new Error('Неожиданный адрес файла Modrinth.');
  return { url: downloadUrl.href, filename: file.filename, sha512: file.hashes?.sha512, version: version.version_number, required: (version.dependencies || []).filter(d => d.dependency_type === 'required') };
}

async function resolveCurseForge(request) {
  const key = getCurseForgeKey();
  if (!key) throw new Error('Для загрузки CurseForge нужен API ключ.');
  const url = new URL(`https://api.curseforge.com/v1/mods/${request.id}/files`);
  url.searchParams.set('pageSize', '50');
  if (request.gameVersion) url.searchParams.set('gameVersion', request.gameVersion);
  const data = await api(url, key);
  const files = (data.data || []).filter(f => !request.loader || request.kind === 'shaders' || request.kind === 'resources' || (f.gameVersions || []).some(v => v.toLowerCase() === request.loader));
  const file = files.find(f => f.releaseType === 1) || files[0];
  if (!file) throw new Error('Для выбранной версии Minecraft и загрузчика нет файла.');
  const result = await api(`https://api.curseforge.com/v1/mods/${request.id}/files/${file.id}/download-url`, key);
  if (!result.data) throw new Error('Автор не разрешил прямую загрузку этого файла через CurseForge API.');
  const downloadUrl = new URL(result.data);
  if (downloadUrl.protocol !== 'https:' || !downloadUrl.hostname.endsWith('.forgecdn.net')) throw new Error('Неожиданный адрес файла CurseForge.');
  return { url: downloadUrl.href, filename: file.fileName, version: file.displayName, sha1: file.hashes?.find(h => h.algo === 1)?.value, dependencies: (file.dependencies || []).filter(d => d.relationType === 3).length };
}

async function download(request) {
  assertProject(request);
  if (request.profileId && request.kind === 'modpacks') throw new Error('Сборки .mrpack нельзя положить в папку модов. Импорт сборок появится отдельно.');
  if (request.profileId && (!request.gameVersion || !request.loader)) throw new Error('Для установки выбери сборку.');
  const resolved = request.source === 'modrinth' ? await resolveModrinth(request) : await resolveCurseForge(request);
  const result = await saveResolved(request, resolved);
  if (request.profileId && request.source === 'modrinth' && request.kind === 'mods') {
    const seen = new Set([request.id]);
    const missing = [];
    const installed = [];
    async function installRequired(dependencies, depth) {
      if (depth > 12 || seen.size > 40) throw new Error('Слишком много вложенных зависимостей. Проверь страницу проекта.');
      for (const dependency of dependencies) {
        const id = dependency.project_id;
        if (!id) { missing.push(`версия ${dependency.version_id || 'неизвестна'}: у зависимости нет ID проекта`); continue; }
        if (seen.has(id)) continue;
        seen.add(id);
        try {
          const childRequest = { ...request, id };
          const child = await resolveModrinth(childRequest);
          installed.push({ ...await saveResolved(childRequest, child), name: id, source: 'modrinth' });
          await installRequired(child.required || [], depth + 1);
        } catch (error) { missing.push(`${id}: ${error.message}`); }
      }
    }
    await installRequired(resolved.required || [], 0);
    result.missingDependencies = missing;
    result.installedDependencies = installed;
  }
  return result;
}

async function saveResolved(request, resolved) {
  const filename = path.basename(String(resolved.filename || 'project.zip')).replace(/[^a-zA-Z0-9._+()-]/g, '_').slice(0, 180);
  if (!filename || filename === '.' || filename === '..') throw new Error('Некорректное имя файла.');
  const response = await fetch(resolved.url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Не удалось скачать файл: ${response.status}.`);
  if (Number(response.headers.get('content-length') || 0) > 150_000_000) throw new Error('Файл слишком большой для этой версии Astra.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 150_000_000) throw new Error('Файл слишком большой для этой версии Astra.');
  if (resolved.sha512 && crypto.createHash('sha512').update(bytes).digest('hex') !== resolved.sha512) throw new Error('Контрольная сумма файла не совпала.');
  if (resolved.sha1 && crypto.createHash('sha1').update(bytes).digest('hex') !== resolved.sha1) throw new Error('Контрольная сумма файла не совпала.');
  const dir = request.profileId
    ? path.join(instanceFolder(app.getPath('userData'), request.profileId), { mods: 'mods', shaders: 'shaderpacks', resources: 'resourcepacks' }[request.kind])
    : path.join(app.getPath('downloads'), 'AstraLauncher', request.kind);
  await fs.mkdir(dir, { recursive: true });
  const stem = `${request.source}-${request.id}-${filename}`;
  let output;
  for (let index = 0; index < 1000; index++) {
    const candidate = path.join(dir, index ? `${index}-${stem}` : stem);
    try { await fs.writeFile(candidate, bytes, { flag: 'wx' }); output = candidate; break; }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  if (!output) throw new Error('Не удалось выбрать имя для скачанного файла.');
  return { path: output, filename, version: resolved.version, dependencies: resolved.required?.length || resolved.dependencies || 0, profileId: request.profileId || null, kind: request.kind };
}

async function showFile(value) {
  const target = path.resolve(String(value));
  const roots = [path.resolve(app.getPath('downloads'), 'AstraLauncher'), path.resolve(app.getPath('userData'), 'instances')];
  if (!roots.some(root => target.startsWith(root + path.sep))) throw new Error('Некорректный путь загрузки.');
  try { await fs.access(target); }
  catch { throw new Error('Файл больше не найден. Удали запись из истории загрузок.'); }
  shell.showItemInFolder(target);
}

async function openFolder() {
  const folder = path.join(app.getPath('downloads'), 'AstraLauncher');
  await fs.mkdir(folder, { recursive: true });
  const error = await shell.openPath(folder);
  if (error) throw new Error(error);
}
async function removeInstalled(value, profileId) {
  const root = path.resolve(instanceFolder(app.getPath('userData'), profileId));
  const target = path.resolve(String(value));
  if (!['mods','shaderpacks','resourcepacks'].some(folder => path.dirname(target) === path.join(root, folder))) throw new Error('Некорректный файл сборки.');
  await fs.rm(target, { force: true });
  return true;
}

module.exports = { download, showFile, openFolder, removeInstalled, resolveModrinth };
