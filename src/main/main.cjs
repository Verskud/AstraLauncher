const { protectProcessOutput, routeConsoleToFile } = require('./process-output.cjs');
protectProcessOutput();
const { app, BrowserWindow, Menu, ipcMain, session, shell, dialog, protocol } = require('electron');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const catalog = require('./catalog.cjs');
const preferences = require('./preferences.cjs');
const microsoft = require('./microsoft.cjs');
const download = require('./download.cjs');
const versions = require('./versions.cjs');
const { createInstaller } = require('./minecraft-install.cjs');
const game = require('./game-launch.cjs');
const { createWorldBackups } = require('./world-backups.cjs');
const { createModpackInstaller } = require('./modpack.cjs');
const customFont = require('./custom-font.cjs');
const { createServerMonitor, parseAddress } = require('./server-status.cjs');
const { createPlayerSkins } = require('./player-skins.cjs');
const { createInstanceTools } = require('./instance-tools.cjs');
const { createFriendsPlay } = require('./friends-play.cjs');
const { importFiles: importLocalContent, folders: contentFolders } = require('./local-content.cjs');
const ely = require('./ely-account.cjs');

const APP_ID = 'app.astralauncher.desktop';
const TITLE_COLORS = Object.freeze({ dark:'#202222', graphite:'#242527', amethyst:'#24212a', ocean:'#20292e', forest:'#232b26', ember:'#2b2522', frost:'#f1f4f6', rose:'#2d2529', copper:'#2b2623', aurora:'#202b2a', slate:'#252932', sand:'#f3efe6' });
const entry = path.join(__dirname, '../renderer/index.html');
const supportsGlass = process.platform === 'win32' && Number(os.release().split('.')[2]) >= 22621;
const entryUrl = pathToFileURL(entry).href;
let mainWindow = null;
let windowTheme = null;
let launchPending = null;
let closePrompt = false;

