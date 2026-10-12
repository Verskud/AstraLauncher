const contentKeys = ['website','intro','open','target','files','match','dependencies','packs','empty','added','skipped','add','title','folder','working','activate','search'];
const contentCopy = {
  ru: ['Сайт','Скачай файлы с официального сайта и добавь их в свою сборку.','Открыть CurseForge','Сборка для установки','Выбрать скачанные файлы','На странице файла выбери ту же версию Minecraft и загрузчик, что у сборки. Моды — .jar, ресурспаки и шейдеры — .zip. Архивы паков распаковывать не нужно.','Обязательные зависимости модов скачай отдельно. Для шейдеров нужен Iris или Oculus.','CurseForge ZIP с manifest.json содержит ссылки на моды, а не готовую сборку. Автоматический импорт пока недоступен. Создай сборку с нужной версией и загрузчиком, затем добавь скачанные моды во вкладке «Моды».','Сначала создай сборку. Для модов выбери Fabric, Quilt, Forge или NeoForge.','Добавлено файлов','Уже установлено','Добавить файлы','Установка скачанных файлов','Открыть папку файлов','Копируем и проверяем…','Ресурспаки и шейдеры после добавления включи в настройках Minecraft.','Поиск на сайте'],
  en: ['Website','Download files from the official website and add them to your instance.','Open CurseForge','Installation instance','Select downloaded files','On the file page, match your instance’s Minecraft version and mod loader. Mods: .jar; resource and shader packs: .zip. Keep pack archives zipped.','Download required mod dependencies separately. Shaders need Iris or Oculus.','A CurseForge ZIP with manifest.json contains mod references, not a complete instance. Automatic import is not available yet. Create an instance with the correct version and loader, then add downloaded mods on the Mods tab.','Create an instance first. For mods, select Fabric, Quilt, Forge or NeoForge.','Files added','Already installed','Add files','Install downloaded files','Open content folder','Copying and checking…','Enable resource packs and shaders in Minecraft settings after adding them.','Search website'],
  de: ['Website','Lade Dateien von der offiziellen Website herunter und füge sie deiner Instanz hinzu.','CurseForge öffnen','Zielinstanz','Heruntergeladene Dateien auswählen','Wähle auf der Dateiseite dieselbe Minecraft-Version und denselben Modloader wie in deiner Instanz. Mods: .jar; Ressourcen- und Shaderpakete: .zip. Paketarchive nicht entpacken.','Erforderliche Mod-Abhängigkeiten separat herunterladen. Shader benötigen Iris oder Oculus.','Ein CurseForge-ZIP mit manifest.json enthält Verweise auf Mods, keine vollständige Instanz. Der automatische Import ist noch nicht verfügbar. Erstelle eine Instanz mit passender Version und passendem Loader und füge die heruntergeladenen Mods im Tab „Mods“ hinzu.','Erstelle zuerst eine Instanz. Wähle für Mods Fabric, Quilt, Forge oder NeoForge.','Dateien hinzugefügt','Bereits installiert','Dateien hinzufügen','Heruntergeladene Dateien installieren','Dateiordner öffnen','Wird kopiert und geprüft…','Aktiviere Ressourcen- und Shaderpakete anschließend in den Minecraft-Einstellungen.','Auf der Website suchen'],
  fr: ['Site web','Téléchargez les fichiers sur le site officiel et ajoutez-les à votre instance.','Ouvrir CurseForge','Instance de destination','Choisir les fichiers téléchargés','Choisissez la même version de Minecraft et le même chargeur que votre instance. Mods : .jar ; packs de ressources et shaders : .zip. Ne décompressez pas les packs.','Téléchargez séparément les dépendances obligatoires des mods. Les shaders nécessitent Iris ou Oculus.','Un ZIP CurseForge avec manifest.json contient des références aux mods, pas une instance complète. L’import automatique n’est pas encore disponible. Créez une instance avec la bonne version et le bon chargeur, puis ajoutez les mods téléchargés dans l’onglet Mods.','Créez d’abord une instance. Pour les mods, choisissez Fabric, Quilt, Forge ou NeoForge.','Fichiers ajoutés','Déjà installés','Ajouter des fichiers','Installer les fichiers téléchargés','Ouvrir le dossier des fichiers','Copie et vérification…','Activez ensuite les packs de ressources et les shaders dans les paramètres de Minecraft.','Rechercher sur le site'],
  es: ['Sitio web','Descarga los archivos del sitio oficial y añádelos a tu instancia.','Abrir CurseForge','Instancia de destino','Elegir archivos descargados','Elige la misma versión de Minecraft y el mismo cargador que tu instancia. Mods: .jar; paquetes de recursos y shaders: .zip. No descomprimas los paquetes.','Descarga por separado las dependencias obligatorias de los mods. Los shaders necesitan Iris u Oculus.','Un ZIP de CurseForge con manifest.json contiene referencias a mods, no una instancia completa. La importación automática aún no está disponible. Crea una instancia con la versión y el cargador correctos y añade los mods descargados en la pestaña Mods.','Crea primero una instancia. Para mods, elige Fabric, Quilt, Forge o NeoForge.','Archivos añadidos','Ya instalados','Añadir archivos','Instalar archivos descargados','Abrir carpeta de archivos','Copiando y comprobando…','Activa los paquetes de recursos y los shaders en los ajustes de Minecraft después de añadirlos.','Buscar en el sitio'],
  ko: ['웹사이트','공식 웹사이트에서 파일을 다운로드한 후 인스턴스에 추가하세요.','CurseForge 열기','설치할 인스턴스','다운로드한 파일 선택','인스턴스와 같은 Minecraft 버전 및 모드 로더를 선택하세요. 모드는 .jar, 리소스 팩과 셰이더는 .zip 파일입니다. 팩의 압축은 풀지 마세요.','필수 의존성 모드는 따로 다운로드하세요. 셰이더에는 Iris 또는 Oculus가 필요합니다.','manifest.json이 있는 CurseForge ZIP은 완성된 인스턴스가 아니라 모드 참조를 담고 있습니다. 자동 가져오기는 아직 지원하지 않습니다. 올바른 버전과 로더로 인스턴스를 만든 후 모드 탭에서 다운로드한 모드를 추가하세요.','먼저 인스턴스를 만드세요. 모드를 사용하려면 Fabric, Quilt, Forge 또는 NeoForge를 선택하세요.','추가한 파일','이미 설치됨','파일 추가','다운로드한 파일 설치','파일 폴더 열기','복사 및 확인 중…','추가한 리소스 팩과 셰이더는 Minecraft 설정에서 활성화하세요.','웹사이트 검색'],
  ja: ['ウェブサイト','公式サイトからファイルをダウンロードして構成に追加します。','CurseForgeを開く','インストール先の構成','ダウンロード済みファイルを選択','構成と同じMinecraftバージョンとMODローダーを選んでください。MODは.jar、リソースパックとシェーダーは.zipです。パックは展開せずに追加します。','必須の依存MODは別途ダウンロードしてください。シェーダーにはIrisまたはOculusが必要です。','manifest.jsonを含むCurseForge ZIPはMODへの参照を格納しており、完成した構成ではありません。自動インポートはまだ利用できません。正しいバージョンとローダーで構成を作り、MODタブからダウンロードしたMODを追加してください。','先に構成を作成してください。MODにはFabric、Quilt、Forge、NeoForgeのいずれかを選びます。','追加したファイル','インストール済み','ファイルを追加','ダウンロード済みファイルをインストール','ファイルのフォルダーを開く','コピーして確認中…','追加したリソースパックとシェーダーはMinecraftの設定で有効にしてください。','サイト内を検索'],
  'zh-CN': ['网站','从官方网站下载文件，然后添加到你的实例。','打开 CurseForge','安装目标实例','选择已下载的文件','选择与实例相同的 Minecraft 版本和模组加载器。模组使用 .jar，资源包和光影使用 .zip。无需解压包文件。','必需的依赖模组需单独下载。光影需要 Iris 或 Oculus。','包含 manifest.json 的 CurseForge ZIP 保存的是模组引用，并非完整实例。目前尚不支持自动导入。请创建使用正确版本和加载器的实例，然后在模组标签页添加已下载的模组。','请先创建实例。使用模组时选择 Fabric、Quilt、Forge 或 NeoForge。','已添加文件','已安装','添加文件','安装已下载的文件','打开文件夹','正在复制并检查…','添加后，请在 Minecraft 设置中启用资源包和光影。','在网站上搜索'],
  'zh-TW': ['網站','從官方網站下載檔案，再加入你的實例。','開啟 CurseForge','安裝目標實例','選擇已下載的檔案','選擇與實例相同的 Minecraft 版本和模組載入器。模組使用 .jar，資源包和光影使用 .zip。無需解壓縮套件檔案。','必要的相依模組需另外下載。光影需要 Iris 或 Oculus。','包含 manifest.json 的 CurseForge ZIP 儲存的是模組參照，並非完整實例。目前尚不支援自動匯入。請建立使用正確版本和載入器的實例，再於模組分頁加入已下載的模組。','請先建立實例。使用模組時選擇 Fabric、Quilt、Forge 或 NeoForge。','已加入檔案','已安裝','加入檔案','安裝已下載的檔案','開啟檔案資料夾','正在複製並檢查…','加入後，請在 Minecraft 設定中啟用資源包和光影。','在網站上搜尋'],
  ar: ['الموقع','نزّل الملفات من الموقع الرسمي ثم أضفها إلى نسختك.','فتح CurseForge','النسخة المستهدفة','اختيار الملفات المنزّلة','اختر إصدار Minecraft ومحمّل التعديلات المطابقين لنسختك. التعديلات بصيغة .jar وحزم الموارد والمظللات بصيغة .zip. لا تفك ضغط الحزم.','نزّل التعديلات المطلوبة كاعتماديات بشكل منفصل. تحتاج المظللات إلى Iris أو Oculus.','يحتوي ملف CurseForge ZIP الذي يتضمن manifest.json على مراجع للتعديلات وليس نسخة كاملة. الاستيراد التلقائي غير متاح بعد. أنشئ نسخة بالإصدار والمحمّل الصحيحين ثم أضف التعديلات المنزّلة من تبويب التعديلات.','أنشئ نسخة أولًا. للتعديلات اختر Fabric أو Quilt أو Forge أو NeoForge.','الملفات المضافة','مثبّتة بالفعل','إضافة ملفات','تثبيت الملفات المنزّلة','فتح مجلد الملفات','جارٍ النسخ والتحقق…','فعّل حزم الموارد والمظللات في إعدادات Minecraft بعد إضافتها.','البحث في الموقع'],
  nb: ['Nettsted','Last ned filene fra det offisielle nettstedet og legg dem til i instansen din.','Åpne CurseForge','Målinstans','Velg nedlastede filer','Velg samme Minecraft-versjon og modlaster som i instansen. Mods: .jar; ressurspakker og shaders: .zip. Ikke pakk ut pakkearkivene.','Last ned nødvendige modavhengigheter separat. Shaders krever Iris eller Oculus.','En CurseForge-ZIP med manifest.json inneholder referanser til mods, ikke en komplett instans. Automatisk import er ikke tilgjengelig ennå. Opprett en instans med riktig versjon og modlaster, og legg til nedlastede mods i Mods-fanen.','Opprett en instans først. Velg Fabric, Quilt, Forge eller NeoForge for mods.','Filer lagt til','Allerede installert','Legg til filer','Installer nedlastede filer','Åpne filmappen','Kopierer og kontrollerer…','Aktiver ressurspakker og shaders i Minecraft-innstillingene etter at de er lagt til.','Søk på nettstedet'],
};
contentCopy['de-CH'] = contentCopy.de;
const contentText = key => key === 'packs' ? packImportText(0) : (contentCopy[currentLanguage()] || contentCopy.en)[contentKeys.indexOf(key)];
let contentImportPending = false;

