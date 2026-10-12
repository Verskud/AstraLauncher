const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { getJson, downloadFile, relativePath } = require('./game-files.cjs');

const MANIFEST = 'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';
async function javaVersion(file) {
  return new Promise(resolve => {
    const child = spawn(file, ['-version'], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
    let output = '';
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', () => resolve(0));
    child.on('close', () => {
      const match = output.match(/version "(?:1\.)?(\d+)[.\"]/);
      resolve(match ? Number(match[1]) : 0);
    });
  });
}
async function getJava(root, metadata, onProgress = () => {}) {
  const component = metadata.javaVersion?.component;
  const major = Number(metadata.javaVersion?.majorVersion);
  if (!component || !/^[a-z0-9-]{1,40}$/.test(component) || !Number.isInteger(major)) throw new Error('В данных Minecraft нет подходящей версии Java.');
  const output = relativePath(root, `java/${component}/bin/java.exe`);
  if (await javaVersion(output) === major) return output;
  const existing = path.join(process.env.APPDATA || '', '.minecraft', 'runtime', component, 'windows-x64', component, 'bin', 'java.exe');
  if (await javaVersion(existing) === major) return existing;
  onProgress({ phase: 'java', message: `Скачиваем Java ${major} из Mojang…` });
  const manifest = await getJson(MANIFEST);
  const item = manifest['windows-x64']?.[component]?.[0];
  if (!item?.manifest?.url || !item.manifest.sha1) throw new Error(`Официальная Java ${major} для Windows x64 не найдена.`);
  const fileManifest = await getJson(item.manifest.url);
  const files = Object.entries(fileManifest.files || {});
  if (!files.length) throw new Error('Список файлов Java пуст.');
  let done = 0;
  for (const [name, entry] of files) {
    const target = relativePath(root, `java/${component}/${name}`);
    if (entry.type === 'directory') await fs.mkdir(target, { recursive: true });
    else if (entry.type === 'file' && entry.downloads?.raw?.url && entry.downloads.raw.sha1) await downloadFile(entry.downloads.raw.url, target, entry.downloads.raw.sha1);
    else if (entry.type === 'link') {}
    else throw new Error('Неизвестный тип файла Java.');
    done++;
    if (done % 10 === 0 || done === files.length) onProgress({ phase: 'java', message: `Java ${major}: ${done} из ${files.length} файлов` });
  }
  if (await javaVersion(output) !== major) throw new Error(`Java ${major} скачана, но не запускается.`);
  return output;
}
module.exports = { getJava, javaVersion };
