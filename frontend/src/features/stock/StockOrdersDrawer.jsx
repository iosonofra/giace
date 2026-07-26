import { StockOrdersDrawerHeader } from './StockOrdersDrawerHeader';
import { StockOrdersTable } from './StockOrdersTable';
import { deriveStockOrdersDrawer } from './stockOrdersDrawerModel';


export function StockOrdersDrawer({ stock }) {
  const {
    Icons,
    copiedOrderId,
    getStateBadgeClass,
    handleCopyOrderId,
    loadingSkuOrders,
    loadingSmartSkuCounter,
    selectedSkuForOrders,
    setSelectedSkuForOrders,
    setSkuOrdersSortDirection,
    skuOrdersData,
    skuOrdersSortDirection,
    smartSkuCounterData,
    smartSkuCounterEnabled,
    stockData,
    toggleSmartSkuCounter,
  } = stock;

  if (!selectedSkuForOrders) return null;

  const model = deriveStockOrdersDrawer({
    selectedSku: selectedSkuForOrders,
    skuOrdersData,
    smartSkuCounterData,
    smartSkuCounterEnabled,
    sortDirection: skuOrdersSortDirection,
    stockData,
  });
  const drawerIsLoading = (
    loadingSkuOrders
    || (smartSkuCounterEnabled && loadingSmartSkuCounter)
  );
  const closeDrawer = () => setSelectedSkuForOrders(null);

  return (
    <>
      <div className="order-drawer-overlay" onClick={closeDrawer} />
      <div
        className={`order-drawer stock-orders-drawer ${
          smartSkuCounterEnabled ? 'order-drawer-expanded' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-orders-drawer-title"
      >
        <StockOrdersDrawerHeader
          closeDrawer={closeDrawer}
          loadingSkuOrders={loadingSkuOrders}
          loadingSmartSkuCounter={loadingSmartSkuCounter}
          model={model}
          selectedSku={selectedSkuForOrders}
          skuOrdersData={skuOrdersData}
          smartSkuCounterEnabled={smartSkuCounterEnabled}
          toggleSmartSkuCounter={toggleSmartSkuCounter}
        />

        <div className="order-drawer-body">
          {drawerIsLoading ? (
            <div className="spinner-container" style={{ paddingTop: '60px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                {smartSkuCounterEnabled
                  ? 'Calcolo Conteggio Smart in corso...'
                  : 'Caricamento ordini in corso...'}
              </p>
            </div>
          ) : model.displayedOrders.length > 0 ? (
            <div className="stock-orders-table-shell">
              <StockOrdersTable
                copiedOrderId={copiedOrderId}
                getStateBadgeClass={getStateBadgeClass}
                handleCopyOrderId={handleCopyOrderId}
                model={model}
                setSortDirection={setSkuOrdersSortDirection}
                smartSkuCounterEnabled={smartSkuCounterEnabled}
                sortDirection={skuOrdersSortDirection}
              />
            </div>
          ) : (
            <div style={{
              color: 'var(--text-secondary)',
              padding: '60px 24px',
              textAlign: 'center',
            }}>
              <div style={{
                color: 'var(--color-primary)',
                height: '44px',
                margin: '0 auto 12px',
                opacity: 0.45,
                width: '44px',
              }}>
                <Icons.Stock />
              </div>
              <p style={{ margin: 0 }}>
                Nessun ordine attivo trovato per questa SKU.
              </p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
