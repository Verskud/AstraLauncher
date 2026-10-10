const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const HOSTS = new Set(['piston-meta.mojang.com', 'launchermeta.mojang.com', 'piston-data.mojang.com', 'launcher.mojang.com', 'libraries.minecraft.net', 'resources.download.minecraft.net']);
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9._ -]{1,64}$/.test(id) && id !== '.' && id !== '..';
const validSha = hash => typeof hash === 'string' && /^[a-f0-9]{40}$/i.test(hash);
const abortError = () => Object.assign(new Error('Загрузка отменена.'), { name: 'AbortError' });

function officialUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.username || url.password || url.port) throw new Error('Недопустимый адрес игрового файла.');
  return url.href;
}

function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\')) throw new Error('Недопустимый путь игрового файла.');
  const parts = relative.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || !/^[a-zA-Z0-9._+()-]+$/.test(part))) throw new Error('Недопустимый путь игрового файла.');
  return path.join(root, ...parts);
}

async function sha1(file) {
  const hash = crypto.createHash('sha1');
  const stream = require('node:fs').createReadStream(file);
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest('hex');
}

function allowedLibrary(library) {
  if (!Array.isArray(library.rules)) return true;
  let allowed = false;
  for (const rule of library.rules) {
    const os = rule.os;
    const osMatches = !os || (os.name === 'windows' && (!os.arch || (os.arch === 'x86' ? process.arch === 'ia32' : os.arch === process.arch)) && (!os.version || new RegExp(os.version).test(require('node:os').release())));
    const featuresMatch = !rule.features || Object.values(rule.features).every(value => value === false);
    if (osMatches && featuresMatch) allowed = rule.action === 'allow';
  }
  return allowed;
}

