document.documentElement.classList.add('desktop-app');
// All page modules are now loaded; render the final views before first paint.
render();
const toolbar = document.querySelector('.toolbar');
if (toolbar) {
  toolbar.innerHTML = `<button class="toolbar-notifications" type="button" data-action="notifications" aria-label="Уведомления" title="Уведомления">${icon('bell')}</button>`;
}
document.addEventListener('change', event => {
  if (event.target.name !== 'art') return;
  const form = event.target.closest('form');
  const preview = form?.querySelector('.cover-preview');
  if (preview) preview.innerHTML = art(event.target.value, `${form.id}-cover-art`);
  for (const button of form?.querySelectorAll('[data-cover-choice]') || []) {
    const selected = button.dataset.coverChoice === event.target.value;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected);
  }
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-cover-choice]');
  const select = button?.closest('form')?.querySelector('select[name=art]');
  if (!select) return;
  select.value = button.dataset.coverChoice;
  select.dispatchEvent(new Event('change', { bubbles: true }));
});
