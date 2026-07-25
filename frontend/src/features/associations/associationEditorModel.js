export function buildWarehouseSkuIndex(stockData) {
  const skuMap = new Map();
  stockData.forEach(item => {
    const sku = String(item.sku || '').trim();
    if (!sku || sku.startsWith('__spacer_') || item.is_spacer) return;

    const key = sku.toUpperCase();
    const existing = skuMap.get(key) || {
      description: item.description || '',
      qty_total: 0,
      sku,
    };
    existing.qty_total += Number(item.qty_total || 0);
    if (!existing.description && item.description) {
      existing.description = item.description;
    }
    skuMap.set(key, existing);
  });

  return {
    skuMap,
    skus: Array.from(skuMap.values()).sort((a, b) => a.sku.localeCompare(b.sku)),
  };
}

export function deriveGuidedAssociation(components) {
  const configuredComponents = components.filter(component => component.sku.trim());
  const configuredSkuKeys = configuredComponents.map(component => (
    component.sku.trim().toUpperCase()
  ));

  return {
    configuredComponents,
    duplicateSkuKeys: new Set(
      configuredSkuKeys.filter((sku, index) => configuredSkuKeys.indexOf(sku) !== index),
    ),
    totalUnits: configuredComponents.reduce(
      (total, component) => total + Number(component.qty_required || 0),
      0,
    ),
  };
}

export function guidedAssociationToRaw(components) {
  return components
    .filter(component => component.sku.trim())
    .map(component => (
      Array(Number(component.qty_required) || 0).fill(component.sku.trim()).join(',')
    ))
    .filter(Boolean)
    .join(',');
}

export function rawAssociationToGuided(rawText) {
  const counts = {};
  rawText
    .split(',')
    .map(sku => sku.trim())
    .filter(Boolean)
    .forEach(sku => {
      counts[sku] = (counts[sku] || 0) + 1;
    });
  const components = Object.entries(counts).map(([sku, qty]) => ({
    qty_required: qty,
    sku,
  }));
  return components.length > 0 ? components : [{ qty_required: 1, sku: '' }];
}
