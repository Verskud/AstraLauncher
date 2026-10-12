import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'website', 'dist');
const target = path.join(root, 'src', 'renderer', 'legal');
await fs.mkdir(target, { recursive: true });
for (const name of ['privacy', 'terms', 'licenses']) {
  const page = await fs.readFile(path.join(source, 'ru', name + '.html'), 'utf8');
  const main = page.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];
  if (!main || /\{\{[A-Z_]+\}\}/.test(main)) throw new Error('Incomplete legal document: ' + name);
  const title = page.match(/<title>(.*?)<\/title>/)[1];
  const navigation = '<nav class="wrap" style="padding-top:24px" aria-label="Документы"><a href="privacy.html">Данные</a> · <a href="terms.html">Условия</a> · <a href="licenses.html">Лицензии</a></nav>';
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${title}</title><link rel="stylesheet" href="style.css"></head><body>${navigation}${main.replace('← На главную', '← Документы ASTRA')}<footer class="footer wrap"><p class="independent">Неофициальный продукт Minecraft. Не одобрен Mojang или Microsoft и не связан с ними.</p></footer></body></html>`;
  await fs.writeFile(path.join(target, name + '.html'), html);
}
await fs.copyFile(path.join(target, 'licenses.html'), path.join(target, 'index.html'));
for (const name of ['style.css', 'LICENSE.txt']) await fs.copyFile(path.join(source, name), path.join(target, name));
await fs.cp(path.join(source, 'licenses'), path.join(target, 'licenses'), { recursive: true });
await fs.mkdir(path.join(target, 'assets'), { recursive: true });
for (const name of ['manrope-cyrillic-wght-normal.woff2', 'manrope-latin-wght-normal.woff2', 'OFL.txt']) {
  await fs.copyFile(path.join(source, 'assets', name), path.join(target, 'assets', name));
}
console.log('Bundled offline legal documents and component license notices.');
