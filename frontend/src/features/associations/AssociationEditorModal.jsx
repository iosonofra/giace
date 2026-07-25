import { useMemo } from 'react';

import { AssociationGuidedEditor } from './AssociationGuidedEditor';
import {
  buildWarehouseSkuIndex,
  deriveGuidedAssociation,
  guidedAssociationToRaw,
  rawAssociationToGuided,
} from './associationEditorModel';


export function AssociationEditorModal({
  activeAutocompleteIndex,
  associationModalMode,
  editingProductId,
  formatPickingQty,
  guidedComponents,
  handleSaveAssociation,
  isAssociationModalOpen,
  isNewAssociation,
  plusIcon,
  rawAssociationText,
  setActiveAutocompleteIndex,
  setAssociationModalMode,
  setEditingProductId,
  setGuidedComponents,
  setIsAssociationModalOpen,
  setRawAssociationText,
  stockData,
}) {
  const warehouseIndex = useMemo(
    () => buildWarehouseSkuIndex(stockData),
    [stockData],
  );
  const guidedSummary = useMemo(
    () => deriveGuidedAssociation(guidedComponents),
    [guidedComponents],
  );

  if (!isAssociationModalOpen) return null;

  const associationHasContent = associationModalMode === 'guided'
    ? guidedSummary.configuredComponents.length > 0
    : rawAssociationText.split(',').some(value => value.trim());

  const closeModal = () => setIsAssociationModalOpen(false);
  const switchMode = newMode => {
    if (newMode === associationModalMode) return;

    if (newMode === 'raw') {
      setRawAssociationText(guidedAssociationToRaw(guidedComponents));
    } else {
      setGuidedComponents(rawAssociationToGuided(rawAssociationText));
    }
    setAssociationModalMode(newMode);
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeModal} />
      <div
        className="custom-modal association-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="association-editor-title"
      >
        <div className="modal-header association-editor-header">
          <div>
            <span className="association-editor-eyebrow">
              Associazione prodotto-componenti
            </span>
            <h3 id="association-editor-title">
              {isNewAssociation ? 'Nuova associazione' : 'Modifica associazione'}
            </h3>
            {!isNewAssociation && (
              <span className="association-product-badge">
                Prodotto PrestaShop #{editingProductId}
              </span>
            )}
          </div>
          <button
            className="modal-close"
            onClick={closeModal}
            aria-label="Chiudi editor associazione"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSaveAssociation}>
          <div className="modal-body">
            {isNewAssociation && (
              <section className="association-product-identity">
                <label htmlFor="association-product-id">ID prodotto PrestaShop</label>
                <input
                  id="association-product-id"
                  type="number"
                  min="1"
                  step="1"
                  className="settings-input"
                  placeholder="Esempio: 614988"
                  value={editingProductId}
                  onChange={event => setEditingProductId(event.target.value)}
                  required
                />
                <small>
                  Inserisci l’ID numerico del prodotto da collegare alle SKU fisiche.
                </small>
              </section>
            )}

            <div
              className="modal-mode-selector association-mode-selector"
              role="tablist"
              aria-label="Modalità editor associazione"
            >
              <button
                type="button"
                className={`mode-tab ${associationModalMode === 'guided' ? 'active' : ''}`}
                onClick={() => switchMode('guided')}
                role="tab"
                aria-selected={associationModalMode === 'guided'}
              >
                <strong>Editor visuale</strong>
                <small>Configura e verifica ogni componente</small>
              </button>
              <button
                type="button"
                className={`mode-tab ${associationModalMode === 'raw' ? 'active' : ''}`}
                onClick={() => switchMode('raw')}
                role="tab"
                aria-selected={associationModalMode === 'raw'}
              >
                <strong>Inserimento rapido</strong>
                <small>Incolla un elenco separato da virgole</small>
              </button>
            </div>

            {associationModalMode === 'guided' ? (
              <AssociationGuidedEditor
                activeAutocompleteIndex={activeAutocompleteIndex}
                configuredComponents={guidedSummary.configuredComponents}
                duplicateSkuKeys={guidedSummary.duplicateSkuKeys}
                editingProductId={editingProductId}
                formatPickingQty={formatPickingQty}
                guidedComponents={guidedComponents}
                plusIcon={plusIcon}
                setActiveAutocompleteIndex={setActiveAutocompleteIndex}
                setGuidedComponents={setGuidedComponents}
                totalUnits={guidedSummary.totalUnits}
                warehouseSkuMap={warehouseIndex.skuMap}
                warehouseSkus={warehouseIndex.skus}
              />
            ) : (
              <div className="raw-mode-container">
                <div className="association-raw-intro">
                  <strong>Inserimento rapido da testo</strong>
                  <p>
                    Ripeti una SKU per indicare più unità. Esempio:{' '}
                    <code>SKU_A, SKU_B, SKU_A</code> equivale a 2 × SKU_A e 1 × SKU_B.
                  </p>
                </div>
                <textarea
                  className="settings-input association-raw-textarea"
                  placeholder="SKU_1, SKU_2, SKU_2, SKU_3"
                  value={rawAssociationText}
                  onChange={event => setRawAssociationText(event.target.value)}
                  aria-label="Elenco testuale SKU componenti"
                />
              </div>
            )}
          </div>

          <div className="modal-footer association-editor-footer">
            <div>
              <strong>
                {associationModalMode === 'guided'
                  ? `${guidedSummary.configuredComponents.length} componenti · ${guidedSummary.totalUnits} unità`
                  : 'Modalità inserimento rapido'}
              </strong>
              <span>
                Il salvataggio aggiornerà automaticamente il calcolo delle disponibilità.
              </span>
            </div>
            <div>
              <button type="button" className="btn btn-neutral" onClick={closeModal}>
                Annulla
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!associationHasContent || !editingProductId}
              >
                Salva associazione
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