function contentDestinations(kind, preferredId) {
  const choices = state.packs.filter(pack => kind !== 'mods' || pack.loader !== 'Vanilla' && loaderAvailable(pack.version, pack.loader));
  const preferred = choices.find(pack => pack.id === preferredId) || choices[0];
  return { choices, options: choices.map(pack => `<option value="${esc(pack.id)}" ${pack.id === preferred?.id ? 'selected' : ''}>${esc(pack.name)} · Minecraft ${esc(pack.version)} · ${esc(pack.loader)}</option>`).join('') };
}

function contentInstallForm(kind, preferredId, inDialog = false) {
  const { choices, options } = contentDestinations(kind, preferredId);
  if (!choices.length) return `<div class="info-box">${contentText('empty')}</div><button class="button light" data-action="create">${t('createPack')}</button>`;
  return `<form id="${inDialog ? 'manual-content-dialog-form' : 'manual-content-form'}" data-kind="${kind}"><label>${contentText('target')}<select name="profile" required>${options}</select></label><p>${contentText('match')}</p><p class="quiet-note">${contentText(kind === 'mods' ? 'dependencies' : 'activate')}</p><p class="content-error" role="alert"></p><div class="row"><button class="button light" type="submit">${contentText('files')} ${icon('down')}</button><button class="button secondary" type="button" data-content-folder="${kind}">${contentText('folder')}</button></div></form>`;
}

