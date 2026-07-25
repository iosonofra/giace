import {
  formatSmartCounterNote,
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
  selectedSku,
  setSortDirection,
  smartSkuCounterEnabled,
  sortDirection,
}) {
  return (
    <table className="custom-table">
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
          <th style={{ textAlign: 'right' }}>Qta</th>
          <th style={{ textAlign: 'right' }}>×SKU</th>
          <th style={{ textAlign: 'right' }}>Impegnato</th>
          {smartSkuCounterEnabled && (
            <>
              <th>Esito</th>
              <th>Residuo / Note</th>
            </>
          )}
          <th style={{ textAlign: 'right' }}>Valore</th>
        </tr>
      </thead>
      <tbody>
        {model.displayedOrders.map((order, index) => (
          <tr
            key={`${order.order_id}-${order.product_id}-${index}`}
            className={smartSkuCounterEnabled
              ? `smart-counter-row ${order.smart_status || ''}`
              : ''}
          >
            <OrderIdCell
              copiedOrderId={copiedOrderId}
              handleCopyOrderId={handleCopyOrderId}
              orderId={order.order_id}
            />
            <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {order.date_add
                ? new Date(order.date_add).toLocaleString('it-IT', {
                  dateStyle: 'short',
                  timeStyle: 'short',
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
              <span style={{
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                marginLeft: '4px',
              }}>
                (SKU: {selectedSku})
              </span>
            </td>
            <td style={{ textAlign: 'right', fontWeight: '500' }}>
              {order.product_quantity}
            </td>
            <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
              ×{order.qty_required}
            </td>
            <td style={{
              color: 'var(--color-primary)',
              fontWeight: '700',
              textAlign: 'right',
            }}>
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
                        <span key={issue.sku}>
                          {issue.sku}: richiesti {formatStockOrderQty(issue.qty_required)},
                          {' '}disp. {formatStockOrderQty(issue.qty_available)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </>
            )}
            <td style={{
              color: 'var(--text-secondary)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}>
              {order.total_paid != null
                ? `€ ${Number(order.total_paid).toFixed(2)}`
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="table-total-row">
          <td colSpan={5} style={{ fontWeight: '700' }}>Totali</td>
          <td style={{ textAlign: 'right' }}>{model.visibleTotals.quantity}</td>
          <td />
          <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
            {model.visibleTotals.committed}
          </td>
          {smartSkuCounterEnabled && <td colSpan={2} />}
          <td style={{ textAlign: 'right' }}>
            {model.visibleTotals.value > 0
              ? `€ ${model.visibleTotals.value.toFixed(2)}`
              : '—'}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