protocol.registerSchemesAsPrivileged([{ scheme: 'astra-font', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

app.setName('AstraLauncher');
app.setAppUserModelId(APP_ID);
routeConsoleToFile(path.join(app.getPath('userData'), 'launcher.log'));

function trustedSender(event) {
  return mainWindow && event.sender === mainWindow.webContents &&
    event.senderFrame === mainWindow.webContents.mainFrame &&
    event.senderFrame.url.split('#')[0] === entryUrl;
}

function createWindow() {
  windowTheme = null;
  mainWindow = new BrowserWindow({
    title: 'AstraLauncher',
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 560,
    backgroundColor: TITLE_COLORS.dark,
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
  mainWindow.on('close', event => {
    const current = game.status();
    if (!current.running && !launchPending) return;
    event.preventDefault();
    if (closePrompt) return;
    closePrompt = true;
    const window = mainWindow;
    const pending = !current.running;
    dialog.showMessageBox(window, {
      type: 'warning', title: 'AstraLauncher',
      message: pending ? 'Minecraft is preparing to launch / Подготовка запуска Minecraft' : 'Minecraft is still running / Minecraft ещё запущен',
      detail: pending ? 'Wait for preparation to finish, then stop the game from the console.\nДождись подготовки, затем останови игру через консоль.' : 'Stopping now may lose unsaved progress.\nПри завершении игры несохранённый прогресс может потеряться.',
      buttons: pending ? ['OK'] : ['Cancel / Отмена', 'Stop game and close / Завершить игру и закрыть'], defaultId: 0, cancelId: 0,
    }).then(async result => {
      if (!pending && result.response === 1) {
        await game.stop(current.profileId, current.sessionId);
        if (!window.isDestroyed()) window.close();
      }
    }).catch(error => { if (!window.isDestroyed()) dialog.showErrorBox('AstraLauncher', error.message); })
      .finally(() => { closePrompt = false; });
  });
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
    protocol.handle('astra-font', async request => {
      const url = new URL(request.url);
      if (url.hostname !== 'current') return new Response(null, { status: 404 });
      const current = await customFont.status(app.getPath('userData'));
      if (!current.active) return new Response(null, { status: 404 });
      const bytes = await require('node:fs/promises').readFile(current.filename);
      return new Response(bytes, { headers: { 'Content-Type': current.mime, 'Cache-Control': 'no-store' } });
    });
    ipcMain.on('window:theme', (event, theme) => {
      if (trustedSender(event) && (Object.hasOwn(TITLE_COLORS, theme) || theme === 'glass') && windowTheme !== theme) {
        windowTheme = theme;
        const glass = theme === 'glass' && supportsGlass;
        mainWindow.setBackgroundColor(glass ? '#00000000' : theme === 'glass' ? '#171b29' : TITLE_COLORS[theme]);
        if (supportsGlass) {
          try { mainWindow.setBackgroundMaterial(glass ? 'acrylic' : 'none'); }
          catch (error) { mainWindow.setBackgroundColor(theme === 'glass' ? '#171b29' : TITLE_COLORS[theme]); console.warn('Window backdrop unavailable:', error.message); }
        }
        mainWindow.setTitleBarOverlay({ color: glass ? '#00000000' : theme === 'glass' ? '#171b29' : TITLE_COLORS[theme], symbolColor: ['frost','sand'].includes(theme) ? '#303638' : '#f0f0f2' });
      }
    });
    const guarded = (channel, handler) => ipcMain.handle(channel, (event, ...args) => {
      if (!trustedSender(event)) throw new Error('Недоверенный источник запроса.');
      return handler(...args);
    });
    guarded('legal:open', kind => require('./legal.cjs').openLegalDocument(kind, mainWindow));
    guarded('catalog:search', args => {
      const request = { source: args?.source, kind: args?.kind, query: args?.query, offset: args?.offset };
      if (request.source === 'modrinth') return catalog.searchModrinth(request);
      if (request.source === 'curseforge') throw new Error('CurseForge доступен через официальный сайт.');
      throw new Error('Неизвестный источник каталога.');
    });
    guarded('integrations:status', () => preferences.status());
    guarded('ely:status', () => ely.current().status());
    guarded('ely:sign-in', value => ely.current().signIn(value));
    guarded('ely:disconnect', () => ely.current().disconnect());
    guarded('ely:cancel', () => ely.current().cancel());
    guarded('ely:manage', () => shell.openExternal('https://ely.by/skins'));
    const checkServer = createServerMonitor();
    const instances = createInstanceTools(app.getPath('userData'), { download: request => download.download(request), nativeImage: require('electron').nativeImage });
    const editableInstance = () => { if (launchPending || game.status().running || skinInstallPending || friendsInstallPending || catalogInstallPending || instances.isBusy() || modpacks.isBusy() || worldBackups.isBusy()) throw new Error('Дождись завершения операции и закрой игру перед изменением сборки.'); };
    let skinInstallPending = false, friendsInstallPending = false, catalogInstallPending = false;
    const friends = createFriendsPlay({ resolve: download.resolveModrinth, download: download.download, listInstalled: download.listInstalled, onProgress: progress => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('friends:progress', progress);
    } });
    guarded('friends:plan', profile => friends.plan(profile));
    guarded('friends:install', async (profile,localProfiles) => {
      editableInstance(); friendsInstallPending = true;
      try { return await friends.install(profile,localProfiles === true); }
      finally { friendsInstallPending = false; }
    });
    const skins = createPlayerSkins(app.getPath('userData'), { download: request => download.download(request), decodePng: bytes => !require('electron').nativeImage.createFromBuffer(bytes).isEmpty() });
    guarded('servers:validate', value => parseAddress(value));
    guarded('servers:status', value => checkServer(value));
    guarded('instances:toggle-mod', (id,name) => { editableInstance();return instances.toggle(id,name); });
    guarded('instances:clone', (profile,name,worlds) => { editableInstance();return instances.clone(profile,name,worlds===true); });
    guarded('instances:updates', profile => instances.checkUpdates(profile));
    guarded('instances:import-content', async (profile, kind) => {
      require('./game-loader.cjs').validateProfile(profile);
      if (!Object.hasOwn(contentFolders, kind)) throw new Error('Неизвестный тип файлов.');
      if (kind === 'mods' && profile.loader === 'Vanilla') throw new Error('Сначала выбери загрузчик в параметрах сборки.');
      editableInstance();
      const result = await dialog.showOpenDialog(mainWindow, { defaultPath: app.getPath('downloads'), properties: ['openFile', 'multiSelections'], filters: [{ name: kind === 'mods' ? 'Minecraft mods' : 'Minecraft packs', extensions: kind === 'mods' ? ['jar'] : ['zip'] }] });
      if (result.canceled || !result.filePaths.length) return null;
      editableInstance(); catalogInstallPending = true;
      try { return await importLocalContent(app.getPath('userData'), profile, kind, result.filePaths); }
      finally { catalogInstallPending = false; }
    });
    guarded('instances:content-folder', async (id, kind) => {
      if (!Object.hasOwn(contentFolders, kind)) throw new Error('Неизвестный тип файлов.');
      const folder = path.join(require('./game-loader.cjs').instanceFolder(app.getPath('userData'), id), contentFolders[kind]);
      await require('node:fs/promises').mkdir(folder, { recursive: true });
      const error = await shell.openPath(folder); if (error) throw new Error(error);
    });
    guarded('instances:update-mod', (profile,choice) => { editableInstance();return instances.update(profile,choice); });
    guarded('instances:export', async (profile,worlds) => {
      editableInstance();
      const result = await dialog.showSaveDialog(mainWindow,{title:'Экспорт сборки ASTRA',defaultPath:`${String(profile?.name||'ASTRA').replace(/[<>:"/\\|?*]/g,'_')}.zip`,filters:[{name:'ASTRA ZIP',extensions:['zip']}]});
      return result.canceled || !result.filePath ? null : instances.exportZip(profile,result.filePath,worlds===true);
    });
    guarded('instances:screenshots', id => instances.screenshots(id));
    guarded('instances:thumbnail', (id,name) => instances.thumbnail(id,name));
    guarded('instances:open-screenshot', async (id,name) => { const error=await shell.openPath(await instances.screenshotFile(id,name));if(error)throw new Error(error); });
    guarded('instances:screenshots-folder', async id => { const folder=path.join(require('./game-loader.cjs').instanceFolder(app.getPath('userData'),id),'screenshots');await require('node:fs/promises').mkdir(folder,{recursive:true});const error=await shell.openPath(folder);if(error)throw new Error(error); });
    guarded('skins:status', () => skins.status());
    guarded('skins:preview', (name,source) => skins.remote(name,source));
    guarded('skins:source', (source,model) => skins.setSource(source,model));
    guarded('skins:remove', kind => skins.removeTexture(kind));
    guarded('skins:select', async kind => {
      if (!['skin','cape'].includes(kind)) throw new Error('Некорректный тип текстуры.');
      const result = await dialog.showOpenDialog(mainWindow, { title: kind === 'skin' ? 'Скин игрока' : 'Плащ игрока', properties:['openFile'], filters:[{name:'PNG',extensions:['png']}] });
      return result.canceled || !result.filePaths[0] ? null : skins.importTexture(result.filePaths[0],kind);
    });
    guarded('skins:install', async (profile,name) => {
      if (modpacks.isBusy()) throw new Error('Дождись завершения импорта сборки.');
      if (friendsInstallPending) throw new Error('Дождись установки игры с друзьями.');
      if (catalogInstallPending) throw new Error('Дождись установки мода.');
      if (skinInstallPending) throw new Error('Поддержка скинов уже устанавливается.');
      if (instances.isBusy()) throw new Error('Дождись завершения операции со сборкой.');
      if (launchPending || game.status().running) throw new Error('Закрой игру перед изменением скинов сборки.');
      skinInstallPending = true;
      try { return await skins.install(profile,name); }
      finally { skinInstallPending = false; }
    });
    guarded('integrations:microsoft-id', id => preferences.setMicrosoftClientId(id));
    guarded('appearance:font-status', () => customFont.status(app.getPath('userData')));
    guarded('appearance:font-select', async () => {
      const result = await dialog.showOpenDialog(mainWindow, { title: 'Выбери шрифт интерфейса', properties: ['openFile'], filters: [{ name: 'Шрифты', extensions: ['ttf', 'otf', 'woff', 'woff2'] }] });
      if (result.canceled || !result.filePaths[0]) return null;
      return customFont.install(app.getPath('userData'), result.filePaths[0]);
    });
    guarded('appearance:font-reset', () => customFont.reset(app.getPath('userData')));
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
    guarded('catalog:curseforge-website', async (kind, query) => {
      const sections = { mods: 'mc-mods', modpacks: 'modpacks', shaders: 'shaders', resources: 'texture-packs' };
      if (!Object.hasOwn(sections, kind)) throw new Error('Неизвестный раздел CurseForge.');
      const search = typeof query === 'string' ? query.trim().slice(0, 100) : '';
      const url = new URL('https://www.curseforge.com/minecraft/' + (search ? 'search' : sections[kind]));
      if (search) { url.searchParams.set('class', sections[kind]); url.searchParams.set('search', search); }
      await shell.openExternal(url.href);
    });
    guarded('catalog:download', async request => {
      if (request?.source === 'curseforge') throw new Error('Скачай файл с официального сайта CurseForge и добавь его в сборку кнопкой «Добавить файлы».');
      if (!request?.profileId) return download.download(request);
      editableInstance(); catalogInstallPending = true;
      try { return await download.download(request); }
      finally { catalogInstallPending = false; }
    });
    let manualPackQueue = Promise.resolve();
    const modpacks = createModpackInstaller({ userData: app.getPath('userData'), manualDownload: (file, signal) => {
      const work = manualPackQueue.catch(() => {}).then(async () => {
        while (true) {
          signal.throwIfAborted();
          mainWindow?.webContents.send('modpack:progress', { phase: 'manual', message: `CurseForge: выбери файл ${file.fileID} с официальной страницы.` });
          const answer = await dialog.showMessageBox(mainWindow, { type: 'info', title: 'Нужен файл CurseForge', message: 'Этот файл нельзя получить автоматически.', detail: `Для сборки нужен именно файл ${file.fileID} проекта ${file.projectID}${file.filename ? ': ' + file.filename : ''}. Открой его официальную страницу, скачай файл и выбери его здесь.\n\n${file.url}`, buttons: ['Открыть страницу файла', 'Выбрать скачанный файл', 'Отменить установку'], defaultId: 0, cancelId: 2 });
          signal.throwIfAborted();
          if (answer.response === 2) { modpacks.cancel(); signal.throwIfAborted(); }
          if (answer.response === 0) { await shell.openExternal(file.url); continue; }
          const result = await dialog.showOpenDialog(mainWindow, { title: `Файл CurseForge ${file.fileID}`, defaultPath: app.getPath('downloads'), properties: ['openFile'], filters: [{ name: 'Minecraft mod / pack', extensions: ['jar', 'zip'] }] });
          signal.throwIfAborted();
          if (!result.canceled && result.filePaths[0]) return result.filePaths[0];
        }
      });
      manualPackQueue = work;
      return work;
    }, onProgress: progress => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('modpack:progress', progress);
    } });
    guarded('modpack:catalog-install', async request => {
      if (request?.source !== 'modrinth' || !/^[a-zA-Z0-9_-]{1,64}$/.test(request?.id || '')) throw new Error('Установка сборок из CurseForge пока не поддерживается.');
      return modpacks.install(async (signal, report, staging) => {
        report({ phase: 'resolving', message: 'Получаем список файлов сборки из Modrinth…' });
        const resolveSignal = AbortSignal.any([signal, AbortSignal.timeout(30000)]);
        const resolved = await download.resolveModrinth({ source: 'modrinth', kind: 'modpacks', id: request.id }, resolveSignal).catch(error => {
          if (!signal.aborted && resolveSignal.aborted) throw new Error('Modrinth не ответил на запрос сборки за 30 секунд. Повтори попытку.');
          throw error;
        });
        const filename = path.join(staging, 'pack.mrpack');
        const started = Date.now();
        let lastReport = 0;
        await download.fetchResolvedToFile(resolved, filename, signal, (receivedBytes, totalBytes) => {
          if (receivedBytes && receivedBytes !== totalBytes && Date.now() - lastReport < 200) return;
          lastReport = Date.now();
          report({ phase: 'archive', receivedBytes, totalBytes, bytesPerSecond: receivedBytes / Math.max(1, (Date.now() - started) / 1000), message: resolved.filename });
        }, attempt => report({ phase: 'resolving', message: `Сеть прервала загрузку архива. Повторная попытка ${attempt} из 3…` }));
        report({ phase: 'checking', message: 'Проверяем архив сборки…' });
        return { path: filename, temporary: true, catalog: true };
      });
    });
    let pendingPackImport = null;
    guarded('modpack:local-import', async () => {
      editableInstance();
      pendingPackImport = null;
      const result = await dialog.showOpenDialog(mainWindow, { title: 'Выбери сборку', defaultPath: app.getPath('downloads'), properties: ['openFile'], filters: [{ name: 'CurseForge / Modrinth / Prism / ASTRA / ZIP', extensions: ['mrpack','zip'] }] });
      if (result.canceled || !result.filePaths[0]) return null;
      editableInstance();
      const info = await modpacks.inspect(result.filePaths[0]);
      if (info.needsSettings) {
        pendingPackImport = { path: result.filePaths[0], token: require('node:crypto').randomUUID() };
        return { ...info, token: pendingPackImport.token };
      }
      return modpacks.install({ path: result.filePaths[0] });
    });
    guarded('modpack:local-complete', async (token, settings) => {
      editableInstance();
      if (!pendingPackImport || token !== pendingPackImport.token) throw new Error('Сначала выбери ZIP-сборку для импорта.');
      const selected = pendingPackImport;
      pendingPackImport = null;
      return modpacks.install({ path: selected.path, settings });
    });
    guarded('modpack:cancel', () => modpacks.cancel());
    guarded('modpack:recover', () => modpacks.recover());
    guarded('catalog:show-file', value => download.showFile(value));
    guarded('catalog:open-downloads', () => download.openFolder());
    guarded('catalog:remove-installed', (file, profileId) => { editableInstance();return download.removeInstalled(file, profileId); });
    guarded('catalog:list-installed', profileId => download.listInstalled(profileId));
    guarded('game:open-worlds-folder', profileId => download.openWorldsFolder(profileId));
    guarded('game:open-instance-folder', async profileId => {
      const folder = require('./game-loader.cjs').instanceFolder(app.getPath('userData'), profileId);
      await require('node:fs/promises').mkdir(folder, { recursive: true });
      const error = await shell.openPath(folder);
      if (error) throw new Error(error);
      return true;
    });
    guarded('game:remove-instance', async profileId => {
      if (instances.isBusy() || modpacks.isBusy() || skinInstallPending || friendsInstallPending || catalogInstallPending || launchPending || worldBackups.isBusy()) throw new Error('Дождись завершения операции со сборкой.');
      const folder = require('./game-loader.cjs').instanceFolder(app.getPath('userData'), profileId);
      if (game.status().running && game.status().profileId === profileId) throw new Error('Закрой игру перед удалением сборки.');
      await require('node:fs/promises').rm(folder, { recursive: true, force: true });
      return true;
    });
    const worldBackups = createWorldBackups(app.getPath('userData'), profileId => game.status().running && game.status().profileId === profileId);
    guarded('world-backups:list', profileId => worldBackups.list(profileId));
    guarded('world-backups:create', profileId => { editableInstance(); return worldBackups.create(profileId); });
    guarded('world-backups:restore', (profileId, backupId) => { editableInstance(); return worldBackups.restore(profileId, backupId); });
    guarded('world-backups:remove', (profileId, backupId) => { editableInstance(); return worldBackups.remove(profileId, backupId); });
    guarded('world-backups:open-folder', async profileId => {
      const folder = worldBackups.folder(profileId);
      await require('node:fs/promises').mkdir(folder, { recursive: true });
      const error = await shell.openPath(folder);
      if (error) throw new Error(error);
      return true;
    });
    guarded('versions:list', refresh => refresh === true ? versions.refresh() : versions.list());
    const installer = createInstaller({ root: path.join(app.getPath('userData'), 'minecraft'), onProgress: progress => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('minecraft:progress', progress);
    } });
    guarded('minecraft:install', version => installer.install(version));
    guarded('minecraft:status', version => installer.status(version));
    guarded('minecraft:cancel', () => installer.cancel());
    guarded('game:launch', async profile => {
      require('./game-loader.cjs').validateProfile(profile);
      if (worldBackups.isBusy()) throw new Error('Дождись завершения операции с резервными копиями.');
      if (modpacks.isBusy()) throw new Error('Дождись завершения импорта сборки.');
      if (instances.isBusy()) throw new Error('Дождись завершения операции со сборкой.');
      if (skinInstallPending) throw new Error('Дождись установки поддержки скинов.');
      if (friendsInstallPending) throw new Error('Дождись установки игры с друзьями.');
      if (catalogInstallPending) throw new Error('Дождись установки мода.');
      if (launchPending || game.status().running) throw new Error('Игра уже запускается или запущена.');
      launchPending = profile.id;
      try {
        if (profile.autoBackup === true) {
          if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('game:progress', { phase: 'backup', profileId: profile.id, message: 'Создаём резервную копию миров…' });
          await worldBackups.create(profile.id, 'auto', profile.backupLimit);
        }
        const skinName = profile.accountMode === 'ely' ? (await ely.current().status()).name : profile.accountMode === 'microsoft' ? preferences.status().microsoftAccount : profile.playerName || 'Player';
        await skins.prepare(profile,skinName,profile.accountMode === 'ely' ? 'mojang' : undefined);
        return await game.launch(profile, {
          userData: app.getPath('userData'), minecraftRoot: path.join(app.getPath('userData'), 'minecraft'),
          onProgress: progress => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('game:progress', progress);
          },
        });
      } finally { launchPending = null; }
    });
    guarded('game:status', () => ({ ...game.status(), preparing: Boolean(launchPending), pendingProfileId: launchPending }));
    guarded('game:console', () => ({ ...game.consoleSnapshot(), preparing: Boolean(launchPending), pendingProfileId: launchPending }));
    guarded('game:stop', (profileId, sessionId) => game.stop(profileId, sessionId));
    guarded('game:open-log', async id => {
      const filename = path.join(require('./game-loader.cjs').instanceFolder(app.getPath('userData'), id), 'astra-launch.log');
      const stat = await require('node:fs/promises').lstat(filename);
      if (!stat.isFile()) throw new Error('Некорректный журнал игры.');
      const error = await shell.openPath(filename);
      if (error) throw new Error(error);
    });
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
