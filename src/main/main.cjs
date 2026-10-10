const { app, BrowserWindow, Menu, ipcMain, session, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const catalog = require('./catalog.cjs');
const preferences = require('./preferences.cjs');
const microsoft = require('./microsoft.cjs');
const download = require('./download.cjs');
const versions = require('./versions.cjs');
const { createInstaller } = require('./minecraft-install.cjs');
const game = require('./game-launch.cjs');

const APP_ID = 'app.astralauncher.desktop';
const TITLE_COLORS = Object.freeze({ dark:'#111113', graphite:'#202024', amethyst:'#17121f', ocean:'#0e1a23', forest:'#111b16', ember:'#211711', frost:'#121d25', rose:'#241820', copper:'#251b16', aurora:'#101e1d', slate:'#181d28', sand:'#242018' });
const entry = path.join(__dirname, '../renderer/index.html');
const entryUrl = pathToFileURL(entry).href;
let mainWindow = null;

app.setName('AstraLauncher');
app.setAppUserModelId(APP_ID);

function trustedSender(event) {
  return mainWindow && event.sender === mainWindow.webContents &&
    event.senderFrame === mainWindow.webContents.mainFrame &&
    event.senderFrame.url.split('#')[0] === entryUrl;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'AstraLauncher',
    width: 1340,
    height: 940,
    minWidth: 1040,
    minHeight: 740,
    backgroundColor: '#111113',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: TITLE_COLORS.dark, symbolColor: '#f0f0f2', height: 40 },
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../renderer/assets/astra-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
      spellcheck: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== entryUrl) event.preventDefault();
  });
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer stopped:', details.reason);
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('Interface failed to load:', code, description);
  });
  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadFile(entry);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    ipcMain.on('window:theme', (event, theme) => {
      if (trustedSender(event) && Object.hasOwn(TITLE_COLORS, theme)) {
        mainWindow.setTitleBarOverlay({ color: TITLE_COLORS[theme], symbolColor: '#f0f0f2' });
      }
    });
    const guarded = (channel, handler) => ipcMain.handle(channel, (event, ...args) => {
      if (!trustedSender(event)) throw new Error('Недоверенный источник запроса.');
      return handler(...args);
    });
    guarded('catalog:search', args => {
      const request = { source: args?.source, kind: args?.kind, query: args?.query, offset: args?.offset };
      if (request.source === 'modrinth') return catalog.searchModrinth(request);
      if (request.source === 'curseforge') return catalog.searchCurseForge(request, preferences.getCurseForgeKey());
      throw new Error('Неизвестный источник каталога.');
    });
    guarded('integrations:status', () => preferences.status());
    guarded('integrations:curseforge', key => preferences.setCurseForgeKey(key));
    guarded('integrations:microsoft-id', id => preferences.setMicrosoftClientId(id));
    guarded('microsoft:start', () => microsoft.start());
    guarded('microsoft:poll', () => microsoft.poll());
    guarded('microsoft:cancel', () => microsoft.cancel());
    guarded('microsoft:open', () => microsoft.openVerificationPage());
    guarded('microsoft:disconnect', () => microsoft.disconnect());
    guarded('catalog:open-project', async value => {
      const url = new URL(String(value));
      if (url.protocol !== 'https:' || !['modrinth.com','www.curseforge.com'].includes(url.hostname)) throw new Error('Открывать можно только страницы Modrinth и CurseForge.');
      await shell.openExternal(url.href);
    });
    guarded('catalog:download', request => download.download(request));
    guarded('catalog:show-file', value => download.showFile(value));
    guarded('catalog:open-downloads', () => download.openFolder());
    guarded('catalog:remove-installed', (file, profileId) => download.removeInstalled(file, profileId));
    guarded('catalog:list-installed', profileId => download.listInstalled(profileId));
    guarded('game:open-worlds-folder', profileId => download.openWorldsFolder(profileId));
    guarded('versions:list', refresh => refresh === true ? versions.refresh() : versions.list());
    const installer = createInstaller({ root: path.join(app.getPath('userData'), 'minecraft'), onProgress: progress => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('minecraft:progress', progress);
    } });
    guarded('minecraft:install', version => installer.install(version));
    guarded('minecraft:status', version => installer.status(version));
    guarded('minecraft:cancel', () => installer.cancel());
    guarded('game:launch', profile => game.launch(profile, {
      userData: app.getPath('userData'), minecraftRoot: path.join(app.getPath('userData'), 'minecraft'),
      onProgress: progress => {
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('game:progress', progress);
      },
    }));
    guarded('game:status', () => game.status());
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
