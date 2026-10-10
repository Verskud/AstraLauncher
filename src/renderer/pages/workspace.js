// Design preview: local profiles and UI interactions only. No game downloads or authentication.
let catalogType = 'mods';
let packTab = 'mods';
let settingsTab = 'general';
let collectionQuery = '';
let downloadExample = null;
let catalogTargetPackId = null;

const catalogTabs = [['mods','Моды'],['modpacks','Сборки'],['shaders','Шейдеры'],['resources','Ресурспаки']];
const collections = {
  modpacks: [
    {id:'essentials',name:'Astra Essentials',by:'Astra Collection',description:'Чистый Minecraft с приятным светом и оптимизацией. Начни своё приключение с малого.',art:'forest',tag:'Лёгкая и быстрая',mods:['sodium','iris','lithium'],loader:'Fabric',version:'1.21.1'},
    {id:'create-studio',name:'Create Workshop',by:'Astra Collection',description:'Место для изобретений. Механизмы, фабрики и идеи, которые оживают.',art:'desert',tag:'Для изобретателей',mods:['create','jei','journeymap'],loader:'Forge',version:'1.20.1'},
    {id:'horizons',name:'Beyond the Horizon',by:'Astra Collection',description:'Красивые дальние пейзажи и спокойные путешествия в своём ритме.',art:'night',tag:'Для исследователей',mods:['sodium','iris','distant'],loader:'Fabric',version:'1.21.1'}
  ],
  shaders: [
    {id:'soft-light',name:'Soft Light',by:'Концепт Astra',description:'Мягкий дневной свет, спокойные цвета и тёплые вечера.',art:'forest',tag:'Мягкий свет',loader:'Fabric',version:'1.21.1'},
    {id:'golden-hour',name:'Golden Hour',by:'Концепт Astra',description:'Золотые закаты и солнечная палитра для любимого мира.',art:'desert',tag:'Тёплая палитра',loader:'Fabric',version:'1.21.1'},
    {id:'moonlight',name:'Moonlight',by:'Концепт Astra',description:'Глубокие сумерки и мягкие оттенки ночного неба.',art:'night',tag:'Атмосфера ночи',loader:'Fabric',version:'1.21.1'}
  ],
  resources: [
    {id:'natural',name:'Natural Details',by:'Концепт Astra',description:'Небольшие детали, которые делают знакомый мир уютнее.',art:'forest',tag:'16× · природа',loader:'Fabric',version:'1.21.1'},
    {id:'minimal',name:'Simply Blocks',by:'Концепт Astra',description:'Чёткие формы и минимум визуального шума.',art:'desert',tag:'16× · минимализм',loader:'Fabric',version:'1.21.1'},
    {id:'midnight',name:'Midnight UI',by:'Концепт Astra',description:'Тёмные игровые меню для вечерних путешествий.',art:'night',tag:'Интерфейс',loader:'Fabric',version:'1.21.1'}
  ]
};

function tabs(items, active, attribute) {
  return `<div class="section-tabs" role="tablist">${items.map(([id,name])=>`<button role="tab" aria-selected="${active===id}" class="${active===id?'selected':''}" ${attribute}="${id}">${name}</button>`).join('')}</div>`;
}

function renderNavigation() {
  const nav = [
    ['discover','compass','Открывай'],['library','grid','Мои сборки'],['mods','cube','Каталог'],
    ['downloads','down','Загрузки'],['accounts','user','Аккаунты'],['settings','settings','Настройки']
  ];
  $('#navigation').innerHTML=nav.map(([id,symbol,title])=>`<button class="nav-item ${page===id || (id==='library' && page==='pack')?'active':''}" data-page="${id}" aria-label="${title}" title="${title}">${icon(symbol)}<span>${title}</span>${id==='library'?`<span class="count">${state.packs.length}</span>`:''}</button>`).join('');
  $('#side-packs').innerHTML=state.packs.slice(0,4).map(p=>`<button class="side-pack ${selectedPack===p.id&&page==='pack'?'selected':''}" data-pack="${esc(p.id)}"><span class="pack-mini ${p.art}">${icon('cube')}</span><span>${esc(p.name)}</span></button>`).join('');
  $('#profile-label').innerHTML=`${esc(state.profile)}<small>Локальный профиль</small>`;
  $('.avatar').textContent=state.profile[0]?.toUpperCase()||'A';
  $('#current-page').textContent=({discover:'Открывай',library:'Мои сборки',mods:'Каталог',settings:'Настройки',pack:'Сборка',downloads:'Загрузки',accounts:'Аккаунты'})[page]||'Открывай';
  $('#notification-button').innerHTML=icon('bell');
  $('#settings-button').innerHTML=icon('settings');
}

