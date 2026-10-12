const { BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const documents = new Set(['privacy', 'terms', 'licenses']);
const links = Object.freeze({
  website: 'https://verskud.github.io/AstraLauncher/',
  source: 'https://github.com/Verskud/AstraLauncher',
  security: 'https://github.com/Verskud/AstraLauncher/security/advisories/new',
});
const directory = path.join(__dirname, '../renderer/legal');
const prefix = pathToFileURL(directory + path.sep).href;
let window = null;

async function openLegalDocument(kind, parent) {
  if (Object.hasOwn(links, kind)) return shell.openExternal(links[kind]);
  if (!documents.has(kind)) throw new Error('Неизвестный документ ASTRA.');
  if (!window || window.isDestroyed()) {
    window = new BrowserWindow({
      parent, title: 'ASTRA — документы', width: 840, height: 700,
      minWidth: 480, minHeight: 400, backgroundColor: '#172322',
      autoHideMenuBar: true, show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: false },
    });
    const external = url => {
      try { if (new URL(url).protocol === 'https:') shell.openExternal(url).catch(error => console.warn('Cannot open legal link:', error.message)); } catch {}
    };
    window.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: 'deny' }; });
    window.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith(prefix)) return;
      event.preventDefault(); external(url);
    });
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.on('ready-to-show', () => window?.show());
    window.on('closed', () => { window = null; });
  }
  await window.loadFile(path.join(directory, kind + '.html'));
  window.show(); window.focus();
}
module.exports = { openLegalDocument };
