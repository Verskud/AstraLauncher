const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_DOWNLOAD_SIZE, readResponseBytes } = require('../src/main/download.cjs');

test('downloads over 150 MB are allowed while the hard ceiling is 1 GiB', async () => {
  assert.equal(MAX_DOWNLOAD_SIZE, 1024 ** 3);
  const response = new Response(Buffer.from('test'), { headers: { 'content-length': '200000000' } });
  assert.equal((await readResponseBytes(response)).toString(), 'test');
});

test('rejects a file when the server advertises a size above the ceiling', async () => {
  const response = new Response(Buffer.from('tiny'), { headers: { 'content-length': String(MAX_DOWNLOAD_SIZE + 1) } });
  await assert.rejects(readResponseBytes(response), /допустимый размер/);
});

test('enforces the size ceiling while streaming when content-length is missing', async () => {
  const response = new Response(new ReadableStream({
    start(controller) { controller.enqueue(Buffer.from('123456')); controller.enqueue(Buffer.from('78901')); controller.close(); },
  }));
  await assert.rejects(readResponseBytes(response, 10), /допустимый размер/);
});
