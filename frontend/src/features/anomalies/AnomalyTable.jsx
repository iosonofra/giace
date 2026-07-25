export function AnomalyTable({
  anomalies,
  formatDate,
  getAnomalyMeta,
  getOrderStateBadgeClass,
  onAction,
}) {
  return (
    <table className="custom-table anomaly-table">
      <thead>
        <tr>
          <th>Problema</th>
          <th>Oggetto</th>
          <th>Stato ordine</th>
          <th>Origine</th>
          <th>Impatto</th>
          <th>Dettaglio</th>
          <th>Rilevata il</th>
          <th style={{ textAlign: 'center', width: '140px' }}>Prossima azione</th>
        </tr>
      </thead>
      <tbody>
        {anomalies.map(anomaly => {
          const meta = getAnomalyMeta(anomaly);
          return (
            <tr key={anomaly.id} className={`anomaly-row ${meta.severity}`}>
              <td>
                <span className={`anomaly-problem ${meta.severity}`}>{meta.typeLabel}</span>
              </td>
              <td>
                <div className="anomaly-object-cell">
                  <span className="anomaly-record-key">
                    {anomaly.record_key || 'Nessuna chiave'}
                  </span>
                  {anomaly.product_name && (
                    <span className="anomaly-product-name">{anomaly.product_name}</span>
                  )}
                </div>
              </td>
              <td>
                {anomaly.current_state_label ? (
                  <div className="anomaly-order-state-cell">
                    <span className={`badge ${getOrderStateBadgeClass(anomaly.current_state_label)}`}>
                      {anomaly.current_state_label}
                    </span>
                    {anomaly.order_id && <small>Ordine {anomaly.order_id}</small>}
                  </div>
                ) : (
                  <span className="anomaly-no-order">Non collegata</span>
                )}
              </td>
              <td><span className="badge badge-neutral">{meta.sourceLabel}</span></td>
              <td>
                <span className={`anomaly-severity ${meta.severity}`}>
                  {meta.severityLabel}
                </span>
              </td>
              <td className="anomaly-message">{anomaly.message}</td>
              <td style={{ color: 'var(--text-secondary)' }}>
                {formatDate(anomaly.created_at)}
              </td>
              <td style={{ textAlign: 'center' }}>
                {meta.actionable ? (
                  <button
                    className="btn btn-neutral btn-sm"
                    onClick={() => onAction(anomaly, meta)}
                    title={meta.actionLabel}
                  >
                    {meta.actionLabel}
                  </button>
                ) : '-'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
