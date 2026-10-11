const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { openZip, safePath } = require('./zip-reader.cjs');
const { loaderAvailable } = require('./game-loader.cjs');
const { withDownloadResponse } = require('./download-response.cjs');

const allowedSources = new Set(['cdn.modrinth.com', 'github.com', 'raw.githubusercontent.com', 'gitlab.com']);
const loaderKeys = { 'fabric-loader': 'Fabric', 'quilt-loader': 'Quilt', forge: 'Forge', neoforge: 'NeoForge' };
const MAX_FILE = 256 * 1024 * 1024;

function checkedRelative(value) {
  const relative = safePath(value);
  if (value.endsWith('/') || relative.split('/').length > 30) throw new Error('Некорректный путь файла в сборке.');
  return relative;
}

function parseIndex(bytes) {
  if (bytes.length > 4 * 1024 * 1024) throw new Error('Описание сборки слишком большое.');
  let index;
  try { index = JSON.parse(bytes.toString('utf8')); } catch { throw new Error('Некорректный modrinth.index.json.'); }
  if (index?.formatVersion !== 1 || index.game !== 'minecraft' || !Array.isArray(index.files) || index.files.length > 5000 || !index.dependencies || typeof index.dependencies.minecraft !== 'string') throw new Error('Неподдерживаемый формат .mrpack.');
  const name = String(index.name || '').trim().slice(0, 48);
  const version = index.dependencies.minecraft;
  if (!name || !/^[A-Za-z0-9._ -]{1,64}$/.test(version)) throw new Error('Некорректное имя или версия Minecraft в сборке.');
  const loaders = Object.entries(loaderKeys).filter(([key]) => index.dependencies[key]);
  if (loaders.length > 1) throw new Error('Сборка указывает сразу несколько загрузчиков.');
  const loader = loaders.length ? loaders[0][1] : 'Vanilla';
  if (!loaderAvailable(version, loader)) throw new Error(`${loader} не поддерживается для Minecraft ${version} в Astra.`);
  const files = [], seen = new Set();
  let totalBytes = 0;
  for (const entry of index.files) {
    const relative = checkedRelative(entry?.path);
    const key = relative.toLowerCase();
    if (seen.has(key)) throw new Error('В сборке повторяется путь к файлу.');
    seen.add(key);
    if (entry.env?.client === 'unsupported') continue;
    if (!Array.isArray(entry.downloads) || !entry.downloads.length || entry.downloads.length > 8 || !/^[a-f0-9]{128}$/i.test(entry.hashes?.sha512 || '') || !Number.isSafeInteger(entry.fileSize) || entry.fileSize < 0 || entry.fileSize > MAX_FILE) throw new Error(`Некорректный файл сборки: ${relative}.`);
    totalBytes += entry.fileSize;
    if (totalBytes > 8 * 1024 * 1024 * 1024) throw new Error('Сборка слишком большая для этой версии Astra.');
    files.push({ path: relative, downloads: entry.downloads, hash: entry.hashes.sha512.toLowerCase(), size: entry.fileSize });
  }
  return { name, version, loader, loaderVersion: loaders.length ? String(index.dependencies[loaders[0][0]]) : '', files };
}

function checkedUrl(value, first) {
  let address;
  try { address = new URL(value); } catch { throw new Error('Некорректный адрес файла сборки.'); }
  const host = address.hostname.toLowerCase();
  if (address.protocol !== 'https:' || address.username || address.password || !host.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith('.local') || host === 'localhost' || first && !allowedSources.has(host)) throw new Error('Небезопасный адрес файла сборки.');
  return address.href;
}

async function fetchFile(url, expectedSize, signal) {
  let address = checkedUrl(url, true);
  for (let redirect = 0; redirect <= 5; redirect++) {
    const result = await withDownloadResponse(address, { redirect: 'manual', signal, headers: { 'User-Agent': 'AstraLauncher/0.9.17' } }, async (response, touch) => {
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      if (redirect === 5) throw new Error('Слишком много перенаправлений при загрузке.');
      return { redirect: checkedUrl(new URL(response.headers.get('location') || '', address).href, false) };
    }
    if (!response.ok) throw new Error(`Сервер файла ответил кодом ${response.status}.`);
    if (Number(response.headers.get('content-length') || 0) > expectedSize) throw new Error('Размер файла сборки не совпал.');
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      touch();
      size += chunk.length;
      if (size > expectedSize) throw new Error('Размер файла сборки не совпал.');
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    if (bytes.length !== expectedSize) throw new Error('Файл сборки скачался не полностью.');
    return { bytes };
    });
    if (result.redirect) { address = result.redirect; continue; }
    return result.bytes;
  }
}

