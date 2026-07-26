import {
  formatStockOrderCurrency,
  formatStockOrderQty,
} from './stockOrdersDrawerModel';


export function StockOrdersDrawerHeader({
  closeDrawer,
  loadingSkuOrders,
  loadingSmartSkuCounter,
  model,
  selectedSku,
  skuOrdersData,
  smartSkuCounterEnabled,
  toggleSmartSkuCounter,
}) {
  const { smartSummary } = model;
  const smartInitialStock = Number(smartSummary?.initial_selected_stock || 0);
  const smartFinalStock = Number(smartSummary?.final_selected_stock || 0);
  const smartConsumedStock = Math.max(0, smartInitialStock - smartFinalStock);

  return (
    <div className="order-drawer-header">
      <div className="order-drawer-title-row">
        <h3 id="stock-orders-drawer-title">
          Ordini impegnati — SKU:{' '}
          <span className="stock-orders-drawer-sku">{selectedSku}</span>
        </h3>
        <div className="order-drawer-title-actions">
          {!loadingSkuOrders && skuOrdersData.length > 0 && (
            <span
              className="smart-counter-tooltip-wrap"
              data-tooltip="Simula gli ordini attivi in ordine cronologico, scala le giacenze di tutte le SKU collegate e indica quali ordini sono preparabili."
            >
              <button
                type="button"
                className={`btn btn-sm ${smartSkuCounterEnabled ? 'btn-success' : 'btn-neutral'}`}
                onClick={toggleSmartSkuCounter}
                disabled={loadingSmartSkuCounter}
              >
                {loadingSmartSkuCounter
                  ? 'Calcolo Smart...'
                  : smartSkuCounterEnabled
                    ? (
                      <>
                        <span className="smart-mode-dot" aria-hidden="true" />
                        Conteggio Smart attivo
                      </>
                    )
                    : 'Conteggio Smart'}
              </button>
            </span>
          )}
          <button
            className="order-drawer-close"
            onClick={closeDrawer}
            aria-label="Chiudi dettaglio ordine"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>

      {!loadingSkuOrders && skuOrdersData.length > 0 && (
        <div className="order-drawer-stats">
          <div className="drawer-stat-chip stat-primary">
            <span className="stat-value">{model.totalOrders}</span>
            <span className="stat-label">Ordini</span>
          </div>
          <div className="drawer-stat-chip stat-primary">
            <span className="stat-value">{model.totalCommitted}</span>
            <span className="stat-label">SKU Impegnate</span>
          </div>
          {model.hasSelectedSkuStock && (
            <div className={`drawer-stat-chip ${model.remainingStock <= 0 ? 'stat-danger' : 'stat-success'}`}>
              <span className="stat-value">{formatStockOrderQty(model.remainingStock)}</span>
              <span className="stat-label">Giacenza Rimanente</span>
              {smartSkuCounterEnabled && smartSummary && (
                <span className="stat-detail">
                  Smart {formatStockOrderQty(smartInitialStock)}
                  {' → '}
                  {formatStockOrderQty(smartFinalStock)}
                  {' · '}
                  consumo {formatStockOrderQty(smartConsumedStock)}
                </span>
              )}
            </div>
          )}
          {model.totalValue > 0 && (
            <div className="drawer-stat-chip stat-neutral">
              <span className="stat-value">
                {formatStockOrderCurrency(model.totalValue)}
              </span>
              <span className="stat-label">Valore Stimato</span>
            </div>
          )}
          {smartSkuCounterEnabled && smartSummary && (
            <>
              <div className="drawer-stat-chip stat-success">
                <span className="stat-value">{smartSummary.counted || 0}</span>
                <span className="stat-label">Conteggiati</span>
              </div>
              <div className={`drawer-stat-chip ${(smartSummary.blocked || 0) + (smartSummary.selected_sku_shortage || 0) > 0 ? 'stat-danger' : 'stat-success'}`}>
                <span className="stat-value">
                  {(smartSummary.blocked || 0) + (smartSummary.selected_sku_shortage || 0)}
                </span>
                <span className="stat-label">Non conteggiati</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
