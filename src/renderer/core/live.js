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
const humanError = error => String(error?.message || 'Не удалось выполнить действие.').replace(/^Error invoking remote method '[^']+': (?:\w*Error: )?/, '');

async function refreshIntegrations() {
  try { integrationStatus = await window.astraDesktop.integrationsStatus(); }
  catch { /* the app can still render offline */ }
}

results = () => {};
catalogPage = function () {
  const sourceTabs = `<div class="source-tabs"><button class="${liveSource==='modrinth'?'selected':''}" data-live-source="modrinth">Modrinth</button><button class="${liveSource==='curseforge'?'selected':''}" data-live-source="curseforge">CurseForge${integrationStatus.curseforgeReady?'':' · нужен ключ'}</button></div>`;
  return `<section class="page-intro"><div><div class="eyebrow">ОФИЦИАЛЬНЫЕ КАТАЛОГИ</div><h1>Каталог</h1><p>Настоящие проекты от авторов на Modrinth и CurseForge.</p></div><span class="subtle">${liveSource==='modrinth'?'Modrinth':'CurseForge'} API</span></section>${tabs(catalogTabs,catalogType,'data-catalog-tab')}${sourceTabs}<div class="search-row"><label class="search">${icon('search')}<input id="live-query" type="search" aria-label="Поиск" placeholder="Найти ${liveLabels[catalogType]}…" value="${esc(liveQuery)}"></label><button class="button secondary" data-live-refresh>Обновить</button></div><div id="live-status" class="live-status">Загружаем каталог…</div><div id="live-results" class="mod-grid"></div><div id="live-more"></div><div class="catalog-note">Выбери сборку в карточке проекта, чтобы установить файл в неё.</div>`;
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

accountsPage = function () {
  return `<section class="page-intro"><div><div class="eyebrow">ТВОЁ ИМЯ В ЭТОМ МИРЕ</div><h1>Аккаунты</h1><p>Выбери способ запуска Minecraft.</p></div></section><div class="accounts-grid"><article class="account-card"><span class="profile-portrait">${esc(state.profile[0]?.toUpperCase()||'A')}</span><h2>${esc(state.profile)}</h2><p>Локальный профиль</p><span class="profile-caption">Одиночная игра и серверы, разрешающие локальный вход.</span><button class="button secondary full" data-action="account">Изменить имя</button><button class="button light full" data-live-account-mode="local">${state.accountMode==='microsoft'?'Выбрать':'Выбран'}</button></article><article class="account-card microsoft-card"><span class="microsoft-symbol"><i></i><i></i><i></i><i></i></span><h2>${esc(integrationStatus.microsoftAccount || 'Microsoft')}</h2><p>${integrationStatus.microsoftAccount?'Профиль Minecraft проверен':'Личный аккаунт Microsoft'}</p><span class="profile-caption">${integrationStatus.microsoftAccount?'Подходит для официальных серверов.':'Вход через официальный сайт Microsoft в браузере.'}</span><button class="button light full" data-live-microsoft>${integrationStatus.microsoftAccount?'Переподключить':'+ Подключить аккаунт'}</button>${integrationStatus.microsoftAccount?`<button class="button secondary full" data-live-account-mode="microsoft">${state.accountMode==='microsoft'?'Выбран':'Выбрать для игры'}</button><button class="text-button disconnect" data-live-disconnect>Отключить аккаунт</button>`:''}</article></div>`;
};

downloadsPage = function () {
  const records = Array.isArray(state.downloads) ? state.downloads : [];
  return `<section class="page-intro"><div><div class="eyebrow">ТВОИ ФАЙЛЫ</div><h1>Загрузки</h1><p>Скачанные файлы из Modrinth и CurseForge.</p></div></section>${records.length?`<div class="mod-list">${records.map((r,i)=>`<div class="mod-list-item"><span class="mod-icon" style="--mod-color:#705587">${esc((r.name||'?')[0])}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.source)} · ${esc(r.version)} · ${esc(r.filename)}</small></div><button class="button secondary" data-live-show-file="${i}">Показать файл</button></div>`).join('')}</div>`:`<div class="designed-empty"><span class="empty-symbol">${icon('down')}</span><h2>Пока пусто</h2><p>Найди мод, шейдер или сборку в каталоге и скачай файл.</p><button class="button light" data-page="mods">Открыть каталог ${icon('arrow')}</button></div>`}<div class="quiet-note">${icon('info')} Без выбранной сборки файлы попадают в Загрузки/AstraLauncher. С выбранной сборкой — в её игровую папку.</div>`;
};

function projectModal(index) {
  const item = liveItems[index];
  if (!item) return;
  if (item.kind === 'modpacks') {
    const supported = item.source === 'modrinth';
    showModal(`<span class="modal-mark">${icon('cube')}</span><span class="eyebrow">${esc(item.source.toUpperCase())} · сборка</span><h2 class="project-name">${esc(item.name)}</h2><p class="project-description">${esc(item.description)}</p><div class="detail-tags"><span>Автор: ${esc(item.author||'—')}</span><span>${Number(item.downloads||0).toLocaleString('ru-RU')} загрузок</span></div><div class="info-box">${supported?'Astra создаст отдельную сборку в своей библиотеке, скачает моды и настройки из .mrpack. При первом запуске дополнительно установятся Minecraft и загрузчик.':'Импорт сборок CurseForge добавим позже. Сейчас устанавливаются сборки Modrinth и локальные .mrpack.'}</div>${supported?`<button class="button light full" data-modpack-catalog="${index}">Установить сборку ${icon('down')}</button>`:''}<button class="button secondary full" data-live-open="${index}">Страница проекта ${icon('arrow')}</button>`);
    return;
  }
  const choices = item.kind === 'modpacks' ? [] : state.packs.filter(p => item.kind !== 'mods' || p.loader !== 'Vanilla' && loaderAvailable(p.version,p.loader));
  const preferred = catalogTargetPackId ? choices.find(p => p.id === catalogTargetPackId) : choices[0];
  const target = state.packs.find(p => p.id === catalogTargetPackId);
  const invalidTarget = item.kind !== 'modpacks' && target && !choices.includes(target);
  const targetWarning = invalidTarget ? `${esc(target.name)} не подходит для этого мода. Открой параметры сборки и выбери совместимый загрузчик. ` : '';
  const profiles = choices.map(p => `<option value="${esc(p.id)}" ${p.id===preferred?.id?'selected':''}>${esc(p.name)} · ${esc(p.version)} · ${esc(p.loader)}</option>`).join('');
  showModal(`<span class="modal-mark">${icon('cube')}</span><span class="eyebrow">${esc(item.source.toUpperCase())} · ${esc(liveLabels[item.kind])}</span><h2 class="project-name">${esc(item.name)}</h2><p class="project-description">${esc(item.description)}</p><div class="detail-tags"><span>Автор: ${esc(item.author||'—')}</span><span>${Number(item.downloads||0).toLocaleString('ru-RU')} загрузок</span></div><form id="live-download-form" data-index="${index}"><label>Куда сохранить<select name="profile" required>${invalidTarget?'<option value="" selected disabled>Выбери совместимую сборку или Загрузки</option>':''}${profiles}<option value="downloads" ${!preferred&&!invalidTarget?'selected':''}>В Загрузки/AstraLauncher (без установки)</option></select></label><button class="button light full">Скачать / установить ${icon('down')}</button></form><button class="button secondary full" data-live-open="${index}">Страница проекта ${icon('arrow')}</button><div class="info-box">${targetWarning}${preferred?'Выбрана сборка: '+esc(preferred.name)+'. Файл будет установлен в её игровую папку.':'Создай совместимую сборку, чтобы установить файл сразу в игру.'} Для шейдеров понадобится совместимый мод, например Iris или Oculus.</div>`);
}

let modpackPending = false;
function modpackCancelPrompt() {
  showModal('<h2>Отменить установку?</h2><p>Все файлы этой незавершённой сборки будут удалены.</p><button class="button destructive full" data-modpack-confirm-cancel>Отменить и удалить файлы</button>');
}
function modpackProgressView(progress) {
  if (!modpackPending) return;
  const status = $('#modpack-status');
  if (!status) return;
  const total = Math.max(0, Number(progress.total || 0));
  const done = Math.max(0, Number(progress.completed || 0));
  const received = Math.max(0, Number(progress.receivedBytes || 0));
  const bytesTotal = Math.max(0, Number(progress.totalBytes || 0));
  const mb = bytes => `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  const transfer = progress.receivedBytes !== undefined ? `${mb(received)}${bytesTotal ? ' / ' + mb(bytesTotal) : ''}${progress.bytesPerSecond ? ' · ' + mb(progress.bytesPerSecond) + '/с' : ''}` : '';
  status.textContent = [total ? `${done} из ${total} файлов` : '', transfer, progress.message || 'Устанавливаем…'].filter(Boolean).join(' · ');
  const bar = $('#modpack-progress-bar');
  if (bar) bar.style.width = `${progress.phase === 'archive' && bytesTotal ? Math.min(100, Math.round(received / bytesTotal * 100)) : total ? Math.round(done / total * 100) : 0}%`;
}
window.astraDesktop.onModpackProgress(modpackProgressView);
async function installModpack(run) {
  if (modpackPending) return;
  modpackPending = true;
  showModal(`<h2>Установка сборки</h2><p id="modpack-status">Готовим загрузку…</p><div class="progress-track"><span id="modpack-progress-bar" style="width:0%"></span></div><p class="quiet-note">Файлы проверяются перед добавлением в библиотеку. При ошибке неполная сборка удаляется.</p><button class="button secondary full" data-modpack-cancel>Отменить установку</button>`);
  $('#modal .modal-close')?.remove();
  try {
    const result = await run();
    if (!result) { modal.close(); return; }
    const profile = result.profile;
    if (!state.packs.some(item => item.id === profile.id)) state.packs.push(profile);
    save();
    await refreshInstalled(profile.id);
    selectedPack = profile.id;
    packTab = 'mods';
    modal.close();
    go('pack');
    toast(`Сборка «${profile.name}» установлена: ${result.files} файлов и ${result.overrides} настроек`);
  } catch (error) {
    showModal(`<h2>Не удалось установить сборку</h2><p>${esc(humanError(error))}</p><div class="info-box">Неполная сборка удалена. Повтори попытку или выбери другой файл.</div><button class="button light full" data-action="close">Закрыть</button>`);
  } finally { modpackPending = false; }
}
modal.addEventListener('cancel', event => { if (modpackPending) { event.preventDefault(); modpackCancelPrompt(); } });
modal.addEventListener('click', event => { if (modpackPending && event.target === modal) { event.preventDefault(); event.stopImmediatePropagation(); modpackCancelPrompt(); } }, true);
window.astraDesktop.recoverModpacks().then(profiles => {
  let added = false;
  for (const profile of profiles) if (!state.packs.some(item => item.id === profile.id)) { state.packs.push(profile); added = true; }
  if (added) { save(); render(); }
}).catch(() => {});

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
  if (data.openInstanceFolder !== undefined) window.astraDesktop.openInstanceFolder(data.openInstanceFolder).catch(error => toast(humanError(error)));
  if (data.modpackCatalog !== undefined) {
    const item = liveItems[Number(data.modpackCatalog)];
    if (item?.source === 'modrinth' && item.kind === 'modpacks') installModpack(() => window.astraDesktop.installCatalogModpack({ source: 'modrinth', id: item.id }));
  }
  if (data.modpackLocal !== undefined) installModpack(() => window.astraDesktop.importLocalModpack());
  if (data.modpackCancel !== undefined) modpackCancelPrompt();
  if (data.modpackConfirmCancel !== undefined) window.astraDesktop.cancelModpackInstall().catch(error => toast(humanError(error)));
  if (data.liveConfig) configModal(data.liveConfig);
  if (data.liveMicrosoft !== undefined) startMicrosoft();
  if (data.liveAccountMode) { state.accountMode=data.liveAccountMode; save(); render(); toast(data.liveAccountMode==='microsoft'?'Выбран Microsoft для запуска':'Выбран локальный запуск'); }
  if (data.liveAuthOpen !== undefined) window.astraDesktop.microsoftOpen().catch(error => toast(humanError(error)));
  if (data.liveClearKey !== undefined) { await window.astraDesktop.saveCurseForgeKey(''); await refreshIntegrations(); modal.close(); render(); toast('Ключ удалён'); }
  if (data.liveDisconnect !== undefined) { await window.astraDesktop.microsoftDisconnect(); state.accountMode='local'; save(); await refreshIntegrations(); render(); toast('Аккаунт отключён'); }
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
    const selectedDestination = String(new FormData(event.target).get('profile') || '');
    const profileId = selectedDestination === 'downloads' ? '' : selectedDestination;
    const profile = state.packs.find(pack => pack.id === profileId);
    const button = event.target.querySelector('button');
    button.disabled = true; button.textContent = 'Скачиваем…';
    try {
      const result = await window.astraDesktop.downloadProject({ source: item.source, kind: item.kind, id: item.id, gameVersion: profile?.version || '', loader: profile && profile.loader !== 'Vanilla' ? profile.loader.toLowerCase() : '', profileId: profile?.id || '' });
      rememberDownloads([{ ...result, name: item.name, source: item.source }, ...(result.installedDependencies||[])]);
      modal.close(); toast(`${profile?'Установлено в сборку':'Скачано'}: ${result.filename}`);
      if (profile) { await refreshInstalled(profile.id); selectedPack=profile.id; packTab=item.kind; go('pack'); }
      if (result.missingDependencies?.length) showModal(`<h2>Мод установлен не полностью</h2><p>Не удалось загрузить обязательные зависимости.</p><div class="info-box">${esc(result.missingDependencies.join('; '))}</div><button class="button light full" data-live-open="${index}">Проверить на Modrinth ${icon('arrow')}</button>`);
      else if (result.dependencies && item.source === 'curseforge') showModal(`<h2>Проверь зависимости</h2><p>Файл установлен, но у него ${result.dependencies} обязательных зависимостей CurseForge. Их нужно добавить отдельно.</p><button class="button light full" data-live-open="${index}">Страница проекта ${icon('arrow')}</button>`);
      else if (profile && item.source === 'modrinth' && item.kind === 'resources' && item.id === '50dA9Sha') showModal(`<h2>Fresh Animations установлен</h2><p>Для анимаций нужны EMF и ETF. Включи сам ресурспак в настройках Minecraft.</p><button class="button light full" data-install-fresh-support="${esc(profile.id)}">Установить EMF и ETF</button>`);
    } catch (error) { toast(humanError(error)); button.disabled = false; button.innerHTML = `Скачать / установить ${icon('down')}`; }
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
