const fs = require('node:fs/promises');
const path = require('node:path');

const MAX_FONT_SIZE = 20 * 1024 * 1024;
const TYPES = Object.freeze({
  '.ttf': { mime: 'font/ttf', signatures: ['00010000', '74727565'] },
  '.otf': { mime: 'font/otf', signatures: ['4f54544f'] },
  '.woff': { mime: 'font/woff', signatures: ['774f4646'] },
  '.woff2': { mime: 'font/woff2', signatures: ['774f4632'] },
});

function fontFolder(userData) { return path.join(userData, 'appearance'); }
function metadataFile(userData) { return path.join(fontFolder(userData), 'custom-font.json'); }

async function status(userData) {
  try {
    const metadata = JSON.parse(await fs.readFile(metadataFile(userData), 'utf8'));
    const type = TYPES[metadata.extension];
    if (!type) throw new Error('Invalid font record');
    const filename = path.join(fontFolder(userData), `custom-font${metadata.extension}`);
    const info = await fs.stat(filename);
    if (!info.isFile() || info.size < 4 || info.size > MAX_FONT_SIZE) throw new Error('Invalid font record');
    return { active: true, name: String(metadata.name || 'Custom font').slice(0, 80), mime: type.mime, revision: Math.floor(info.mtimeMs), filename };
  } catch { return { active: false, name: '' }; }
}

async function install(userData, source) {
  const extension = path.extname(source).toLowerCase();
  const type = TYPES[extension];
  if (!type) throw new Error('Поддерживаются шрифты TTF, OTF, WOFF и WOFF2.');
  const info = await fs.stat(source);
  if (!info.isFile() || info.size < 4 || info.size > MAX_FONT_SIZE) throw new Error('Размер шрифта должен быть не больше 20 МБ.');
  const file = await fs.open(source, 'r');
  let signature;
  try { const bytes = Buffer.alloc(4); await file.read(bytes, 0, 4, 0); signature = bytes.toString('hex'); }
  finally { await file.close(); }
  if (!type.signatures.includes(signature)) throw new Error('Выбранный файл не похож на корректный шрифт.');
  const folder = fontFolder(userData);
  await fs.mkdir(folder, { recursive: true });
  const target = path.join(folder, `custom-font${extension}`);
  const bytes = await fs.readFile(source);
  await fs.writeFile(target, bytes, { mode: 0o600 });
  await Promise.all(Object.keys(TYPES).filter(value => value !== extension).map(value => fs.rm(path.join(folder, `custom-font${value}`), { force: true })));
  await fs.writeFile(metadataFile(userData), JSON.stringify({ extension, name: path.basename(source, extension).slice(0, 80) }), { mode: 0o600 });
  return status(userData);
}

async function reset(userData) {
  const folder = fontFolder(userData);
  await Promise.all([...Object.keys(TYPES).map(extension => fs.rm(path.join(folder, `custom-font${extension}`), { force: true })), fs.rm(metadataFile(userData), { force: true })]);
  return { active: false, name: '' };
}

module.exports = { install, reset, status, MAX_FONT_SIZE };
