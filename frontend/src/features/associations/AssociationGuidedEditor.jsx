export function AssociationGuidedEditor({
  activeAutocompleteIndex,
  configuredComponents,
  duplicateSkuKeys,
  editingProductId,
  formatPickingQty,
  guidedComponents,
  plusIcon,
  setActiveAutocompleteIndex,
  setGuidedComponents,
  totalUnits,
  warehouseSkuMap,
  warehouseSkus,
}) {
  const addRow = () => {
    setGuidedComponents(previous => [...previous, { sku: '', qty_required: 1 }]);
  };
  const removeRow = index => {
    setGuidedComponents(previous => {
      const next = previous.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next : [{ sku: '', qty_required: 1 }];
    });
  };
  const updateRow = (index, field, value) => {
    setGuidedComponents(previous => previous.map((component, currentIndex) => (
      currentIndex === index ? { ...component, [field]: value } : component
    )));
  };

  return (
    <div className="guided-mode-container">
      <div className="association-components-heading">
        <div>
          <span>Componenti di magazzino</span>
          <p>Il prodotto verrà esploso nelle SKU e quantità indicate.</p>
        </div>
        <strong>{configuredComponents.length} componenti</strong>
      </div>

      <div className="guided-rows-list">
        {guidedComponents.map((component, index) => {
          const query = component.sku || '';
          const suggestions = query.length >= 1
            ? warehouseSkus.filter(item => (
              item.sku.toLowerCase().includes(query.toLowerCase())
              || item.description.toLowerCase().includes(query.toLowerCase())
            )).slice(0, 8)
            : [];
          const skuKey = query.trim().toUpperCase();
          const skuMeta = warehouseSkuMap.get(skuKey);
          const isDuplicate = duplicateSkuKeys.has(skuKey);
          const rowTone = !query.trim()
            ? ''
            : isDuplicate
              ? 'duplicate'
              : skuMeta
                ? 'valid'
                : 'unknown';

          return (
            <div key={index} className={`guided-row association-component-row ${rowTone}`}>
              <span className="association-component-index">{index + 1}</span>
              <div className="association-component-main">
                <label htmlFor={`association-sku-${index}`}>SKU componente</label>
                <div className="association-sku-input-wrap">
                  <input
                    id={`association-sku-${index}`}
                    type="text"
                    className="settings-input sku-input"
                    placeholder="Cerca SKU o descrizione..."
                    value={component.sku}
                    onChange={event => {
                      updateRow(index, 'sku', event.target.value);
                      setActiveAutocompleteIndex(index);
                    }}
                    onFocus={() => setActiveAutocompleteIndex(index)}
                    onBlur={() => {
                      setTimeout(() => {
                        setActiveAutocompleteIndex(previous => (
                          previous === index ? null : previous
                        ));
                      }, 200);
                    }}
                    autoComplete="off"
                  />
                  {activeAutocompleteIndex === index && suggestions.length > 0 && (
                    <ul className="autocomplete-dropdown">
                      {suggestions.map(item => (
                        <li
                          key={item.sku}
                          onClick={() => {
                            updateRow(index, 'sku', item.sku);
                            setActiveAutocompleteIndex(null);
                          }}
                        >
                          <strong>{item.sku}</strong>
                          <span>
                            {item.description || 'Nessuna descrizione'} · Stock{' '}
                            {formatPickingQty(item.qty_total)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {query.trim() && (
                  <div className={`association-sku-feedback ${rowTone}`}>
                    {isDuplicate ? (
                      <>SKU già presente in un’altra riga: al salvataggio le quantità saranno sommate.</>
                    ) : skuMeta ? (
                      <>
                        <strong>{skuMeta.description || 'SKU presente in magazzino'}</strong>
                        <span>Stock totale {formatPickingQty(skuMeta.qty_total)}</span>
                      </>
                    ) : (
                      <>SKU non trovata nella giacenza corrente. Verifica il codice prima di salvare.</>
                    )}
                  </div>
                )}
              </div>

              <div className="association-quantity-control">
                <label htmlFor={`association-qty-${index}`}>Quantità</label>
                <div>
                  <button
                    type="button"
                    onClick={() => updateRow(
                      index,
                      'qty_required',
                      Math.max(1, Number(component.qty_required || 1) - 1),
                    )}
                    aria-label={`Riduci quantità della SKU ${component.sku || index + 1}`}
                  >
                    −
                  </button>
                  <input
                    id={`association-qty-${index}`}
                    type="number"
                    className="settings-input qty-input"
                    min="1"
                    step="1"
                    value={component.qty_required}
                    onChange={event => updateRow(
                      index,
                      'qty_required',
                      parseInt(event.target.value, 10) || 1,
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => updateRow(
                      index,
                      'qty_required',
                      Number(component.qty_required || 1) + 1,
                    )}
                    aria-label={`Aumenta quantità della SKU ${component.sku || index + 1}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="association-component-remove"
                onClick={() => removeRow(index)}
                aria-label={`Rimuovi componente ${component.sku || index + 1}`}
                title="Rimuovi componente"
              >
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18m-2 0-.867 13.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m-7 4v7m4-7v7" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="association-add-component" onClick={addRow}>
        {plusIcon} Aggiungi un altro componente
      </button>

      {configuredComponents.length > 0 && (
        <div className="association-preview">
          <div>
            <span>Anteprima associazione</span>
            <strong>
              Prodotto #{editingProductId || '—'} = {totalUnits} unità complessive
            </strong>
          </div>
          <div>
            {configuredComponents.map((component, index) => (
              <span key={`${component.sku}-${index}`}>
                {formatPickingQty(component.qty_required)} × {component.sku}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