function curseForgePanel() {
  const search = `<form id="curseforge-search-form" class="search-row"><label class="search">${icon('search')}<input name="query" type="search" maxlength="100" aria-label="${contentText('search')}" placeholder="${contentText('search')}…" value="${esc(liveQuery)}"></label><button class="button light">${contentText('open')} ${icon('arrow')}</button></form>`;
  const content = catalogType === 'modpacks' ? `<div class="info-box">${contentText('packs')}</div><button class="button light" data-modpack-local>${t('importAction')} .mrpack / ZIP ${icon('down')}</button>` : contentInstallForm(catalogType, catalogTargetPackId);
  return `${search}<section class="manual-content-panel"><h2>${contentText('title')}</h2>${content}</section>`;
}

function manualContentModal(kind, id) {
  if (!['mods', 'resources', 'shaders'].includes(kind)) kind = 'mods';
  showModal(`<h2>${contentText('title')} · ${t(kind)}</h2><div class="source-tabs">${['mods', 'resources', 'shaders'].map(type => `<button class="${kind === type ? 'selected' : ''}" data-content-kind="${type}" data-content-profile="${esc(id || '')}">${t(type)}</button>`).join('')}</div>${contentInstallForm(kind, id, true)}`);
}

const renderBeforeManualContent = render;
render = function () {
  renderBeforeManualContent();
  const pack = state.packs.find(item => item.id === selectedPack);
  if (page === 'pack' && pack && ['mods', 'resources', 'shaders'].includes(packTab)) {
    const heading = $('#main .section-heading');
    const button = `<button class="button secondary" data-content-import="${packTab}" data-content-profile="${esc(pack.id)}">${contentText('add')}</button>`;
    const row = heading?.querySelector('.row');
    if (row) row.insertAdjacentHTML('beforeend', button);
    else {
      const existing = heading?.querySelector('button');
      if (existing) existing.outerHTML = `<div class="row">${existing.outerHTML}${button}</div>`;
    }
  }
  if (page === 'downloads') $('#main .page-intro')?.insertAdjacentHTML('beforeend', `<button class="button secondary" data-content-import="mods">${contentText('add')}</button>`);
};

