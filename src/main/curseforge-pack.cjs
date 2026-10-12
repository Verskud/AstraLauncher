const fs = require('node:fs/promises');
const path = require('node:path');
const { safePath, openZip } = require('./zip-reader.cjs');
const { withDownloadResponse } = require('./download-response.cjs');
const { writeResponseFile, retryDownload } = require('./download-stream.cjs');

const MAX_FILE = 1024 * 1024 * 1024;
function filePage(item) { return `https://www.curseforge.com/projects/${item.projectID}/files/${item.fileID}`; }
function checkedAddress(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !(url.hostname === 'www.curseforge.com' || /^(?:[a-z0-9-]+\.)*forgecdn\.net$/.test(url.hostname))) throw new Error('Неожиданный адрес загрузки CurseForge.');
  return url.href;
}
function checkedName(value) {
  const name = safePath(value);
  if (name.includes('/') || !/\.(jar|zip)$/i.test(name)) throw new Error('CurseForge вернул неподдерживаемый файл. Нужен JAR мода или ZIP пакета.');
  return name;
}
async function fileKind(filename, name) {
  const handle = await fs.open(filename, 'r');
  try {
    const info = await handle.stat(), signature = Buffer.alloc(4);
    await handle.read(signature, 0, 4, 0);
    if (info.size < 22 || info.size > MAX_FILE || signature.readUInt32LE(0) !== 0x04034b50 && signature.readUInt32LE(0) !== 0x06054b50) throw new Error('Вместо мода или пакета скачался повреждённый файл или страница сайта.');
  } finally { await handle.close(); }
  if (/\.jar$/i.test(name)) return 'mods';
  const zip = await openZip(filename, { maxEntry: MAX_FILE, maxTotal: 8 * MAX_FILE });
  try { return zip.entries.some(entry => /^(?:[^/]+\/)?shaders\//i.test(entry.name)) ? 'shaderpacks' : 'resourcepacks'; }
  finally { await zip.close(); }
}

async function downloadCurseForgeFile(item, staging, { signal, onProgress = () => {}, manualDownload } = {}) {
  const temp = path.join(staging, `.curseforge-${item.fileID}.part`);
  let filename;
  try {
    await retryDownload(async () => {
      await fs.rm(temp, { force: true });
      let address = `https://www.curseforge.com/api/v1/mods/${item.projectID}/files/${item.fileID}/download`;
      for (let redirects = 0; redirects <= 5; redirects++) {
        signal?.throwIfAborted();
        const result = await withDownloadResponse(address, { redirect: 'manual', signal, headers: { 'User-Agent': 'AstraLauncher/1.0.1' } }, async (response, touch) => {
          if ([301,302,303,307,308].includes(response.status)) {
            await response.body?.cancel();
            if (redirects === 5 || !response.headers.get('location')) throw new Error('Некорректное перенаправление CurseForge.');
            return { redirect: checkedAddress(new URL(response.headers.get('location'), address).href) };
          }
          if (!response.ok) { await response.body?.cancel(); throw Object.assign(new Error(`CurseForge не отдал файл ${item.fileID}: HTTP ${response.status}.`), { status: response.status }); }
          const disposition = response.headers.get('content-disposition') || '';
          const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
          const plain = /filename="([^"]+)"/i.exec(disposition)?.[1];
          filename = checkedName(encoded ? decodeURIComponent(encoded) : plain || decodeURIComponent(new URL(address).pathname.split('/').pop()));
          await writeResponseFile(response, temp, { limit: MAX_FILE, signal, touch, onProgress });
          return {};
        }, { idleTimeoutMs: 30000 });
        if (result.redirect) { address = result.redirect; continue; }
        return;
      }
    }, signal);
  } catch (error) {
    await fs.rm(temp, { force: true });
    signal?.throwIfAborted();
    if (![403,404,451].includes(error.status) || !manualDownload) throw new Error(`Не удалось получить файл CurseForge ${item.fileID}. ${error.message} Страница файла: ${filePage(item)}`);
    const selected = await manualDownload({ ...item, url: filePage(item), filename }, signal);
    signal?.throwIfAborted();
    if (!selected) throw new Error('Установка отменена: не выбран необходимый файл CurseForge.');
    const selectedName = checkedName(path.basename(selected));
    if (filename && selectedName !== filename) throw new Error(`Выбран другой файл. Для этой сборки нужен ${filename}.`);
    filename = selectedName;
    if ((await fs.stat(selected)).size > MAX_FILE) throw new Error('Файл CurseForge превышает 1 ГБ.');
    await fs.copyFile(selected, temp, fs.constants.COPYFILE_EXCL);
  }
  try {
    const folder = await fileKind(temp, filename);
    signal?.throwIfAborted();
    const relative = `${folder}/${filename}`, target = path.join(staging, folder, filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(temp, target, fs.constants.COPYFILE_EXCL);
    return { path: relative, size: (await fs.stat(temp)).size };
  } finally { await fs.rm(temp, { force: true }); }
}

module.exports = { downloadCurseForgeFile, filePage };
