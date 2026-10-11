// Keep interface translations independent of the project metadata returned by catalogs.
const languages = [
  ['ru', 'Русский'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'],
  ['es', 'Español'], ['ko', '한국어'], ['ja', '日本語'], ['zh-CN', '中文（简体）'],
  ['zh-TW', '國語（繁體）'], ['ar', 'العربية'], ['de-CH', 'Deutsch (Schweiz)'], ['nb', 'Norsk (bokmål)'],
];
const palettes = {
  dark: { bg: '#111113', sidebar: '#151517', panel: '#19191c', accent: '#bb9beb' },
  graphite: { bg: '#202024', sidebar: '#27272b', panel: '#2a2a2f', accent: '#d0d0d8' },
  amethyst: { bg: '#17121f', sidebar: '#1d1727', panel: '#251d31', accent: '#c5a5ee' },
  ocean: { bg: '#0e1a23', sidebar: '#12222d', panel: '#192b37', accent: '#82c4db' },
  forest: { bg: '#111b16', sidebar: '#17251d', panel: '#1e2d24', accent: '#98c8a6' },
  ember: { bg: '#211711', sidebar: '#281c16', panel: '#32241d', accent: '#e5aa84' },
  frost: { bg: '#121d25', sidebar: '#1a2a34', panel: '#223541', accent: '#b9dcec' },
  rose: { bg: '#241820', sidebar: '#301e2a', panel: '#3b2633', accent: '#e3a8c2' },
  copper: { bg: '#251b16', sidebar: '#31231b', panel: '#3d2c22', accent: '#dda676' },
  aurora: { bg: '#101e1d', sidebar: '#162b29', panel: '#1d3532', accent: '#8fd9c2' },
  slate: { bg: '#181d28', sidebar: '#202838', panel: '#293348', accent: '#a9badc' },
  sand: { bg: '#242018', sidebar: '#302a1e', panel: '#3b3426', accent: '#dbc693' },
  glass: { bg: '#151a2733', sidebar: '#1c223c66', panel: '#282f465c', accent: '#c6b4fb' },
};
const extraThemeIds = ['frost','rose','copper','aurora','slate','sand'];
const extraThemeNames = {
  ru: ['Иней','Роза','Медь','Аврора','Сланец','Песок'],
  en: ['Frost','Rose','Copper','Aurora','Slate','Sand'],
  de: ['Frost','Rose','Kupfer','Aurora','Schiefer','Sand'],
  fr: ['Givre','Rose','Cuivre','Aurore','Ardoise','Sable'],
  es: ['Escarcha','Rosa','Cobre','Aurora','Pizarra','Arena'],
  ko: ['서리','장미','구리','오로라','슬레이트','모래'],
  ja: ['霜','ローズ','銅','オーロラ','スレート','砂'],
  'zh-CN': ['霜色','玫瑰','赤铜','极光','石板','沙色'],
  'zh-TW': ['霜色','玫瑰','赤銅','極光','石板','沙色'],
  ar: ['الصقيع','الوردي','النحاسي','الشفق','الأردواز','الرمال'],
  'de-CH': ['Frost','Rose','Kupfer','Aurora','Schiefer','Sand'],
  nb: ['Frost','Rose','Kobber','Nordlys','Skifer','Sand'],
};
const words = {
  ru: {
    discover:'Открывай', library:'Мои сборки', catalog:'Каталог', downloads:'Загрузки', accounts:'Аккаунты', settings:'Настройки', myPacks:'МОИ СБОРКИ', localProfile:'Локальный профиль', support:'Поддержать Astra', connected:'Каталог подключён', preview:'Предварительная версия',
    settingsIntro:'Твоё пространство — твои привычки.', autoSave:'Сохраняется автоматически', general:'Общие', appearance:'Внешний вид', game:'Minecraft', about:'О приложении', behavior:'Поведение приложения', startPage:'Стартовый экран', startHint:'Что открывать при запуске Astra.', language:'Язык интерфейса', languageHint:'Выбери язык меню и основных экранов.', profile:'Профиль игрока', profileHint:'Имя локального профиля.', importProfile:'Импорт профиля сборки', importHint:'Перенос настроек из экспортированного файла Astra.', importAction:'Импортировать', integrations:'Подключения', keyMissing:'Для каталога CurseForge нужен API ключ.', keySaved:'Ключ сохранён в системном защищённом хранилище.', addKey:'Добавить ключ', changeKey:'Изменить ключ', clientHint:'Зарегистрируй своё приложение Microsoft для входа.', addId:'Добавить ID', changeId:'Изменить ID', integrationNote:'Ключ и токен Microsoft сохраняются зашифрованными средствами Windows. Вход Microsoft пока не запускает Minecraft.',
    yourAstra:'Твоя Astra', chooseTheme:'Выбери оформление лаунчера.', accent:'Акцент интерфейса', accentHint:'Цвет темы или сдержанный монохром.', compact:'Компактный интерфейс', compactHint:'Меньше отступов в карточках и списках.', purple:'Цвет темы', mono:'Монохром', dark:'Полночь', graphite:'Графит', amethyst:'Аметист', ocean:'Океан', forest:'Лес', ember:'Янтарь',
    officialCatalogs:'ОФИЦИАЛЬНЫЕ КАТАЛОГИ', catalogIntro:'Настоящие проекты от авторов на Modrinth и CurseForge.', refresh:'Обновить', loading:'Загружаем каталог…', more:'Показать ещё', noResults:'Проектов не нашлось. Попробуй другой запрос.', keyNeeded:'нужен ключ', mods:'моды', modpacks:'сборки', shaders:'шейдеры', resources:'ресурспаки', search:'Поиск', from:'от', projectAuthor:'автора проекта',
    homeTitle:'Открывай своё.', homeIntro:'Новые моды. Любимые миры. Всё в одном месте.', createPack:'Создать сборку', openCatalog:'Открыть каталог', explore:'Исследовать', liveCatalog:'Живой каталог модов', liveIntro:'Моды, шейдеры и сборки из официальных каталогов обновляются прямо в приложении.', libraryTitle:'Мои сборки', libraryIntro:'У каждого приключения — свой мир и свои моды.', newPack:'Новое приключение', newPackHint:'Создай сборку под себя', downloadTitle:'Загрузки', downloadIntro:'Скачанные файлы из Modrinth и CurseForge.', emptyDownloads:'Пока пусто', showFile:'Показать файл', accountTitle:'Аккаунты', accountIntro:'Управляй локальным профилем и входом Microsoft.', microsoft:'Microsoft', connect:'Подключить аккаунт', accountConnected:'Аккаунт подключён', searchPlaceholder:'Найти',
    gameTitle:'Настройки игры', memory:'Выделенная память', memoryHint:'Предпочтение для будущего запуска Minecraft.', backups:'Резервные копии', backupsHint:'Сохранять настройку для будущих обновлений сборок.', gameNote:'Запуск Minecraft и Java пока не подключён.', aboutIntro:'Пространство для новых приключений.', supportProject:'Поддержать проект', supportHint:'Помоги Astra стать лучше.', unofficial:'Неофициальный проект. Не связан с Mojang или Microsoft.',
  },
  en: {
    discover:'Discover', library:'My instances', catalog:'Catalog', downloads:'Downloads', accounts:'Accounts', settings:'Settings', myPacks:'MY INSTANCES', localProfile:'Local profile', support:'Support Astra', connected:'Catalog connected', preview:'Preview',
    settingsIntro:'Make this space yours.', autoSave:'Saved automatically', general:'General', appearance:'Appearance', game:'Minecraft', about:'About', behavior:'App behavior', startPage:'Start page', startHint:'Page to open when Astra starts.', language:'Interface language', languageHint:'Language for menus and main screens.', profile:'Player profile', profileHint:'Name of the local profile.', importProfile:'Import instance profile', importHint:'Load settings from an exported Astra file.', importAction:'Import', integrations:'Connections', keyMissing:'CurseForge requires an API key.', keySaved:'Key saved in protected system storage.', addKey:'Add key', changeKey:'Change key', clientHint:'Register your own Microsoft app to sign in.', addId:'Add ID', changeId:'Change ID', integrationNote:'The key and Microsoft token are encrypted by Windows. Microsoft sign-in does not launch Minecraft yet.',
    yourAstra:'Your Astra', chooseTheme:'Choose the launcher look.', accent:'Interface accent', accentHint:'Theme color or a quiet monochrome look.', compact:'Compact interface', compactHint:'Less space in cards and lists.', purple:'Theme color', mono:'Monochrome', dark:'Midnight', graphite:'Graphite', amethyst:'Amethyst', ocean:'Ocean', forest:'Forest', ember:'Ember',
    officialCatalogs:'OFFICIAL CATALOGS', catalogIntro:'Real projects from authors on Modrinth and CurseForge.', refresh:'Refresh', loading:'Loading catalog…', more:'Show more', noResults:'No projects found. Try another search.', keyNeeded:'API key needed', mods:'mods', modpacks:'modpacks', shaders:'shaders', resources:'resource packs', search:'Search', from:'by', projectAuthor:'project author',
    homeTitle:'Discover your world.', homeIntro:'New mods. Favorite worlds. All in one place.', createPack:'Create instance', openCatalog:'Open catalog', explore:'Explore', liveCatalog:'Live mod catalog', liveIntro:'Mods, shaders and modpacks update directly from official catalogs.', libraryTitle:'My instances', libraryIntro:'Each adventure has its own world and mods.', newPack:'New adventure', newPackHint:'Build your own instance', downloadTitle:'Downloads', downloadIntro:'Files downloaded from Modrinth and CurseForge.', emptyDownloads:'Nothing here yet', showFile:'Show file', accountTitle:'Accounts', accountIntro:'Manage your local profile and Microsoft sign-in.', microsoft:'Microsoft', connect:'Connect account', accountConnected:'Account connected', searchPlaceholder:'Find',
    gameTitle:'Game settings', memory:'Allocated memory', memoryHint:'Preference for a future Minecraft launch.', backups:'Backups', backupsHint:'Save this preference for future instance updates.', gameNote:'Minecraft and Java launching are not connected yet.', aboutIntro:'A space for new adventures.', supportProject:'Support the project', supportHint:'Help Astra grow.', unofficial:'Unofficial project. Not affiliated with Mojang or Microsoft.',
  },
  de: {
    discover:'Entdecken', library:'Meine Instanzen', catalog:'Katalog', downloads:'Downloads', accounts:'Konten', settings:'Einstellungen', myPacks:'MEINE INSTANZEN', localProfile:'Lokales Profil', support:'Astra unterstützen', connected:'Katalog verbunden', preview:'Vorschau',
    settingsIntro:'Gestalte deinen Bereich.', autoSave:'Automatisch gespeichert', general:'Allgemein', appearance:'Aussehen', game:'Minecraft', about:'Über die App', behavior:'App-Verhalten', startPage:'Startseite', startHint:'Seite beim Start von Astra.', language:'Sprache der Oberfläche', languageHint:'Sprache für Menüs und Hauptseiten.', profile:'Spielerprofil', profileHint:'Name des lokalen Profils.', importProfile:'Instanzprofil importieren', importHint:'Einstellungen aus einer Astra-Datei laden.', importAction:'Importieren', integrations:'Verbindungen', keyMissing:'CurseForge benötigt einen API-Schlüssel.', keySaved:'Schlüssel geschützt gespeichert.', addKey:'Schlüssel hinzufügen', changeKey:'Schlüssel ändern', clientHint:'Registriere eine Microsoft-App für die Anmeldung.', addId:'ID hinzufügen', changeId:'ID ändern', integrationNote:'Schlüssel und Microsoft-Token sind unter Windows verschlüsselt. Die Anmeldung startet Minecraft noch nicht.',
    yourAstra:'Dein Astra', chooseTheme:'Wähle das Design des Launchers.', accent:'Akzentfarbe', accentHint:'Designfarbe oder dezentes Monochrom.', compact:'Kompakte Oberfläche', compactHint:'Weniger Abstand in Karten und Listen.', purple:'Designfarbe', mono:'Monochrom', dark:'Mitternacht', graphite:'Graphit', amethyst:'Amethyst', ocean:'Ozean', forest:'Wald', ember:'Glut',
    officialCatalogs:'OFFIZIELLE KATALOGE', catalogIntro:'Echte Projekte von Modrinth und CurseForge.', refresh:'Aktualisieren', loading:'Katalog wird geladen…', more:'Mehr anzeigen', noResults:'Keine Projekte gefunden. Versuche eine andere Suche.', keyNeeded:'API-Schlüssel nötig', mods:'Mods', modpacks:'Modpacks', shaders:'Shader', resources:'Ressourcenpakete', search:'Suchen', from:'von', projectAuthor:'Projekt-Autor',
    homeTitle:'Entdecke deine Welt.', homeIntro:'Neue Mods. Lieblingswelten. Alles an einem Ort.', createPack:'Instanz erstellen', openCatalog:'Katalog öffnen', explore:'Entdecken', liveCatalog:'Aktueller Mod-Katalog', liveIntro:'Mods, Shader und Modpacks kommen direkt aus offiziellen Katalogen.', libraryTitle:'Meine Instanzen', libraryIntro:'Jedes Abenteuer hat eigene Welten und Mods.', newPack:'Neues Abenteuer', newPackHint:'Erstelle deine Instanz', downloadTitle:'Downloads', downloadIntro:'Dateien von Modrinth und CurseForge.', emptyDownloads:'Noch keine Downloads', showFile:'Datei anzeigen', accountTitle:'Konten', accountIntro:'Lokales Profil und Microsoft-Anmeldung verwalten.', microsoft:'Microsoft', connect:'Konto verbinden', accountConnected:'Konto verbunden', searchPlaceholder:'Finden',
    gameTitle:'Spieleinstellungen', memory:'Zugewiesener Speicher', memoryHint:'Vorgabe für den späteren Minecraft-Start.', backups:'Sicherungen', backupsHint:'Vorgabe für spätere Instanz-Updates.', gameNote:'Minecraft und Java können noch nicht gestartet werden.', aboutIntro:'Ein Ort für neue Abenteuer.', supportProject:'Projekt unterstützen', supportHint:'Hilf Astra zu wachsen.', unofficial:'Inoffizielles Projekt. Nicht mit Mojang oder Microsoft verbunden.',
  },
  fr: {
    discover:'Découvrir', library:'Mes instances', catalog:'Catalogue', downloads:'Téléchargements', accounts:'Comptes', settings:'Paramètres', myPacks:'MES INSTANCES', localProfile:'Profil local', support:'Soutenir Astra', connected:'Catalogue connecté', preview:'Aperçu',
    settingsIntro:'Un espace à votre image.', autoSave:'Enregistrement automatique', general:'Général', appearance:'Apparence', game:'Minecraft', about:'À propos', behavior:'Comportement', startPage:'Page de démarrage', startHint:'Page ouverte au lancement d’Astra.', language:'Langue de l’interface', languageHint:'Langue des menus et des pages principales.', profile:'Profil de joueur', profileHint:'Nom du profil local.', importProfile:'Importer un profil', importHint:'Charger un fichier exporté par Astra.', importAction:'Importer', integrations:'Connexions', keyMissing:'CurseForge nécessite une clé API.', keySaved:'Clé conservée dans le stockage protégé.', addKey:'Ajouter une clé', changeKey:'Modifier la clé', clientHint:'Enregistrez votre application Microsoft.', addId:'Ajouter l’ID', changeId:'Modifier l’ID', integrationNote:'La clé et le jeton Microsoft sont chiffrés par Windows. La connexion ne lance pas encore Minecraft.',
    yourAstra:'Votre Astra', chooseTheme:'Choisissez le style du lanceur.', accent:'Couleur d’accent', accentHint:'Couleur du thème ou monochrome discret.', compact:'Interface compacte', compactHint:'Moins d’espace dans les cartes et les listes.', purple:'Couleur du thème', mono:'Monochrome', dark:'Minuit', graphite:'Graphite', amethyst:'Améthyste', ocean:'Océan', forest:'Forêt', ember:'Braise',
    officialCatalogs:'CATALOGUES OFFICIELS', catalogIntro:'De vrais projets sur Modrinth et CurseForge.', refresh:'Actualiser', loading:'Chargement du catalogue…', more:'Afficher plus', noResults:'Aucun projet trouvé. Essayez une autre recherche.', keyNeeded:'clé API requise', mods:'mods', modpacks:'modpacks', shaders:'shaders', resources:'packs de ressources', search:'Recherche', from:'par', projectAuthor:'auteur du projet',
    homeTitle:'Découvrez votre monde.', homeIntro:'Nouveaux mods. Mondes favoris. Tout au même endroit.', createPack:'Créer une instance', openCatalog:'Ouvrir le catalogue', explore:'Explorer', liveCatalog:'Catalogue de mods en direct', liveIntro:'Mods, shaders et modpacks issus des catalogues officiels.', libraryTitle:'Mes instances', libraryIntro:'Chaque aventure a ses mondes et ses mods.', newPack:'Nouvelle aventure', newPackHint:'Créez votre instance', downloadTitle:'Téléchargements', downloadIntro:'Fichiers de Modrinth et CurseForge.', emptyDownloads:'Aucun téléchargement', showFile:'Afficher le fichier', accountTitle:'Comptes', accountIntro:'Gérez votre profil local et votre connexion Microsoft.', microsoft:'Microsoft', connect:'Connecter un compte', accountConnected:'Compte connecté', searchPlaceholder:'Trouver',
    gameTitle:'Paramètres du jeu', memory:'Mémoire allouée', memoryHint:'Préférence pour le futur lancement de Minecraft.', backups:'Sauvegardes', backupsHint:'Préférence pour les prochaines mises à jour.', gameNote:'Le lancement de Minecraft et Java n’est pas encore disponible.', aboutIntro:'Un espace pour de nouvelles aventures.', supportProject:'Soutenir le projet', supportHint:'Aidez Astra à grandir.', unofficial:'Projet non officiel, sans lien avec Mojang ou Microsoft.',
  },
  es: {
    discover:'Descubrir', library:'Mis instancias', catalog:'Catálogo', downloads:'Descargas', accounts:'Cuentas', settings:'Ajustes', myPacks:'MIS INSTANCIAS', localProfile:'Perfil local', support:'Apoyar a Astra', connected:'Catálogo conectado', preview:'Vista previa',
    settingsIntro:'Tu espacio, a tu manera.', autoSave:'Se guarda automáticamente', general:'General', appearance:'Apariencia', game:'Minecraft', about:'Acerca de', behavior:'Comportamiento', startPage:'Página inicial', startHint:'Página al iniciar Astra.', language:'Idioma de la interfaz', languageHint:'Idioma de los menús y pantallas principales.', profile:'Perfil de jugador', profileHint:'Nombre del perfil local.', importProfile:'Importar perfil', importHint:'Cargar ajustes de un archivo Astra.', importAction:'Importar', integrations:'Conexiones', keyMissing:'CurseForge necesita una clave API.', keySaved:'Clave guardada de forma protegida.', addKey:'Añadir clave', changeKey:'Cambiar clave', clientHint:'Registra tu propia aplicación Microsoft.', addId:'Añadir ID', changeId:'Cambiar ID', integrationNote:'Windows cifra la clave y el token Microsoft. El inicio de sesión aún no inicia Minecraft.',
    yourAstra:'Tu Astra', chooseTheme:'Elige el aspecto del launcher.', accent:'Color de acento', accentHint:'Color del tema o monocromo discreto.', compact:'Interfaz compacta', compactHint:'Menos espacio en tarjetas y listas.', purple:'Color del tema', mono:'Monocromo', dark:'Medianoche', graphite:'Grafito', amethyst:'Amatista', ocean:'Océano', forest:'Bosque', ember:'Ascua',
    officialCatalogs:'CATÁLOGOS OFICIALES', catalogIntro:'Proyectos reales en Modrinth y CurseForge.', refresh:'Actualizar', loading:'Cargando catálogo…', more:'Mostrar más', noResults:'No se encontraron proyectos. Prueba otra búsqueda.', keyNeeded:'se necesita clave API', mods:'mods', modpacks:'modpacks', shaders:'shaders', resources:'paquetes de recursos', search:'Buscar', from:'de', projectAuthor:'autor del proyecto',
    homeTitle:'Descubre tu mundo.', homeIntro:'Mods nuevos. Mundos favoritos. Todo en un lugar.', createPack:'Crear instancia', openCatalog:'Abrir catálogo', explore:'Explorar', liveCatalog:'Catálogo de mods en vivo', liveIntro:'Mods, shaders y modpacks de catálogos oficiales.', libraryTitle:'Mis instancias', libraryIntro:'Cada aventura tiene sus mundos y mods.', newPack:'Nueva aventura', newPackHint:'Crea tu instancia', downloadTitle:'Descargas', downloadIntro:'Archivos de Modrinth y CurseForge.', emptyDownloads:'Todavía no hay descargas', showFile:'Mostrar archivo', accountTitle:'Cuentas', accountIntro:'Administra tu perfil local y acceso Microsoft.', microsoft:'Microsoft', connect:'Conectar cuenta', accountConnected:'Cuenta conectada', searchPlaceholder:'Buscar',
    gameTitle:'Ajustes del juego', memory:'Memoria asignada', memoryHint:'Preferencia para el futuro inicio de Minecraft.', backups:'Copias de seguridad', backupsHint:'Preferencia para futuras actualizaciones.', gameNote:'Minecraft y Java todavía no se pueden iniciar.', aboutIntro:'Un espacio para nuevas aventuras.', supportProject:'Apoyar el proyecto', supportHint:'Ayuda a crecer a Astra.', unofficial:'Proyecto no oficial, sin relación con Mojang ni Microsoft.',
  },
  ko: {
    discover:'발견', library:'내 인스턴스', catalog:'카탈로그', downloads:'다운로드', accounts:'계정', settings:'설정', myPacks:'내 인스턴스', localProfile:'로컬 프로필', support:'Astra 후원', connected:'카탈로그 연결됨', preview:'미리 보기',
    settingsIntro:'나에게 맞는 공간으로 꾸며 보세요.', autoSave:'자동 저장', general:'일반', appearance:'외관', game:'Minecraft', about:'앱 정보', behavior:'앱 동작', startPage:'시작 화면', startHint:'Astra 실행 시 열 화면입니다.', language:'인터페이스 언어', languageHint:'메뉴와 주요 화면에 사용할 언어입니다.', profile:'플레이어 프로필', profileHint:'로컬 프로필 이름입니다.', importProfile:'인스턴스 프로필 가져오기', importHint:'Astra에서 내보낸 파일을 불러옵니다.', importAction:'가져오기', integrations:'연결', keyMissing:'CurseForge API 키가 필요합니다.', keySaved:'키가 안전하게 저장되었습니다.', addKey:'키 추가', changeKey:'키 변경', clientHint:'로그인을 위한 Microsoft 앱을 등록하세요.', addId:'ID 추가', changeId:'ID 변경', integrationNote:'키와 Microsoft 토큰은 Windows에서 암호화됩니다. 로그인만으로 Minecraft가 실행되지는 않습니다.',
    yourAstra:'나의 Astra', chooseTheme:'런처 테마를 선택하세요.', accent:'강조 색상', accentHint:'테마 색상 또는 단색을 선택하세요.', compact:'간결한 인터페이스', compactHint:'카드와 목록의 간격을 줄입니다.', purple:'테마 색상', mono:'단색', dark:'한밤', graphite:'흑연', amethyst:'자수정', ocean:'바다', forest:'숲', ember:'불씨',
    officialCatalogs:'공식 카탈로그', catalogIntro:'Modrinth와 CurseForge의 실제 프로젝트입니다.', refresh:'새로 고침', loading:'카탈로그 불러오는 중…', more:'더 보기', noResults:'프로젝트가 없습니다. 다른 검색어를 입력하세요.', keyNeeded:'API 키 필요', mods:'모드', modpacks:'모드팩', shaders:'셰이더', resources:'리소스 팩', search:'검색', from:'제작', projectAuthor:'프로젝트 제작자',
    homeTitle:'새로운 세계를 발견하세요.', homeIntro:'새 모드와 좋아하는 세계를 한곳에서.', createPack:'인스턴스 만들기', openCatalog:'카탈로그 열기', explore:'탐색', liveCatalog:'실시간 모드 카탈로그', liveIntro:'공식 카탈로그의 모드와 셰이더를 바로 확인하세요.', libraryTitle:'내 인스턴스', libraryIntro:'모험마다 고유한 세계와 모드가 있습니다.', newPack:'새 모험', newPackHint:'인스턴스를 만드세요', downloadTitle:'다운로드', downloadIntro:'Modrinth와 CurseForge에서 받은 파일입니다.', emptyDownloads:'아직 파일이 없습니다', showFile:'파일 표시', accountTitle:'계정', accountIntro:'로컬 프로필과 Microsoft 로그인을 관리하세요.', microsoft:'Microsoft', connect:'계정 연결', accountConnected:'계정 연결됨', searchPlaceholder:'찾기',
    gameTitle:'게임 설정', memory:'할당 메모리', memoryHint:'향후 Minecraft 실행에 사용할 설정입니다.', backups:'백업', backupsHint:'향후 인스턴스 업데이트를 위한 설정입니다.', gameNote:'Minecraft와 Java 실행은 아직 지원되지 않습니다.', aboutIntro:'새로운 모험을 위한 공간입니다.', supportProject:'프로젝트 후원', supportHint:'Astra의 발전을 도와주세요.', unofficial:'Mojang 또는 Microsoft와 관련 없는 비공식 프로젝트입니다.',
  },
  ja: {
    discover:'見つける', library:'マイインスタンス', catalog:'カタログ', downloads:'ダウンロード', accounts:'アカウント', settings:'設定', myPacks:'マイインスタンス', localProfile:'ローカルプロフィール', support:'Astraを支援', connected:'カタログ接続済み', preview:'プレビュー',
    settingsIntro:'自分らしい空間にしましょう。', autoSave:'自動保存', general:'一般', appearance:'外観', game:'Minecraft', about:'アプリについて', behavior:'アプリの動作', startPage:'開始ページ', startHint:'Astra起動時に開くページです。', language:'表示言語', languageHint:'メニューと主な画面の言語です。', profile:'プレイヤープロフィール', profileHint:'ローカルプロフィールの名前です。', importProfile:'インスタンスをインポート', importHint:'Astraのエクスポートファイルを読み込みます。', importAction:'インポート', integrations:'連携', keyMissing:'CurseForgeのAPIキーが必要です。', keySaved:'キーは安全に保存されています。', addKey:'キーを追加', changeKey:'キーを変更', clientHint:'サインイン用のMicrosoftアプリを登録してください。', addId:'IDを追加', changeId:'IDを変更', integrationNote:'キーとMicrosoftトークンはWindowsで暗号化されます。サインインだけではMinecraftを起動できません。',
    yourAstra:'あなたのAstra', chooseTheme:'ランチャーのテーマを選択。', accent:'アクセントカラー', accentHint:'テーマ色またはモノクロを選択。', compact:'コンパクト表示', compactHint:'カードと一覧の余白を減らします。', purple:'テーマカラー', mono:'モノクロ', dark:'ミッドナイト', graphite:'グラファイト', amethyst:'アメジスト', ocean:'オーシャン', forest:'フォレスト', ember:'エンバー',
    officialCatalogs:'公式カタログ', catalogIntro:'ModrinthとCurseForgeの実際のプロジェクト。', refresh:'更新', loading:'カタログを読み込み中…', more:'さらに表示', noResults:'見つかりませんでした。別の語句で検索してください。', keyNeeded:'APIキーが必要', mods:'MOD', modpacks:'MODパック', shaders:'シェーダー', resources:'リソースパック', search:'検索', from:'作者', projectAuthor:'プロジェクト作者',
    homeTitle:'自分の世界を見つけよう。', homeIntro:'新しいMODとお気に入りの世界を一か所に。', createPack:'インスタンスを作成', openCatalog:'カタログを開く', explore:'探す', liveCatalog:'最新MODカタログ', liveIntro:'公式カタログからMODやシェーダーを取得します。', libraryTitle:'マイインスタンス', libraryIntro:'冒険ごとに世界とMODを管理できます。', newPack:'新しい冒険', newPackHint:'インスタンスを作成', downloadTitle:'ダウンロード', downloadIntro:'ModrinthとCurseForgeから取得したファイル。', emptyDownloads:'まだありません', showFile:'ファイルを表示', accountTitle:'アカウント', accountIntro:'ローカルプロフィールとMicrosoftサインインを管理。', microsoft:'Microsoft', connect:'アカウントを接続', accountConnected:'アカウント接続済み', searchPlaceholder:'探す',
    gameTitle:'ゲーム設定', memory:'割り当てメモリ', memoryHint:'将来のMinecraft起動に使う設定です。', backups:'バックアップ', backupsHint:'今後の更新のための設定です。', gameNote:'MinecraftとJavaの起動はまだ利用できません。', aboutIntro:'新しい冒険のための空間。', supportProject:'プロジェクトを支援', supportHint:'Astraの発展にご協力ください。', unofficial:'MojangおよびMicrosoftとは無関係の非公式プロジェクトです。',
  },
  'zh-CN': {
    discover:'发现', library:'我的实例', catalog:'目录', downloads:'下载', accounts:'账户', settings:'设置', myPacks:'我的实例', localProfile:'本地档案', support:'支持 Astra', connected:'目录已连接', preview:'预览版',
    settingsIntro:'打造属于你的空间。', autoSave:'自动保存', general:'常规', appearance:'外观', game:'Minecraft', about:'关于', behavior:'应用行为', startPage:'启动页面', startHint:'启动 Astra 时打开的页面。', language:'界面语言', languageHint:'菜单和主要页面使用的语言。', profile:'玩家档案', profileHint:'本地档案名称。', importProfile:'导入实例档案', importHint:'读取 Astra 导出的文件。', importAction:'导入', integrations:'连接', keyMissing:'CurseForge 需要 API 密钥。', keySaved:'密钥已安全保存。', addKey:'添加密钥', changeKey:'更改密钥', clientHint:'请注册用于登录的 Microsoft 应用。', addId:'添加 ID', changeId:'更改 ID', integrationNote:'密钥和 Microsoft 令牌由 Windows 加密。登录后仍不能直接启动 Minecraft。',
    yourAstra:'你的 Astra', chooseTheme:'选择启动器主题。', accent:'强调色', accentHint:'选择主题颜色或单色。', compact:'紧凑界面', compactHint:'缩小卡片和列表的间距。', purple:'主题颜色', mono:'单色', dark:'午夜', graphite:'石墨', amethyst:'紫晶', ocean:'海洋', forest:'森林', ember:'余烬',
    officialCatalogs:'官方目录', catalogIntro:'来自 Modrinth 和 CurseForge 的真实项目。', refresh:'刷新', loading:'正在加载目录…', more:'显示更多', noResults:'未找到项目，请尝试其他搜索词。', keyNeeded:'需要 API 密钥', mods:'模组', modpacks:'整合包', shaders:'光影', resources:'资源包', search:'搜索', from:'作者', projectAuthor:'项目作者',
    homeTitle:'发现你的世界。', homeIntro:'新模组、熟悉的世界，尽在一处。', createPack:'创建实例', openCatalog:'打开目录', explore:'探索', liveCatalog:'实时模组目录', liveIntro:'直接查看官方目录中的模组和光影。', libraryTitle:'我的实例', libraryIntro:'每次冒险都有自己的世界和模组。', newPack:'新的冒险', newPackHint:'创建专属实例', downloadTitle:'下载', downloadIntro:'从 Modrinth 和 CurseForge 下载的文件。', emptyDownloads:'暂无下载', showFile:'显示文件', accountTitle:'账户', accountIntro:'管理本地档案和 Microsoft 登录。', microsoft:'Microsoft', connect:'连接账户', accountConnected:'账户已连接', searchPlaceholder:'查找',
    gameTitle:'游戏设置', memory:'分配内存', memoryHint:'用于未来启动 Minecraft 的设置。', backups:'备份', backupsHint:'用于未来更新实例的设置。', gameNote:'尚未支持启动 Minecraft 和 Java。', aboutIntro:'开启新冒险的空间。', supportProject:'支持项目', supportHint:'帮助 Astra 成长。', unofficial:'非官方项目，与 Mojang 或 Microsoft 无关。',
  },
  'zh-TW': {
    discover:'探索', library:'我的實例', catalog:'目錄', downloads:'下載', accounts:'帳戶', settings:'設定', myPacks:'我的實例', localProfile:'本機資料', support:'支持 Astra', connected:'目錄已連線', preview:'預覽版',
    settingsIntro:'打造自己的空間。', autoSave:'自動儲存', general:'一般', appearance:'外觀', game:'Minecraft', about:'關於', behavior:'應用程式行為', startPage:'啟動畫面', startHint:'啟動 Astra 時開啟的頁面。', language:'介面語言', languageHint:'選單與主要畫面使用的語言。', profile:'玩家資料', profileHint:'本機資料名稱。', importProfile:'匯入實例資料', importHint:'讀取 Astra 匯出的檔案。', importAction:'匯入', integrations:'連線', keyMissing:'CurseForge 需要 API 金鑰。', keySaved:'金鑰已安全儲存。', addKey:'新增金鑰', changeKey:'變更金鑰', clientHint:'請註冊用於登入的 Microsoft 應用程式。', addId:'新增 ID', changeId:'變更 ID', integrationNote:'金鑰與 Microsoft 權杖由 Windows 加密。登入後仍無法直接啟動 Minecraft。',
    yourAstra:'你的 Astra', chooseTheme:'選擇啟動器主題。', accent:'強調色', accentHint:'選擇主題色或單色。', compact:'精簡介面', compactHint:'縮小卡片與清單的間距。', purple:'主題色', mono:'單色', dark:'午夜', graphite:'石墨', amethyst:'紫晶', ocean:'海洋', forest:'森林', ember:'餘燼',
    officialCatalogs:'官方目錄', catalogIntro:'來自 Modrinth 與 CurseForge 的真實專案。', refresh:'重新整理', loading:'正在載入目錄…', more:'顯示更多', noResults:'找不到專案，請嘗試其他搜尋字詞。', keyNeeded:'需要 API 金鑰', mods:'模組', modpacks:'整合包', shaders:'光影', resources:'資源包', search:'搜尋', from:'作者', projectAuthor:'專案作者',
    homeTitle:'探索你的世界。', homeIntro:'新模組與熟悉的世界，都在這裡。', createPack:'建立實例', openCatalog:'開啟目錄', explore:'探索', liveCatalog:'即時模組目錄', liveIntro:'直接查看官方目錄中的模組與光影。', libraryTitle:'我的實例', libraryIntro:'每次冒險都有自己的世界與模組。', newPack:'新的冒險', newPackHint:'建立專屬實例', downloadTitle:'下載', downloadIntro:'從 Modrinth 與 CurseForge 下載的檔案。', emptyDownloads:'尚無下載', showFile:'顯示檔案', accountTitle:'帳戶', accountIntro:'管理本機資料與 Microsoft 登入。', microsoft:'Microsoft', connect:'連結帳戶', accountConnected:'帳戶已連結', searchPlaceholder:'尋找',
    gameTitle:'遊戲設定', memory:'配置記憶體', memoryHint:'供日後啟動 Minecraft 使用的設定。', backups:'備份', backupsHint:'供日後更新實例使用的設定。', gameNote:'目前尚未支援啟動 Minecraft 與 Java。', aboutIntro:'展開新冒險的空間。', supportProject:'支持專案', supportHint:'協助 Astra 成長。', unofficial:'非官方專案，與 Mojang 或 Microsoft 無關。',
  },
  ar: {
    discover:'اكتشف', library:'نسخي', catalog:'الكتالوج', downloads:'التنزيلات', accounts:'الحسابات', settings:'الإعدادات', myPacks:'نسخي', localProfile:'ملف محلي', support:'ادعم Astra', connected:'الكتالوج متصل', preview:'نسخة تجريبية',
    settingsIntro:'اجعل هذه المساحة تناسبك.', autoSave:'يُحفظ تلقائيًا', general:'عام', appearance:'المظهر', game:'Minecraft', about:'حول التطبيق', behavior:'سلوك التطبيق', startPage:'صفحة البداية', startHint:'الصفحة التي تُفتح عند تشغيل Astra.', language:'لغة الواجهة', languageHint:'لغة القوائم والشاشات الرئيسية.', profile:'ملف اللاعب', profileHint:'اسم الملف المحلي.', importProfile:'استيراد ملف النسخة', importHint:'تحميل ملف مصدّر من Astra.', importAction:'استيراد', integrations:'الاتصالات', keyMissing:'يتطلب CurseForge مفتاح API.', keySaved:'حُفظ المفتاح بأمان.', addKey:'إضافة مفتاح', changeKey:'تغيير المفتاح', clientHint:'سجّل تطبيق Microsoft لتسجيل الدخول.', addId:'إضافة المعرّف', changeId:'تغيير المعرّف', integrationNote:'يشفر Windows المفتاح ورمز Microsoft. تسجيل الدخول لا يشغل Minecraft بعد.',
    yourAstra:'Astra الخاص بك', chooseTheme:'اختر مظهر المشغّل.', accent:'لون التمييز', accentHint:'لون السمة أو مظهر أحادي اللون.', compact:'واجهة مدمجة', compactHint:'مسافات أقل في البطاقات والقوائم.', purple:'لون السمة', mono:'أحادي اللون', dark:'منتصف الليل', graphite:'الغرافيت', amethyst:'الجمشت', ocean:'المحيط', forest:'الغابة', ember:'الجمر',
    officialCatalogs:'كتالوجات رسمية', catalogIntro:'مشاريع حقيقية من Modrinth وCurseForge.', refresh:'تحديث', loading:'جارٍ تحميل الكتالوج…', more:'عرض المزيد', noResults:'لم يُعثر على مشاريع. جرّب بحثًا آخر.', keyNeeded:'مفتاح API مطلوب', mods:'تعديلات', modpacks:'حزم تعديلات', shaders:'مؤثرات بصرية', resources:'حزم موارد', search:'بحث', from:'بواسطة', projectAuthor:'صاحب المشروع',
    homeTitle:'اكتشف عالمك.', homeIntro:'تعديلات جديدة وعوالم مفضلة في مكان واحد.', createPack:'إنشاء نسخة', openCatalog:'فتح الكتالوج', explore:'استكشاف', liveCatalog:'كتالوج تعديلات مباشر', liveIntro:'تعديلات ومؤثرات من كتالوجات رسمية.', libraryTitle:'نسخي', libraryIntro:'لكل مغامرة عالمها وتعديلاتها.', newPack:'مغامرة جديدة', newPackHint:'أنشئ نسختك', downloadTitle:'التنزيلات', downloadIntro:'ملفات من Modrinth وCurseForge.', emptyDownloads:'لا توجد تنزيلات بعد', showFile:'عرض الملف', accountTitle:'الحسابات', accountIntro:'أدر ملفك المحلي وتسجيل دخول Microsoft.', microsoft:'Microsoft', connect:'ربط الحساب', accountConnected:'الحساب متصل', searchPlaceholder:'ابحث',
    gameTitle:'إعدادات اللعبة', memory:'الذاكرة المخصصة', memoryHint:'تفضيل لتشغيل Minecraft لاحقًا.', backups:'نسخ احتياطية', backupsHint:'تفضيل لتحديثات النسخ المستقبلية.', gameNote:'تشغيل Minecraft وJava غير متاح بعد.', aboutIntro:'مساحة لمغامرات جديدة.', supportProject:'ادعم المشروع', supportHint:'ساعد Astra على النمو.', unofficial:'مشروع غير رسمي وغير تابع لـ Mojang أو Microsoft.',
  },
  nb: {
    discover:'Utforsk', library:'Mine instanser', catalog:'Katalog', downloads:'Nedlastinger', accounts:'Kontoer', settings:'Innstillinger', myPacks:'MINE INSTANSER', localProfile:'Lokal profil', support:'Støtt Astra', connected:'Katalog tilkoblet', preview:'Forhåndsvisning',
    settingsIntro:'Gjør dette til ditt sted.', autoSave:'Lagres automatisk', general:'Generelt', appearance:'Utseende', game:'Minecraft', about:'Om appen', behavior:'Appatferd', startPage:'Startside', startHint:'Siden som åpnes når Astra starter.', language:'Grensesnittspråk', languageHint:'Språk for menyer og hovedsider.', profile:'Spillerprofil', profileHint:'Navn på lokal profil.', importProfile:'Importer instansprofil', importHint:'Last inn en eksportert Astra-fil.', importAction:'Importer', integrations:'Tilkoblinger', keyMissing:'CurseForge krever en API-nøkkel.', keySaved:'Nøkkelen er lagret sikkert.', addKey:'Legg til nøkkel', changeKey:'Endre nøkkel', clientHint:'Registrer en Microsoft-app for innlogging.', addId:'Legg til ID', changeId:'Endre ID', integrationNote:'Nøkkelen og Microsoft-tokenet krypteres av Windows. Innlogging starter ennå ikke Minecraft.',
    yourAstra:'Din Astra', chooseTheme:'Velg utseende for launcheren.', accent:'Aksentfarge', accentHint:'Temafarge eller dempet monokrom.', compact:'Kompakt grensesnitt', compactHint:'Mindre luft i kort og lister.', purple:'Temafarge', mono:'Monokrom', dark:'Midnatt', graphite:'Grafitt', amethyst:'Ametyst', ocean:'Hav', forest:'Skog', ember:'Glød',
    officialCatalogs:'OFFISIELLE KATALOGER', catalogIntro:'Ekte prosjekter fra Modrinth og CurseForge.', refresh:'Oppdater', loading:'Laster katalog…', more:'Vis flere', noResults:'Ingen prosjekter funnet. Prøv et annet søk.', keyNeeded:'API-nøkkel kreves', mods:'mods', modpacks:'modpakker', shaders:'shadere', resources:'ressurspakker', search:'Søk', from:'av', projectAuthor:'prosjektforfatter',
    homeTitle:'Utforsk din verden.', homeIntro:'Nye mods. Favorittverdener. Alt på ett sted.', createPack:'Opprett instans', openCatalog:'Åpne katalog', explore:'Utforsk', liveCatalog:'Oppdatert modkatalog', liveIntro:'Mods og shadere fra offisielle kataloger.', libraryTitle:'Mine instanser', libraryIntro:'Hvert eventyr har egne verdener og mods.', newPack:'Nytt eventyr', newPackHint:'Bygg din egen instans', downloadTitle:'Nedlastinger', downloadIntro:'Filer fra Modrinth og CurseForge.', emptyDownloads:'Ingen nedlastinger ennå', showFile:'Vis fil', accountTitle:'Kontoer', accountIntro:'Administrer lokal profil og Microsoft-innlogging.', microsoft:'Microsoft', connect:'Koble til konto', accountConnected:'Konto tilkoblet', searchPlaceholder:'Finn',
    gameTitle:'Spillinnstillinger', memory:'Tildelt minne', memoryHint:'Innstilling for fremtidig Minecraft-start.', backups:'Sikkerhetskopier', backupsHint:'Innstilling for fremtidige oppdateringer.', gameNote:'Minecraft og Java kan ikke startes ennå.', aboutIntro:'Et sted for nye eventyr.', supportProject:'Støtt prosjektet', supportHint:'Hjelp Astra å vokse.', unofficial:'Uoffisielt prosjekt, ikke tilknyttet Mojang eller Microsoft.',
  },
};
words['de-CH'] = Object.fromEntries(Object.entries(words.de).map(([key,value]) => [key,value.replaceAll('ß','ss')]));
const launchText = {
  ru: ['Java для игры загружается автоматически.', 'Для официального входа нужен Client ID приложения Microsoft.', 'Выбран', 'Выбрать', 'Одиночная игра и локальные серверы', 'Официальные серверы'],
  en: ['Java is downloaded automatically for the game.', 'Official sign-in requires a Microsoft application Client ID.', 'Selected', 'Select', 'Singleplayer and offline servers', 'Official servers'],
  de: ['Java wird für das Spiel automatisch geladen.', 'Für die Anmeldung ist eine Microsoft-Client-ID nötig.', 'Ausgewählt', 'Auswählen', 'Einzelspieler und Offline-Server', 'Offizielle Server'],
  fr: ['Java est téléchargé automatiquement pour le jeu.', 'La connexion nécessite un Client ID Microsoft.', 'Sélectionné', 'Sélectionner', 'Solo et serveurs hors ligne', 'Serveurs officiels'],
  es: ['Java se descarga automáticamente para el juego.', 'El acceso oficial requiere un Client ID de Microsoft.', 'Seleccionado', 'Seleccionar', 'Juego individual y servidores sin conexión', 'Servidores oficiales'],
  ko: ['게임에 필요한 Java를 자동으로 다운로드합니다.', '공식 로그인을 위해 Microsoft Client ID가 필요합니다.', '선택됨', '선택', '싱글 플레이와 오프라인 서버', '공식 서버'],
  ja: ['ゲーム用の Java は自動でダウンロードされます。', '公式ログインには Microsoft Client ID が必要です。', '選択中', '選択', 'シングルプレイとオフラインサーバー', '公式サーバー'],
  'zh-CN': ['游戏所需的 Java 会自动下载。', '官方登录需要 Microsoft Client ID。', '已选择', '选择', '单人游戏和离线服务器', '官方服务器'],
  'zh-TW': ['遊戲所需的 Java 會自動下載。', '官方登入需要 Microsoft Client ID。', '已選擇', '選擇', '單人遊戲與離線伺服器', '官方伺服器'],
  ar: ['يتم تنزيل Java للعبة تلقائيًا.', 'يتطلب تسجيل الدخول الرسمي معرّف تطبيق Microsoft.', 'محدد', 'اختيار', 'اللعب الفردي والخوادم غير المتصلة', 'الخوادم الرسمية'],
  'de-CH': ['Java wird für das Spiel automatisch geladen.', 'Für die Anmeldung ist eine Microsoft-Client-ID nötig.', 'Ausgewählt', 'Auswählen', 'Einzelspieler und Offline-Server', 'Offizielle Server'],
  nb: ['Java lastes ned automatisk for spillet.', 'Offisiell pålogging krever en Microsoft Client ID.', 'Valgt', 'Velg', 'Enkeltspiller og offline-servere', 'Offisielle servere'],
};
for (const [lang, [java, microsoft, selected, select, local, official]] of Object.entries(launchText)) {
  Object.assign(words[lang], { gameNote: java, integrationNote: microsoft, launchSelected: selected, launchSelect: select, localPlay: local, officialPlay: official });
}
const currentLanguage = () => languages.some(([code]) => code === state.language) ? state.language : 'ru';
const appearanceOptionsCopy = {
  ru:['Стекло','Плавные анимации','Мягкие переходы, появление окон и отклик карточек.'],
  en:['Glass','Smooth animations','Gentle transitions, dialog animations and card feedback.'],
  de:['Glas','Sanfte Animationen','Sanfte Übergänge, animierte Dialoge und Kartenreaktionen.'],
  fr:['Verre','Animations fluides','Transitions douces, fenêtres animées et réactions des cartes.'],
  es:['Cristal','Animaciones fluidas','Transiciones suaves, ventanas animadas y respuesta de las tarjetas.'],
  ko:['유리','부드러운 애니메이션','부드러운 화면 전환, 대화상자와 카드 애니메이션.'],
  ja:['ガラス','滑らかなアニメーション','画面の切り替え、ダイアログ、カードの動きを滑らかにします。'],
  'zh-CN':['玻璃','流畅动画','柔和的页面过渡、对话框动画和卡片反馈。'],
  'zh-TW':['玻璃','流暢動畫','柔和的頁面切換、對話框動畫與卡片回饋。'],
  ar:['زجاج','حركات سلسة','انتقالات لطيفة وحركة للنوافذ واستجابة البطاقات.'],
  'de-CH':['Glas','Sanfte Animationen','Sanfte Übergänge, animierte Dialoge und Kartenreaktionen.'],
  nb:['Glass','Myke animasjoner','Myke overganger, animerte dialoger og respons fra kort.'],
};
const t = key => (words[currentLanguage()] || words.en)[key] || words.en[key] || words.ru[key] || key;
const themeName = id => {
  if (id === 'glass') return (appearanceOptionsCopy[currentLanguage()] || appearanceOptionsCopy.en)[0];
  const index = extraThemeIds.indexOf(id);
  return index < 0 ? t(id) : (extraThemeNames[currentLanguage()] || extraThemeNames.en)[index];
};

const runtimeCopy = {
  ru: ['Используется при запуске выбранной сборки.', 'Astra сама скачивает подходящую Java для версии Minecraft.', 'Автоматически', 'Резервное копирование миров ещё не готово.', 'Скоро'],
  en: ['Used when launching the selected instance.', 'Astra downloads the right Java for each Minecraft version.', 'Automatic', 'World backups are not available yet.', 'Coming soon'],
  de: ['Wird beim Start der ausgewählten Instanz verwendet.', 'Astra lädt die passende Java-Version automatisch herunter.', 'Automatisch', 'Welt-Backups sind noch nicht verfügbar.', 'Demnächst'],
  fr: ['Utilisée au lancement de cette instance.', 'Astra télécharge la version de Java adaptée.', 'Automatique', 'La sauvegarde des mondes sera disponible plus tard.', 'Bientôt'],
  es: ['Se usa al iniciar la instancia seleccionada.', 'Astra descarga automáticamente la versión adecuada de Java.', 'Automático', 'Las copias de mundos aún no están disponibles.', 'Próximamente'],
  ko: ['선택한 인스턴스를 실행할 때 사용합니다.', 'Astra가 적합한 Java를 자동으로 다운로드합니다.', '자동', '월드 백업은 아직 사용할 수 없습니다.', '준비 중'],
  ja: ['選択した構成の起動時に使います。', 'Astra が適切な Java を自動でダウンロードします。', '自動', 'ワールドのバックアップは今後対応します。', '近日対応'],
  'zh-CN': ['启动所选整合包时使用。', 'Astra 会自动下载合适的 Java。', '自动', '世界备份功能尚未开放。', '即将推出'],
  'zh-TW': ['啟動所選整合包時使用。', 'Astra 會自動下載合適的 Java。', '自動', '世界備份功能尚未開放。', '即將推出'],
  ar: ['تُستخدم عند تشغيل التجميعة المحددة.', 'تنزّل Astra إصدار Java المناسب تلقائيًا.', 'تلقائي', 'النسخ الاحتياطي للعوالم غير متاح بعد.', 'قريبًا'],
  'de-CH': ['Wird beim Start der ausgewählten Instanz verwendet.', 'Astra lädt die passende Java-Version automatisch herunter.', 'Automatisch', 'Welt-Backups sind noch nicht verfügbar.', 'Demnächst'],
  nb: ['Brukes når den valgte instansen startes.', 'Astra laster automatisk ned riktig Java-versjon.', 'Automatisk', 'Sikkerhetskopiering av verdener er ikke tilgjengelig ennå.', 'Kommer snart'],
};
const backupSettingsCopy = {
  ru: ['Сохранять миры перед каждым запуском игры.', 'Хранить автоматических копий', 'Старые автокопии удаляются; ручные копии сохраняются.'],
  en: ['Back up worlds before each game launch.', 'Automatic backups to keep', 'Older automatic backups are removed; manual backups stay.'],
  de: ['Welten vor jedem Spielstart sichern.', 'Automatische Sicherungen behalten', 'Ältere automatische Sicherungen werden entfernt; manuelle bleiben erhalten.'],
  fr: ['Sauvegarder les mondes avant chaque lancement du jeu.', 'Sauvegardes automatiques à conserver', 'Les anciennes sauvegardes automatiques sont supprimées ; les manuelles restent.'],
  es: ['Guardar los mundos antes de iniciar el juego.', 'Copias automáticas que conservar', 'Se eliminan las copias automáticas antiguas; las manuales permanecen.'],
  ko: ['게임을 실행할 때마다 월드를 백업합니다.', '보관할 자동 백업 수', '오래된 자동 백업만 삭제하며 수동 백업은 유지합니다.'],
  ja: ['ゲームを起動する前に毎回ワールドをバックアップします。', '保持する自動バックアップ数', '古い自動バックアップのみ削除し、手動バックアップは残します。'],
  'zh-CN': ['每次启动游戏前备份世界。', '保留的自动备份数量', '旧的自动备份会被清理；手动备份会保留。'],
  'zh-TW': ['每次啟動遊戲前備份世界。', '保留的自動備份數量', '舊的自動備份會被清理；手動備份會保留。'],
  ar: ['أنشئ نسخة احتياطية للعوالم قبل كل تشغيل للعبة.', 'عدد النسخ التلقائية المحتفَظ بها', 'تُحذف النسخ التلقائية القديمة، وتبقى النسخ اليدوية.'],
  'de-CH': ['Welten vor jedem Spielstart sichern.', 'Automatische Sicherungen behalten', 'Ältere automatische Sicherungen werden entfernt; manuelle bleiben erhalten.'],
  nb: ['Sikkerhetskopier verdener før hver spillstart.', 'Automatiske kopier som beholdes', 'Eldre automatiske kopier slettes; manuelle kopier beholdes.'],
};
const connectionNoteCopy = {
  ru: 'Ключи и токены сохраняются в защищённом хранилище Windows. Для официальных серверов нужен Microsoft-аккаунт с Minecraft Java Edition.',
  en: 'Keys and tokens are stored in Windows protected storage. Official servers require a Microsoft account that owns Minecraft Java Edition.',
  de: 'Schlüssel und Tokens werden geschützt unter Windows gespeichert. Für offizielle Server brauchst du ein Microsoft-Konto mit Minecraft Java Edition.',
  fr: 'Les clés et jetons sont stockés dans l’espace protégé de Windows. Les serveurs officiels exigent un compte Microsoft possédant Minecraft Java Edition.',
  es: 'Las claves y los tokens se guardan en el almacenamiento protegido de Windows. Los servidores oficiales requieren una cuenta Microsoft con Minecraft Java Edition.',
  ko: '키와 토큰은 Windows의 보호된 저장소에 보관됩니다. 공식 서버에는 Minecraft Java Edition을 소유한 Microsoft 계정이 필요합니다.',
  ja: 'キーとトークンは Windows の保護されたストレージに保存されます。公式サーバーには Minecraft Java Edition を所有する Microsoft アカウントが必要です。',
  'zh-CN': '密钥和令牌保存在 Windows 受保护存储中。官方服务器需要拥有 Minecraft Java Edition 的 Microsoft 帐户。',
  'zh-TW': '金鑰與權杖儲存在 Windows 受保護的儲存空間。官方伺服器需要擁有 Minecraft Java Edition 的 Microsoft 帳戶。',
  ar: 'تُحفظ المفاتيح والرموز في مساحة تخزين Windows المحمية. تتطلب الخوادم الرسمية حساب Microsoft يمتلك Minecraft Java Edition.',
  'de-CH': 'Schlüssel und Tokens werden geschützt unter Windows gespeichert. Für offizielle Server brauchst du ein Microsoft-Konto mit Minecraft Java Edition.',
  nb: 'Nøkler og tokener lagres i beskyttet Windows-lagring. Offisielle servere krever en Microsoft-konto som eier Minecraft Java Edition.',
};
settingsPage = function () {
  const navigation = tabs([['general',t('general')],['appearance',t('appearance')],['game',t('game')],['about',t('about')]], settingsTab, 'data-settings-tab');
  const heading = `<section class="page-intro"><div><div class="eyebrow">ASTRA</div><h1>${t('settings')}</h1><p>${t('settingsIntro')}</p></div><span class="autosave">${icon('check')} ${t('autoSave')}</span></section>`;
  let content;
  if (settingsTab === 'general') {
    const languageControl = `<select id="language-choice" aria-label="${t('language')}">${languages.map(([code, name]) => `<option value="${code}" ${currentLanguage()===code?'selected':''}>${name}</option>`).join('')}</select>`;
    const startControl = `<select id="start-page" aria-label="${t('startPage')}">${[['discover',t('discover')],['library',t('library')],['mods',t('catalog')]].map(([value,label])=>`<option value="${value}" ${(state.startPage||'discover')===value?'selected':''}>${label}</option>`).join('')}</select>`;
    content = `<h2>${t('behavior')}</h2>${settingRow(t('startPage'),t('startHint'),startControl)}${settingRow(t('language'),t('languageHint'),languageControl)}${settingRow(t('importProfile'),t('importHint'),`<button class="button secondary" data-action="import">${t('importAction')}</button>`)}`;
    content += `<h2 class="integration-heading">${t('integrations')}</h2>${settingRow('CurseForge API',integrationStatus.curseforgeReady?t('keySaved'):t('keyMissing'),`<button class="button secondary" data-live-config="curseforge">${integrationStatus.curseforgeReady?t('changeKey'):t('addKey')}</button>`)}${settingRow('Microsoft Client ID',integrationStatus.microsoftClientId?esc(integrationStatus.microsoftClientId):t('clientHint'),`<button class="button secondary" data-live-config="microsoft">${integrationStatus.microsoftClientId?t('changeId'):t('addId')}</button>`)}<div class="quiet-note">${icon('info')} ${connectionNoteCopy[currentLanguage()] || connectionNoteCopy.ru}</div>`;
  } else if (settingsTab === 'appearance') {
    content = `<h2>${t('yourAstra')}</h2><p class="appearance-hint">${t('chooseTheme')}</p><div class="appearance-choices expanded">${Object.entries(palettes).map(([id,palette])=>`<button class="theme-card ${state.theme===id?'selected':''}" data-theme="${id}" aria-pressed="${state.theme===id}"><span class="theme-mini palette-mini" style="--preview-bg:${palette.bg};--preview-side:${palette.sidebar};--preview-panel:${palette.panel};--preview-accent:${palette.accent}"><i></i><b></b><em></em></span><span>${themeName(id)} ${state.theme===id?icon('check'):''}</span></button>`).join('')}</div>${settingRow(t('accent'),t('accentHint'),`<div class="segmented"><button data-accent="purple" class="${state.accent!=='mono'?'selected':''}">${t('purple')}</button><button data-accent="mono" class="${state.accent==='mono'?'selected':''}">${t('mono')}</button></div>`)}${settingRow(t('compact'),t('compactHint'),`<label class="switch"><input aria-label="${t('compact')}" type="checkbox" id="compact-ui" ${state.compact?'checked':''}><span></span></label>`)}`;
    const [,animationTitle,animationHint] = appearanceOptionsCopy[currentLanguage()] || appearanceOptionsCopy.en;
    content = settingRow(animationTitle,animationHint,`<label class="switch"><input aria-label="${animationTitle}" type="checkbox" id="interface-animations" ${state.animations!==false?'checked':''}><span></span></label>`) + content;
  } else if (settingsTab === 'game') {
    const [memoryHint, javaHint, automatic] = runtimeCopy[currentLanguage()] || runtimeCopy.ru;
    const [backupHint, retentionTitle, retentionHint] = backupSettingsCopy[currentLanguage()] || backupSettingsCopy.ru;
    const limit = [3, 5, 10].includes(Number(state.backupLimit)) ? Number(state.backupLimit) : 5;
    content = `<h2>${t('gameTitle')}</h2>${settingRow(t('memory'),memoryHint,`<div class="range-wrap"><input aria-label="${t('memory')}" type="range" id="memory" min="2" max="16" step="1" value="${state.memory}"><output id="memory-value">${state.memory} GB</output></div>`)}${settingRow('Java',javaHint,`<span class="setting-value">${automatic}</span>`)}${settingRow(t('backups'),backupHint,`<label class="switch"><input aria-label="${t('backups')}" type="checkbox" id="backups" ${state.backups!==false?'checked':''}><span></span></label>`)}${settingRow(retentionTitle,retentionHint,`<select id="backup-limit" aria-label="${retentionTitle}">${[3,5,10].map(count=>`<option value="${count}" ${limit===count?'selected':''}>${count}</option>`).join('')}</select>`)}`;
  } else {
    content = `<div class="about-brand"><img src="assets/astra-icon.png" alt="Astra"><h2>AstraLauncher</h2><span>Desktop preview · 0.9.12</span><p>${t('aboutIntro')}</p></div>${settingRow(t('supportProject'),t('supportHint'),`<button class="text-button" data-action="support">♡ ${t('support')}</button>`)}<div class="quiet-note">${icon('info')} ${t('unofficial')}</div>`;
  }
  return `${heading}${navigation}<div class="settings-panel">${content}</div>`;
};

discover = function () {
  const recent = state.packs[state.packs.length - 1];
  const recentCard = recent
    ? `<button class="home-recent" data-pack="${esc(recent.id)}">${art(recent.art,`home-${recent.id}`)}<span class="home-recent-shade"></span><span class="home-recent-copy"><small>${t('libraryTitle')}</small><strong>${esc(recent.name)}</strong><em>${esc(recent.loader)} · ${esc(recent.version)}</em></span><span class="home-recent-arrow">${icon('arrow')}</span></button>`
    : `<button class="home-recent home-recent-empty" data-action="create"><span class="home-recent-plus">+</span><span class="home-recent-copy"><small>ASTRA</small><strong>${t('newPack')}</strong><em>${t('newPackHint')}</em></span><span class="home-recent-arrow">${icon('arrow')}</span></button>`;
  return `<div class="home-page"><section class="page-intro"><div><div class="eyebrow">ASTRA LAUNCHER</div><h1>${t('homeTitle')}</h1><p>${t('homeIntro')}</p></div><button class="button secondary" data-action="create">+ <span>${t('createPack')}</span></button></section><div class="home-feature-grid"><section class="hero">${art('forest','home-hero')}<div class="hero-shade"></div><div class="hero-content"><span class="hero-kicker">✧ MODRINTH</span><h2>${t('liveCatalog')}</h2><p>${t('liveIntro')}</p><button class="button light" data-page="mods">${t('openCatalog')} ${icon('arrow')}</button></div><span class="hero-corner">ASTRA CATALOG</span></section>${recentCard}</div><div class="home-actions"><button data-page="library"><span class="quick-icon">${icon('folder')}</span><span><strong>${t('libraryTitle')}</strong><small>${t('libraryIntro')}</small></span>${icon('arrow')}</button><button data-action="import"><span class="quick-icon">${icon('down')}</span><span><strong>${t('importAction')}</strong><small>.mrpack · ASTRA</small></span>${icon('arrow')}</button><button data-page="downloads"><span class="quick-icon">${icon('down')}</span><span><strong>${t('downloadTitle')}</strong><small>${t('downloadIntro')}</small></span>${icon('arrow')}</button></div></div>`;
};
library = function () {
  return `<section class="page-intro"><div><div class="eyebrow">ASTRA</div><h1>${t('libraryTitle')}<span class="heading-count">${state.packs.length}</span></h1><p>${t('libraryIntro')}</p></div><button class="button light" data-action="create">+ ${t('createPack')}</button></section><div class="pack-grid">${state.packs.map(p=>`<article class="pack-card"><button class="pack-art" data-pack="${esc(p.id)}">${art(p.art,p.id)}<span class="pill">${esc(p.loader)} · ${esc(p.version)}</span></button><div class="pack-info"><button class="pack-title" data-pack="${esc(p.id)}">${esc(p.name)}</button><p>${installedRecordsForPack(p,'mods').length} ${t('mods')}</p><div><button class="button secondary" data-pack-settings="${esc(p.id)}">${t('settings')}</button><button class="button light compact" data-launch="${esc(p.id)}" aria-label="${esc(p.name)}" ${loaderAvailable(p.version,p.loader)?'':'disabled title="Select a compatible loader in settings"'}>${icon('play')}</button></div></div></article>`).join('')}<button class="new-pack" data-action="create"><span>+</span><strong>${t('newPack')}</strong><small>${t('newPackHint')}</small></button></div>`;
};
const libraryWithoutImport = library;
library = function () {
  const html = libraryWithoutImport();
  const label = ({ ru: 'Импортировать .mrpack', en: 'Import .mrpack', de: '.mrpack importieren', fr: 'Importer .mrpack', es: 'Importar .mrpack' })[currentLanguage()] || 'Import .mrpack';
  return html.replace('<button class="button light" data-action="create">', `<div class="row"><button class="button secondary" data-action="import">${label}</button><button class="button light" data-action="create">`).replace('</button></section><div class="pack-grid">', '</button></div></section><div class="pack-grid">');
};
catalogPage = function () {
  const kinds = [['mods',t('mods')],['modpacks',t('modpacks')],['shaders',t('shaders')],['resources',t('resources')]];
  const sources = `<div class="source-tabs"><button class="${liveSource==='modrinth'?'selected':''}" data-live-source="modrinth">Modrinth</button><button class="${liveSource==='curseforge'?'selected':''}" data-live-source="curseforge">CurseForge${integrationStatus.curseforgeReady?'':` · ${t('keyNeeded')}`}</button></div>`;
  return `<section class="page-intro"><div><div class="eyebrow">${t('officialCatalogs')}</div><h1>${t('catalog')}</h1><p>${t('catalogIntro')}</p></div><span class="subtle">${liveSource==='modrinth'?'Modrinth':'CurseForge'} API</span></section>${tabs(kinds,catalogType,'data-catalog-tab')}${sources}<div class="search-row"><label class="search">${icon('search')}<input id="live-query" type="search" aria-label="${t('search')}" placeholder="${t('searchPlaceholder')} ${t(catalogType)}…" value="${esc(liveQuery)}"></label><button class="button secondary" data-live-refresh>${t('refresh')}</button></div><div id="live-status" class="live-status">${t('loading')}</div><div id="live-results" class="mod-grid"></div><div id="live-more"></div>`;
};
const downloadActions = {
  ru: ['Открыть папку', 'Убрать из списка', 'Запись убрана из списка'],
  en: ['Open folder', 'Remove from list', 'Removed from list'],
  de: ['Ordner öffnen', 'Aus Liste entfernen', 'Aus Liste entfernt'],
  fr: ['Ouvrir le dossier', 'Retirer de la liste', 'Retiré de la liste'],
  es: ['Abrir carpeta', 'Quitar de la lista', 'Quitado de la lista'],
  ko: ['폴더 열기', '목록에서 제거', '목록에서 제거됨'],
  ja: ['フォルダーを開く', '一覧から削除', '一覧から削除しました'],
  'zh-CN': ['打开文件夹', '从列表移除', '已从列表移除'],
  'zh-TW': ['開啟資料夾', '從清單移除', '已從清單移除'],
  ar: ['فتح المجلد', 'إزالة من القائمة', 'تمت الإزالة من القائمة'],
  'de-CH': ['Ordner öffnen', 'Aus Liste entfernen', 'Aus Liste entfernt'],
  nb: ['Åpne mappe', 'Fjern fra listen', 'Fjernet fra listen'],
};
downloadsPage = function () {
  const records = Array.isArray(state.downloads) ? state.downloads : [];
  const [openFolder, forget] = downloadActions[currentLanguage()] || downloadActions.ru;
  return `<section class="page-intro"><div><div class="eyebrow">ASTRA</div><h1>${t('downloadTitle')}</h1><p>${t('downloadIntro')}</p></div><button class="button secondary" data-live-open-folder>${openFolder}</button></section>${records.length?`<div class="mod-list">${records.map((r,i)=>`<div class="mod-list-item"><span class="mod-icon" style="--mod-color:#705587">${esc((r.name||'?')[0])}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.source)} · ${esc(r.version)} · ${esc(r.filename)}</small></div><div class="download-actions"><button class="button secondary" data-live-show-file="${i}">${t('showFile')}</button><button class="text-button" data-live-forget="${i}" aria-label="${forget}: ${esc(r.name)}">${forget}</button></div></div>`).join('')}</div>`:`<div class="designed-empty"><span class="empty-symbol">${icon('down')}</span><h2>${t('emptyDownloads')}</h2><p>${t('downloadIntro')}</p><button class="button light" data-page="mods">${t('openCatalog')} ${icon('arrow')}</button></div>`}`;
};
accountsPage = function () {
  return `<section class="page-intro"><div><div class="eyebrow">ASTRA</div><h1>${t('accountTitle')}</h1><p>${t('accountIntro')}</p></div></section><div class="accounts-grid"><article class="account-card"><span class="profile-portrait">${esc(state.profile[0]?.toUpperCase()||'A')}</span><h2>${esc(state.profile)}</h2><p>${t('localProfile')}</p><span class="profile-caption">${t('localPlay')}</span><button class="button secondary full" data-action="account">${t('profile')}</button><button class="button light full" data-live-account-mode="local">${state.accountMode==='microsoft'?t('launchSelect'):t('launchSelected')}</button></article><article class="account-card microsoft-card"><span class="microsoft-symbol"><i></i><i></i><i></i><i></i></span><h2>${esc(integrationStatus.microsoftAccount || 'Microsoft')}</h2><p>${integrationStatus.microsoftAccount?t('accountConnected'):t('microsoft')}</p><span class="profile-caption">${integrationStatus.microsoftAccount?t('officialPlay'):t('integrationNote')}</span><button class="button light full" data-live-microsoft>${t('connect')}</button>${integrationStatus.microsoftAccount?`<button class="button secondary full" data-live-account-mode="microsoft">${state.accountMode==='microsoft'?t('launchSelected'):t('launchSelect')}</button><button class="text-button disconnect" data-live-disconnect>×</button>`:''}</article></div>`;
};

const previousAppearance = applyAppearance;
applyAppearance = function () {
  previousAppearance();
  for (const name of Object.keys(palettes)) document.body.classList.toggle(`theme-${name}`, state.theme === name);
  document.body.classList.toggle('themed', state.theme !== 'dark');
  document.documentElement.classList.toggle('glass-surface', state.theme === 'glass');
  const palette = palettes[state.theme] || palettes.dark;
  document.body.style.setProperty('--bg', palette.bg);
  document.body.style.setProperty('--panel', palette.panel);
  document.body.style.setProperty('--theme-sidebar', palette.sidebar);
  document.body.style.setProperty('--purple', state.accent === 'mono' ? '#d2d2db' : palette.accent);
  window.astraDesktop?.setWindowTheme?.(state.theme);
};

const baseRender = render;
render = function () {
  document.documentElement.lang = currentLanguage();
  document.documentElement.dir = currentLanguage() === 'ar' ? 'rtl' : 'ltr';
  baseRender();
  translateView();
};
const baseSearchLive = searchLive;
searchLive = async function (append = false) { await baseSearchLive(append); translateView(); };

function translateView() {
  if (currentLanguage() === 'ru') return;
  const reverse = new Map(Object.entries(words.ru).map(([key,value])=>[value,key]));
  const nodes = [$('#main'), $('#navigation'), $('#side-packs'), $('.sidebar'), $('#modal-content')].filter(Boolean);
  const seen = new Set();
  for (const root of nodes) {
    if (seen.has(root)) continue; seen.add(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const original = node.textContent.trim();
      const key = reverse.get(original);
      if (key) node.textContent = node.textContent.replace(original,t(key));
    }
    for (const element of root.querySelectorAll('[placeholder],[aria-label],[title]')) {
      for (const attribute of ['placeholder','aria-label','title']) {
        const value = element.getAttribute(attribute);
        const key = reverse.get(value);
        if (key) element.setAttribute(attribute,t(key));
      }
    }
  }
  const status = $('#live-status');
  const authorPrefix = `${words.ru.from} `;
  for (const author of document.querySelectorAll('.live-card .author')) {
    if (author.textContent.startsWith(authorPrefix)) author.textContent = `${t('from')} ${author.textContent.slice(authorPrefix.length)}`;
  }
  if (page === 'mods' && status && liveSource === 'curseforge' && !integrationStatus.curseforgeReady && status.textContent.includes('ключ')) status.innerHTML = `${t('keyMissing')} <button class="text-button" data-live-refresh>${t('refresh')}</button>`;
  if (page === 'mods' && status && liveItems.length && !status.querySelector('button')) status.textContent = `${new Intl.NumberFormat(currentLanguage()).format(liveItems.length)} / ${new Intl.NumberFormat(currentLanguage()).format(liveTotal)} · ${liveSource==='modrinth'?'Modrinth':'CurseForge'}`;
  const sidebarHeading = document.querySelector('.sidebar > .nav-label');
  if (sidebarHeading) sidebarHeading.textContent = 'ASTRA';
}

document.addEventListener('change', event => {
  if (event.target.id !== 'language-choice') return;
  state.language = event.target.value;
  save();
  render();
});
document.addEventListener('input', event => {
  if (event.target.id === 'memory' && $('#memory-value')) $('#memory-value').textContent = `${state.memory} GB`;
});
render();
