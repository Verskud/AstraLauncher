const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('astraDesktop', Object.freeze({
  openLegalDocument: kind => ipcRenderer.invoke('legal:open', kind),
  setWindowTheme: theme => ipcRenderer.send('window:theme', theme),
  openGameLog: id => ipcRenderer.invoke('game:open-log', id),
  toggleInstanceMod: (id,name) => ipcRenderer.invoke('instances:toggle-mod',id,name),
  cloneInstance: (profile,name,worlds) => ipcRenderer.invoke('instances:clone',profile,name,worlds),
  checkModUpdates: profile => ipcRenderer.invoke('instances:updates',profile),
  updateInstanceMod: (profile,choice) => ipcRenderer.invoke('instances:update-mod',profile,choice),
  exportInstance: (profile,worlds) => ipcRenderer.invoke('instances:export',profile,worlds),
  instanceScreenshots: id => ipcRenderer.invoke('instances:screenshots',id),
  screenshotThumbnail: (id,name) => ipcRenderer.invoke('instances:thumbnail',id,name),
  openScreenshot: (id,name) => ipcRenderer.invoke('instances:open-screenshot',id,name),
  openScreenshotsFolder: id => ipcRenderer.invoke('instances:screenshots-folder',id),
  validateServer: address => ipcRenderer.invoke('servers:validate',address),
  serverStatus: address => ipcRenderer.invoke('servers:status',address),
  playerSkinStatus: () => ipcRenderer.invoke('skins:status'),
  playerSkinPreview: (name,source) => ipcRenderer.invoke('skins:preview',name,source),
  elyStatus: () => ipcRenderer.invoke('ely:status'),
  elySignIn: value => ipcRenderer.invoke('ely:sign-in',value),
  elyDisconnect: () => ipcRenderer.invoke('ely:disconnect'),
  elyCancel: () => ipcRenderer.invoke('ely:cancel'),
  elyManage: () => ipcRenderer.invoke('ely:manage'),
  playerSkinSource: (source,model) => ipcRenderer.invoke('skins:source',source,model),
  selectPlayerTexture: kind => ipcRenderer.invoke('skins:select',kind),
  removePlayerTexture: kind => ipcRenderer.invoke('skins:remove',kind),
  installPlayerSkins: (profile,name) => ipcRenderer.invoke('skins:install',profile,name),
  friendsPlayPlan: profile => ipcRenderer.invoke('friends:plan',profile),
  installFriendsPlay: (profile,localProfiles) => ipcRenderer.invoke('friends:install',profile,localProfiles),
  onFriendsPlayProgress: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event,progress) => callback(progress);
    ipcRenderer.on('friends:progress',listener);
    return () => ipcRenderer.removeListener('friends:progress',listener);
  },
  customFontStatus: () => ipcRenderer.invoke('appearance:font-status'),
  selectCustomFont: () => ipcRenderer.invoke('appearance:font-select'),
  resetCustomFont: () => ipcRenderer.invoke('appearance:font-reset'),
  catalogSearch: request => ipcRenderer.invoke('catalog:search', request),
  openCurseForgeWebsite: (kind,query) => ipcRenderer.invoke('catalog:curseforge-website', kind,query),
  importInstanceContent: (profile,kind) => ipcRenderer.invoke('instances:import-content', profile,kind),
  openContentFolder: (id,kind) => ipcRenderer.invoke('instances:content-folder', id,kind),
  openProject: url => ipcRenderer.invoke('catalog:open-project', url),
  downloadProject: request => ipcRenderer.invoke('catalog:download', request),
  installCatalogModpack: request => ipcRenderer.invoke('modpack:catalog-install', request),
  importLocalModpack: () => ipcRenderer.invoke('modpack:local-import'),
  completeLocalModpack: (token, settings) => ipcRenderer.invoke('modpack:local-complete', token, settings),
  cancelModpackInstall: () => ipcRenderer.invoke('modpack:cancel'),
  recoverModpacks: () => ipcRenderer.invoke('modpack:recover'),
  onModpackProgress: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('modpack:progress', listener);
    return () => ipcRenderer.removeListener('modpack:progress', listener);
  },
  showDownloadedFile: path => ipcRenderer.invoke('catalog:show-file', path),
  openDownloadsFolder: () => ipcRenderer.invoke('catalog:open-downloads'),
  removeInstalledFile: (file, profileId) => ipcRenderer.invoke('catalog:remove-installed', file, profileId),
  listInstalledFiles: profileId => ipcRenderer.invoke('catalog:list-installed', profileId),
  openWorldsFolder: profileId => ipcRenderer.invoke('game:open-worlds-folder', profileId),
  openInstanceFolder: profileId => ipcRenderer.invoke('game:open-instance-folder', profileId),
  removeInstance: profileId => ipcRenderer.invoke('game:remove-instance', profileId),
  listWorldBackups: profileId => ipcRenderer.invoke('world-backups:list', profileId),
  createWorldBackup: profileId => ipcRenderer.invoke('world-backups:create', profileId),
  restoreWorldBackup: (profileId, backupId) => ipcRenderer.invoke('world-backups:restore', profileId, backupId),
  removeWorldBackup: (profileId, backupId) => ipcRenderer.invoke('world-backups:remove', profileId, backupId),
  openWorldBackupsFolder: profileId => ipcRenderer.invoke('world-backups:open-folder', profileId),
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
  saveMicrosoftClientId: id => ipcRenderer.invoke('integrations:microsoft-id', id),
  microsoftStart: () => ipcRenderer.invoke('microsoft:start'),
  microsoftPoll: () => ipcRenderer.invoke('microsoft:poll'),
  microsoftCancel: () => ipcRenderer.invoke('microsoft:cancel'),
  microsoftOpen: () => ipcRenderer.invoke('microsoft:open'),
  microsoftDisconnect: () => ipcRenderer.invoke('microsoft:disconnect'),
}));
