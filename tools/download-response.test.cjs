const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { withDownloadResponse } = require('../src/main/download-response.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function serve(handler, run) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
const consume = async (response, touch) => {
  let size = 0;
  for await (const chunk of response.body) { touch(); size += chunk.length; }
  return size;
};
test('ongoing download outlives the idle timeout', async () => {
  await serve(async (_request, response) => {
    for (let i = 0; i < 6; i++) { response.write('data'); await delay(30); }
    response.end();
  }, async url => {
    assert.equal(await withDownloadResponse(url, {}, consume, { idleTimeoutMs: 100 }), 24);
  });
});
test('a stalled response body times out', async () => {
  await serve((_request, response) => { response.write('data'); }, async url => {
    await assert.rejects(withDownloadResponse(url, {}, consume, { idleTimeoutMs: 50 }), { name: 'TimeoutError' });
  });
});
test('waiting indefinitely for response headers times out', async () => {
  await serve(() => {}, async url => {
    await assert.rejects(withDownloadResponse(url, {}, consume, { idleTimeoutMs: 50 }), { name: 'TimeoutError' });
  });
});
test('user cancellation preserves its reason during a download', async () => {
  await serve((_request, response) => { response.write('data'); }, async url => {
    const controller = new AbortController();
    const reason = new Error('Cancelled by user');
    const timer = setTimeout(() => controller.abort(reason), 40);
    try { await assert.rejects(withDownloadResponse(url, { signal: controller.signal }, consume), error => error === reason); }
    finally { clearTimeout(timer); }
  });
});
