import { createDemoRequest } from '../domain/defaultData.js';

export function addDemoRequest(appData) {
  const request = createDemoRequest(appData.requests.length);

  return bumpRevision({
    ...appData,
    requests: [request, ...appData.requests],
    updatedAt: new Date().toISOString()
  });
}

export function replaceAppData(nextData) {
  return {
    ...nextData,
    updatedAt: nextData.updatedAt ?? new Date().toISOString(),
    revision: Number.isFinite(nextData.revision) ? nextData.revision : 1,
    schemaVersion: Number.isFinite(nextData.schemaVersion) ? nextData.schemaVersion : 1,
    requests: Array.isArray(nextData.requests) ? nextData.requests : []
  };
}

function bumpRevision(appData) {
  return {
    ...appData,
    revision: (appData.revision ?? 0) + 1,
    updatedAt: new Date().toISOString()
  };
}
