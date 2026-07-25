import { useMemo, useState } from 'react';

import {
  buildSkuSuggestions,
  normalizeStockSku,
  parseOptionalSkuLimit,
} from './automaticPickingRules';


export function useAutomaticPickingConfig({ setPickingError, stockData }) {
  const [autoPickingLimit, setAutoPickingLimit] = useState(20);
  const [autoPickingStrict, setAutoPickingStrict] = useState(false);
  const [autoPickingStrategy, setAutoPickingStrategy] = useState('chronological');
  const [autoPickingMinResidual, setAutoPickingMinResidual] = useState(0);
  const [autoPickingSkuFilter, setAutoPickingSkuFilter] = useState([]);
  const [autoPickingSkuQuery, setAutoPickingSkuQuery] = useState('');
  const [autoPickingSkuMaxQuery, setAutoPickingSkuMaxQuery] = useState('');
  const [autoPickingSkuLimits, setAutoPickingSkuLimits] = useState({});
  const [autoPickingExcludedSkus, setAutoPickingExcludedSkus] = useState([]);
  const [autoPickingExcludedSkuQuery, setAutoPickingExcludedSkuQuery] = useState('');

  const autoPickingSkuSuggestions = useMemo(
    () => buildSkuSuggestions(
      stockData,
      autoPickingSkuFilter,
      autoPickingExcludedSkus,
      autoPickingSkuQuery,
    ),
    [stockData, autoPickingSkuFilter, autoPickingExcludedSkus, autoPickingSkuQuery],
  );
  const autoPickingExcludedSkuSuggestions = useMemo(
    () => buildSkuSuggestions(
      stockData,
      autoPickingSkuFilter,
      autoPickingExcludedSkus,
      autoPickingExcludedSkuQuery,
    ),
    [
      stockData,
      autoPickingSkuFilter,
      autoPickingExcludedSkus,
      autoPickingExcludedSkuQuery,
    ],
  );

  const addAutoPickingSkuFilter = (
    skuValue = autoPickingSkuQuery,
    maxValue = autoPickingSkuMaxQuery,
  ) => {
    const rawSku = String(skuValue || '').trim();
    if (!rawSku) return;

    const parsedMax = parseOptionalSkuLimit(maxValue);
    if (parsedMax.error) {
      setPickingError(parsedMax.error);
      return;
    }

    const sku = normalizeStockSku(stockData, rawSku);
    if (autoPickingExcludedSkus.some(existing => (
      existing.toUpperCase() === sku.toUpperCase()
    ))) {
      setPickingError(`La SKU ${sku} è già presente tra le SKU da escludere.`);
      return;
    }

    setAutoPickingSkuFilter(currentSkus => (
      currentSkus.some(existing => existing.toUpperCase() === sku.toUpperCase())
        ? currentSkus
        : [...currentSkus, sku]
    ));
    if (parsedMax.value !== null) {
      setAutoPickingSkuLimits(currentLimits => ({
        ...currentLimits,
        [sku]: parsedMax.value,
      }));
    }
    setAutoPickingSkuQuery('');
    setAutoPickingSkuMaxQuery('');
    setPickingError(null);
  };

  const removeAutoPickingSkuFilter = sku => {
    setAutoPickingSkuFilter(currentSkus => (
      currentSkus.filter(existing => existing !== sku)
    ));
    setAutoPickingSkuLimits(currentLimits => {
      const nextLimits = { ...currentLimits };
      delete nextLimits[sku];
      return nextLimits;
    });
  };

  const updateAutoPickingSkuLimit = (sku, value) => {
    const rawValue = String(value ?? '').trim();
    setAutoPickingSkuLimits(currentLimits => {
      const nextLimits = { ...currentLimits };
      if (rawValue === '') delete nextLimits[sku];
      else nextLimits[sku] = rawValue;
      return nextLimits;
    });
  };

  const addAutoPickingExcludedSku = (skuValue = autoPickingExcludedSkuQuery) => {
    const rawSku = String(skuValue || '').trim();
    if (!rawSku) return;

    const sku = normalizeStockSku(stockData, rawSku);
    if (autoPickingSkuFilter.some(existing => (
      existing.toUpperCase() === sku.toUpperCase()
    ))) {
      setPickingError(`La SKU ${sku} è già presente tra i filtri di inclusione.`);
      return;
    }

    setAutoPickingExcludedSkus(currentSkus => (
      currentSkus.some(existing => existing.toUpperCase() === sku.toUpperCase())
        ? currentSkus
        : [...currentSkus, sku]
    ));
    setAutoPickingExcludedSkuQuery('');
    setPickingError(null);
  };

  const removeAutoPickingExcludedSku = sku => {
    setAutoPickingExcludedSkus(currentSkus => (
      currentSkus.filter(existing => existing !== sku)
    ));
  };

  const resetAutomaticPickingConfig = () => {
    setAutoPickingLimit(20);
    setAutoPickingStrategy('chronological');
    setAutoPickingStrict(false);
    setAutoPickingMinResidual(0);
    setAutoPickingSkuFilter([]);
    setAutoPickingSkuQuery('');
    setAutoPickingSkuMaxQuery('');
    setAutoPickingSkuLimits({});
    setAutoPickingExcludedSkus([]);
    setAutoPickingExcludedSkuQuery('');
  };

  return {
    addAutoPickingExcludedSku,
    addAutoPickingSkuFilter,
    autoPickingExcludedSkuQuery,
    autoPickingExcludedSkuSuggestions,
    autoPickingExcludedSkus,
    autoPickingLimit,
    autoPickingMinResidual,
    autoPickingSkuFilter,
    autoPickingSkuLimits,
    autoPickingSkuMaxQuery,
    autoPickingSkuQuery,
    autoPickingSkuSuggestions,
    autoPickingStrategy,
    autoPickingStrict,
    removeAutoPickingExcludedSku,
    removeAutoPickingSkuFilter,
    resetAutomaticPickingConfig,
    setAutoPickingExcludedSkuQuery,
    setAutoPickingExcludedSkus,
    setAutoPickingLimit,
    setAutoPickingMinResidual,
    setAutoPickingSkuFilter,
    setAutoPickingSkuLimits,
    setAutoPickingSkuMaxQuery,
    setAutoPickingSkuQuery,
    setAutoPickingStrategy,
    setAutoPickingStrict,
    updateAutoPickingSkuLimit,
  };
}
