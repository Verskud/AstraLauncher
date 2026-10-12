const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createReadStream } = require('node:fs');
const { instanceFolder, validateProfile } = require('./game-loader.cjs');
const { openZip, safePath } = require('./zip-reader.cjs');
const { hashFile } = require('./game-files.cjs');
const { matchesVersion, checkFabricCompatibility } = require('./mod-compat.cjs');

const folders = { mods: 'mods', resources: 'resourcepacks', shaders: 'shaderpacks' };
const MAX_FILE = 1024 * 1024 * 1024;

async function realDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Папка сборки не должна быть ссылкой.');
}

async function inspect(filename, kind, profile) {
  const zip = await openZip(filename, { maxEntry: MAX_FILE, maxTotal: 8 * MAX_FILE });
  try {
    const files = zip.entries.filter(entry => !entry.isDirectory);
    const curseManifest = files.find(entry => entry.name === 'manifest.json');
    let cursePack = false;
    if (curseManifest && curseManifest.unpacked < 4 * 1024 * 1024) {
      try { const data = JSON.parse((await zip.read(curseManifest)).toString('utf8')); cursePack = data.manifestType === 'minecraftModpack' || Boolean(data.minecraft && Array.isArray(data.files)); } catch {}
    }
    if (cursePack || files.some(entry => ['modrinth.index.json', 'astra-export.json'].includes(entry.name))) {
      throw new Error('Это архив сборки, а не отдельный мод или пак. CurseForge ZIP с manifest.json содержит ссылки на моды и пока не устанавливается автоматически.');
    }
    if (kind === 'resources') {
      const manifest = files.find(entry => entry.name === 'pack.mcmeta');
      if (!manifest || manifest.unpacked > 1024 * 1024) throw new Error('В корне ресурспака нет pack.mcmeta. Выбери готовый ZIP ресурспака.');
      const data = JSON.parse((await zip.read(manifest)).toString('utf8'));
      if (!data.pack || typeof data.pack !== 'object') throw new Error('Некорректное описание ресурспака.');
      return null;
    }
    if (kind === 'shaders') {
      if (!files.some(entry => entry.name.startsWith('shaders/'))) throw new Error('В корне ZIP нет папки shaders. Выбери готовый архив шейдеров.');
      return null;
    }
    const fabric = files.find(entry => entry.name === 'fabric.mod.json');
    const quilt = files.some(entry => entry.name === 'quilt.mod.json');
    const forge = files.some(entry => ['META-INF/mods.toml', 'META-INF/neoforge.mods.toml', 'mcmod.info'].includes(entry.name));
    if (!fabric && !quilt && !forge && !files.some(entry => entry.name.endsWith('.class'))) throw new Error('В JAR не найдены файлы мода.');
    let metadata = null;
    if (fabric) {
      if (fabric.unpacked > 1024 * 1024) throw new Error('Описание мода слишком большое.');
      metadata = JSON.parse((await zip.read(fabric)).toString('utf8'));
      if (typeof metadata.id !== 'string' || typeof metadata.version !== 'string') throw new Error('Некорректное описание Fabric-мода.');
    }
    const loader = profile.loader.toLowerCase();
    if (loader === 'fabric' && !fabric || loader === 'quilt' && !fabric && !quilt) throw new Error('Этот мод не подходит к загрузчику сборки. Скачай файл для ' + profile.loader + '.');
    if (['forge', 'neoforge'].includes(loader) && (fabric || quilt) && !forge) throw new Error('Это мод Fabric/Quilt. Скачай файл для ' + profile.loader + '.');
    if (['fabric', 'quilt'].includes(loader) && metadata?.depends?.minecraft && !matchesVersion(profile.version, metadata.depends.minecraft)) {
      throw new Error(`${metadata.name || metadata.id} не подходит для Minecraft ${profile.version}.`);
    }
    return metadata;
  } finally { await zip.close(); }
}

