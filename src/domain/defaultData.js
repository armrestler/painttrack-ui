export function createEmptyAppData() {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    revision: 1,
    updatedAt: now,
    requests: []
  };
}

export function createDemoRequest(currentCount = 0) {
  const number = String(currentCount + 1).padStart(4, '0');
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    number: `PT-${number}`,
    customerName: 'Тестовий клієнт',
    factoryName: 'Спектр',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    approvals: {
      salesApprovedAt: null,
      coordinatorApprovedAt: null,
      technologistApprovedAt: null
    },
    items: [
      {
        id: crypto.randomUUID(),
        barcode: '4820000000000',
        name: 'Фарба тестова 14 кг',
        packaging: '14 кг',
        capacity: 14,
        quantity: 100,
        unit: 'банк',
        weight: 1400,
        processingPrice: null,
        desiredDate: null,
        producedQty: 0,
        shippedQty: 0,
        supportingMaterials: [
          {
            id: crypto.randomUUID(),
            materialType: 'банка',
            name: 'Банка 14 кг',
            requiredQty: 100,
            unit: 'шт',
            allocations: [
              { id: crypto.randomUUID(), sourceType: 'company', sourceName: 'Компанія', qty: 50 },
              { id: crypto.randomUUID(), sourceType: 'factory', sourceName: 'Завод', qty: 50 }
            ]
          }
        ]
      }
    ]
  };
}
