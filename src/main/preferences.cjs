const fs = require('node:fs');
const path = require('node:path');
const { app, safeStorage } = require('electron');
const file = () => path.join(app.getPath('userData'), 'integrations.json');

function read() {
  try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch { return {}; }
}
function write(data) {
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(data), { mode: 0o600 });
}
function status() {
  const data = read();
  return { curseforgeReady: Boolean(data.curseforgeKey), microsoftClientId: data.microsoftClientId || '', microsoftAccount: data.microsoftAccount || '' };
}
function getCurseForgeKey() {
  const encrypted = read().curseforgeKey;
  if (!encrypted) return '';
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Системное шифрование недоступно. Ключ не прочитан.');
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
}
function setCurseForgeKey(value) {
  const data = read();
  const key = String(value || '').trim();
  if (key && !safeStorage.isEncryptionAvailable()) throw new Error('Системное шифрование недоступно. Ключ не сохранён.');
  if (key) data.curseforgeKey = safeStorage.encryptString(key).toString('base64');
  else delete data.curseforgeKey;
  write(data);
  return status();
}
function setMicrosoftClientId(value) {
  const id = String(value || '').trim();
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Client ID должен быть UUID из регистрации приложения Microsoft.');
  const data = read();
  data.microsoftClientId = id;
  delete data.microsoftAccount;
  delete data.microsoftRefreshToken;
  write(data);
  return status();
}
function setMicrosoftAccount(name, refreshToken) {
  const data = read();
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Системное шифрование недоступно. Вход не сохранён.');
  data.microsoftAccount = name;
  data.microsoftRefreshToken = safeStorage.encryptString(refreshToken).toString('base64');
  write(data);
  return status();
}
function disconnectMicrosoft() {
  const data = read();
  delete data.microsoftAccount;
  delete data.microsoftRefreshToken;
  write(data);
  return status();
}
module.exports = { status, getCurseForgeKey, setCurseForgeKey, setMicrosoftClientId, setMicrosoftAccount, disconnectMicrosoft };