function catalogPage() {
  const navigation = tabs(catalogTabs,catalogType,'data-catalog-tab');
  if(catalogType==='mods')return catalog().replace('Каталог модов</h1>','Каталог</h1>').replace('<div class="search-row">',navigation+'<div class="search-row">');
  const label=catalogTabs.find(t=>t[0]===catalogType)[1];
  return `<section class="page-intro"><div><div class="eyebrow">СОЗДАЙ СВОЁ НАСТРОЕНИЕ</div><h1>Каталог</h1><p>Найди то, что сделает этот мир твоим.</p></div><span class="subtle">Коллекция Astra</span></section>${navigation}
    <label class="search collection-search">${icon('search')}<input id="collection-search" aria-label="Поиск в коллекции" placeholder="Найти ${label.toLowerCase()}…" value="${esc(collectionQuery)}"></label>
    <div class="section-heading"><div><h2>${label}, с которых хочется начать</h2><p>Небольшая коллекция для первого знакомства.</p></div><span class="subtle">3 концепта</span></div>
    <div class="collection-grid" id="collection-results">${collectionCards()}</div>
    <div class="catalog-note">Демонстрационные коллекции для оценки дизайна. Игровые файлы не скачиваются.</div>`;
}

function collectionCards() {
  const items=collections[catalogType].filter(item=>`${item.name} ${item.description}`.toLowerCase().includes(collectionQuery.toLowerCase()));
  return items.map(item=>`<article class="collection-card"><button class="collection-art ${item.art}" data-collection="${item.id}" data-kind="${catalogType}" aria-label="Открыть ${item.name}">${art(item.art,'collection-'+item.id)}<span class="pill">${item.tag}</span><span class="collection-art-label">${catalogType==='modpacks'?'ASTRA COLLECTION':catalogType==='shaders'?'LIGHT & ATMOSPHERE':'A DIFFERENT TOUCH'}</span></button><div class="collection-body"><small>${item.by}</small><button class="pack-title" data-collection="${item.id}" data-kind="${catalogType}">${item.name}</button><p>${item.description}</p><div class="collection-bottom"><span>${item.version}${catalogType==='modpacks'?' · '+item.loader:''}</span><button class="round-button" data-collection="${item.id}" data-kind="${catalogType}" aria-label="Подробнее о ${item.name}">${icon('arrow')}</button></div></div></article>`).join('')||'<div class="empty">Ничего не нашлось.<br><small>Попробуй другое название.</small></div>';
}

function collectionModal(kind,id) {
  const item=collections[kind]?.find(item=>item.id===id);
  if(!item)return;
  showModal(`<div class="modal-cover ${item.art}">${art(item.art,'modal-art')}</div><span class="eyebrow">${item.by}</span><h2>${item.name}</h2><p>${item.description}</p><div class="detail-tags"><span>${item.version}</span><span>${item.tag}</span><span>Концепт</span></div>${kind==='modpacks'?`<button class="button light full" data-add-collection="${id}" data-kind="${kind}">Добавить в мои сборки ${icon('arrow')}</button>`:`<h3>Выбери сборку</h3><div class="choose-packs">${state.packs.map(p=>{const already=(p[kind]||[]).includes(id);return `<button class="choose-pack" data-add-collection="${id}" data-kind="${kind}" data-target="${esc(p.id)}" ${already?'disabled':''}><span>${esc(p.name)}<small>${esc(p.loader)} · ${esc(p.version)}</small></span><span>${already?'Добавлено':'+'}</span></button>`}).join('')||'<p>Сначала создай сборку.</p>'}</div><button class="text-button" data-action="create">+ Создать сборку</button>`}<p class="modal-footnote">Добавится только выбор в макете, без загрузки игровых файлов.</p>`);
}

