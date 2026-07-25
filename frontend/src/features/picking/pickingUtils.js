export function getRelativeTimeString(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;

  if (Number.isNaN(date.getTime())) return '';

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'meno di un minuto fa';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;
}

export function getStateBadgeClass(label = '') {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes('magazzin') || normalizedLabel.includes('preparazione') || normalizedLabel.includes('attesa')) {
    return 'badge-state badge-state-magazzino';
  }
  if (normalizedLabel.includes('pagamento') || normalizedLabel.includes('payment')) {
    return 'badge-state badge-state-pagamento';
  }
  if (normalizedLabel.includes('spedito') || normalizedLabel.includes('consegnato') || normalizedLabel.includes('shipped') || normalizedLabel.includes('delivered')) {
    return 'badge-state badge-state-spedito';
  }
  if (normalizedLabel.includes('annullat') || normalizedLabel.includes('rimbors') || normalizedLabel.includes('cancel') || normalizedLabel.includes('refund')) {
    return 'badge-state badge-state-annullato';
  }
  return 'badge-state badge-state-default';
}

export function getRequirementMeta(requirement = {}) {
  const required = Number(requirement.qty_required || 0);
  const stock = Number(requirement.qty_stock || 0);
  const difference = stock - required;

  if (difference < 0) {
    return {
      rank: 0,
      tone: 'danger',
      label: `Mancano ${Math.abs(difference)}`,
      rowClass: 'picking-row-critical',
    };
  }

  if (required > 0 && difference === 0) {
    return {
      rank: 1,
      tone: 'warning',
      label: 'Stock a zero',
      rowClass: 'picking-row-warning',
    };
  }

  return {
    rank: 2,
    tone: 'success',
    label: `Disponibile (+${difference})`,
    rowClass: '',
  };
}

export function getOrderPickingMeta(order = {}) {
  const items = order.items || [];
  const missingCount = items.filter((item) => item.status === 'mancante').length;
  const partialCount = items.filter((item) => item.status === 'parziale').length;

  if (missingCount > 0) return { rank: 0, tone: 'danger', label: `${missingCount} mancanti` };
  if (partialCount > 0) return { rank: 1, tone: 'warning', label: `${partialCount} parziali` };
  return { rank: 2, tone: 'success', label: 'Pronto' };
}

export function formatPickingQty(value) {
  return Number(value || 0).toLocaleString('it-IT', { maximumFractionDigits: 2 });
}

export function getPickingRemainingQty(item = {}) {
  return Number(item.qty_remaining ?? (Number(item.qty_stock || 0) - Number(item.qty_required || 0)));
}
