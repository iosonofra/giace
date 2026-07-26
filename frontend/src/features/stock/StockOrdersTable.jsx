import {
  formatSmartCounterNote,
  formatStockOrderCurrency,
  formatStockOrderQty,
} from './stockOrdersDrawerModel';


function OrderIdCell({ copiedOrderId, handleCopyOrderId, orderId }) {
  return (
    <td
      style={{
        color: 'var(--color-primary)',
        cursor: 'pointer',
        fontWeight: '700',
        position: 'relative',
        whiteSpace: 'nowrap',
      }}
      onClick={() => handleCopyOrderId(orderId)}
      title="Clicca per copiare l'ID ordine"
    >
      {orderId}
      {copiedOrderId === orderId && (
        <span style={{
          background: 'rgba(16, 185, 129, 0.95)',
          borderRadius: '4px',
          bottom: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: '600',
          left: '50%',
          padding: '4px 8px',
          pointerEvents: 'none',
          position: 'absolute',
          transform: 'translateX(-50%) translateY(-4px)',
          zIndex: 9999,
        }}>
          Copiato!
        </span>
      )}
    </td>
  );
}

export function StockOrdersTable({
  copiedOrderId,
  getStateBadgeClass,
  handleCopyOrderId,
  model,
  setSortDirection,
  smartSkuCounterEnabled,
  sortDirection,
}) {
  return (
    <table className="custom-table stock-orders-table">
      <thead>
        <tr>
          <th>Ordine</th>
          <th>
            <button
              type="button"
              className="table-sort-header"
              onClick={() => setSortDirection(previous => (
                previous === 'asc' ? 'desc' : 'asc'
              ))}
              aria-label={`Ordina per data ${sortDirection === 'asc' ? 'dal piu recente al meno recente' : 'dal meno recente al piu recente'}`}
              title={sortDirection === 'asc'
                ? 'Dal meno recente al piu recente'
                : 'Dal piu recente al meno recente'}
            >
              <span>Data</span>
              <span className="sort-arrow" aria-hidden="true">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          </th>
          <th>Cliente</th>
          <th>Stato</th>
          <th>Prodotto</th>
          <th className="stock-orders-number">Qta</th>
          <th className="stock-orders-number">×SKU</th>
          <th className="stock-orders-number">Impegnato</th>
          {smartSkuCounterEnabled && (
            <>
              <th>Esito</th>
              <th>Residuo / Note</th>
            </>
          )}
          <th className="stock-orders-number">Valore</th>
        </tr>
      </thead>
      <tbody>
        {model.displayedOrders.map((order, index) => {
          const previousOrder = model.displayedOrders[index - 1];
          const nextOrder = model.displayedOrders[index + 1];
          const groupClass = previousOrder?.order_id === order.order_id
            ? 'order-group-continuation'
            : nextOrder?.order_id === order.order_id
              ? 'order-group-start'
              : '';
          return (
            <tr
              key={`${order.order_id}-${order.product_id}-${index}`}
              className={[
                'stock-order-row',
                groupClass,
                smartSkuCounterEnabled
                  ? `smart-counter-row ${order.smart_status || ''}`
                  : '',
              ].filter(Boolean).join(' ')}
            >
            <OrderIdCell
              copiedOrderId={copiedOrderId}
              handleCopyOrderId={handleCopyOrderId}
              orderId={order.order_id}
            />
            <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {order.date_add
                ? new Date(order.date_add).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : '—'}
            </td>
            <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
              {order.customer_name || (
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  N/D
                </span>
              )}
            </td>
            <td>
              <span className={getStateBadgeClass(order.current_state_label)}>
                {order.current_state_label || 'Incluso'}
              </span>
            </td>
            <td>
              <span style={{ fontWeight: '500' }}>{order.product_reference}</span>
            </td>
            <td className="stock-orders-number" style={{ fontWeight: '500' }}>
              {order.product_quantity}
            </td>
            <td className="stock-orders-number" style={{ color: 'var(--text-secondary)' }}>
              ×{order.qty_required}
            </td>
            <td className="stock-orders-number stock-orders-committed">
              {order.contribution}
            </td>
            {smartSkuCounterEnabled && (
              <>
                <td>
                  <span className={`smart-counter-chip ${order.smart_status || ''}`}>
                    {order.smart_label || 'Da valutare'}
                  </span>
                </td>
                <td className={`smart-counter-residue ${order.smart_status === 'counted' ? 'counted' : ''}`}>
                  <span className="smart-counter-residue-value">
                    {formatStockOrderQty(order.selected_qty_before || 0)} {'->'}{' '}
                    {formatStockOrderQty(order.selected_qty_after || 0)}
                  </span>
                  {order.smart_status !== 'counted'
                    && order.smart_note
                    && !order.component_issues?.length && (
                    <span className="smart-counter-note-text">
                      {formatSmartCounterNote(order.smart_note)}
                    </span>
                  )}
                  {order.component_issues?.length > 0 && (
                    <div className="smart-counter-issues">
                      {order.component_issues.map(issue => (
                        <span key={issue.sku} className="smart-counter-issue">
                          <code>{issue.sku}</code>
                          <span>
                            richiesti <b>{formatStockOrderQty(issue.qty_required)}</b>
                          </span>
                          <span>
                            disponibili{' '}
                            <b className="smart-counter-missing-qty">
                              {formatStockOrderQty(issue.qty_available)}
                            </b>
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </>
            )}
            <td className="stock-orders-number stock-orders-value">
              {order.total_paid != null
                ? formatStockOrderCurrency(order.total_paid)
                : '—'}
            </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="table-total-row">
          <td colSpan={5} style={{ fontWeight: '700' }}>Totali</td>
          <td className="stock-orders-number">{model.visibleTotals.quantity}</td>
          <td />
          <td className="stock-orders-number stock-orders-committed">
            {model.visibleTotals.committed}
          </td>
          {smartSkuCounterEnabled && <td colSpan={2} />}
          <td className="stock-orders-number">
            {model.visibleTotals.value > 0
              ? formatStockOrderCurrency(model.visibleTotals.value)
              : '—'}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
