import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api/client';
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
    field: 'product_id',
    direction: 'asc',
  });
  const [productData, setProductData] = useState([]);
  const [associationToDelete, setAssociationToDelete] = useState(null);
  const [showDeleteAssociationConfirm, setShowDeleteAssociationConfirm] = useState(false);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    setTabLoading(true);
    apiFetch('/api/products')
      .then(response => response.json())
      .then(data => {
        if (!cancelled) setProductData(data || []);
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
    setProductsPage(1);
  }, [availabilityFilter, productSort, searchProduct]);

  const sortedProducts = useMemo(() => productData
    .filter(product => {
      const normalizedSearch = searchProduct.trim().toLowerCase();
      const matchesSearch = (
        !normalizedSearch
        || String(product.product_id).includes(normalizedSearch)
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
    availabilityFilter,
    cancelDeleteAssociation,
    executeDeleteAssociation,
    handleDeleteAssociation,
    handleSortProduct,
    paginatedProducts,
    productData,
    productsLimit,
    productsPage,
    productSort,
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
