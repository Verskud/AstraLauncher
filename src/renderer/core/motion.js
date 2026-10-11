// Animate navigation rather than every progress update or background refresh.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => state.animations !== false && !motionPreference.matches;
const applyAppearanceBeforeMotion = applyAppearance;
applyAppearance = function () {
  applyAppearanceBeforeMotion();
  document.documentElement.classList.toggle('reduce-motion', !motionAllowed());
};
motionPreference.addEventListener('change', () => applyAppearance());
document.addEventListener('change', event => {
  if (event.target.id !== 'interface-animations') return;
  state.animations = event.target.checked;
  save();
  applyAppearance();
  if (!motionAllowed()) document.getAnimations().forEach(animation => animation.cancel());
});
function revealElements(elements) {
  if (!motionAllowed()) return;
  [...elements].slice(0,12).forEach((element,index) => element.animate([
    { opacity: .35, transform: 'translateY(9px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 270, delay: Math.min(index * 22,110), easing: 'cubic-bezier(.2,.7,.2,1)' }));
}
let motionViewKey = '';
const renderBeforeMotion = render;
render = function () {
  const key = [page, page==='pack'?selectedPack:'', page==='pack'?packTab:'', page==='settings'?settingsTab:'',page==='mods'?catalogType:''].join('|');
  renderBeforeMotion();
  if (key !== motionViewKey) {
    motionViewKey = key;
    const home = document.querySelector('.home-page');
    revealElements(home ? home.children : $('#main').children);
  }
};
const searchBeforeMotion = searchLive;
searchLive = async function (append=false) {
  const previousCount = append ? $('#live-results')?.children.length || 0 : 0;
  await searchBeforeMotion(append);
  if (page === 'mods') revealElements([...($('#live-results')?.children || [])].slice(previousCount));
};

// Keep the dialog modal throughout its exit animation and cancel stale exits on reopen.
const closeDialogImmediately = modal.close.bind(modal);
const showModalBeforeMotion = showModal;
let dialogExit = null;
let dialogCloseTimer = null;
modal.close = function (returnValue) {
  if (!modal.open || dialogExit) return;
  if (!motionAllowed()) { closeDialogImmediately(returnValue); return; }
  dialogExit = modal.animate([{ opacity:1,transform:'translateY(0) scale(1)' },{ opacity:0,transform:'translateY(6px) scale(.985)' }],{ duration:140,easing:'ease-in',fill:'forwards' });
  dialogCloseTimer = setTimeout(() => {
    closeDialogImmediately(returnValue);
    dialogExit?.cancel();
    dialogExit = null;
    dialogCloseTimer = null;
  },140);
};
showModal = function (html) {
  clearTimeout(dialogCloseTimer);
  dialogExit?.cancel();
  dialogExit = null;
  const wasOpen = modal.open;
  showModalBeforeMotion(html);
  if (motionAllowed()) (wasOpen ? $('#modal-content') : modal).animate([
    { opacity:.35,transform:wasOpen?'translateY(4px)':'translateY(12px) scale(.975)' },
    { opacity:1,transform:'translateY(0) scale(1)' },
  ],{ duration:220,easing:'cubic-bezier(.2,.7,.2,1)' });
};
modal.addEventListener('cancel',event => { event.preventDefault();modal.close(); });
applyAppearance();
revealElements(document.querySelector('.home-page')?.children || $('#main').children);
