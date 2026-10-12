const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');

async function run() {
  const opened = [], windows = [];
  class FakeWindow {
    constructor(options) { this.options = options; this.events = {}; this.webContents = { events: {}, setWindowOpenHandler: fn => { this.popup = fn; }, on: (name, fn) => { this.webContents.events[name] = fn; } }; windows.push(this); }
    isDestroyed() { return false; }
    on(name, fn) { this.events[name] = fn; }
    async loadFile(file) { assert.ok(fs.existsSync(file)); this.file = file; }
    show() {}
    focus() {}
  }
  const mod = { exports: {} };
  const filename = path.resolve('src/main/legal.cjs');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require: name => name === 'electron' ? { BrowserWindow: FakeWindow, shell: { openExternal: async url => opened.push(url) } } : require(name),
    __dirname: path.dirname(filename), module: mod, console,
  });
  const open = mod.exports.openLegalDocument;
  await assert.rejects(open('../main.cjs'), /Неизвестный/);
  for (const kind of ['privacy', 'terms', 'licenses']) await open(kind);
  assert.equal(windows.length, 1);
  assert.equal(windows[0].options.webPreferences.nodeIntegration, false);
  assert.equal(windows[0].options.webPreferences.sandbox, true);
  let blocked = false;
  windows[0].webContents.events['will-navigate']({ preventDefault: () => { blocked = true; } }, 'file:///C:/private.txt');
  assert.equal(blocked, true);
  windows[0].popup({ url: 'javascript:alert(1)' });
  assert.equal(opened.length, 0);
  await open('website'); await open('source');
  assert.deepEqual(opened, ['https://verskud.github.io/AstraLauncher/', 'https://github.com/Verskud/AstraLauncher']);

  const asarRequire = createRequire(path.resolve('node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar/package.json'));
  const asar = asarRequire('@electron/asar');
  const archive = path.resolve('release/win-unpacked/resources/app.asar');
  const files = asar.listPackage(archive).map(file => file.replaceAll('\\', '/'));
  for (const name of ['LICENSE','NOTICE.md','src/main/legal.cjs','src/renderer/legal/privacy.html','src/renderer/legal/licenses/chromium.html','src/renderer/assets/fonts/OFL.txt']) assert.ok(files.includes('/' + name), name);
  assert.equal(JSON.parse(asar.extractFile(archive, 'package.json')).version, '0.9.28');
  assert.equal(files.some(name => /(?:\/node_modules\/|\/worlds\/|\/integrations\.json$|\/website\/|\/\.git\/)/.test(name)), false);

  const { chromium } = require(process.env.ASTRA_PLAYWRIGHT || 'C:/Users/Verskud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.ASTRA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ viewport: { width: 900, height: 560 } });
    await context.addInitScript(() => {
      localStorage.setItem('astra-v1',JSON.stringify({ packs: [], profile: 'Player', theme: 'forest', language: 'ru' }));
      window.astraDesktop = { setWindowTheme() {}, integrationsStatus: async()=>({}), minecraftVersions: async()=>({versions:[],source:'bundled'}), recoverModpacks:async()=>[], listInstalledFiles:async()=>[], gameStatus:async()=>({running:false}), catalogSearch:async()=>({total:0,items:[]}), minecraftInstallStatus:async()=>({phase:'idle'}), onMinecraftInstallProgress(){}, onGameProgress(){}, onModpackProgress(){}, onFriendsPlayProgress(){}, customFontStatus:async()=>({active:false}), playerSkinStatus:async()=>({source:'local'}), elyStatus:async()=>({connected:false}), openLegalDocument:async kind=>{window.lastLegalDocument=kind;} };
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('src/renderer/index.html')).href);
    await page.evaluate(()=>{settingsTab='about';go('settings');});
    for (const kind of ['privacy','terms','licenses','source','website']) {
      await page.locator(`[data-legal=${kind}]`).click();
      assert.equal(await page.evaluate(()=>window.lastLegalDocument),kind);
    }
    for(const locale of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']) {
      await page.evaluate(locale=>{state.language=locale;render();},locale);
      assert.equal(await page.locator('[data-legal]').count(),5);
      assert.equal(await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth),false,locale);
    }
    for (const kind of ['privacy','terms','licenses']) {
      await page.goto(pathToFileURL(path.resolve(`src/renderer/legal/${kind}.html`)).href);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal((await page.locator('body').innerText()).includes('{{'),false);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
  console.log('Legal release OK: fixed IPC targets, isolated document window, bundled notices, 12 UI languages, offline documents.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
