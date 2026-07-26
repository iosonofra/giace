import React from 'react';

function OrdersSummaryItem({ label, value, tone = 'neutral' }) {
  return (
    <div className={`orders-summary-item ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

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

  const visibleProductLines = filteredOrders.reduce(
    (total, order) => total + order.lines.length,
    0,
  );

  return (
    <div className="glass-panel widget-card orders-workbench">
      <div className="orders-summary-strip" aria-label="Riepilogo ordini sincronizzati">
        <OrdersSummaryItem label="Ordini totali" value={totalOrders} />
        <OrdersSummaryItem label="Ordini visualizzati" value={filteredOrders.length} />
        <OrdersSummaryItem label="Righe prodotto" value={visibleProductLines} />
        <OrdersSummaryItem
          label="Senza associazione"
          value={ordersWithoutAssociations}
          tone={ordersWithoutAssociations > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="orders-toolbar">
        <div className="search-wrapper orders-search">
          <input
            type="text"
            className="search-input"
            placeholder="Cerca ID ordine, stato, prodotto o Product ID..."
            value={searchOrder}
            onChange={(event) => setSearchOrder(event.target.value)}
          />
          <svg className="search-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
          </svg>
        </div>

        <select
          className="select-control order-state-filter"
          aria-label="Filtra ordini per stato attuale PrestaShop"
          value={orderStateFilter}
          onChange={(event) => {
            setOrderStateFilter(event.target.value);
            setOrdersPage(1);
          }}
        >
          <option value="all">Tutti gli stati attuali</option>
          {ordersAvailableStates.map(state => (
            <option key={state.id} value={state.id}>
              {state.name} ({state.count})
            </option>
          ))}
        </select>

        <span className="orders-result-count" aria-live="polite">
          {filteredOrders.length} di {totalOrders} ordini
        </span>

        {ordersWithoutAssociations > 0 && (
          <span className="orders-missing-summary" aria-live="polite">
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path
                d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {ordersWithoutAssociations}{' '}
            {ordersWithoutAssociations === 1 ? 'ordine' : 'ordini'} senza associazione
          </span>
        )}
      </div>

      <div className="table-container orders-table-shell">
        {tabLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : filteredOrders.length > 0 ? (
          <table className="custom-table orders-table">
            <thead>
              <tr>
                <th className="orders-col-id">Order ID</th>
                <th className="orders-col-state">Stato ordine</th>
                <th className="orders-col-date">Data creazione</th>
                <th className="orders-col-product">Linee prodotto</th>
                <th className="orders-col-sku">SKU generate dal bundle</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const orderHasMissingAssociation = order.lines.some(
                  line => line.has_association === false,
                );

                return (
                  <React.Fragment key={order.order_id}>
                    {order.lines.map((line, index) => {
                      const lineHasMissingAssociation =
                        line.has_association === false;
                      const rowClasses = [
                        'orders-line-row',
                        index === 0 ? 'orders-group-start' : 'orders-group-continuation',
                        index === order.lines.length - 1 ? 'orders-group-end' : '',
                        orderHasMissingAssociation
                          ? 'order-row-missing-association'
                          : '',
                        lineHasMissingAssociation
                          ? 'order-line-missing-association'
                          : '',
                      ].filter(Boolean).join(' ');

                      return (
                        <tr
                          key={`${order.order_id}-${index}`}
                          className={rowClasses}
                        >
                          {index === 0 && (
                            <td
                              rowSpan={order.lines.length}
                              className="orders-order-cell"
                            >
                              <div className="order-id-stack">
                                <button
                                  type="button"
                                  className="order-id-copy-button"
                                  onClick={() => handleCopyOrderId(order.order_id)}
                                  title="Copia ID ordine"
                                  aria-label={`Copia ID ordine ${order.order_id}`}
                                >
                                  <span>
                                    {highlightText(order.order_id, searchOrder)}
                                  </span>
                                  <svg aria-hidden="true" viewBox="0 0 20 20">
                                    <rect
                                      x="6.5"
                                      y="6.5"
                                      width="9"
                                      height="9"
                                      rx="1.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                    />
                                    <path
                                      d="M13.5 6.5V5A1.5 1.5 0 0 0 12 3.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                    />
                                  </svg>
                                </button>

                                {copiedOrderId === order.order_id && (
                                  <span className="order-copy-confirmation" role="status">
                                    Copiato
                                  </span>
                                )}

                                {orderHasMissingAssociation && (
                                  <span className="order-missing-label">
                                    <svg aria-hidden="true" viewBox="0 0 20 20">
                                      <path
                                        d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                    Associazione mancante
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {index === 0 && (
                            <td
                              rowSpan={order.lines.length}
                              className="orders-order-cell"
                            >
                              <span
                                className={`badge ${getOrderStateBadgeClass(
                                  order.current_state_label,
                                )}`}
                              >
                                {highlightText(
                                  order.current_state_label,
                                  searchOrder,
                                )}
                              </span>
                            </td>
                          )}

                          {index === 0 && (
                            <td
                              rowSpan={order.lines.length}
                              className="orders-order-cell orders-date-cell"
                            >
                              {formatDate(order.date_add)}
                            </td>
                          )}

                          <td>
                            <div className="order-product-cell">
                              <strong>
                                {highlightText(
                                  line.product_name
                                    || 'Nome prodotto non disponibile',
                                  searchOrder,
                                )}
                              </strong>
                              <span>
                                Product ID: {highlightText(line.product_id, searchOrder)}
                                {' · '}
                                Quantità: <b>{line.product_quantity}</b>
                              </span>
                            </div>
                          </td>

                          <td>
                            {lineHasMissingAssociation ? (
                              <span className="order-association-warning" role="status">
                                <svg aria-hidden="true" viewBox="0 0 20 20">
                                  <path
                                    d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Nessuna associazione
                              </span>
                            ) : (
                              <span className="order-generated-skus">
                                {line.skus_generated}
                              </span>
                            )}
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
          <div className="orders-empty-state">
            <strong>Nessun ordine da mostrare</strong>
            <p>
              {searchOrder || orderStateFilter !== 'all'
                ? 'Nessun ordine corrisponde ai filtri selezionati.'
                : 'Seleziona gli stati nelle impostazioni e sincronizza gli ordini dalla Dashboard.'}
            </p>
          </div>
        )}
      </div>

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
