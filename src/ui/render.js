const ITEM_COLUMNS = [
  { field: 'barcode', label: 'Barcode', type: 'text' },
  { field: 'name', label: 'Назва', type: 'text' },
  { field: 'packaging', label: 'Пакування', type: 'text' },
  { field: 'capacity', label: 'Обʼєм', type: 'number', step: '0.01' },
  { field: 'quantity', label: 'Кількість', type: 'number', step: '0.01' },
  { field: 'unit', label: 'Од.', type: 'text' },
  { field: 'weight', label: 'Вага', type: 'number', step: '0.01' },
  { field: 'processingPrice', label: 'Ціна переробки', type: 'number', step: '0.01' },
  { field: 'desiredDate', label: 'Desired Date', type: 'date' },
  { field: 'producedQty', label: 'Produced Qty', type: 'number', step: '0.01' },
  { field: 'shippedQty', label: 'Shipped Qty', type: 'number', step: '0.01' }
];

export function renderSettings(settings) {
  document.getElementById('owner').value = settings.owner ?? '';
  document.getElementById('repo').value = settings.repo ?? '';
  document.getElementById('branch').value = settings.branch ?? 'main';
  document.getElementById('path').value = settings.path ?? 'data.json';
  document.getElementById('token').value = settings.token ?? '';
  document.getElementById('syncOnOpen').checked = Boolean(settings.syncOnOpen);
}

export function renderWorkspace(appData, syncMeta, selectedRequestId, validationMessages = []) {
  renderSnapshotMeta(appData, syncMeta);
  renderRequestsTable(appData.requests, selectedRequestId);
  renderRequestDetails(appData.requests.find((request) => request.id === selectedRequestId) ?? null, validationMessages);
  document.getElementById('snapshot-view').textContent = JSON.stringify(appData, null, 2);
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

function renderSnapshotMeta(appData, syncMeta) {
  document.getElementById('schema-version').textContent = String(appData.schemaVersion ?? '—');
  document.getElementById('revision').textContent = String(appData.revision ?? '—');
  document.getElementById('dirty-flag').textContent = syncMeta.isDirty ? 'Так' : 'Ні';
  document.getElementById('last-sync').textContent = syncMeta.lastSyncAt ? new Date(syncMeta.lastSyncAt).toLocaleString('uk-UA') : '—';
  document.getElementById('remote-sha').textContent = syncMeta.remoteSha ?? '—';
}

function renderRequestsTable(requests, selectedRequestId) {
  const tbody = document.getElementById('requests-body');

  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Поки що даних немає.</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map((request) => `
    <tr class="${request.id === selectedRequestId ? 'selected-row' : ''}" data-request-id="${request.id}" tabindex="0">
      <td>${escapeHtml(request.number || '—')}</td>
      <td>${escapeHtml(request.customerName || '—')}</td>
      <td>${escapeHtml(request.factoryName || '—')}</td>
      <td>${escapeHtml(request.status || '—')}</td>
      <td>${request.items?.length ?? 0}</td>
      <td>${new Date(request.updatedAt).toLocaleString('uk-UA')}</td>
    </tr>
  `).join('');
}

function renderRequestDetails(request, validationMessages) {
  const container = document.getElementById('request-details');

  if (!request) {
    container.innerHTML = `
      <div class="editor-empty">
        <h3>Немає вибраної заявки</h3>
        <p class="muted">Створи нову заявку або вибери існуючу з таблиці, щоб відкрити редактор.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <section class="editor-card">
      <div class="section-head">
        <div>
          <h3>${escapeHtml(request.number || 'Нова заявка')}</h3>
          <p class="muted">Оновлено ${new Date(request.updatedAt).toLocaleString('uk-UA')}</p>
        </div>
        <div class="badge-row">
          <span class="badge">${escapeHtml(request.status || 'draft')}</span>
          <span class="badge secondary">${escapeHtml(request.priority || 'без пріоритету')}</span>
        </div>
      </div>

      ${renderValidationMessages(validationMessages)}

      <div class="editor-grid">
        ${renderField('Номер', 'number', request.number ?? '')}
        ${renderField('Клієнт', 'customerName', request.customerName ?? '')}
        ${renderField('Завод', 'factoryName', request.factoryName ?? '')}
        ${renderField('Статус', 'status', request.status ?? '')}
        ${renderField('Пріоритет / sequence', 'priority', request.priority ?? '')}
        ${renderTextarea('Примітка', 'note', request.note ?? '')}
      </div>
    </section>

    <section class="editor-card">
      <div class="section-head">
        <div>
          <h3>Request Items</h3>
          <p class="muted">Перший робочий редактор без Supporting Materials.</p>
        </div>
        <button type="button" data-action="add-item" data-request-id="${request.id}">Додати позицію</button>
      </div>

      <div class="table-wrap items-table-wrap">
        <table class="items-table">
          <thead>
            <tr>
              ${ITEM_COLUMNS.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${renderItemsRows(request)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderItemsRows(request) {
  if (!request.items.length) {
    return '<tr><td colspan="12" class="empty">У цій заявці ще немає позицій.</td></tr>';
  }

  return request.items.map((item, index) => `
    <tr>
      ${ITEM_COLUMNS.map((column) => `<td>${renderItemInput(request.id, item, column)}</td>`).join('')}
      <td class="row-actions">
        <button
          type="button"
          class="secondary compact-button"
          data-action="delete-item"
          data-request-id="${request.id}"
          data-item-id="${item.id}"
          aria-label="Видалити позицію ${index + 1}"
        >
          Видалити
        </button>
      </td>
    </tr>
  `).join('');
}

function renderItemInput(requestId, item, column) {
  const value = formatInputValue(item[column.field], column.type);
  const min = column.type === 'number' ? ' min="0"' : '';
  const step = column.step ? ` step="${column.step}"` : '';

  return `
    <label class="table-input-label">
      <span class="sr-only">${escapeHtml(column.label)}</span>
      <input
        type="${column.type}"
        value="${escapeAttribute(value)}"
        ${min}${step}
        data-request-id="${requestId}"
        data-item-id="${item.id}"
        data-item-field="${column.field}"
      />
    </label>
  `;
}

function renderField(label, field, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <input type="text" value="${escapeAttribute(value)}" data-request-field="${field}" />
    </label>
  `;
}

function renderTextarea(label, field, value) {
  return `
    <label class="editor-grid-wide">
      <span>${escapeHtml(label)}</span>
      <textarea rows="4" data-request-field="${field}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderValidationMessages(validationMessages) {
  if (!validationMessages.length) {
    return `
      <div class="validation-box ok">
        <strong>Перевірка позицій:</strong> помилок не знайдено.
      </div>
    `;
  }

  return `
    <div class="validation-box">
      <strong>Потрібно виправити:</strong>
      <ul class="validation-list">
        ${validationMessages.map((message) => (
          `<li>${escapeHtml(message.itemLabel)}: ${escapeHtml(message.message)}</li>`
        )).join('')}
      </ul>
    </div>
  `;
}

function formatInputValue(value, type) {
  if (value === null || value === undefined) {
    return '';
  }

  if (type === 'date') {
    return String(value).slice(0, 10);
  }

  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('\n', '&#10;');
}
