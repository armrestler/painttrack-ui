export function renderSettings(settings) {
  document.getElementById('owner').value = settings.owner ?? '';
  document.getElementById('repo').value = settings.repo ?? '';
  document.getElementById('branch').value = settings.branch ?? 'main';
  document.getElementById('path').value = settings.path ?? 'data.json';
  document.getElementById('token').value = settings.token ?? '';
  document.getElementById('syncOnOpen').checked = Boolean(settings.syncOnOpen);
}

export function renderSnapshot(appData, syncMeta) {
  document.getElementById('schema-version').textContent = String(appData.schemaVersion ?? '—');
  document.getElementById('revision').textContent = String(appData.revision ?? '—');
  document.getElementById('dirty-flag').textContent = syncMeta.isDirty ? 'Так' : 'Ні';
  document.getElementById('last-sync').textContent = syncMeta.lastSyncAt ? new Date(syncMeta.lastSyncAt).toLocaleString('uk-UA') : '—';
  document.getElementById('remote-sha').textContent = syncMeta.remoteSha ?? '—';
  document.getElementById('snapshot-view').textContent = JSON.stringify(appData, null, 2);

  const tbody = document.getElementById('requests-body');

  if (!appData.requests.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Поки що даних немає.</td></tr>';
    return;
  }

  tbody.innerHTML = appData.requests.map((request) => `
    <tr>
      <td>${escapeHtml(request.number)}</td>
      <td>${escapeHtml(request.customerName)}</td>
      <td>${escapeHtml(request.factoryName)}</td>
      <td>${escapeHtml(request.status)}</td>
      <td>${request.items?.length ?? 0}</td>
      <td>${new Date(request.updatedAt).toLocaleString('uk-UA')}</td>
    </tr>
  `).join('');
}

export function showStatus(message, level = 'info') {
  const status = document.getElementById('app-status');
  status.textContent = message;
  status.className = 'notice';

  if (level === 'warning') {
    status.classList.add('warning');
  }

  if (level === 'error') {
    status.classList.add('error');
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
