const consoleCopy = {
  ru: ['Консоль игры','Завершить игру','Игра запущена','Подготовка запуска…','Игра завершена','Здесь появится журнал следующего запуска.','Поиск в журнале','Только ошибки','Автопрокрутка','Перенос строк','Размер шрифта','Открыть файл журнала','Принудительно завершить игру? Несохранённый прогресс может потеряться.','Завершить','Отмена','Открывать консоль','При запуске','При ошибке','Вручную','Настройки консоли','Закрыть консоль','Подготовка завершилась ошибкой','Останавливаем…'],
  en: ['Game console','Kill game','Game running','Preparing launch…','Game ended','The next launch log will appear here.','Search log','Errors only','Auto-scroll','Wrap lines','Font size','Open log file','Force quit the game? Unsaved progress may be lost.','Kill game','Cancel','Open console','On launch','On error','Manually','Console settings','Close console','Launch preparation failed','Stopping…'],
  de: ['Spielkonsole','Spiel beenden','Spiel läuft','Start wird vorbereitet…','Spiel beendet','Hier erscheint das Protokoll des nächsten Starts.','Protokoll durchsuchen','Nur Fehler','Automatisch scrollen','Zeilenumbruch','Schriftgröße','Protokolldatei öffnen','Spiel sofort beenden? Ungespeicherter Fortschritt kann verloren gehen.','Beenden','Abbrechen','Konsole öffnen','Beim Start','Bei Fehlern','Manuell','Konsoleneinstellungen','Konsole schließen','Startvorbereitung fehlgeschlagen','Wird beendet…'],
  fr: ['Console du jeu','Arrêter le jeu','Jeu en cours','Préparation du lancement…','Jeu terminé','Le journal du prochain lancement apparaîtra ici.','Rechercher dans le journal','Erreurs uniquement','Défilement automatique','Retour à la ligne','Taille du texte','Ouvrir le journal','Forcer l’arrêt du jeu ? La progression non enregistrée peut être perdue.','Arrêter','Annuler','Ouvrir la console','Au lancement','En cas d’erreur','Manuellement','Paramètres de la console','Fermer la console','Échec de la préparation','Arrêt en cours…'],
  es: ['Consola del juego','Cerrar el juego','Juego en ejecución','Preparando el inicio…','Juego cerrado','Aquí aparecerá el registro del próximo inicio.','Buscar en el registro','Solo errores','Desplazamiento automático','Ajustar líneas','Tamaño de letra','Abrir registro','¿Forzar el cierre del juego? Puedes perder el progreso sin guardar.','Cerrar el juego','Cancelar','Abrir consola','Al iniciar','Si hay un error','Manualmente','Ajustes de consola','Cerrar consola','Error al preparar el inicio','Cerrando…'],
  ko: ['게임 콘솔','게임 강제 종료','게임 실행 중','실행 준비 중…','게임 종료됨','다음 실행 로그가 여기에 표시됩니다.','로그 검색','오류만','자동 스크롤','자동 줄 바꿈','글꼴 크기','로그 파일 열기','게임을 강제 종료할까요? 저장하지 않은 진행 상황이 사라질 수 있습니다.','강제 종료','취소','콘솔 열기','실행 시','오류 발생 시','수동','콘솔 설정','콘솔 닫기','실행 준비 실패','종료 중…'],
  ja: ['ゲームコンソール','ゲームを強制終了','ゲーム実行中','起動準備中…','ゲーム終了','次回起動時のログがここに表示されます。','ログを検索','エラーのみ','自動スクロール','行の折り返し','文字サイズ','ログファイルを開く','ゲームを強制終了しますか？保存していない進行状況は失われる可能性があります。','強制終了','キャンセル','コンソールを開く','起動時','エラー時','手動','コンソール設定','コンソールを閉じる','起動準備に失敗','終了中…'],
  'zh-CN': ['游戏控制台','强制结束游戏','游戏运行中','正在准备启动…','游戏已结束','下次启动的日志将显示在这里。','搜索日志','仅显示错误','自动滚动','自动换行','字号','打开日志文件','强制结束游戏？未保存的进度可能丢失。','强制结束','取消','打开控制台','启动时','出错时','手动','控制台设置','关闭控制台','启动准备失败','正在结束…'],
  'zh-TW': ['遊戲主控台','強制結束遊戲','遊戲執行中','正在準備啟動…','遊戲已結束','下次啟動的記錄將顯示於此。','搜尋記錄','只顯示錯誤','自動捲動','自動換行','字型大小','開啟記錄檔','強制結束遊戲？未儲存的進度可能遺失。','強制結束','取消','開啟主控台','啟動時','發生錯誤時','手動','主控台設定','關閉主控台','啟動準備失敗','正在結束…'],
  ar: ['وحدة تحكم اللعبة','إنهاء اللعبة','اللعبة قيد التشغيل','جارٍ التحضير للتشغيل…','انتهت اللعبة','سيظهر سجل التشغيل التالي هنا.','البحث في السجل','الأخطاء فقط','تمرير تلقائي','التفاف الأسطر','حجم الخط','فتح ملف السجل','هل تريد إنهاء اللعبة بالقوة؟ قد تفقد التقدم غير المحفوظ.','إنهاء','إلغاء','فتح وحدة التحكم','عند التشغيل','عند حدوث خطأ','يدويًا','إعدادات وحدة التحكم','إغلاق وحدة التحكم','فشل التحضير للتشغيل','جارٍ الإنهاء…'],
  nb: ['Spillkonsoll','Avslutt spillet','Spillet kjører','Forbereder oppstart…','Spillet er avsluttet','Loggen fra neste oppstart vises her.','Søk i loggen','Bare feil','Automatisk rulling','Tekstbryting','Skriftstørrelse','Åpne loggfil','Tvangsavslutte spillet? Ulagret fremgang kan gå tapt.','Avslutt','Avbryt','Åpne konsollen','Ved oppstart','Ved feil','Manuelt','Konsollinnstillinger','Lukk konsollen','Forberedelse mislyktes','Avslutter…'],
};
const consoleText = index => (consoleCopy[currentLanguage() === 'de-CH' ? 'de' : currentLanguage()] || consoleCopy.en)[index];
let gameView = { running: false, text: '' }, launchInFlight = false, consoleLaunchError = '', consoleQuery = '', consoleErrorsOnly = false, consolePaintKey = '', consoleRequest = false;
const gameConsoleDialog = document.createElement('dialog');
gameConsoleDialog.id = 'game-console';
document.body.append(gameConsoleDialog);
const consoleMode = () => ['launch','error','manual'].includes(state.consoleMode) ? state.consoleMode : 'launch';
const consoleFont = () => Math.min(20, Math.max(11, Number(state.consoleFont) || 12));
function gameToolbar() {
  return `<button type="button" class="toolbar-console" data-game-console title="${consoleText(0)}"><span class="game-status-dot"></span><span class="console-label">${consoleText(0)}</span></button><button type="button" class="toolbar-kill" data-game-stop hidden title="${consoleText(1)}" aria-label="${consoleText(1)}">■</button>`;
}
function syncGameControls() {
  const busy = launchInFlight || gameView.preparing || gameView.running;
  for (const button of document.querySelectorAll('[data-launch]')) {
    if (busy && !button.disabled) { button.dataset.gameBusy = '1'; button.disabled = true; }
    else if (!busy && button.dataset.gameBusy) { button.disabled = false; delete button.dataset.gameBusy; }
  }
  document.querySelector('.toolbar-console')?.classList.toggle('is-running', Boolean(busy));
  const label = document.querySelector('.console-label');
  if (label) { label.textContent = consoleText(0); label.parentElement.title = consoleText(0); }
  const kill = document.querySelector('.toolbar-kill');
  if (kill) { kill.hidden = !gameView.running; kill.disabled = gameView.stopping; kill.title = consoleText(1); kill.setAttribute('aria-label', consoleText(1)); }
}
function consoleSettingsMarkup() {
  return `<h2>${consoleText(19)}</h2>${settingRow(consoleText(15),'',`<select data-console-mode aria-label="${consoleText(15)}">${['launch','error','manual'].map((mode,i) => `<option value="${mode}" ${consoleMode()===mode?'selected':''}>${consoleText(16+i)}</option>`).join('')}</select>`)}${settingRow(consoleText(10),'',`<select data-console-font aria-label="${consoleText(10)}">${[11,12,14,16,18,20].map(size => `<option ${consoleFont()===size?'selected':''}>${size}</option>`).join('')}</select>`)}`;
}
const settingsBeforeConsole = settingsPage;
settingsPage = function () {
  const html = settingsBeforeConsole();
  return settingsTab === 'game' ? html.replace(/<\/div>$/, `${consoleSettingsMarkup()}</div>`) : html;
};
const renderBeforeConsole = render;
render = function () { renderBeforeConsole(); syncGameControls(); };
function openGameConsole() {
  gameConsoleDialog.innerHTML = `<header class="console-heading"><div><h2>${consoleText(0)}</h2><div class="console-status" role="status"></div></div><button type="button" class="icon-button" data-console-close aria-label="${consoleText(20)}">${icon('close')}</button></header><div class="console-tools"><input type="search" data-console-search placeholder="${consoleText(6)}" aria-label="${consoleText(6)}" value="${esc(consoleQuery)}"><label><input type="checkbox" data-console-errors ${consoleErrorsOnly?'checked':''}>${consoleText(7)}</label><label><input type="checkbox" data-console-scroll ${state.consoleScroll!==false?'checked':''}>${consoleText(8)}</label><label><input type="checkbox" data-console-wrap ${state.consoleWrap?'checked':''}>${consoleText(9)}</label><select data-console-font aria-label="${consoleText(10)}">${[11,12,14,16,18,20].map(size=>`<option ${consoleFont()===size?'selected':''}>${size}</option>`).join('')}</select></div><pre class="console-output" tabindex="0" aria-label="${consoleText(0)}" dir="ltr"></pre><div class="console-warning" role="status" hidden></div><div class="console-confirm" hidden><p>${consoleText(12)}</p><button class="button destructive" data-console-confirm>${consoleText(13)}</button><button class="button secondary" data-console-cancel>${consoleText(14)}</button></div><footer class="console-footer"><button class="button secondary" data-console-file>${consoleText(11)}</button><button class="button destructive" data-game-stop>${consoleText(1)}</button></footer>`;
  consolePaintKey = '';
  paintGameConsole();
  if (!gameConsoleDialog.open) gameConsoleDialog.showModal();
  refreshGameView();
}
function paintGameConsole() {
  const output = gameConsoleDialog.querySelector('.console-output');
  if (!output) return;
  const pending = launchInFlight || gameView.preparing;
  gameConsoleDialog.querySelector('.console-status').textContent = [pending ? consoleText(3) : gameView.stopping ? consoleText(22) : gameView.running ? consoleText(2) : consoleLaunchError ? consoleText(21) : consoleText(4), gameView.name || '', gameView.pid ? `PID ${gameView.pid}` : '', gameView.exitCode != null ? `Exit ${gameView.exitCode}` : ''].filter(Boolean).join(' · ');
  const warning = gameConsoleDialog.querySelector('.console-warning');
  warning.hidden = !gameView.logError;
  warning.textContent = gameView.logError || '';
  const stop = gameConsoleDialog.querySelector('[data-game-stop]');
  stop.disabled = !gameView.running || gameView.stopping;
  gameConsoleDialog.querySelector('[data-console-file]').disabled = !gameView.profileId;
  const key = [gameView.sessionId,gameView.revision,consoleQuery,consoleErrorsOnly,state.consoleWrap,consoleFont(),consoleLaunchError].join('|');
  if (key === consolePaintKey) return;
  consolePaintKey = key;
  let text = consoleLaunchError || gameView.text || '';
  if (consoleQuery || consoleErrorsOnly) text = text.split('\n').filter(line => (!consoleQuery || line.toLocaleLowerCase().includes(consoleQuery.toLocaleLowerCase())) && (!consoleErrorsOnly || /error|exception|caused by:|fatal|incompatible|\bat \S+\(/i.test(line))).join('\n');
  output.textContent = text || (!gameView.text && !consoleLaunchError ? consoleText(5) : '');
  output.style.fontSize = `${consoleFont()}px`;
  output.style.whiteSpace = state.consoleWrap ? 'pre-wrap' : 'pre';
  if (state.consoleScroll !== false) output.scrollTop = output.scrollHeight;
}
async function refreshGameView() {
  if (consoleRequest || !window.astraDesktop?.gameStatus) return;
  consoleRequest = true;
  try {
    const next = gameConsoleDialog.open && window.astraDesktop.gameConsole ? await window.astraDesktop.gameConsole() : await window.astraDesktop.gameStatus();
    gameView = (launchInFlight || next.preparing || consoleLaunchError) && !next.running
      ? { preparing: launchInFlight || next.preparing, running:false, name:gameView.name, text:'' }
      : { ...gameView, ...next, preparing: Boolean(next.preparing) };
    syncGameControls();
    if (gameConsoleDialog.open) paintGameConsole();
  } catch (error) { if (gameConsoleDialog.open) { consoleLaunchError = humanError(error); paintGameConsole(); } }
  finally { consoleRequest = false; }
}
async function launchSelected(profile) {
  if (launchInFlight || gameView.preparing || gameView.running) { openGameConsole(); return; }
  launchInFlight = true; consoleLaunchError = ''; gameView = { running:false, text:'', name:profile.name };
  syncGameControls();
  if (consoleMode() === 'launch') openGameConsole();
  try {
    await window.astraDesktop.launchGame({ id:profile.id, name:profile.name, version:profile.version, loader:profile.loader, loaderVersion:profile.loaderVersion, memory:state.memory, playerName:state.profile, accountMode:['microsoft','ely'].includes(state.accountMode)?state.accountMode:'local', autoBackup:state.backups!==false, backupLimit:Number(state.backupLimit)||5 });
  } catch (error) {
    consoleLaunchError = humanError(error);
    if (consoleMode() !== 'manual') openGameConsole();
    else toast(consoleLaunchError);
  } finally { launchInFlight = false; await refreshGameView(); syncGameControls(); paintGameConsole(); }
}
function handleConsoleProgress(progress) {
  if (!['error','closed','stopped','running'].includes(progress.phase)) return false;
  if (progress.phase === 'error' && consoleMode() !== 'manual') openGameConsole();
  refreshGameView();
  if (progress.phase === 'stopped') toast(consoleText(4));
  return progress.phase === 'error' && (gameConsoleDialog.open || consoleMode() !== 'manual');
}
document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.matches('[data-game-console]')) openGameConsole();
  if (button.matches('[data-console-close]')) gameConsoleDialog.close();
  if (button.matches('[data-game-stop]')) {
    if (!gameConsoleDialog.open) openGameConsole();
    const confirm = gameConsoleDialog.querySelector('.console-confirm');
    confirm.dataset.profileId = gameView.profileId || '';
    confirm.dataset.sessionId = gameView.sessionId || '';
    confirm.hidden = false;
    gameConsoleDialog.querySelector('[data-console-cancel]').focus();
  }
  if (button.matches('[data-console-cancel]')) gameConsoleDialog.querySelector('.console-confirm').hidden = true;
  if (button.matches('[data-console-confirm]')) {
    const confirm = button.closest('.console-confirm');
    button.disabled = true;
    try { await window.astraDesktop.stopGame(confirm.dataset.profileId, confirm.dataset.sessionId); confirm.hidden = true; await refreshGameView(); }
    catch (error) { toast(humanError(error)); }
    finally { button.disabled = false; }
  }
  if (button.matches('[data-console-file]')) window.astraDesktop.openGameLog(gameView.profileId).catch(error => toast(humanError(error)));
});
document.addEventListener('input', event => {
  if (event.target.matches('[data-console-search]')) { consoleQuery = event.target.value; paintGameConsole(); }
});
document.addEventListener('change', event => {
  const input = event.target;
  if (input.matches('[data-console-errors]')) consoleErrorsOnly = input.checked;
  else if (input.matches('[data-console-scroll]')) state.consoleScroll = input.checked;
  else if (input.matches('[data-console-wrap]')) state.consoleWrap = input.checked;
  else if (input.matches('[data-console-font]')) state.consoleFont = Number(input.value);
  else if (input.matches('[data-console-mode]')) state.consoleMode = input.value;
  else return;
  save(); consolePaintKey = ''; paintGameConsole();
});
setInterval(() => { if (!document.hidden || gameView.running || launchInFlight) refreshGameView(); }, 1000);
refreshGameView();
