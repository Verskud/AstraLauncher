const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { routeConsoleToFile } = require('../src/main/process-output.cjs');
const modulePath = require.resolve('../src/main/process-output.cjs');

function closeOutputPipe(protectedOutput) {
  return new Promise((resolve,reject) => {
    const code = `${protectedOutput ? `require(${JSON.stringify(modulePath)}).protectProcessOutput();` : ''}
      process.stdout.write('ready');
      setTimeout(() => {
        process.stdout.write(Buffer.alloc(2 * 1024 * 1024, 65));
        setTimeout(() => process.stderr.write('survived'), 80);
      }, 80);`;
    const child = spawn(process.execPath, ['-e', code], { stdio: ['ignore','pipe','pipe'] });
    let stderr = '';
    child.stdout.once('data', () => child.stdout.destroy());
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stderr }));
  });
}

test('Electron diagnostics survive a terminal closing its output pipe', async () => {
  const unprotected = await closeOutputPipe(false);
  assert.notEqual(unprotected.status, 0, 'Regression must reproduce without protection');
  assert.match(unprotected.stderr, /EPIPE|ERR_STREAM_DESTROYED/);
  const protectedOutput = await closeOutputPipe(true);
  assert.equal(protectedOutput.status, 0);
  assert.equal(protectedOutput.stderr, 'survived');
});

test('Unexpected output errors remain fatal', () => {
  const child = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(modulePath)}).protectProcessOutput();process.stdout.emit('error',Object.assign(new Error('denied'),{code:'EACCES'}));`]);
  assert.notEqual(child.status, 0);
  assert.match(child.stderr.toString(), /EACCES/);
});

test('File logging keeps diagnostics and tolerates a removed log directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'astra-output-test-'));
  const logfile = path.join(root, 'logs', 'launcher.log');
  const previousConsole = global.console;
  try {
    assert.equal(routeConsoleToFile(logfile), true);
    console.error('diagnostic %s', 'fixture');
    assert.match(fs.readFileSync(logfile,'utf8'), /diagnostic fixture/);
    fs.unlinkSync(logfile);
    fs.rmdirSync(path.dirname(logfile));
    assert.doesNotThrow(() => console.error('Directory no longer exists'));
  } finally {
    global.console = previousConsole;
    const resolved = path.resolve(root);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Unsafe cleanup path');
    fs.rmSync(resolved, { recursive:true, force:true });
  }
});
