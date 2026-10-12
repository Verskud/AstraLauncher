const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/Verskud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ viewport: { width: 1180, height: 760 } });
    await context.addInitScript(() => {
      const fabric = { id: '00000000-0000-0000-0000-000000000001', name: 'My Fabric', version: '1.21.1', loader: 'Fabric', art: 'forest', mods: [] };
      const vanilla = { ...fabric, id: '00000000-0000-0000-0000-000000000002', name: 'Vanilla', loader: 'Vanilla' };
      localStorage.setItem('astra-v1', JSON.stringify({ packs: [fabric, vanilla], profile: 'Player', theme: 'ocean', language: 'ru', memory: 4 }));
      window.contentCalls = { searches: [], opens: [], imports: [], installed: [], folders: [] };
      window.astraDesktop = {
        setWindowTheme() {}, integrationsStatus: async () => ({ curseforgeReady: true }),
        minecraftVersions: async () => ({ latest: { release: '1.21.1', snapshot: '1.21.1' }, versions: [{ id: '1.21.1', type: 'release', releaseTime: '2024-08-08T00:00:00Z' }], source: 'live' }),
        importLocalModpack: async () => ({ needsSettings: true, name: 'Custom ZIP', token: 'selected-archive' }),
        completeLocalModpack: async (token, settings) => {
          window.packImportCall = { token, settings };
          return { profile: { ...fabric, ...settings, id: '00000000-0000-0000-0000-000000000003' }, files: 3, overrides: 2 };
        },
        recoverModpacks: async () => [], gameStatus: async () => ({ running: false }),
        listInstalledFiles: async id => window.contentCalls.installed.filter(item => item.profileId === id),
        minecraftInstallStatus: async () => ({ phase: 'idle' }),
        onMinecraftInstallProgress() {}, onGameProgress() {}, onModpackProgress() {}, onFriendsPlayProgress() {},
        customFontStatus: async () => ({ active: false }), elyStatus: async () => ({}),
        playerSkinStatus: async () => ({ source: 'local', model: 'classic', skin: null, cape: null }),
        catalogSearch: async request => { window.contentCalls.searches.push(request); return { total: 0, items: [] }; },
        openCurseForgeWebsite: async (kind, query) => window.contentCalls.opens.push({ kind, query }),
        openContentFolder: async (id, kind) => window.contentCalls.folders.push({ id, kind }),
        importInstanceContent: async (profile, kind) => {
          window.contentCalls.imports.push({ profile, kind });
          if (window.contentCancel) return null;
          if (window.contentFail) throw new Error('File rejected');
          const item = { profileId: profile.id, kind, path: 'C:/test/' + kind + '.jar', filename: kind + '.jar', name: 'Test import', source: 'local' };
          window.contentCalls.installed.push(item); return { installed: [item], skipped: [] };
        },
      };
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('src/renderer/index.html')).href);

    await page.evaluate(() => {
      window.testSession = { running:false, text:'', revision:0 };
      window.astraDesktop.gameStatus = async () => window.testSession;
      window.astraDesktop.gameConsole = async () => window.testSession;
      window.astraDesktop.launchGame = async profile => {
        window.launchCount = (window.launchCount || 0) + 1;
        await new Promise(resolve => setTimeout(resolve,100));
        window.testSession = { running:true, profileId:profile.id, sessionId:'session-1', name:profile.name, pid:12345, text:'[INFO] Ready\n[ERROR] example failure\n<script>window.injected=true</script>\n', revision:1 };
        return { started:true };
      };
      window.astraDesktop.stopGame = async (id, sessionId) => { window.killCall = {id,sessionId}; window.testSession.running=false; window.testSession.exitCode=1; window.testSession.revision++; return {stopped:true}; };
      state.language='en'; go('library');
    });
    await page.locator('[data-launch]').first().click();
    await page.waitForFunction(() => gameView.running && !launchInFlight);
    assert.equal(await page.locator('#game-console').evaluate(el=>el.open),true);
    assert.ok(await page.locator('.console-output').textContent().then(text=>text.includes('[INFO] Ready')));
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.equal(await page.locator('[data-launch]:not([disabled])').count(),0);
    await page.locator('[data-console-search]').fill('failure');
    assert.equal((await page.locator('.console-output').textContent()).trim(),'[ERROR] example failure');
    await page.locator('[data-console-search]').fill('');
    await page.locator('[data-console-errors]').check();
    assert.equal((await page.locator('.console-output').textContent()).trim(),'[ERROR] example failure');
    await page.locator('[data-console-errors]').uncheck();
    await page.locator('#game-console [data-console-font]').selectOption('16');
    await page.locator('[data-console-wrap]').check();
    assert.equal(await page.locator('.console-output').evaluate(el=>getComputedStyle(el).fontSize),'16px');
    for (const theme of ['dark','frost','ocean','glass']) {
      await page.evaluate(theme=>{state.theme=theme;applyAppearance();},theme);
      await page.setViewportSize({width:900,height:560});
      assert.equal(await page.locator('#game-console').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    }
    for (const language of ['ru','en','de','de-CH','fr','es','ko','ja','zh-CN','zh-TW','ar','nb']) {
      await page.evaluate(language=>{state.language=language;render();openGameConsole();},language);
      assert.equal(await page.locator('#game-console').evaluate(el=>el.scrollWidth>el.clientWidth),false,language);
    }
    await page.evaluate(()=>{state.language='ru';state.theme='ocean';applyAppearance();openGameConsole();});
    require('node:fs').mkdirSync('release/test-shots',{recursive:true});
    await page.screenshot({path:'release/test-shots/console-small.png'});
    await page.locator('#game-console [data-game-stop]').click();
    assert.equal(await page.locator('.console-confirm').isVisible(),true);
    assert.equal(await page.evaluate(()=>window.killCall),undefined);
    await page.locator('[data-console-cancel]').click();
    assert.equal(await page.evaluate(()=>gameView.running),true);
    await page.locator('#game-console [data-game-stop]').click();
    await page.locator('[data-console-confirm]').click();
    await page.waitForFunction(()=>!gameView.running);
    assert.deepEqual(await page.evaluate(()=>window.killCall),{id:'00000000-0000-0000-0000-000000000001',sessionId:'session-1'});
    assert.equal(await page.locator('[data-launch]:not([disabled])').count(),2);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#game-console').evaluate(el=>el.open),false);
    await page.evaluate(()=>{settingsTab='game';go('settings');});
    await page.locator('[data-console-mode]').selectOption('error');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('astra-v1')).consoleMode),'error');
    await page.evaluate(()=>{window.astraDesktop.launchGame=async()=>{throw Error('Missing Minecraft files');};go('library');});
    await page.locator('[data-launch]').first().click();
    await page.waitForFunction(()=>document.querySelector('#game-console').open&&!launchInFlight);
    assert.ok((await page.locator('.console-output').textContent()).includes('Missing Minecraft files'));
    assert.deepEqual(errors,[]);
    console.log('Game console UI OK: launch lock, live output, safe text, search, font/wrap, 12 languages, themes, 900x560, confirmed stop, error mode.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
