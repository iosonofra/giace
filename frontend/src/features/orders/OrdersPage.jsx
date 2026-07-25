import React from 'react';

export function OrdersPage({ orders }) {
  const {
    copiedOrderId,
    filteredOrders,
    formatDate,
    getOrderStateBadgeClass,
    handleCopyOrderId,
    highlightText,
    loading,
    ordersAvailableStates,
    ordersLimit,
    ordersPage,
    ordersWithoutAssociations,
    orderStateFilter,
    Pagination,
    searchOrder,
    setOrderStateFilter,
    setOrdersLimit,
    setOrdersPage,
    setSearchOrder,
    TableSkeleton,
    tabLoading,
    totalOrders,
    totalOrdersPages,
  } = orders;

  return (
    <div className="glass-panel widget-card">
                <div className="filter-bar">
                  <div className="search-wrapper">
                    <input type="text" className="search-input" placeholder="Cerca per Order ID, stato, prodotto o Product ID..." value={searchOrder} onChange={(e) => setSearchOrder(e.target.value)} />
                    <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
                  </div>
                  <select
                    className="select-control order-state-filter"
                    aria-label="Filtra ordini per stato attuale PrestaShop"
                    value={orderStateFilter}
                    onChange={(e) => {
                      setOrderStateFilter(e.target.value);
                      setOrdersPage(1);
                    }}
                  >
                    <option value="all">Tutti gli stati attuali</option>
                    {ordersAvailableStates.map(state => (
                      <option key={state.id} value={state.id}>{state.name} ({state.count})</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Visualizzati: {filteredOrders.length} di {totalOrders} Ordini Totali
                  </span>
                  {ordersWithoutAssociations > 0 && (
                    <span className="orders-missing-summary" aria-live="polite">
                      {ordersWithoutAssociations} {ordersWithoutAssociations === 1 ? 'ordine' : 'ordini'} senza associazione
                    </span>
                  )}
                </div>
                <div className="table-container">
                  {tabLoading ? (
                    <TableSkeleton rows={6} cols={5} />
                  ) : filteredOrders.length > 0 ? (
                    <table className="custom-table orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Stato Ordine</th>
                          <th>Data Creazione</th>
                          <th>Linee Prodotto</th>
                          <th>SKU generate dal bundle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => {
                          const orderHasMissingAssociation = order.lines.some(line => line.has_association === false);
                          return (
                          <React.Fragment key={order.order_id}>
                            {order.lines.map((line, idx) => {
                              const lineHasMissingAssociation = line.has_association === false;
                              return (
                              <tr 
                                key={`${order.order_id}-${idx}`} 
                                className={`${orderHasMissingAssociation ? 'order-row-missing-association' : ''} ${lineHasMissingAssociation ? 'order-line-missing-association' : ''}`.trim()}
                                style={{ 
                                  borderBottom: idx === order.lines.length - 1 
                                    ? '2px solid var(--border-color)' 
                                    : '1px dashed rgba(255, 255, 255, 0.03)' 
                                }}
                              >
                                {idx === 0 ? (
                                  <td 
                                    rowSpan={order.lines.length} 
                                    style={{ position: 'relative', fontWeight: '700', verticalAlign: 'top', paddingTop: '14px', cursor: 'pointer', color: 'var(--color-primary)', fontFamily: 'monospace' }}
                                    onClick={() => handleCopyOrderId(order.order_id)}
                                    title="Clicca per copiare l'ID ordine"
                                  >
                                    <div className="order-id-stack">
                                      <span>{highlightText(order.order_id, searchOrder)}</span>
                                      {orderHasMissingAssociation && (
                                        <span className="order-missing-label">
                                          <svg aria-hidden="true" viewBox="0 0 20 20">
                                            <path d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                          Associazione mancante
                                        </span>
                                      )}
                                    </div>
                                    {copiedOrderId === order.order_id && (
                                      <span style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%) translateY(-4px)',
                                        background: 'rgba(16, 185, 129, 0.95)',
                                        color: '#fff',
                                        fontSize: '0.7rem',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        pointerEvents: 'none',
                                        zIndex: 9999,
                                        fontWeight: '600'
                                      }}>
                                        Copiato!
                                      </span>
                                    )}
                                  </td>
                                ) : null}
                                {idx === 0 ? (
                                  <td rowSpan={order.lines.length} style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                                    <span className={`badge ${getOrderStateBadgeClass(order.current_state_label)}`}>
                                      {highlightText(order.current_state_label, searchOrder)}
                                    </span>
                                  </td>
                                ) : null}
                                {idx === 0 ? (
                                  <td rowSpan={order.lines.length} style={{ color: 'var(--text-secondary)', verticalAlign: 'top', paddingTop: '14px' }}>
                                    {formatDate(order.date_add)}
                                  </td>
                                ) : null}
                                <td>
                                  <div className="order-product-cell">
                                    <strong>{highlightText(line.product_name || 'Nome prodotto non disponibile', searchOrder)}</strong>
                                    <span>Prod ID: {highlightText(line.product_id, searchOrder)} · Qta: {line.product_quantity}</span>
                                  </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>
                                  {lineHasMissingAssociation ? (
                                    <span className="order-association-warning" role="status">
                                      <svg aria-hidden="true" viewBox="0 0 20 20">
                                        <path d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      Nessuna associazione trovata
                                    </span>
                                  ) : line.skus_generated}
                                </td>
                              </tr>
                              );
                            })}
                          </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      {searchOrder || orderStateFilter !== 'all'
                        ? 'Nessun ordine corrisponde ai filtri selezionati.'
                        : 'Nessun ordine sincronizzato. Seleziona gli stati nelle impostazioni e premi "Sincronizza Ordini da Webservice" in Dashboard.'}
                    </p>
                  )}
                </div>
            
                {/* Pagination Controls */}
                <Pagination 
                  currentPage={ordersPage}
                  totalPages={totalOrdersPages}
                  onPageChange={setOrdersPage}
                  limit={ordersLimit}
                  onLimitChange={setOrdersLimit}
                  disabled={loading}
                />
              </div>
  );
}
