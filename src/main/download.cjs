const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { app, shell } = require('electron');
const { getCurseForgeKey } = require('./preferences.cjs');
const { instanceFolder } = require('./game-loader.cjs');
const { hashFile } = require('./game-files.cjs');
const { fabricMetadata, matchesVersion, checkFabricCompatibility } = require('./mod-compat.cjs');
const MAX_DOWNLOAD_SIZE = 1024 * 1024 * 1024;
const { withDownloadResponse } = require('./download-response.cjs');
const { writeResponseFile, retryDownload } = require('./download-stream.cjs');
const { downloadRanges } = require('./download-ranges.cjs');

async function readResponseBytes(response, limit = MAX_DOWNLOAD_SIZE, touch = () => {}) {
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(declaredSize) && declaredSize > limit) throw new Error('Файл превышает допустимый размер загрузки.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    touch();
    size += chunk.length;
    if (size > limit) throw new Error('Файл превышает допустимый размер загрузки.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, size);
}

function assertProject(request) {
  if (!['modrinth','curseforge'].includes(request?.source) || !['mods','modpacks','shaders','resources'].includes(request?.kind)) throw new Error('Неизвестный проект.');
  if (request.source === 'modrinth' && !/^[a-zA-Z0-9_-]{1,64}$/.test(request.id)) throw new Error('Некорректный ID проекта.');
  if (request.source === 'curseforge' && !/^\d{1,12}$/.test(String(request.id))) throw new Error('Некорректный ID проекта.');
  if (request.gameVersion && !/^\d+\.\d+(?:\.\d+)?$/.test(request.gameVersion)) throw new Error('Некорректная версия Minecraft.');
  if (request.loader && !['fabric','forge','neoforge','quilt'].includes(request.loader)) throw new Error('Некорректный загрузчик.');
}

async function api(url, key, signal) {
  const headers = { 'User-Agent': 'AstraLauncher/0.9.25' };
  if (key) headers['x-api-key'] = key;
  return withDownloadResponse(url, { headers, signal }, async (response, touch) => {
  if (!response.ok) throw new Error(`Источник файлов ответил кодом ${response.status}.`);
  return JSON.parse((await readResponseBytes(response, 20_000_000, touch)).toString('utf8'));
  });
}

async function resolveModrinth(request, signal) {
  const url = new URL(`https://api.modrinth.com/v2/project/${request.id}/version`);
  url.searchParams.set('include_changelog', 'false');
  if (request.gameVersion) url.searchParams.set('game_versions', JSON.stringify([request.gameVersion]));
  const loader = request.kind === 'mods' || request.kind === 'modpacks' ? request.loader : request.kind === 'resources' ? 'minecraft' : '';
  if (loader) url.searchParams.set('loaders', JSON.stringify([loader]));
  if (request.versionId && !/^[A-Za-z0-9_-]{1,64}$/.test(request.versionId)) throw new Error('Некорректный ID версии проекта.');
  const versions = request.versionId ? [await api(`https://api.modrinth.com/v2/version/${request.versionId}`, undefined, signal)] : await api(url, undefined, signal);
  if (request.versionId && versions[0].project_id !== request.id) throw new Error('Версия принадлежит другому проекту.');
  const eligible = versions.filter(v => (!request.gameVersion || v.game_versions?.includes(request.gameVersion)) && (!loader || v.loaders?.includes(loader)) && (request.kind === 'modpacks' ? v.files?.some(f => /\.mrpack$/i.test(f.filename || '')) : v.files?.length));
  const version = eligible.find(v => v.version_type === 'release') || eligible[0];
  if (!version) throw new Error('Для выбранной версии Minecraft и загрузчика нет файла.');
  const file = request.kind === 'modpacks' ? version.files.find(f => /\.mrpack$/i.test(f.filename || '')) : version.files.find(f => f.primary) || version.files[0];
  if (!file) throw new Error('У выбранной версии нет файла .mrpack.');
  const downloadUrl = new URL(file.url);
  if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname !== 'cdn.modrinth.com') throw new Error('Неожиданный адрес файла Modrinth.');
  if (request.kind === 'modpacks' && !/^[a-f0-9]{128}$/i.test(file.hashes?.sha512 || '')) throw new Error('У сборки отсутствует контрольная сумма SHA-512.');
  return { url: downloadUrl.href, filename: file.filename, size: file.size, sha512: file.hashes?.sha512, version: version.version_number, required: (version.dependencies || []).filter(d => d.dependency_type === 'required') };
}

