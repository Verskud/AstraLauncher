import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'site.config.json'), 'utf8'));
const out = path.join(root, 'dist');
const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const github = 'https://github.com/';
const release = github + config.releaseRepository + '/releases/tag/v' + config.version;
const download = release.replace('/tag/', '/download/') + '/' + encodeURIComponent(config.filename);
const source = github + config.sourceRepository;
const licenseName = config.license || 'Лицензия ожидает выбора владельцем';
const licenseNote = config.license ? `Собственный код предоставляется под лицензией ${config.license}.` : 'Проект готовится к публикации; лицензия собственного кода ещё не выбрана.';
const sourceNote = config.sourcePublic ? `Исходный код AstraLauncher доступен на <a href="${source}" target="_blank" rel="noopener noreferrer">GitHub</a>.` : 'Исходники лаунчера сейчас находятся в закрытом репозитории; проект пока не представлен как open source.';
const contactUrl = config.contact && config.contact.includes('@') ? 'mailto:' + config.contact : config.contact || '#questions';
const values = {
  VERSION:escape(config.version), SIZE:escape(config.size), YEAR:config.year, OWNER:escape(config.owner), COUNTRY:escape(config.country || 'Ожидает подтверждения'), DATE:escape(config.date),
  CONTACT:config.contact ? `<a href="${escape(contactUrl)}">${escape(config.contact)}</a>` : 'Ожидает подтверждения владельцем', CONTACT_URL:escape(contactUrl), CONTACT_ATTRS:contactUrl.startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : '',
  LICENSE_NOTE:escape(licenseNote), SOURCE_NOTE:sourceNote,
  SIGNING_NOTE:escape(config.signingNote), RELEASE_URL:config.downloadReady ? release : '#download', CHECKSUM_URL:config.downloadReady ? release.replace('/tag/','/download/') + '/SHA256SUMS.txt' : '#download',
  DOWNLOAD_BUTTON:config.downloadReady ? `<a class="button primary" href="${download}" aria-label="Скачать AstraLauncher ${escape(config.version)} для Windows x64">Скачать AstraLauncher <span aria-hidden="true">↓</span></a>` : '<span class="button primary" aria-disabled="true">Выпуск готовится к публикации</span>',
};
const substitute = text => text.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => values[key] ?? '');
const inline = text => escape(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => /^(?:https:\/\/[^\s"'<>]+|[A-Za-z][A-Za-z0-9./_-]*)$/.test(href.replaceAll('&amp;','&')) ? `<a href="${href}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>` : label);
function markdown(text) {
  const lines = text.trim().split(/\r?\n/), parts = []; let list = false;
  for (const line of lines) {
    if (!line.startsWith('- ') && list) { parts.push('</ul>'); list = false; }
    if (!line.trim()) continue;
    if (line.startsWith('# ')) parts.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith('## ')) parts.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith('- ')) { if (!list) { parts.push('<ul>'); list = true; } parts.push(`<li>${inline(line.slice(2))}</li>`); }
    else parts.push(`<p>${inline(line)}</p>`);
  }
  if (list) parts.push('</ul>');
  return substitute(parts.join('\n'));
}
await fs.mkdir(out, { recursive:true });
if (await fs.stat(path.join(root,'src','assets')).catch(()=>false)) await fs.cp(path.join(root,'src','assets'),path.join(out,'assets'),{recursive:true});
if (await fs.stat(path.join(root,'src','licenses')).catch(()=>false)) await fs.cp(path.join(root,'src','licenses'),path.join(out,'licenses'),{recursive:true});
for (const name of ['style.css','site.js']) await fs.copyFile(path.join(root,'src',name),path.join(out,name));
const privatePreview = process.argv.includes('--private-preview');
const draft = privatePreview || !config.downloadReady || !config.country || !config.contact || !config.license;
const draftNote = privatePreview ? 'Частный предпросмотр. Публичный сайт: https://verskud.github.io/AstraLauncher/. Документы описывают эту публичную версию.' : 'Черновик для согласования. Документы описывают планируемый публичный сайт на GitHub Pages; данные владельца и лицензия ещё не подтверждены.';
const home = substitute(await fs.readFile(path.join(root,'src','index.html'),'utf8')).replace('<meta name="description"', `${draft ? '<meta name="robots" content="noindex,nofollow">\n  ' : ''}<meta name="description"`).replace('<body>', '<body>' + (privatePreview ? `<p class="document-date wrap">${draftNote}</p>` : ''));
await fs.writeFile(path.join(out,'index.html'),home);
const header = home.slice(home.indexOf('<header'),home.indexOf('</header>')+9).replace(/href="#/g,'href="./#');
const footer = home.slice(home.indexOf('<footer'),home.indexOf('</footer>')+9);
for (const name of ['privacy','terms','licenses']) {
  const text = await fs.readFile(path.join(root,'docs',name+'.md'),'utf8');
  const title = text.split(/\r?\n/)[0].slice(2);
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#0d0d11">${draft ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escape(title)} — AstraLauncher</title><link rel="icon" href="assets/astra.png"><link rel="stylesheet" href="style.css"></head><body><a class="skip-link" href="#main">Перейти к содержимому</a>${header}<main id="main" class="legal-main wrap"><a class="back-link" href="./">← На главную</a>${draft ? `<p class="document-date">${draftNote}</p>` : ''}${markdown(text)}</main>${footer}</body></html>`;
  await fs.writeFile(path.join(out,name+'.html'),html);
}
const licenseFile = await fs.readFile(path.join(root,'LICENSE'),'utf8').catch(()=>licenseName+'\nЛицензия ещё не выбрана. Это локальный черновик.\n');
await fs.writeFile(path.join(out,'LICENSE.txt'),licenseFile);
await fs.writeFile(path.join(out,'404.html'),home.replace('<title>AstraLauncher — место для твоих миров</title>','<title>Страница не найдена — AstraLauncher</title>').replace('<h1 id="hero-title">Место для<br>твоих <span>миров.</span></h1>','<h1 id="hero-title">Здесь пока<br>ничего <span>нет.</span></h1>'));
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built static site: ${out} (${config.downloadReady ? 'release enabled' : 'local draft'})`);
