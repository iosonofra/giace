export const ASSOCIATION_FILTERS = [
  { id: 'all', label: 'Tutte' },
  { id: 'available', label: 'Disponibili' },
  { id: 'critical', label: 'Bassa ≤ 5' },
  { id: 'unavailable', label: 'Esaurite' },
];

export function associationAvailability(product) {
  const quantity = Number(product?.qty_available || 0);
  if (quantity <= 0) {
    return {
      quantity: 0,
      tone: 'danger',
      label: 'Esaurito',
    };
  }
  if (quantity <= 5) {
    return {
      quantity,
      tone: 'warning',
      label: 'Disponibilità bassa',
    };
  }
  return {
    quantity,
    tone: 'success',
    label: 'Disponibile',
  };
}

export function matchesAssociationFilter(product, filter) {
  const quantity = Number(product?.qty_available || 0);
  if (filter === 'available') return quantity > 0;
  if (filter === 'critical') return quantity > 0 && quantity <= 5;
  if (filter === 'unavailable') return quantity <= 0;
  return true;
}

export function summarizeAssociations(products) {
  return (products || []).reduce(
    (summary, product) => {
      const quantity = Number(product?.qty_available || 0);
      summary.total += 1;
      if (quantity > 0) summary.available += 1;
      if (quantity > 0 && quantity <= 5) summary.critical += 1;
      if (quantity <= 0) summary.unavailable += 1;
      return summary;
    },
    {
      total: 0,
      available: 0,
      critical: 0,
      unavailable: 0,
    },
  );
}

export function parseAssociationComponents(value) {
  return String(value || '')
    .split(',')
    .map(component => component.trim())
    .filter(Boolean)
    .map(component => {
      const match = component.match(/^(.*)\s+\(x(\d+)\)$/i);
      return match
        ? { sku: match[1].trim(), quantity: Number(match[2]) }
        : { sku: component, quantity: 1 };
    });
}
