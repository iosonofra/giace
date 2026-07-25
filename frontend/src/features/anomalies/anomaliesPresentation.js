export function deriveAnomaliesPresentation({
  anomalyData,
  filters,
  getAnomalyMeta,
  limit,
  page,
}) {
  const sources = Array.from(new Set(anomalyData.map(item => item.source).filter(Boolean)));
  const types = Array.from(new Set(anomalyData.map(item => item.anomaly_type).filter(Boolean)));
  const orderStatesMap = anomalyData.reduce((states, anomaly) => {
    if (anomaly.current_state == null) return states;
    const key = String(anomaly.current_state);
    if (!states.has(key)) {
      states.set(key, {
        count: 0,
        id: key,
        label: anomaly.current_state_label || `Stato ${key}`,
      });
    }
    states.get(key).count += 1;
    return states;
  }, new Map());
  const stats = anomalyData.reduce((summary, anomaly) => {
    const meta = getAnomalyMeta(anomaly);
    summary.total += 1;
    summary[meta.severity] += 1;
    if (meta.actionable) summary.actionable += 1;
    return summary;
  }, { total: 0, critical: 0, warning: 0, info: 0, actionable: 0 });

  const search = filters.search.trim().toLowerCase();
  const filtered = anomalyData.filter(anomaly => {
    const meta = getAnomalyMeta(anomaly);
    const text = [
      anomaly.source,
      meta.sourceLabel,
      anomaly.record_key,
      anomaly.product_name,
      anomaly.order_id,
      anomaly.current_state_label,
      anomaly.anomaly_type,
      meta.typeLabel,
      anomaly.message,
    ].join(' ').toLowerCase();
    return (
      (!search || text.includes(search))
      && (filters.source === 'all' || anomaly.source === filters.source)
      && (filters.type === 'all' || anomaly.anomaly_type === filters.type)
      && (
        filters.orderState === 'all'
        || String(anomaly.current_state) === filters.orderState
      )
      && (!filters.onlyActionable || meta.actionable)
    );
  });
  const totalPages = Math.ceil(filtered.length / limit) || 1;

  return {
    filtered,
    orderStates: Array.from(orderStatesMap.values()).sort(
      (left, right) => left.label.localeCompare(right.label, 'it'),
    ),
    paginated: filtered.slice((page - 1) * limit, page * limit),
    sources,
    stats,
    totalPages,
    types,
  };
}

export function getAnomalyActionKind(anomaly, meta) {
  if (anomaly.anomaly_type.includes('missing_association') && anomaly.record_key) {
    return 'association';
  }
  if (anomaly.anomaly_type.includes('sync_error')) return 'connection';
  if (anomaly.source === 'associations_import') return 'associations';
  if (anomaly.anomaly_type.includes('calculation_error')) return 'calculation';
  if (meta.actionable) return 'stock';
  return null;
}
