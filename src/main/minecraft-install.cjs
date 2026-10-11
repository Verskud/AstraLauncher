const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const HOSTS = new Set(['piston-meta.mojang.com', 'launchermeta.mojang.com', 'piston-data.mojang.com', 'launcher.mojang.com', 'libraries.minecraft.net', 'resources.download.minecraft.net']);
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9._ -]{1,64}$/.test(id) && id !== '.' && id !== '..';
const validSha = hash => typeof hash === 'string' && /^[a-f0-9]{40}$/i.test(hash);
const abortError = () => Object.assign(new Error('Загрузка отменена.'), { name: 'AbortError' });
const downloadAgent = new https.Agent({ keepAlive: true, maxSockets: 16, maxFreeSockets: 16 });

function httpsRequest(value, { signal }, redirects = 0) {
  const url = officialUrl(value);
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const request = https.get(url, { signal, timeout: 60000, agent: downloadAgent }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        if (redirects >= 5) return reject(new Error('Слишком много переадресаций Mojang.'));
        let next;
        try { next = officialUrl(new URL(response.headers.location, url).href); }
        catch (error) { return reject(error); }
        httpsRequest(next, { signal }, redirects + 1).then(resolve, reject);
        return;
      }
      resolve({ status: response.statusCode, body: response });
    });
    request.on('timeout', () => request.destroy(new Error('Сервер Minecraft слишком долго не отвечает.')));
    request.on('error', reject);
  });
}

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

