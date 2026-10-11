const net = require('node:net');
const dns = require('node:dns/promises');

function parseAddress(value) {
  if (typeof value !== 'string' || value.length > 255) throw new Error('Некорректный адрес сервера.');
  const match = /^(?:\[([a-f\d:]+)\]|([a-z\d._-]+))(?::(\d{1,5}))?$/i.exec(value.trim());
  if (!match || match[1] && net.isIP(match[1]) !== 6) throw new Error('Укажи адрес в формате host:port.');
  const host = (match[1] || match[2]).toLowerCase(), port = Number(match[3] || 25565);
  if (port < 1 || port > 65535) throw new Error('Некорректный порт сервера.');
  return { host, port, explicitPort: !!match[3] };
}
function varint(value) {
  const bytes = []; value >>>= 0;
  do { const byte = value & 127; value >>>= 7; bytes.push(byte | (value ? 128 : 0)); } while (value);
  return Buffer.from(bytes);
}
function readVarint(buffer, start = 0) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (start + i >= buffer.length) return null;
    const byte = buffer[start + i]; value |= (byte & 127) << (7 * i);
    if (!(byte & 128)) return { value: value >>> 0, end: start + i + 1 };
  }
  throw new Error('Invalid VarInt');
}
const frame = bytes => Buffer.concat([varint(bytes.length), bytes]);
function motd(value, depth = 0) {
  if (depth > 12) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.slice(0,100).map(item => motd(item, depth + 1)).join('');
  if (!value || typeof value !== 'object') return '';
  return motd(value.text || value.translate || '', depth + 1) + motd(value.extra, depth + 1);
}
async function ping(address, { timeoutMs = 5000, resolveSrv = dns.resolveSrv } = {}) {
  const original = parseAddress(address);
  let target = original, deadline = Date.now() + timeoutMs;
  if (!original.explicitPort && !net.isIP(original.host)) {
    let timer;
    try {
      const records = await Promise.race([resolveSrv(`_minecraft._tcp.${original.host}`), new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('DNS timeout')), Math.min(1500, timeoutMs)); })]);
      const record = records.sort((a,b) => a.priority-b.priority || b.weight-a.weight)[0];
      if (record) target = { host: record.name, port: record.port };
    } catch {} finally { clearTimeout(timer); }
  }
  return new Promise(resolve => {
    const socket = net.createConnection({ host: target.host, port: target.port });
    let buffer = Buffer.alloc(0), status, pingTime, settled = false;
    const nonce = Buffer.alloc(8); nonce.writeBigInt64BE(BigInt(Date.now()));
    const finish = result => { if (settled) return; settled = true; clearTimeout(timer); socket.destroy(); resolve({ checkedAt: Date.now(), ...result }); };
    const timer = setTimeout(() => finish(status ? { ...status, ping: null } : { online: false, reason: 'timeout' }), Math.max(1, deadline-Date.now()));
    socket.on('error', () => finish({ online: false, reason: 'unreachable' }));
    socket.on('end', () => finish(status ? { ...status, ping: null } : { online: false, reason: 'closed' }));
    socket.on('connect', () => {
      const host = Buffer.from(original.host), port = Buffer.alloc(2); port.writeUInt16BE(target.port);
      socket.write(Buffer.concat([frame(Buffer.concat([varint(0),varint(-1),varint(host.length),host,port,varint(1)])), frame(varint(0))]));
    });
    socket.on('data', chunk => {
      try {
        if (buffer.length + chunk.length > 1024*1024) throw new Error('Oversized packet');
        buffer = Buffer.concat([buffer,chunk]);
        while (buffer.length) {
          const length = readVarint(buffer);
          if (!length) break;
          if (!length.value || length.value > 1024*1024) throw new Error('Invalid packet length');
          if (buffer.length < length.end + length.value) break;
          const packet = buffer.subarray(length.end, length.end+length.value); buffer = buffer.subarray(length.end+length.value);
          const id = readVarint(packet);
          if (!id) throw new Error('Invalid packet');
          if (id.value === 0 && !status) {
            const size = readVarint(packet,id.end);
            if (!size || size.end + size.value !== packet.length) throw new Error('Invalid status');
            const json = JSON.parse(packet.subarray(size.end).toString('utf8'));
            const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
            status = { online: true, players: count(json.players?.online), maxPlayers: count(json.players?.max), version: String(json.version?.name || '').slice(0,120), motd: motd(json.description).replace(/§[0-9a-fk-or]/gi,'').slice(0,2048) };
            pingTime = performance.now(); socket.write(frame(Buffer.concat([varint(1),nonce])));
          } else if (id.value === 1 && status && packet.subarray(id.end).equals(nonce)) {
            finish({ ...status, ping: Math.round(performance.now()-pingTime) }); return;
          } else throw new Error('Unexpected packet');
        }
      } catch { finish({ online:false, reason:'invalid-response' }); }
    });
  });
}
function createServerMonitor() {
  const pending = new Map(), cache = new Map();
  return async address => {
    const parsed = parseAddress(address), key = `${parsed.host}:${parsed.port}:${parsed.explicitPort}`;
    if (cache.has(key) && Date.now()-cache.get(key).checkedAt < 5000) return cache.get(key);
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= 4) throw new Error('Проверяется слишком много серверов. Повтори через несколько секунд.');
    const request = ping(address).then(result => { if(cache.size>=100)cache.delete(cache.keys().next().value); cache.set(key,result); return result; }).finally(() => pending.delete(key));
    pending.set(key,request); return request;
  };
}
module.exports = { parseAddress, ping, createServerMonitor, varint, readVarint, frame, motd };