function packPage() {
  const p=state.packs.find(p=>p.id===selectedPack);
  if(!p)return library();
  const navigation=tabs([['mods','Моды'],['shaders','Шейдеры'],['resources','Ресурспаки'],['worlds','Миры'],['options','Параметры']],packTab,'data-pack-tab');
  const installed=(state.downloads||[]).filter(item=>item.profileId===p.id&&item.kind===packTab);
  const installedMarkup=installed.length?`<section class="section-heading"><div><h2>Установленные файлы</h2><p>Эти файлы лежат в папке этой сборки.</p></div></section><div class="mod-list">${installed.map((item,index)=>`<div class="mod-list-item"><span class="mod-icon" style="--mod-color:#705587">${esc((item.name||'?')[0])}</span><div><strong>${esc(item.name)}</strong><small>${esc(item.source)} · ${esc(item.filename)}</small></div><button class="icon-button push-right" data-installed-remove="${index}" aria-label="Удалить ${esc(item.name)}">${icon('close')}</button></div>`).join('')}</div>`:'';
  const existing=packView().replace('<section class="section-heading">', `<section class="minecraft-installer" data-minecraft-version="${esc(p.version)}"><div><span class="eyebrow">ОФИЦИАЛЬНЫЕ ФАЙЛЫ MOJANG</span><h2>Minecraft ${esc(p.version)}</h2><p class="minecraft-install-status">Проверяем файлы на этом устройстве…</p><div class="minecraft-install-track" hidden><span></span></div><small>После загрузки нажми «Играть»: Astra подготовит подходящую Java и ${esc(p.loader)} для этой сборки.</small></div><div class="minecraft-install-actions"><button class="button light" data-minecraft-install="${esc(p.version)}" disabled>Проверка…</button><button class="button secondary" data-minecraft-cancel hidden>Отменить</button></div></section><section class="section-heading">`);
  if(packTab==='mods')return existing.replace('<section class="section-heading">',navigation+'<section class="section-heading">')+installedMarkup;
  const header=existing.slice(0,existing.indexOf('<section class="section-heading">'));
  if(packTab==='worlds')return `${header}${navigation}<div class="designed-empty"><span class="empty-symbol">${icon('world')}</span><h2>Здесь начнётся твой мир</h2><p>После первого запуска здесь появятся сохранения.<br>Миры можно будет импортировать и сохранять в резервные копии.</p><button class="button secondary" data-ui-action="world-import">${icon('folder')} Импортировать мир</button></div>`;
  if(packTab==='options'){const chosenLoader=loaderAvailable(p.version,p.loader)?p.loader:'Forge';return `${header}${navigation}<div class="settings-panel"><form id="pack-options-form"><div class="field-heading"><h2>Параметры сборки</h2><span>Сохраняются на этом устройстве</span></div><label class="field">Название<input name="name" value="${esc(p.name)}" required maxlength="48"></label><div class="form-row"><label class="field">Версия<input value="Minecraft ${esc(p.version)}" readonly></label><label class="field">Загрузчик<select name="loader">${profileLoaders.map(name=>`<option value="${name}" ${chosenLoader===name?'selected':''} ${!loaderAvailable(p.version,name)?'disabled':''}>${name}</option>`).join('')}</select></label></div>${p.loader==='NeoForge'&&!loaderAvailable(p.version,p.loader)?'<div class="info-box">NeoForge не подходит для этой версии. Выбери Forge или Vanilla и сохрани настройки. Игровые файлы и миры останутся на месте.</div>':''}${coverPicker(p.art,'pack-options-form-cover-art')}<button class="button light">Сохранить изменения</button></form><div class="setting"><div><strong>Экспорт профиля</strong><p>Название, параметры и список выбранных модов.</p></div><button class="button secondary" data-action="export">${icon('down')} Экспорт</button></div><div class="setting"><div><strong>Удалить сборку</strong><p>Удаление только профиля в этом макете.</p></div><button class="text-button danger" data-action="delete">Удалить</button></div></div>`;}
  const items=(p[packTab]||[]).map(id=>collections[packTab].find(item=>item.id===id)).filter(Boolean);
  const label=packTab==='shaders'?'Шейдеры':'Ресурспаки';
  const collectionMarkup=items.length?`<div class="mod-list">${items.map(item=>`<div class="mod-list-item"><span class="pack-mini ${item.art}">${icon(packTab==='shaders'?'sun':'cube')}</span><div><strong>${item.name}</strong><small>Выбрано в макете · ${item.by}</small></div><button class="icon-button push-right" data-remove-collection="${item.id}" data-kind="${packTab}" aria-label="Удалить ${item.name}">${icon('close')}</button></div>`).join('')}</div>`:installed.length?'':`<div class="designed-empty"><span class="empty-symbol">${icon(packTab==='shaders'?'sun':'cube')}</span><h2>Немного нового настроения</h2><p>Выбери ${label.toLowerCase()} в каталоге.<br>Здесь будет твоя личная подборка.</p><button class="button secondary" data-open-catalog="${packTab}">Открыть каталог ${icon('arrow')}</button></div>`;
  return `${header}${navigation}<section class="section-heading"><div><h2>${label}</h2><p>${packTab==='shaders'?'Свет, тени и атмосфера твоего мира.':'Знакомые блоки с новым характером.'}</p></div><button class="button light" data-open-catalog="${packTab}">+ Добавить</button></section>${installedMarkup}${collectionMarkup}`;
}

