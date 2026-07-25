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

  return (
    <div className="sync-cards-grid">
      <div className={`glass-panel sync-card ${syncingStock ? 'card-loading-pulse-green' : ''}`}>
        <div className="sync-card-icon stock">
          <Icons.Stock style={{
            animation: syncingStock ? 'spin 1s infinite linear' : 'none',
            height: '24px',
            width: '24px',
          }} />
        </div>
        <div>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Sincronizzazione Giacenze
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
            Sorgente:{' '}
            <span style={{ color: 'var(--color-primary)' }}>
              {status?.active_warehouse_batch?.sheet_name
                || status?.active_warehouse_batch?.filename
                || 'File locale'}
            </span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
            Ultimo sync:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {stockSyncDate ? new Date(stockSyncDate).toLocaleString('it-IT') : 'Mai'}
            </strong>
            {stockSyncDate && (
              <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                | {getRelativeTimeString(stockSyncDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`glass-panel sync-card ${syncingOrders ? 'card-loading-pulse' : ''}`}>
        <div className="sync-card-icon orders">
          <Icons.Orders style={{
            animation: syncingOrders ? 'spin 1s infinite linear' : 'none',
            height: '24px',
            width: '24px',
          }} />
        </div>
        <div>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Sincronizzazione PrestaShop
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
            Stato:
            <span
              className={`badge ${status?.mock_mode ? 'badge-warning' : 'badge-success'}`}
              style={{
                fontSize: '0.7rem',
                marginLeft: '4px',
                padding: '2px 8px',
                verticalAlign: 'middle',
              }}
            >
              {status?.mock_mode ? 'Simulazione' : 'Connesso'}
            </span>
          </div>
          {syncingOrders && syncProgressText ? (
            <div style={{
              color: 'var(--color-primary)',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginTop: '2px',
            }}>
              {syncProgressText}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Ultimo sync:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {status?.last_orders_sync
                  ? new Date(status.last_orders_sync).toLocaleString('it-IT')
                  : 'Mai'}
              </strong>
              {status?.last_orders_sync && (
                <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  | {getRelativeTimeString(status.last_orders_sync)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
