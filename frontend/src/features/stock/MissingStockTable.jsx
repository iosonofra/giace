function SortableHeader({ className = '', field, label, onSort, sort }) {
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
      >
        {label}
        <span aria-hidden="true">
          {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}


export function MissingStockTable({
  fetchSkuOrders,
  fetchSkuProducts,
  handleSortStock,
  highlightText,
  Icons,
  rows,
  searchStock,
  stockSort,
}) {
  return (
    <table className="custom-table stock-missing-table">
      <caption className="sr-only">
        SKU richiesti dagli ordini ma non presenti nel foglio giacenze
      </caption>
      <thead>
        <tr>
          <SortableHeader
            className="stock-col-index"
            field="index"
            label="#"
            onSort={handleSortStock}
            sort={stockSort}
          />
          <SortableHeader
            className="stock-missing-sku"
            field="sku"
            label="SKU"
            onSort={handleSortStock}
            sort={stockSort}
          />
          <SortableHeader
            className="stock-number-heading stock-missing-demand"
            field="qty_committed"
            label="Unità richieste"
            onSort={handleSortStock}
            sort={stockSort}
          />
          <SortableHeader
            className="stock-missing-products"
            field="connected_products"
            label="Prodotti coinvolti"
            onSort={handleSortStock}
            sort={stockSort}
          />
          <th className="stock-missing-state">Stato</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(item => {
          const committed = Number(item.qty_committed || 0);
          const products = Number(item.connected_products || 0);
          return (
            <tr key={item.index} className="stock-missing-row">
              <td className="stock-col-index">{item.index}</td>
              <td className="stock-missing-sku">
                <strong>{highlightText(item.sku, searchStock)}</strong>
              </td>
              <td className="stock-number-cell stock-missing-demand">
                {committed > 0 ? (
                  <button
                    type="button"
                    className="clickable-qty-badge"
                    onClick={() => fetchSkuOrders(item.sku)}
                    aria-label={`Mostra gli ordini che richiedono la SKU ${item.sku}`}
                  >
                    <span>{committed}</span>
                    <Icons.Eye />
                  </button>
                ) : <span className="stock-zero-value">0</span>}
              </td>
              <td className="stock-missing-products">
                {products > 0 ? (
                  <button
                    type="button"
                    className="stock-associated-products-button"
                    onClick={() => fetchSkuProducts(item.sku)}
                    aria-label={`Mostra ${products} prodotti associati alla SKU ${item.sku}`}
                  >
                    <strong>{products}</strong>
                    <span>{products === 1 ? 'prodotto' : 'prodotti'}</span>
                    <b aria-hidden="true">→</b>
                  </button>
                ) : <span className="stock-associated-empty">0</span>}
              </td>
              <td className="stock-missing-state">
                <span className="stock-missing-status">
                  <i aria-hidden="true" />
                  Assente dal foglio
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
