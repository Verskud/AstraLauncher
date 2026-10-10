let minecraftProgress = null;

function updateMinecraftPanel(progress) {
  const panel = document.querySelector('.minecraft-installer');
  if (!panel || panel.dataset.minecraftVersion !== progress.version) return;
  const status = panel.querySelector('.minecraft-install-status');
  const button = panel.querySelector('[data-minecraft-install]');
  const cancel = panel.querySelector('[data-minecraft-cancel]');
  const track = panel.querySelector('.minecraft-install-track');
  const percent = progress.total ? Math.round(100 * progress.done / progress.total) : 0;
  const active = ['metadata', 'downloading', 'removing'].includes(progress.phase);
  status.textContent = progress.phase === 'done' ? 'Игровые файлы скачаны и проверены.'
    : progress.phase === 'downloading' ? `Скачано и проверено: ${progress.done} из ${progress.total} файлов (${percent}%).`
    : progress.phase === 'metadata' ? 'Получаем список файлов у Mojang…'
    : progress.phase === 'removing' ? 'Удаляем скачанные файлы этой версии…'
    : progress.phase === 'cancelled' ? 'Загрузка отменена. Файлы этой версии удалены.'
    : progress.phase === 'error' ? `Не удалось скачать: ${progress.error || 'проверь подключение к сети'}`
    : 'Версия ещё не скачана.';
  button.disabled = active;
  button.textContent = progress.phase === 'done' ? 'Проверить файлы' : active ? 'Загружается…' : progress.phase === 'error' ? 'Повторить загрузку' : 'Скачать Minecraft';
  cancel.hidden = !['metadata', 'downloading'].includes(progress.phase);
  track.hidden = progress.phase !== 'downloading';
  track.firstElementChild.style.width = `${percent}%`;
}

const renderBeforeMinecraft = render;
render = function () {
  renderBeforeMinecraft();
  const panel = document.querySelector('.minecraft-installer');
  if (!panel) return;
  const version = panel.dataset.minecraftVersion;
  if (minecraftProgress?.version === version && ['metadata','downloading','removing'].includes(minecraftProgress.phase)) {
    updateMinecraftPanel(minecraftProgress);
  } else {
    window.astraDesktop.minecraftInstallStatus(version).then(progress => {
      if (document.querySelector('.minecraft-installer')?.dataset.minecraftVersion === version && !(minecraftProgress?.version === version && ['metadata','downloading','removing'].includes(minecraftProgress.phase))) updateMinecraftPanel(progress);
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
  if (cancel) {
    const version = cancel.closest('.minecraft-installer')?.dataset.minecraftVersion;
    if (version) showModal(`<span class="modal-mark">${icon('info')}</span><h2>Отменить загрузку Minecraft ${esc(version)}?</h2><p>Все уже скачанные файлы этой версии будут удалены. Файлы других установленных версий сохранятся.</p><div class="row"><button class="button secondary" data-action="close">Продолжить загрузку</button><button class="button destructive" data-minecraft-confirm-cancel="${esc(version)}">Отменить и удалить</button></div>`);
    return;
  }
  const confirm = event.target.closest('[data-minecraft-confirm-cancel]');
  if (confirm) {
    const version = confirm.dataset.minecraftConfirmCancel;
    modal.close();
    minecraftProgress = { version, phase: 'removing', done: 0, total: 0 };
    updateMinecraftPanel(minecraftProgress);
    try {
      const cancelled = await window.astraDesktop.cancelMinecraftInstall();
      if (!cancelled) updateMinecraftPanel(await window.astraDesktop.minecraftInstallStatus(version));
    } catch (error) { updateMinecraftPanel({ version, phase: 'error', error: humanError(error) }); }
    return;
  }
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
refreshInstalledAll();
window.addEventListener('focus', refreshInstalledAll);

window.astraDesktop.onGameProgress(progress => {
  if (progress.phase === 'java' || progress.phase === 'loader' || progress.phase === 'starting') toast(progress.message);
  else if (progress.phase === 'error' || progress.phase === 'closed') toast(progress.message);
});
