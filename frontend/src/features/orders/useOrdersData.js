import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, readApiJson } from '../../api/client';

export function useOrdersData({
  active,
  refreshKey,
  setTabLoading,
  showActionMsg,
}) {
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(50);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalOrdersPages, setTotalOrdersPages] = useState(1);
  const [ordersAvailableStates, setOrdersAvailableStates] = useState([]);
  const [orderStateFilter, setOrderStateFilter] = useState('all');
  const [searchOrder, setSearchOrder] = useState('');
  const [debouncedSearchOrder, setDebouncedSearchOrder] = useState('');
  const [onlyMissingAssociations, setOnlyMissingAssociations] = useState(false);
  const [ordersSortBy, setOrdersSortBy] = useState('date_add');
  const [ordersSortDirection, setOrdersSortDirection] = useState('desc');
  const [ordersError, setOrdersError] = useState('');
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);
  const [ordersRetryKey, setOrdersRetryKey] = useState(0);
  const [totalProductLines, setTotalProductLines] = useState(0);
  const [ordersWithoutAssociations, setOrdersWithoutAssociations] = useState(0);
  const [orderData, setOrderData] = useState([]);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [copyFeedbackKey, setCopyFeedbackKey] = useState(0);
  const copyResetTimeoutRef = useRef(null);
  const hasLoadedOrdersRef = useRef(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchOrder(searchOrder.trim());
    }, 280);
    return () => clearTimeout(timeoutId);
  }, [searchOrder]);

  useEffect(() => {
    if (!active) return undefined;

    const controller = new AbortController();
    const stateQuery = orderStateFilter === 'all'
      ? ''
      : `&state_id=${encodeURIComponent(orderStateFilter)}`;
    const searchQuery = debouncedSearchOrder
      ? `&query=${encodeURIComponent(debouncedSearchOrder)}`
      : '';
    const missingQuery = onlyMissingAssociations
      ? '&missing_association=true'
      : '';
    const sortQuery = `&sort_by=${encodeURIComponent(ordersSortBy)}&sort_direction=${encodeURIComponent(ordersSortDirection)}`;

    if (!hasLoadedOrdersRef.current) setTabLoading(true);
    else setOrdersRefreshing(true);
    setOrdersError('');
    apiFetch(
      `/api/orders?page=${ordersPage}&limit=${ordersLimit}${stateQuery}${searchQuery}${missingQuery}${sortQuery}`,
      { signal: controller.signal },
    )
      .then(readApiJson)
      .then(data => {
        setOrderData(data.orders || []);
        setTotalOrders(data.total || 0);
        setTotalOrdersPages(data.total_pages || 1);
        setOrdersAvailableStates(data.available_states || []);
        setTotalProductLines(data.summary?.product_lines || 0);
        setOrdersWithoutAssociations(data.summary?.without_associations || 0);
        hasLoadedOrdersRef.current = true;
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        console.error(error);
        setOrdersError(
          error.message || 'Impossibile caricare gli ordini. Riprova tra poco.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setTabLoading(false);
          setOrdersRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [
    active,
    debouncedSearchOrder,
    onlyMissingAssociations,
    orderStateFilter,
    ordersLimit,
    ordersPage,
    ordersRetryKey,
    ordersSortBy,
    ordersSortDirection,
    refreshKey,
    setTabLoading,
  ]);

  useEffect(() => () => {
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
    }
  }, []);

  const clearOrderFilters = useCallback(() => {
    setSearchOrder('');
    setDebouncedSearchOrder('');
    setOrderStateFilter('all');
    setOnlyMissingAssociations(false);
    setOrdersPage(1);
  }, []);

  const handleOrdersSort = useCallback((column) => {
    setOrdersPage(1);
    if (ordersSortBy === column) {
      setOrdersSortDirection(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setOrdersSortBy(column);
    setOrdersSortDirection(column === 'date_add' ? 'desc' : 'asc');
  }, [ordersSortBy]);

  const handleCopyOrderId = orderId => {
    navigator.clipboard.writeText(String(orderId))
      .then(() => {
        setCopiedOrderId(orderId);
        setCopyFeedbackKey(current => current + 1);
        if (copyResetTimeoutRef.current) {
          clearTimeout(copyResetTimeoutRef.current);
        }
        copyResetTimeoutRef.current = setTimeout(() => {
          setCopiedOrderId(current => current === orderId ? null : current);
        }, 1500);
        showActionMsg(`ID ordine ${orderId} copiato.`);
      })
      .catch(error => {
        console.error("Errore nella copia dell'ID Ordine:", error);
        showActionMsg("Errore durante la copia dell'ID ordine.", 'danger');
      });
  };

  return {
    copiedOrderId,
    copyFeedbackKey,
    clearOrderFilters,
    filteredOrders: orderData,
    handleCopyOrderId,
    handleOrdersSort,
    onlyMissingAssociations,
    ordersAvailableStates,
    ordersLimit,
    ordersPage,
    ordersError,
    ordersRefreshing,
    ordersSortBy,
    ordersSortDirection,
    ordersWithoutAssociations,
    orderStateFilter,
    searchOrder,
    setOrderStateFilter,
    setOnlyMissingAssociations,
    setOrdersLimit,
    setOrdersPage,
    setSearchOrder,
    retryOrders: () => setOrdersRetryKey(current => current + 1),
    totalProductLines,
    totalOrders,
    totalOrdersPages,
  };
}
