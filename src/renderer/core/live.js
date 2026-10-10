// Official catalogs run through the main process; no API keys reach this page.
let liveSource = 'modrinth';
let liveQuery = '';
let liveOffset = 0;
let liveTotal = 0;
let liveItems = [];
let liveSerial = 0;
let integrationStatus = { curseforgeReady: false, microsoftClientId: '', microsoftAccount: '' };
let authTimer = null;
const liveLabels = { mods: 'моды', modpacks: 'сборки', shaders: 'шейдеры', resources: 'ресурспаки' };
const humanError = error => String(error?.message || 'Не удалось выполнить действие.').replace(/^Error invoking remote method '[^']+': Error: /, '');

async function refreshIntegrations() {
  try { integrationStatus = await window.astraDesktop.integrationsStatus(); }
  catch { /* the app can still render offline */ }
}

results = () => {};
catalogPage = function () {
  const sourceTabs = `<div class="source-tabs"><button class="${liveSource==='modrinth'?'selected':''}" data-live-source="modrinth">Modrinth</button><button class="${liveSource==='curseforge'?'selected':''}" data-live-source="curseforge">CurseForge${integrationStatus.curseforgeReady?'':' · нужен ключ'}</button></div>`;
  return `<section class="page-intro"><div><div class="eyebrow">ОФИЦИАЛЬНЫЕ КАТАЛОГИ</div><h1>Каталог</h1><p>Настоящие проекты от авторов на Modrinth и CurseForge.</p></div><span class="subtle">${liveSource==='modrinth'?'Modrinth':'CurseForge'} API</span></section>${tabs(catalogTabs,catalogType,'data-catalog-tab')}${sourceTabs}<div class="search-row"><label class="search">${icon('search')}<input id="live-query" type="search" aria-label="Поиск" placeholder="Найти ${liveLabels[catalogType]}…" value="${esc(liveQuery)}"></label><button class="button secondary" data-live-refresh>Обновить</button></div><div id="live-status" class="live-status">Загружаем каталог…</div><div id="live-results" class="mod-grid"></div><div id="live-more"></div><div class="catalog-note">Карточки и статистика приходят из выбранного источника. Для установки игровых файлов понадобится этап загрузки и запуска Minecraft.</div>`;
};

function safeIcon(item) {
  try {
    const url = new URL(item.icon);
    if (url.protocol === 'https:' && (url.hostname === 'cdn.modrinth.com' || url.hostname === 'media.forgecdn.net' || url.hostname === 'edge.forgecdn.net')) return url.href;
  } catch {}
  return '';
}
function liveCard(item, index) {
  const src = safeIcon(item);
  const number = Number(item.downloads || 0).toLocaleString('ru-RU');
  return `<article class="mod-card live-card"><div class="mod-card-top">${src?`<img class="live-icon" src="${esc(src)}" alt="" loading="lazy">`:`<span class="mod-icon" style="--mod-color:#745c90">${esc((item.name||'?')[0])}</span>`}<span class="category-label">${esc(liveLabels[item.kind])}</span></div><h3 class="mod-title">${esc(item.name)}</h3><span class="author">от ${esc(item.author||'автора проекта')}</span><p>${esc(item.description||'Описание на странице проекта')}</p><div class="mod-card-footer"><span>${icon('down')} ${number}</span><button class="add-button" data-live-detail="${index}" aria-label="Открыть сведения о ${esc(item.name)}">${icon('arrow')}</button></div></article>`;
}
async function searchLive(append = false) {
  const container = $('#live-results');
  if (!container) return;
  const serial = ++liveSerial;
  if (!append) { liveOffset = 0; liveItems = []; container.innerHTML = ''; }
  $('#live-status').textContent = `Загружаем ${liveLabels[catalogType]}…`;
  $('#live-more').innerHTML = '';
  try {
    const response = await window.astraDesktop.catalogSearch({ source: liveSource, kind: catalogType, query: liveQuery, offset: liveOffset });
    if (serial !== liveSerial || page !== 'mods') return;
    liveTotal = response.total;
    liveItems.push(...response.items);
    liveOffset += response.items.length;
    container.innerHTML = liveItems.map(liveCard).join('');
    $('#live-status').textContent = response.items.length ? `${liveItems.length.toLocaleString('ru-RU')} из ${Number(liveTotal).toLocaleString('ru-RU')} · ${liveSource==='modrinth'?'Modrinth':'CurseForge'}` : 'Проектов не нашлось. Попробуй другой запрос.';
    if (liveOffset < liveTotal && response.items.length) $('#live-more').innerHTML = `<button class="button secondary live-more" data-live-more>Показать ещё ${icon('arrow')}</button>`;
  } catch (error) {
    if (serial !== liveSerial || page !== 'mods') return;
    $('#live-status').innerHTML = `${esc(humanError(error))} <button class="text-button" data-live-refresh>Повторить</button>`;
  }
}

