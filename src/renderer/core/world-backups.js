const worldBackupCache = new Map();
const worldBackupPending = new Set();
const worldBackupErrors = new Map();

function backupDate(value) {
  try { return new Intl.DateTimeFormat(currentLanguage(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return value; }
}

function worldBackupsPanel(pack) {
  if (!worldBackupCache.has(pack.id) && !worldBackupPending.has(pack.id) && !worldBackupErrors.has(pack.id)) queueMicrotask(() => refreshWorldBackups(pack.id));
  const backups = worldBackupCache.get(pack.id) || [];
  const error = worldBackupErrors.get(pack.id);
  return `<section class="section-heading backup-heading"><div><h2>Резервные копии миров</h2><p>Копии хранятся отдельно от игровых файлов этой сборки.</p></div><button class="button light" data-backup-create="${esc(pack.id)}">Создать копию</button></section>
    <div class="row backup-folders"><button class="button secondary" data-open-worlds-folder="${esc(pack.id)}">${icon('folder')} Открыть папку миров</button><button class="button secondary" data-backup-folder="${esc(pack.id)}">${icon('folder')} Открыть папку копий</button></div>
    ${error ? `<div class="info-box">${esc(error)}</div>` : worldBackupPending.has(pack.id) && !worldBackupCache.has(pack.id) ? '<div class="designed-empty backup-empty">Загружаем копии…</div>' : backups.length ? `<div class="mod-list backup-list">${backups.map(item => `<div class="mod-list-item backup-item"><span class="mod-icon">${icon('world')}</span><div><strong>${item.mode === 'auto' ? 'Автоматическая копия' : item.mode === 'pre-restore' ? 'Перед восстановлением' : 'Ручная копия'}</strong><small>${backupDate(item.createdAt)} · ${item.worlds.length} миров · ${new Intl.NumberFormat(currentLanguage()).format(item.files)} файлов</small><small class="backup-world-names">${esc(item.worlds.join(', '))}</small></div><button class="button secondary" data-backup-restore="${esc(item.id)}" data-profile-id="${esc(pack.id)}">Восстановить</button><button class="icon-button" data-backup-remove="${esc(item.id)}" data-profile-id="${esc(pack.id)}" aria-label="Удалить копию">${icon('close')}</button></div>`).join('')}</div>` : '<div class="designed-empty backup-empty">Копий пока нет. Создай первую перед важными изменениями мира.</div>'}`;
}

async function refreshWorldBackups(profileId) {
  if (worldBackupPending.has(profileId)) return;
  worldBackupPending.add(profileId);
  try {
    worldBackupCache.set(profileId, await window.astraDesktop.listWorldBackups(profileId));
    worldBackupErrors.delete(profileId);
  } catch (error) { worldBackupErrors.set(profileId, humanError(error)); }
  finally {
    worldBackupPending.delete(profileId);
    if (page === 'pack' && packTab === 'worlds' && selectedPack === profileId) render();
  }
}

document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.packTab === 'worlds') { await refreshWorldBackups(selectedPack); return; }
  if (data.backupFolder) {
    window.astraDesktop.openWorldBackupsFolder(data.backupFolder).catch(error => toast(humanError(error)));
    return;
  }
  if (data.backupCreate) {
    button.disabled = true;
    try { await window.astraDesktop.createWorldBackup(data.backupCreate); await refreshWorldBackups(data.backupCreate); toast('Копия миров создана.'); }
    catch (error) { toast(humanError(error)); button.disabled = false; }
    return;
  }
  if (data.backupRestore) {
    showModal(`<h2>Восстановить миры из копии?</h2><p>Текущие миры этой сборки будут сохранены в отдельную защитную копию, затем заменены выбранной копией. Перед восстановлением закрой Minecraft.</p><div class="row"><button class="button secondary" data-action="close">Отмена</button><button class="button light" data-backup-confirm-restore="${esc(data.backupRestore)}" data-profile-id="${esc(data.profileId)}">Восстановить миры</button></div>`);
    return;
  }
  if (data.backupRemove) {
    showModal(`<h2>Удалить эту копию?</h2><p>Файлы этой резервной копии будут удалены. Текущие миры останутся без изменений.</p><div class="row"><button class="button secondary" data-action="close">Отмена</button><button class="button destructive" data-backup-confirm-remove="${esc(data.backupRemove)}" data-profile-id="${esc(data.profileId)}">Удалить копию</button></div>`);
    return;
  }
  if (data.backupConfirmRestore || data.backupConfirmRemove) {
    button.disabled = true;
    try {
      if (data.backupConfirmRestore) {
        await window.astraDesktop.restoreWorldBackup(data.profileId, data.backupConfirmRestore);
        toast('Миры восстановлены. Предыдущее состояние сохранено отдельной копией.');
      } else {
        await window.astraDesktop.removeWorldBackup(data.profileId, data.backupConfirmRemove);
        toast('Копия удалена.');
      }
      modal.close();
      await refreshWorldBackups(data.profileId);
    } catch (error) { toast(humanError(error)); button.disabled = false; }
  }
});
