const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { StringDecoder } = require('node:string_decoder');

const HISTORY_LIMIT = 200_000;
const FILE_LIMIT = 10 * 1024 * 1024;

function redactStream(secret, emit) {
  const decoder = new StringDecoder('utf8');
  const token = typeof secret === 'string' && secret.length > 1 ? secret : '';
  let pending = '';
  return (chunk, final = false) => {
    pending += final ? decoder.end() : decoder.write(chunk);
    let end = pending.length;
    if (!final && token) {
      for (let length = Math.min(token.length - 1, pending.length); length > 0; length--) {
        if (pending.endsWith(token.slice(0, length))) { end -= length; break; }
      }
    }
    if (token) {
      let at = pending.indexOf(token);
      while (at !== -1 && at < end) {
        if (at + token.length > end) { end = at + token.length; break; }
        at = pending.indexOf(token, at + token.length);
      }
    }
    const text = pending.slice(0, end);
    pending = pending.slice(end);
    if (text) emit(token ? text.replaceAll(token, '[token]') : text);
  };
}

function createGameSession(child, { profileId, name, filename, token, onExit = () => {} }) {
  const sessionId = require('node:crypto').randomUUID();
  const file = fs.createWriteStream(filename, { mode: 0o600 });
  const flushed = new Promise(resolve => { file.once('close', resolve); });
  let text = '', bytes = 0, revision = 0, active = true, stopping = false, exitCode = null, signal = null, failure = '', logError = '', stopPromise;
  const startedAt = Date.now();
  let endedAt = null;
  const streams = [child.stdout, child.stderr].filter(Boolean);
  const append = value => {
    text = (text + value).slice(-HISTORY_LIMIT);
    revision++;
    if (file.destroyed || bytes >= FILE_LIMIT) return;
    const buffer = Buffer.from(value);
    const remaining = FILE_LIMIT - bytes;
    const part = buffer.subarray(0, remaining);
    bytes += part.length;
    if (!file.write(part)) streams.forEach(stream => stream.pause());
    if (bytes >= FILE_LIMIT) file.write('\n[Astra] Log file reached 10 MiB. Live console continues.\n');
  };
  file.on('drain', () => streams.forEach(stream => stream.resume()));
  file.on('error', error => { logError = error.message; revision++; streams.forEach(stream => stream.resume()); });
  const decoders = streams.map(stream => {
    const decode = redactStream(token, append);
    stream.on('data', decode);
    return decode;
  });
  child.on('error', error => { failure = error.message; });
  let resolveClosed;
  const closed = new Promise(resolve => { resolveClosed = resolve; });
  child.once('close', (code, exitSignal) => {
    decoders.forEach(decode => decode(null, true));
    exitCode = code; signal = exitSignal; active = false; endedAt = Date.now();
    if (failure) append(`\n[Astra] ${failure}\n`);
    append(`\n[Astra] ${stopping ? 'Stopped by user' : 'Process exited'} (code: ${code ?? '—'}${signal ? ', signal: ' + signal : ''}).\n`);
    file.end();
    resolveClosed();
    onExit({ stopped: stopping, code, signal, failure, text });
  });
  const status = () => ({ running: active, stopping: active && stopping, sessionId, profileId, name, pid: active ? child.pid : null, startedAt, endedAt, exitCode, signal, logError });
  async function stop(expectedId, expectedSession) {
    if (expectedId !== profileId || expectedSession !== sessionId) throw new Error('Эта игровая сессия уже завершена.');
    if (!active) return { stopped: false };
    if (stopPromise) return stopPromise;
    stopping = true;
    stopPromise = (async () => {
      try {
        if (!Number.isInteger(child.pid) || child.pid <= 0) throw new Error('Процесс игры ещё не запущен.');
        if (process.platform === 'win32') {
          const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
          await new Promise((resolve, reject) => execFile(executable, ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, timeout: 10000 }, error => error && active ? reject(error) : resolve()));
        } else if (!child.kill('SIGKILL') && active) throw new Error('Не удалось остановить игру.');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Игра не подтвердила завершение. Попробуй ещё раз.')), 10000);
          closed.then(() => { clearTimeout(timeout); resolve(); });
        });
        await flushed;
        return { stopped: true };
      } catch (error) { stopping = false; stopPromise = null; throw error; }
    })();
    return stopPromise;
  }
  return { status, snapshot: () => ({ ...status(), text, revision }), stop, closed, flushed };
}

module.exports = { createGameSession, redactStream, HISTORY_LIMIT, FILE_LIMIT };
