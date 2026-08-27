import { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '../../api/client';
import {
  matchesStockAvailability,
  paginateStockRows,
  summarizeStock,
} from './stockPresentation';


export function useStockListing({
  active,
  ensureLoaded,
  refreshKey,
  setTabLoading,
  showActionMsg,
}) {
  const [searchStock, setSearchStock] = useState('');
  const [standardStockSort, setStandardStockSort] =
    useState({ field: 'index', direction: 'asc' });
  const [missingStockSort, setMissingStockSort] =
    useState({ field: 'qty_committed', direction: 'desc' });
  const [stockData, setStockData] = useState([]);
  const [stockViewMode, setStockViewMode] = useState('standard');
  const [missingStockData, setMissingStockData] = useState([]);
  const [stockAvailabilityFilter, setStockAvailabilityFilter] =
    useState('all');
  const [stockLimit, setStockLimit] = useState('all');
  const [stockPage, setStockPage] = useState(1);

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

  const stockSort = stockViewMode === 'missing'
    ? missingStockSort
    : standardStockSort;
  const setStockSort = nextSort => {
    if (stockViewMode === 'missing') {
      setMissingStockSort(nextSort);
      return;
    }
    setStandardStockSort(nextSort);
  };
  const handleSortStock = field => {
    const direction = stockSort.field === field && stockSort.direction === 'asc'
      ? 'desc'
      : 'asc';
    setStockSort({ field, direction });
  };
  const currentStockSourceData = stockViewMode === 'missing'
    ? missingStockData
    : stockData;
  const stockSummary = useMemo(
    () => summarizeStock(currentStockSourceData),
    [currentStockSourceData],
  );
  const sortedStock = useMemo(() => [...currentStockSourceData]
    .filter(item => (
      (stockViewMode === 'missing' || matchesStockAvailability(item, stockAvailabilityFilter))
      && (
        item.sku.toLowerCase().includes(searchStock.toLowerCase())
        || (
          item.description
          && item.description.toLowerCase().includes(searchStock.toLowerCase())
        )
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
    }), [
      currentStockSourceData,
      searchStock,
      stockAvailabilityFilter,
      stockSort,
      stockViewMode,
    ]);

  const copyMissingStockSkus = async (rows = sortedStock) => {
    const values = rows.map(item => item.sku).filter(Boolean);
    if (values.length === 0) return;
    const text = values.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    showActionMsg?.(`${values.length} SKU copiati negli appunti.`);
  };

  const exportMissingStockCsv = (rows = sortedStock) => {
    if (rows.length === 0) return;
    const escapeCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const header = ['SKU', 'Unita richieste', 'Prodotti associati', 'Stato'];
    const lines = rows.map(item => [
      item.sku,
      Number(item.qty_committed || 0),
      Number(item.connected_products || 0),
      'Assente dal foglio',
    ]);
    const csv = [header, ...lines]
      .map(line => line.map(escapeCell).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sku-non-presenti-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showActionMsg?.(`Esportati ${rows.length} SKU non presenti.`);
  };
  const stockPagination = useMemo(
    () => paginateStockRows(sortedStock, stockPage, stockLimit),
    [sortedStock, stockLimit, stockPage],
  );

  useEffect(() => {
    setStockPage(1);
  }, [
    searchStock,
    stockAvailabilityFilter,
    stockLimit,
    stockSort.direction,
    stockSort.field,
    stockViewMode,
  ]);

  useEffect(() => {
    if (stockPage !== stockPagination.page) {
      setStockPage(stockPagination.page);
    }
  }, [stockPage, stockPagination.page]);

  return {
    copyMissingStockSkus,
    currentStockSourceData,
    exportMissingStockCsv,
    handleSortStock,
    missingStockData,
    paginatedStock: stockPagination.rows,
    searchStock,
    setSearchStock,
    setStockAvailabilityFilter,
    setStockLimit,
    setStockPage,
    setStockSort,
    setStockViewMode,
    sortedStock,
    stockData,
    stockSummary,
    stockLimit,
    stockPage,
    stockSort,
    stockViewMode,
    totalStockPages: stockPagination.totalPages,
  };
}
