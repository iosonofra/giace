import { useExitPresence } from '../../components/ui/useExitPresence';


export function StockProductsDrawer({ stock }) {
  const {
    copiedAssociatedProductId,
    formatPickingQty,
    handleCopyAssociatedProductId,
    loadingSkuProducts,
    selectedSkuForProducts,
    setSelectedSkuForProducts,
    skuProductsData,
  } = stock;

  const presence = useExitPresence(selectedSkuForProducts);
  if (!presence.shouldRender) return null;

  const renderedSku = presence.renderedValue;
  const closeDrawer = () => setSelectedSkuForProducts(null);

  return (
    <>
      <div
        className={`order-drawer-overlay ${presence.isExiting ? 'is-exiting' : ''}`}
        onClick={closeDrawer}
      />
      <aside
        className={`order-drawer stock-products-drawer ${
          presence.isExiting ? 'is-exiting' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-products-drawer-title"
      >
        <div className="order-drawer-header">
          <div className="order-drawer-title-row">
            <div>
              <span className="stock-products-drawer-eyebrow">Prodotti associati</span>
              <h3 id="stock-products-drawer-title">
                SKU <span>{renderedSku}</span>
              </h3>
            </div>
            <button
              type="button"
              className="order-drawer-close"
              onClick={closeDrawer}
              aria-label="Chiudi prodotti associati"
            >
              ×
            </button>
          </div>
          <div className="order-drawer-stats">
            <div className="drawer-stat-chip">
              <span className="stat-value">{skuProductsData.length}</span>
              <span className="stat-label">Prodotti collegati</span>
            </div>
          </div>
        </div>

        <div className="order-drawer-body stock-products-drawer-body">
          {loadingSkuProducts ? (
            <div className="stock-products-drawer-loading" aria-live="polite">
              <div className="spinner" />
              <span>Caricamento prodotti associati…</span>
            </div>
          ) : skuProductsData.length === 0 ? (
            <div className="stock-products-drawer-empty">
              <strong>Nessun prodotto associato</strong>
              <span>La SKU non risulta collegata a prodotti nel batch attivo.</span>
            </div>
          ) : (
            <div className="stock-associated-product-list">
              {skuProductsData.map(product => (
                <article key={product.product_id} className="stock-associated-product-card">
                  <div className="stock-associated-product-head">
                    <div>
                      <span>Prodotto PrestaShop</span>
                      <button
                        type="button"
                        className={`stock-associated-product-id ${copiedAssociatedProductId === product.product_id ? 'copied' : ''}`}
                        onClick={() => handleCopyAssociatedProductId(product.product_id)}
                        title="Copia ID prodotto"
                        aria-label={`Copia ID prodotto ${product.product_id}`}
                      >
                        <strong>{product.product_id}</strong>
                        <small>{copiedAssociatedProductId === product.product_id ? 'Copiato' : 'Copia'}</small>
                      </button>
                    </div>
                    <span className="stock-associated-product-quantity">
                      ×{formatPickingQty(product.qty_required)} per prodotto
                    </span>
                  </div>
                  <div className="stock-associated-product-copy">
                    <strong>{product.product_name || `Prodotto ${product.product_id}`}</strong>
                    <span>{product.product_reference || 'Riferimento non disponibile'}</span>
                  </div>
                  <dl className="stock-associated-product-facts">
                    <div>
                      <dt>Disponibilità</dt>
                      <dd>{product.qty_available === null ? 'Non calcolata' : formatPickingQty(product.qty_available)}</dd>
                    </div>
                    <div>
                      <dt>SKU limitante</dt>
                      <dd>{product.limiting_sku || '—'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="order-drawer-footer">
          <button type="button" className="btn btn-primary" onClick={closeDrawer}>
            Chiudi
          </button>
        </div>
      </aside>
    </>
  );
}
