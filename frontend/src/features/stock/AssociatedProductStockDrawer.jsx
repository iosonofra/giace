import { useExitPresence } from '../../components/ui/useExitPresence';
import { getSupportedKitCount } from './associatedProductStockPresentation';


export function AssociatedProductStockDrawer({ stock }) {
  const {
    formatPickingQty,
    selectedAssociatedProduct,
    setSelectedAssociatedProduct,
  } = stock;
  const presence = useExitPresence(selectedAssociatedProduct);
  if (!presence.shouldRender) return null;

  const product = presence.renderedValue;
  const closeDrawer = () => setSelectedAssociatedProduct(null);
  const sortedComponents = [...product.components].sort((left, right) => (
    Number(right.is_limiting) - Number(left.is_limiting)
    || getSupportedKitCount(left) - getSupportedKitCount(right)
    || left.sku.localeCompare(right.sku)
  ));

  return (
    <>
      <div
        className={`order-drawer-overlay ${presence.isExiting ? 'is-exiting' : ''}`}
        onClick={closeDrawer}
      />
      <aside
        className={`order-drawer associated-product-stock-drawer ${presence.isExiting ? 'is-exiting' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="associated-product-stock-title"
      >
        <div className="order-drawer-header">
          <div className="order-drawer-title-row">
            <div>
              <span className="stock-products-drawer-eyebrow">Giacenza per prodotto</span>
              <h3 id="associated-product-stock-title">Prodotto {product.product_id}</h3>
              <p>{product.product_name || 'Nome prodotto non disponibile'}</p>
            </div>
            <button
              type="button"
              className="order-drawer-close"
              onClick={closeDrawer}
              aria-label="Chiudi dettaglio prodotto"
            >
              ×
            </button>
          </div>
          <div className="associated-product-drawer-summary">
            <div>
              <span>Totale</span>
              <strong>{product.qty_total === null ? '—' : formatPickingQty(product.qty_total)}</strong>
            </div>
            <div>
              <span>Impegnata</span>
              <strong>{product.qty_committed === null ? '—' : formatPickingQty(product.qty_committed)}</strong>
            </div>
            <div>
              <span>Residua</span>
              <strong>{product.qty_residual === null ? '—' : formatPickingQty(product.qty_residual)}</strong>
            </div>
            <div>
              <span>SKU limitante</span>
              <strong>{product.limiting_sku || '—'}</strong>
            </div>
          </div>
        </div>
        <div className="order-drawer-body associated-product-drawer-body">
          <div className="associated-product-drawer-reference">
            <span>Riferimento PrestaShop</span>
            <strong>{product.product_reference || 'Non disponibile'}</strong>
          </div>
          <div className="associated-product-capacity-note">
            <span aria-hidden="true">i</span>
            <p>
              La disponibilità del prodotto è determinata dal componente che consente
              di assemblare meno kit. Il componente limitante è mostrato per primo.
            </p>
          </div>
          <div className="associated-product-component-table-shell">
            <table className="custom-table associated-product-component-table">
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Per kit</th>
                  <th>Totale</th>
                  <th>Impegnata</th>
                  <th>Residua</th>
                  <th title="Quantità di kit ancora assemblabili con questo componente">Kit supportati</th>
                </tr>
              </thead>
              <tbody>
                {sortedComponents.map(component => (
                  <tr key={component.sku} className={component.is_limiting ? 'limiting' : ''}>
                    <td>
                      <strong>{component.sku}</strong>
                      {component.is_limiting && <span>SKU limitante</span>}
                    </td>
                    <td>{formatPickingQty(component.qty_required)}</td>
                    <td>{formatPickingQty(component.qty_total)}</td>
                    <td>{formatPickingQty(component.qty_committed)}</td>
                    <td>{formatPickingQty(component.qty_residual)}</td>
                    <td>
                      <strong className="associated-product-supported-kits">
                        {getSupportedKitCount(component) ?? '—'}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="order-drawer-footer">
          <button type="button" className="btn btn-primary" onClick={closeDrawer}>Chiudi</button>
        </div>
      </aside>
    </>
  );
}
