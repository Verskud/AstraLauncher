const { contextBridge, ipcRenderer } = require('electron');

// A narrow API: the interface cannot access Node.js, files or arbitrary IPC.
contextBridge.exposeInMainWorld('astraDesktop', Object.freeze({
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  catalogSearch: request => ipcRenderer.invoke('catalog:search', request),
  openProject: url => ipcRenderer.invoke('catalog:open-project', url),
  downloadProject: request => ipcRenderer.invoke('catalog:download', request),
  showDownloadedFile: path => ipcRenderer.invoke('catalog:show-file', path),
  openDownloadsFolder: () => ipcRenderer.invoke('catalog:open-downloads'),
  integrationsStatus: () => ipcRenderer.invoke('integrations:status'),
  saveCurseForgeKey: key => ipcRenderer.invoke('integrations:curseforge', key),
  saveMicrosoftClientId: id => ipcRenderer.invoke('integrations:microsoft-id', id),
  microsoftStart: () => ipcRenderer.invoke('microsoft:start'),
  microsoftPoll: () => ipcRenderer.invoke('microsoft:poll'),
  microsoftCancel: () => ipcRenderer.invoke('microsoft:cancel'),
  microsoftOpen: () => ipcRenderer.invoke('microsoft:open'),
  microsoftDisconnect: () => ipcRenderer.invoke('microsoft:disconnect'),
}));
