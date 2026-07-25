import { getStockRowPresentation } from './stockPresentation';


function SortableHeader({ field, label, onSort, sort, style }) {
  return (
    <th className="sortable" style={style} onClick={() => onSort(field)}>
      {label} {sort.field === field && (sort.direction === 'asc' ? '▲' : '▼')}
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
    setStockLimit,
    setStockPage,
    setStockViewMode,
    sortedStock,
    stockSort,
    stockLimit,
    stockPage,
    stockSource,
    stockViewMode,
    syncingGoogleSheets,
    tabLoading,
    TableSkeleton,
    totalStockPages,
  } = stock;

  return (
    <div className="glass-panel widget-card">
      <div className="filter-bar" style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'space-between',
      }}>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Cerca per SKU o descrizione..."
              value={searchStock}
              onChange={event => setSearchStock(event.target.value)}
            />
            <svg className="search-icon-svg" viewBox="0 0 20 20">
              <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
            </svg>
          </div>
          <div className="toggle-group" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            display: 'inline-flex',
            padding: '3px',
          }}>
            {[
              ['standard', 'Giacenza Standard'],
              ['missing', 'SKU Non in File'],
            ].map(([mode, label]) => {
              const active = stockViewMode === mode;
              return (
                <button
                  key={mode}
                  className={`btn ${active ? (mode === 'missing' ? 'btn-danger' : 'btn-primary') : ''}`}
                  style={{
                    alignItems: 'center',
                    background: active
                      ? mode === 'missing' ? 'var(--color-danger)' : 'var(--color-primary)'
                      : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    fontSize: '0.8rem',
                    gap: '6px',
                    height: '28px',
                    padding: '4px 12px',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setStockViewMode(mode)}
                >
                  {label}
                  {mode === 'missing' && missingStockData.length > 0 && (
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      padding: '1px 6px',
                    }}>
                      {missingStockData.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {stockSource === 'google_sheets' && (
            <button
              className="btn btn-secondary"
              style={{
                alignItems: 'center',
                borderColor: 'rgba(99,102,241,0.3)',
                display: 'flex',
                fontSize: '0.8rem',
                gap: '6px',
                height: '32px',
                padding: '6px 12px',
              }}
              disabled={syncingGoogleSheets}
              onClick={handleSyncGoogleSheetsNow}
            >
              <Icons.Sync spinning={syncingGoogleSheets} />
              {syncingGoogleSheets ? 'Sincronizzazione...' : 'Sincronizza Google Sheets'}
            </button>
          )}
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Visualizzate: {sortedStock.length} di {currentStockSourceData.length} SKU
        </span>
      </div>

      <div className="table-container">
        {tabLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : sortedStock.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <SortableHeader field="index" label="#" onSort={handleSortStock} sort={stockSort} />
                <SortableHeader field="sku" label="SKU" onSort={handleSortStock} sort={stockSort} />
                <SortableHeader field="description" label="Descrizione Sku" onSort={handleSortStock} sort={stockSort} />
                <SortableHeader field="lotto" label="Lotto" onSort={handleSortStock} sort={stockSort} />
                <SortableHeader field="qty_total" label="Qta Totale" onSort={handleSortStock} sort={stockSort} style={{ textAlign: 'right' }} />
                <SortableHeader field="qty_committed" label="Qta Impegnata" onSort={handleSortStock} sort={stockSort} style={{ textAlign: 'right' }} />
                <SortableHeader field="qty_residual" label="Qta Residua" onSort={handleSortStock} sort={stockSort} style={{ textAlign: 'right' }} />
                <th style={{ textAlign: 'center' }}>Livello Stock</th>
                <th style={{ textAlign: 'center' }}>Prodotti Ass.</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStock.map(item => {
                const meta = getStockRowPresentation(item);
                const empty = meta.isSpacer ? '' : null;
                return (
                  <tr key={item.index} style={meta.rowStyle}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{item.index}</td>
                    <td style={{ fontWeight: '600' }}>{empty ?? highlightText(item.sku, searchStock)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{empty ?? highlightText(item.description || '-', searchStock)}</td>
                    <td>{empty ?? (item.lotto ? <span className="badge badge-neutral">{item.lotto}</span> : '-')}</td>
                    <td style={{ fontWeight: '500', textAlign: 'right' }}>{empty ?? item.qty_total}</td>
                    <td style={{ textAlign: 'right' }}>
                      {meta.isSpacer ? '' : item.qty_committed > 0 ? (
                        <span className="clickable-qty-badge" onClick={() => fetchSkuOrders(item.sku)}>
                          <span>{item.qty_committed}</span><Icons.Eye />
                        </span>
                      ) : (
                        <span className="qty-committed-zero-badge">
                          <span>0</span><Icons.Eye style={{ visibility: 'hidden' }} />
                        </span>
                      )}
                    </td>
                    <td style={{
                      color: item.qty_residual <= 0 || meta.isMissing
                        ? 'var(--color-danger)'
                        : 'var(--color-success)',
                      fontWeight: '700',
                      textAlign: 'right',
                    }}>
                      {empty ?? (meta.isMissing ? '0' : item.qty_residual)}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {meta.isSpacer ? '' : meta.isMissing ? (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span className="badge badge-danger" style={{ fontWeight: '700', letterSpacing: '0.5px' }}>
                            NON DISPONIBILE
                          </span>
                        </div>
                      ) : (
                        <div className="stock-bar-wrapper" style={{ justifyContent: 'center' }}>
                          <div className="stock-bar-container">
                            <div className={`stock-bar-fill ${meta.barClass}`} style={{ width: `${meta.percent}%` }} />
                          </div>
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            textAlign: 'right',
                            width: '32px',
                          }}>
                            {Math.round(meta.percent)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {meta.isSpacer ? '' : item.connected_products > 0 ? (
                        <button
                          type="button"
                          className="badge badge-neutral stock-associated-products-button"
                          onClick={event => {
                            event.stopPropagation();
                            fetchSkuProducts(item.sku);
                          }}
                          aria-label={`Mostra ${item.connected_products} prodotti associati alla SKU ${item.sku}`}
                          title="Mostra prodotti associati"
                        >
                          {item.connected_products}
                        </button>
                      ) : (
                        <span className="badge badge-neutral stock-associated-products-zero">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>
            {stockViewMode === 'missing'
              ? 'Nessuna SKU non in file trovata (tutte le SKU impegnate sono presenti a inventario).'
              : "Nessuna SKU trovata. Assicurati di aver caricato il file 'giacenza.xlsx' ed eseguito il calcolo."}
          </p>
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
          disabled={tabLoading}
        />
      )}
    </div>
  );
}
