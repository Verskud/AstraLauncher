// Animate stable containers: background refreshes must not restart the entrance.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => state.animations !== false && !motionPreference.matches;
const motionEase = 'cubic-bezier(.16,1,.3,1)';
const applyAppearanceBeforeMotion = applyAppearance;
applyAppearance = function () {
  applyAppearanceBeforeMotion();
  document.documentElement.classList.toggle('reduce-motion', !motionAllowed());
  if (!motionAllowed()) document.getAnimations().forEach(animation => { if (Number.isFinite(animation.effect?.getComputedTiming().endTime)) animation.finish(); });
};
motionPreference.addEventListener('change', () => applyAppearance());
document.addEventListener('change', event => {
  if (event.target.id !== 'interface-animations') return;
  state.animations = event.target.checked;
  save();
  applyAppearance();
});
let pageEntrance;
let motionViewKey = '';
let pageElements = [];
const entranceSelector = [
  '.page-intro', '.play-scene', '.home-feature-grid', '.section-heading',
  '.pack-grid > *', '.collection-grid > *', '.mod-grid > *',
  '.settings-panel', '.accounts-grid > *', '.server-list > *',
  '.mod-list-item', '.download-item', '.minecraft-installer', '.skin-panel', '.designed-empty',
].join(',');
function cancelPageMotion() {
  pageEntrance?.cancel();
  pageElements.forEach(animation => animation.cancel());
  pageElements = [];
}
const renderBeforeMotion = render;
render = function () {
  const key = [page, page==='pack'?selectedPack:'', page==='pack'?packTab:'', page==='settings'?settingsTab:'', page==='mods'?catalogType:''].join('|');
  renderBeforeMotion();
  if (key === motionViewKey) return;
  motionViewKey = key;
  cancelPageMotion();
  if (!motionAllowed()) return;
  const main = $('#main');
  pageEntrance = main.animate([
    { opacity: 0, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 340, easing: motionEase });
  // A short, capped cascade gives the new screen a clear entrance without
  // animating hundreds of catalog rows or restarting during background renders.
  pageElements = [...main.querySelectorAll(entranceSelector)].slice(0, 8).map((element, index) => element.animate([
    { opacity: 0, transform: 'translateY(11px) scale(.987)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' },
  ], { duration: 440, delay: index * 32, easing: motionEase }));
};
// One entrance/exit at a time. Reopening during an exit cancels the stale close.
const closeDialogImmediately = modal.close.bind(modal);
const showModalBeforeMotion = showModal;
let dialogEntrance;
let dialogExit;
let dialogCloseTimer;
modal.close = function (returnValue) {
  if (!modal.open || dialogExit) return;
  modal.dispatchEvent(new Event('astra:dialog-closing'));
  dialogEntrance?.cancel();
  if (!motionAllowed()) { closeDialogImmediately(returnValue); return; }
  dialogExit = modal.animate([
    { opacity:1,transform:'translateY(0) scale(1)' },
    { opacity:0,transform:'translateY(5px) scale(.99)' },
  ], { duration:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards' });
  const finish = () => {
    clearTimeout(dialogCloseTimer);
    closeDialogImmediately(returnValue);
    dialogExit?.cancel();
    dialogExit = null;
  };
  dialogExit.onfinish = finish;
  // Also complete if the animation clock is suspended when the window is hidden.
  dialogCloseTimer = setTimeout(finish, 240);
};
showModal = function (html) {
  clearTimeout(dialogCloseTimer);
  if (dialogExit) dialogExit.onfinish = null;
  dialogExit?.cancel();
  dialogEntrance?.cancel();
  dialogExit = null;
  const wasOpen = modal.open;
  showModalBeforeMotion(html);
  if (motionAllowed() && !wasOpen) dialogEntrance = modal.animate([
    { opacity:0,transform:'translateY(14px) scale(.965)' },
    { opacity:1,transform:'translateY(0) scale(1)' },
  ], { duration:340,easing:motionEase });
};
modal.addEventListener('cancel', event => {
  if (event.defaultPrevented) return; // An installer may have opened a confirmation.
  event.preventDefault();
  modal.close();
});
applyAppearance();
