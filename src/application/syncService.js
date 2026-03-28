import { getRemoteFile, putRemoteFile } from '../infrastructure/github/githubClient.js';

export async function syncOnOpen({ settings, appData, syncMeta }) {
  validateSettings(settings);

  const remote = await getRemoteFile(settings);

  if (!remote) {
    return {
      action: 'no-remote-file',
      appData,
      syncMeta
    };
  }

  if (!syncMeta.isDirty && remote.content.revision >= (appData.revision ?? 0)) {
    return {
      action: 'pulled-remote',
      appData: remote.content,
      syncMeta: {
        ...syncMeta,
        isDirty: false,
        lastSyncedRevision: remote.content.revision,
        remoteSha: remote.sha,
        lastSyncAt: new Date().toISOString()
      }
    };
  }

  if (syncMeta.isDirty && remote.content.revision > (syncMeta.lastSyncedRevision ?? 0)) {
    return {
      action: 'conflict',
      appData,
      syncMeta: {
        ...syncMeta,
        remoteSha: remote.sha
      },
      remoteData: remote.content
    };
  }

  const pushed = await putRemoteFile(settings, appData, remote.sha);

  return {
    action: 'pushed-local',
    appData,
    syncMeta: {
      ...syncMeta,
      isDirty: false,
      lastSyncedRevision: appData.revision,
      remoteSha: pushed.sha,
      lastSyncAt: new Date().toISOString()
    }
  };
}

export async function pushLocalState({ settings, appData, syncMeta }) {
  validateSettings(settings);

  const remote = await getRemoteFile(settings);

  if (syncMeta.isDirty && remote && remote.content.revision > (syncMeta.lastSyncedRevision ?? 0)) {
    return {
      action: 'conflict',
      appData,
      syncMeta: {
        ...syncMeta,
        remoteSha: remote.sha
      },
      remoteData: remote.content
    };
  }

  const pushed = await putRemoteFile(settings, appData, remote?.sha ?? null);

  return {
    action: 'pushed-local',
    appData,
    syncMeta: {
      ...syncMeta,
      isDirty: false,
      lastSyncedRevision: appData.revision,
      remoteSha: pushed.sha,
      lastSyncAt: new Date().toISOString()
    }
  };
}

export async function pullRemoteState({ settings, syncMeta }) {
  validateSettings(settings);

  const remote = await getRemoteFile(settings);

  if (!remote) {
    throw new Error('У data repo ще немає файла data.json');
  }

  return {
    appData: remote.content,
    syncMeta: {
      ...syncMeta,
      isDirty: false,
      lastSyncedRevision: remote.content.revision,
      remoteSha: remote.sha,
      lastSyncAt: new Date().toISOString()
    }
  };
}

function validateSettings(settings) {
  const required = ['owner', 'repo', 'branch', 'path', 'token'];
  const missing = required.filter((key) => !settings[key]);

  if (missing.length > 0) {
    throw new Error(`Заповни GitHub settings: ${missing.join(', ')}`);
  }
}
