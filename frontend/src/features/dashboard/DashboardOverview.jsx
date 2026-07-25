export function DashboardOverview({ dashboard }) {
  const {
    dashboardData,
    dashboardHasAssociations,
    dashboardHasOrdersSync,
    dashboardHasStock,
    dashboardHealthLabel,
    dashboardHealthText,
    dashboardHealthTone,
    dashboardNextAction,
    formatDate,
    getRelativeTimeString,
    Icons,
    loading,
    status,
    syncingGoogleSheets,
    syncingOrders,
  } = dashboard;

  return (
    <>
      {dashboardData.sku_count === 0 && dashboardData.product_count === 0 && (
        <div className="glass-panel" style={{
          borderLeft: '3px solid var(--color-primary)',
          marginBottom: '20px',
          padding: '20px',
        }}>
          <h3 style={{
            alignItems: 'center',
            color: 'var(--text-primary)',
            display: 'flex',
            fontSize: '1rem',
            fontWeight: '800',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <Icons.Stock /> Configurazione iniziale giacenze
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            marginBottom: '16px',
          }}>
            Questo strumento sincronizza e calcola le giacenze fisiche di magazzino
            con le quantità vendute o impegnate sul portale e-commerce.
          </p>
          <div style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}>
            {[
              ['1. Configura Connessione', <>Vai su <strong>Impostazioni</strong> per inserire credenziali API e filtri ordine.</>],
              ['2. Importa Giacenze Magazzino', <>Carica <code>giacenza.xlsx</code> o configura un Google Sheet pubblico.</>],
              ['3. Crea Associazioni Kit', <>Definisci i kit caricando <code>associazione.xlsx</code>.</>],
            ].map(([title, text]) => (
              <div key={title} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
              }}>
                <strong style={{
                  color: 'var(--text-primary)',
                  display: 'block',
                  fontSize: '0.82rem',
                  marginBottom: '4px',
                }}>
                  {title}
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className={`dashboard-health-panel ${dashboardHealthTone}`}>
        <div className="dashboard-health-main">
          <span className="dashboard-health-kicker">Stato sistema</span>
          <h2>{dashboardHealthLabel}</h2>
          <p>{dashboardHealthText}</p>
        </div>
        <div className="dashboard-next-action">
          <span>Prossima azione</span>
          <button
            className={`btn ${dashboardHealthTone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={dashboardNextAction.action}
            disabled={loading || syncingGoogleSheets || syncingOrders}
          >
            {dashboardNextAction.label}
          </button>
        </div>
      </section>

      <section className="kpi-grid">
        <div className={`glass-panel kpi-card ${dashboardHasStock ? 'success' : 'danger'}`}>
          <span className="kpi-title">Giacenze</span>
          <span className="kpi-value">{dashboardData.sku_count}</span>
          <span className="kpi-desc">
            {dashboardHasStock
              ? `Ultimo import: ${formatDate(dashboardData.latest_import_warehouse)}`
              : 'Import giacenze mancante'}
          </span>
        </div>
        <div className={`glass-panel kpi-card ${dashboardHasAssociations ? 'success' : 'danger'}`}>
          <span className="kpi-title">Composizione kit</span>
          <span className="kpi-value">{dashboardData.product_count}</span>
          <span className="kpi-desc">
            {dashboardHasAssociations
              ? `Ultimo import: ${formatDate(dashboardData.latest_import_associations)}`
              : 'Associazioni mancanti'}
          </span>
        </div>
        <div className={`glass-panel kpi-card ${dashboardHasOrdersSync ? 'success' : 'warning'}`}>
          <span className="kpi-title">Ordini impegnati</span>
          <span className="kpi-value">{dashboardData.order_count}</span>
          <span className="kpi-desc">
            {dashboardData.items_ordered} righe vendute · Sync{' '}
            {status?.last_orders_sync
              ? getRelativeTimeString(status.last_orders_sync)
              : 'mai'}
          </span>
        </div>
        <div className={`glass-panel kpi-card ${dashboardData.anomalies_count > 0 ? 'danger' : 'success'}`}>
          <span className="kpi-title">Anomalie</span>
          <span className="kpi-value">{dashboardData.anomalies_count}</span>
          <span className="kpi-desc">
            {dashboardData.anomalies_count > 0
              ? 'Aperte nel registro'
              : 'Nessuna anomalia aperta'}
          </span>
        </div>
      </section>
    </>
  );
}
