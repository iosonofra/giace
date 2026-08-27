import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import { getAssociatedProductAvailability } from './associatedProductStockPresentation';


function ProductSortHeader({ className = '', field, help = '', label, onSort, sort }) {
  const active = sort.field === field;
  const helpId = help ? `associated-product-${field}-sort-help` : undefined;
  return (
    <th
      className={className}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        className={`stock-sort-button ${active ? 'active' : ''}`}
        onClick={() => onSort(field)}
        aria-describedby={helpId}
      >
        {label}
        <span aria-hidden="true">
          {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
        {help && <span id={helpId} className="sr-only">{help}</span>}
      </button>
    </th>
  );
}


function getProductDisplayName(product) {
  return String(product.product_name || '').trim() || 'Nome prodotto non disponibile';
}


function AvailabilityVisual({ availability, product }) {
  const productName = getProductDisplayName(product);
  return (
    <div className="stock-level-cell associated-product-level-cell">
      <span className={`stock-level-label ${availability.tone}`}>
        {availability.label}
      </span>
      <span
        className="stock-bar-container"
        role="progressbar"
        aria-label={`Disponibilità di ${productName}`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(availability.percent)}
      >
        <span
          className={`stock-bar-fill ${availability.tone}`}
          style={{ '--stock-ratio': Math.max(0, Math.min(100, availability.percent)) / 100 }}
        />
      </span>
      <span className="stock-level-percentage">
        {Math.round(availability.percent)}%
      </span>
      {product.limiting_sku && (
        <span className="associated-product-level-limiter" title={product.limiting_sku}>
          Limitato da <strong>{product.limiting_sku}</strong>
        </span>
      )}
    </div>
  );
}


function ComponentsButton({ product, setSelectedAssociatedProduct }) {
  const componentCount = product.components.length;
  return (
    <button
      type="button"
      className="stock-associated-products-button"
      onClick={() => setSelectedAssociatedProduct(product)}
      aria-label={`Vedi ${componentCount} ${componentCount === 1 ? 'componente' : 'componenti'} del prodotto ${getProductDisplayName(product)}`}
    >
      <span>Vedi</span>
      <strong>{componentCount}</strong>
      <span>{componentCount === 1 ? 'componente' : 'componenti'}</span>
      <b aria-hidden="true">→</b>
    </button>
  );
}


function CommittedQuantity({ fetchSkuOrders, formatPickingQty, Icons, product }) {
  if (product.qty_committed === null) return '—';
  if (product.qty_committed <= 0) return <span className="stock-zero-value">0</span>;
  if (!product.limiting_sku) {
    return (
      <span className="associated-product-committed-badge">
        {formatPickingQty(product.qty_committed)}
      </span>
    );
  }
  const productName = getProductDisplayName(product);
  return (
    <button
      type="button"
      className="clickable-qty-badge"
      onClick={() => fetchSkuOrders(product.limiting_sku)}
      title={`Mostra gli ordini che impegnano lo SKU limitante ${product.limiting_sku}`}
      aria-label={`Mostra gli ordini che impegnano ${productName} tramite lo SKU limitante ${product.limiting_sku}`}
    >
      <span>{formatPickingQty(product.qty_committed)}</span>
      <Icons.Eye />
    </button>
  );
}


export function AssociatedProductsStockTable({ stock }) {
  const [copiedValue, setCopiedValue] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const copyResetTimeout = useRef(null);
  const {
    associatedProductError,
    associatedProductLoaded,
    associatedProductLoading,
    associatedProductRows,
    associatedProductSearch,
    associatedProductSort,
    filteredAssociatedProducts,
    fetchSkuOrders,
    formatPickingQty,
    handleSortAssociatedProducts,
    highlightText,
    Icons,
    retryAssociatedProducts,
    setAssociatedProductFilter,
    setAssociatedProductSearch,
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
      setCopyFeedback(`${value} copiato negli appunti.`);
      if (copyResetTimeout.current) window.clearTimeout(copyResetTimeout.current);
      copyResetTimeout.current = window.setTimeout(() => {
        setCopiedValue('');
        setCopyFeedback('');
      }, 1800);
    } catch {
      setCopiedValue('');
      setCopyFeedback('Copia non riuscita. Seleziona il valore e riprova.');
    }
  };

  const resetFilters = () => {
    setAssociatedProductSearch('');
    setAssociatedProductFilter('all');
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
        <button type="button" className="btn btn-secondary" onClick={retryAssociatedProducts}>
          Riprova
        </button>
      </div>
    );
  }
  if (filteredAssociatedProducts.length === 0) {
    return (
      <div className="stock-empty-state">
        <strong>Nessun prodotto associato corrisponde ai filtri</strong>
        <p>Modifica la ricerca o seleziona un altro stato di disponibilità.</p>
        <button type="button" className="btn btn-secondary" onClick={resetFilters}>
          Ripristina filtri
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{copyFeedback}</p>
      <table className="custom-table stock-inventory-table associated-products-stock-table">
      <thead>
        <tr>
          <ProductSortHeader
            className="stock-col-sku associated-product-col-name"
            field="product_name"
            label="Prodotto"
            help="Ordina alfabeticamente per nome prodotto"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <ProductSortHeader
            className="stock-number-heading stock-col-quantity"
            field="qty_total"
            label="Capacità"
            help="Ordina per numero massimo di prodotti assemblabili prima degli ordini attivi"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <ProductSortHeader
            className="stock-number-heading stock-col-quantity"
            field="qty_committed"
            label="Impegnati"
            help="Ordina per quantità di prodotti assorbita dagli ordini attivi"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <ProductSortHeader
            className="stock-number-heading stock-col-quantity"
            field="qty_residual"
            label="Disponibili"
            help="Ordina per numero di prodotti ancora assemblabili"
            onSort={handleSortAssociatedProducts}
            sort={associatedProductSort}
          />
          <th className="stock-col-level">
            Disponibilità
            <span className="sr-only">Percentuale di capacità prodotto ancora disponibile</span>
          </th>
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
                        <strong>
                          {product.stock_order_sku
                            ? `SKU ${product.stock_order_sku}`
                            : 'Altri prodotti associati'}
                        </strong>
                        <small>
                          {groupCount} {groupCount === 1 ? 'prodotto associato' : 'prodotti associati'}
                        </small>
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
                title={getProductDisplayName(product)}
              >
                <strong className={`associated-product-name ${product.product_name ? '' : 'is-missing'}`}>
                  {highlightText(
                    getProductDisplayName(product),
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
                </span>
              </td>
              <td className="stock-number-cell stock-col-quantity">
                {notCalculated ? '—' : formatPickingQty(product.qty_total)}
              </td>
              <td className="stock-number-cell stock-col-quantity">
                <CommittedQuantity
                  fetchSkuOrders={fetchSkuOrders}
                  formatPickingQty={formatPickingQty}
                  Icons={Icons}
                  product={product}
                />
              </td>
              <td className={`stock-number-cell stock-col-quantity stock-residual ${availability.tone}`}>
                {notCalculated ? '—' : formatPickingQty(product.qty_residual)}
              </td>
              <td className="stock-col-level">
                <AvailabilityVisual availability={availability} product={product} />
              </td>
              <td className="associated-product-components-cell">
                <ComponentsButton
                  product={product}
                  setSelectedAssociatedProduct={setSelectedAssociatedProduct}
                />
              </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
      </table>

      <div className="associated-product-mobile-list" aria-label="Prodotti associati">
        {associatedProductRows.map((product, rowIndex) => {
          const availability = getAssociatedProductAvailability(product);
          const previousProduct = associatedProductRows[rowIndex - 1];
          const startsStockGroup = showStockGroups && (
            rowIndex === 0 || previousProduct?.stock_order_sku !== product.stock_order_sku
          );
          const groupCount = stockGroupCounts.get(product.stock_order_sku || '') || 0;
          const notCalculated = product.qty_residual === null;
          return (
            <Fragment key={product.product_id}>
              {startsStockGroup && (
                <div className="associated-product-mobile-group">
                  <strong>
                    {product.stock_order_sku ? `SKU ${product.stock_order_sku}` : 'Altri prodotti associati'}
                  </strong>
                  <span>{groupCount} {groupCount === 1 ? 'prodotto' : 'prodotti'}</span>
                </div>
              )}
              <article className={`associated-product-mobile-card ${availability.tone}`}>
                <header>
                  <div>
                    <strong className={product.product_name ? '' : 'is-missing'}>
                      {getProductDisplayName(product)}
                    </strong>
                    <span>ID {product.product_id}{product.product_reference ? ` · Rif. ${product.product_reference}` : ''}</span>
                  </div>
                  <ComponentsButton
                    product={product}
                    setSelectedAssociatedProduct={setSelectedAssociatedProduct}
                  />
                </header>
                <AvailabilityVisual availability={availability} product={product} />
                <dl>
                  <div><dt>Capacità</dt><dd>{notCalculated ? '—' : formatPickingQty(product.qty_total)}</dd></div>
                  <div>
                    <dt>Impegnati</dt>
                    <dd>
                      <CommittedQuantity
                        fetchSkuOrders={fetchSkuOrders}
                        formatPickingQty={formatPickingQty}
                        Icons={Icons}
                        product={product}
                      />
                    </dd>
                  </div>
                  <div><dt>Disponibili</dt><dd className={availability.tone}>{notCalculated ? '—' : formatPickingQty(product.qty_residual)}</dd></div>
                </dl>
              </article>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