function downloadsPage() {
  return `<section class="page-intro"><div><div class="eyebrow">ВСЁ ПОД КОНТРОЛЕМ</div><h1>Загрузки</h1><p>Моды, обновления и новые приключения.</p></div><span class="preview-badge">МАКЕТ ОЧЕРЕДИ</span></section>
    <div class="download-summary"><div><span>В очереди</span><strong>${downloadExample?1:0}<small> задач</small></strong></div><div><span>Скорость</span><strong>—<small> МБ/с</small></strong></div><div><span>Состояние</span><strong class="summary-status">${downloadExample?(downloadExample.paused?'На паузе':'Пример загрузки'):'Всё спокойно'}</strong></div></div>
    ${downloadExample?`<div class="download-item"><span class="mod-icon" style="--mod-color:#6c846e">Na</span><div class="download-progress"><div><strong>Sodium</strong><span>${downloadExample.paused?'На паузе':'Демонстрация'} · 64%</span></div><div class="progress-track"><span></span></div><small>Мой первый мир · пример интерфейса, файлы не скачиваются</small></div><button class="icon-button" data-ui-action="pause-download" aria-label="${downloadExample.paused?'Продолжить':'Приостановить'} пример загрузки">${icon(downloadExample.paused?'play':'pause')}</button><button class="icon-button" data-ui-action="cancel-download" aria-label="Убрать пример загрузки">${icon('close')}</button></div>`:`<div class="designed-empty"><span class="empty-symbol">${icon('down')}</span><h2>Ничего не нужно ждать</h2><p>Когда начнутся загрузки, ты увидишь их здесь.<br>А пока можно выбрать что-нибудь новое.</p><div class="row"><button class="button light" data-page="mods">Открыть каталог ${icon('arrow')}</button><button class="button secondary" data-ui-action="demo-download">Посмотреть пример очереди</button></div></div>`}
    <div class="quiet-note">${icon('info')} Сейчас можно оценить внешний вид очереди. Настоящая загрузка файлов появится позже.</div>`;
}