const originalRender = render;
render = function () {
  originalRender();
  if (page === 'mods') searchLive();
};

const originalDiscover = discover;
discover = function () {
  const html = originalDiscover()
    .replace('data-action="starter"', 'data-page="mods"')
    .replace('Открыть Astra Essentials', 'Открыть каталог')
    .replace('<span>3 мода · оптимизация и графика</span>', '<span>Реальные проекты Modrinth</span>')
    .replace('ASTRA COLLECTION / 001', 'MODRINTH CATALOG');
  const mark = '<div class="mod-grid">';
  return html.slice(0, html.lastIndexOf(mark)) + `<div class="designed-empty compact-discover"><span class="empty-symbol">${icon('cube')}</span><h2>Живой каталог модов</h2><p>Моды, шейдеры и сборки из официальных каталогов обновляются прямо в приложении.</p><button class="button light" data-page="mods">Исследовать ${icon('arrow')}</button></div>`;
};

const originalSettingsPage = settingsPage;
settingsPage = function () {
  const html = originalSettingsPage().replace('Desktop preview · 0.3.0', 'Desktop preview · 0.4.0');
  if (settingsTab !== 'general') return html;
  return html.replace('</div>', '</div>') + `<div class="settings-panel integrations-panel"><h2>Подключения</h2>${settingRow('CurseForge API', integrationStatus.curseforgeReady?'Ключ сохранён в системном защищённом хранилище.':'Для каталога CurseForge нужен API ключ.',`<button class="button secondary" data-live-config="curseforge">${integrationStatus.curseforgeReady?'Изменить ключ':'Добавить ключ'}</button>`)}${settingRow('Microsoft Client ID', integrationStatus.microsoftClientId?esc(integrationStatus.microsoftClientId):'Зарегистрируй своё приложение Microsoft для входа.',`<button class="button secondary" data-live-config="microsoft">${integrationStatus.microsoftClientId?'Изменить ID':'Добавить ID'}</button>`)}<div class="quiet-note">${icon('info')} Ключ и токен Microsoft сохраняются зашифрованными средствами Windows. Вход Microsoft сам по себе ещё не проверяет право на Minecraft и не запускает игру.</div></div>`;
};

accountsPage = function () {
  return `<section class="page-intro"><div><div class="eyebrow">ТВОЁ ИМЯ В ЭТОМ МИРЕ</div><h1>Аккаунты</h1><p>Управляй локальным профилем и входом Microsoft.</p></div></section><div class="accounts-grid"><article class="account-card"><span class="profile-portrait">${esc(state.profile[0]?.toUpperCase()||'A')}</span><h2>${esc(state.profile)}</h2><p>Локальный профиль</p><span class="profile-caption">Сохранён на этом устройстве</span><button class="button secondary full" data-action="account">Изменить имя</button></article><article class="account-card microsoft-card"><span class="microsoft-symbol"><i></i><i></i><i></i><i></i></span><h2>${esc(integrationStatus.microsoftAccount || 'Microsoft')}</h2><p>${integrationStatus.microsoftAccount?'Аккаунт подключён':'Личный аккаунт Microsoft'}</p><span class="profile-caption">${integrationStatus.microsoftAccount?'Вход выполнен. Проверка Minecraft и запуск пока в разработке.':'Вход через официальный сайт Microsoft в браузере.'}</span><button class="button light full" data-live-microsoft>${integrationStatus.microsoftAccount?'Переподключить':'+ Подключить аккаунт'}</button>${integrationStatus.microsoftAccount?'<button class="text-button disconnect" data-live-disconnect>Отключить аккаунт</button>':''}</article></div><div class="quiet-note">${icon('info')} Игра на официальных серверах появится после проверки владения Minecraft и подключения игрового запуска.</div>`;
};