function createInstaller({ root, fetchImpl = fetch, onProgress = () => {} }) {
  let active = null;
  const emit = state => onProgress({ ...state });
  async function fetchResponse(url, signal) {
    const response = await fetchImpl(officialUrl(url), { signal });
    if (response.url && new URL(response.url).protocol !== 'https:') throw new Error('Небезопасная переадресация игрового файла.');
    if (!response.ok || !response.body) throw new Error(`Сервер Minecraft ответил кодом ${response.status}.`);
    return response;
  }
  async function downloadFile(url, target, expectedSha, signal, notify = () => {}) {
    if (!validSha(expectedSha)) throw new Error('Некорректная контрольная сумма Minecraft.');
    try { if ((await sha1(target)).toLowerCase() === expectedSha.toLowerCase()) return false; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await fs.mkdir(path.dirname(target), { recursive: true });
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (signal.aborted) throw abortError();
      const temp = `${target}.astra-part`;
      try {
        await fs.rm(temp, { force: true });
        const response = await fetchResponse(url, signal);
        const digest = crypto.createHash('sha1');
        let bytes = 0;
        const counter = new Transform({ transform(chunk, _encoding, done) { digest.update(chunk); bytes += chunk.length; notify(bytes); done(null, chunk); } });
        await pipeline(Readable.fromWeb(response.body), counter, require('node:fs').createWriteStream(temp), { signal });
        if (digest.digest('hex').toLowerCase() !== expectedSha.toLowerCase()) throw new Error('Контрольная сумма файла Minecraft не совпала.');
        await fs.rm(target, { force: true });
        await fs.rename(temp, target);
        return true;
      } catch (error) {
        await fs.rm(temp, { force: true }).catch(() => {});
        if (signal.aborted) throw abortError();
        lastError = error;
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    throw lastError;
  }
  async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
  async function downloadJson(url, target, hash, signal) {
    await downloadFile(url, target, hash, signal);
    return readJson(target);
  }
  function status(version) {
    if (!validId(version)) throw new Error('Некорректная версия Minecraft.');
    if (active?.version === version) return { ...active.state };
    return fs.access(safePath(root, `versions/${version}/installed.json`)).then(() => ({ version, phase: 'done', installed: true })).catch(() => ({ version, phase: 'idle', installed: false }));
  }
  async function install(version) {
    if (!validId(version)) throw new Error('Некорректная версия Minecraft.');
    if (active) throw new Error(`Уже загружается Minecraft ${active.version}.`);
    const controller = new AbortController();
    const job = { version, controller, state: { version, phase: 'metadata', installed: false, done: 0, total: 0, bytes: 0 } };
    active = job;
    const update = fields => { Object.assign(job.state, fields); emit(job.state); };
    const signal = controller.signal;
    const folder = safePath(root, `versions/${version}`);
    const marker = path.join(folder, 'installed.json');
    try {
      update({ phase: 'metadata' });
      const manifestResponse = await fetchResponse(MANIFEST, signal);
      const manifest = await manifestResponse.json();
      const entry = manifest.versions?.find(item => item.id === version);
      if (!entry || !validSha(entry.sha1)) throw new Error('Этой версии нет в официальном каталоге Mojang.');
      const metadata = await downloadJson(entry.url, path.join(folder, `${version}.json`), entry.sha1, signal);
      if (metadata.id !== version || !metadata.downloads?.client || !metadata.assetIndex || !Array.isArray(metadata.libraries)) throw new Error('Неполные данные версии Minecraft.');
      const index = await downloadJson(metadata.assetIndex.url, safePath(root, `assets/indexes/${metadata.assetIndex.id}.json`), metadata.assetIndex.sha1, signal);
      if (!index.objects || typeof index.objects !== 'object') throw new Error('Некорректный список ресурсов Minecraft.');

      const files = [];
      const add = (info, target) => {
        if (!info?.url || !validSha(info.sha1)) throw new Error('Неполные данные игрового файла.');
        files.push({ url: officialUrl(info.url), target, hash: info.sha1 });
      };
      add(metadata.downloads.client, path.join(folder, `${version}.jar`));
      for (const library of metadata.libraries || []) {
        if (!allowedLibrary(library)) continue;
        if (library.downloads?.artifact) add(library.downloads.artifact, safePath(root, `libraries/${library.downloads.artifact.path}`));
        const nativeName = library.natives?.windows?.replace('${arch}', process.arch === 'ia32' ? '32' : '64');
        if (nativeName && library.downloads?.classifiers?.[nativeName]) {
          const native = library.downloads.classifiers[nativeName];
          add(native, safePath(root, `libraries/${native.path}`));
        }
      }
      const hashes = new Set();
      for (const item of Object.values(index.objects)) {
        if (!validSha(item.hash)) throw new Error('Некорректная контрольная сумма ресурса Minecraft.');
        const hash = item.hash.toLowerCase();
        if (hashes.has(hash)) continue;
        hashes.add(hash);
        add({ url: `https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`, sha1: hash }, safePath(root, `assets/objects/${hash.slice(0, 2)}/${hash}`));
      }
      const unique = [...new Map(files.map(file => [file.target, file])).values()];
      await fs.rm(marker, { force: true });
      update({ phase: 'downloading', total: unique.length, done: 0 });
      let cursor = 0;
      const worker = async () => {
        while (cursor < unique.length) {
          if (signal.aborted) throw abortError();
          const file = unique[cursor++];
          await downloadFile(file.url, file.target, file.hash, signal);
          update({ done: job.state.done + 1 });
        }
      };
      try { await Promise.all(Array.from({ length: Math.min(8, unique.length) }, worker)); }
      catch (error) { controller.abort(); throw error; }
      const markerTemp = `${marker}.astra-part`;
      await fs.writeFile(markerTemp, JSON.stringify({ version, installedAt: new Date().toISOString(), files: unique.length }), { mode: 0o600 });
      await fs.rename(markerTemp, marker);
      update({ phase: 'done', installed: true });
      return { version, installed: true, files: unique.length, folder };
    } catch (error) {
      update({ phase: signal.aborted ? 'cancelled' : 'error', error: error.message });
      throw error;
    } finally { active = null; }
  }
  function cancel() { if (!active) return false; active.controller.abort(); return true; }
  return { install, status, cancel };
}

module.exports = { createInstaller, allowedLibrary, safePath };
