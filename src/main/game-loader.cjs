const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { getJson, downloadFile, relativePath } = require('./game-files.cjs');

const idPattern = /^[A-Za-z0-9._ -]{1,64}$/;
const loaders = new Set(['Vanilla', 'Fabric', 'Quilt', 'Forge', 'NeoForge']);
function validateProfile(profile) {
  if (!profile || typeof profile.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(profile.id) && profile.id !== 'essentials') throw new Error('Некорректная сборка.');
  if (typeof profile.version !== 'string' || !idPattern.test(profile.version) || !loaders.has(profile.loader)) throw new Error('Некорректная версия или загрузчик.');
  if (!loaderAvailable(profile.version, profile.loader)) throw new Error(`${profile.loader} не подходит для Minecraft ${profile.version}. Выбери Forge или Vanilla в параметрах сборки.`);
  return profile;
}
function supportsNeoForge(version) {
  if (/^\d{2}\.\d+(?:\.\d+)?$/.test(version)) return Number(version.split('.')[0]) >= 26;
  const match = /^1\.(\d+)(?:\.(\d+))?$/.exec(version);
  return !!match && (Number(match[1]) > 20 || Number(match[1]) === 20 && Number(match[2] || 0) >= 2);
}
function loaderAvailable(version, loader) {
  if (loader === 'NeoForge') return supportsNeoForge(version);
  if (loader === 'Fabric' || loader === 'Quilt') {
    if (/^\d{2}\.\d+(?:\.\d+)?$/.test(version)) return Number(version.split('.')[0]) >= 26;
    const match = /^1\.(\d+)(?:\.(\d+))?$/.exec(version);
    return !!match && Number(match[1]) >= 14;
  }
  return true;
}
function instanceFolder(userData, id) { return path.join(userData, 'instances', validateProfile({ id, version: '1.21.1', loader: 'Vanilla' }).id); }
function mavenPath(name) {
  const [group, artifact, version, classifier] = String(name).split(':');
  if (![group, artifact, version].every(value => value && /^[\w.+-]+$/.test(value)) || classifier && !/^[\w.+-]+$/.test(classifier)) throw new Error('Некорректная библиотека загрузчика.');
  return `${group.replaceAll('.', '/')}/${artifact}/${version}/${artifact}-${version}${classifier ? `-${classifier}` : ''}.jar`;
}
function matchesLoaderProfile(profile, metadata, selected) {
  if (metadata?.inheritsFrom !== profile.version) return false;
  if (profile.loader === 'Forge') return metadata.id === `${profile.version}-forge-${selected.slice(profile.version.length + 1)}` || metadata.id === `${profile.version}-forge-${selected}`;
  if (profile.loader === 'NeoForge') return metadata.id === `neoforge-${selected}`;
  return false;
}
async function getLoaderProfile(profile, root, java, onProgress = () => {}) {
  validateProfile(profile);
  root = path.resolve(root);
  if (profile.loader === 'Vanilla') return null;
  const pinned = typeof profile.loaderVersion === 'string' && /^[A-Za-z0-9._+-]{1,80}$/.test(profile.loaderVersion) ? profile.loaderVersion : '';
  const folder = path.join(root, 'loaders', profile.loader.toLowerCase(), pinned ? `${profile.version}--${pinned}` : profile.version);
  const saved = path.join(folder, 'profile.json');
  try {
    const cached = JSON.parse(await fs.readFile(saved, 'utf8'));
    if (!pinned || !['Forge', 'NeoForge'].includes(profile.loader) || matchesLoaderProfile(profile, cached, profile.loader === 'Forge' ? `${profile.version}-${pinned}` : pinned)) return cached;
    // An older ASTRA build could cache another installed Forge version here.
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  onProgress({ phase: 'loader', message: `Устанавливаем ${profile.loader}…` });
  let metadata;
  if (profile.loader === 'Fabric' || profile.loader === 'Quilt') {
    const base = profile.loader === 'Fabric' ? 'https://meta.fabricmc.net/v2' : 'https://meta.quiltmc.org/v3';
    const versions = await getJson(`${base}/versions/loader/${encodeURIComponent(profile.version)}`);
    const stable = pinned ? versions.find(item => item.loader?.version === pinned) : versions.find(item => item.loader?.stable) || versions[0];
    if (!stable?.loader?.version) throw new Error(`${profile.loader} не поддерживает Minecraft ${profile.version}.`);
    metadata = await getJson(`${base}/versions/loader/${encodeURIComponent(profile.version)}/${encodeURIComponent(stable.loader.version)}/profile/json`);
    if (!metadata.mainClass || !Array.isArray(metadata.libraries)) throw new Error('Некорректный профиль загрузчика.');
    for (const library of metadata.libraries) {
      const relative = mavenPath(library.name);
      const baseUrl = library.url || (profile.loader === 'Fabric' ? 'https://maven.fabricmc.net/' : 'https://maven.quiltmc.org/repository/release/');
      const url = new URL(relative, baseUrl).href;
      // Fabric and Quilt metadata often omit hashes. The Maven artifact itself is checked against its published SHA-1.
      const hash = library.sha1 || (await getJsonText(`${url}.sha1`)).trim().split(/\s/)[0];
      await downloadFile(url, relativePath(root, `libraries/${relative}`), hash);
    }
  } else {
    const neoforge = profile.loader === 'NeoForge';
    const base = neoforge ? 'https://maven.neoforged.net/releases/net/neoforged/neoforge/' : 'https://maven.minecraftforge.net/net/minecraftforge/forge/';
    const xml = await getJsonText(`${base}maven-metadata.xml`);
    const candidates = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(match => match[1]);
    const matches = candidates.filter(version => neoforge ? version.startsWith(profile.version.replace(/^1\./, '') + '.') : version.startsWith(`${profile.version}-`));
    const selected = pinned ? matches.find(version => version === (neoforge ? pinned : `${profile.version}-${pinned}`)) : matches.at(-1);
    if (!selected) throw new Error(`${profile.loader} не поддерживает Minecraft ${profile.version}.`);
    const artifact = neoforge ? 'neoforge' : 'forge';
    const jarName = `${artifact}-${selected}-installer.jar`;
    const url = `${base}${selected}/${jarName}`;
    const hash = (await getJsonText(`${url}.sha1`)).trim().split(/\s/)[0];
    const installer = relativePath(root, `installers/${artifact}/${jarName}`);
    await downloadFile(url, installer, hash);
    const profiles = path.join(root, 'launcher_profiles.json');
    try { await fs.access(profiles); }
    catch (error) { if (error.code !== 'ENOENT') throw error; await fs.writeFile(profiles, JSON.stringify({ profiles: {} }), { mode: 0o600 }); }
    await runJava(java, ['-jar', installer, '--installClient', root], root);
    const versionRoot = path.join(root, 'versions');
    const entries = await fs.readdir(versionRoot, { withFileTypes: true });
    const candidatesJson = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.toLowerCase().includes(artifact) || !entry.name.includes(neoforge ? selected : profile.version)) continue;
      const file = path.join(versionRoot, entry.name, `${entry.name}.json`);
      try { candidatesJson.push({ file, data: JSON.parse(await fs.readFile(file, 'utf8')) }); } catch { /* another version */ }
    }
    metadata = candidatesJson.find(item => matchesLoaderProfile(profile, item.data, selected))?.data;
    if (!metadata) throw new Error(`Установщик ${profile.loader} не создал профиль версии.`);
  }
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(saved, JSON.stringify(metadata), { mode: 0o600 });
  return metadata;
}
async function getJsonText(url) {
  const https = require('node:https');
  const allowed = ['meta.fabricmc.net', 'maven.fabricmc.net', 'meta.quiltmc.org', 'maven.quiltmc.org', 'maven.minecraftforge.net', 'maven.neoforged.net', 'repo.maven.apache.org'];
  const address = new URL(url);
  if (address.protocol !== 'https:' || !allowed.includes(address.hostname)) throw new Error('Недопустимый адрес загрузчика.');
  return new Promise((resolve, reject) => https.get(address, { timeout: 60000 }, response => {
    if (response.statusCode !== 200) { response.resume(); reject(new Error(`Сервер загрузчика ответил кодом ${response.statusCode}.`)); return; }
    const chunks = []; let size = 0;
    response.on('data', chunk => { size += chunk.length; if (size > 2_000_000) response.destroy(new Error('Ответ слишком большой.')); else chunks.push(chunk); });
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    response.on('error', reject);
  }).on('error', reject));
}
async function runJava(java, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(java, args, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = (output + chunk.toString()).slice(-6000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Установщик завершился с кодом ${code}. ${output.slice(-1200)}`)));
  });
}
module.exports = { validateProfile, instanceFolder, getLoaderProfile, mavenPath, loaderAvailable, matchesLoaderProfile };
