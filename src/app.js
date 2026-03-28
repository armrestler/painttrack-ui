import { createEmptyAppData } from './domain/defaultData.js';
import {
  addRequestItem,
  createRequest,
  deleteRequestItem,
  getRequestById,
  replaceAppData,
  updateRequestField,
  updateRequestItemField,
  validateRequest
} from './application/requestService.js';
import {
  loadSettings,
  saveSettings,
  loadSnapshot,
  saveSnapshot,
  clearSnapshot,
  loadSyncMeta,
  saveSyncMeta,
  defaultSyncMeta
} from './infrastructure/storage/localStore.js';
import { syncOnOpen, pushLocalState, pullRemoteState } from './application/syncService.js';
import { renderSettings, renderWorkspace, showStatus } from './ui/render.js';

const state = {
  settings: loadSettings(),
  appData: replaceAppData(loadSnapshot() ?? createEmptyAppData()),
  syncMeta: loadSyncMeta(),
  selectedRequestId: null
};

bootstrap();

async function bootstrap() {
  state.selectedRequestId = selectExistingRequestId(state.appData, state.selectedRequestId);
  bindEvents();
  render();

  if (!state.syncMeta.lastSyncedRevision) {
    state.syncMeta.lastSyncedRevision = state.appData.revision;
    saveSyncMeta(state.syncMeta);
  }

  if (state.settings.syncOnOpen && hasGitHubSettings(state.settings)) {
    try {
      showStatus('Перевіряю GitHub data repo...');
      const result = await syncOnOpen(state);
      applySyncResult(result);
    } catch (error) {
      showStatus(error.message, 'warning');
    }
  }
}

function bindEvents() {
  document.getElementById('settings-form').addEventListener('submit', (event) => {
    event.preventDefault();

    state.settings = {
      owner: document.getElementById('owner').value.trim(),
      repo: document.getElementById('repo').value.trim(),
      branch: document.getElementById('branch').value.trim() || 'main',
      path: document.getElementById('path').value.trim() || 'data.json',
      token: document.getElementById('token').value.trim(),
      syncOnOpen: document.getElementById('syncOnOpen').checked
    };

    saveSettings(state.settings);
    showStatus('Налаштування збережено локально.');
  });

  document.getElementById('add-demo-request').addEventListener('click', () => {
    const result = createRequest(state.appData);
    commitLocalChange(result.appData, result.requestId);
    showStatus('Створено нову заявку. Локальний стан позначено як dirty.');
  });

  document.getElementById('requests-body').addEventListener('click', (event) => {
    const row = event.target.closest('[data-request-id]');
    if (!row) {
      return;
    }

    state.selectedRequestId = row.dataset.requestId;
    render();
  });

  document.getElementById('requests-body').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const row = event.target.closest('[data-request-id]');
    if (!row) {
      return;
    }

    event.preventDefault();
    state.selectedRequestId = row.dataset.requestId;
    render();
  });

  document.getElementById('request-details').addEventListener('change', (event) => {
    const requestField = event.target.dataset.requestField;
    if (requestField && state.selectedRequestId) {
      const nextAppData = updateRequestField(state.appData, state.selectedRequestId, requestField, event.target.value);
      commitLocalChange(nextAppData, state.selectedRequestId);
      showStatus('Зміни заявки збережено локально.');
      return;
    }

    const itemField = event.target.dataset.itemField;
    const requestId = event.target.dataset.requestId;
    const itemId = event.target.dataset.itemId;

    if (itemField && requestId && itemId) {
      const nextAppData = updateRequestItemField(state.appData, requestId, itemId, itemField, event.target.value);
      commitLocalChange(nextAppData, requestId);
      showStatus('Зміни позиції збережено локально.');
    }
  });

  document.getElementById('request-details').addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) {
      return;
    }

    const { action, requestId, itemId } = actionTarget.dataset;

    if (action === 'add-item' && requestId) {
      const nextAppData = addRequestItem(state.appData, requestId);
      commitLocalChange(nextAppData, requestId);
      showStatus('Додано нову позицію. Локальний стан позначено як dirty.');
      return;
    }

    if (action === 'delete-item' && requestId && itemId) {
      const nextAppData = deleteRequestItem(state.appData, requestId, itemId);
      commitLocalChange(nextAppData, requestId);
      showStatus('Позицію видалено. Локальний стан позначено як dirty.', 'warning');
    }
  });

  document.getElementById('sync-now').addEventListener('click', async () => {
    try {
      showStatus('Синхронізую локальні зміни...');
      const result = await pushLocalState(state);
      applySyncResult(result);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  document.getElementById('pull-remote').addEventListener('click', async () => {
    try {
      showStatus('Отримую останню версію з GitHub...');
      const result = await pullRemoteState(state);
      state.appData = replaceAppData(result.appData);
      state.syncMeta = result.syncMeta;
      state.selectedRequestId = selectExistingRequestId(state.appData, state.selectedRequestId);
      persistState();
      render();
      showStatus('Останню версію з GitHub отримано.');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  document.getElementById('clear-local').addEventListener('click', () => {
    state.appData = replaceAppData(createEmptyAppData());
    state.syncMeta = defaultSyncMeta();
    state.selectedRequestId = null;
    clearSnapshot();
    saveSnapshot(state.appData);
    saveSyncMeta(state.syncMeta);
    render();
    showStatus('Локальні дані очищено. Remote repo не змінювався.', 'warning');
  });
}

function applySyncResult(result) {
  if (result.appData) {
    state.appData = replaceAppData(result.appData);
    state.selectedRequestId = selectExistingRequestId(state.appData, state.selectedRequestId);
  }

  if (result.syncMeta) {
    state.syncMeta = result.syncMeta;
  }

  persistState();
  render();

  const messages = {
    'no-remote-file': 'У data repo ще немає файла. Можна робити перший push.',
    'pulled-remote': 'Отримано актуальні дані з GitHub.',
    'pushed-local': 'Локальні дані синхронізовано в GitHub.',
    conflict: 'Конфлікт: і локальна, і remote версія були змінені. Спершу виріши, яку версію лишаємо.'
  };

  const level = result.action === 'conflict' ? 'warning' : 'info';
  showStatus(messages[result.action] ?? 'Операцію виконано.', level);
}

function persistState() {
  saveSnapshot(state.appData);
  saveSyncMeta(state.syncMeta);
}

function render() {
  renderSettings(state.settings);
  renderWorkspace(
    state.appData,
    state.syncMeta,
    state.selectedRequestId,
    validateRequest(getRequestById(state.appData, state.selectedRequestId))
  );
}

function hasGitHubSettings(settings) {
  return Boolean(settings.owner && settings.repo && settings.branch && settings.path && settings.token);
}

function commitLocalChange(nextAppData, selectedRequestId) {
  state.appData = nextAppData;
  state.selectedRequestId = selectExistingRequestId(state.appData, selectedRequestId);
  state.syncMeta = {
    ...state.syncMeta,
    isDirty: true
  };
  persistState();
  render();
}

function selectExistingRequestId(appData, preferredRequestId) {
  if (preferredRequestId && appData.requests.some((request) => request.id === preferredRequestId)) {
    return preferredRequestId;
  }

  return appData.requests[0]?.id ?? null;
}
