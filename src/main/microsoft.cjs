const { shell } = require('electron');
const preferences = require('./preferences.cjs');
const endpoint = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/';
let pending = null;
let cachedMinecraft = null;

async function post(path, values) {
  const response = await fetch(endpoint + path, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values), signal: AbortSignal.timeout(15000),
  });
  return response.json();
}

async function start() {
  cachedMinecraft = null;
  const clientId = preferences.status().microsoftClientId;
  if (!clientId) throw new Error('Сначала укажи Client ID приложения Microsoft в настройках.');
  const data = await post('devicecode', { client_id: clientId, scope: 'XboxLive.signin XboxLive.offline_access' });
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
  try {
    const game = await exchangeMinecraft(data.access_token);
    preferences.setMicrosoftAccount(game.name, data.refresh_token);
    cachedMinecraft = { ...game, expires: Date.now() + 50 * 60 * 1000 };
    return { state: 'connected', account: game.name };
  } catch (error) { return { state: 'error', message: error.message }; }
}

async function postJson(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.errorMessage || data.error || `Вход Minecraft: код ${response.status}.`);
  return data;
}
async function exchangeMinecraft(accessToken) {
  const xbox = await postJson('https://user.auth.xboxlive.com/user/authenticate', {
    Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${accessToken}` }, RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT',
  });
  const xsts = await postJson('https://xsts.auth.xboxlive.com/xsts/authorize', {
    Properties: { SandboxId: 'RETAIL', UserTokens: [xbox.Token] }, RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT',
  });
  const uhs = xsts.DisplayClaims?.xui?.[0]?.uhs;
  if (!uhs || !xsts.Token) throw new Error('Xbox не вернул игровой токен.');
  const minecraft = await postJson('https://api.minecraftservices.com/authentication/login_with_xbox', { identityToken: `XBL3.0 x=${uhs};${xsts.Token}` });
  const profileResponse = await fetch('https://api.minecraftservices.com/minecraft/profile', { headers: { Authorization: `Bearer ${minecraft.access_token}` }, signal: AbortSignal.timeout(20000) });
  if (profileResponse.status === 404) throw new Error('На этом аккаунте не найден профиль Minecraft Java Edition.');
  if (!profileResponse.ok) throw new Error(`Не удалось проверить право на Minecraft: ${profileResponse.status}.`);
  const profile = await profileResponse.json();
  if (!profile.id || !profile.name) throw new Error('Minecraft не вернул игровой профиль.');
  return { name: profile.name, uuid: profile.id, token: minecraft.access_token, userType: 'msa', xuid: xbox.DisplayClaims?.xui?.[0]?.xid || '' };
}
async function minecraftAccount() {
  if (cachedMinecraft && cachedMinecraft.expires > Date.now()) return cachedMinecraft;
  const clientId = preferences.status().microsoftClientId;
  const refresh = preferences.getMicrosoftRefreshToken();
  if (!clientId || !refresh) throw new Error('Подключи аккаунт Microsoft в настройках.');
  const data = await post('token', { client_id: clientId, grant_type: 'refresh_token', refresh_token: refresh, scope: 'XboxLive.signin XboxLive.offline_access' });
  if (!data.access_token) throw new Error(data.error_description || 'Нужно повторно войти в Microsoft.');
  const game = await exchangeMinecraft(data.access_token);
  if (data.refresh_token) preferences.setMicrosoftAccount(game.name, data.refresh_token);
  cachedMinecraft = { ...game, expires: Date.now() + 50 * 60 * 1000 };
  return game;
}

function cancel() { pending = null; return { state: 'idle' }; }
function disconnect() { pending = null; cachedMinecraft = null; return preferences.disconnectMicrosoft(); }
async function openVerificationPage() {
  await shell.openExternal('https://microsoft.com/devicelogin');
}
module.exports = { start, poll, cancel, disconnect, openVerificationPage, minecraftAccount };
