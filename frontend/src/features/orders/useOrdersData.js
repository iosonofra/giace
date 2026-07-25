import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../../api/client';

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
  const [orderData, setOrderData] = useState([]);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const copyResetTimeoutRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    const stateQuery = orderStateFilter === 'all'
      ? ''
      : `&state_id=${encodeURIComponent(orderStateFilter)}`;

    setTabLoading(true);
    apiFetch(`/api/orders?page=${ordersPage}&limit=${ordersLimit}${stateQuery}`)
      .then(response => response.json())
      .then(data => {
        if (cancelled) return;
        setOrderData(data.orders || []);
        setTotalOrders(data.total || 0);
        setTotalOrdersPages(data.total_pages || 1);
        setOrdersAvailableStates(data.available_states || []);
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
  }, [
    active,
    orderStateFilter,
    ordersLimit,
    ordersPage,
    refreshKey,
    setTabLoading,
  ]);

  useEffect(() => () => {
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
    }
  }, []);

  const filteredOrders = useMemo(() => orderData.filter(order =>
    String(order.order_id).includes(searchOrder) ||
    order.current_state_label.toLowerCase().includes(searchOrder.toLowerCase()) ||
    order.lines.some(line =>
      String(line.product_id).includes(searchOrder) ||
      (line.product_name || '').toLowerCase().includes(searchOrder.toLowerCase())
    )
  ), [orderData, searchOrder]);

  const ordersWithoutAssociations = useMemo(
    () => filteredOrders.filter(order =>
      order.lines.some(line => line.has_association === false)
    ).length,
    [filteredOrders],
  );

  const handleCopyOrderId = orderId => {
    navigator.clipboard.writeText(String(orderId))
      .then(() => {
        setCopiedOrderId(orderId);
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
    filteredOrders,
    handleCopyOrderId,
    ordersAvailableStates,
    ordersLimit,
    ordersPage,
    ordersWithoutAssociations,
    orderStateFilter,
    searchOrder,
    setOrderStateFilter,
    setOrdersLimit,
    setOrdersPage,
    setSearchOrder,
    totalOrders,
    totalOrdersPages,
  };
}
