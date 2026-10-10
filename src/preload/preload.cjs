const { contextBridge, ipcRenderer } = require('electron');

// A narrow API: the interface cannot access Node.js, files or arbitrary IPC.
contextBridge.exposeInMainWorld('astraDesktop', Object.freeze({
  setWindowTheme: theme => ipcRenderer.send('window:theme', theme),
  catalogSearch: request => ipcRenderer.invoke('catalog:search', request),
  openProject: url => ipcRenderer.invoke('catalog:open-project', url),
  downloadProject: request => ipcRenderer.invoke('catalog:download', request),
  showDownloadedFile: path => ipcRenderer.invoke('catalog:show-file', path),
  openDownloadsFolder: () => ipcRenderer.invoke('catalog:open-downloads'),
  removeInstalledFile: (file, profileId) => ipcRenderer.invoke('catalog:remove-installed', file, profileId),
  minecraftVersions: (refresh = false) => ipcRenderer.invoke('versions:list', refresh),
  installMinecraft: version => ipcRenderer.invoke('minecraft:install', version),
  minecraftInstallStatus: version => ipcRenderer.invoke('minecraft:status', version),
  cancelMinecraftInstall: () => ipcRenderer.invoke('minecraft:cancel'),
  launchGame: profile => ipcRenderer.invoke('game:launch', profile),
  gameStatus: () => ipcRenderer.invoke('game:status'),
  onGameProgress: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('game:progress', listener);
    return () => ipcRenderer.removeListener('game:progress', listener);
  },
  onMinecraftInstallProgress: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('minecraft:progress', listener);
    return () => ipcRenderer.removeListener('minecraft:progress', listener);
  },
  integrationsStatus: () => ipcRenderer.invoke('integrations:status'),
  saveCurseForgeKey: key => ipcRenderer.invoke('integrations:curseforge', key),
  saveMicrosoftClientId: id => ipcRenderer.invoke('integrations:microsoft-id', id),
  microsoftStart: () => ipcRenderer.invoke('microsoft:start'),
  microsoftPoll: () => ipcRenderer.invoke('microsoft:poll'),
  microsoftCancel: () => ipcRenderer.invoke('microsoft:cancel'),
  microsoftOpen: () => ipcRenderer.invoke('microsoft:open'),
  microsoftDisconnect: () => ipcRenderer.invoke('microsoft:disconnect'),
}));