function accountsPage() {
  return `<section class="page-intro"><div><div class="eyebrow">ТВОЁ ИМЯ В ЭТОМ МИРЕ</div><h1>Аккаунты</h1><p>Выбирай, с каким профилем отправиться в приключение.</p></div></section><div class="accounts-grid"><article class="account-card"><span class="profile-portrait">${esc(state.profile[0]?.toUpperCase()||'A')}</span><span class="active-profile"><i class="status-dot"></i> Выбран</span><h2>${esc(state.profile)}</h2><p>Локальный профиль</p><span class="profile-caption">Имя сохранено на этом устройстве</span><button class="button secondary full" data-action="account">${icon('settings')} Изменить профиль</button></article><article class="account-card microsoft-card"><span class="microsoft-symbol"><i></i><i></i><i></i><i></i></span><h2>Microsoft</h2><p>Твой аккаунт Minecraft</p><span class="profile-caption">Вход, скин и лицензионная игра</span><button class="button light full" data-ui-action="microsoft">+ Добавить аккаунт</button></article></div><div class="quiet-note">${icon('info')} Вход Microsoft ещё не подключён. Сейчас доступен просмотр экрана авторизации.</div>`;
}

function settingRow(title,description,control) {
  return `<div class="setting"><div><strong>${title}</strong><p>${description}</p></div>${control}</div>`;
}

function settingsPage() {
  const navigation=tabs([['general','Общие'],['appearance','Внешний вид'],['game','Minecraft'],['about','О приложении']],settingsTab,'data-settings-tab');
  let content='';
  if(settingsTab==='general')content=`<h2>Поведение приложения</h2>${settingRow('Стартовый экран','Что открывать при запуске Astra.',`<select id="start-page" aria-label="Стартовый экран">${[['discover','Открывай'],['library','Мои сборки'],['mods','Каталог']].map(([v,l])=>`<option value="${v}" ${(state.startPage||'discover')===v?'selected':''}>${l}</option>`).join('')}</select>`)}${settingRow('Язык интерфейса','Язык текущего дизайн-прототипа.','<span class="setting-value">Русский</span>')}${settingRow('Профиль игрока','Имя для локального прототипа.',`<button class="button secondary" data-action="account">${esc(state.profile)} ${icon('arrow')}</button>`)}${settingRow('Импорт профиля сборки','Перенос настроек из экспортированного файла Astra.','<button class="button secondary" data-action="import">Импортировать</button>')}`;
  if(settingsTab==='appearance')content=`<h2>Твоя Astra</h2><div class="appearance-choices"><button class="theme-card ${state.theme!=='graphite'?'selected':''}" data-theme="dark" aria-pressed="${state.theme!=='graphite'}"><span class="theme-mini dark-mini"><i></i><b></b><em></em></span><span>Полночь ${state.theme!=='graphite'?icon('check'):''}</span></button><button class="theme-card ${state.theme==='graphite'?'selected':''}" data-theme="graphite" aria-pressed="${state.theme==='graphite'}"><span class="theme-mini graphite-mini"><i></i><b></b><em></em></span><span>Графит ${state.theme==='graphite'?icon('check'):''}</span></button></div>${settingRow('Акцент интерфейса','Мягкий фиолетовый или сдержанный монохром.',`<div class="segmented"><button data-accent="purple" class="${state.accent!=='mono'?'selected':''}">Фиолетовый</button><button data-accent="mono" class="${state.accent==='mono'?'selected':''}">Монохром</button></div>`)}${settingRow('Компактный интерфейс','Меньше отступов в карточках и списках.',`<label class="switch"><input aria-label="Компактный интерфейс" type="checkbox" id="compact-ui" ${state.compact?'checked':''}><span></span></label>`)}`;
  if(settingsTab==='game')content=`<h2>Настройки будущего запуска</h2>${settingRow('Выделенная память','Сохранится как предпочтение для сборок.',`<div class="range-wrap"><input aria-label="Выделенная память" type="range" id="memory" min="2" max="16" step="1" value="${state.memory}"><output id="memory-value">${state.memory} ГБ</output></div>`)}${settingRow('Java','Astra будет подбирать Java для версии Minecraft.','<button class="button secondary" data-ui-action="java">Автоматически '+icon('arrow')+'</button>')}${settingRow('Резервные копии','Предпочтение для будущего обновления сборок.',`<label class="switch"><input aria-label="Резервные копии" type="checkbox" id="backups" ${state.backups?'checked':''}><span></span></label>`)}<div class="quiet-note">${icon('info')} Параметры сохраняются. Java и игровые файлы пока не подключены.</div>`;
  if(settingsTab==='about')content=`<div class="about-brand"><img src="assets/astra-icon.png" alt="Astra"><h2>AstraLauncher</h2><span>Desktop preview · 0.3.0</span><p>Маленькое пространство для больших приключений.</p></div>${settingRow('Что нового','Все основные разделы и меню в одном прототипе.','<button class="text-button" data-ui-action="changelog">Посмотреть '+icon('arrow')+'</button>')}${settingRow('Поддержать проект','Спасибо, что помогаешь Astra стать лучше.','<button class="text-button" data-action="support">Поддержать ♡</button>')}<div class="quiet-note">${icon('info')} Неофициальный проект. Не связан с Mojang или Microsoft.</div>`;
  return `<section class="page-intro"><div><div class="eyebrow">ПРОСТО КАК ТЕБЕ УДОБНО</div><h1>Настройки</h1><p>Твоё пространство — твои привычки.</p></div><span class="autosave">${icon('check')} Сохраняется автоматически</span></section>${navigation}<div class="settings-panel">${content}</div>`;
}

