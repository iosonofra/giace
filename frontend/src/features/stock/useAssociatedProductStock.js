import { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '../../api/client';
import { paginateStockRows } from './stockPresentation';
import {
  applyStockOrderToAssociatedProducts,
  getAssociatedProductPriority,
  matchesAssociatedProductFilter,
  matchesAssociatedProductSearch,
  summarizeAssociatedProducts,
} from './associatedProductStockPresentation';


export function useAssociatedProductStock({ active, refreshKey, stockRows }) {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState({ field: 'stock_sequence_index', direction: 'asc' });
  const [limit, setLimit] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    setData([]);
    setLoaded(false);
    setError('');
    setSelectedProduct(null);
  }, [refreshKey]);

  useEffect(() => {
    if (!active || loaded) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiFetch('/api/stock/associated-products')
      .then(async response => {
        if (!response.ok) throw new Error('Impossibile caricare i prodotti associati.');
        return response.json();
      })
      .then(result => {
        if (!cancelled) setData(Array.isArray(result) ? result : []);
      })
      .catch(requestError => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [active, loaded]);

  const stockOrderedData = useMemo(
    () => applyStockOrderToAssociatedProducts(data, stockRows),
    [data, stockRows],
  );

  const sorted = useMemo(() => stockOrderedData
    .filter(product => (
      matchesAssociatedProductFilter(product, filter)
      && matchesAssociatedProductSearch(product, search)
    ))
    .sort((left, right) => {
      if (sort.field === 'priority') {
        const priorityDifference = getAssociatedProductPriority(left)
          - getAssociatedProductPriority(right);
        if (priorityDifference !== 0) {
          return sort.direction === 'asc'
            ? priorityDifference
            : -priorityDifference;
        }
        const residualDifference = Number(left.qty_residual ?? Number.MAX_SAFE_INTEGER)
          - Number(right.qty_residual ?? Number.MAX_SAFE_INTEGER);
        if (residualDifference !== 0) return residualDifference;
        return Number(left.product_id || 0) - Number(right.product_id || 0);
      }
      let leftValue = left[sort.field] ?? '';
      let rightValue = right[sort.field] ?? '';
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sort.direction === 'asc'
          ? leftValue - rightValue
          : rightValue - leftValue;
      }
      leftValue = String(leftValue).toLowerCase();
      rightValue = String(rightValue).toLowerCase();
      return sort.direction === 'asc'
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    }), [filter, search, sort, stockOrderedData]);

  const summary = useMemo(() => summarizeAssociatedProducts(data), [data]);
  const pagination = useMemo(
    () => paginateStockRows(sorted, page, limit),
    [limit, page, sorted],
  );

  useEffect(() => {
    setPage(1);
  }, [filter, limit, search, sort]);

  useEffect(() => {
    if (page !== pagination.page) setPage(pagination.page);
  }, [page, pagination.page]);

  const handleSort = field => {
    setSort(current => ({
      field,
      direction: current.field === field && current.direction === 'asc'
        ? 'desc'
        : 'asc',
    }));
  };

  const sortPreset = (() => {
    if (sort.field === 'stock_sequence_index' && sort.direction === 'asc') return 'stock';
    if (sort.field === 'priority' && sort.direction === 'asc') return 'priority';
    if (sort.field === 'qty_committed' && sort.direction === 'desc') return 'committed';
    return 'custom';
  })();

  const setSortPreset = preset => {
    const presets = {
      stock: { field: 'stock_sequence_index', direction: 'asc' },
      priority: { field: 'priority', direction: 'asc' },
      committed: { field: 'qty_committed', direction: 'desc' },
    };
    if (presets[preset]) setSort(presets[preset]);
  };

  const retry = () => {
    setError('');
    setLoaded(false);
  };

  return {
    associatedProductData: stockOrderedData,
    associatedProductError: error,
    associatedProductFilter: filter,
    associatedProductLimit: limit,
    associatedProductLoaded: loaded,
    associatedProductLoading: loading,
    associatedProductPage: page,
    associatedProductRows: pagination.rows,
    associatedProductSearch: search,
    associatedProductSort: sort,
    associatedProductSortPreset: sortPreset,
    associatedProductSummary: summary,
    associatedProductTotalPages: pagination.totalPages,
    filteredAssociatedProducts: sorted,
    handleSortAssociatedProducts: handleSort,
    retryAssociatedProducts: retry,
    selectedAssociatedProduct: selectedProduct,
    setAssociatedProductFilter: setFilter,
    setAssociatedProductLimit: setLimit,
    setAssociatedProductPage: setPage,
    setAssociatedProductSearch: setSearch,
    setAssociatedProductSortPreset: setSortPreset,
    setSelectedAssociatedProduct: setSelectedProduct,
  };
}
