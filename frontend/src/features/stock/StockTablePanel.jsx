import {
  getStockRowPresentation,
} from './stockPresentation';
import { AssociatedProductsStockTable } from './AssociatedProductsStockTable';
import { MissingStockTable } from './MissingStockTable';
import { SyncActionIcon } from '../../components/ui/SyncActionIcon';


function SortableHeader({
  className = '',
  field,
  label,
  onSort,
  sort,
}) {
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


export function StockTablePanel({ stock }) {
  const {
    currentStockSourceData,
    associatedProductData,
    associatedProductFilter,
    associatedProductLimit,
    associatedProductLoading,
    associatedProductPage,
    associatedProductSearch,
    associatedProductSortPreset,
    associatedProductSummary,
    associatedProductTotalPages,
    copyMissingStockSkus,
    filteredAssociatedProducts,
    exportMissingStockCsv,
    fetchSkuOrders,
    fetchSkuProducts,
    handleSortStock,
    handleSyncGoogleSheetsNow,
    googleSheetsSyncSuccessKey,
    highlightText,
    Icons,
    missingStockData,
    paginatedStock,
    Pagination,
    searchStock,
    setSearchStock,
    setAssociatedProductFilter,
    setAssociatedProductLimit,
    setAssociatedProductPage,
    setAssociatedProductSearch,
    setAssociatedProductSortPreset,
    setStockAvailabilityFilter,
    setStockLimit,
    setStockPage,
    setStockSort,
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

  const productMode = stockViewMode === 'products';
  const missingMode = stockViewMode === 'missing';
  const activeSummary = productMode ? associatedProductSummary : stockSummary;
  const activeFilter = productMode
    ? associatedProductFilter
    : stockAvailabilityFilter;
  const setActiveFilter = productMode
    ? setAssociatedProductFilter
    : setStockAvailabilityFilter;
  const summaryItems = productMode
    ? [
      { id: 'total', filter: 'all', label: 'Prodotti associati', tone: 'neutral' },
      { id: 'low', filter: 'low', label: 'Disponibilità bassa', tone: 'warning' },
      { id: 'unavailable', filter: 'unavailable', label: 'Esauriti', tone: 'danger' },
      { id: 'committed', filter: 'committed', label: 'Prodotti impegnati', tone: 'primary' },
    ]
    : [
      { id: 'total', filter: 'all', label: 'SKU totali', tone: 'neutral' },
      { id: 'low', filter: 'low', label: 'Disponibilità bassa', tone: 'warning' },
      { id: 'unavailable', filter: 'unavailable', label: 'Esaurite', tone: 'danger' },
      { id: 'committed', filter: 'committed', label: 'Con quantità impegnata', tone: 'primary' },
    ];
  const missingSummary = missingStockData.reduce((summary, item) => ({
    committed: summary.committed + Number(item.qty_committed || 0),
    maxCommitted: Math.max(summary.maxCommitted, Number(item.qty_committed || 0)),
    products: summary.products + Number(item.connected_products || 0),
    total: summary.total + 1,
  }), { committed: 0, maxCommitted: 0, products: 0, total: 0 });
  const missingSummaryItems = [
    { id: 'total', label: 'SKU mancanti', value: missingSummary.total, tone: 'danger' },
    { id: 'committed', label: 'Unità richieste', value: missingSummary.committed, tone: 'primary' },
    { id: 'products', label: 'Prodotti coinvolti', value: missingSummary.products, tone: 'neutral' },
    { id: 'maxCommitted', label: 'Picco per SKU', value: missingSummary.maxCommitted, tone: 'warning' },
  ];
  const activeSearch = productMode ? associatedProductSearch : searchStock;
  const setActiveSearch = productMode
    ? setAssociatedProductSearch
    : setSearchStock;
  const resultCount = productMode
    ? filteredAssociatedProducts.length
    : sortedStock.length;
  const sourceCount = productMode
    ? associatedProductData.length
    : currentStockSourceData.length;

  return (
    <div className="glass-panel widget-card stock-table-workbench">
      <div
        className="stock-kpi-strip"
        aria-label={missingMode
          ? 'Riepilogo SKU non presenti'
          : productMode
            ? 'Riepilogo disponibilità prodotti associati'
            : 'Riepilogo giacenze SKU'}
      >
        {missingMode
          ? missingSummaryItems.map(item => (
            <div key={item.id} className={`stock-kpi-item static ${item.tone}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))
          : summaryItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`stock-kpi-item ${item.tone} ${
                activeFilter === item.filter ? 'active' : ''
              }`}
              aria-pressed={activeFilter === item.filter}
              onClick={() => setActiveFilter(item.filter)}
            >
              <span>{item.label}</span>
              <strong>{activeSummary[item.id]}</strong>
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
              placeholder={productMode
                ? 'Cerca ID, nome, riferimento o componente'
                : missingMode
                  ? 'Cerca SKU non presente'
                  : 'Cerca SKU o descrizione'}
              value={activeSearch}
              onChange={event => setActiveSearch(event.target.value)}
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
            <button
              type="button"
              className={stockViewMode === 'products' ? 'active' : ''}
              aria-pressed={stockViewMode === 'products'}
              onClick={() => setStockViewMode('products')}
            >
              Prodotti associati
            </button>
          </div>

          {productMode && (
            <div className="associated-product-quick-sort" role="group" aria-label="Ordinamento rapido prodotti">
              <span>Ordina</span>
              <button
                type="button"
                className={associatedProductSortPreset === 'stock' ? 'active' : ''}
                aria-pressed={associatedProductSortPreset === 'stock'}
                onClick={() => setAssociatedProductSortPreset('stock')}
              >
                Ordine SKU
              </button>
              <button
                type="button"
                className={associatedProductSortPreset === 'priority' ? 'active' : ''}
                aria-pressed={associatedProductSortPreset === 'priority'}
                onClick={() => setAssociatedProductSortPreset('priority')}
              >
                Critici prima
              </button>
              <button
                type="button"
                className={associatedProductSortPreset === 'committed' ? 'active' : ''}
                aria-pressed={associatedProductSortPreset === 'committed'}
                onClick={() => setAssociatedProductSortPreset('committed')}
              >
                Più impegnati
              </button>
            </div>
          )}

          {missingMode && (
            <div className="associated-product-quick-sort" role="group" aria-label="Ordinamento rapido SKU non presenti">
              <span>Ordina</span>
              <button
                type="button"
                className={stockSort.field === 'sku' && stockSort.direction === 'asc' ? 'active' : ''}
                aria-pressed={stockSort.field === 'sku' && stockSort.direction === 'asc'}
                onClick={() => setStockSort({ field: 'sku', direction: 'asc' })}
              >
                SKU
              </button>
              <button
                type="button"
                className={stockSort.field === 'qty_committed' && stockSort.direction === 'desc' ? 'active' : ''}
                aria-pressed={stockSort.field === 'qty_committed' && stockSort.direction === 'desc'}
                onClick={() => setStockSort({ field: 'qty_committed', direction: 'desc' })}
              >
                Più urgenti
              </button>
              <button
                type="button"
                className={stockSort.field === 'connected_products' && stockSort.direction === 'desc' ? 'active' : ''}
                aria-pressed={stockSort.field === 'connected_products' && stockSort.direction === 'desc'}
                onClick={() => setStockSort({ field: 'connected_products', direction: 'desc' })}
              >
                Più prodotti
              </button>
            </div>
          )}

          {stockSource === 'google_sheets' && (
            <button
              type="button"
              className="btn btn-secondary stock-sheet-sync"
              disabled={syncingGoogleSheets}
              aria-busy={syncingGoogleSheets}
              onClick={handleSyncGoogleSheetsNow}
            >
              <SyncActionIcon
                busy={syncingGoogleSheets}
                successKey={googleSheetsSyncSuccessKey}
              />
              {syncingGoogleSheets ? 'Sincronizzazione...' : 'Sincronizza Sheets'}
            </button>
          )}
          <span className="stock-result-count" aria-live="polite">
            {resultCount} di {sourceCount} {productMode ? 'prodotti' : 'SKU'}
          </span>
        </div>
      </div>

      {productMode && (
        <p className="associated-product-context-note" role="note">
          Le quantità indicano quanti prodotti completi possono essere assemblati.
          La disponibilità dipende dal componente più limitante.
        </p>
      )}

      {missingMode && (
        <div className="stock-missing-context" role="note">
          <div>
            <strong>
              {missingSummary.total} SKU richiesti dagli ordini non sono presenti nel foglio giacenze
            </strong>
            <p>
              Aggiungili al foglio e sincronizza per ripristinare il calcolo della disponibilità.
            </p>
          </div>
          <div className="stock-missing-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={sortedStock.length === 0}
              onClick={() => copyMissingStockSkus(sortedStock)}
            >
              Copia SKU
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={sortedStock.length === 0}
              onClick={() => exportMissingStockCsv(sortedStock)}
            >
              <Icons.Download />
              Esporta CSV
            </button>
          </div>
        </div>
      )}

      <div className="table-container stock-table-scroll">
        {productMode ? (
          <AssociatedProductsStockTable stock={stock} />
        ) : tabLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : missingMode && sortedStock.length > 0 ? (
          <MissingStockTable
            fetchSkuOrders={fetchSkuOrders}
            fetchSkuProducts={fetchSkuProducts}
            handleSortStock={handleSortStock}
            highlightText={highlightText}
            Icons={Icons}
            rows={paginatedStock}
            searchStock={searchStock}
            stockSort={stockSort}
          />
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
                      {meta.isCalculationExcluded ? (
                        <span className="stock-excluded-value">—</span>
                      ) : meta.isSpacer ? '' : item.qty_committed > 0 ? (
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
                      {empty ?? (meta.isCalculationExcluded
                        ? <span className="stock-excluded-value">—</span>
                        : (meta.isMissing ? '0' : item.qty_residual))}
                    </td>
                    <td className="stock-col-level">
                      {meta.isSpacer ? '' : (
                        <div
                          className={`stock-level-cell ${meta.isCalculationExcluded ? 'excluded' : ''}`}
                          title={item.calculation_exclusion_reason || undefined}
                        >
                          <span className={`stock-level-label ${meta.availabilityTone}`}>
                            {meta.availabilityLabel}
                          </span>
                          {meta.isCalculationExcluded ? (
                            <span className="stock-excluded-reason">Lotto di reso</span>
                          ) : <div>
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
                                style={{ '--stock-ratio': Math.max(0, Math.min(100, meta.percent)) / 100 }}
                              />
                            </span>
                            <span className="stock-level-percentage">
                              {Math.round(meta.percent)}%
                            </span>
                          </div>}
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
            <strong>{missingMode ? 'Nessuna SKU mancante trovata' : 'Nessuna SKU corrisponde ai filtri'}</strong>
            <p>{missingMode
              ? 'La ricerca non contiene risultati oppure tutte le SKU sono presenti nel foglio.'
              : 'Modifica la ricerca o seleziona un altro stato di disponibilità.'}</p>
          </div>
        )}
      </div>

      {productMode && !associatedProductLoading && filteredAssociatedProducts.length > 0 ? (
        <Pagination
          currentPage={associatedProductPage}
          totalPages={associatedProductTotalPages}
          onPageChange={setAssociatedProductPage}
          limit={associatedProductLimit}
          onLimitChange={setAssociatedProductLimit}
          limitOptions={[25, 50, 100]}
          allowAll
          totalItems={filteredAssociatedProducts.length}
          disabled={associatedProductLoading}
        />
      ) : !productMode && !tabLoading && sortedStock.length > 0 && (
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
