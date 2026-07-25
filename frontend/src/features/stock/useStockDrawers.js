import { useEffect, useRef, useState } from 'react';

import { apiFetch } from '../../api/client';


export function useStockDrawers({ showActionMsg }) {
  const [selectedSkuForOrders, setSelectedSkuForOrders] = useState(null);
  const [skuOrdersData, setSkuOrdersData] = useState([]);
  const [loadingSkuOrders, setLoadingSkuOrders] = useState(false);
  const [selectedSkuForProducts, setSelectedSkuForProducts] = useState(null);
  const [skuProductsData, setSkuProductsData] = useState([]);
  const [loadingSkuProducts, setLoadingSkuProducts] = useState(false);
  const [skuOrdersSortDirection, setSkuOrdersSortDirection] = useState('asc');
  const [smartSkuCounterEnabled, setSmartSkuCounterEnabled] = useState(false);
  const [smartSkuCounterData, setSmartSkuCounterData] = useState(null);
  const [loadingSmartSkuCounter, setLoadingSmartSkuCounter] = useState(false);
  const [copiedAssociatedProductId, setCopiedAssociatedProductId] = useState(null);
  const copyResetTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current);
  }, []);

  const fetchSmartSkuCounter = async sku => {
    if (!sku) return;
    setLoadingSmartSkuCounter(true);
    try {
      const response = await apiFetch(
        `/api/stock/${encodeURIComponent(sku)}/orders/smart-counter`,
      );
      setSmartSkuCounterData(response.ok ? await response.json() : null);
    } catch (error) {
      console.error('Errore nel recupero del contatore smart:', error);
      setSmartSkuCounterData(null);
    } finally {
      setLoadingSmartSkuCounter(false);
    }
  };

  const fetchSkuOrders = async sku => {
    setLoadingSkuOrders(true);
    setSelectedSkuForOrders(sku);
    setSkuOrdersSortDirection('asc');
    setSmartSkuCounterData(null);
    if (smartSkuCounterEnabled) fetchSmartSkuCounter(sku);
    try {
      const response = await apiFetch(`/api/stock/${encodeURIComponent(sku)}/orders`);
      setSkuOrdersData(response.ok ? await response.json() : []);
    } catch (error) {
      console.error('Errore nel recupero degli ordini impegnati:', error);
      setSkuOrdersData([]);
    } finally {
      setLoadingSkuOrders(false);
    }
  };

  const fetchSkuProducts = async sku => {
    if (!sku) return;
    setLoadingSkuProducts(true);
    setSelectedSkuForProducts(sku);
    setSkuProductsData([]);
    try {
      const response = await apiFetch(`/api/stock/${encodeURIComponent(sku)}/products`);
      const data = response.ok ? await response.json() : [];
      setSkuProductsData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore nel recupero dei prodotti associati:', error);
      setSkuProductsData([]);
    } finally {
      setLoadingSkuProducts(false);
    }
  };

  const toggleSmartSkuCounter = () => {
    const next = !smartSkuCounterEnabled;
    setSmartSkuCounterEnabled(next);
    if (next) {
      setSkuOrdersSortDirection('asc');
      fetchSmartSkuCounter(selectedSkuForOrders);
    } else {
      setSmartSkuCounterData(null);
    }
  };

  const handleCopyAssociatedProductId = productId => {
    navigator.clipboard.writeText(String(productId))
      .then(() => {
        setCopiedAssociatedProductId(productId);
        if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = setTimeout(() => {
          setCopiedAssociatedProductId(current => (
            current === productId ? null : current
          ));
        }, 1500);
        showActionMsg(`ID prodotto ${productId} copiato.`);
      })
      .catch(error => {
        console.error("Errore nella copia dell'ID prodotto:", error);
        showActionMsg("Errore durante la copia dell'ID prodotto.", 'danger');
      });
  };

  return {
    copiedAssociatedProductId,
    fetchSkuOrders,
    fetchSkuProducts,
    handleCopyAssociatedProductId,
    loadingSkuOrders,
    loadingSkuProducts,
    loadingSmartSkuCounter,
    selectedSkuForOrders,
    selectedSkuForProducts,
    setSelectedSkuForOrders,
    setSelectedSkuForProducts,
    setSkuOrdersSortDirection,
    skuOrdersData,
    skuOrdersSortDirection,
    skuProductsData,
    smartSkuCounterData,
    smartSkuCounterEnabled,
    toggleSmartSkuCounter,
  };
}
