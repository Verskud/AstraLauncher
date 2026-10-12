const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const nativeFs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { app, BrowserWindow, dialog } = require('electron');
process.on('uncaughtException', error => { process.stderr.write(error.stack+'\n'); app.exit(1); });
const { writeZip } = require('../src/main/zip-writer.cjs');

const root = nativeFs.mkdtempSync(path.join(os.tmpdir(), 'astra-desktop-import-'));
app.setPath('userData', root);
BrowserWindow.prototype.show = function () {};
let exitCode = 0;
const timeout = setTimeout(() => { exitCode = 1; app.exit(1); }, 30000);
const prism = path.join(root, 'prism.zip'), raw = path.join(root, 'raw.zip');
const selections = [prism, raw];
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selections.shift()] });
require(path.resolve('release/win-unpacked/resources/app.asar/src/main/main.cjs'));

app.on('quit', () => {
  clearTimeout(timeout);
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep + 'astra-desktop-import-'));
  try { nativeFs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
  process.exitCode = exitCode;
});

(async () => {
  await writeZip(prism, [{ name: 'mmc-pack.json', bytes: Buffer.from(JSON.stringify({ formatVersion: 1, components: [{ uid: 'net.minecraft', version: '1.21.1' }, { uid: 'net.neoforged', version: '21.1.250' }] })) }, { name: 'minecraft/mods/test.jar', bytes: Buffer.from('test') }]);
  await writeZip(raw, [{ name: 'mods/custom.jar', bytes: Buffer.from('custom') }]);
  await app.whenReady();
  let window;
  for (let attempt = 0; attempt < 150; attempt++) {
    window = BrowserWindow.getAllWindows()[0];
    if (window && !window.webContents.isLoading()) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(window);
  const errors = [];
  window.webContents.on('console-message', (_event, details) => { if (details.level === 'error') errors.push(details.message); });
  const imported = await window.webContents.executeJavaScript('window.astraDesktop.importLocalModpack()');
  assert.equal(imported.format, 'prism');
  assert.equal(imported.profile.loaderVersion, '21.1.250');
  const pending = await window.webContents.executeJavaScript('window.astraDesktop.importLocalModpack()');
  assert.equal(pending.needsSettings, true);
  await assert.rejects(window.webContents.executeJavaScript('window.astraDesktop.completeLocalModpack("wrong-token", {})'));
  const completed = await window.webContents.executeJavaScript(`window.astraDesktop.completeLocalModpack(${JSON.stringify(pending.token)}, {name:'Raw Pack', version:'1.20.1', loader:'Forge', loaderVersion:'47.3.0'})`);
  assert.equal(completed.profile.loaderVersion, '47.3.0');
  assert.equal(await fs.readFile(path.join(completed.folder, 'mods/custom.jar'), 'utf8'), 'custom');
  assert.deepEqual(errors, []);
  process.stdout.write('Packaged desktop import OK: trusted IPC, Prism ZIP, raw ZIP settings, token validation, pinned loaders, separate user data.\n');
  app.quit();
})().catch(error => { process.stderr.write(error.stack + '\n'); exitCode = 1; app.exit(1); });
