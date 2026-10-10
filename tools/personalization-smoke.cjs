const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const packed = process.argv.includes('--asar');
const appRoot = packed ? path.join(__dirname, '../release/win-unpacked/resources/app.asar/src') : path.join(__dirname, '../src');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'astra-personalization-'));
if (!path.resolve(tempRoot).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Unsafe test profile path');
app.setPath('userData', tempRoot);
ipcMain.handle('integrations:status', () => ({ curseforgeReady: false, microsoftClientId: '', microsoftAccount: '' }));
ipcMain.handle('catalog:search', () => ({ total: 0, items: [] }));
ipcMain.handle('versions:list', () => ({ ...require('../src/main/data/minecraft-versions.json'), source: 'bundled' }));

async function run() {
  await app.whenReady();
  const window = new BrowserWindow({
    show: false, width: 1200, height: 850,
    webPreferences: { preload: path.join(appRoot, 'preload/preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  const errors = [];
  window.webContents.on('console-message', (_, level, message) => { if (level >= 3) errors.push(message); });
  await window.loadFile(path.join(appRoot, 'renderer/index.html'));
  const js = expression => window.webContents.executeJavaScript(expression, true);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await js('document.querySelector("[data-page=settings]").click()');
  check(await js('document.querySelectorAll("#language-choice option").length') === 12, 'Expected 12 languages');
  const gaps = await js('Object.fromEntries(Object.entries(words).map(([locale,labels])=>[locale,Object.keys(words.ru).filter(key=>!labels[key])]).filter(([,missing])=>missing.length))');
  check(Object.keys(gaps).length === 0, `Missing translations: ${JSON.stringify(gaps)}`);
  const languages = ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb'];
  for (const language of languages) {
    const result = await js(`(()=>{const s=document.querySelector('#language-choice');s.value=${JSON.stringify(language)};s.dispatchEvent(new Event('change',{bubbles:true}));return {lang:document.documentElement.lang,dir:document.documentElement.dir,selected:document.querySelector('#language-choice')?.value,title:document.querySelector('#main h1')?.textContent};})()`);
    check(result.lang === language && result.selected === language, `Language ${language} failed: ${JSON.stringify(result)}`);
    check(result.dir === (language === 'ar' ? 'rtl' : 'ltr'), `Direction ${language} failed`);
    if (language === 'ar') {
      const layout = await js('({sidebar:document.querySelector(".sidebar").getBoundingClientRect().left,main:document.querySelector("main").getBoundingClientRect().left})');
      check(layout.sidebar > layout.main, `RTL layout failed: ${JSON.stringify(layout)}`);
    }
  }
  await js('document.querySelector("[data-settings-tab=appearance]").click()');
  check(await js('document.querySelectorAll(".theme-card").length') === 12, 'Expected twelve themes');
  const sidebarColors = new Set();
  for (const theme of ['dark','graphite','amethyst','ocean','forest','ember','frost','rose','copper','aurora','slate','sand']) {
    const result = await js(`(()=>{document.querySelector('[data-theme=${theme}]').click();return {active:document.body.classList.contains('theme-${theme}'),selected:document.querySelector('.theme-card.selected')?.dataset.theme};})()`);
    check(result.active && result.selected === theme, `Theme ${theme} failed: ${JSON.stringify(result)}`);
    sidebarColors.add(await js('getComputedStyle(document.querySelector(".sidebar")).backgroundColor'));
  }
  check(sidebarColors.size === 12, `Themes should have distinct sidebar colors, got ${sidebarColors.size}`);
  await js("document.querySelector('[data-theme=ocean]').click()");
  const accent = await js("(()=>{document.querySelector('[data-accent=mono]').click();return document.body.classList.contains('monochrome')})()");
  check(accent, 'Monochrome accent failed');
  await js('document.querySelector("[data-settings-tab=general]").click()');
  await js("(()=>{const s=document.querySelector('#language-choice');s.value='en';s.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await window.reload();
  const saved = await js('({language:document.documentElement.lang,theme:document.body.classList.contains("theme-ocean"),options:document.querySelectorAll("#language-choice option").length})');
  check(saved.language === 'en' && saved.theme && saved.options === 12, `Persistence failed: ${JSON.stringify(saved)}`);
  check(errors.length === 0, `Renderer errors: ${errors.join('; ')}`);
  await js('createModal()');
  check(await js('document.querySelectorAll("#create-form select[name=art] option").length') === 9, 'Expected nine covers');
  const coverChanged = await js('(()=>{const select=document.querySelector("#create-form select[name=art]");select.value="end";select.dispatchEvent(new Event("change",{bubbles:true}));return document.querySelector("#create-form .cover-preview")?.querySelector("svg")?.outerHTML.includes("#82759d")})()');
  check(coverChanged, 'Cover preview did not update');
  const savedCover = await js('(()=>{document.querySelector("#modal").close();state.packs.push({id:"cover-smoke",name:"Cover Smoke",version:"1.20.1",loader:"Fabric",art:"forest",mods:[]});selectedPack="cover-smoke";page="pack";packTab="options";render();const select=document.querySelector("#pack-options-form select[name=art]");select.value="cherry";select.dispatchEvent(new Event("change",{bubbles:true}));const preview=document.querySelector("#pack-options-form .cover-preview svg")?.outerHTML.includes("#df93ac");document.querySelector("#pack-options-form").requestSubmit();return {preview,cover:state.packs.find(pack=>pack.id==="cover-smoke")?.art}})()');
  check(savedCover.preview && savedCover.cover === 'cherry', `Editing a cover failed: ${JSON.stringify(savedCover)}`);
  check(await js('document.querySelector(".brand>span")?.firstChild?.textContent') === 'ASTRA', 'Brand should be uppercase');
  await js('document.querySelector("[data-page=library]").click()');
  check(await js('!!document.querySelector("[data-action=import]")'), 'Missing modpack import action');
  await js('document.querySelector("[data-action=import]").click()');
  check(await js('!!document.querySelector("[data-modpack-local]")'), 'Missing local .mrpack import');
  await js('document.querySelector("#modal").close()');
  fs.writeFileSync(path.join(__dirname, '.personalization-smoke-result.json'), JSON.stringify({ ok: true, packed, languages: languages.length, themes: 12, covers: 9, saved }));
  window.close();
}
run().then(() => app.quit()).catch(error => {
  fs.writeFileSync(path.join(__dirname, '.personalization-smoke-result.json'), JSON.stringify({ ok: false, error: String(error.stack || error) }));
  app.exit(1);
});
app.on('quit', () => {
  const target = path.resolve(tempRoot);
  if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep)) return;
  try {
    // Windows may still hold Chromium profile files while Electron is quitting.
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // A locked temporary profile is harmless; cleanup must never open an error dialog.
  }
});
