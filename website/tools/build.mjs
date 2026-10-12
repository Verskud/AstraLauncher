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
const licenseName = config.license || 'License pending owner confirmation';
const licenseNote = config.license ? `AstraLauncher source code is provided under the ${config.license} License.` : 'The project license has not been selected yet.';
const sourceNote = config.sourcePublic ? `AstraLauncher source code is available on <a href="${source}" target="_blank" rel="noopener noreferrer">GitHub</a>.` : 'Launcher source code is currently in a private repository.';
const contactUrl = config.contact && config.contact.includes('@') ? 'mailto:' + config.contact : config.contact || '#questions';
const values = {
  VERSION:escape(config.version), SIZE:escape(config.size.replace('Около','About').replace('МБ','MB')), YEAR:config.year, OWNER:escape(config.owner), COUNTRY:escape('Ukraine'), DATE:escape('October 12, 2026'),
  CONTACT:config.contact ? `<a href="${escape(contactUrl)}">${escape(config.contact)}</a>` : 'Ожидает подтверждения владельцем', CONTACT_URL:escape(contactUrl), CONTACT_ATTRS:contactUrl.startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : '',
  LICENSE_NOTE:escape(licenseNote), SOURCE_NOTE:sourceNote,
  SIGNING_NOTE:escape(config.signingNote), RELEASE_URL:config.downloadReady ? release : '#download', CHECKSUM_URL:config.downloadReady ? release.replace('/tag/','/download/') + '/SHA256SUMS.txt' : '#download',
  DOWNLOAD_BUTTON:config.downloadReady ? `<a class="button primary" href="${download}" aria-label="Download AstraLauncher ${escape(config.version)} for Windows x64">Download AstraLauncher <span aria-hidden="true">↓</span></a>` : '<span class="button primary" aria-disabled="true">Release coming soon</span>',
};
const russianValues = {
  ...values, SIZE: escape(config.size), COUNTRY: escape(config.country || 'Ожидает подтверждения'), DATE: escape(config.date),
  LICENSE_NOTE: escape(config.license ? `Собственный код предоставляется под лицензией ${config.license}.` : 'Лицензия ещё не выбрана.'),
  SOURCE_NOTE: config.sourcePublic ? `Исходный код AstraLauncher доступен на <a href="${source}" target="_blank" rel="noopener noreferrer">GitHub</a>.` : 'Исходный код находится в закрытом репозитории.',
  DOWNLOAD_BUTTON: config.downloadReady ? `<a class="button primary" href="${download}" aria-label="Скачать AstraLauncher ${escape(config.version)} для Windows x64">Скачать AstraLauncher <span aria-hidden="true">↓</span></a>` : '<span class="button primary" aria-disabled="true">Выпуск готовится к публикации</span>',
};
const substitute = (text, substitutions = values) => text.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => substitutions[key] ?? '');
const inline = text => escape(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => /^(?:https:\/\/[^\s"'<>]+|[A-Za-z][A-Za-z0-9./_-]*)$/.test(href.replaceAll('&amp;','&')) ? `<a href="${href}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>` : label);
function markdown(text, substitutions = values) {
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
  return substitute(parts.join('\n'), substitutions);
}
await fs.mkdir(out, { recursive:true });
if (await fs.stat(path.join(root,'src','assets')).catch(()=>false)) await fs.cp(path.join(root,'src','assets'),path.join(out,'assets'),{recursive:true});
if (await fs.stat(path.join(root,'src','licenses')).catch(()=>false)) await fs.cp(path.join(root,'src','licenses'),path.join(out,'licenses'),{recursive:true});
for (const name of ['style.css','site.js']) await fs.copyFile(path.join(root,'src',name),path.join(out,name));
const privatePreview = process.argv.includes('--private-preview');
const draft = privatePreview || !config.downloadReady || !config.country || !config.contact || !config.license;
const draftNote = privatePreview ? 'Private preview. Public website: https://verskud.github.io/AstraLauncher/.' : 'Draft for review. Some owner details and license information are pending.';
const translations = [
  ['lang="ru"','lang="en"'],['AstraLauncher — место для твоих миров','AstraLauncher — a home for your Minecraft worlds'],
  ['Перейти к содержимому','Skip to content'],['aria-label="Главная навигация"','aria-label="Main navigation"'],['>Возможности</a>','>Features</a>'],['>Вопросы</a>','>FAQ</a>'],['>Скачать <span','>Download <span'],
  ['aria-label="AstraLauncher — главная"','aria-label="AstraLauncher home"'],['Независимый лаунчер для Minecraft Java Edition','Independent launcher for Minecraft: Java Edition'],['Место для<br>твоих <span>миров.</span>','A home for<br>your <span>worlds.</span>'],['Собери моды по своему вкусу. Сохрани любимый мир.<br class="desktop-break"> И просто нажми «Играть».','Build your own mod setup. Keep your favorite worlds safe.<br class="desktop-break"> Then just press Play.'],
  ['Скачать для Windows','Download for Windows'],['Заглянуть внутрь','Take a look inside'],['Бесплатно · Windows x64','Free · Windows x64'],['Неофициальный продукт Minecraft.<br>Не одобрен Mojang или Microsoft и не связан с ними.','An unofficial Minecraft product.<br>Not approved by or affiliated with Mojang or Microsoft.'],['Маленькое пространство.<br>Большие приключения.','A small space.<br>Big adventures.'],['Знакомься, AstraLauncher.','Meet AstraLauncher.'],['Каждая сборка — отдельный мир','Every instance is its own world'],['Главная страница AstraLauncher: выбранная сборка, кнопка «Играть», меню сборок, каталога, аккаунтов и настроек','AstraLauncher home screen with a selected instance, Play button, and navigation'],['Интерфейс лаунчера. Сборка на снимке создана для демонстрации.','Launcher interface. The instance shown is for demonstration.'],
  ['МЕНЬШЕ ВОЗНИ. БОЛЬШЕ ИГРЫ.','LESS SETUP. MORE PLAY.'],['Всё нужное,<br>на своём месте.','Everything you need,<br>right where it belongs.'],['Твои сборки не мешают друг другу.','Keep each instance independent.'],['У каждой свои моды, настройки и миры. Копируй сборку перед экспериментами, переноси её через ZIP и возвращайся к привычной игре.','Each instance has its own mods, settings, and worlds. Copy an instance before experimenting, export it as a ZIP, and return to your usual setup anytime.'],['Следующий любимый мод — рядом.','Find your next favorite mod.'],['Каталог Modrinth доступен прямо в лаунчере. Файлы с CurseForge и других сайтов можно добавить в выбранную сборку несколькими кликами.','Browse Modrinth from the launcher. Add files from CurseForge and other websites to an instance in a few clicks.'],['Твой мир стоит сохранить.','Your worlds are worth protecting.'],['Создавай резервные копии миров и восстанавливай их из лаунчера. Подбери тему, поставь свой шрифт и сделай AstraLauncher удобной для себя.','Back up and restore worlds from the launcher. Choose a theme, use your own font, and make AstraLauncher feel like yours.'],['Резервные копии · Темы · Свои шрифты','Backups · Themes · Custom fonts'],
  ['НАЧНЁМ НОВУЮ ИСТОРИЮ?','READY FOR A NEW ADVENTURE?'],['Твой следующий<br>мир ждёт.','Your next<br>world is waiting.'],['Скачай AstraLauncher, запусти файл и создай свою первую сборку.','Download AstraLauncher, run the file, and create your first instance.'],['Лаунчер бесплатный. Minecraft приобретается отдельно.','The launcher is free. Minecraft is sold separately.'],['Около 100 МБ','About 100 MB'],['Без установки','No installation required'],['Что нового и файлы выпуска','Release notes and files'],['Проверить целостность файла','Verify the file'],['SHA-256 опубликован рядом с файлом в выпуске. Его совпадение подтверждает целостность файла, но само по себе не является проверкой безопасности.','The SHA-256 checksum is published beside the download. A match confirms file integrity, but is not a security audit.'],['Открыть SHA256SUMS.txt','Open SHA256SUMS.txt'],['Перед изменением сборки сохрани важные миры.','Back up important worlds before changing an instance.'],
  ['ПАРА ВАЖНЫХ ДЕТАЛЕЙ','A FEW THINGS TO KNOW'],['Перед первым<br>запуском.','Before your first<br>launch.'],['Что входит в скачивание?','What does the download include?'],['Только лаунчер и необходимые ему компоненты. Игровых файлов, миров и готовых модов в exe нет. При подготовке сборки AstraLauncher получает Minecraft и загрузчик из их источников.','Only the launcher and its required components. The executable does not include game files, worlds, or mods. When setting up an instance, AstraLauncher downloads Minecraft and the selected loader from their respective sources.'],['Можно ли войти через Microsoft?','Can I sign in with Microsoft?'],['Готовый вход Microsoft для пользователей пока в разработке. Доступны локальный профиль и Ely.by. Локальный профиль не подтверждает владение Minecraft и не открывает доступ к серверам, требующим официальную авторизацию.','Microsoft sign-in is not available yet. Local profiles and Ely.by are supported. A local profile does not verify Minecraft ownership or allow access to servers that require official authentication.'],['Как устанавливаются моды с CurseForge?','How do I install CurseForge mods?'],['Скачай ZIP сборки с сайта CurseForge и открой «Мои сборки → Импортировать». Версии Minecraft и загрузчика определяются по manifest.json, файлы загружаются с официального сайта. Недоступный файл можно скачать с его официальной страницы и выбрать во время установки. Также поддерживаются .mrpack, Prism / MultiMC, ASTRA и ZIP игровой папки.','Download a modpack ZIP from CurseForge and choose My instances → Import. Minecraft and loader versions are read from manifest.json, and files are downloaded from the official website. Unavailable files can be downloaded from their official pages and selected during installation. Modrinth .mrpack, Prism / MultiMC, ASTRA, and zipped game folders are also supported.'],['Есть ли версия для macOS или Linux?','Are macOS or Linux versions available?'],['Сейчас публикуется версия для Windows x64. Сборки для macOS и Linux пока недоступны.','A Windows x64 version is currently available. Builds for macOS and Linux are not available yet.'],['Где найти исходники и лицензию?','Where can I find the source code and license?'],['Посмотреть лицензии','View licenses'],['Какие данные отправляются?','What data is sent?'],['У сайта нет аналитики, рекламных трекеров и форм регистрации. Лаунчер хранит настройки и сборки на устройстве; выбранные внешние сервисы получают запросы для загрузки, входа или скинов. Подробности — в','The website has no analytics, ad trackers, or registration forms. The launcher stores settings and instances on your device; selected external services receive requests for downloads, sign-in, or skins. See the'],['политике данных','privacy policy'],
  ['Данные и конфиденциальность','Privacy'],['Условия использования','Terms'],['Лицензии','Licenses'],['Связаться','Contact'],['Неофициальный продукт Minecraft. Не одобрен Mojang или Microsoft и не связан с ними.','Unofficial Minecraft product. Not approved by or affiliated with Mojang or Microsoft.'],['Сделано для тех, кому хочется своего мира.','Made for players who want a world of their own.'],['Ожидает подтверждения','Pending confirmation'],['Файл пока не подписан сертификатом издателя; Windows может показать предупреждение.','The file is not signed with a publisher certificate; Windows may show a warning.'],['Моды · Ресурспаки · Шейдеры','Mods · Resource packs · Shaders'],['Лицензии сторонних компонентов сохраняются отдельно.','Third-party component licenses are listed separately.'],['к политике данных','to the privacy policy']
];
translations.sort((a,b) => b[0].length - a[0].length);
let home = substitute(await fs.readFile(path.join(root,'src','index.html'),'utf8'));
const russianHome = substitute(await fs.readFile(path.join(root,'src','index.html'),'utf8'), russianValues).replace('<body>', '<body><p class="language-banner wrap"><a href="../">English</a> · Русский</p>');
for (const [from,to] of translations) home = home.replaceAll(from,to);
home = home.replace('<meta name="description" content="AstraLauncher — бесплатный независимый лаунчер Minecraft Java Edition для Windows. Сборки, моды, скины и резервные копии миров в одном месте.">','<meta name="description" content="AstraLauncher is a free, independent Minecraft Java Edition launcher for Windows. Manage instances, mods, skins, and world backups in one place.">');
home = home.replaceAll('Около 100 МБ','About 100 MB').replaceAll('Лицензии сторонних компонентов сохраняются отдельно.','Third-party component licenses are listed separately.');
home = home.replace('<body>', '<body>' + (privatePreview ? `<p class="document-date wrap">${draftNote}</p>` : ''));
home = home.replace('<nav aria-label="Main navigation">','<nav aria-label="Main navigation"><a class="language-link" href="ru/">RU</a>');
home = home.replace('<div class="footer-links">','<div class="footer-links"><a href="ru/">RU</a>');
home = home.replace('<meta name="robots" content="noindex,nofollow">\n  <meta name="description"','<meta name="robots" content="noindex,nofollow">\n  <meta name="description"');
home = home.replace('<meta name="description"', `${draft ? '<meta name="robots" content="noindex,nofollow">\n  ' : ''}<meta name="description"`);
await fs.writeFile(path.join(out,'index.html'),home);
const ruRoot = path.join(out,'ru');
await fs.mkdir(ruRoot, { recursive:true });
await fs.cp(path.join(out,'assets'),path.join(ruRoot,'assets'),{recursive:true});
await fs.cp(path.join(out,'licenses'),path.join(ruRoot,'licenses'),{recursive:true});
await fs.copyFile(path.join(out,'style.css'),path.join(ruRoot,'style.css'));
await fs.copyFile(path.join(out,'site.js'),path.join(ruRoot,'site.js'));
await fs.writeFile(path.join(ruRoot,'index.html'),russianHome);
const header = home.slice(home.indexOf('<header'),home.indexOf('</header>')+9).replace(/href="#/g,'href="./#');
const footer = home.slice(home.indexOf('<footer'),home.indexOf('</footer>')+9);
for (const name of ['privacy','terms','licenses']) {
  const text = await fs.readFile(path.join(root,'docs','en',name+'.md'),'utf8');
  const title = text.split(/\r?\n/)[0].slice(2);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#0d0d11">${draft ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escape(title)} — AstraLauncher</title><link rel="icon" href="assets/astra.png"><link rel="stylesheet" href="style.css"></head><body><a class="skip-link" href="#main">Skip to content</a>${header}<main id="main" class="legal-main wrap"><a class="back-link" href="./">← Home</a>${draft ? `<p class="document-date">${draftNote}</p>` : ''}${markdown(text)}</main>${footer}</body></html>`;
  await fs.writeFile(path.join(out,name+'.html'),html);
  const russianHeader = russianHome.slice(russianHome.indexOf('<header'),russianHome.indexOf('</header>')+9).replace(/href="#/g,'href="./#').replace('<nav aria-label="Главная навигация">','<nav aria-label="Главная навигация"><a class="language-link" href="../">EN</a>');
  const russianFooter = russianHome.slice(russianHome.indexOf('<footer'),russianHome.indexOf('</footer>')+9).replace('href="ru/"','href="../"').replace('>Русский</a>','>English</a>');
  const russianText = await fs.readFile(path.join(root,'docs',name+'.md'),'utf8');
  const russianTitle = russianText.split(/\r?\n/)[0].slice(2);
  const russianMarkdown = markdown(russianText, russianValues);
  const russianHtml = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#0d0d11">${draft ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escape(russianTitle)} — AstraLauncher</title><link rel="icon" href="assets/astra.png"><link rel="stylesheet" href="style.css"></head><body><a class="skip-link" href="#main">Перейти к содержимому</a>${russianHeader}<main id="main" class="legal-main wrap"><a class="back-link" href="./">← На главную</a>${draft ? `<p class="document-date">${draftNote}</p>` : ''}${russianMarkdown}</main>${russianFooter}</body></html>`;
  await fs.writeFile(path.join(ruRoot,name+'.html'),russianHtml);
}
const licenseFile = await fs.readFile(path.join(root,'LICENSE'),'utf8').catch(()=>licenseName+'\nЛицензия ещё не выбрана. Это локальный черновик.\n');
await fs.writeFile(path.join(out,'LICENSE.txt'),licenseFile);
await fs.writeFile(path.join(ruRoot,'LICENSE.txt'),licenseFile);
await fs.writeFile(path.join(out,'404.html'),home.replace('<title>AstraLauncher — место для твоих миров</title>','<title>Страница не найдена — AstraLauncher</title>').replace('<h1 id="hero-title">Место для<br>твоих <span>миров.</span></h1>','<h1 id="hero-title">Здесь пока<br>ничего <span>нет.</span></h1>'));
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built static site: ${out} (${config.downloadReady ? 'release enabled' : 'local draft'})`);
