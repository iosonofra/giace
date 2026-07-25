import {
  formatPickingQty,
  getOrderPickingMeta,
  getPickingRemainingQty,
  getRelativeTimeString,
  getRequirementMeta,
} from './pickingUtils.js';

function getAutomaticModeLabel(results) {
  if (results.auto_picking?.selection_strategy === 'maximize_orders') return 'massimizza ordini';
  return results.auto_picking?.strict_chronology ? 'coda rigida' : 'salta non preparabili';
}

function getAutomaticCounts(results) {
  const remainingOrders = results?.remaining_orders || [];
  const unclassifiedCount = Math.max(
    0,
    Number(results?.auto_picking?.candidate_count || 0)
      - Number(results?.auto_picking?.selected_count || 0)
      - Number(results?.auto_picking?.skipped_count || 0)
      - remainingOrders.length,
  );
  return {
    remainingCount: remainingOrders.length + unclassifiedCount,
    unclassifiedCount,
  };
}

function getAutomaticSimulationSummary(results, requirements, remainingOrders) {
  const selectedUnits = requirements.reduce((total, item) => total + Number(item.qty_required || 0), 0);
  const initialStock = requirements.reduce((total, item) => total + Number(item.qty_stock || 0), 0);
  const remainingStock = requirements.reduce((total, item) => total + getPickingRemainingQty(item), 0);
  const hasRemainingDetails = Array.isArray(results?.remaining_orders);

  return {
    selected_units: results?.simulation_summary?.selected_units ?? selectedUnits,
    selected_distinct_skus: results?.simulation_summary?.selected_distinct_skus ?? requirements.length,
    initial_units_on_touched_skus: results?.simulation_summary?.initial_units_on_touched_skus ?? initialStock,
    remaining_units_on_touched_skus: results?.simulation_summary?.remaining_units_on_touched_skus ?? remainingStock,
    remaining_preparable_count:
      results?.simulation_summary?.remaining_preparable_count
      ?? (hasRemainingDetails ? remainingOrders.filter((order) => order.currently_preparable).length : null),
    stopped_by_strict_chronology: results?.simulation_summary?.stopped_by_strict_chronology ?? false,
  };
}

