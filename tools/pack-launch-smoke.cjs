const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { launch, status, stop, consoleSnapshot } = require('../src/main/game-launch.cjs');

(async () => {
  const sourceRoot = path.join(process.env.APPDATA, 'AstraLauncher');
  const sourceId = process.argv[2];
  if (!/^[a-f0-9-]{36}$/i.test(sourceId || '')) throw new Error('Usage: node tools/pack-launch-smoke.cjs <instance UUID>');
  const source = path.join(sourceRoot, 'instances', sourceId);
  const root = await fs.mkdtemp(path.join(__dirname, '.launch-pack-'));
  const id = crypto.randomUUID(), target = path.join(root, 'instances', id);
  let startedPid;
  try {
    await fs.mkdir(target, { recursive: true });
    for (const name of ['mods', 'config', 'defaultconfigs', 'kubejs', 'scripts', 'resourcepacks', 'CustomSkinLoader']) {
      try { await fs.cp(path.join(source, name), path.join(target, name), { recursive: true }); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    let failure = null;
    const profile = JSON.parse(await fs.readFile(path.join(source, 'astra-pack.json'), 'utf8'));
    await launch({ ...profile, id, playerName: 'AstraTest', accountMode: 'local', memory: 6 }, { userData: root, minecraftRoot: path.join(sourceRoot, 'minecraft'), onProgress: event => {
      console.log(JSON.stringify(event));
      if (event.phase === 'error') failure = event.message;
    } });
    startedPid = status().pid;
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (failure) throw new Error(failure + '\n' + await fs.readFile(path.join(target, 'astra-launch.log'), 'utf8'));
      if (!status().running) throw new Error('Game exited before initialization.');
      let log = '';
      try { log = await fs.readFile(path.join(target, 'logs', 'latest.log'), 'utf8'); } catch {}
      if (/Created: .*textures\/atlas/.test(log)) {
        if (!consoleSnapshot().text.length) throw new Error('Live game console has no output.');
        console.log('PACK STARTUP OK: ' + profile.name + ', ' + profile.loader + ' ' + profile.loaderVersion + ', texture atlas initialized; live console contains game output');
        return;
      }
    }
    throw new Error('Startup check timed out.');
  } finally {
    if (startedPid && status().pid === startedPid) { await stop(id, status().sessionId); await new Promise(resolve => setTimeout(resolve, 1000)); }
    if (!path.resolve(root).startsWith(path.resolve(__dirname) + path.sep + '.launch-pack-')) throw new Error('Unsafe test folder');
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
