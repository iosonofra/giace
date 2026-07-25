function ExcludedOrdersSection({
  formatPickingQty,
  itemKey,
  itemText,
  orders,
  title,
  variantClass = '',
}) {
  if (orders.length === 0) return null;

  return (
    <section
      className={`picking-sku-limit-exclusions ${variantClass}`}
      aria-label={title}
    >
      <div className="picking-sku-limit-exclusions-head">
        <div>
          <span>{title}</span>
          <strong>{orders.length} ordini</strong>
        </div>
        <p>Questi ordini non entrano nella simulazione e non consumano giacenza.</p>
      </div>
      <div className="picking-sku-limit-exclusion-list">
        {orders.slice(0, 20).map(order => (
          <div key={order.order_id} className="picking-sku-limit-exclusion-row">
            <div>
              <strong>Ordine {order.order_id}</strong>
              <span>{order.customer_name}</span>
            </div>
            <div>
              {order[itemKey]?.map(item => (
                <span key={item.sku}>
                  <strong>{item.sku}</strong>
                  {itemText(item, formatPickingQty)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {orders.length > 20 && <small>Visualizzati i primi 20 ordini esclusi.</small>}
    </section>
  );
}

function SimulationSummary({ formatPickingQty, summary }) {
  return (
    <section className="picking-simulation-summary" aria-label="Riepilogo scalatura giacenze">
      <div className="picking-simulation-head">
        <div>
          <span>Impatto della simulazione</span>
          <strong>La giacenza viene scalata in sequenza solo per gli ordini proposti</strong>
        </div>
        <span className="badge badge-neutral">Nessuna prenotazione reale</span>
      </div>
      <div className="picking-decision-strip">
        <div className="picking-decision-item success">
          <span>Unità da prelevare</span>
          <strong>{formatPickingQty(summary.selected_units)}</strong>
        </div>
        <div className="picking-decision-item">
          <span>SKU coinvolte</span>
          <strong>{summary.selected_distinct_skus || 0}</strong>
        </div>
        <div className="picking-decision-item">
          <span>Stock iniziale sulle SKU usate</span>
          <strong>{formatPickingQty(summary.initial_units_on_touched_skus)}</strong>
        </div>
        <div className="picking-decision-item warning">
          <span>Residuo simulato</span>
          <strong>{formatPickingQty(summary.remaining_units_on_touched_skus)}</strong>
        </div>
        <div className="picking-decision-item">
          <span>Fuori proposta ma preparabili</span>
          <strong>{summary.remaining_preparable_count ?? 'n/d'}</strong>
        </div>
      </div>
      {summary.stopped_by_strict_chronology && (
        <div className="picking-alert picking-alert-warning" role="status">
          <strong>Coda cronologica interrotta.</strong>
          <span>
            La simulazione si è fermata sul primo ordine non preparabile; gli ordini
            successivi non sono stati proposti.
          </span>
        </div>
      )}
    </section>
  );
}

function SkippedOrdersSummary({
  copiedOrderId,
  formatPickingQty,
  getRelativeTimeString,
  getStateBadgeClass,
  handleCopyOrderId,
  skippedOrders,
}) {
  if (skippedOrders.length === 0) return null;

  return (
    <div className="picking-skipped-panel">
      <div className="picking-skipped-head">
        <span>Ordini saltati</span>
        <strong>{skippedOrders.length}</strong>
      </div>
      <div className="picking-skipped-list">
        {skippedOrders.slice(0, 12).map(order => (
          <div key={order.order_id} className="picking-skipped-row">
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
                  {new Date(order.date_add).toLocaleString('it-IT')} ·{' '}
                  {getRelativeTimeString(order.date_add)}
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
                    <span
                      key={`${item.product_id}-${item.qty_ordered}`}
                      className="picking-skip-missing-chip"
                    >
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
  );
}

export function PickingAutomaticInsights({
  automaticSimulationSummary,
  automaticSkuExcludedOrders,
  automaticSkuLimitExcludedOrders,
  copiedOrderId,
  formatPickingQty,
  getRelativeTimeString,
  getStateBadgeClass,
  handleCopyOrderId,
  pickingResults,
  pickingViewMode,
}) {
  if (pickingResults.mode !== 'automatic') return null;

  return (
    <>
      <ExcludedOrdersSection
        formatPickingQty={formatPickingQty}
        itemKey="excluded_items"
        itemText={(item, formatQty) => `richieste ${formatQty(item.qty_required)}`}
        orders={automaticSkuExcludedOrders}
        title="Esclusi per SKU configurata"
        variantClass="picking-explicit-sku-exclusions"
      />
      <ExcludedOrdersSection
        formatPickingQty={formatPickingQty}
        itemKey="exceeded_items"
        itemText={(item, formatQty) => (
          `richieste ${formatQty(item.qty_required)} · massimo ${formatQty(item.max_per_order)}`
        )}
        orders={automaticSkuLimitExcludedOrders}
        title="Esclusi dai limiti per ordine"
      />
      <SimulationSummary
        formatPickingQty={formatPickingQty}
        summary={automaticSimulationSummary}
      />
      {pickingViewMode === 'aggregated' && (
        <SkippedOrdersSummary
          copiedOrderId={copiedOrderId}
          formatPickingQty={formatPickingQty}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          handleCopyOrderId={handleCopyOrderId}
          skippedOrders={pickingResults.skipped_orders || []}
        />
      )}
    </>
  );
}
