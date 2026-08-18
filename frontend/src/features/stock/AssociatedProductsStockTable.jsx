import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import { getAssociatedProductAvailability } from './associatedProductStockPresentation';


function ProductSortHeader({ className = '', field, help = '', label, onSort, sort }) {
  const active = sort.field === field;
  return (
    <th
      className={className}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        className={`stock-sort-button ${active ? 'active' : ''}`}
        onClick={() => onSort(field)}
        title={help || undefined}
      >
        {label}
        <span aria-hidden="true">
          {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}


export function AssociatedProductsStockTable({ stock }) {
  const [copiedValue, setCopiedValue] = useState('');
  const copyResetTimeout = useRef(null);
  const {
    associatedProductError,
    associatedProductLoaded,
    associatedProductLoading,
    associatedProductRows,
    associatedProductSearch,
    associatedProductSort,
    filteredAssociatedProducts,
    formatPickingQty,
    handleSortAssociatedProducts,
    highlightText,
    setSelectedAssociatedProduct,
    TableSkeleton,
  } = stock;

  useEffect(() => () => {
    if (copyResetTimeout.current) window.clearTimeout(copyResetTimeout.current);
  }, []);

  const copyValue = async (value, key) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedValue(key);
      if (copyResetTimeout.current) window.clearTimeout(copyResetTimeout.current);
      copyResetTimeout.current = window.setTimeout(() => setCopiedValue(''), 1400);
    } catch {
      setCopiedValue('');
    }
  };

  const showStockGroups = associatedProductSort.field === 'stock_sequence_index';
  const stockGroupCounts = useMemo(() => {
    const counts = new Map();
    filteredAssociatedProducts.forEach(product => {
      const sku = product.stock_order_sku || '';
      counts.set(sku, (counts.get(sku) || 0) + 1);
    });
    return counts;
  }, [filteredAssociatedProducts]);

  if (!associatedProductLoaded || associatedProductLoading) {
    return <TableSkeleton rows={8} cols={6} />;
  }
  if (associatedProductError) {
    return (
      <div className="stock-empty-state danger">
        <strong>Prodotti associati non disponibili</strong>
        <p>{associatedProductError} Le altre viste della giacenza restano operative.</p>
      </div>
    );
  }
  if (filteredAssociatedProducts.length === 0) {
    return (
      <div className="stock-empty-state">
        <strong>Nessun prodotto associato corrisponde ai filtri</strong>
        <p>Modifica la ricerca o seleziona un altro stato di disponibilità.</p>
      </div>
    );
  }

  return (
    <table className="custom-table stock-inventory-table associated-products-stock-table">
      <thead>
        <tr>
          <ProductSortHeader
            className="stock-col-sku associated-product-col-name"
            field="product_name"
            label="Prodotto"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <ProductSortHeader
            className="stock-number-heading stock-col-quantity"
            field="qty_total"
            label="Totale"
            help="Numero massimo di prodotti assemblabili prima degli impegni correnti"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <ProductSortHeader
            className="stock-number-heading stock-col-quantity"
            field="qty_committed"
            label="Impegnata"
            help="Capacità di prodotto assorbita dagli ordini sincronizzati"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <ProductSortHeader
            className="stock-number-heading stock-col-quantity"
            field="qty_residual"
            label="Residua"
            help="Numero di prodotti ancora assemblabili con i componenti disponibili"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <th className="stock-col-level" title="Percentuale di capacità prodotto ancora disponibile">Livello stock</th>
          <th className="associated-product-components-heading">Componenti</th>
        </tr>
      </thead>
      <tbody>
        {associatedProductRows.map((product, rowIndex) => {
          const availability = getAssociatedProductAvailability(product);
          const notCalculated = product.qty_residual === null;
          const previousProduct = associatedProductRows[rowIndex - 1];
          const startsStockGroup = showStockGroups && (
            rowIndex === 0
            || previousProduct?.stock_order_sku !== product.stock_order_sku
          );
          const nextProduct = associatedProductRows[rowIndex + 1];
          const endsStockGroup = showStockGroups && (
            rowIndex === associatedProductRows.length - 1
            || nextProduct?.stock_order_sku !== product.stock_order_sku
          );
          const groupCount = stockGroupCounts.get(product.stock_order_sku || '') || 0;
          return (
            <Fragment key={product.product_id}>
              {startsStockGroup && (
                <tr className="associated-product-stock-group-row">
                  <th colSpan="6" scope="rowgroup">
                    <div className="associated-product-stock-group-header">
                      <span className="associated-product-stock-group-identity">
                        <small>SKU principale</small>
                        <strong>
                          {product.stock_order_sku || 'Altri prodotti associati'}
                        </strong>
                      </span>
                      <span className="associated-product-stock-group-count">
                        <strong>{groupCount}</strong>
                        {groupCount === 1 ? 'prodotto' : 'prodotti'}
                      </span>
                    </div>
                  </th>
                </tr>
              )}
              <tr className={`stock-inventory-row associated-product-stock-row ${availability.tone} ${
                showStockGroups ? 'grouped' : ''
              } ${endsStockGroup ? 'group-end' : ''}`}>
              <td
                className="stock-col-sku associated-product-col-name"
                title={product.product_name || `Prodotto ${product.product_id}`}
              >
                <strong className="associated-product-name">
                  {highlightText(
                    product.product_name || `Prodotto ${product.product_id}`,
                    associatedProductSearch,
                  )}
                </strong>
                <span className="associated-product-meta">
                  <button
                    type="button"
                    className="associated-product-meta-copy"
                    onClick={() => copyValue(product.product_id, `id-${product.product_id}`)}
                    title="Copia ID PrestaShop"
                  >
                    ID {highlightText(product.product_id, associatedProductSearch)}
                    {copiedValue === `id-${product.product_id}` && <small>Copiato</small>}
                  </button>
                  {product.product_reference && (
                    <>
                      <i aria-hidden="true">·</i>
                      <button
                        type="button"
                        className="associated-product-meta-copy"
                        onClick={() => copyValue(
                          product.product_reference,
                          `reference-${product.product_id}`,
                        )}
                        title="Copia riferimento prodotto"
                      >
                        Rif. {highlightText(product.product_reference, associatedProductSearch)}
                        {copiedValue === `reference-${product.product_id}` && <small>Copiato</small>}
                      </button>
                    </>
                  )}
                  {product.limiting_sku && (
                    <>
                      <i aria-hidden="true">·</i>
                      <span>Limita: <strong>{product.limiting_sku}</strong></span>
                    </>
                  )}
                </span>
              </td>
              <td className="stock-number-cell stock-col-quantity">
                {notCalculated ? '—' : formatPickingQty(product.qty_total)}
              </td>
              <td className="stock-number-cell stock-col-quantity">
                {notCalculated ? '—' : product.qty_committed > 0 ? (
                  <span className="associated-product-committed-badge">
                    {formatPickingQty(product.qty_committed)}
                  </span>
                ) : <span className="stock-zero-value">0</span>}
              </td>
              <td className={`stock-number-cell stock-col-quantity stock-residual ${availability.tone}`}>
                {notCalculated ? '—' : formatPickingQty(product.qty_residual)}
              </td>
              <td className="stock-col-level">
                <div className="stock-level-cell">
                  <span className={`stock-level-label ${availability.tone}`}>
                    {availability.label}
                  </span>
                  <div>
                    <span
                      className="stock-bar-container"
                      role="progressbar"
                      aria-label={`Disponibilità prodotto ${product.product_id}`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={Math.round(availability.percent)}
                    >
                      <span
                        className={`stock-bar-fill ${availability.tone}`}
                        style={{ width: `${availability.percent}%` }}
                      />
                    </span>
                    <span className="stock-level-percentage">
                      {Math.round(availability.percent)}%
                    </span>
                  </div>
                </div>
              </td>
              <td className="associated-product-components-cell">
                <button
                  type="button"
                  className="stock-associated-products-button"
                  onClick={() => setSelectedAssociatedProduct(product)}
                  aria-label={`Mostra ${product.components.length} componenti del prodotto ${product.product_id}`}
                >
                  <strong>{product.components.length}</strong>
                  <span>componenti</span>
                  <b aria-hidden="true">→</b>
                </button>
              </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