async function importFiles(userData, profile, kind, sources) {
  validateProfile(profile);
  if (!Object.hasOwn(folders, kind)) throw new Error('Неизвестный тип файлов.');
  if (kind === 'mods' && profile.loader === 'Vanilla') throw new Error('Для модов сначала выбери загрузчик в параметрах сборки.');
  if (!Array.isArray(sources) || !sources.length || sources.length > 100) throw new Error('Выбери от 1 до 100 файлов.');
  const root = instanceFolder(userData, profile.id);
  await realDirectory(path.dirname(root));
  await realDirectory(root);
  const destination = path.join(root, folders[kind]);
  await realDirectory(destination);
  const staging = await fs.mkdtemp(path.join(root, '.content-import-'));
  const planned = [], installed = [], skipped = [], seen = new Set();
  let total = 0;
  try {
    for (const source of sources) {
      const name = path.basename(source);
      safePath(name);
      if (!(kind === 'mods' ? /\.jar$/i : /\.zip$/i).test(name)) throw new Error('Выбери ' + (kind === 'mods' ? 'моды .jar' : 'архивы .zip') + '.');
      if (seen.has(name.toLowerCase())) throw new Error('Выбраны два файла с одним именем: ' + name);
      seen.add(name.toLowerCase());
      const info = await fs.lstat(source);
      if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_FILE) throw new Error('Недопустимый файл или размер больше 1 ГБ: ' + name);
      total += info.size;
      if (total > 4 * MAX_FILE) throw new Error('Выбрано больше 4 ГБ файлов. Добавь их несколькими партиями.');
      const target = path.join(destination, name), staged = path.join(staging, name);
      await fs.copyFile(source, staged, fs.constants.COPYFILE_EXCL);
      if ((await fs.stat(staged)).size !== info.size) throw new Error('Файл изменился во время копирования: ' + name);
      const metadata = await inspect(staged, kind, profile);
      const hash = await hashFile(staged, 'sha512');
      try {
        const existing = await fs.lstat(target);
        if (!existing.isFile() || existing.isSymbolicLink() || await hashFile(target, 'sha512') !== hash) throw new Error('В сборке уже есть другой файл ' + name + '. Отключи или удали старый файл перед добавлением.');
        skipped.push(name);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        planned.push({ staged, target, metadata, name });
      }
    }
    if (kind === 'mods' && ['Fabric', 'Quilt'].includes(profile.loader)) {
      const existing = [];
      for (const name of (await fs.readdir(destination)).filter(name => /\.jar$/i.test(name))) {
        try {
          const target = path.join(destination, name);
          if ((await fs.lstat(target)).isSymbolicLink()) throw new Error('Мод не должен быть ссылкой.');
          existing.push({ metadata: await inspect(target, kind, profile) });
        } catch (error) {

          if (error.message === 'Мод не должен быть ссылкой.') throw error;
        }
      }
      checkFabricCompatibility([...existing, ...planned.map(item => ({ metadata: item.metadata }))]);
    }
    for (const item of planned) {

      const handle = await fs.open(item.target, 'wx');
      installed.push({ path: item.target, filename: item.name, name: item.metadata?.name || item.name.replace(/\.(jar|zip)$/i, ''), kind, profileId: profile.id, source: 'local', version: item.metadata?.version || '', disabled: false });
      try {
        for await (const chunk of createReadStream(item.staged)) {
          let offset = 0;
          while (offset < chunk.length) {
            const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset);
            if (!bytesWritten) throw new Error('Не удалось записать файл ' + item.name);
            offset += bytesWritten;
          }
        }
      } finally { await handle.close(); }
    }
    return { installed, skipped };
  } catch (error) {
    await Promise.all(installed.map(item => fs.rm(item.path, { force: true })));
    throw error;
  } finally { await fs.rm(staging, { recursive: true, force: true }); }
}

module.exports = { importFiles, folders };
