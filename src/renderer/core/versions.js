// Version IDs come from Mojang's Java Edition manifest through the desktop process.
let minecraftManifest = null;
let versionRequest = null;
const versionLabels = {
  ru: ['Релизы', 'Снапшоты', 'Старая бета', 'Старая альфа', 'Все версии', 'Найти версию…', 'Загружаем версии…', 'Версии не найдены', 'Список сохранён на устройстве', 'Каталог обновлён', 'Не удалось обновить каталог', 'Для исторических версий и снапшотов пока доступен только профиль Vanilla.', 'Загрузчик отмечается в профиле. Установка и совместимость будут проверяться при подключении игрового запуска.'],
  en: ['Releases', 'Snapshots', 'Old beta', 'Old alpha', 'All versions', 'Find a version…', 'Loading versions…', 'No versions found', 'Saved version list', 'Catalog updated', 'Could not refresh catalog', 'Only Vanilla profiles are available for snapshots and historical versions.', 'The loader is recorded in this profile. Installation and compatibility checks will follow with game launching.'],
  de: ['Versionen', 'Snapshots', 'Alte Beta', 'Alte Alpha', 'Alle Versionen', 'Version suchen…', 'Versionen werden geladen…', 'Keine Version gefunden', 'Gespeicherte Versionsliste', 'Katalog aktualisiert', 'Katalog konnte nicht aktualisiert werden', 'Für Snapshots und historische Versionen gibt es vorerst nur Vanilla-Profile.', 'Der Modloader wird im Profil vorgemerkt. Installation und Kompatibilität folgen mit dem Spielstart.'],
  fr: ['Versions', 'Snapshots', 'Anciennes bêta', 'Anciennes alpha', 'Toutes les versions', 'Chercher une version…', 'Chargement des versions…', 'Aucune version trouvée', 'Liste enregistrée sur cet appareil', 'Catalogue actualisé', 'Actualisation impossible', 'Seuls les profils Vanilla sont disponibles pour les snapshots et anciennes versions.', 'Le chargeur est enregistré dans le profil. Installation et vérification suivront avec le lancement du jeu.'],
  es: ['Versiones', 'Snapshots', 'Beta antiguas', 'Alfa antiguas', 'Todas las versiones', 'Buscar versión…', 'Cargando versiones…', 'No se encontraron versiones', 'Lista guardada en este equipo', 'Catálogo actualizado', 'No se pudo actualizar', 'Por ahora, las snapshots y versiones antiguas solo admiten perfiles Vanilla.', 'El cargador se guarda en el perfil. La instalación y compatibilidad se comprobarán al implementar el inicio del juego.'],
  ko: ['정식 버전', '스냅샷', '이전 베타', '이전 알파', '모든 버전', '버전 찾기…', '버전 불러오는 중…', '버전을 찾을 수 없음', '기기에 저장된 버전 목록', '카탈로그 업데이트됨', '카탈로그 업데이트 실패', '스냅샷과 이전 버전은 현재 Vanilla 프로필만 사용할 수 있습니다.', '로더는 프로필에 기록됩니다. 설치와 호환성 확인은 게임 실행 기능과 함께 제공됩니다.'],
  ja: ['正式版', 'スナップショット', '旧ベータ', '旧アルファ', 'すべてのバージョン', 'バージョンを検索…', '読み込み中…', '見つかりません', '端末に保存された一覧', 'カタログを更新しました', '更新できませんでした', 'スナップショットと古いバージョンは現在 Vanilla のみ選べます。', 'ローダーはプロファイルに記録されます。インストールと互換性確認はゲーム起動機能で対応します。'],
  'zh-CN': ['正式版', '快照', '旧测试版', '旧早期版', '全部版本', '查找版本…', '正在加载版本…', '未找到版本', '设备上保存的版本列表', '目录已更新', '无法更新目录', '快照和历史版本目前仅支持 Vanilla 配置。', '加载器仅记录在配置中。安装和兼容性检查将在游戏启动功能中实现。'],
  'zh-TW': ['正式版', '快照', '舊測試版', '舊早期版', '所有版本', '尋找版本…', '正在載入版本…', '找不到版本', '裝置上儲存的版本清單', '目錄已更新', '無法更新目錄', '快照及歷史版本目前僅能選擇 Vanilla 設定檔。', '載入器只記錄於設定檔；安裝及相容性檢查將於遊戲啟動功能提供。'],
  ar: ['الإصدارات', 'اللقطات التجريبية', 'بيتا القديمة', 'ألفا القديمة', 'كل الإصدارات', 'ابحث عن إصدار…', 'جارٍ تحميل الإصدارات…', 'لم يُعثر على إصدارات', 'قائمة محفوظة على الجهاز', 'تم تحديث القائمة', 'تعذر تحديث القائمة', 'تتوفر ملفات Vanilla فقط للقطات والإصدارات التاريخية حاليًا.', 'يُحفظ نوع المحمّل في الملف. سيأتي التثبيت وفحص التوافق مع تشغيل اللعبة.'],
  'de-CH': ['Versionen', 'Snapshots', 'Alte Beta', 'Alte Alpha', 'Alle Versionen', 'Version suchen…', 'Versionen werden geladen…', 'Keine Version gefunden', 'Gespeicherte Versionsliste', 'Katalog aktualisiert', 'Katalog konnte nicht aktualisiert werden', 'Für Snapshots und historische Versionen gibt es vorerst nur Vanilla-Profile.', 'Der Modloader wird im Profil vorgemerkt. Installation und Kompatibilität folgen mit dem Spielstart.'],
  nb: ['Utgivelser', 'Øyeblikksbilder', 'Gammel beta', 'Gammel alfa', 'Alle versjoner', 'Finn versjon…', 'Laster versjoner…', 'Ingen versjoner funnet', 'Lagret versjonsliste', 'Katalog oppdatert', 'Kunne ikke oppdatere katalogen', 'Bare Vanilla-profiler er tilgjengelige for øyeblikksbilder og historiske versjoner.', 'Modlasteren lagres i profilen. Installasjon og kompatibilitet sjekkes når spillstart legges til.'],
};
const vLabel = index => (versionLabels[typeof currentLanguage === 'function' ? currentLanguage() : 'ru'] || versionLabels.ru)[index];
const versionTypeLabels = { ru:'Тип версии', en:'Version type', de:'Versionstyp', fr:'Type de version', es:'Tipo de versión', ko:'버전 유형', ja:'バージョンの種類', 'zh-CN':'版本类型', 'zh-TW':'版本類型', ar:'نوع الإصدار', 'de-CH':'Versionstyp', nb:'Versjonstype' };
const versionTypeLabel = () => versionTypeLabels[typeof currentLanguage === 'function' ? currentLanguage() : 'ru'] || versionTypeLabels.ru;

