document.documentElement.classList.add('desktop-app');
document.addEventListener('click', event => {
  const control = event.target.closest('[data-window]');
  if (!control || !window.astraDesktop) return;
  const action = control.dataset.window;
  if (['minimize','maximize','close'].includes(action)) window.astraDesktop[action]();
});