document.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.contentImport) manualContentModal(button.dataset.contentImport, button.dataset.contentProfile);
  if (button.dataset.contentKind) manualContentModal(button.dataset.contentKind, $('#manual-content-dialog-form [name=profile]')?.value || button.dataset.contentProfile);
  if (button.dataset.contentFolder) {
    const id = button.closest('form')?.querySelector('[name=profile]')?.value;
    if (id) try { await window.astraDesktop.openContentFolder(id, button.dataset.contentFolder); } catch (error) { toast(humanError(error)); }
  }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id === 'curseforge-search-form') {
    event.preventDefault(); liveQuery = String(new FormData(form).get('query') || '');
    try { await window.astraDesktop.openCurseForgeWebsite(catalogType, liveQuery); } catch (error) { toast(humanError(error)); }
    return;
  }
  if (!['manual-content-form', 'manual-content-dialog-form'].includes(form.id)) return;
  event.preventDefault(); if (contentImportPending) return;
  const pack = state.packs.find(item => item.id === new FormData(form).get('profile'));
  if (!pack) return;
  const kind = form.dataset.kind, button = form.querySelector('[type=submit]'), original = button.innerHTML;
  contentImportPending = true; button.disabled = true; button.textContent = contentText('working');
  const message = form.querySelector('.content-error'); message.textContent = '';
  try {
    const result = await window.astraDesktop.importInstanceContent(structuredClone(pack), kind);
    if (!result) return;
    rememberDownloads(result.installed);
    await refreshInstalled(pack.id);
    selectedPack = pack.id; packTab = kind; modal.close(); go('pack');
    toast(`${contentText('added')}: ${result.installed.length} · ${contentText('skipped')}: ${result.skipped.length}`);
  } catch (error) { if (message.isConnected) message.textContent = humanError(error); toast(humanError(error)); }
  finally { contentImportPending = false; if (button.isConnected) { button.disabled = false; button.innerHTML = original; } }
});
