import { useEffect, useMemo, useRef, useState } from 'react';

import { apiFetch, readApiJson } from '../../api/client';
import { useExitPresence } from '../../components/ui/useExitPresence';
import { AssociationGuidedEditor } from './AssociationGuidedEditor';
import {
  buildWarehouseSkuIndex,
  deriveGuidedAssociation,
  guidedAssociationToRaw,
  rawAssociationToGuided,
} from './associationEditorModel';


function ProductPicker({ editingProductId, onMetadataChange, onProductIdChange }) {
  const [query, setQuery] = useState(String(editingProductId || ''));
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setProducts([]);
      return undefined;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      setLoading(true);
      apiFetch(`/api/product-catalog/search?query=${encodeURIComponent(normalized)}&limit=8`, { signal: controller.signal })
        .then(readApiJson)
        .then(data => {
          const nextProducts = data.products || [];
          setProducts(nextProducts);
          setActiveIndex(0);
          const exact = nextProducts.find(product => String(product.product_id) === normalized);
          if (exact) onMetadataChange(exact);
        })
        .catch(error => {
          if (error.name !== 'AbortError') setProducts([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 240);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [onMetadataChange, query]);

  const selectProduct = product => {
    onProductIdChange(String(product.product_id));
    onMetadataChange(product);
    setQuery(product.product_name || product.product_reference || String(product.product_id));
    setOpen(false);
  };

  return (
    <section className="association-product-identity">
      <label htmlFor="association-product-search">Prodotto PrestaShop</label>
      <div className="association-product-picker">
        <input
          id="association-product-search"
          type="search"
          className="settings-input"
          placeholder="Cerca nome, riferimento o Product ID"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && products.length > 0}
          aria-controls="association-product-options"
          aria-activedescendant={open && products[activeIndex] ? `association-product-${products[activeIndex].product_id}` : undefined}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={event => {
            const value = event.target.value;
            setQuery(value);
            setOpen(true);
            onMetadataChange(null);
            onProductIdChange(/^\d+$/.test(value.trim()) ? value.trim() : '');
          }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' && products.length) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex(current => (current + 1) % products.length);
            } else if (event.key === 'ArrowUp' && products.length) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex(current => (current - 1 + products.length) % products.length);
            } else if (event.key === 'Enter' && open && products[activeIndex]) {
              event.preventDefault();
              selectProduct(products[activeIndex]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {loading && <span className="association-picker-loading">Ricerca…</span>}
        {open && !loading && query.trim().length >= 2 && (
          <ul id="association-product-options" className="association-product-options" role="listbox">
            {products.length ? products.map((product, index) => (
              <li
                id={`association-product-${product.product_id}`}
                key={product.product_id}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? 'active' : ''}
                onMouseDown={event => {
                  event.preventDefault();
                  selectProduct(product);
                }}
              >
                <strong>{product.product_name || `Prodotto ${product.product_id}`}</strong>
                <span>ID {product.product_id}{product.product_reference ? ` · Rif. ${product.product_reference}` : ''}</span>
                {product.has_association && <small>Associazione già presente</small>}
              </li>
            )) : <li className="association-product-empty">Nessun prodotto sincronizzato trovato. Puoi comunque inserire un Product ID numerico.</li>}
          </ul>
        )}
      </div>
      <small>Seleziona un risultato oppure inserisci direttamente un Product ID numerico.</small>
    </section>
  );
}

function ProductIdentity({ metadata, productId }) {
  return (
    <div className="association-selected-product">
      <div>
        <strong>{metadata?.product_name || `Prodotto PrestaShop ${productId}`}</strong>
        <span>ID {productId}{metadata?.product_reference ? ` · Rif. ${metadata.product_reference}` : ''}</span>
      </div>
      {metadata?.has_association && <span className="association-existing-badge">Già associato</span>}
    </div>
  );
}

export function AssociationEditorModal({
  activeAutocompleteIndex,
  associationEditorDirty,
  associationEditorError,
  associationEditorLoading,
  associationEditorSaving,
  associationModalMode,
  confirmCloseAssociationEditor,
  editingProductId,
  editingProductMetadata,
  formatPickingQty,
  guidedComponents,
  handleSaveAssociation,
  isAssociationModalOpen,
  isNewAssociation,
  plusIcon,
  rawAssociationText,
  requestCloseAssociationEditor,
  setActiveAutocompleteIndex,
  setAssociationEditorError,
  setAssociationModalMode,
  setEditingProductId,
  setEditingProductMetadata,
  setGuidedComponents,
  setRawAssociationText,
  setShowAssociationDiscardConfirm,
  showAssociationDiscardConfirm,
  stockData,
}) {
  const warehouseIndex = useMemo(() => buildWarehouseSkuIndex(stockData), [stockData]);
  const guidedSummary = useMemo(() => deriveGuidedAssociation(guidedComponents), [guidedComponents]);
  const modalRef = useRef(null);
  const returnFocusRef = useRef(null);
  const presence = useExitPresence(isAssociationModalOpen);
  const unknownComponents = guidedSummary.configuredComponents.filter(component => (
    !warehouseIndex.skuMap.has(component.sku.trim().toUpperCase())
  ));
  const warningCount = (
    unknownComponents.length
    + guidedSummary.duplicateSkuKeys.size
    + (isNewAssociation && editingProductMetadata?.has_association ? 1 : 0)
  );

  useEffect(() => {
    if (!isAssociationModalOpen) return undefined;
    returnFocusRef.current = document.activeElement;
    const timeoutId = setTimeout(() => {
      modalRef.current?.querySelector('.modal-body input, .modal-body textarea, .modal-footer button')?.focus();
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      returnFocusRef.current?.focus?.();
    };
  }, [isAssociationModalOpen]);

  if (!presence.shouldRender) return null;

  const associationHasContent = associationModalMode === 'guided'
    ? guidedSummary.configuredComponents.length > 0
    : rawAssociationText.split(',').some(value => value.trim());
  const switchMode = newMode => {
    if (newMode === associationModalMode) return;
    if (newMode === 'raw') setRawAssociationText(guidedAssociationToRaw(guidedComponents));
    else setGuidedComponents(rawAssociationToGuided(rawAssociationText));
    setAssociationModalMode(newMode);
  };
  const handleDialogKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      requestCloseAssociationEditor();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(modalRef.current?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) || []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className={`modal-overlay ${presence.isExiting ? 'is-exiting' : ''}`} />
      <div ref={modalRef} className={`custom-modal association-editor-modal ${presence.isExiting ? 'is-exiting' : ''}`} role="dialog" aria-modal="true" aria-labelledby="association-editor-title" aria-describedby="association-editor-description" onKeyDown={handleDialogKeyDown} onTransitionEnd={presence.completeExit}>
        <div className="modal-header association-editor-header">
          <div>
            <h3 id="association-editor-title">{isNewAssociation ? 'Nuova associazione' : 'Modifica associazione'}</h3>
            <p id="association-editor-description">Collega un prodotto PrestaShop alle SKU fisiche che compongono il kit.</p>
          </div>
          <button type="button" className="modal-close" onClick={requestCloseAssociationEditor} aria-label="Chiudi editor associazione">×</button>
        </div>

        <form onSubmit={handleSaveAssociation} aria-busy={associationEditorSaving || associationEditorLoading}>
          <div className="modal-body">
            {associationEditorLoading ? <div className="association-editor-loading" role="status"><span className="loading-spinner" />Caricamento associazione…</div> : (
              <>
                {isNewAssociation ? (
                  <>
                    <ProductPicker editingProductId={editingProductId} onMetadataChange={setEditingProductMetadata} onProductIdChange={setEditingProductId} />
                    {editingProductId && <ProductIdentity metadata={editingProductMetadata} productId={editingProductId} />}
                  </>
                ) : <ProductIdentity metadata={editingProductMetadata} productId={editingProductId} />}

                <div className="modal-mode-selector association-mode-selector" role="group" aria-label="Modalità editor associazione">
                  <button type="button" className={`mode-tab ${associationModalMode === 'guided' ? 'active' : ''}`} onClick={() => switchMode('guided')} aria-pressed={associationModalMode === 'guided'}><strong>Editor visuale</strong><small>Configura e verifica ogni componente</small></button>
                  <button type="button" className={`mode-tab ${associationModalMode === 'raw' ? 'active' : ''}`} onClick={() => switchMode('raw')} aria-pressed={associationModalMode === 'raw'}><strong>Inserimento rapido</strong><small>Incolla un elenco separato da virgole</small></button>
                </div>

                {associationModalMode === 'guided' ? (
                  <AssociationGuidedEditor key="guided" activeAutocompleteIndex={activeAutocompleteIndex} configuredComponents={guidedSummary.configuredComponents} duplicateSkuKeys={guidedSummary.duplicateSkuKeys} editingProductId={editingProductId} formatPickingQty={formatPickingQty} guidedComponents={guidedComponents} plusIcon={plusIcon} setActiveAutocompleteIndex={setActiveAutocompleteIndex} setGuidedComponents={setGuidedComponents} totalUnits={guidedSummary.totalUnits} warehouseSkuMap={warehouseIndex.skuMap} warehouseSkus={warehouseIndex.skus} />
                ) : (
                  <div key="raw" className="raw-mode-container motion-state-reveal">
                    <div className="association-raw-intro"><strong>Inserimento rapido da testo</strong><p>Ripeti una SKU per indicare più unità. Esempio: <code>SKU_A, SKU_B, SKU_A</code> equivale a 2 × SKU_A e 1 × SKU_B.</p></div>
                    <textarea className="settings-input association-raw-textarea" placeholder="SKU_1, SKU_2, SKU_2, SKU_3" value={rawAssociationText} onChange={event => setRawAssociationText(event.target.value)} aria-label="Elenco testuale SKU componenti" />
                  </div>
                )}
              </>
            )}
            {associationEditorError && <div className="association-editor-error" role="alert"><strong>Operazione non completata</strong><span>{associationEditorError}</span><button type="button" onClick={() => setAssociationEditorError('')}>Chiudi avviso</button></div>}
          </div>

          {showAssociationDiscardConfirm && <div className="association-discard-confirm" role="alert"><div><strong>Scartare le modifiche?</strong><span>Le modifiche non salvate andranno perse.</span></div><div><button type="button" className="btn btn-neutral btn-sm" onClick={() => setShowAssociationDiscardConfirm(false)}>Continua modifica</button><button type="button" className="btn btn-danger btn-sm" onClick={confirmCloseAssociationEditor}>Scarta modifiche</button></div></div>}

          <div className="modal-footer association-editor-footer">
            <div><strong>{associationModalMode === 'guided' ? `${guidedSummary.configuredComponents.length} componenti · ${guidedSummary.totalUnits} unità` : 'Modalità inserimento rapido'}</strong><span>{warningCount > 0 ? `${warningCount} ${warningCount === 1 ? 'elemento da verificare' : 'elementi da verificare'} prima del salvataggio` : associationEditorDirty ? 'Modifiche non ancora salvate' : 'Nessuna modifica in sospeso'}</span></div>
            <div><button type="button" className="btn btn-neutral" onClick={requestCloseAssociationEditor} disabled={associationEditorSaving}>Annulla</button><button type="submit" className="btn btn-primary" disabled={!associationHasContent || !editingProductId || associationEditorSaving || associationEditorLoading}>{associationEditorSaving ? 'Salvataggio…' : 'Salva associazione'}</button></div>
          </div>
        </form>
      </div>
    </>
  );
}
