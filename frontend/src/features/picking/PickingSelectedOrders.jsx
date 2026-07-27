export function PickingSelectedOrders({
  pickingResults,
  sortedPickingOrders,
  getOrderPickingMeta,
  handleCopyOrderId,
  copiedOrderId,
  getRelativeTimeString,
  getStateBadgeClass,
  formatPickingQty,
}) {
  return (
    <>
      {pickingResults.mode === 'automatic' && (
          <div className="picking-split-head success">
            <div>
              <span>Ordini proposti</span>
              <strong>{sortedPickingOrders.length} preparabili</strong>
            </div>
            <span>Disponibili con la giacenza attuale</span>
          </div>
        )}

      <div className="picking-order-list">
        {sortedPickingOrders.length > 0 ? (
          sortedPickingOrders.map((ord, orderIndex) => {
            const orderMeta = getOrderPickingMeta(ord);

            return (
              <div 
                key={ord.order_id} 
                className={`picking-order-block ${orderMeta.tone}`}
              >
              <div className="picking-order-head">
                <div className="picking-order-identity">
                  <div className="picking-order-mainline">
                    <button
                      type="button"
                      className="picking-order-id-btn"
                      onClick={() => handleCopyOrderId(ord.order_id)}
                      title="Clicca per copiare l'ID ordine"
                    >
                      Ordine {ord.order_id}
                    </button>
                    {copiedOrderId === ord.order_id && (
                      <span className="picking-order-copied">Copiato</span>
                    )}
                    <span>{ord.customer_name}</span>
                    {pickingResults.mode === 'automatic' && (
                      <span className="picking-order-sequence">
                        Proposta #{ord.selection_position || orderIndex + 1}
                        {ord.chronological_position ? ` · Coda #${ord.chronological_position}` : ''}
                      </span>
                    )}
                  </div>
                  {(ord.date_add || ord.current_state_label) && (
                    <div className="picking-order-meta-row">
                      {ord.date_add && (
                        <>
                          <span className="picking-order-date">
                            {new Date(ord.date_add).toLocaleString('it-IT')}
                          </span>
                          <span className="picking-order-age">
                            {getRelativeTimeString(ord.date_add)}
                          </span>
                        </>
                      )}
                      {ord.current_state_label && (
                        <span className={getStateBadgeClass(ord.current_state_label)}>
                          {ord.current_state_label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className={`picking-status-chip ${orderMeta.tone}`}>
                  {orderMeta.label}
                </span>
              </div>

              <div className="table-container" style={{ margin: 0, border: 'none' }}>
                <table className="custom-table picking-table picking-order-table">
                  <thead>
                    <tr>
                      <th>SKU Componente</th>
                       <th>Descrizione Magazzino</th>
                       <th className="num-col">Quantità Richiesta</th>
                       <th className="num-col">{pickingResults.mode === 'automatic' ? 'Disponibile prima' : 'Disponibile magazzino'}</th>
                       {pickingResults.mode === 'automatic' && (
                         <th className="num-col">Residuo dopo</th>
                       )}
                       <th className="status-col">Stato Prelievo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ord.items.map(item => {
                      const itemMeta = item.status === 'disponibile'
                        ? { tone: 'success', label: `OK ${item.avail_after}` }
                        : item.status === 'parziale'
                          ? { tone: 'warning', label: `${item.qty_fulfilled}/${item.qty_required}` }
                          : { tone: 'danger', label: `-${item.qty_required}` };

                      return (
                        <tr key={item.sku} className={item.status === 'mancante' ? 'picking-row-critical' : item.status === 'parziale' ? 'picking-row-warning' : ''}>
                          <td className="picking-sku-cell">{item.sku}</td>
                          <td className="picking-description-cell">
                            {item.description}
                          </td>
                          <td className="num-col strong-num">{formatPickingQty(item.qty_required)}</td>
                          <td className="num-col muted-num">
                            {formatPickingQty(pickingResults.mode === 'automatic' ? item.avail_before : item.qty_stock)}
                          </td>
                          {pickingResults.mode === 'automatic' && (
                            <td className="num-col strong-num">{formatPickingQty(item.avail_after)}</td>
                          )}
                          <td className="status-col">
                            <span className={`picking-status-chip ${itemMeta.tone}`}>
                              {itemMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            Nessun dettaglio per ordine disponibile.
          </p>
        )}
      </div>
    </>
  );
}
