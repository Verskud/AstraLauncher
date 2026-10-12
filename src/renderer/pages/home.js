
const homeCopy = {
  ru: ['С возвращением.', 'Во что играем сегодня?', 'Твоя сборка', 'Играть', 'Открыть сборку', 'Найти что-нибудь новое', 'Моды, готовые сборки и шейдеры от сообщества.'],
  en: ['Welcome back.', 'What are we playing today?', 'Your instance', 'Play', 'Open instance', 'Find something new', 'Mods, modpacks and shaders from the community.'],
  de: ['Willkommen zurück.', 'Was spielen wir heute?', 'Deine Instanz', 'Spielen', 'Instanz öffnen', 'Etwas Neues entdecken', 'Mods, Modpacks und Shader aus der Community.'],
  fr: ['Bon retour.', 'À quoi joue-t-on aujourd’hui ?', 'Votre instance', 'Jouer', 'Ouvrir l’instance', 'Découvrir autre chose', 'Mods, modpacks et shaders de la communauté.'],
  es: ['Te damos la bienvenida.', '¿A qué jugamos hoy?', 'Tu instancia', 'Jugar', 'Abrir instancia', 'Descubre algo nuevo', 'Mods, modpacks y shaders de la comunidad.'],
  ko: ['다시 만나 반가워요.', '오늘은 무엇을 플레이할까요?', '내 인스턴스', '플레이', '인스턴스 열기', '새로운 콘텐츠 찾기', '커뮤니티에서 만든 모드, 모드팩, 셰이더.'],
  ja: ['おかえりなさい。', '今日は何で遊びますか？', 'あなたの構成', 'プレイ', '構成を開く', '新しいものを見つけよう', 'コミュニティの MOD、MOD パック、シェーダー。'],
  'zh-CN': ['欢迎回来。', '今天玩什么？', '你的实例', '开始游戏', '打开实例', '发现新内容', '来自社区的模组、整合包和光影。'],
  'zh-TW': ['歡迎回來。', '今天玩什麼？', '你的實例', '開始遊戲', '開啟實例', '探索新內容', '來自社群的模組、整合包與光影。'],
  ar: ['أهلًا بعودتك.', 'ماذا سنلعب اليوم؟', 'تجميعتك', 'العب', 'فتح التجميعة', 'اكتشف شيئًا جديدًا', 'تعديلات وتجميعات ومؤثرات رسومية من المجتمع.'],
  'de-CH': ['Willkommen zurück.', 'Was spielen wir heute?', 'Deine Instanz', 'Spielen', 'Instanz öffnen', 'Etwas Neues entdecken', 'Mods, Modpacks und Shader aus der Community.'],
  nb: ['Velkommen tilbake.', 'Hva spiller vi i dag?', 'Din instans', 'Spill', 'Åpne instans', 'Finn noe nytt', 'Mods, modpakker og shadere fra fellesskapet.'],
};
discover = function () {
  const [welcome, subtitle, instance, play, open, explore, catalogHint] = homeCopy[currentLanguage()] || homeCopy.en;
  const packs = state.packs.slice().reverse();
  const featured = packs.find(pack => pack.id === state.homeInstanceId) || packs[0];
  const feature = featured
    ? `<section class="play-scene">${art(featured.art, 'home-scene')}<div class="play-scene-shade"></div><div class="play-scene-copy"><span class="scene-label">${instance}</span><h2>${esc(featured.name)}</h2><p>Minecraft ${esc(featured.version)} <span>·</span> ${esc(featured.loader)}</p><div class="row"><button class="button light play-primary" data-launch="${esc(featured.id)}" ${loaderAvailable(featured.version,featured.loader)?'':'disabled'}>${icon('play')} ${play}</button><button class="button scene-secondary" data-pack="${esc(featured.id)}">${open} ${icon('arrow')}</button></div></div></section>`
    : `<section class="play-scene welcome-scene">${art('forest','home-welcome')}<div class="play-scene-shade"></div><div class="play-scene-copy"><span class="scene-label">MINECRAFT JAVA EDITION</span><h2>${t('newPack')}</h2><p>${t('newPackHint')}</p><button class="button light play-primary" data-action="create">+ ${t('createPack')}</button></div></section>`;
  const shelf = packs.length ? `<section class="home-shelf"><div class="section-heading"><h2>${t('libraryTitle')} <span class="heading-count">${packs.length}</span></h2><button class="text-button" data-page="library">${t('libraryTitle')} ${icon('arrow')}</button></div><div class="home-instance-list">${packs.slice(0,3).map(pack=>`<button class="home-instance" data-pack="${esc(pack.id)}"><span class="home-instance-art">${art(pack.art,`shelf-${pack.id}`)}</span><span class="home-instance-label"><strong>${esc(pack.name)}</strong><small>${esc(pack.loader)} · ${esc(pack.version)}</small></span>${icon('arrow')}</button>`).join('')}</div></section>` : '';
  return `<div class="home-page"><section class="page-intro home-heading"><div><h1>${welcome}</h1><p>${subtitle}</p></div><button class="button secondary" data-action="import">${icon('down')} ${t('importAction')}</button></section>${feature}${shelf}<section class="home-discover"><span class="home-discover-icon">${icon('compass')}</span><div><h2>${explore}</h2><p>${catalogHint}</p></div><button class="button secondary" data-page="mods">${t('openCatalog')} ${icon('arrow')}</button></section></div>`;
};
document.addEventListener('click', event => {
  const launch = event.target.closest('[data-launch]');
  if (!launch || launch.disabled || !state.packs.some(pack => pack.id === launch.dataset.launch)) return;
  state.homeInstanceId = launch.dataset.launch;
  save();
});
