import {
  getStockRowPresentation,
} from './stockPresentation';


function SortableHeader({
  className = '',
  field,
  label,
  onSort,
  sort,
}) {
  const active = sort.field === field;
  return (
    <th className={className}>
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


export function StockTablePanel({ stock }) {
  const {
    currentStockSourceData,
    fetchSkuOrders,
    fetchSkuProducts,
    handleSortStock,
    handleSyncGoogleSheetsNow,
    highlightText,
    Icons,
    missingStockData,
    paginatedStock,
    Pagination,
    searchStock,
    setSearchStock,
    setStockAvailabilityFilter,
    setStockLimit,
    setStockPage,
    setStockViewMode,
    sortedStock,
    stockAvailabilityFilter,
    stockLimit,
    stockPage,
    stockSort,
    stockSource,
    stockSummary,
    stockViewMode,
    syncingGoogleSheets,
    tabLoading,
    TableSkeleton,
    totalStockPages,
  } = stock;

  const summaryItems = [
    { id: 'total', filter: 'all', label: 'SKU totali', tone: 'neutral' },
    { id: 'low', filter: 'low', label: 'Disponibilità bassa', tone: 'warning' },
    { id: 'unavailable', filter: 'unavailable', label: 'Esaurite', tone: 'danger' },
    { id: 'committed', filter: 'committed', label: 'Con quantità impegnata', tone: 'primary' },
  ];

  return (
    <div className="glass-panel widget-card stock-table-workbench">
      <div className="stock-kpi-strip" aria-label="Riepilogo giacenze">
        {summaryItems.map(item => (
          <button
            key={item.id}
            type="button"
            className={`stock-kpi-item ${item.tone} ${
              stockAvailabilityFilter === item.filter ? 'active' : ''
            }`}
            aria-pressed={stockAvailabilityFilter === item.filter}
            onClick={() => setStockAvailabilityFilter(item.filter)}
          >
            <span>{item.label}</span>
            <strong>{stockSummary[item.id]}</strong>
          </button>
        ))}
      </div>

      <div className="stock-toolbar">
        <div className="stock-toolbar-primary">
          <label className="stock-search">
            <span className="sr-only">Cerca nella giacenza</span>
            <Icons.Search />
            <input
              type="search"
              className="search-input"
              placeholder="Cerca SKU o descrizione"
              value={searchStock}
              onChange={event => setSearchStock(event.target.value)}
            />
          </label>

          <div className="stock-view-switch" role="group" aria-label="Tipo di elenco">
            <button
              type="button"
              className={stockViewMode === 'standard' ? 'active' : ''}
              aria-pressed={stockViewMode === 'standard'}
              onClick={() => setStockViewMode('standard')}
            >
              Giacenza
            </button>
            <button
              type="button"
              className={stockViewMode === 'missing' ? 'active danger' : ''}
              aria-pressed={stockViewMode === 'missing'}
              onClick={() => setStockViewMode('missing')}
            >
              SKU non presenti
              <b>{missingStockData.length}</b>
            </button>
          </div>

          {stockSource === 'google_sheets' && (
            <button
              type="button"
              className="btn btn-secondary stock-sheet-sync"
              disabled={syncingGoogleSheets}
              onClick={handleSyncGoogleSheetsNow}
            >
              <Icons.Sync spinning={syncingGoogleSheets} />
              {syncingGoogleSheets ? 'Sincronizzazione...' : 'Sincronizza Sheets'}
            </button>
          )}
          <span className="stock-result-count">
            {sortedStock.length} di {currentStockSourceData.length} SKU
          </span>
        </div>
      </div>

      <div className="table-container stock-table-scroll">
        {tabLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : sortedStock.length > 0 ? (
          <table className="custom-table stock-inventory-table">
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
                  className="stock-col-sku"
                  field="sku"
                  label="SKU"
                  onSort={handleSortStock}
                  sort={stockSort}
                />
                <SortableHeader
                  className="stock-col-description"
                  field="description"
                  label="Descrizione"
                  onSort={handleSortStock}
                  sort={stockSort}
                />
                <SortableHeader
                  className="stock-col-lot"
                  field="lotto"
                  label="Lotto"
                  onSort={handleSortStock}
                  sort={stockSort}
                />
                <SortableHeader
                  className="stock-number-heading stock-col-quantity"
                  field="qty_total"
                  label="Totale"
                  onSort={handleSortStock}
                  sort={stockSort}
                />
                <SortableHeader
                  className="stock-number-heading stock-col-quantity"
                  field="qty_committed"
                  label="Impegnata"
                  onSort={handleSortStock}
                  sort={stockSort}
                />
                <SortableHeader
                  className="stock-number-heading stock-col-quantity"
                  field="qty_residual"
                  label="Residua"
                  onSort={handleSortStock}
                  sort={stockSort}
                />
                <th className="stock-col-level">Livello stock</th>
                <th className="stock-associated-heading">Prodotti associati</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStock.map(item => {
                const meta = getStockRowPresentation(item);
                const empty = meta.isSpacer ? '' : null;
                const description = item.description || '-';
                return (
                  <tr
                    key={item.index}
                    className={`stock-inventory-row ${meta.availabilityTone}`}
                  >
                    <td className="stock-col-index">{item.index}</td>
                    <td className="stock-col-sku">
                      <strong>{empty ?? highlightText(item.sku, searchStock)}</strong>
                    </td>
                    <td className="stock-col-description" title={description}>
                      <span>{empty ?? highlightText(description, searchStock)}</span>
                    </td>
                    <td className="stock-col-lot">
                      {empty ?? (
                        item.lotto
                          ? <span className="badge badge-neutral">{item.lotto}</span>
                          : <span className="stock-empty-value">—</span>
                      )}
                    </td>
                    <td className="stock-number-cell stock-col-quantity">
                      {empty ?? item.qty_total}
                    </td>
                    <td className="stock-number-cell stock-col-quantity">
                      {meta.isSpacer ? '' : item.qty_committed > 0 ? (
                        <button
                          type="button"
                          className="clickable-qty-badge"
                          onClick={() => fetchSkuOrders(item.sku)}
                          aria-label={`Mostra ordini che impegnano la SKU ${item.sku}`}
                        >
                          <span>{item.qty_committed}</span><Icons.Eye />
                        </button>
                      ) : (
                        <span className="stock-zero-value">0</span>
                      )}
                    </td>
                    <td className={`stock-number-cell stock-col-quantity stock-residual ${meta.availabilityTone}`}>
                      {empty ?? (meta.isMissing ? '0' : item.qty_residual)}
                    </td>
                    <td className="stock-col-level">
                      {meta.isSpacer ? '' : (
                        <div className="stock-level-cell">
                          <span className={`stock-level-label ${meta.availabilityTone}`}>
                            {meta.availabilityLabel}
                          </span>
                          <div>
                            <span
                              className="stock-bar-container"
                              role="progressbar"
                              aria-label={`Disponibilità ${item.sku}`}
                              aria-valuemin="0"
                              aria-valuemax="100"
                              aria-valuenow={Math.round(meta.percent)}
                            >
                              <span
                                className={`stock-bar-fill ${meta.barClass}`}
                                style={{ width: `${meta.percent}%` }}
                              />
                            </span>
                            <span className="stock-level-percentage">
                              {Math.round(meta.percent)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="stock-associated-cell">
                      {meta.isSpacer ? '' : item.connected_products > 0 ? (
                        <button
                          type="button"
                          className="stock-associated-products-button"
                          onClick={event => {
                            event.stopPropagation();
                            fetchSkuProducts(item.sku);
                          }}
                          aria-label={`Mostra ${item.connected_products} prodotti associati alla SKU ${item.sku}`}
                        >
                          <strong>{item.connected_products}</strong>
                          <span>prodotti</span>
                          <b aria-hidden="true">→</b>
                        </button>
                      ) : (
                        <span className="stock-associated-empty">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="stock-empty-state">
            <strong>Nessuna SKU corrisponde ai filtri</strong>
            <p>Modifica la ricerca o seleziona un altro stato di disponibilità.</p>
          </div>
        )}
      </div>

      {!tabLoading && sortedStock.length > 0 && (
        <Pagination
          currentPage={stockPage}
          totalPages={totalStockPages}
          onPageChange={setStockPage}
          limit={stockLimit}
          onLimitChange={setStockLimit}
          limitOptions={[25, 50, 100]}
          allowAll
          totalItems={sortedStock.length}
          disabled={tabLoading}
        />
      )}
    </div>
  );
}
