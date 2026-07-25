export function normalizeStockSku(stockData, value) {
  const rawSku = String(value || '').trim();
  const stockMatch = stockData.find(item => (
    item.sku
    && item.sku.trim().toUpperCase() === rawSku.toUpperCase()
  ));
  return stockMatch ? stockMatch.sku.trim() : rawSku;
}

export function buildSkuSuggestions(
  stockData,
  includedSkus,
  excludedSkus,
  query,
) {
  return Array.from(
    new Map(
      stockData
        .filter(item => item.sku && !String(item.sku).startsWith('__spacer_'))
        .map(item => [
          String(item.sku).trim().toUpperCase(),
          String(item.sku).trim(),
        ]),
    ).values(),
  )
    .filter(sku => (
      !includedSkus.some(selected => selected.toUpperCase() === sku.toUpperCase())
      && !excludedSkus.some(selected => selected.toUpperCase() === sku.toUpperCase())
      && (
        !query.trim()
        || sku.toLowerCase().includes(query.trim().toLowerCase())
      )
    ))
    .slice(0, 12);
}

export function parseOptionalSkuLimit(value) {
  const rawValue = String(value ?? '').trim();
  if (rawValue === '') return { value: null };

  const numericValue = Number(rawValue);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return {
      error: 'Il massimo per ordine della SKU deve essere un numero intero superiore a 0.',
    };
  }
  return { value: numericValue };
}

export function buildAutomaticPickingRequest({
  excludedSkus,
  limit,
  minResidual,
  skuFilter,
  skuLimits,
  strategy,
  strict,
}) {
  const parsedLimit = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
    return { error: 'Inserisci un numero ordini compreso tra 1 e 500.' };
  }

  const parsedMinResidual = Number(minResidual || 0);
  if (!Number.isFinite(parsedMinResidual) || parsedMinResidual < 0) {
    return {
      error: 'Inserisci una scorta minima SKU valida, pari a 0 o superiore.',
    };
  }

  const parsedSkuLimits = {};
  for (const [sku, value] of Object.entries(skuLimits)) {
    const parsed = parseOptionalSkuLimit(value);
    if (parsed.error) {
      return {
        error: `Il massimo per ordine della SKU ${sku} deve essere un numero intero superiore a 0.`,
      };
    }
    if (parsed.value !== null) parsedSkuLimits[sku] = parsed.value;
  }

  return {
    payload: {
      excluded_skus: excludedSkus,
      limit: parsedLimit,
      min_sku_residual: parsedMinResidual,
      selection_strategy: strategy,
      sku_filter: skuFilter,
      sku_limits: parsedSkuLimits,
      strict_chronology: strict,
    },
  };
}
