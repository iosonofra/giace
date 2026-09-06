let guidedComponentSequence = 0;

export function createGuidedComponent(component = {}) {
  guidedComponentSequence += 1;
  return {
    id: component.id || `association-component-${guidedComponentSequence}`,
    sku: component.sku || '',
    qty_required: component.qty_required ?? 1,
  };
}

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
    if (!item.is_calculation_excluded) {
      existing.qty_total += Number(item.qty_total || 0);
    }
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

  const duplicateSkuKeys = new Set(
    configuredSkuKeys.filter((sku, index) => configuredSkuKeys.indexOf(sku) !== index),
  );
  return {
    configuredComponents,
    duplicateSkuKeys,
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
      Array(Math.min(999, Math.max(0, Number(component.qty_required) || 0)))
        .fill(component.sku.trim())
        .join(',')
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
    ...createGuidedComponent({ qty_required: Math.min(qty, 999), sku }),
  }));
  return components.length > 0 ? components : [createGuidedComponent()];
}
