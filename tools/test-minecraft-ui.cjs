const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'astra-ui-test-'));
app.setPath('userData', profile);
let installed = false;
let window;
let stopCancelInstall;
let launchedProfile;
ipcMain.handle('versions:list', () => require('../src/main/data/minecraft-versions.json'));
ipcMain.handle('integrations:status', () => ({ curseforgeReady: false, microsoftClientId: '', microsoftAccount: '' }));
ipcMain.handle('minecraft:status', (_event, version) => ({ version, phase: installed && version === '1.21.1' ? 'done' : 'idle', installed: installed && version === '1.21.1' }));
ipcMain.handle('minecraft:install', async (_event, version) => {
  window.webContents.send('minecraft:progress', { version, phase: 'downloading', done: 1, total: 2 });
  if (version === 'cancel-test') return new Promise(resolve => { stopCancelInstall = resolve; });
  await new Promise(resolve => setTimeout(resolve, 50));
  installed = true;
  window.webContents.send('minecraft:progress', { version, phase: 'done', done: 2, total: 2, installed: true });
  return { version, installed: true };
});
ipcMain.handle('minecraft:cancel', async () => {
  if (!stopCancelInstall) return false;
  window.webContents.send('minecraft:progress', { version: 'cancel-test', phase: 'removing' });
  stopCancelInstall({ version: 'cancel-test', cancelled: true });
  stopCancelInstall = null;
  await new Promise(resolve => setTimeout(resolve, 20));
  window.webContents.send('minecraft:progress', { version: 'cancel-test', phase: 'cancelled' });
  return true;
});
ipcMain.handle('game:launch', (_event, profile) => { launchedProfile = profile; return { started: true }; });

(async () => {
  try {
    await app.whenReady();
    window = new BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, '../src/preload/preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false } });
    const errors = [];
    window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
    await window.loadFile(path.join(__dirname, '../src/renderer/index.html'));
    const js = expression => window.webContents.executeJavaScript(expression, true);
    await js("state.packs.push({id:'ui-test',name:'UI test',version:'1.21.1',loader:'Vanilla',mods:[],art:'forest'});selectedPack='ui-test';go('pack')");
    await new Promise(resolve => setTimeout(resolve, 100));
    const ready = await js("({text:document.querySelector('.minecraft-install-status')?.textContent,button:document.querySelector('[data-minecraft-install]')?.disabled})");
    if (!ready.text?.includes('ещё не скачана') || ready.button) throw new Error(`Install UI unavailable: ${JSON.stringify(ready)}`);
    await js("document.querySelector('[data-minecraft-install]').click()");
    await new Promise(resolve => setTimeout(resolve, 150));
    const done = await js("({text:document.querySelector('.minecraft-install-status')?.textContent,button:document.querySelector('[data-minecraft-install]')?.textContent})");
    if (!done.text?.includes('скачаны') || !done.button?.includes('Проверить')) throw new Error(`Install UI did not finish: ${JSON.stringify(done)}`);
    await js("state.packs.push({id:'cancel-test',name:'Cancel test',version:'cancel-test',loader:'Vanilla',mods:[],art:'forest'});selectedPack='cancel-test';go('pack')");
    await new Promise(resolve => setTimeout(resolve, 50));
    await js("document.querySelector('[data-minecraft-install]').click()");
    await new Promise(resolve => setTimeout(resolve, 30));
    await js("document.querySelector('[data-minecraft-cancel]').click()");
    const warning = await js("({open:modal.open,text:document.querySelector('#modal-content')?.textContent})");
    if (!warning.open || !warning.text.includes('Все уже скачанные файлы этой версии будут удалены')) throw new Error(`Cancellation warning missing: ${JSON.stringify(warning)}`);
    await js("document.querySelector('[data-minecraft-confirm-cancel]').click()");
    await new Promise(resolve => setTimeout(resolve, 80));
    const cancelled = await js("document.querySelector('.minecraft-install-status')?.textContent");
    if (!cancelled.includes('удалены')) throw new Error(`Cancellation UI failed: ${cancelled}`);
    await js("state.profile='TestPlayer';selectedPack='ui-test';go('pack');document.querySelector('[data-launch]').click()");
    await new Promise(resolve => setTimeout(resolve, 50));
    if (launchedProfile?.version !== '1.21.1' || launchedProfile?.loader !== 'Vanilla' || launchedProfile?.playerName !== 'TestPlayer') throw new Error(`Launch UI sent wrong profile: ${JSON.stringify(launchedProfile)}`);
    await js("integrationStatus.microsoftAccount='TestMC';go('accounts');document.querySelector('[data-live-account-mode=microsoft]').click();selectedPack='ui-test';go('pack');document.querySelector('[data-launch]').click()");
    await new Promise(resolve => setTimeout(resolve, 50));
    if (launchedProfile?.accountMode !== 'microsoft') throw new Error(`Account selection did not reach launch: ${JSON.stringify(launchedProfile)}`);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Minecraft install UI: ready, progress, completion, deletion warning, launch and account selection OK');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally {
    window?.destroy();
    app.quit();
  }
})();
