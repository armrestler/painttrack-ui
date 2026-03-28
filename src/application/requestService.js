import { createDemoRequest, createEmptyRequest, createEmptyRequestItem } from '../domain/defaultData.js';

const REQUEST_FIELDS = new Set(['number', 'customerName', 'factoryName', 'status', 'note', 'priority']);
const ITEM_FIELDS = new Set([
  'barcode',
  'name',
  'packaging',
  'capacity',
  'quantity',
  'unit',
  'weight',
  'processingPrice',
  'desiredDate',
  'producedQty',
  'shippedQty'
]);
const OPTIONAL_TEXT_FIELDS = new Set(['note', 'priority', 'desiredDate']);
const OPTIONAL_NUMBER_FIELDS = new Set(['capacity', 'weight', 'processingPrice']);
const REQUIRED_NUMBER_FIELDS = new Set(['quantity', 'producedQty', 'shippedQty']);

export function addDemoRequest(appData) {
  const request = createDemoRequest(appData.requests.length);

  return {
    appData: bumpRevision({
      ...appData,
      requests: [request, ...appData.requests]
    }),
    requestId: request.id
  };
}

export function createRequest(appData) {
  const request = createEmptyRequest(appData.requests.length);

  return {
    appData: bumpRevision({
      ...appData,
      requests: [request, ...appData.requests]
    }),
    requestId: request.id
  };
}

export function updateRequestField(appData, requestId, field, rawValue) {
  if (!REQUEST_FIELDS.has(field)) {
    return appData;
  }

  return updateRequestById(appData, requestId, (request) => ({
    ...request,
    [field]: sanitizeRequestFieldValue(field, rawValue)
  }));
}

export function addRequestItem(appData, requestId) {
  return updateRequestById(appData, requestId, (request) => ({
    ...request,
    items: [...request.items, createEmptyRequestItem()]
  }));
}

export function updateRequestItemField(appData, requestId, itemId, field, rawValue) {
  if (!ITEM_FIELDS.has(field)) {
    return appData;
  }

  return updateRequestById(appData, requestId, (request) => ({
    ...request,
    items: request.items.map((item) => (
      item.id === itemId
        ? { ...item, [field]: sanitizeItemFieldValue(field, rawValue) }
        : item
    ))
  }));
}

export function deleteRequestItem(appData, requestId, itemId) {
  return updateRequestById(appData, requestId, (request) => ({
    ...request,
    items: request.items.filter((item) => item.id !== itemId)
  }));
}

export function getRequestById(appData, requestId) {
  return appData.requests.find((request) => request.id === requestId) ?? null;
}

export function validateRequest(request) {
  if (!request) {
    return [];
  }

  return request.items.flatMap((item, index) => validateRequestItem(item).map((message) => ({
    ...message,
    itemId: item.id,
    itemLabel: item.name?.trim() || item.barcode?.trim() || `Позиція ${index + 1}`
  })));
}

export function replaceAppData(nextData) {
  return {
    ...nextData,
    updatedAt: nextData.updatedAt ?? new Date().toISOString(),
    revision: Number.isFinite(nextData.revision) ? nextData.revision : 1,
    schemaVersion: Number.isFinite(nextData.schemaVersion) ? nextData.schemaVersion : 1,
    requests: Array.isArray(nextData.requests) ? nextData.requests.map(normalizeRequest) : []
  };
}

function validateRequestItem(item) {
  const quantity = toComparableNumber(item.quantity);
  const producedQty = toComparableNumber(item.producedQty);
  const shippedQty = toComparableNumber(item.shippedQty);
  const messages = [];

  if (quantity < 0) {
    messages.push({ field: 'quantity', message: 'Кількість не може бути від’ємною.' });
  }

  if (producedQty < 0) {
    messages.push({ field: 'producedQty', message: 'Produced Qty не може бути від’ємним.' });
  }

  if (shippedQty < 0) {
    messages.push({ field: 'shippedQty', message: 'Shipped Qty не може бути від’ємним.' });
  }

  if (shippedQty > producedQty) {
    messages.push({ field: 'shippedQty', message: 'Shipped Qty не може перевищувати Produced Qty.' });
  }

  return messages;
}

function normalizeRequest(request) {
  const now = new Date().toISOString();

  return {
    id: request.id ?? crypto.randomUUID(),
    number: request.number ?? '',
    customerName: request.customerName ?? '',
    factoryName: request.factoryName ?? '',
    status: request.status ?? 'draft',
    note: request.note ?? null,
    priority: request.priority ?? null,
    createdAt: request.createdAt ?? now,
    updatedAt: request.updatedAt ?? request.createdAt ?? now,
    approvals: normalizeApprovals(request.approvals),
    items: Array.isArray(request.items) ? request.items.map(normalizeRequestItem) : []
  };
}

function normalizeRequestItem(item) {
  return {
    id: item.id ?? crypto.randomUUID(),
    barcode: item.barcode ?? '',
    name: item.name ?? '',
    packaging: item.packaging ?? '',
    capacity: normalizeOptionalNumber(item.capacity),
    quantity: normalizeRequiredNumber(item.quantity),
    unit: item.unit ?? '',
    weight: normalizeOptionalNumber(item.weight),
    processingPrice: normalizeOptionalNumber(item.processingPrice),
    desiredDate: item.desiredDate ?? null,
    producedQty: normalizeRequiredNumber(item.producedQty),
    shippedQty: normalizeRequiredNumber(item.shippedQty),
    supportingMaterials: Array.isArray(item.supportingMaterials) ? item.supportingMaterials : []
  };
}

function normalizeApprovals(approvals) {
  return {
    salesApprovedAt: approvals?.salesApprovedAt ?? null,
    coordinatorApprovedAt: approvals?.coordinatorApprovedAt ?? null,
    technologistApprovedAt: approvals?.technologistApprovedAt ?? null
  };
}

function updateRequestById(appData, requestId, updateRequest) {
  let wasUpdated = false;

  const requests = appData.requests.map((request) => {
    if (request.id !== requestId) {
      return request;
    }

    wasUpdated = true;
    return touchRequest(updateRequest(request));
  });

  if (!wasUpdated) {
    return appData;
  }

  return bumpRevision({
    ...appData,
    requests
  });
}

function touchRequest(request) {
  return {
    ...request,
    updatedAt: new Date().toISOString()
  };
}

function sanitizeRequestFieldValue(field, rawValue) {
  if (OPTIONAL_TEXT_FIELDS.has(field)) {
    return emptyStringToNull(rawValue);
  }

  return String(rawValue ?? '').trim();
}

function sanitizeItemFieldValue(field, rawValue) {
  if (OPTIONAL_TEXT_FIELDS.has(field)) {
    return emptyStringToNull(rawValue);
  }

  if (OPTIONAL_NUMBER_FIELDS.has(field)) {
    return normalizeOptionalNumber(rawValue);
  }

  if (REQUIRED_NUMBER_FIELDS.has(field)) {
    return normalizeRequiredNumber(rawValue);
  }

  return String(rawValue ?? '').trim();
}

function emptyStringToNull(value) {
  const nextValue = String(value ?? '').trim();
  return nextValue === '' ? null : nextValue;
}

function normalizeOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRequiredNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toComparableNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function bumpRevision(appData) {
  return {
    ...appData,
    revision: (appData.revision ?? 0) + 1,
    updatedAt: new Date().toISOString()
  };
}
