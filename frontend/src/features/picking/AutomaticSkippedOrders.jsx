export function AutomaticSkippedOrders({
  pickingResults,
  handleCopyOrderId,
  copiedOrderId,
  getRelativeTimeString,
  getStateBadgeClass,
  formatPickingQty,
}) {
  return (
    <div className="picking-skipped-section">
                                <div className="picking-split-head danger">
                                  <div>
                                    <span>Ordini saltati</span>
                                    <strong>{pickingResults.skipped_orders?.length || 0} non preparabili</strong>
                                  </div>
                                  <span>Dettaglio motivo esclusione</span>
                                </div>

                                {pickingResults.skipped_orders?.length > 0 ? (
                                  <div className="picking-skipped-panel full">
                                    <div className="picking-skipped-list full">
                                      {pickingResults.skipped_orders.map(order => (
                                        <div key={order.order_id} className="picking-skipped-row full">
                                          <div>
                                            <button
                                              type="button"
                                              className="picking-skipped-order-id-btn"
                                              onClick={() => handleCopyOrderId(order.order_id)}
                                              title="Clicca per copiare l'ID ordine"
                                            >
                                              #{order.chronological_position} · Ordine {order.order_id}
                                            </button>
                                            {copiedOrderId === order.order_id && (
                                              <span className="picking-order-copied">Copiato</span>
                                            )}
                                            <span>{order.customer_name}</span>
                                            {order.date_add && (
                                              <span className="picking-skipped-date">
                                                {new Date(order.date_add).toLocaleString('it-IT')} · {getRelativeTimeString(order.date_add)}
                                              </span>
                                            )}
                                            {order.current_state_label && (
                                              <span className={getStateBadgeClass(order.current_state_label)}>
                                                {order.current_state_label}
                                              </span>
                                            )}
                                          </div>
                                          <div className="picking-skip-reason">
                                            <span className="picking-skip-reason-label">
                                              {order.reason || 'Non preparabile'}
                                            </span>
                                            <div className="picking-order-impact">
                                              {formatPickingQty(order.total_units)} unità · {order.distinct_skus} SKU
                                            </div>
                                            {order.missing_items?.length > 0 ? (
                                              <div className="picking-skip-missing-list">
                                                {order.missing_items.map(item => (
                                                  <span key={item.sku} className="picking-skip-missing-chip">
                                                    <strong>{item.sku}</strong>
                                                    <span>
                                                      {item.violation_type === 'protected_residual'
                                                        ? `dopo ${item.qty_available_after} < min ${item.min_residual}`
                                                        : `manca ${item.qty_missing}`}
                                                    </span>
                                                    <small>
                                                      richiesti {item.qty_required} / disp. {item.qty_available}
                                                    </small>
                                                  </span>
                                                ))}
                                              </div>
                                            ) : order.missing_references?.length > 0 ? (
                                              <div className="picking-skip-missing-list">
                                                {order.missing_references.map(item => (
                                                  <span key={`${item.product_id}-${item.qty_ordered}`} className="picking-skip-missing-chip">
                                                    <strong>ID {item.product_id}</strong>
                                                    <span>ref mancante</span>
                                                  </span>
                                                ))}
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="picking-skipped-empty">
                                    Nessun ordine saltato: tutti gli ordini valutati sono preparabili.
                                  </div>
                                )}
                              </div>
  );
}
