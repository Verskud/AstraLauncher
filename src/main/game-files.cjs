const fs = require('node:fs/promises');
const nativeFs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');
const { pipeline } = require('node:stream/promises');

const allowedHosts = new Set([
  'meta.fabricmc.net', 'maven.fabricmc.net', 'meta.quiltmc.org', 'maven.quiltmc.org',
  'maven.minecraftforge.net', 'maven.neoforged.net', 'repo.maven.apache.org', 'libraries.minecraft.net',
  'launchermeta.mojang.com', 'launcher.mojang.com', 'piston-meta.mojang.com', 'piston-data.mojang.com',
  'api.modrinth.com', 'cdn.modrinth.com', 'api.curseforge.com',
  'login.microsoftonline.com', 'user.auth.xboxlive.com', 'xsts.auth.xboxlive.com',
  'api.minecraftservices.com',
]);
function safeUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !allowedHosts.has(url.hostname)) throw new Error('Недопустимый адрес загрузки.');
  return url;
}
function response(url, options = {}, redirects = 0) {
  const address = safeUrl(url);
  return new Promise((resolve, reject) => {
    const request = https.request(address, { method: options.method || 'GET', headers: options.headers || {}, timeout: 60000 }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects >= 5) return reject(new Error('Слишком много переадресаций.'));
        response(new URL(res.headers.location, address).href, options, redirects + 1).then(resolve, reject);
        return;
      }
      resolve(res);
    });
    request.on('timeout', () => request.destroy(new Error('Сервер долго не отвечает.')));
    request.on('error', reject);
    request.end(options.body);
  });
}
async function getJson(url, options = {}) {
  const res = await response(url, options);
  if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); throw new Error(`Сервер ответил кодом ${res.statusCode}.`); }
  const chunks = []; let size = 0;
  for await (const chunk of res) { size += chunk.length; if (size > 20_000_000) throw new Error('Ответ слишком большой.'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function hashFile(file, algorithm) {
  const digest = crypto.createHash(algorithm);
  for await (const chunk of nativeFs.createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
}
async function downloadFile(url, target, hash, algorithm = 'sha1') {
  if (!['sha1','sha512'].includes(algorithm) || !new RegExp(`^[a-f0-9]{${algorithm === 'sha1' ? 40 : 128}}$`, 'i').test(hash)) throw new Error('Нет надёжной контрольной суммы файла.');
  try { if ((await hashFile(target, algorithm)).toLowerCase() === hash.toLowerCase()) return; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.astra-part`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fs.rm(temp, { force: true });
      const res = await response(url);
      if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); throw new Error(`Загрузка прервана: ${res.statusCode}.`); }
      await pipeline(res, nativeFs.createWriteStream(temp));
      if ((await hashFile(temp, algorithm)).toLowerCase() !== hash.toLowerCase()) throw new Error('Контрольная сумма файла не совпала.');
      await fs.rename(temp, target).catch(async error => { if (error.code !== 'EEXIST' && error.code !== 'EPERM') throw error; await fs.rm(target, { force: true }); await fs.rename(temp, target); });
      return;
    } catch (error) {
      await fs.rm(temp, { force: true }).catch(() => {});
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}
function relativePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..' || !/^[\w.+()@-]+$/.test(part))) throw new Error('Недопустимый путь файла.');
  return path.join(root, ...relative.split('/'));
}
module.exports = { getJson, downloadFile, relativePath, hashFile };
