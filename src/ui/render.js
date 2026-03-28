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

const STATUS_OPTIONS = ['draft', 'review', 'approval', 'approved', 'in-production', 'shipped'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];

export function renderSettings(settings) {
  document.getElementById('owner').value = settings.owner ?? '';
  document.getElementById('repo').value = settings.repo ?? '';
  document.getElementById('branch').value = settings.branch ?? 'main';
  document.getElementById('path').value = settings.path ?? 'data.json';
  document.getElementById('token').value = settings.token ?? '';
  document.getElementById('syncOnOpen').checked = Boolean(settings.syncOnOpen);
}

export function renderWorkspace(appData, syncMeta, uiState, validationMessages = []) {
  const requests = Array.isArray(appData.requests) ? appData.requests : [];
  const filteredRequests = filterRequests(requests, uiState.requestFilters);
  const selectedRequest = requests.find((request) => request.id === uiState.selectedRequestId) ?? null;

  renderHeader(syncMeta, uiState.activeTab);
  renderMeta(syncMeta, appData);
  renderRequestPage(requests, filteredRequests, uiState.requestFilters, uiState.selectedRequestId);
  renderFactoriesPage(requests);
  renderRequestModal(selectedRequest, validationMessages, uiState.isRequestModalOpen);
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

function renderHeader(syncMeta, activeTab) {
  renderTabs(activeTab);

  const badge = getSyncBadge(syncMeta);
  const dot = document.getElementById('sync-dot');
  dot.className = `sync-dot ${badge.level}`;
  document.getElementById('sync-label').textContent = badge.label;
}

function renderTabs(activeTab) {
  document.querySelectorAll('.nav-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === activeTab);
  });

  document.querySelectorAll('.page').forEach((page) => {
    page.classList.toggle('active', page.id === `page-${activeTab}`);
  });
}

function renderMeta(syncMeta, appData) {
  document.getElementById('schema-version').textContent = String(appData.schemaVersion ?? '—');
  document.getElementById('revision').textContent = String(appData.revision ?? '—');
  document.getElementById('dirty-flag').textContent = syncMeta.isDirty ? 'Так' : 'Ні';
  document.getElementById('last-sync').textContent = syncMeta.lastSyncAt ? formatDateTime(syncMeta.lastSyncAt) : '—';
  document.getElementById('remote-sha').textContent = syncMeta.remoteSha ?? '—';
}

function renderRequestPage(allRequests, filteredRequests, filters, selectedRequestId) {
  renderRequestKpis(allRequests, filteredRequests);
  renderRequestFilters(allRequests, filters);
  renderRequestsTable(filteredRequests, selectedRequestId);

  document.getElementById('requests-summary').textContent = filteredRequests.length === allRequests.length
    ? `У списку ${allRequests.length} ${pluralizeUkr(allRequests.length, 'заявка', 'заявки', 'заявок')}.`
    : `Показано ${filteredRequests.length} із ${allRequests.length} заявок.`;
}

function renderRequestKpis(allRequests, filteredRequests) {
  const allItems = flattenItems(allRequests);
  const filteredItems = flattenItems(filteredRequests);
  const cards = [
    {
      label: 'Requests',
      value: formatNumber(allRequests.length),
      sub: `У фільтрі: ${formatNumber(filteredRequests.length)}`
    },
    {
      label: 'Request Items',
      value: formatNumber(allItems.length),
      sub: `У фільтрі: ${formatNumber(filteredItems.length)}`
    },
    {
      label: 'Produced Qty',
      value: formatNumber(sumItems(allItems, 'producedQty')),
      sub: `Видимі: ${formatNumber(sumItems(filteredItems, 'producedQty'))}`
    },
    {
      label: 'Shipped Qty',
      value: formatNumber(sumItems(allItems, 'shippedQty')),
      sub: `Видимі: ${formatNumber(sumItems(filteredItems, 'shippedQty'))}`
    }
  ];

  document.getElementById('request-kpis').innerHTML = cards.map((card) => `
    <article class="kpi-card">
      <div class="kpi-label">${escapeHtml(card.label)}</div>
      <div class="kpi-value">${escapeHtml(card.value)}</div>
      <div class="kpi-sub">${escapeHtml(card.sub)}</div>
    </article>
  `).join('');
}

