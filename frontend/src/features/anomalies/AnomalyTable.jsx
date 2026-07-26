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
          <th className="anomaly-col-problem">Problema</th>
          <th className="anomaly-col-object">Oggetto</th>
          <th className="anomaly-col-state">Stato ordine</th>
          <th className="anomaly-col-source">Origine</th>
          <th className="anomaly-col-impact">Impatto</th>
          <th className="anomaly-col-detail">Dettaglio</th>
          <th className="anomaly-col-date">Rilevata il</th>
          <th className="anomaly-col-action">Prossima azione</th>
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
              <td>
                <span className="anomaly-message" title={anomaly.message}>
                  {anomaly.message}
                </span>
              </td>
              <td className="anomaly-date">
                {formatDate(anomaly.created_at)}
              </td>
              <td className="anomaly-action-cell">
                {meta.actionable ? (
                  <button
                    className="btn btn-neutral btn-sm anomaly-action-button"
                    onClick={() => onAction(anomaly, meta)}
                    title={meta.actionLabel}
                  >
                    {meta.actionLabel}
                  </button>
                ) : (
                  <span className="anomaly-no-action">Nessuna azione</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