function createModpackInstaller({ userData, onProgress = () => {} }) {
  let active = null;
  const root = path.join(userData, 'instances');
  function progress(phase, completed, total, message) { onProgress({ phase, completed, total, message }); }
  async function install(source) {
    if (active) throw new Error('Другая сборка уже устанавливается.');
    const controller = new AbortController();
    active = controller;
    const id = crypto.randomUUID();
    const staging = path.join(root, `.install-${id}`);
    const final = path.join(root, id);
    let zip;
    try {
      progress('resolving', 0, 0, 'Получаем файл сборки…');
      const input = typeof source === 'function' ? await source(controller.signal) : source;
      if (controller.signal.aborted) throw new Error('Установка отменена.');
      await fs.mkdir(staging, { recursive: true });
      let filename = input.path;
      if (input.bytes) {
        filename = path.join(staging, 'pack.mrpack');
        await fs.writeFile(filename, input.bytes);
      }
      zip = await openZip(filename);
      const entry = zip.entries.find(item => item.name === 'modrinth.index.json');
      if (!entry) throw new Error('В архиве нет modrinth.index.json. Нужен файл .mrpack.');
      const manifest = parseIndex(await zip.read(entry));
      const targetNames = new Set(manifest.files.map(item => item.path.toLowerCase()));
      const overrides = zip.entries.filter(item => !item.isDirectory && (item.name.startsWith('overrides/') || item.name.startsWith('client-overrides/')));
      for (const item of overrides) {
        const relative = checkedRelative(item.name.substring(item.name.indexOf('/') + 1));
        if (relative.toLowerCase() === 'astra-pack.json') throw new Error('Сборка пытается заменить служебный файл Astra.');
      }
      const total = manifest.files.length + overrides.length;
      let completed = 0;
      progress('install', 0, total, `Устанавливаем ${manifest.name}…`);
      for (const item of manifest.files) {
        if (controller.signal.aborted) throw new Error('Установка отменена.');
        let bytes, lastError;
        for (const address of item.downloads) {
          try {
            bytes = await fetchFile(address, item.size, controller.signal);
            if (crypto.createHash('sha512').update(bytes).digest('hex') !== item.hash) throw new Error('Контрольная сумма файла не совпала.');
            break;
          } catch (error) { bytes = null; lastError = error; if (controller.signal.aborted) throw error; }
        }
        if (!bytes) throw new Error(`Не удалось загрузить ${item.path}: ${lastError?.message || 'нет доступного адреса'}`);
        const target = path.join(staging, ...item.path.split('/'));
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, bytes, { flag: 'wx' });
        progress('install', ++completed, total, item.path);
      }
      for (const layer of ['overrides/', 'client-overrides/']) {
        for (const item of overrides.filter(value => value.name.startsWith(layer))) {
          if (controller.signal.aborted) throw new Error('Установка отменена.');
          const relative = checkedRelative(item.name.slice(layer.length));
          const target = path.join(staging, ...relative.split('/'));
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, await zip.read(item));
          progress('install', ++completed, total, relative);
        }
      }
      await zip.close(); zip = null;
      if (input.bytes) await fs.rm(filename, { force: true });
      if (controller.signal.aborted) throw new Error('Установка отменена.');
      const profile = { id, name: manifest.name, version: manifest.version, loader: manifest.loader, loaderVersion: manifest.loaderVersion, art: 'forest', mods: [], last: 'Импортирована', source: input.catalog ? 'modrinth' : 'local-mrpack' };
      await fs.writeFile(path.join(staging, 'astra-pack.json'), JSON.stringify(profile), { flag: 'wx' });
      try { await fs.rename(staging, final); }
      catch (error) {
        if (!['EPERM', 'EACCES'].includes(error.code)) throw error;
        try {
          await fs.cp(staging, final, { recursive: true, force: false, errorOnExist: true, filter: sourcePath => path.basename(sourcePath) !== 'astra-pack.json' });
          await fs.writeFile(path.join(final, 'astra-pack.json'), JSON.stringify(profile), { flag: 'wx' });
          await fs.rm(staging, { recursive: true, force: true });
        } catch (copyError) { await fs.rm(final, { recursive: true, force: true }).catch(() => {}); throw copyError; }
      }
      progress('complete', total, total, `Сборка ${manifest.name} установлена.`);
      return { profile, folder: final, files: manifest.files.length, overrides: overrides.length };
    } catch (error) {
      if (controller.signal.aborted) error = new Error('Установка отменена.');
      if (zip) await zip.close().catch(() => {});
      await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
      progress('error', 0, 0, error.message);
      throw error;
    } finally { active = null; }
  }
  async function recover() {
    await fs.mkdir(root, { recursive: true });
    const entries = await fs.readdir(root, { withFileTypes: true });
    const profiles = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^[a-f0-9-]{36}$/i.test(entry.name)) continue;
      try {
        const profile = JSON.parse(await fs.readFile(path.join(root, entry.name, 'astra-pack.json'), 'utf8'));
        if (profile.id === entry.name) profiles.push(profile);
      } catch { /* ordinary instance */ }
    }
    return profiles;
  }
  return { install, recover, cancel() { if (!active) return false; active.abort(); return true; } };
}

module.exports = { createModpackInstaller, parseIndex, checkedRelative };
