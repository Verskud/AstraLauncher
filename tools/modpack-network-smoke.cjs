const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const download = require('../src/main/download.cjs');
const { createModpackInstaller } = require('../src/main/modpack.cjs');

(async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.modpack-network-'));
  const started = Date.now();
  let archiveBytes = 0, archiveReports = 0, fileReports = 0;
  let lastReport = 0;
  const installer = createModpackInstaller({ userData: root, onProgress: data => {
    if (data.phase === 'archive') { archiveBytes = data.receivedBytes; archiveReports++; }
    if (data.phase === 'install') fileReports++;
    if (Date.now() - lastReport > 10000) {
      lastReport = Date.now();
      console.log(JSON.stringify({ phase: data.phase, completed: data.completed, total: data.total, receivedBytes: data.receivedBytes }));
    }
  } });
  try {
    const result = await installer.install(async (signal, report, staging) => {
      const resolved = await download.resolveModrinth({ source: 'modrinth', kind: 'modpacks', id: '1KVo5zza' }, AbortSignal.any([signal, AbortSignal.timeout(30000)]));
      const target = path.join(staging, 'pack.mrpack');
      await download.fetchResolvedToFile(resolved, target, signal, (receivedBytes, totalBytes) => report({ phase: 'archive', receivedBytes, totalBytes }));
      return { path: target, temporary: true, catalog: true };
    });
    assert.ok(archiveBytes > 0 && archiveReports > 1);
    assert.ok(result.files > 0 && fileReports > 1);
    await assert.rejects(fs.stat(path.join(result.folder, 'pack.mrpack')), { code: 'ENOENT' });
    assert.equal((await installer.recover()).length, 1);
    console.log(JSON.stringify({ pack: result.profile.name, minecraft: result.profile.version, files: result.files, overrides: result.overrides, archiveBytes, archiveReports, seconds: Number(((Date.now() - started) / 1000).toFixed(1)) }));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
