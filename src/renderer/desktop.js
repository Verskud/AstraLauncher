document.documentElement.classList.add('desktop-app');
const toolbar = document.querySelector('.toolbar');
if (toolbar) {
  toolbar.innerHTML = `<button class="toolbar-notifications" type="button" data-action="notifications" aria-label="Уведомления" title="Уведомления">${icon('bell')}</button>`;
}
document.addEventListener('change', event => {
  if (event.target.name !== 'art') return;
  const form = event.target.closest('form');
  const preview = form?.querySelector('.cover-preview');
  if (preview) preview.innerHTML = art(event.target.value, `${form.id}-cover-art`);
});
