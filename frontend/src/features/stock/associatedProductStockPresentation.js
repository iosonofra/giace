export function getAssociatedProductAvailability(product) {
  if (product?.qty_residual === null || product?.qty_residual === undefined) {
    return {
      id: 'uncalculated',
      label: 'Non calcolata',
      percent: 0,
      tone: 'neutral',
    };
  }
  const total = Number(product.qty_total || 0);
  const residual = Number(product.qty_residual || 0);
  const percent = total > 0
    ? Math.min(100, Math.max(0, (residual / total) * 100))
    : 0;
  if (residual <= 0) {
    return { id: 'unavailable', label: 'Esaurito', percent, tone: 'danger' };
  }
  if (percent < 30) {
    return { id: 'low', label: 'Bassa', percent, tone: 'warning' };
  }
  return { id: 'available', label: 'Disponibile', percent, tone: 'success' };
}


export function matchesAssociatedProductFilter(product, filter) {
  if (filter === 'all') return true;
  if (filter === 'committed') return Number(product?.qty_committed || 0) > 0;
  return getAssociatedProductAvailability(product).id === filter;
}


export function matchesAssociatedProductSearch(product, search) {
  const query = String(search || '').trim().toLowerCase();
  if (!query) return true;
  return [
    product.product_id,
    product.product_name,
    product.product_reference,
    product.limiting_sku,
    ...(product.components || []).map(component => component.sku),
  ].some(value => String(value || '').toLowerCase().includes(query));
}


export function summarizeAssociatedProducts(products) {
  return (products || []).reduce((summary, product) => {
    summary.total += 1;
    const availability = getAssociatedProductAvailability(product);
    if (availability.id in summary) summary[availability.id] += 1;
    if (Number(product?.qty_committed || 0) > 0) summary.committed += 1;
    return summary;
  }, {
    available: 0,
    committed: 0,
    low: 0,
    total: 0,
    unavailable: 0,
    uncalculated: 0,
  });
}


export function getAssociatedProductPriority(product) {
  const availability = getAssociatedProductAvailability(product);
  const priority = {
    unavailable: 0,
    low: 1,
    available: 2,
    uncalculated: 3,
  };
  return priority[availability.id] ?? 4;
}


export function getSupportedKitCount(component) {
  const required = Number(component?.qty_required || 0);
  const residual = Number(component?.qty_residual || 0);
  if (required <= 0) return null;
  return Math.max(0, Math.floor(residual / required));
}


export function applyStockOrderToAssociatedProducts(products, stockRows) {
  const skuPositions = new Map();
  (stockRows || []).forEach((row, position) => {
    const sku = String(row?.sku || '').trim().toLowerCase();
    if (sku && !skuPositions.has(sku)) {
      skuPositions.set(sku, {
        position,
        sku: String(row.sku || '').trim(),
      });
    }
  });

  return (products || [])
    .map((product, sourcePosition) => {
      const componentPositions = (product.components || [])
        .map(component => skuPositions.get(String(component?.sku || '').trim().toLowerCase()))
        .filter(Boolean)
        .sort((left, right) => left.position - right.position);
      const stockAnchor = componentPositions[0];
      return {
        ...product,
        stock_order_position: stockAnchor?.position ?? Number.MAX_SAFE_INTEGER,
        stock_order_sku: stockAnchor?.sku || '',
        stock_source_position: sourcePosition,
      };
    })
    .sort((left, right) => (
      left.stock_order_position - right.stock_order_position
      || left.stock_source_position - right.stock_source_position
    ))
    .map((product, position) => ({
      ...product,
      stock_sequence_index: position + 1,
    }));
}
