async function withDownloadResponse(url, options, consume, { idleTimeoutMs = 60000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  let timer;
  const touch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(Object.assign(new Error('Сервер загрузки не передаёт данные больше минуты. Повтори попытку.'), { name: 'TimeoutError' })), idleTimeoutMs);
    timer.unref?.();
  };
  touch();
  try {
    const response = await fetchImpl(url, { ...options, signal });
    touch();
    return await consume(response, touch);
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason;
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally { clearTimeout(timer); controller.abort(); }
}
module.exports = { withDownloadResponse };
