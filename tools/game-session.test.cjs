const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createGameSession, redactStream, HISTORY_LIMIT, FILE_LIMIT } = require('../src/main/game-session.cjs');

test('stream decoder preserves UTF-8 and hides tokens across every byte boundary', () => {
  const token = 'example-access-token-123456';
  const source = Buffer.from(`Привет 🌍 ${token}${token} конец`);
  for (let size = 1; size < source.length; size++) {
    let result = '';
    const decode = redactStream(token, value => result += value);
    for (let i = 0; i < source.length; i += size) decode(source.subarray(i, i + size));
    decode(null, true);
    assert.equal(result, 'Привет 🌍 [token][token] конец');
  }
});

async function sessionTest(code, run, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'astra-game-session-'));
  const filename = path.join(root, 'launch.log');
  const child = spawn(options.executable || process.execPath, ['-e', code], { windowsHide:true, stdio:['ignore','pipe','pipe'] });
  let result;
  const session = createGameSession(child, { profileId:'test', name:'Test game', filename, token:'secret-test-token', onExit:event => result = event });
  try { await run(session, filename, () => result); }
  finally {
    if (session.status().running) await session.stop('test', session.status().sessionId);
    await session.closed;
    await session.flushed;
    await fs.rm(root, { recursive:true, force:true, maxRetries:10, retryDelay:30 });
  }
}
const until = async check => {
  for (let i = 0; i < 100; i++) { if (await check()) return; await new Promise(resolve=>setTimeout(resolve,20)); }
  throw Error('Condition timed out');
};

test('live stdout/stderr reach disk before exit and forced stop targets only the captured session', async () => {
  await sessionTest("process.stdout.write('ready secret-'); setTimeout(()=>process.stderr.write('ERROR test\\n'),20); setTimeout(()=>process.stdout.write('test-token\\n'),40); setInterval(()=>{},1000)", async (session, filename, exit) => {
    await until(()=>session.snapshot().text.includes('[token]'));
    await until(async()=> (await fs.readFile(filename,'utf8')).includes('[token]'));
    assert.equal(session.snapshot().text.includes('secret-test-token'),false);
    await assert.rejects(session.stop('other',session.status().sessionId));
    await assert.rejects(session.stop('test','previous-session'));
    assert.equal(session.status().running,true);
    const id = session.status().sessionId;
    await Promise.all([session.stop('test',id), session.stop('test',id)]);
    assert.equal(session.status().running,false);
    assert.equal(exit().stopped,true);
    assert.equal((await session.stop('test',id)).stopped,false);
  });
});

test('large output stays bounded in memory without dropping the disk log; nonzero exits retained', async () => {
  await sessionTest("process.stdout.write('x'.repeat(400000));process.stderr.write('\\nERROR failed\\n');process.exitCode=1", async (session, filename, exit) => {
    await session.closed;
    assert.ok(session.snapshot().text.length <= HISTORY_LIMIT);
    assert.equal(exit().code,1);
    assert.equal(exit().stopped,false);
    await until(async()=> (await fs.stat(filename)).size >= 400000);
    assert.ok((await fs.readFile(filename,'utf8')).includes('ERROR failed'));
  });
});

test('missing Java executable ends the session with a diagnostic instead of reporting it running', async () => {
  await sessionTest('', async (session, _filename, exit) => {
    await session.closed;
    assert.equal(session.status().running,false);
    assert.match(exit().failure,/ENOENT/);
  }, { executable:path.join(os.tmpdir(),'astra-nonexistent-java','java.exe') });
});

test('a noisy game cannot grow its launcher log without a limit', async () => {
  await sessionTest("process.stdout.write('x'.repeat(11*1024*1024));", async (session, filename) => {
    await session.closed; await session.flushed;
    assert.ok(session.snapshot().text.length <= HISTORY_LIMIT);
    const size = (await fs.stat(filename)).size;
    assert.ok(size >= FILE_LIMIT && size < FILE_LIMIT + 100);
    assert.equal(session.status().exitCode,0);
  });
});

test('Windows stop includes child processes and leaves unrelated processes running', {skip:process.platform!=='win32'}, async () => {
  const unrelated = spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});
  try {
    await sessionTest("const c=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'}); console.log('descendant:'+c.pid);setInterval(()=>{},1000)",async session=>{
      await until(()=>/descendant:\d+/.test(session.snapshot().text));
      const descendant = Number(/descendant:(\d+)/.exec(session.snapshot().text)[1]);
      await session.stop('test',session.status().sessionId);
      await until(()=>{try{process.kill(descendant,0);return false;}catch{return true;}});
      assert.doesNotThrow(()=>process.kill(unrelated.pid,0));
    });
  } finally { unrelated.kill(); }
});
