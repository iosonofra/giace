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
          <h4 style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginBottom: '4px',
          }}>
            Ultimo Ricalcolo Completo:
          </h4>
          <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>
            {dashboardData.latest_calculation_run
              ? formatDate(dashboardData.latest_calculation_run)
              : 'Mai eseguito'}
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <h4 style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginBottom: '6px',
          }}>
            Cartella di Lavoro Locale:
          </h4>
          <ul style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '0.8rem',
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
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.68rem',
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
            style={{ fontSize: '0.8rem', height: '32px', justifyContent: 'center', width: '100%' }}
            onClick={() => setActiveTab('settings')}
          >
            Gestisci Stati Sincronizzazione
          </button>
          {dashboardData.anomalies_count > 0 && (
            <button
              className="btn btn-danger"
              style={{ fontSize: '0.8rem', height: '32px', justifyContent: 'center', width: '100%' }}
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
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.82rem',
          lineHeight: '1.4',
          margin: 0,
        }}>
          Sincronizza gli ordini attivi degli stati selezionati configurati nelle impostazioni.
        </p>
        <button
          className="btn btn-primary"
          style={{ fontSize: '0.82rem', justifyContent: 'center', padding: '8px 12px', width: '100%' }}
          onClick={handleSyncOrders}
          disabled={loading}
        >
          Sincronizza Ordini Ora
        </button>
        {status?.last_orders_sync && (
          <div style={{
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.72rem',
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
