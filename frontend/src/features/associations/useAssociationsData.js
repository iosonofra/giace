import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, readApiJson } from '../../api/client';
import {
  matchesAssociationFilter,
  summarizeAssociations,
} from './associationPresentation';

export function useAssociationsData({
  active,
  refresh,
  refreshKey,
  setTabLoading,
  showActionMsg,
}) {
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(50);
  const [searchProduct, setSearchProduct] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [productSort, setProductSort] = useState({
    field: 'product_name',
    direction: 'asc',
  });
  const [productData, setProductData] = useState([]);
  const [associationsError, setAssociationsError] = useState('');
  const [associationsRetryKey, setAssociationsRetryKey] = useState(0);
  const [associationsRefreshing, setAssociationsRefreshing] = useState(false);
  const hasLoadedAssociationsRef = useRef(false);
  const [associationToDelete, setAssociationToDelete] = useState(null);
  const [showDeleteAssociationConfirm, setShowDeleteAssociationConfirm] = useState(false);

  useEffect(() => {
    if (!active) return undefined;

    const controller = new AbortController();
    if (!hasLoadedAssociationsRef.current) setTabLoading(true);
    else setAssociationsRefreshing(true);
    setAssociationsError('');
    apiFetch('/api/products', { signal: controller.signal })
      .then(readApiJson)
      .then(data => {
        setProductData(data || []);
        hasLoadedAssociationsRef.current = true;
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        console.error(error);
        setAssociationsError(
          error.message || 'Impossibile caricare le associazioni.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setTabLoading(false);
          setAssociationsRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [active, associationsRetryKey, refreshKey, setTabLoading]);

  useEffect(() => {
    setProductsPage(1);
  }, [availabilityFilter, productSort, searchProduct]);

  const sortedProducts = useMemo(() => productData
    .filter(product => {
      const normalizedSearch = searchProduct.trim().toLowerCase();
      const matchesSearch = (
        !normalizedSearch
        || String(product.product_id).includes(normalizedSearch)
        || String(product.product_name || '').toLowerCase().includes(normalizedSearch)
        || String(product.product_reference || '').toLowerCase().includes(normalizedSearch)
        || product.components_str.toLowerCase().includes(normalizedSearch)
        || (
          product.limiting_sku
          && product.limiting_sku.toLowerCase().includes(normalizedSearch)
        )
      );
      return (
        matchesSearch
        && matchesAssociationFilter(product, availabilityFilter)
      );
    })
    .sort((a, b) => {
      let valueA = a[productSort.field];
      let valueB = b[productSort.field];

      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';
      if (productSort.field === 'product_name') {
        valueA = valueA || `ZZZ ${a.product_id}`;
        valueB = valueB || `ZZZ ${b.product_id}`;
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return productSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();
      return productSort.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }), [
      availabilityFilter,
      productData,
      productSort,
      searchProduct,
    ]);

  const associationSummary = useMemo(
    () => summarizeAssociations(productData),
    [productData],
  );

  const totalProductsPages = Math.ceil(sortedProducts.length / productsLimit) || 1;
  const paginatedProducts = sortedProducts.slice(
    (productsPage - 1) * productsLimit,
    productsPage * productsLimit,
  );

  useEffect(() => {
    setProductsPage(currentPage => Math.min(currentPage, totalProductsPages));
  }, [totalProductsPages]);

  const handleSortProduct = field => {
    const direction = productSort.field === field && productSort.direction === 'asc'
      ? 'desc'
      : 'asc';
    setProductSort({ field, direction });
  };

  const handleDeleteAssociation = productId => {
    setAssociationToDelete(productId);
    setShowDeleteAssociationConfirm(true);
  };

  const clearAssociationFilters = () => {
    setSearchProduct('');
    setAvailabilityFilter('all');
    setProductsPage(1);
  };

  const cancelDeleteAssociation = () => {
    setShowDeleteAssociationConfirm(false);
    setAssociationToDelete(null);
  };

  const executeDeleteAssociation = async () => {
    if (!associationToDelete) return;

    const productId = associationToDelete;
    cancelDeleteAssociation();
    try {
      const response = await apiFetch(`/api/associations/${productId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setProductData(current =>
          current.filter(product => String(product.product_id) !== String(productId))
        );
        showActionMsg(`Associazione del prodotto ${productId} eliminata.`);
        refresh();
      } else {
        showActionMsg(
          `Errore nell'eliminazione: ${data.detail || data.message}`,
          'danger',
        );
      }
    } catch (error) {
      showActionMsg(`Errore: ${error.message}`, 'danger');
    }
  };

  return {
    associationToDelete,
    associationSummary,
    associationsError,
    associationsRefreshing,
    availabilityFilter,
    cancelDeleteAssociation,
    clearAssociationFilters,
    executeDeleteAssociation,
    handleDeleteAssociation,
    handleSortProduct,
    paginatedProducts,
    productData,
    productsLimit,
    productsPage,
    productSort,
    retryAssociations: () => setAssociationsRetryKey(current => current + 1),
    searchProduct,
    setAssociationToDelete,
    setAvailabilityFilter,
    setProductsLimit,
    setProductsPage,
    setSearchProduct,
    setShowDeleteAssociationConfirm,
    showDeleteAssociationConfirm,
    sortedProducts,
    totalProductsPages,
  };
}
