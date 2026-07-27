export function DashboardOperationsWidgets({ dashboard }) {
  const {
    dashboardData,
    formatDate,
    handleSyncOrders,
    loading,
    setActiveTab,
    status,
  } = dashboard;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel widget-card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <span className="widget-title">Stato Elaborazione</span>
        <div>
          <h4 className="dashboard-widget-label" style={{
            color: 'var(--text-secondary)',
            marginBottom: '4px',
          }}>
            Ultimo Ricalcolo Completo:
          </h4>
          <p className="dashboard-calculation-time">
            {dashboardData.latest_calculation_run
              ? formatDate(dashboardData.latest_calculation_run)
              : 'Mai eseguito'}
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <h4 className="dashboard-widget-label" style={{
            color: 'var(--text-secondary)',
            marginBottom: '6px',
          }}>
            Cartella di Lavoro Locale:
          </h4>
          <ul className="dashboard-file-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            listStyle: 'none',
          }}>
            {[
              ['giacenza.xlsx', status?.local_files?.giacenza_exists],
              ['associazione.xlsx', status?.local_files?.associazione_exists],
            ].map(([label, exists]) => (
              <li key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{label}:</span>
                <strong style={{
                  color: exists ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  {exists ? 'PRESENTE' : 'MANCANTE'}
                </strong>
              </li>
            ))}
          </ul>
          <p className="dashboard-workspace-path" style={{
            color: 'var(--text-secondary)',
            marginTop: '8px',
            wordBreak: 'break-all',
          }}>
            Path: {status?.local_files?.workspace_path}
          </p>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingTop: '12px',
        }}>
          <button
            className="btn btn-secondary"
            style={{ height: '32px', justifyContent: 'center', width: '100%' }}
            onClick={() => setActiveTab('settings')}
          >
            Gestisci Stati Sincronizzazione
          </button>
          {dashboardData.anomalies_count > 0 && (
            <button
              className="btn btn-danger"
              style={{ height: '32px', justifyContent: 'center', width: '100%' }}
              onClick={() => setActiveTab('anomalies')}
            >
              Visualizza {dashboardData.anomalies_count} Anomalie
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel widget-card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <span className="widget-title">PrestaShop Webservice</span>
        <p className="dashboard-widget-description" style={{
          color: 'var(--text-secondary)',
          margin: 0,
        }}>
          Sincronizza gli ordini attivi degli stati selezionati configurati nelle impostazioni.
        </p>
        <button
          className="btn btn-primary"
          style={{ justifyContent: 'center', padding: '8px 12px', width: '100%' }}
          onClick={handleSyncOrders}
          disabled={loading}
        >
          Sincronizza Ordini Ora
        </button>
        {status?.last_orders_sync && (
          <div className="dashboard-widget-meta" style={{
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            paddingTop: '8px',
          }}>
            Verificato:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {new Date(status.last_orders_sync).toLocaleString('it-IT')}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