function applyAppearance() {
  document.body.classList.toggle('graphite',state.theme==='graphite');
  document.body.classList.toggle('monochrome',state.accent==='mono');
  document.body.classList.toggle('compact-ui',Boolean(state.compact));
}

icons.user='<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>';
icons.world='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>';
icons.sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>';
icons.info='<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>';
icons.pause='<path d="M8 5v14M16 5v14" stroke-width="3"/>';

document.addEventListener('click',e=>{
  const button=e.target.closest('button');
  if(!button)return;
  const d=button.dataset;
  if(d.installedRemove!==undefined){
    const item=(state.downloads||[]).filter(file=>file.profileId===selectedPack&&file.kind===packTab)[Number(d.installedRemove)];
    if(item)showModal(`<h2>Удалить файл из сборки?</h2><p>${esc(item.name)} будет удалён с диска.</p><button class="button destructive full" data-confirm-installed-remove="${esc(item.path)}">Удалить файл</button>`);
    return;
  }
  if(d.confirmInstalledRemove){
    const file=(state.downloads||[]).find(item=>item.path===d.confirmInstalledRemove&&item.profileId===selectedPack);
    if(file)window.astraDesktop.removeInstalledFile(file.path,selectedPack).then(()=>{state.downloads=state.downloads.filter(item=>item!==file);save();modal.close();render();toast('Файл удалён из сборки');}).catch(error=>toast(humanError(error)));
    return;
  }
  if(d.catalogTab){catalogType=d.catalogTab;collectionQuery='';render();}
  if(d.packTab){packTab=d.packTab;render();}
  if(d.settingsTab){settingsTab=d.settingsTab;render();}
  if(d.openCatalog){catalogTargetPackId=selectedPack;catalogType=d.openCatalog;collectionQuery='';go('mods');}
  if(d.collection)collectionModal(d.kind,d.collection);
  if(d.addCollection){
    const item=collections[d.kind]?.find(item=>item.id===d.addCollection);
    if(!item)return;
    if(d.kind==='modpacks'){
      let p=state.packs.find(p=>p.collectionId===item.id);
      if(!p){p={id:crypto.randomUUID(),collectionId:item.id,name:item.name,version:item.version,loader:item.loader,mods:[...item.mods],art:item.art,last:'Готова к настройке'};state.packs.push(p);}
      selectedPack=p.id;packTab='mods';save();modal.close();go('pack');toast('Сборка добавлена в библиотеку');
    }else{
      const p=state.packs.find(p=>p.id===d.target);if(!p)return;
      p[d.kind]=[...new Set([...(p[d.kind]||[]),item.id])];
      selectedPack=p.id;packTab=d.kind;save();modal.close();go('pack');toast('Подборка сохранена в профиле');
    }
  }
  if(d.removeCollection){const p=state.packs.find(p=>p.id===selectedPack);p[d.kind]=(p[d.kind]||[]).filter(id=>id!==d.removeCollection);save();render();toast('Убрано из подборки');}
  if(d.theme){state.theme=d.theme;save();render();}
  if(d.accent){state.accent=d.accent;save();render();}
  if(d.uiAction==='demo-download'){downloadExample={paused:false};render();}
  if(d.uiAction==='pause-download'){downloadExample.paused=!downloadExample.paused;render();}
  if(d.uiAction==='cancel-download'){downloadExample=null;render();}
  if(d.uiAction==='world-import')showModal(`<span class="modal-mark">${icon('world')}</span><h2>Твои миры всегда рядом</h2><p>Здесь можно будет выбрать папку с сохранением Minecraft и перенести её в сборку.</p><div class="info-box">Сейчас это макет. Импорт игровых миров подключим вместе с работой с файлами Minecraft.</div><button class="button light full" data-action="close">Понятно</button>`);
  if(d.uiAction==='microsoft')showModal(`<span class="microsoft-symbol"><i></i><i></i><i></i><i></i></span><h2>Войти через Microsoft</h2><p>Авторизация будет открываться в браузере. Пароль не нужно вводить в лаунчере.</p><div class="auth-steps"><div><span>1</span>Вход в аккаунт Microsoft</div><div><span>2</span>Проверка профиля Minecraft</div><div><span>3</span>Готово — можно играть</div></div><div class="info-box">Экран для оценки дизайна. Авторизация пока не подключена, данные аккаунта не запрашиваются.</div><button class="button light full" data-action="close">Вернуться к аккаунтам</button>`);
  if(d.uiAction==='java')showModal(`<span class="modal-mark">${icon('settings')}</span><h2>Подходящая Java</h2><p>Для каждой версии игры Astra будет подбирать подходящую среду автоматически.</p><div class="choose-packs"><div class="choose-pack"><span>Minecraft 1.21.1<small>Java 21</small></span>${icon('check')}</div><div class="choose-pack"><span>Minecraft 1.20.1<small>Java 17</small></span>${icon('check')}</div></div><div class="info-box">Это макет настройки. Установка Java пока не выполняется.</div><button class="button light full" data-action="close">Оставить автоматический выбор</button>`);
  if(d.uiAction==='changelog')showModal('<h2>Astra Desktop 0.3</h2><p>Теперь можно пройти весь интерфейс.</p><ul class="changelog"><li>Отдельное приложение Windows</li><li>Каталог сборок, шейдеров и ресурспаков</li><li>Вкладки управления сборкой</li><li>Очередь загрузок и аккаунты</li><li>Темы, акценты и настройки интерфейса</li></ul><button class="button light full" data-action="close">Отлично</button>');
});

