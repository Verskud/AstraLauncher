// Animate stable containers: background refreshes must not restart the entrance.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => state.animations !== false && !motionPreference.matches;
const motionEase = 'cubic-bezier(.22,1,.36,1)';
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
const renderBeforeMotion = render;
render = function () {
  const key = [page, page==='pack'?selectedPack:'', page==='pack'?packTab:'', page==='settings'?settingsTab:'', page==='mods'?catalogType:''].join('|');
  renderBeforeMotion();
  if (key === motionViewKey) return;
  motionViewKey = key;
  pageEntrance?.cancel();
  if (motionAllowed()) pageEntrance = $('#main').animate([
    { opacity: 0, transform: 'translateY(5px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 210, easing: motionEase });
};
// One entrance/exit at a time. Reopening during an exit cancels the stale close.
const closeDialogImmediately = modal.close.bind(modal);
const showModalBeforeMotion = showModal;
let dialogEntrance;
let dialogExit;
let dialogCloseTimer;
modal.close = function (returnValue) {
  if (!modal.open || dialogExit) return;
  dialogEntrance?.cancel();
  if (!motionAllowed()) { closeDialogImmediately(returnValue); return; }
  dialogExit = modal.animate([{ opacity:1,transform:'translateY(0)' },{ opacity:0,transform:'translateY(4px)' }], { duration:110,easing:'ease-out',fill:'forwards' });
  const finish = () => {
    clearTimeout(dialogCloseTimer);
    closeDialogImmediately(returnValue);
    dialogExit?.cancel();
    dialogExit = null;
  };
  dialogExit.onfinish = finish;
  // Also complete if the animation clock is suspended when the window is hidden.
  dialogCloseTimer = setTimeout(finish, 160);
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
    { opacity:0,transform:'translateY(10px) scale(.99)' },
    { opacity:1,transform:'translateY(0) scale(1)' },
  ], { duration:220,easing:motionEase });
};
modal.addEventListener('cancel', event => {
  if (event.defaultPrevented) return; // An installer may have opened a confirmation.
  event.preventDefault();
  modal.close();
});
applyAppearance();
