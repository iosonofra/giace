export function getStockRowPresentation(item) {
  const isSpacer = Boolean(
    item.is_spacer || (item.sku && item.sku.startsWith('__spacer_')),
  );
  const isMissing = Boolean(item.is_missing);
  const percent = !isSpacer && !isMissing && item.qty_total > 0
    ? Math.min(100, Math.max(0, (item.qty_residual / item.qty_total) * 100))
    : 0;

  return {
    barClass: isMissing || percent <= 0
      ? 'danger'
      : percent < 30
        ? 'warning'
        : 'success',
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


export function paginateStockRows(rows, page, limit) {
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