document.addEventListener('input',e=>{
  if(e.target.id==='collection-search'){collectionQuery=e.target.value;$('#collection-results').innerHTML=collectionCards();}
});
document.addEventListener('change',e=>{
  if(e.target.id==='start-page'){state.startPage=e.target.value;save();toast('Стартовый экран сохранён');}
  if(e.target.id==='compact-ui'){state.compact=e.target.checked;save();applyAppearance();}
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='pack-options-form')return;
  e.preventDefault();const data=new FormData(e.target);const p=state.packs.find(p=>p.id===selectedPack);const name=String(data.get('name')).trim();
  if(!p||!name)return;
  const cover=String(data.get('art'));
  if(!coverTemplates.some(([id])=>id===cover))return;
  const loader=String(data.get('loader'));
  if(!profileLoaders.includes(loader)||!loaderAvailable(p.version,loader)){toast('Этот загрузчик не подходит для версии Minecraft.');return}
  p.name=name;p.art=cover;p.loader=loader;save();render();toast('Параметры сборки сохранены');
});

function restoreRoute(){
  const initial=location.hash.slice(1);
  page=['discover','library','mods'].includes(state.startPage)?state.startPage:'discover';
  if(initial.startsWith('pack/')){try{selectedPack=decodeURIComponent(initial.slice(5));if(state.packs.some(p=>p.id===selectedPack))page='pack';}catch{}}
  if(['discover','library','mods','settings','downloads','accounts'].includes(initial))page=initial;
  render();
}
window.addEventListener('hashchange',restoreRoute);
restoreRoute();
