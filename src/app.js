import { createEmptyAppData } from './domain/defaultData.js';
import { addDemoRequest, replaceAppData } from './application/requestService.js';
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
import { renderSettings, renderSnapshot, showStatus } from './ui/render.js';

const state = {
  settings: loadSettings(),
  appData: loadSnapshot() ?? createEmptyAppData(),
  syncMeta: loadSyncMeta()
};

bootstrap();

async function bootstrap() {
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
    state.appData = addDemoRequest(state.appData);
    state.syncMeta = {
      ...state.syncMeta,
      isDirty: true
    };
    persistState();
    render();
    showStatus('Додано тестову заявку. Локальний стан позначено як dirty.');
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
      persistState();
      render();
      showStatus('Останню версію з GitHub отримано.');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  document.getElementById('clear-local').addEventListener('click', () => {
    state.appData = createEmptyAppData();
    state.syncMeta = defaultSyncMeta();
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
  renderSnapshot(state.appData, state.syncMeta);
}

function hasGitHubSettings(settings) {
  return Boolean(settings.owner && settings.repo && settings.branch && settings.path && settings.token);
}
