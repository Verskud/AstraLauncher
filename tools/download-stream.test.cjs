const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeResponseFile } = require('../src/main/download-stream.cjs');
const root = path.join(__dirname, '.download-stream-test');
after(async () => { await fs.rm(root, { recursive: true, force: true }); });

test('writes streamed chunks with byte progress and SHA-512 verification', async () => {
  await fs.mkdir(root, { recursive: true });
  const target = path.join(root, 'archive.mrpack');
  const bytes = Buffer.from('archive streaming');
  const reports = [];
  const response = new Response(new ReadableStream({ start(c) { c.enqueue(bytes.subarray(0, 4)); c.enqueue(bytes.subarray(4)); c.close(); } }));
  await writeResponseFile(response, target, { limit: 100, expectedSize: bytes.length, sha512: crypto.createHash('sha512').update(bytes).digest('hex'), onProgress: (done, total) => reports.push([done, total]) });
  assert.deepEqual(await fs.readFile(target), bytes);
  assert.deepEqual(reports, [[0, bytes.length], [4, bytes.length], [bytes.length, bytes.length]]);
});

test('removes partial files after wrong hash, truncated response, or cancellation', async () => {
  await fs.mkdir(root, { recursive: true });
  const target = path.join(root, 'failed.mrpack');
  for (const options of [{ sha512: '0'.repeat(128) }, { expectedSize: 100 }]) {
    await assert.rejects(writeResponseFile(new Response('data'), target, { limit: 200, ...options }));
    await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  }
  const controller = new AbortController();
  await assert.rejects(writeResponseFile(new Response('data'), target, { limit: 200, signal: controller.signal, onProgress: done => { if (done) controller.abort(new Error('cancel')); } }), /cancel/);
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
});
