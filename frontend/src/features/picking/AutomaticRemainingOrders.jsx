export function AutomaticRemainingOrders({
  automaticRemainingCount,
  hasAutomaticRemainingDetails,
  automaticRemainingOrders,
  autoPickingRemainingQuery,
  setAutoPickingRemainingQuery,
  autoPickingRemainingFilter,
  setAutoPickingRemainingFilter,
  setAutoPickingRemainingVisibleLimit,
  filteredAutomaticRemainingOrders,
  visibleAutomaticRemainingOrders,
  handleCopyOrderId,
  copiedOrderId,
  getRelativeTimeString,
  getStateBadgeClass,
  formatPickingQty,
  automaticUnclassifiedCount,
}) {
  return (
    <div className="picking-skipped-section">
                                <div className="picking-split-head warning">
                                  <div>
                                    <span>Ordini fuori dalla proposta</span>
                                    <strong>{automaticRemainingCount} ordini</strong>
                                  </div>
                                  <span>Non consumano giacenza nella simulazione corrente</span>
                                </div>

                                {hasAutomaticRemainingDetails && automaticRemainingOrders.length > 0 && (
                                  <div className="picking-remaining-controls">
                                    <input
                                      type="search"
                                      className="settings-input"
                                      placeholder="Cerca ID, cliente, stato o motivo"
                                      value={autoPickingRemainingQuery}
                                      onChange={(e) => {
                                        setAutoPickingRemainingQuery(e.target.value);
                                        setAutoPickingRemainingVisibleLimit(100);
                                      }}
                                      aria-label="Cerca negli ordini fuori proposta"
                                    />
                                    <div className="picking-filter-group" aria-label="Filtro ordini fuori proposta">
                                      <button
                                        type="button"
                                        className={autoPickingRemainingFilter === 'all' ? 'active' : ''}
                                        onClick={() => {
                                          setAutoPickingRemainingFilter('all');
                                          setAutoPickingRemainingVisibleLimit(100);
                                        }}
                                      >
                                        Tutti
                                      </button>
                                      <button
                                        type="button"
                                        className={autoPickingRemainingFilter === 'preparable' ? 'active' : ''}
                                        onClick={() => {
                                          setAutoPickingRemainingFilter('preparable');
                                          setAutoPickingRemainingVisibleLimit(100);
                                        }}
                                      >
                                        Preparabili
                                      </button>
                                      <button
                                        type="button"
                                        className={autoPickingRemainingFilter === 'blocked' ? 'active' : ''}
                                        onClick={() => {
                                          setAutoPickingRemainingFilter('blocked');
                                          setAutoPickingRemainingVisibleLimit(100);
                                        }}
                                      >
                                        Non preparabili
                                      </button>
                                    </div>
                                    <span className="picking-visible-count">
                                      {filteredAutomaticRemainingOrders.length} risultati
                                    </span>
                                  </div>
                                )}

                                {hasAutomaticRemainingDetails && automaticRemainingOrders.length > 0 ? (
                                  <div className="picking-skipped-panel full remaining">
                                    <div className="picking-skipped-list full">
                                      {visibleAutomaticRemainingOrders.map(order => (
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
                                            <span className={`picking-status-chip ${order.currently_preparable ? 'success' : 'danger'}`}>
                                              {order.currently_preparable ? 'Ancora preparabile' : 'Non preparabile'}
                                            </span>
                                            <span className="picking-skip-reason-label">{order.reason}</span>
                                            <small>{order.reason_detail}</small>
                                            <div className="picking-order-impact">
                                              {formatPickingQty(order.total_units)} unità · {order.distinct_skus} SKU
                                            </div>
                                            {order.missing_items?.length > 0 && (
                                              <div className="picking-skip-missing-list">
                                                {order.missing_items.map(item => (
                                                  <span key={item.sku} className="picking-skip-missing-chip">
                                                    <strong>{item.sku}</strong>
                                                    <span>
                                                      {item.violation_type === 'protected_residual'
                                                        ? `residuo ${formatPickingQty(item.qty_available_after)} < min ${formatPickingQty(item.min_residual)}`
                                                        : `manca ${formatPickingQty(item.qty_missing)}`}
                                                    </span>
                                                    <small>
                                                      richiesti {formatPickingQty(item.qty_required)} / disp. {formatPickingQty(item.qty_available)}
                                                    </small>
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {filteredAutomaticRemainingOrders.length === 0 && (
                                        <div className="picking-skipped-empty">
                                          Nessun ordine corrisponde ai filtri impostati.
                                        </div>
                                      )}
                                    </div>
                                    {visibleAutomaticRemainingOrders.length < filteredAutomaticRemainingOrders.length && (
                                      <button
                                        type="button"
                                        className="btn btn-neutral picking-load-more"
                                        onClick={() => setAutoPickingRemainingVisibleLimit(limit => limit + 100)}
                                      >
                                        Mostra altri 100 ({filteredAutomaticRemainingOrders.length - visibleAutomaticRemainingOrders.length} rimanenti)
                                      </button>
                                    )}
                                  </div>
                                ) : automaticUnclassifiedCount > 0 ? (
                                  <div className="picking-alert picking-alert-warning" role="status">
                                    <strong>{automaticUnclassifiedCount} ordini fuori proposta.</strong>
                                    <span>
                                      Il backend in esecuzione non restituisce ancora il dettaglio di questi ordini.
                                      Riavvia l’applicazione e rigenera la simulazione per consultarli e filtrarli.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="picking-skipped-empty">
                                    Tutti gli ordini candidati sono stati inclusi o classificati come non preparabili.
                                  </div>
                                )}
                              </div>
  );
}
