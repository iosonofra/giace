function formatSyncDate(date) {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}


export function StockSyncCards({ stock }) {
  const {
    getRelativeTimeString,
    Icons,
    status,
    stockSource,
    syncingOrders,
    syncingStock,
    syncProgressText,
  } = stock;
  const stockSyncDate = stockSource === 'google_sheets'
    ? status?.google_sheet_last_sync
    : status?.active_warehouse_batch?.imported_at;
  const stockSourceLabel = (
    status?.active_warehouse_batch?.sheet_name
    || status?.active_warehouse_batch?.filename
    || 'File locale'
  );

  return (
    <div className="glass-panel stock-status-strip" aria-label="Stato sincronizzazioni">
      <div className={`stock-status-item ${syncingStock ? 'loading' : ''}`}>
        <span className="stock-status-icon stock"><Icons.Stock /></span>
        <div>
          <span>Giacenze</span>
          <strong>{stockSourceLabel}</strong>
        </div>
        <small className="stock-status-meta">
          {syncingStock
            ? 'Sincronizzazione in corso'
            : stockSyncDate
              ? (
                <>
                  <span>
                    Ultimo sync: <time dateTime={stockSyncDate}>
                      {formatSyncDate(stockSyncDate)}
                    </time>
                  </span>
                  <i aria-hidden="true" />
                  <span>Aggiornate {getRelativeTimeString(stockSyncDate)}</span>
                </>
              )
              : 'Mai sincronizzate'}
        </small>
      </div>

      <span className="stock-status-divider" aria-hidden="true" />

      <div className={`stock-status-item ${syncingOrders ? 'loading' : ''}`}>
        <span className="stock-status-icon orders"><Icons.Orders /></span>
        <div>
          <span>PrestaShop</span>
          <strong>{status?.mock_mode ? 'Simulazione' : 'Connesso'}</strong>
        </div>
        <small className="stock-status-meta">
          {syncingOrders
            ? syncProgressText || 'Sincronizzazione in corso'
            : status?.last_orders_sync
              ? (
                <>
                  <span>
                    Ultimo sync: <time dateTime={status.last_orders_sync}>
                      {formatSyncDate(status.last_orders_sync)}
                    </time>
                  </span>
                  <i aria-hidden="true" />
                  <span>
                    Aggiornato {getRelativeTimeString(status.last_orders_sync)}
                  </span>
                </>
              )
              : 'Mai sincronizzato'}
        </small>
      </div>
    </div>
  );
}