function filePlan(root, version, metadata, index) {
  if (metadata.id !== version || !metadata.downloads?.client || !metadata.assetIndex || !Array.isArray(metadata.libraries) || !index.objects || typeof index.objects !== 'object') throw new Error('Неполные данные версии Minecraft.');
  const files = [];
  const add = (info, target) => {
    if (!info?.url || !validSha(info.sha1)) throw new Error('Неполные данные игрового файла.');
    files.push({ url: officialUrl(info.url), target, hash: info.sha1 });
  };
  add(metadata.downloads.client, safePath(root, `versions/${version}/${version}.jar`));
  for (const library of metadata.libraries) {
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
  return [...new Map(files.map(file => [file.target, file])).values()];
}

function createInstaller({ root, requestImpl = httpsRequest, onProgress = () => {} }) {
  let active = null;
  const emit = state => { try { onProgress({ ...state }); } catch { /* The window may have closed while downloading. */ } };
  async function fetchResponse(url, signal) {
    const response = await requestImpl(officialUrl(url), { signal });
    if (response.status < 200 || response.status >= 300 || !response.body) {
      response.body?.resume?.();
      throw new Error(`Сервер Minecraft ответил кодом ${response.status}.`);
    }
    return response;
  }
  async function responseJson(response, signal) {
    let size = 0;
    const chunks = [];
    for await (const chunk of response.body) {
      if (signal.aborted) throw abortError();
      size += chunk.length;
      if (size > 20_000_000) throw new Error('Ответ Mojang слишком большой.');
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
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
        await pipeline(response.body, counter, require('node:fs').createWriteStream(temp), { signal });
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
  async function storedPlan(version) {
    const metadataPath = safePath(root, `versions/${version}/${version}.json`);
    let metadata;
    try { metadata = await readJson(metadataPath); }
    catch (error) { if (error.code === 'ENOENT') return { files: [], indexPath: null }; throw error; }
    const indexPath = safePath(root, `assets/indexes/${metadata.assetIndex.id}.json`);
    let index;
    try { index = await readJson(indexPath); }
    catch (error) { if (error.code === 'ENOENT') return { files: [], indexPath }; throw error; }
    return { files: filePlan(root, version, metadata, index), indexPath };
  }
  async function purgeVersion(version, knownFiles) {
    const current = knownFiles ? { files: knownFiles, indexPath: (await storedPlan(version)).indexPath } : await storedPlan(version);
    const protectedFiles = new Set();
    let entries = [];
    try { entries = await fs.readdir(safePath(root, 'versions'), { withFileTypes: true }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === version || !validId(entry.name)) continue;
      try { await fs.access(safePath(root, `versions/${entry.name}/installed.json`)); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      const other = await storedPlan(entry.name);
      if (!other.indexPath) throw new Error('Не удалось проверить общие файлы другой установленной версии.');
      for (const file of other.files) protectedFiles.add(file.target);
      protectedFiles.add(other.indexPath);
    }
    const targets = [...new Set([...current.files.map(file => file.target), current.indexPath].filter(Boolean))]
      .filter(target => !protectedFiles.has(target));
    let cursor = 0;
    const removeWorker = async () => {
      while (cursor < targets.length) {
        const target = targets[cursor++];
        await fs.rm(target, { force: true });
        await fs.rm(`${target}.astra-part`, { force: true });
      }
    };
    await Promise.all(Array.from({ length: Math.min(16, targets.length) }, removeWorker));
    const folder = safePath(root, `versions/${version}`);
    if (!path.resolve(folder).startsWith(path.resolve(root) + path.sep)) throw new Error('Недопустимый путь удаления версии.');
    await fs.rm(folder, { recursive: true, force: true });
    return targets.length;
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
    const job = { version, controller, cancelRequested: false, files: null, state: { version, phase: 'metadata', installed: false, done: 0, total: 0 } };
    job.finished = new Promise(resolve => { job.resolveFinished = resolve; });
    active = job;
    const update = fields => { Object.assign(job.state, fields); emit(job.state); };
    const signal = controller.signal;
    const folder = safePath(root, `versions/${version}`);
    const marker = path.join(folder, 'installed.json');
    try {
      update({ phase: 'metadata' });
      const manifestResponse = await fetchResponse(MANIFEST, signal);
      const manifest = await responseJson(manifestResponse, signal);
      const entry = manifest.versions?.find(item => item.id === version);
      if (!entry || !validSha(entry.sha1)) throw new Error('Этой версии нет в официальном каталоге Mojang.');
      const metadata = await downloadJson(entry.url, path.join(folder, `${version}.json`), entry.sha1, signal);
      const index = await downloadJson(metadata.assetIndex.url, safePath(root, `assets/indexes/${metadata.assetIndex.id}.json`), metadata.assetIndex.sha1, signal);
      const unique = filePlan(root, version, metadata, index);
      job.files = unique;
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
      const workers = Array.from({ length: Math.min(12, unique.length) }, worker);
      try { await Promise.all(workers); }
      catch (error) { controller.abort(); await Promise.allSettled(workers); throw error; }
      if (signal.aborted) throw abortError();
      const markerTemp = `${marker}.astra-part`;
      await fs.writeFile(markerTemp, JSON.stringify({ version, installedAt: new Date().toISOString(), files: unique.length }), { mode: 0o600 });
      await fs.rename(markerTemp, marker);
      if (signal.aborted) throw abortError();
      update({ phase: 'done', installed: true });
      return { version, installed: true, files: unique.length, folder };
    } catch (error) {
      if (job.cancelRequested) {
        try {
          update({ phase: 'removing', error: undefined });
          await purgeVersion(version, job.files);
          update({ phase: 'cancelled', done: 0, total: 0, installed: false });
          return { version, installed: false, cancelled: true };
        } catch (cleanupError) {
          if (cleanupError.name === 'AbortError') throw cleanupError;
          update({ phase: 'error', error: `Не удалось полностью удалить версию: ${cleanupError.message}` });
          throw cleanupError;
        }
      }
      update({ phase: 'error', error: error.message });
      throw error;
    } finally { active = null; job.resolveFinished(); }
  }
  async function cancel() {
    if (!active) return false;
    const job = active;
    job.cancelRequested = true;
    job.controller.abort();
    await job.finished;
    return true;
  }
  return { install, status, cancel };
}

module.exports = { createInstaller, allowedLibrary, safePath };