function versionPickerMarkup() {
  return `<div class="version-picker"><div class="form-row"><label>${versionTypeLabel()}<select id="version-type"><option value="release">${vLabel(0)}</option><option value="snapshot">${vLabel(1)}</option><option value="old_beta">${vLabel(2)}</option><option value="old_alpha">${vLabel(3)}</option><option value="all">${vLabel(4)}</option></select></label><label>${vLabel(5)}<input id="version-search" type="search" placeholder="${vLabel(5)}" autocomplete="off"></label></div><label>Minecraft<select name="version" id="version-choice" required disabled><option>${vLabel(6)}</option></select></label><div class="version-meta"><span id="version-count">${vLabel(6)}</span><button type="button" class="text-button" data-version-refresh>${typeof t === 'function' ? t('refresh') : 'Обновить'}</button></div><p class="version-note" id="version-note"></p></div>`;
}

function selectedVersionType() {
  const value = document.querySelector('#version-choice')?.value;
  return minecraftManifest?.versions.find(item => item.id === value)?.type || null;
}

function updateLoaderForVersion() {
  const loader = document.querySelector('#create-loader');
  const note = document.querySelector('#version-note');
  if (!loader || !note) return;
  const release = selectedVersionType() === 'release';
  for (const option of loader.options) if (option.value !== 'Vanilla') option.disabled = !release;
  if (!release) loader.value = 'Vanilla';
  note.textContent = release ? vLabel(12) : vLabel(11);
}

function renderVersionChoices(preferred) {
  const select = document.querySelector('#version-choice');
  if (!select || !minecraftManifest) return;
  const type = document.querySelector('#version-type').value;
  const query = document.querySelector('#version-search').value.trim().toLowerCase();
  const matches = minecraftManifest.versions.filter(item => (type === 'all' || item.type === type) && item.id.toLowerCase().includes(query));
  const previous = preferred || select.value;
  const latest = type === 'snapshot' ? minecraftManifest.latest.snapshot : minecraftManifest.latest.release;
  const selected = matches.some(item => item.id === previous) ? previous : matches.some(item => item.id === latest) ? latest : matches[0]?.id;
  select.innerHTML = matches.length ? matches.map(item => `<option value="${esc(item.id)}">${esc(item.id)} · ${esc(item.releaseTime.slice(0, 10))}</option>`).join('') : `<option value="">${vLabel(7)}</option>`;
  select.disabled = !matches.length;
  if (selected) select.value = selected;
  document.querySelector('#version-count').textContent = `${matches.length} / ${minecraftManifest.versions.length} · ${minecraftManifest.source === 'live' ? vLabel(9) : vLabel(8)}`;
  const submit = document.querySelector('#create-form button[type="submit"]');
  if (submit) submit.disabled = !matches.length;
  updateLoaderForVersion();
}

async function activateVersionPicker() {
  try {
    minecraftManifest = await window.astraDesktop.minecraftVersions();
    renderVersionChoices(minecraftManifest.latest.release);
    if (minecraftManifest.source !== 'live') refreshVersionPicker(false);
  } catch (error) {
    const count = document.querySelector('#version-count');
    if (count) count.textContent = String(error.message || error);
  }
}

async function refreshVersionPicker(showErrors) {
  if (versionRequest) return versionRequest;
  versionRequest = window.astraDesktop.minecraftVersions(true).then(data => {
    const previous = document.querySelector('#version-choice')?.value;
    minecraftManifest = data;
    renderVersionChoices(previous);
  }).catch(error => {
    const count = document.querySelector('#version-count');
    if (count && showErrors) count.textContent = `${vLabel(10)}: ${error.message}`;
  }).finally(() => { versionRequest = null; });
  return versionRequest;
}

document.addEventListener('input', event => { if (event.target.id === 'version-search') renderVersionChoices(); });
document.addEventListener('change', event => {
  if (event.target.id === 'version-type') renderVersionChoices();
  if (event.target.id === 'version-choice') updateLoaderForVersion();
});
document.addEventListener('click', event => {
  if (event.target.closest('[data-version-refresh]')) refreshVersionPicker(true);
});