downloadsPage = function () {
  const records = Array.isArray(state.downloads) ? state.downloads : [];
  return `<section class="page-intro"><div><div class="eyebrow">ТВОИ ФАЙЛЫ</div><h1>Загрузки</h1><p>Скачанные файлы из Modrinth и CurseForge.</p></div></section>${records.length?`<div class="mod-list">${records.map((r,i)=>`<div class="mod-list-item"><span class="mod-icon" style="--mod-color:#705587">${esc((r.name||'?')[0])}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.source)} · ${esc(r.version)} · ${esc(r.filename)}</small></div><button class="button secondary" data-live-show-file="${i}">Показать файл</button></div>`).join('')}</div>`:`<div class="designed-empty"><span class="empty-symbol">${icon('down')}</span><h2>Пока пусто</h2><p>Найди мод, шейдер или сборку в каталоге и скачай файл.</p><button class="button light" data-page="mods">Открыть каталог ${icon('arrow')}</button></div>`}<div class="quiet-note">${icon('info')} Файлы сохраняются в системной папке загрузок. Установка в Minecraft и автоматическая загрузка зависимостей появятся позже.</div>`;
};

function projectModal(index) {
  const item = liveItems[index];
  if (!item) return;
  const profiles = state.packs.map(p => `<option value="${esc(p.version)}|${esc(p.loader.toLowerCase())}">${esc(p.name)} · ${esc(p.version)} · ${esc(p.loader)}</option>`).join('');
  showModal(`<span class="modal-mark">${icon('cube')}</span><span class="eyebrow">${esc(item.source.toUpperCase())} · ${esc(liveLabels[item.kind])}</span><h2>${esc(item.name)}</h2><p>${esc(item.description)}</p><div class="detail-tags"><span>Автор: ${esc(item.author||'—')}</span><span>${Number(item.downloads||0).toLocaleString('ru-RU')} загрузок</span></div><form id="live-download-form" data-index="${index}"><label>Версия файла<select name="profile"><option value="">Последний доступный релиз</option>${profiles}</select></label><button class="button light full">Скачать файл ${icon('down')}</button></form><button class="button secondary full" data-live-open="${index}">Страница проекта ${icon('arrow')}</button><div class="info-box">Файл сохранится в папке Загрузки/AstraLauncher. Для модов с зависимостями проверь страницу проекта: автоматическая установка зависимостей пока не подключена.</div>`);
}

function configModal(kind) {
  if (kind === 'curseforge') showModal(`<h2>CurseForge API</h2><p>Укажи ключ приложения CurseForge. Он сохранится зашифрованным локально и не попадёт в интерфейс.</p><form id="curseforge-form"><label>API ключ<input name="key" type="password" autocomplete="off" placeholder="Вставь ключ" ${integrationStatus.curseforgeReady?'':'required'}></label><button class="button light full">Сохранить</button></form>${integrationStatus.curseforgeReady?'<button class="text-button" data-live-clear-key>Удалить ключ</button>':''}`);
  else showModal(`<h2>Приложение Microsoft</h2><p>Укажи Application (client) ID своего приложения, зарегистрированного для личных аккаунтов Microsoft и публичного клиента.</p><form id="microsoft-id-form"><label>Client ID<input name="id" value="${esc(integrationStatus.microsoftClientId)}" autocomplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required></label><button class="button light full">Сохранить</button></form><div class="info-box">Понадобится разрешить public client flows в регистрации приложения.</div>`);
}

async function startMicrosoft() {
  if (!integrationStatus.microsoftClientId) { configModal('microsoft'); return; }
  try {
    const device = await window.astraDesktop.microsoftStart();
    showModal(`<span class="microsoft-symbol"><i></i><i></i><i></i><i></i></span><h2>Войти через Microsoft</h2><p>Открой страницу Microsoft и введи код:</p><div class="device-code">${esc(device.userCode)}</div><button class="button light full" data-live-auth-open>Открыть Microsoft в браузере ${icon('arrow')}</button><div id="auth-status" class="info-box">Ждём подтверждения входа…</div>`);
    clearInterval(authTimer);
    authTimer = setInterval(async () => {
      if (!modal.open) { clearInterval(authTimer); window.astraDesktop.microsoftCancel(); return; }
      try {
        const result = await window.astraDesktop.microsoftPoll();
        if (result.state === 'pending') return;
        clearInterval(authTimer);
        if (result.state === 'connected') { await refreshIntegrations(); modal.close(); render(); toast(`Подключён аккаунт ${result.account}`); }
        else $('#auth-status').textContent = result.message || 'Время ожидания истекло. Начни вход ещё раз.';
      } catch (error) { clearInterval(authTimer); $('#auth-status').textContent = error.message; }
    }, 5000);
  } catch (error) { toast(humanError(error)); }
}

