export const getAnomalySourceLabel = source => ({
  stock_import: 'Import giacenze',
  associations_import: 'Import associazioni',
  orders_sync: 'Sync PrestaShop',
  calculation: 'Calcolo disponibilita',
}[source] || source || 'Origine sconosciuta');

export const getAnomalyTypeLabel = type => ({
  missing_sku: 'SKU mancante',
  missing_sku_in_stock: 'SKU non in giacenza',
  missing_association: 'Associazione mancante',
  negative_quantity: 'Quantita negativa',
  invalid_quantity: 'Quantita non valida',
  duplicate_sku: 'SKU duplicato',
  missing_product_id: 'Product ID mancante',
  invalid_product_id: 'Product ID non valido',
  empty_sku_list: 'Lista SKU vuota',
  duplicate_association: 'Associazione duplicata',
  parse_error: 'Errore lettura file',
  sync_error: 'Errore sincronizzazione',
  calculation_error: 'Errore calcolo',
  missing_reference: 'Riferimento mancante',
}[type] || type || 'Anomalia');

export const getAnomalyMeta = anomaly => {
  const type = anomaly?.anomaly_type || '';
  const source = anomaly?.source || '';
  const isCritical = [
    'parse_error',
    'sync_error',
    'calculation_error',
    'missing_association',
    'missing_sku_in_stock',
  ].includes(type);
  const isWarning = [
    'invalid_quantity',
    'negative_quantity',
    'missing_sku',
    'missing_product_id',
    'invalid_product_id',
    'empty_sku_list',
  ].includes(type);
  const actionLabel = type.includes('missing_association')
    ? 'Crea associazione'
    : type.includes('missing_sku_in_stock') ||
        type.includes('missing_sku') ||
        (source === 'stock_import' && type !== 'duplicate_sku')
      ? 'Controlla giacenze'
      : type.includes('sync_error')
        ? 'Controlla connessione'
        : source === 'associations_import'
          ? 'Controlla associazioni'
          : type.includes('calculation_error')
            ? 'Ricalcola'
            : '';

  return {
    sourceLabel: getAnomalySourceLabel(source),
    typeLabel: getAnomalyTypeLabel(type),
    severity: isCritical ? 'critical' : isWarning ? 'warning' : 'info',
    severityLabel: isCritical ? 'Critica' : isWarning ? 'Da verificare' : 'Info',
    actionLabel,
    actionable: Boolean(actionLabel),
  };
};