async function fetchResolvedToFile(resolved, target, signal, onProgress = () => {}, onRetry = () => {}) {
  const expectedSize = Number.isSafeInteger(resolved.size) && resolved.size >= 0 ? resolved.size : undefined;
  if (await retryDownload(() => downloadRanges(resolved.url, target, { size: expectedSize, limit: MAX_DOWNLOAD_SIZE, sha512: resolved.sha512, sha1: resolved.sha1, signal, onProgress }), signal, onRetry)) return expectedSize;
  return retryDownload(() => withDownloadResponse(resolved.url, { signal }, async (response, touch) => {
    if (!response.ok) throw Object.assign(new Error(`Не удалось скачать файл: ${response.status}.`), { status: response.status });
    return writeResponseFile(response, target, { limit: MAX_DOWNLOAD_SIZE, expectedSize, sha512: resolved.sha512, sha1: resolved.sha1, signal, touch, onProgress });
  }, { idleTimeoutMs: 30000 }), signal, onRetry);
}

async function fetchResolved(resolved, signal) {
  return withDownloadResponse(resolved.url, { signal }, async (response, touch) => {
  if (!response.ok) throw new Error(`Не удалось скачать файл: ${response.status}.`);
  const bytes = await readResponseBytes(response, MAX_DOWNLOAD_SIZE, touch);
  if (resolved.sha512 && crypto.createHash('sha512').update(bytes).digest('hex') !== resolved.sha512) throw new Error('Контрольная сумма файла не совпала.');
  if (resolved.sha1 && crypto.createHash('sha1').update(bytes).digest('hex') !== resolved.sha1) throw new Error('Контрольная сумма файла не совпала.');
  return bytes;
  });
}

function modrinthFile(version) {
  const file = version.files?.find(item => item.primary) || version.files?.[0];
  if (!file) throw new Error('У выбранной версии нет файла.');
  const url = new URL(file.url);
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.modrinth.com') throw new Error('Неожиданный адрес файла Modrinth.');
  return { url: url.href, filename: file.filename, sha512: file.hashes?.sha512, version: version.version_number, required: (version.dependencies || []).filter(item => item.dependency_type === 'required') };
}

