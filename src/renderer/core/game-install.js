let minecraftProgress = null;

function updateMinecraftPanel(progress) {
  const panel = document.querySelector('.minecraft-installer');
  if (!panel || panel.dataset.minecraftVersion !== progress.version) return;
  const status = panel.querySelector('.minecraft-install-status');
  const button = panel.querySelector('[data-minecraft-install]');
  const cancel = panel.querySelector('[data-minecraft-cancel]');
  const track = panel.querySelector('.minecraft-install-track');
  const percent = progress.total ? Math.round(100 * progress.done / progress.total) : 0;
  const active = ['metadata', 'downloading'].includes(progress.phase);
  status.textContent = progress.phase === 'done' ? 'Игровые файлы скачаны и проверены.'
    : progress.phase === 'downloading' ? `Скачано и проверено: ${progress.done} из ${progress.total} файлов (${percent}%).`
    : progress.phase === 'metadata' ? 'Получаем список файлов у Mojang…'
    : progress.phase === 'cancelled' ? 'Загрузка отменена. Уже скачанные файлы сохраняются.'
    : progress.phase === 'error' ? `Не удалось скачать: ${progress.error || 'проверь подключение к сети'}`
    : 'Версия ещё не скачана.';
  button.disabled = active;
  button.textContent = progress.phase === 'done' ? 'Проверить файлы' : active ? 'Загружается…' : progress.phase === 'error' ? 'Повторить загрузку' : 'Скачать Minecraft';
  cancel.hidden = !active;
  track.hidden = progress.phase !== 'downloading';
  track.firstElementChild.style.width = `${percent}%`;
}

const renderBeforeMinecraft = render;
render = function () {
  renderBeforeMinecraft();
  const panel = document.querySelector('.minecraft-installer');
  if (!panel) return;
  const version = panel.dataset.minecraftVersion;
  if (minecraftProgress?.version === version && ['metadata','downloading'].includes(minecraftProgress.phase)) {
    updateMinecraftPanel(minecraftProgress);
  } else {
    window.astraDesktop.minecraftInstallStatus(version).then(progress => {
      if (document.querySelector('.minecraft-installer')?.dataset.minecraftVersion === version && !(minecraftProgress?.version === version && ['metadata','downloading'].includes(minecraftProgress.phase))) updateMinecraftPanel(progress);
    }).catch(error => {
      updateMinecraftPanel({ version, phase: 'error', error: humanError(error) });
    });
  }
};

window.astraDesktop.onMinecraftInstallProgress(progress => {
  minecraftProgress = progress;
  updateMinecraftPanel(progress);
});

document.addEventListener('click', async event => {
  const install = event.target.closest('[data-minecraft-install]');
  const cancel = event.target.closest('[data-minecraft-cancel]');
  if (cancel) { await window.astraDesktop.cancelMinecraftInstall(); return; }
  if (!install || install.disabled) return;
  const version = install.dataset.minecraftInstall;
  minecraftProgress = { version, phase: 'metadata', done: 0, total: 0 };
  updateMinecraftPanel(minecraftProgress);
  try { await window.astraDesktop.installMinecraft(version); }
  catch (error) {
    const message = humanError(error);
    if (minecraftProgress?.phase !== 'cancelled') updateMinecraftPanel({ version, phase: 'error', error: message });
  }
});

render();
