const { app, BrowserWindow, Menu, ipcMain, session, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const catalog = require('./catalog.cjs');
const preferences = require('./preferences.cjs');
const microsoft = require('./microsoft.cjs');
const download = require('./download.cjs');

const APP_ID = 'app.astralauncher.desktop';
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
    frame: false,
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
    ipcMain.on('window:minimize', event => { if (trustedSender(event)) mainWindow.minimize(); });
    ipcMain.on('window:maximize', event => {
      if (!trustedSender(event)) return;
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    });
    ipcMain.on('window:close', event => { if (trustedSender(event)) mainWindow.close(); });
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
    guarded('microsoft:disconnect', () => preferences.disconnectMicrosoft());
    guarded('catalog:open-project', async value => {
      const url = new URL(String(value));
      if (url.protocol !== 'https:' || !['modrinth.com','www.curseforge.com'].includes(url.hostname)) throw new Error('Открывать можно только страницы Modrinth и CurseForge.');
      await shell.openExternal(url.href);
    });
    guarded('catalog:download', request => download.download(request));
    guarded('catalog:show-file', value => download.showFile(value));
    guarded('catalog:open-downloads', () => download.openFolder());
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
