import { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '../../api/client';


export function useStockListing({ active, ensureLoaded, refreshKey, setTabLoading }) {
  const [searchStock, setSearchStock] = useState('');
  const [stockSort, setStockSort] = useState({ field: 'index', direction: 'asc' });
  const [stockData, setStockData] = useState([]);
  const [stockViewMode, setStockViewMode] = useState('standard');
  const [missingStockData, setMissingStockData] = useState([]);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    setTabLoading(true);
    Promise.all([
      apiFetch('/api/stock').then(response => response.json()),
      apiFetch('/api/stock/missing').then(response => response.json()),
    ])
      .then(([stock, missing]) => {
        if (cancelled) return;
        setStockData(stock || []);
        setMissingStockData(missing || []);
      })
      .catch(error => {
        if (!cancelled) console.error(error);
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, refreshKey, setTabLoading]);

  useEffect(() => {
    if (!ensureLoaded || stockData.length > 0) return undefined;
    let cancelled = false;
    apiFetch('/api/stock')
      .then(response => response.json())
      .then(data => {
        if (!cancelled) setStockData(data || []);
      })
      .catch(error => {
        if (!cancelled) console.error(error);
      });
    return () => {
      cancelled = true;
    };
  }, [ensureLoaded, stockData.length]);

  const handleSortStock = field => {
    const direction = stockSort.field === field && stockSort.direction === 'asc'
      ? 'desc'
      : 'asc';
    setStockSort({ field, direction });
  };
  const currentStockSourceData = stockViewMode === 'standard'
    ? stockData
    : missingStockData;
  const sortedStock = useMemo(() => currentStockSourceData
    .filter(item => (
      item.sku.toLowerCase().includes(searchStock.toLowerCase())
      || (
        item.description
        && item.description.toLowerCase().includes(searchStock.toLowerCase())
      )
    ))
    .sort((left, right) => {
      let leftValue = left[stockSort.field] ?? '';
      let rightValue = right[stockSort.field] ?? '';
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return stockSort.direction === 'asc'
          ? leftValue - rightValue
          : rightValue - leftValue;
      }
      leftValue = String(leftValue).toLowerCase();
      rightValue = String(rightValue).toLowerCase();
      return stockSort.direction === 'asc'
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    }), [currentStockSourceData, searchStock, stockSort]);

  return {
    currentStockSourceData,
    handleSortStock,
    missingStockData,
    searchStock,
    setSearchStock,
    setStockViewMode,
    sortedStock,
    stockData,
    stockSort,
    stockViewMode,
  };
}
