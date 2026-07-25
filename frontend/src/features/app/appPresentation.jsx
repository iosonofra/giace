import React from 'react';

export function getOrderStateBadgeClass(stateLabel) {
  if (!stateLabel) return 'badge-state-default';
  const label = stateLabel.toLowerCase();
  if (
    label.includes('magazzino')
    || label.includes('rosate')
  ) {
    return 'badge-state-magazzino';
  }
  if (
    label.includes('pagamento')
    || label.includes('accettato')
    || label.includes('attesa')
  ) {
    return 'badge-state-pagamento';
  }
  if (
    label.includes('spedito')
    || label.includes('consegnato')
    || label.includes('inviato')
  ) {
    return 'badge-state-spedito';
  }
  if (
    label.includes('annullato')
    || label.includes('rimborsato')
    || label.includes('errore')
  ) {
    return 'badge-state-annullato';
  }
  return 'badge-state-default';
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('it-IT');
}

export function highlightText(text, search) {
  if (!search || !text) return text;
  const normalizedSearch = search.toLowerCase();
  const escapedSearch = search.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    '\\$&',
  );
  const parts = String(text).split(
    new RegExp(`(${escapedSearch})`, 'gi'),
  );
  return (
    <span>
      {parts.map((part, index) => (
        part.toLowerCase() === normalizedSearch
          ? <mark key={index}>{part}</mark>
          : part
      ))}
    </span>
  );
}
