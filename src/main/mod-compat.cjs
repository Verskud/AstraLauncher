const zlib = require('node:zlib');
const fs = require('node:fs/promises');
const path = require('node:path');

function fabricMetadata(bytes) {
  const start = Math.max(0, bytes.length - 65557);
  let end = -1;
  for (let i = bytes.length - 22; i >= start; i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) return null;
  let offset = bytes.readUInt32LE(end + 16);
  const count = bytes.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) return null;
    const method = bytes.readUInt16LE(offset + 10);
    const size = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const name = bytes.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (name === 'fabric.mod.json') {
      if (size > 1024 * 1024) throw new Error('Метаданные мода слишком большие.');
      const local = bytes.readUInt32LE(offset + 42);
      if (bytes.readUInt32LE(local) !== 0x04034b50) return null;
      const data = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
      const compressed = bytes.subarray(data, data + size);
      const json = method === 8 ? zlib.inflateRawSync(compressed) : method === 0 ? compressed : null;
      if (!json || json.length > 1024 * 1024) throw new Error('Не удалось прочитать метаданные мода.');
      const value = JSON.parse(json.toString('utf8'));
      return typeof value.id === 'string' && typeof value.version === 'string' ? value : null;
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

function compareVersions(left, right) {
  const a = String(left).match(/\d+/g)?.slice(0, 3).map(Number) || [];
  const b = String(right).match(/\d+/g)?.slice(0, 3).map(Number) || [];
  for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  return 0;
}

function matchesVersion(version, requirement) {
  if (Array.isArray(requirement)) return requirement.some(item => matchesVersion(version, item));
  const text = String(requirement || '*').trim();
  if (text === '*') return true;
  const parts = text.split(/\s*\|\|\s*/);
  if (parts.length > 1) return parts.some(part => matchesVersion(version, part));
  const match = /^(>=|<=|>|<|\^|~|=)?\s*(\d+(?:\.\d+)?(?:\.\d+)?)(?:\.(x|\*))?$/.exec(text);
  if (!match) return true;
  const [, operator = '', wanted, wildcard] = match;
  const comparison = compareVersions(version, wanted);
  if (wildcard) return String(version).startsWith(`${wanted}.`);
  if (operator === '>=') return comparison >= 0;
  if (operator === '>') return comparison > 0;
  if (operator === '<=') return comparison <= 0;
  if (operator === '<') return comparison < 0;
  if (operator === '^') return String(version).split('.')[0] === wanted.split('.')[0] && comparison >= 0;
  if (operator === '~') return String(version).startsWith(`${wanted.split('.').slice(0, 2).join('.')}.`) && comparison >= 0;
  return comparison === 0;
}

function checkFabricCompatibility(entries) {
  const installed = new Map();
  for (const entry of entries) if (entry.metadata) {
    const id = entry.metadata.id;
    if (installed.has(id)) throw new Error(`В сборке две версии мода ${id}. Удали лишнюю копию.`);
    installed.set(id, entry);
  }
  for (const entry of entries) {
    const dependencies = entry.metadata?.depends || {};
    for (const [id, requirement] of Object.entries(dependencies)) {
      const dependency = installed.get(id);
      if (dependency && !matchesVersion(dependency.metadata.version, requirement)) {
        throw new Error(`${entry.metadata.name || entry.metadata.id} требует ${id} ${Array.isArray(requirement) ? requirement.join(' или ') : requirement}, а найден ${dependency.metadata.version}. Выбери совместимые версии модов.`);
      }
    }
  }
}

async function checkModFolder(folder) {
  let names;
  try { names = await fs.readdir(folder); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  const entries = [];
  for (const name of names.filter(value => value.toLowerCase().endsWith('.jar')).slice(0, 500)) {
    const bytes = await fs.readFile(path.join(folder, name));
    try { entries.push({ metadata: fabricMetadata(bytes) }); }
    catch {}
  }
  checkFabricCompatibility(entries);
}

module.exports = { fabricMetadata, matchesVersion, checkFabricCompatibility, checkModFolder };
