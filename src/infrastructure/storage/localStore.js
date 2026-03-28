const SETTINGS_KEY = 'painttrack.settings.v1';
const SNAPSHOT_KEY = 'painttrack.snapshot.v1';
const SYNC_META_KEY = 'painttrack.sync-meta.v1';

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSnapshot() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY));
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function clearSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY);
  localStorage.removeItem(SYNC_META_KEY);
}

export function loadSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY)) ?? defaultSyncMeta();
  } catch {
    return defaultSyncMeta();
  }
}

export function saveSyncMeta(meta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export function defaultSettings() {
  return {
    owner: '',
    repo: '',
    branch: 'main',
    path: 'data.json',
    token: '',
    syncOnOpen: true
  };
}

export function defaultSyncMeta() {
  return {
    lastSyncedRevision: null,
    remoteSha: null,
    isDirty: false,
    lastSyncAt: null
  };
}