async function existingModMetadata(profileId) {
  const folder = path.join(instanceFolder(app.getPath('userData'), profileId), 'mods');
  let names;
  try { names = await fs.readdir(folder); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const entries = [];
  for (const name of names.filter(value => value.toLowerCase().endsWith('.jar')).slice(0, 500)) {
    const file = path.join(folder, name);
    let metadata = null;
    try { metadata = fabricMetadata(await fs.readFile(file)); } catch { /* Another loader's JAR may have no Fabric metadata. */ }
    entries.push({ path: file, name, metadata });
  }
  return entries;
}

function isProjectFile(name, projectId) {
  return new RegExp(`^(?:\\d+-)?modrinth-${projectId}-`, 'i').test(name);
}

async function downloadModrinthMod(request) {
  const fabric = request.loader === 'fabric' || request.loader === 'quilt';
  const existing = fabric ? await existingModMetadata(request.profileId) : [];
  const planned = new Map();
  async function choose(projectId, exactVersionId, parent) {
    const next = { ...request, id: projectId };
    let versions;
    if (exactVersionId) {
      const version = await api(`https://api.modrinth.com/v2/version/${encodeURIComponent(exactVersionId)}`);
      versions = version.project_id === projectId ? [version] : [];
    } else {
      const url = new URL(`https://api.modrinth.com/v2/project/${projectId}/version`);
      url.searchParams.set('game_versions', JSON.stringify([request.gameVersion]));
      url.searchParams.set('loaders', JSON.stringify([request.loader]));
      versions = await api(url);
      versions.sort((a, b) => Number(b.version_type === 'release') - Number(a.version_type === 'release'));
    }
    for (const version of versions.slice(0, 50)) {
      if (!version.files?.length || !version.game_versions?.includes(request.gameVersion) || !version.loaders?.includes(request.loader)) continue;
      const resolved = modrinthFile(version);
      const bytes = await fetchResolved(resolved);
      const metadata = fabric ? fabricMetadata(bytes) : null;
      if (fabric && !metadata) continue;
      const id = metadata?.id;
      if (parent && id && !matchesVersion(metadata.version, parent.depends?.[id])) continue;
      if (id && existing.some(entry => entry.metadata?.depends?.[id] && !matchesVersion(metadata.version, entry.metadata.depends[id]) && !isProjectFile(entry.name, projectId))) continue;
      return { request: next, resolved, bytes, metadata, projectId };
    }
    throw new Error(`Для ${projectId} нет версии, совместимой с этой сборкой и установленными модами.`);
  }
  async function collect(projectId, exactVersionId, parent, depth) {
    if (depth > 12 || planned.size > 40) throw new Error('Слишком много вложенных зависимостей.');
    if (planned.has(projectId)) return;
    const choice = await choose(projectId, exactVersionId, parent);
    planned.set(projectId, choice);
    for (const dependency of choice.resolved.required) {
      let id = dependency.project_id;
      if (!id && dependency.version_id) id = (await api(`https://api.modrinth.com/v2/version/${encodeURIComponent(dependency.version_id)}`)).project_id;
      if (!id) throw new Error(`У зависимости ${dependency.version_id || 'без ID'} нет проекта Modrinth.`);
      await collect(id, dependency.version_id, choice.metadata, depth + 1);
    }
  }
  if (request.versionId && !/^[a-zA-Z0-9_-]{1,64}$/.test(request.versionId)) throw new Error('Некорректная версия мода.');
  await collect(request.id, request.versionId || null, null, 0);
  const replaced = [...planned.keys()];
  const kept = existing.filter(entry => !replaced.some(id => isProjectFile(entry.name, id)));
  if (fabric) checkFabricCompatibility([...kept, ...[...planned.values()].map(item => ({ metadata: item.metadata }))]);
  const installed = [];
  try {
    for (const item of planned.values()) installed.push({ ...await saveResolved(item.request, item.resolved, item.bytes), name: item.projectId, source: 'modrinth' });
  } catch (error) {
    await Promise.all(installed.filter(item => item.created).map(item => fs.rm(item.path, { force: true })));
    throw error;
  }
  for (const entry of existing) {
    if (replaced.some(id => isProjectFile(entry.name, id)) && !installed.some(item => item.path === entry.path)) await fs.rm(entry.path, { force: true });
  }
  const [root, ...dependencies] = installed;
  return { ...root, installedDependencies: dependencies, missingDependencies: [], created: undefined };
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
  if (request.profileId && (!request.gameVersion || request.kind === 'mods' && !request.loader)) throw new Error('Для установки мода выбери сборку с загрузчиком.');
  if (request.profileId && request.source === 'modrinth' && request.kind === 'mods') return downloadModrinthMod(request);
  const resolved = request.source === 'modrinth' ? await resolveModrinth(request) : await resolveCurseForge(request);
  return saveResolved(request, resolved);
}

async function saveResolved(request, resolved, preparedBytes) {
  const filename = path.basename(String(resolved.filename || 'project.zip')).replace(/[^a-zA-Z0-9._+()-]/g, '_').slice(0, 180);
  if (!filename || filename === '.' || filename === '..') throw new Error('Некорректное имя файла.');
  const bytes = preparedBytes || await fetchResolved(resolved);
  const dir = request.profileId
    ? path.join(instanceFolder(app.getPath('userData'), request.profileId), { mods: 'mods', shaders: 'shaderpacks', resources: 'resourcepacks' }[request.kind])
    : path.join(app.getPath('downloads'), 'AstraLauncher', request.kind);
  await fs.mkdir(dir, { recursive: true });
  const stem = `${request.source}-${request.id}-${filename}`;
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  let output, created = false;
  for (let index = 0; index < 1000; index++) {
    const candidate = path.join(dir, index ? `${index}-${stem}` : stem);
    try { await fs.writeFile(candidate, bytes, { flag: 'wx' }); output = candidate; created = true; break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if ((await hashFile(candidate, 'sha256')).toLowerCase() === digest) { output = candidate; break; }
    }
  }
  if (!output) throw new Error('Не удалось выбрать имя для скачанного файла.');
  return { path: output, filename, version: resolved.version, dependencies: resolved.required?.length || resolved.dependencies || 0, profileId: request.profileId || null, kind: request.kind, created };
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

async function listInstalled(profileId) {
  const root = instanceFolder(app.getPath('userData'), profileId);
  const results = [];
  for (const [kind, folder] of Object.entries({ mods: 'mods', shaders: 'shaderpacks', resources: 'resourcepacks' })) {
    let entries;
    try { entries = await fs.readdir(path.join(root, folder), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const entry of entries.slice(0, 1000)) {
      if (!entry.isFile() || !(kind === 'mods' ? /\.jar(?:\.disabled)?$/i : /\.(jar|zip)$/i).test(entry.name)) continue;
      results.push({ path: path.join(root, folder, entry.name), filename: entry.name, kind, profileId, disabled: /\.disabled$/i.test(entry.name) });
    }
  }
  return results;
}

async function openWorldsFolder(profileId) {
  const folder = path.join(instanceFolder(app.getPath('userData'), profileId), 'saves');
  await fs.mkdir(folder, { recursive: true });
  const error = await shell.openPath(folder);
  if (error) throw new Error(error);
  return true;
}

module.exports = { download, showFile, openFolder, removeInstalled, listInstalled, openWorldsFolder, resolveModrinth, fetchResolved, fetchResolvedToFile, readResponseBytes, MAX_DOWNLOAD_SIZE };
