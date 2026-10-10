const { shell } = require('electron');
const preferences = require('./preferences.cjs');
const endpoint = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/';
let pending = null;

async function post(path, values) {
  const response = await fetch(endpoint + path, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values), signal: AbortSignal.timeout(15000),
  });
  return response.json();
}

async function start() {
  const clientId = preferences.status().microsoftClientId;
  if (!clientId) throw new Error('Сначала укажи Client ID приложения Microsoft в настройках.');
  const data = await post('devicecode', { client_id: clientId, scope: 'openid profile offline_access User.Read' });
  if (!data.device_code) throw new Error(data.error_description || 'Не удалось начать вход Microsoft.');
  pending = {
    clientId, deviceCode: data.device_code,
    interval: Math.max(5, Number(data.interval) || 5) * 1000,
    nextPoll: 0, expires: Date.now() + Number(data.expires_in || 900) * 1000,
  };
  return { userCode: data.user_code, verificationUri: data.verification_uri, expiresIn: data.expires_in };
}

async function poll() {
  if (!pending) return { state: 'idle' };
  if (Date.now() >= pending.expires) { pending = null; return { state: 'expired' }; }
  if (Date.now() < pending.nextPoll) return { state: 'pending' };
  pending.nextPoll = Date.now() + pending.interval;
  const data = await post('token', {
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    client_id: pending.clientId, device_code: pending.deviceCode,
  });
  if (data.error === 'authorization_pending') return { state: 'pending' };
  if (data.error === 'slow_down') { pending.interval += 5000; return { state: 'pending' }; }
  if (data.error) { pending = null; return { state: 'error', message: data.error_description || data.error }; }
  pending = null;
  if (!data.refresh_token || !data.access_token) return { state: 'error', message: 'Microsoft не вернул токены входа.' };
  const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,userPrincipalName', {
    headers: { Authorization: `Bearer ${data.access_token}` }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return { state: 'error', message: 'Не удалось прочитать профиль Microsoft.' };
  const profile = await response.json();
  const account = String(profile.displayName || profile.userPrincipalName || 'Аккаунт Microsoft').slice(0, 100);
  preferences.setMicrosoftAccount(account, data.refresh_token);
  return { state: 'connected', account };
}

function cancel() { pending = null; return { state: 'idle' }; }
async function openVerificationPage() {
  await shell.openExternal('https://microsoft.com/devicelogin');
}
module.exports = { start, poll, cancel, openVerificationPage };