export function derivePickingPresentation({
  results,
  countedSkus,
  requirementFilter,
  remainingFilter,
  remainingQuery,
  remainingVisibleLimit,
}) {
  const pickingRequirements = results?.sku_requirements || [];
  const pickingOrders = results?.order_requirements || [];
  const automaticRemainingOrders = results?.remaining_orders || [];
  const automaticSkuLimitExcludedOrders = results?.sku_limit_excluded_orders || [];
  const automaticSkuExcludedOrders = results?.sku_excluded_orders || [];
  const hasAutomaticRemainingDetails = Array.isArray(results?.remaining_orders);
  const { remainingCount: automaticRemainingCount, unclassifiedCount: automaticUnclassifiedCount } = getAutomaticCounts(results);
  const automaticSimulationSummary = getAutomaticSimulationSummary(results, pickingRequirements, automaticRemainingOrders);
  const automaticStockAuditBySku = new Map((results?.stock_simulation || []).map((item) => [item.sku, item]));

  const filteredAutomaticRemainingOrders = automaticRemainingOrders.filter((order) => {
    if (remainingFilter === 'preparable' && !order.currently_preparable) return false;
    if (remainingFilter === 'blocked' && order.currently_preparable) return false;
    const query = remainingQuery.trim().toLowerCase();
    if (!query) return true;
    return [order.order_id, order.customer_name, order.current_state_label, order.reason]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  const visiblePickingRequirements = pickingRequirements.filter((requirement) => {
    const tone = getRequirementMeta(requirement).tone;
    if (requirementFilter === 'missing') return tone === 'danger';
    if (requirementFilter === 'available') return tone !== 'danger';
    return true;
  });

  const sortedPickingOrders = results?.mode === 'automatic'
    ? pickingOrders
    : [...pickingOrders].sort((first, second) => {
      const firstMeta = getOrderPickingMeta(first);
      const secondMeta = getOrderPickingMeta(second);
      if (firstMeta.rank !== secondMeta.rank) return firstMeta.rank - secondMeta.rank;
      return String(first.order_id || '').localeCompare(String(second.order_id || ''));
    });

  return {
    automaticMinResidual: Number(results?.auto_picking?.min_sku_residual || 0),
    automaticRemainingCount,
    automaticRemainingOrders,
    automaticSimulationSummary,
    automaticSkuExcludedOrders,
    automaticSkuLimitExcludedOrders,
    automaticStockAuditBySku,
    automaticUnclassifiedCount,
    countedPickingCount: pickingRequirements.filter((requirement) => countedSkus.has(requirement.sku)).length,
    filteredAutomaticRemainingOrders,
    hasAutomaticRemainingDetails,
    sortedPickingOrders,
    visibleAutomaticRemainingOrders: filteredAutomaticRemainingOrders.slice(0, remainingVisibleLimit),
    visiblePickingRequirements,
  };
}

function addAutomaticHeader(lines, results, remainingCount, simulationSummary, includeUnits) {
  const entries = [
    `Modalità automatica: ${getAutomaticModeLabel(results)}`,
    `Scorta minima SKU: ${results.auto_picking?.min_sku_residual || 0}`,
    `Massimi per ordine: ${Object.entries(results.auto_picking?.sku_limits || {}).map(([sku, max]) => `${sku}<=${formatPickingQty(max)}`).join(', ') || 'nessuno'}`,
    `SKU escluse: ${results.auto_picking?.excluded_skus?.join(', ') || 'nessuna'}`,
    `Ordini saltati: ${results.skipped_orders?.length || 0}`,
    `Ordini rimasti fuori proposta: ${remainingCount}`,
    `Ordini esclusi per SKU: ${results.auto_picking?.sku_excluded_count || 0}`,
    `Ordini esclusi dai massimi SKU: ${results.auto_picking?.sku_limit_excluded_count || 0}`,
  ];
  if (includeUnits) {
    entries.push(
      `Unità da prelevare: ${formatPickingQty(simulationSummary.selected_units)}`,
      `SKU coinvolte: ${simulationSummary.selected_distinct_skus || 0}`,
    );
  }
  lines.push(...entries);
}

export function buildPickingClipboardText(results, viewMode, now = new Date()) {
  if (!results) return '';

  const requirements = results.sku_requirements || [];
  const remainingOrders = results.remaining_orders || [];
  const { remainingCount } = getAutomaticCounts(results);
  const simulationSummary = getAutomaticSimulationSummary(results, requirements, remainingOrders);

  if (viewMode === 'aggregated') {
    if (!results.sku_requirements) return '';
    const lines = [
      '=== LISTA PRELIEVO (AGGREGATA) ===',
      `Data: ${now.toLocaleString('it-IT')}`,
      `Ordini trovati nel database: ${(results.orders_found || []).join(', ')}`,
    ];
    if (results.mode === 'automatic') addAutomaticHeader(lines, results, remainingCount, simulationSummary, true);
    lines.push(
      results.orders_missing?.length > 0
        ? `Ordini non trovati: ${results.orders_missing.join(', ')}`
        : 'Tutti gli ordini sono stati trovati nel database.',
      '',
      'SKU | DESCRIZIONE | RICHIESTO | DISPONIBILE | STATO',
      '-------------------------------------------------------',
    );
    requirements.forEach((requirement) => {
      const difference = requirement.qty_stock - requirement.qty_required;
      const status = difference >= 0 ? 'Disponibile' : `Mancano ${Math.abs(difference)}`;
      const residual = results.mode === 'automatic'
        ? ` | Residuo simulato: ${formatPickingQty(getPickingRemainingQty(requirement))}`
        : '';
      lines.push(`${requirement.sku} | ${requirement.description} | Richiesto: ${formatPickingQty(requirement.qty_required)} | Stock: ${formatPickingQty(requirement.qty_stock)}${residual} | ${status}`);
    });
    return lines.join('\n');
  }

  if (!results.order_requirements) return '';
  const lines = ['=== DETTAGLIO PRELIEVO PER ORDINE ===', `Data: ${now.toLocaleString('it-IT')}`, ''];
  if (results.mode === 'automatic') {
    addAutomaticHeader(lines, results, remainingCount, simulationSummary, false);
    lines.push('');
  }

  results.order_requirements.forEach((order, orderIndex) => {
    const orderDate = order.date_add ? ` - Data: ${new Date(order.date_add).toLocaleString('it-IT')}` : '';
    const orderAge = order.date_add ? ` - Eta: ${getRelativeTimeString(order.date_add)}` : '';
    const orderState = order.current_state_label ? ` - Stato: ${order.current_state_label}` : '';
    const queueMeta = results.mode === 'automatic'
      ? ` - Proposta: ${order.selection_position || orderIndex + 1}${order.chronological_position ? ` - Posizione cronologica: ${order.chronological_position}` : ''}`
      : '';
    lines.push(`Ordine: ${order.order_id} - Cliente: ${order.customer_name}${queueMeta}${orderDate}${orderAge}${orderState}`);
    lines.push('--------------------------------------------------------------------------------');
    order.items.forEach((requirement) => {
      let status = `Mancante (Richiesto: ${requirement.qty_required})`;
      if (requirement.status === 'disponibile') status = `Disponibile (Residuo: ${requirement.avail_after})`;
      else if (requirement.status === 'parziale') status = `Parziale (Coperti ${requirement.qty_fulfilled} di ${requirement.qty_required})`;
      const stock = results.mode === 'automatic'
        ? ` | Prima: ${formatPickingQty(requirement.avail_before)} | Dopo: ${formatPickingQty(requirement.avail_after)}`
        : ` | Stock: ${formatPickingQty(requirement.qty_stock)}`;
      lines.push(`- SKU: ${requirement.sku} | ${requirement.description} | Richiesto: ${formatPickingQty(requirement.qty_required)}${stock} | ${status}`);
    });
    lines.push('');
  });

  if (results.mode === 'automatic' && remainingOrders.length > 0) {
    lines.push('=== ORDINI FUORI DALLA PROPOSTA ===');
    remainingOrders.forEach((order) => {
      lines.push(`- #${order.chronological_position} Ordine ${order.order_id} | ${order.reason} | ${order.currently_preparable ? 'Preparabile con il residuo attuale' : 'Non preparabile con il residuo attuale'}`);
    });
    lines.push('');
  }
  return lines.join('\n');
}
