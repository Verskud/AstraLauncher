document.documentElement.classList.add('desktop-app');
document.addEventListener('change', event => {
  if (event.target.name !== 'art') return;
  const form = event.target.closest('form');
  const preview = form?.querySelector('.cover-preview');
  if (preview) preview.innerHTML = art(event.target.value, `${form.id}-cover-art`);
});
