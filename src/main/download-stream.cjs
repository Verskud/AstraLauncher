const fs = require('node:fs/promises');
const crypto = require('node:crypto');

async function writeResponseFile(response, target, { limit, expectedSize, sha512, sha1, touch = () => {}, onProgress = () => {}, signal }) {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > limit || expectedSize !== undefined && declared > expectedSize) throw new Error('Размер скачиваемого файла не совпал или превышает допустимый.');
  const handle = await fs.open(target, 'wx');
  let size = 0, success = false;
  const hashes = [sha512 && ['sha512', sha512], sha1 && ['sha1', sha1]].filter(Boolean).map(([algorithm, expected]) => ({ digest: crypto.createHash(algorithm), expected }));
  try {
    onProgress(0, expectedSize ?? (declared || 0));
    for await (const chunk of response.body) {
      signal?.throwIfAborted();
      touch();
      size += chunk.length;
      if (size > limit || expectedSize !== undefined && size > expectedSize) throw new Error('Размер скачиваемого файла не совпал или превышает допустимый.');
      for (const hash of hashes) hash.digest.update(chunk);
      let offset = 0;
      while (offset < chunk.length) {
        const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset);
        if (!bytesWritten) throw new Error('Не удалось записать скачиваемый файл.');
        offset += bytesWritten;
      }
      onProgress(size, expectedSize ?? (declared || 0));
    }
    signal?.throwIfAborted();
    if (expectedSize !== undefined && size !== expectedSize || declared && size !== declared) throw new Error('Файл скачался не полностью.');
    for (const hash of hashes) if (hash.digest.digest('hex') !== hash.expected.toLowerCase()) throw new Error('Контрольная сумма файла не совпала.');
    success = true;
    return size;
  } finally {
    await handle.close();
    if (!success) await fs.rm(target, { force: true }).catch(() => {});
  }
}

function retryable(error) {
  return error.name === 'TimeoutError' || error instanceof TypeError || /ECONN|ETIMEDOUT|UND_ERR|EAI_AGAIN|ENOTFOUND/.test(error.code || error.cause?.code || '') || [408, 429, 500, 502, 503, 504].includes(error.status);
}

async function retryDownload(run, signal, onRetry = () => {}) {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try { return await run(); }
    catch (error) {
      signal?.throwIfAborted();
      if (attempt >= 2 || !retryable(error)) throw error;
      onRetry(attempt + 2);
      await require('node:timers/promises').setTimeout(500 * (attempt + 1), undefined, { signal });
    }
  }
}
module.exports = { writeResponseFile, retryDownload };