document.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  const data = button.dataset;
  if (data.liveSource) { liveSource = data.liveSource; render(); }
  if (data.liveRefresh !== undefined) searchLive();
  if (data.liveMore !== undefined) searchLive(true);
  if (data.liveDetail !== undefined) projectModal(Number(data.liveDetail));
  if (data.liveConfig) configModal(data.liveConfig);
  if (data.liveMicrosoft !== undefined) startMicrosoft();
  if (data.liveAuthOpen !== undefined) window.astraDesktop.microsoftOpen().catch(error => toast(humanError(error)));
  if (data.liveClearKey !== undefined) { await window.astraDesktop.saveCurseForgeKey(''); await refreshIntegrations(); modal.close(); render(); toast('Ключ удалён'); }
  if (data.liveDisconnect !== undefined) { await window.astraDesktop.microsoftDisconnect(); await refreshIntegrations(); render(); toast('Аккаунт отключён'); }
  if (data.liveOpen !== undefined) {
    const item = liveItems[Number(data.liveOpen)];
    if (item?.url) window.astraDesktop.openProject(item.url).catch(error => toast(humanError(error)));
  }
  if (data.liveShowFile !== undefined) {
    const record = state.downloads?.[Number(data.liveShowFile)];
    if (record) window.astraDesktop.showDownloadedFile(record.path).catch(error => toast(humanError(error)));
  }
  if (data.liveOpenFolder !== undefined) window.astraDesktop.openDownloadsFolder().catch(error => toast(humanError(error)));
  if (data.liveForget !== undefined) {
    const index = Number(data.liveForget);
    if (!Number.isInteger(index) || index < 0 || index >= (state.downloads?.length || 0)) return;
    state.downloads.splice(index, 1);
    save(); render();
    toast((downloadActions[currentLanguage()] || downloadActions.ru)[2]);
  }
});

let liveDebounce;
document.addEventListener('input', event => {
  if (event.target.id !== 'live-query') return;
  liveQuery = event.target.value;
  clearTimeout(liveDebounce);
  liveDebounce = setTimeout(() => searchLive(), 350);
});
document.addEventListener('submit', async event => {
  if (event.target.id === 'live-download-form') {
    event.preventDefault();
    const index = Number(event.target.dataset.index);
    const item = liveItems[index];
    if (!item) return;
    const [gameVersion, loader] = String(new FormData(event.target).get('profile') || '').split('|');
    const button = event.target.querySelector('button');
    button.disabled = true; button.textContent = 'Скачиваем…';
    try {
      const result = await window.astraDesktop.downloadProject({ source: item.source, kind: item.kind, id: item.id, gameVersion: gameVersion || '', loader: loader || '' });
      state.downloads = [{ ...result, name: item.name, source: item.source }, ...(state.downloads || [])].slice(0, 100);
      save(); modal.close(); toast(`Скачано: ${result.filename}`);
      if (result.dependencies) showModal(`<h2>Файл скачан</h2><p>${esc(item.name)} сохранён в Загрузки/AstraLauncher.</p><div class="info-box">У этой версии ${result.dependencies} обязательных зависимостей. Перед игрой скачай их со страницы проекта.</div><button class="button light full" data-live-open="${index}">Страница проекта ${icon('arrow')}</button>`);
    } catch (error) { toast(humanError(error)); button.disabled = false; button.innerHTML = `Скачать файл ${icon('down')}`; }
    return;
  }
  if (!['curseforge-form','microsoft-id-form'].includes(event.target.id)) return;
  event.preventDefault();
  const data = new FormData(event.target);
  try {
    if (event.target.id === 'curseforge-form') await window.astraDesktop.saveCurseForgeKey(data.get('key'));
    else await window.astraDesktop.saveMicrosoftClientId(data.get('id'));
    await refreshIntegrations(); modal.close(); render(); toast('Настройка сохранена');
  } catch (error) { toast(humanError(error)); }
});
refreshIntegrations().then(() => render());
