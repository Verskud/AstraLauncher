const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { install, reset, status, MAX_FONT_SIZE } = require('../src/main/custom-font.cjs');

test('custom font is copied into Astra data and survives source removal', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'astra-font-'));
  const source = path.join(root, 'My Interface.woff2');
  await fs.writeFile(source, Buffer.concat([Buffer.from('wOF2'), Buffer.alloc(32)]));
  try {
    const installed = await install(root, source);
    assert.equal(installed.active, true);
    assert.equal(installed.name, 'My Interface');
    assert.equal(installed.mime, 'font/woff2');
    await fs.rm(source);
    assert.equal((await status(root)).active, true);
    assert.deepEqual(await reset(root), { active: false, name: '' });
    assert.equal((await status(root)).active, false);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('invalid and oversized font files are rejected', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'astra-font-invalid-'));
  try {
    const invalid = path.join(root, 'archive.ttf');
    await fs.writeFile(invalid, Buffer.from('PK-not-a-font'));
    await assert.rejects(install(root, invalid), /корректный шрифт/);
    const oversized = path.join(root, 'large.woff');
    const file = await fs.open(oversized, 'w');
    try { await file.truncate(MAX_FONT_SIZE + 1); } finally { await file.close(); }
    await assert.rejects(install(root, oversized), /20 МБ/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
