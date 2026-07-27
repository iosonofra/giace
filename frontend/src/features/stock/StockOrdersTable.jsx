import {
  formatSmartCounterNote,
  formatStockOrderCurrency,
  formatStockOrderQty,
} from './stockOrdersDrawerModel';


function OrderIdCell({ copiedOrderId, handleCopyOrderId, orderId }) {
  return (
    <td className="stock-order-id-cell">
      <button
        type="button"
        className={`stock-order-id-button ${
          copiedOrderId === orderId ? 'copied' : ''
        }`}
        onClick={() => handleCopyOrderId(orderId)}
        title="Clicca per copiare l'ID ordine"
        aria-label={`Copia ID ordine ${orderId}`}
      >
        {orderId}
        {copiedOrderId === orderId && (
          <span className="stock-order-copy-tooltip" role="status">
            Copiato!
          </span>
        )}
      </button>
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
          <th aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
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
            <td className="stock-order-customer" style={{ whiteSpace: 'nowrap' }}>
              {order.customer_name || (
                <span className="stock-order-empty" style={{ color: 'var(--text-secondary)' }}>
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
              <span className="stock-order-product-reference">{order.product_reference}</span>
            </td>
            <td className="stock-orders-number stock-order-quantity">
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
          <td className="table-total-label" colSpan={5}>Totali</td>
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
