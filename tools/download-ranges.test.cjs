const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { downloadRanges } = require('../src/main/download-ranges.cjs');
const root = path.join(__dirname, '.download-ranges-test');
after(async () => { await fs.rm(root, { recursive: true, force: true }); });
const bytes = Buffer.alloc(3 * 1024 * 1024 + 17, 37);
bytes[1048576] = 19;
const sha512 = crypto.createHash('sha512').update(bytes).digest('hex');

async function sample(fetchImpl, run) {
  await fs.mkdir(root, { recursive: true });
  const target = path.join(root, crypto.randomUUID() + '.jar');
  const original = global.fetch;
  global.fetch = fetchImpl;
  try { await run(target); }
  finally { global.fetch = original; await fs.rm(target, { force: true }); }
}
function rangeResponse(headers) {
  const [, a, b] = /^bytes=(\d+)-(\d+)$/.exec(headers.Range);
  const start = Number(a), end = Number(b);
  return new Response(bytes.subarray(start, end + 1), { status: 206, headers: { 'content-range': `bytes ${start}-${end}/${bytes.length}` } });
}
const options = { size: bytes.length, limit: 10 * 1024 * 1024, sha512 };

test('concurrent ranges assemble the exact file and verify the complete hash', async () => {
  let running = 0, peak = 0;
  await sample(async (_url, { headers, signal }) => {
    peak = Math.max(peak, ++running);
    try { await require('node:timers/promises').setTimeout(20, undefined, { signal }); return rangeResponse(headers); }
    finally { running--; }
  }, async target => {
    const progress = [];
    assert.equal(await downloadRanges('https://cdn.modrinth.com/file.jar', target, { ...options, onProgress: received => progress.push(received) }), true);
    assert.ok(peak > 1 && peak <= 4);
    assert.equal(progress.at(-1), bytes.length);
    assert.deepEqual(await fs.readFile(target), bytes);
  });
});

test('server without ranges falls back without leaving an incomplete file', async () => {
  await sample(async () => new Response('full file'), async target => {
    assert.equal(await downloadRanges('https://cdn.modrinth.com/file.jar', target, options), false);
    await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  });
});

test('wrong range or hash is rejected and partial files are removed', async () => {
  for (const badHeaders of [true, false]) {
    await sample(async (_url, { headers }) => badHeaders ? new Response('bad', { status: 206, headers: { 'content-range': 'bytes 0-2/3' } }) : rangeResponse(headers), async target => {
      await assert.rejects(downloadRanges('https://cdn.modrinth.com/file.jar', target, { ...options, sha512: '0'.repeat(128) }), badHeaders ? /неверную часть/ : /Контрольная сумма/);
      await assert.rejects(fs.stat(target), { code: 'ENOENT' });
    });
  }
});

test('cancellation stops all range workers before removing the partial file', async () => {
  const controller = new AbortController();
  let running = 0;
  await sample(async (_url, { headers, signal }) => {
    running++;
    try { await require('node:timers/promises').setTimeout(500, undefined, { signal }); return rangeResponse(headers); }
    finally { running--; }
  }, async target => {
    const timer = setTimeout(() => controller.abort(new Error('cancel ranges')), 30);
    try { await assert.rejects(downloadRanges('https://cdn.modrinth.com/file.jar', target, { ...options, signal: controller.signal }), /cancel ranges/); }
    finally { clearTimeout(timer); }
    assert.equal(running, 0);
    await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  });
});
