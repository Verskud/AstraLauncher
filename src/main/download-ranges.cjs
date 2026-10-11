const fs = require('node:fs/promises');
const nativeFs = require('node:fs');
const crypto = require('node:crypto');
const { withDownloadResponse } = require('./download-response.cjs');
const { retryDownload } = require('./download-stream.cjs');

// Only use ranges for verified, known-size files from the official Modrinth CDN.
async function downloadRanges(url, target, { size, limit, sha512, sha1, signal, onProgress = () => {} }) {
  if (!Number.isSafeInteger(size) || size < 2 * 1024 * 1024 || new URL(url).hostname !== 'cdn.modrinth.com') return false;
  if (size > limit) throw new Error('Файл превышает допустимый размер загрузки.');
  const handle = await fs.open(target, 'wx');
  const controller = new AbortController();
  const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const chunkSize = 1024 * 1024;
  const count = Math.ceil(size / chunkSize);
  const received = new Array(count).fill(0);
  let next = 0, total = 0, success = false;
  function report(index, bytes) {
    total += bytes - received[index]; received[index] = bytes;
    onProgress(total, size);
  }
  try {
    onProgress(0, size);
    const workers = Array.from({ length: Math.min(4, count) }, async () => {
      try {
        while (next < count) {
          combined.throwIfAborted();
          const index = next++, start = index * chunkSize, end = Math.min(size, start + chunkSize) - 1;
          await retryDownload(() => withDownloadResponse(url, { signal: combined, headers: { Range: `bytes=${start}-${end}` } }, async (response, touch) => {
            if (response.status === 200 || response.status === 416) throw Object.assign(new Error('Источник не поддерживает загрузку по частям.'), { code: 'RANGE_UNSUPPORTED' });
            if (response.status !== 206) throw Object.assign(new Error(`Сервер файла ответил кодом ${response.status}.`), { status: response.status });
            if (response.headers.get('content-range') !== `bytes ${start}-${end}/${size}`) throw new Error('Сервер передал неверную часть файла.');
            let offset = 0;
            report(index, 0);
            for await (const chunk of response.body) {
              combined.throwIfAborted(); touch();
              if (offset + chunk.length > end - start + 1) throw new Error('Размер части файла не совпал.');
              let written = 0;
              while (written < chunk.length) {
                const { bytesWritten } = await handle.write(chunk, written, chunk.length - written, start + offset + written);
                if (!bytesWritten) throw new Error('Не удалось записать часть файла.');
                written += bytesWritten;
              }
              offset += chunk.length;
              report(index, offset);
            }
            if (offset !== end - start + 1) throw Object.assign(new Error('Часть файла скачалась не полностью.'), { code: 'ECONNRESET' });
          }, { idleTimeoutMs: 30000 }), combined);
        }
      } catch (error) { controller.abort(error); throw error; }
    });
    await Promise.allSettled(workers);
    if (controller.signal.aborted) throw controller.signal.reason;
    combined.throwIfAborted();
    const hashes = [sha512 && ['sha512', sha512], sha1 && ['sha1', sha1]].filter(Boolean).map(([algorithm, expected]) => ({ digest: crypto.createHash(algorithm), expected }));
    for await (const chunk of nativeFs.createReadStream(target)) {
      combined.throwIfAborted();
      for (const hash of hashes) hash.digest.update(chunk);
    }
    for (const hash of hashes) if (hash.digest.digest('hex') !== hash.expected.toLowerCase()) throw new Error('Контрольная сумма файла не совпала.');
    success = true;
    return true;
  } catch (error) {
    if (!signal?.aborted && error.code === 'RANGE_UNSUPPORTED') return false;
    throw error;
  } finally {
    await handle.close();
    if (!success) await fs.rm(target, { force: true }).catch(() => {});
  }
}
module.exports = { downloadRanges };
