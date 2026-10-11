const fs = require('node:fs/promises');
const zlib = require('node:zlib');

const MAX_ENTRIES = 10000;
const MAX_ENTRY = 256 * 1024 * 1024;
const MAX_TOTAL = 1024 * 1024 * 1024;

function safePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || value.includes('\0')) throw new Error('В архиве найден небезопасный путь.');
  const parts = value.replace(/\/$/, '').split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || /[:<>"|?*]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error('В архиве найден небезопасный путь.');
  return parts.join('/');
}

async function readAt(file, length, position) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await file.read(buffer, 0, length, position);
  if (bytesRead !== length) throw new Error('Повреждённый ZIP архив.');
  return buffer;
}

async function openZip(filename, { maxEntry = MAX_ENTRY, maxTotal = MAX_TOTAL } = {}) {
  const file = await fs.open(filename, 'r');
  try {
    const { size } = await file.stat();
    const tailSize = Math.min(size, 65557);
    const tail = await readAt(file, tailSize, size - tailSize);
    let eocd = -1;
    for (let offset = tail.length - 22; offset >= 0; offset--) {
      if (tail.readUInt32LE(offset) === 0x06054b50 && offset + 22 + tail.readUInt16LE(offset + 20) === tail.length) { eocd = offset; break; }
    }
    if (eocd < 0) throw new Error('Файл не является корректным ZIP архивом.');
    const count = tail.readUInt16LE(eocd + 10);
    const directorySize = tail.readUInt32LE(eocd + 12);
    const directoryOffset = tail.readUInt32LE(eocd + 16);
    if (count > MAX_ENTRIES || count === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff || tail.readUInt16LE(eocd + 8) !== count || tail.readUInt16LE(eocd + 4) !== 0 || tail.readUInt16LE(eocd + 6) !== 0 || directoryOffset + directorySize > size) throw new Error('Слишком большой или неподдерживаемый ZIP архив.');
    const directory = await readAt(file, directorySize, directoryOffset);
    const entries = new Map();
    let offset = 0, total = 0;
    for (let i = 0; i < count; i++) {
      if (offset + 46 > directory.length || directory.readUInt32LE(offset) !== 0x02014b50) throw new Error('Повреждённый ZIP архив.');
      const flags = directory.readUInt16LE(offset + 8), method = directory.readUInt16LE(offset + 10);
      const packed = directory.readUInt32LE(offset + 20), unpacked = directory.readUInt32LE(offset + 24);
      const nameLength = directory.readUInt16LE(offset + 28), extraLength = directory.readUInt16LE(offset + 30), commentLength = directory.readUInt16LE(offset + 32);
      const end = offset + 46 + nameLength + extraLength + commentLength;
      if (end > directory.length || flags & 1 || ![0, 8].includes(method) || packed === 0xffffffff || unpacked === 0xffffffff || unpacked > maxEntry || (packed && unpacked / packed > 1000)) throw new Error('Архив содержит неподдерживаемый или слишком большой файл.');
      const name = directory.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
      const normalized = safePath(name);
      const mode = directory.readUInt32LE(offset + 38) >>> 16;
      if ((mode & 0o170000) === 0o120000) throw new Error('Символические ссылки в архиве не поддерживаются.');
      const key = normalized.toLowerCase();
      const isDirectory = name.endsWith('/');
      const previous = entries.get(key);
      if (previous) {
        if (!isDirectory || !previous.isDirectory) throw new Error('В архиве повторяется путь к файлу.');
        // Repeated directory records carry no files; keep the first validated entry.
        offset = end;
        continue;
      }
      if (!isDirectory) total += unpacked;
      if (total > maxTotal) throw new Error('Архив слишком большой.');
      entries.set(key, { name: normalized, isDirectory, flags, method, packed, unpacked, crc: directory.readUInt32LE(offset + 16), position: directory.readUInt32LE(offset + 42) });
      offset = end;
    }
    if (offset !== directory.length) throw new Error('Повреждённый ZIP архив.');
    return {
      entries: [...entries.values()],
      async read(entry) {
        if (entry.isDirectory) return Buffer.alloc(0);
        const local = await readAt(file, 30, entry.position);
        if (local.readUInt32LE(0) !== 0x04034b50 || local.readUInt16LE(8) !== entry.method) throw new Error('Повреждённый ZIP архив.');
        const start = entry.position + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
        if (start + entry.packed > directoryOffset) throw new Error('Повреждённый ZIP архив.');
        const compressed = await readAt(file, entry.packed, start);
        const bytes = entry.method === 8 ? zlib.inflateRawSync(compressed, { maxOutputLength: maxEntry }) : compressed;
        if (bytes.length !== entry.unpacked || crc32(bytes) !== entry.crc) throw new Error(`Повреждён файл ${entry.name} в архиве.`);
        return bytes;
      },
      async close() { await file.close(); },
    };
  } catch (error) { await file.close(); throw error; }
}

const crcTable = Array.from({ length: 256 }, (_, index) => { let value = index; for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1; return value >>> 0; });
function crc32(bytes) { let value = 0xffffffff; for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ value >>> 8; return (value ^ 0xffffffff) >>> 0; }

module.exports = { openZip, safePath };
