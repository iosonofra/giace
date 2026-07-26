export function formatStockOrderQty(value) {
  return Number(value).toLocaleString('it-IT', { maximumFractionDigits: 2 });
}

export function formatStockOrderCurrency(value) {
  return `€ ${Number(value || 0).toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSmartCounterNote(value) {
  return String(value || '').replace(/(\d+)\.0(?!\d)/g, '$1');
}

export function deriveStockOrdersDrawer({
  selectedSku,
  skuOrdersData,
  smartSkuCounterData,
  smartSkuCounterEnabled,
  sortDirection,
  stockData,
}) {
  const selectedStockRows = stockData.filter(item => (
    !item.is_spacer
    && !item.is_missing
    && item.sku === selectedSku
  ));
  const baseRows = smartSkuCounterEnabled
    ? (smartSkuCounterData?.orders || [])
    : skuOrdersData;
  const displayedOrders = [...baseRows].sort((left, right) => {
    const leftDate = left.date_add ? new Date(left.date_add).getTime() : 0;
    const rightDate = right.date_add ? new Date(right.date_add).getTime() : 0;
    return sortDirection === 'asc' ? leftDate - rightDate : rightDate - leftDate;
  });

  return {
    displayedOrders,
    hasSelectedSkuStock: selectedStockRows.length > 0,
    remainingStock: selectedStockRows.reduce(
      (sum, item) => sum + Number(item.qty_residual || 0),
      0,
    ),
    smartSummary: smartSkuCounterData?.summary || null,
    totalCommitted: skuOrdersData.reduce(
      (sum, order) => sum + (order.contribution || 0),
      0,
    ),
    totalOrders: skuOrdersData.length,
    totalValue: skuOrdersData.reduce(
      (sum, order) => sum + (order.total_paid || 0),
      0,
    ),
    visibleTotals: {
      committed: displayedOrders.reduce(
        (sum, order) => sum + (order.contribution || 0),
        0,
      ),
      quantity: displayedOrders.reduce(
        (sum, order) => sum + (order.product_quantity || 0),
        0,
      ),
      value: displayedOrders.reduce(
        (sum, order) => sum + (order.total_paid || 0),
        0,
      ),
    },
  };
}
