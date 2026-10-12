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
    await page.locator('#navigation [data-page=mods]').click();
    await page.locator('[data-live-source=curseforge]').click();
    assert.equal(await page.locator('#live-status').count(), 0);
    assert.equal(await page.locator('#manual-content-form [name=profile] option').count(), 1);
    assert.equal(await page.evaluate(() => window.contentCalls.searches.some(request => request.source === 'curseforge')), false);
    await page.locator('#curseforge-search-form input').fill('Sodium');
    await page.locator('#curseforge-search-form button').click();
    await page.waitForFunction(() => window.contentCalls.opens.length === 1);
    assert.deepEqual(await page.evaluate(() => window.contentCalls.opens[0]), { kind: 'mods', query: 'Sodium' });
    await page.locator('[data-content-folder]').click();
    assert.deepEqual(await page.evaluate(() => window.contentCalls.folders[0]), { id: '00000000-0000-0000-0000-000000000001', kind: 'mods' });
    await page.evaluate(() => window.contentCancel = true);
    await page.locator('#manual-content-form [type=submit]').click();
    await page.waitForFunction(() => !contentImportPending);
    assert.equal(await page.locator('#manual-content-form').count(), 1);
    await page.evaluate(() => { window.contentCancel = false; window.contentFail = true; });
    await page.locator('#manual-content-form [type=submit]').click();
    await page.waitForFunction(() => document.querySelector('.content-error')?.textContent === 'File rejected');
    await page.evaluate(() => window.contentFail = false);
    await page.locator('#manual-content-form [type=submit]').click();
    await page.waitForFunction(() => page === 'pack' && !contentImportPending);
    assert.equal(await page.locator('[data-content-import=mods]').count(), 1);
    assert.match(await page.locator('.mod-list').innerText(), /Test import/);
    for (const kind of ['resources', 'shaders']) {
      await page.locator(`[data-pack-tab=${kind}]`).click();
      await page.locator(`[data-content-import=${kind}]`).click();
      assert.equal(await page.locator('#manual-content-dialog-form [name=profile]').inputValue(), '00000000-0000-0000-0000-000000000001');
      await page.locator('#manual-content-dialog-form [type=submit]').click();
      await page.waitForFunction(kind => page === 'pack' && packTab === kind && !contentImportPending && !modal.open, kind);
    }
    await page.locator('[data-page=settings]').click();
    assert.equal(await page.locator('[data-live-config=curseforge]').count(), 0);
    await page.setViewportSize({ width: 900, height: 560 });
    for (const language of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']) {
      await page.evaluate(language => { state.language = language; liveSource = 'curseforge'; catalogType = 'resources'; go('mods'); }, language);
      assert.equal(await page.evaluate(() => contentCopy[currentLanguage()].length), 17);
      assert.equal(await page.locator('#main').evaluate(element => element.scrollWidth > element.clientWidth), false, language);
      assert.equal(await page.locator('#manual-content-form [name=profile] option').count(), 2);
    }
    await page.evaluate(() => { state.language = 'ru'; catalogType = 'resources'; render(); });
    if (process.env.ASTRA_CONTENT_SHOT) await page.screenshot({ path: process.env.ASTRA_CONTENT_SHOT });
    await page.evaluate(() => { catalogType = 'modpacks'; render(); });
    assert.equal(await page.locator('#manual-content-form').count(), 0);
    assert.match(await page.locator('.manual-content-panel').innerText(), /manifest.json/);
    await page.locator('[data-modpack-local]').click();
    await page.locator('#import-pack-settings button[type=submit]').waitFor();
    await page.waitForFunction(() => !document.querySelector('#import-pack-settings button[type=submit]').disabled);
    await page.locator('#import-pack-settings [name=name]').fill('Imported ZIP');
    await page.locator('#import-pack-settings [name=loader]').selectOption('Fabric');
    await page.locator('#import-pack-settings [name=loaderVersion]').fill('0.16.0');
    await page.locator('#import-pack-settings button[type=submit]').click();
    await page.waitForFunction(() => window.packImportCall && !document.querySelector('#modal').open);
    assert.deepEqual(await page.evaluate(() => window.packImportCall), { token: 'selected-archive', settings: { name: 'Imported ZIP', version: '1.21.1', loader: 'Fabric', loaderVersion: '0.16.0' } });
    assert.equal(await page.evaluate(() => state.packs.some(pack => pack.name === 'Imported ZIP')), true);
    await page.evaluate(() => { state.packs = []; catalogType = 'mods'; go('mods'); });
    assert.equal(await page.locator('#manual-content-form').count(), 0);
    assert.equal(await page.locator('.manual-content-panel [data-action=create]').count(), 1);
    await page.evaluate(() => { state.language = 'ru'; catalogType = 'resources'; render(); });
    assert.deepEqual(errors, []);
    console.log('Manual content UI OK: no CurseForge API requests, website search, target folders, cancel/errors, imported counts, three content tabs, no key settings, 12 languages, 900×560 layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
