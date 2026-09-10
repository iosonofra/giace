export function PickingSelectedOrders({
  pickingResults,
  sortedPickingOrders,
  getOrderPickingMeta,
  handleCopyOrderId,
  copiedOrderId,
  copyFeedbackKey,
  getRelativeTimeString,
  getStateBadgeClass,
  formatPickingQty,
}) {
  const sequentialMode = ['automatic', 'gaer'].includes(pickingResults.mode);
  const gaerMode = pickingResults.mode === 'gaer';

  return (
    <>
      {sequentialMode && (
          <div className="picking-split-head success">
            <div>
              <span>Ordini proposti</span>
              <strong>{sortedPickingOrders.length} preparabili</strong>
            </div>
            <span>{gaerMode ? 'Disponibili nel file Gaer' : 'Disponibili con la giacenza attuale'}</span>
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
                      <span key={copyFeedbackKey} className="picking-order-copied">Copiato</span>
                    )}
                    <span>{ord.customer_name}</span>
                    {sequentialMode && (
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

              <div className="table-container picking-order-table-wrap">
                <table className="custom-table picking-table picking-order-table">
                  <thead>
                    <tr>
                      <th>{gaerMode ? 'EAN13' : 'SKU componente'}</th>
                       {gaerMode && <th>Articolo</th>}
                       <th>{gaerMode ? 'Prodotto ordine' : 'Descrizione magazzino'}</th>
                       <th className="num-col">Quantità richiesta</th>
                       <th className="num-col">{sequentialMode ? 'Disponibile prima' : 'Disponibile magazzino'}</th>
                       {sequentialMode && (
                         <th className="num-col">Residuo dopo</th>
                       )}
                       <th className="status-col">Disponibilità</th>
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
                          <td className="picking-sku-cell" data-label={gaerMode ? 'EAN13' : 'SKU'}>{item.sku}</td>
                          {gaerMode && (
                            <td className="picking-article-cell" data-label="Articolo">{item.article || '—'}</td>
                          )}
                          <td className="picking-description-cell" data-label="Descrizione">
                            <span>{item.description}</span>
                            {gaerMode && (
                              <small className="picking-product-references">
                                <span><strong>SKU prodotto</strong> {item.product_reference || '—'}</span>
                                <span><strong>SKU fornitore</strong> {item.supplier_reference || '—'}</span>
                              </small>
                            )}
                          </td>
                          <td className="num-col strong-num" data-label="Richiesta">{formatPickingQty(item.qty_required)}</td>
                          <td className="num-col muted-num" data-label="Disponibile">
                            {formatPickingQty(sequentialMode ? item.avail_before : item.qty_stock)}
                          </td>
                          {sequentialMode && (
                            <td className="num-col strong-num" data-label="Residuo">{formatPickingQty(item.avail_after)}</td>
                          )}
                          <td className="status-col" data-label="Disponibilità">
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
          <p className="picking-empty-state">
            Nessun dettaglio per ordine disponibile.
          </p>
        )}
      </div>
    </>
  );
}