function renderRequestFilters(requests, filters) {
  document.getElementById('filter-search').value = filters.search ?? '';

  setSelectOptions(
    document.getElementById('filter-status'),
    getUniqueValues(requests, 'status'),
    filters.status,
    'Усі статуси'
  );
  setSelectOptions(
    document.getElementById('filter-factory'),
    getUniqueValues(requests, 'factoryName'),
    filters.factory,
    'Усі заводи'
  );
  setSelectOptions(
    document.getElementById('filter-priority'),
    getUniqueValues(requests, 'priority'),
    filters.priority,
    'Усі пріоритети'
  );
}

function renderRequestsTable(requests, selectedRequestId) {
  const tbody = document.getElementById('requests-body');

  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Немає заявок, які відповідають поточним фільтрам.</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map((request) => {
    const itemCount = request.items?.length ?? 0;
    const producedQty = sumItems(request.items ?? [], 'producedQty');
    const shippedQty = sumItems(request.items ?? [], 'shippedQty');
    const priorityClass = getPriorityClass(request.priority);

    return `
      <tr class="${request.id === selectedRequestId ? 'selected-row' : ''}" data-request-id="${request.id}" tabindex="0">
        <td>
          <div class="meta-stack">
            <span class="meta-main">${escapeHtml(request.number || 'Нова заявка')}</span>
            <div class="modal-meta">
              <span class="pill ${priorityClass}">${escapeHtml(request.priority || 'без пріоритету')}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="meta-stack">
            <span class="meta-main">${escapeHtml(request.customerName || '—')}</span>
            <span class="meta-sub">${escapeHtml(request.note || 'Без примітки')}</span>
          </div>
        </td>
        <td>${escapeHtml(request.factoryName || '—')}</td>
        <td><span class="status-badge ${getStatusClassName(request.status)}">${escapeHtml(request.status || 'draft')}</span></td>
        <td>${formatNumber(itemCount)}</td>
        <td>${escapeHtml(`${formatNumber(producedQty)} / ${formatNumber(shippedQty)}`)}</td>
        <td>${escapeHtml(formatDateTime(request.updatedAt))}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="button compact secondary" data-action="open-request" data-request-id="${request.id}">Відкрити</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderFactoriesPage(requests) {
  const factories = summarizeFactories(requests);
  const cards = [
    {
      label: 'Factories',
      value: formatNumber(factories.length),
      sub: 'Групування за полем Factory'
    },
    {
      label: 'Requests',
      value: formatNumber(requests.length),
      sub: 'Загальна кількість заявок'
    },
    {
      label: 'Produced Qty',
      value: formatNumber(factories.reduce((sum, factory) => sum + factory.producedQty, 0)),
      sub: 'Сума по всіх заводах'
    },
    {
      label: 'Shipped Qty',
      value: formatNumber(factories.reduce((sum, factory) => sum + factory.shippedQty, 0)),
      sub: 'Сума по всіх заводах'
    }
  ];

  document.getElementById('factory-kpis').innerHTML = cards.map((card) => `
    <article class="kpi-card">
      <div class="kpi-label">${escapeHtml(card.label)}</div>
      <div class="kpi-value">${escapeHtml(card.value)}</div>
      <div class="kpi-sub">${escapeHtml(card.sub)}</div>
    </article>
  `).join('');

  document.getElementById('factories-summary').textContent = factories.length
    ? `${factories.length} ${pluralizeUkr(factories.length, 'завод', 'заводи', 'заводів')} з заявками в локальному стані.`
    : 'Поки що немає заявок, які можна згрупувати по Factory.';

  const tbody = document.getElementById('factories-body');
  if (!factories.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Поки що немає даних по заводах.</td></tr>';
    return;
  }

  tbody.innerHTML = factories.map((factory) => `
    <tr>
      <td>
        <div class="meta-stack">
          <span class="meta-main">${escapeHtml(factory.name)}</span>
          <span class="meta-sub">${escapeHtml(factory.statusSummary)}</span>
        </div>
      </td>
      <td>${formatNumber(factory.requestCount)}</td>
      <td>${formatNumber(factory.itemCount)}</td>
      <td>${formatNumber(factory.producedQty)}</td>
      <td>${formatNumber(factory.shippedQty)}</td>
      <td>${factory.statuses.map((status) => `<span class="status-badge ${getStatusClassName(status)}">${escapeHtml(status)}</span>`).join(' ')}</td>
    </tr>
  `).join('');
}

function renderRequestModal(request, validationMessages, isOpen) {
  const modal = document.getElementById('request-modal');
  const content = document.getElementById('request-modal-content');

  if (!isOpen || !request) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    content.innerHTML = '';
    document.body.classList.remove('modal-open');
    return;
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  content.innerHTML = `
    <div class="modal-inner">
      <div class="modal-header">
        <div>
          <div id="request-modal-title" class="modal-title">${escapeHtml(request.number || 'Нова заявка')}</div>
          <p class="modal-subtitle">Редактор Request. Зміни зберігаються локально одразу і входять у наявний sync flow.</p>
        </div>
        <div class="modal-header-actions">
          <span class="status-badge ${getStatusClassName(request.status)}">${escapeHtml(request.status || 'draft')}</span>
          <span class="pill ${getPriorityClass(request.priority)}">${escapeHtml(request.priority || 'без пріоритету')}</span>
          <button type="button" class="button ghost" data-action="close-modal">Закрити</button>
        </div>
      </div>

      ${renderValidationMessages(validationMessages)}

      <section class="modal-section surface">
        <div class="modal-section-header">
          <div>
            <h3>Request Details</h3>
            <p class="muted-text">Request-level поля без зміни data contract поза optional fields note і priority.</p>
          </div>
          <div class="modal-meta">
            <span class="pill">Створено: ${escapeHtml(formatDateTime(request.createdAt))}</span>
            <span class="pill">Оновлено: ${escapeHtml(formatDateTime(request.updatedAt))}</span>
          </div>
        </div>

        <div class="modal-grid">
          ${renderTextField('Номер', 'number', request.number ?? '')}
          ${renderTextField('Клієнт', 'customerName', request.customerName ?? '')}
          ${renderTextField('Factory', 'factoryName', request.factoryName ?? '')}
          ${renderStatusField(request.status ?? 'draft')}
          ${renderPriorityField(request.priority ?? '')}
          ${renderTextareaField('Примітка', 'note', request.note ?? '')}
        </div>
      </section>

      <section class="modal-section surface">
        <div class="modal-section-header">
          <div>
            <h3>Request Items</h3>
            <p class="muted-text">Supporting Materials ще не входять у цей етап, але структура item уже редагується.</p>
          </div>
          <button type="button" class="button secondary" data-action="add-item" data-request-id="${request.id}">Додати Request Item</button>
        </div>

        <div class="table-shell">
          <table class="data-table items-table">
            <thead>
              <tr>
                ${ITEM_COLUMNS.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${renderItemRows(request)}
            </tbody>
          </table>
        </div>
      </section>

      <div class="modal-footer">
        <p class="muted-text">GitHub sync не змінювався: header action як і раніше пушить локальний стан у data repo.</p>
        <button type="button" class="button ghost" data-action="close-modal">Готово</button>
      </div>
    </div>
  `;
}

function renderItemRows(request) {
  if (!request.items.length) {
    return '<tr><td colspan="12" class="empty">У цьому Request ще немає позицій.</td></tr>';
  }

  return request.items.map((item, index) => `
    <tr>
      ${ITEM_COLUMNS.map((column) => `<td>${renderItemInput(request.id, item, column)}</td>`).join('')}
      <td>
        <div class="row-actions">
          <button
            type="button"
            class="button compact danger"
            data-action="delete-item"
            data-request-id="${request.id}"
            data-item-id="${item.id}"
            aria-label="Видалити позицію ${index + 1}"
          >
            Видалити
          </button>
        </div>
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
        class="table-input"
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

function renderTextField(label, field, value) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input class="control" type="text" value="${escapeAttribute(value)}" data-request-field="${field}" />
    </label>
  `;
}

function renderTextareaField(label, field, value) {
  return `
    <label class="field modal-grid-wide">
      <span>${escapeHtml(label)}</span>
      <textarea class="control" rows="4" data-request-field="${field}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderStatusField(currentValue) {
  const options = ensureCurrentOption(STATUS_OPTIONS, currentValue).map((value) => `
    <option value="${escapeAttribute(value)}"${value === currentValue ? ' selected' : ''}>${escapeHtml(value)}</option>
  `).join('');

  return `
    <label class="field">
      <span>Статус</span>
      <select class="control" data-request-field="status">
        ${options}
      </select>
    </label>
  `;
}

function renderPriorityField(currentValue) {
  const options = [''].concat(ensureCurrentOption(PRIORITY_OPTIONS, currentValue).filter((value) => value !== '')).map((value) => `
    <option value="${escapeAttribute(value)}"${value === currentValue ? ' selected' : ''}>${escapeHtml(value || 'без пріоритету')}</option>
  `).join('');

  return `
    <label class="field">
      <span>Пріоритет</span>
      <select class="control" data-request-field="priority">
        ${options}
      </select>
    </label>
  `;
}

function renderValidationMessages(validationMessages) {
  if (!validationMessages.length) {
    return '<div class="validation-box ok"><strong>Validation:</strong> критичних помилок по Request Items не знайдено.</div>';
  }

  return `
    <div class="validation-box">
      <strong>Потрібно виправити:</strong>
      <ul class="validation-list">
        ${validationMessages.map((message) => `<li>${escapeHtml(message.itemLabel)}: ${escapeHtml(message.message)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function setSelectOptions(select, options, selectedValue, defaultLabel) {
  const safeSelectedValue = options.includes(selectedValue) ? selectedValue : 'all';
  select.innerHTML = [
    `<option value="all">${escapeHtml(defaultLabel)}</option>`,
    ...options.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`)
  ].join('');
  select.value = safeSelectedValue;
}

function getSyncBadge(syncMeta) {
  if (syncMeta.isDirty) {
    return { level: 'warning', label: 'Локальні зміни ще не синхронізовано' };
  }

  if (syncMeta.lastSyncAt) {
    return { level: 'ok', label: `Останній sync: ${formatDateTime(syncMeta.lastSyncAt)}` };
  }

  return { level: 'idle', label: 'Працює локально до першого sync' };
}

function filterRequests(requests, filters) {
  const search = (filters.search ?? '').trim().toLowerCase();

  return requests.filter((request) => {
    if (filters.status !== 'all' && (request.status ?? '') !== filters.status) {
      return false;
    }

    if (filters.factory !== 'all' && (request.factoryName ?? '') !== filters.factory) {
      return false;
    }

    if (filters.priority !== 'all' && (request.priority ?? '') !== filters.priority) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      request.number,
      request.customerName,
      request.factoryName,
      request.status,
      request.priority,
      request.note,
      ...(request.items ?? []).flatMap((item) => [item.name, item.barcode, item.packaging])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
}

function summarizeFactories(requests) {
  const groups = new Map();

  requests.forEach((request) => {
    const name = request.factoryName?.trim() || 'Без заводу';
    const current = groups.get(name) ?? {
      name,
      requestCount: 0,
      itemCount: 0,
      producedQty: 0,
      shippedQty: 0,
      statuses: new Set()
    };

    current.requestCount += 1;
    current.itemCount += request.items?.length ?? 0;
    current.producedQty += sumItems(request.items ?? [], 'producedQty');
    current.shippedQty += sumItems(request.items ?? [], 'shippedQty');
    current.statuses.add(request.status ?? 'draft');
    groups.set(name, current);
  });

  return Array.from(groups.values())
    .map((factory) => ({
      ...factory,
      statuses: Array.from(factory.statuses),
      statusSummary: Array.from(factory.statuses).join(', ')
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'uk'));
}

function getUniqueValues(requests, field) {
  return Array.from(new Set(requests
    .map((request) => String(request[field] ?? '').trim())
    .filter(Boolean)))
    .sort((left, right) => left.localeCompare(right, 'uk'));
}

function flattenItems(requests) {
  return requests.flatMap((request) => request.items ?? []);
}

function sumItems(items, field) {
  return items.reduce((sum, item) => sum + Number(item[field] ?? 0), 0);
}

function ensureCurrentOption(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [...options, currentValue];
}

function getStatusClassName(status) {
  return `status-${String(status ?? 'draft').toLowerCase().replace(/\s+/g, '-')}`;
}

function getPriorityClass(priority) {
  return priority ? `priority-${String(priority).toLowerCase()}` : '';
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('uk-UA');
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('uk-UA');
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

function pluralizeUkr(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
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
