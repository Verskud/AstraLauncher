const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { allowedLibrary } = require('./minecraft-install.cjs');
const { validateProfile, instanceFolder, getLoaderProfile, mavenPath } = require('./game-loader.cjs');
const { getJava } = require('./game-java.cjs');
const microsoft = require('./microsoft.cjs');
const { relativePath } = require('./game-files.cjs');
const { checkModFolder } = require('./mod-compat.cjs');

let running = null;
function offlineAccount(name) {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) throw new Error('Для локального запуска укажи имя из 3–16 латинских букв, цифр или _.');
  const hash = crypto.createHash('md5').update(`OfflinePlayer:${name}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x30; hash[8] = (hash[8] & 0x3f) | 0x80;
  return { name, uuid: hash.toString('hex'), token: '0', userType: 'legacy' };
}
const LAUNCH_FEATURES = Object.freeze({
  has_custom_resolution: true,
  has_quick_plays_support: true,
  is_demo_user: false,
  is_quick_play_singleplayer: false,
  is_quick_play_multiplayer: false,
  is_quick_play_realms: false,
});
function matchesRules(value, features = LAUNCH_FEATURES) {
  if (!Array.isArray(value.rules)) return true;
  let allowed = false;
  for (const rule of value.rules) {
    const osMatch = !rule.os || (rule.os.name === 'windows' && (!rule.os.arch || rule.os.arch === (process.arch === 'x64' ? 'x86_64' : 'x86')) && (!rule.os.version || new RegExp(rule.os.version).test(os.release())));
    const featuresMatch = !rule.features || Object.entries(rule.features).every(([name, enabled]) => (features[name] ?? false) === enabled);
    if (osMatch && featuresMatch) allowed = rule.action === 'allow';
  }
  return allowed;
}
function expand(value, substitutions) { return String(value).replace(/\$\{([^}]+)\}/g, (_match, key) => { if (!Object.hasOwn(substitutions, key)) throw new Error(`Неизвестный параметр запуска: ${key}`); return String(substitutions[key]); }); }
function args(items, substitutions, features = LAUNCH_FEATURES) {
  return (items || []).flatMap(item => {
    if (typeof item === 'string') return [expand(item, substitutions)];
    if (!matchesRules(item, features)) return [];
    return (Array.isArray(item.value) ? item.value : [item.value]).map(value => expand(value, substitutions));
  });
}
function zipNativeFiles(buffer) {
  const files = [];
  const end = buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  if (end < 0 || end + 22 > buffer.length) throw new Error('Повреждён архив библиотек.');
  let offset = buffer.readUInt32LE(end + 16);
  const count = buffer.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Повреждён архив библиотек.');
    const method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const local = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    offset += 46 + nameLength + extraLength + commentLength;
    if (!/\.dll$/i.test(name) || name.startsWith('META-INF/') || name.includes('..') || name.includes('\\')) continue;
    if (name.includes('/arm64/') || name.includes('/x86/')) continue;
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const input = buffer.subarray(dataStart, dataStart + compressed);
    const output = method === 0 ? input : method === 8 ? zlib.inflateRawSync(input) : null;
    if (!output || output.length > 100_000_000) throw new Error('Неизвестный формат библиотеки.');
    files.push({ name: path.posix.basename(name), data: output });
  }
  return files;
}
async function nativeDirectory(root, libraries, folder) {
  await fs.mkdir(folder, { recursive: true });
  for (const library of libraries) {
    if (!allowedLibrary(library)) continue;
    const namedClassifier = String(library.name || '').split(':')[3];
    if (namedClassifier?.startsWith('natives-windows')) {
      if (namedClassifier !== 'natives-windows' || !library.downloads?.artifact?.path) continue;
      const file = relativePath(root, `libraries/${library.downloads.artifact.path}`);
      for (const item of zipNativeFiles(await fs.readFile(file))) await fs.writeFile(path.join(folder, item.name), item.data);
      continue;
    }
    const classifier = library.natives?.windows?.replace('${arch}', process.arch === 'ia32' ? '32' : '64');
    const native = classifier && library.downloads?.classifiers?.[classifier];
    if (!native?.path) continue;
    const file = relativePath(root, `libraries/${native.path}`);
    for (const item of zipNativeFiles(await fs.readFile(file))) await fs.writeFile(path.join(folder, item.name), item.data);
  }
}
function libraryJar(root, library) {
  if (!allowedLibrary(library)) return null;
  const classifier = String(library.name || '').split(':')[3];
  if (classifier?.startsWith('natives-windows') && classifier !== 'natives-windows') return null;
  if (library.natives?.windows && !library.downloads?.artifact) return null;
  const relative = library.downloads?.artifact?.path || (library.name ? mavenPath(library.name) : null);
  return relative ? relativePath(root, `libraries/${relative}`) : null;
}
function mergeLibraries(base, overlay) {
  const map = new Map();
  for (const library of [...base, ...(overlay || [])]) {
    if (!allowedLibrary(library)) continue;
    const parts = String(library.name || '').split(':');
    map.set(parts.length >= 2 ? `${parts[0]}:${parts[1]}:${parts[3] || ''}` : library.name, library);
  }
  return [...map.values()];
}
async function launch(profile, context) {
  validateProfile(profile);
  if (running) throw new Error('Игра уже запущена.');
  const { userData, minecraftRoot, onProgress } = context;
  const marker = relativePath(minecraftRoot, `versions/${profile.version}/installed.json`);
  try { await fs.access(marker); } catch { throw new Error(`Сначала скачай Minecraft ${profile.version} в сборке.`); }
  await require('./launch-repair.cjs').repairSkinConflict(userData, profile, onProgress);
  if (profile.loader === 'Fabric' || profile.loader === 'Quilt') await checkModFolder(path.join(instanceFolder(userData, profile.id), 'mods'));
  const metadata = JSON.parse(await fs.readFile(relativePath(minecraftRoot, `versions/${profile.version}/${profile.version}.json`), 'utf8'));
  const java = await getJava(minecraftRoot, metadata, onProgress);
  const loader = await getLoaderProfile(profile, minecraftRoot, java, onProgress);
  const directory = instanceFolder(userData, profile.id);
  const natives = path.join(directory, '.astra-natives');
  await fs.mkdir(directory, { recursive: true });
  await nativeDirectory(minecraftRoot, metadata.libraries, natives);
  const libraries = mergeLibraries(metadata.libraries, loader?.libraries);
  const classpath = [];
  for (const library of libraries) {
    const jar = libraryJar(minecraftRoot, library);
    if (jar) { await fs.access(jar); classpath.push(jar); }
  }
  if (!['Forge','NeoForge'].includes(profile.loader) || loader?.minecraftArguments) classpath.push(relativePath(minecraftRoot, `versions/${profile.version}/${profile.version}.jar`));
  const account = profile.accountMode === 'microsoft' ? await microsoft.minecraftAccount() : profile.accountMode === 'ely' ? await require('./ely-account.cjs').current().account() : offlineAccount(profile.playerName || 'Player');
  const extraJvm = [];
  if (profile.accountMode === 'ely') {
    if (/^1\.[0-6](?:\.|$)/.test(profile.version) || ['1.7','1.7.1'].includes(profile.version) || metadata.type === 'old_alpha' || metadata.type === 'old_beta') throw new Error('Вход Ely.by поддерживается начиная с Minecraft 1.7.2.');
    onProgress({phase:'loader',message:'Подготавливаем авторизацию Ely.by…'});
    extraJvm.push(`-javaagent:${await require('./ely-account.cjs').injector(minecraftRoot)}=ely.by`);
  }
  const substitutions = {
    natives_directory: natives, launcher_name: 'ASTRA', launcher_version: '0.9.26',
    classpath: classpath.join(path.delimiter), classpath_separator: path.delimiter,
    library_directory: path.join(minecraftRoot, 'libraries'),
    auth_player_name: account.name, version_name: loader?.id || profile.version,
    game_directory: directory, assets_root: path.join(minecraftRoot, 'assets'),
    game_assets: path.join(minecraftRoot, 'assets', 'virtual', 'legacy'),
    assets_index_name: metadata.assets || metadata.assetIndex.id,
    auth_uuid: account.uuid, auth_access_token: account.token,
    auth_session: `token:${account.token}:${account.uuid}`,
    clientid: '', auth_xuid: account.xuid || '', user_type: account.userType,
    client: '', user_properties_map: '{}',
    quickPlayPath: '', quickPlaySingleplayer: '', quickPlayMultiplayer: '', quickPlayRealms: '',
    version_type: loader ? 'release' : metadata.type || 'release',
    resolution_width: '1280', resolution_height: '720', user_properties: '{}',
  };
  const loaderArguments = loader?.arguments || loader?.args;
  const jvm = [...args(metadata.arguments?.jvm || ['-Djava.library.path=${natives_directory}', '-cp', '${classpath}'], substitutions), ...args(loaderArguments?.jvm, substitutions)];
  const game = loader?.minecraftArguments
    ? args(String(loader.minecraftArguments).split(/\s+/), substitutions)
    : [...args(metadata.arguments?.game || String(metadata.minecraftArguments || '').split(/\s+/), substitutions), ...args(loaderArguments?.game, substitutions)];
  const mainClass = loader?.mainClass || metadata.mainClass;
  if (!/^[\w.$]+$/.test(mainClass)) throw new Error('Некорректный главный класс Minecraft.');
  const memory = Number(profile.memory);
  const params = [`-Xmx${Number.isInteger(memory) && memory >= 2 && memory <= 32 ? memory : 4}G`, ...extraJvm, ...jvm, mainClass, ...game];
  onProgress({ phase: 'starting', message: `Запускаем ${profile.name || 'Minecraft'}…` });
  const javaw = path.join(path.dirname(java), 'javaw.exe');
  const executable = await fs.access(javaw).then(() => javaw, () => java);
  const child = spawn(executable, params, { cwd: directory, windowsHide: false, stdio: ['ignore', 'pipe', 'pipe'] });
  running = { child, id: profile.id, log: '' };
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { if (running?.child === child) { const text=running.log+chunk.toString();running.log=(account.token.length>20?text.replaceAll(account.token,'[token]'):text).slice(-8000); } });
  const launchLog = path.join(directory, 'astra-launch.log');
  child.on('error', async error => { if (running?.child === child) { await fs.writeFile(launchLog, `${running.log}\n${error.message}`, { mode: 0o600 }).catch(() => {}); running = null; onProgress({ phase: 'error', message: `${error.message} Журнал: ${launchLog}` }); } });
  child.on('close', async code => { if (running?.child === child) { const log = running.log; await fs.writeFile(launchLog, log, { mode: 0o600 }).catch(() => {}); running = null; onProgress({ phase: code === 0 ? 'closed' : 'error', profileId: profile.id, detail: log.split(/\r?\n/).filter(line => /Exception|Caused by:|ERROR|requires|incompatible/i.test(line)).slice(-12).join('\n'), message: code === 0 ? 'Игра закрыта.' : `Игра завершилась с кодом ${code}.` }); } });
  return { started: true, profileId: profile.id };
}
function status() { return running ? { running: true, profileId: running.id, pid: running.child.pid } : { running: false }; }
module.exports = { launch, status, offlineAccount, matchesRules, expand, args, LAUNCH_FEATURES, zipNativeFiles };
