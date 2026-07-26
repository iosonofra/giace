export const STOCK_AVAILABILITY_FILTERS = [
  { id: 'all', label: 'Tutte' },
  { id: 'available', label: 'Disponibili' },
  { id: 'low', label: 'Disponibilità bassa' },
  { id: 'unavailable', label: 'Esaurite' },
];


export function getStockAvailability(item) {
  const isSpacer = Boolean(
    item?.is_spacer || item?.sku?.startsWith('__spacer_'),
  );
  const isMissing = Boolean(item?.is_missing);
  const total = Number(item?.qty_total || 0);
  const residual = Number(item?.qty_residual || 0);
  const percent = !isSpacer && !isMissing && total > 0
    ? Math.min(100, Math.max(0, (residual / total) * 100))
    : 0;

  if (isMissing || residual <= 0) {
    return {
      id: 'unavailable',
      label: isMissing ? 'Non disponibile' : 'Esaurito',
      percent,
      tone: 'danger',
    };
  }
  // Lo stato deve descrivere la disponibilità relativa: una SKU con una sola
  // unità su una totale è comunque al 100%, non "Bassa".
  if (percent < 30) {
    return {
      id: 'low',
      label: 'Bassa',
      percent,
      tone: 'warning',
    };
  }
  return {
    id: 'available',
    label: 'Disponibile',
    percent,
    tone: 'success',
  };
}


export function getStockRowPresentation(item) {
  const isSpacer = Boolean(
    item.is_spacer || (item.sku && item.sku.startsWith('__spacer_')),
  );
  const isMissing = Boolean(item.is_missing);
  const availability = getStockAvailability(item);
  const percent = availability.percent;

  return {
    availabilityLabel: availability.label,
    availabilityTone: availability.tone,
    barClass: availability.tone,
    isMissing,
    isSpacer,
    percent,
    rowStyle: isSpacer
      ? { backgroundColor: 'rgba(255, 255, 255, 0.005)', height: '24px' }
      : item.qty_residual <= 0 || isMissing
        ? { backgroundColor: 'rgba(239, 68, 68, 0.03)' }
        : {},
  };
}


export function matchesStockAvailability(item, filter) {
  if (filter === 'all') return true;
  if (
    item?.is_spacer
    || item?.sku?.startsWith('__spacer_')
  ) {
    return false;
  }
  if (filter === 'committed') {
    return Number(item?.qty_committed || 0) > 0;
  }
  return getStockAvailability(item).id === filter;
}


export function summarizeStock(rows) {
  return (rows || []).reduce((summary, item) => {
    if (
      item?.is_spacer
      || item?.sku?.startsWith('__spacer_')
    ) {
      return summary;
    }
    const availability = getStockAvailability(item);
    summary.total += 1;
    summary[availability.id] += 1;
    if (Number(item?.qty_committed || 0) > 0) {
      summary.committed += 1;
    }
    return summary;
  }, {
    available: 0,
    committed: 0,
    low: 0,
    total: 0,
    unavailable: 0,
  });
}


export function paginateStockRows(rows, page, limit) {
  if (limit === 'all') {
    return {
      page: 1,
      rows,
      totalPages: 1,
    };
  }
  const safeLimit = Math.max(1, Number(limit) || 50);
  const totalPages = Math.max(1, Math.ceil(rows.length / safeLimit));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safeLimit;
  return {
    page: safePage,
    rows: rows.slice(start, start + safeLimit),
    totalPages,
  };
}
