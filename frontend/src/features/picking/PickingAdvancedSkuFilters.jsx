function IncludedSkuRules({
  addSkuFilter,
  excludedSkus,
  removeSkuFilter,
  setSkuFilter,
  setSkuLimits,
  setSkuMaxQuery,
  setSkuQuery,
  skuFilter,
  skuLimits,
  skuMaxQuery,
  skuQuery,
  skuSuggestions,
  updateSkuLimit,
}) {
  const addCurrentRule = () => addSkuFilter(skuQuery, skuMaxQuery);

  return (
    <section className="picking-sku-filter-section">
      <div className="picking-sku-filter-heading">
        <div>
          <strong>SKU da includere</strong>
          <small>Considera soltanto gli ordini che contengono una delle SKU configurate.</small>
        </div>
        <span>
          {skuFilter.length > 0
            ? `${skuFilter.length} ${skuFilter.length === 1 ? 'regola' : 'regole'}`
            : 'Nessuna'}
        </span>
      </div>
      <div className="picking-sku-rule-builder picking-sku-filter-builder">
        <div>
          <label className="picking-field-label" htmlFor="auto-picking-sku-filter">
            SKU componente
          </label>
          <input
            id="auto-picking-sku-filter"
            className="settings-input"
            type="text"
            list="auto-picking-sku-options"
            placeholder="Esempio: ATXC35D"
            value={skuQuery}
            onChange={event => setSkuQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCurrentRule();
              }
            }}
            aria-describedby="auto-picking-filter-help"
          />
          <datalist id="auto-picking-sku-options">
            {skuSuggestions.map(sku => <option key={sku} value={sku} />)}
          </datalist>
        </div>
        <div>
          <label className="picking-field-label" htmlFor="auto-picking-sku-max">
            Massimo per ordine
          </label>
          <div className="picking-number-control compact">
            <input
              id="auto-picking-sku-max"
              className="settings-input"
              type="number"
              min="1"
              step="1"
              placeholder="Nessun limite"
              value={skuMaxQuery}
              onChange={event => setSkuMaxQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCurrentRule();
                }
              }}
            />
            <span>unità</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-neutral"
          onClick={addCurrentRule}
          disabled={!skuQuery.trim()}
        >
          Aggiungi regola
        </button>
      </div>
      <small id="auto-picking-filter-help" className="picking-field-help">
        Il massimo è opzionale. Se impostato, vengono esclusi gli ordini che richiedono
        una quantità superiore per quella SKU.
      </small>
      {skuFilter.length > 0 ? (
        <div className="picking-sku-rule-list" aria-label="Regole SKU configurate">
          {skuFilter.map(sku => (
            <div key={sku} className="picking-sku-rule">
              <strong>{sku}</strong>
              <label htmlFor={`auto-sku-limit-${sku}`}>Massimo per ordine</label>
              <div className="picking-sku-rule-limit">
                <input
                  id={`auto-sku-limit-${sku}`}
                  className="settings-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Nessun limite"
                  value={skuLimits[sku] ?? ''}
                  onChange={event => updateSkuLimit(sku, event.target.value)}
                />
                <span>unità</span>
              </div>
              <button
                type="button"
                className="picking-sku-rule-remove"
                onClick={() => removeSkuFilter(sku)}
                aria-label={`Rimuovi regola ${sku}`}
              >
                Rimuovi
              </button>
            </div>
          ))}
          <button
            type="button"
            className="picking-sku-filter-clear"
            onClick={() => {
              setSkuFilter([]);
              setSkuLimits({});
            }}
          >
            Rimuovi tutte le regole
          </button>
        </div>
      ) : (
        <div className="picking-filter-empty">
          {excludedSkus.length > 0
            ? 'Nessun filtro di inclusione: saranno valutati gli ordini che non contengono le SKU escluse.'
            : 'Nessun filtro: saranno valutati tutti gli ordini negli stati configurati.'}
        </div>
      )}
    </section>
  );
}

function ExcludedSkuRules({
  addExcludedSku,
  excludedSkuQuery,
  excludedSkuSuggestions,
  excludedSkus,
  removeExcludedSku,
  setExcludedSkuQuery,
  setExcludedSkus,
}) {
  const addCurrentExclusion = () => addExcludedSku(excludedSkuQuery);

  return (
    <section className="picking-sku-filter-section picking-excluded-sku-section">
      <div className="picking-sku-filter-heading">
        <div>
          <strong>SKU da escludere</strong>
          <small>Gli ordini che contengono una di queste SKU non entreranno nella simulazione.</small>
        </div>
        <span>
          {excludedSkus.length > 0
            ? `${excludedSkus.length} ${excludedSkus.length === 1 ? 'regola' : 'regole'}`
            : 'Nessuna'}
        </span>
      </div>
      <div className="picking-sku-exclusion-builder picking-sku-filter-builder">
        <div>
          <label className="picking-field-label" htmlFor="auto-picking-excluded-sku">
            SKU componente da escludere
          </label>
          <input
            id="auto-picking-excluded-sku"
            className="settings-input"
            type="text"
            list="auto-picking-excluded-sku-options"
            placeholder="Esempio: ATXC35D"
            value={excludedSkuQuery}
            onChange={event => setExcludedSkuQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCurrentExclusion();
              }
            }}
          />
          <datalist id="auto-picking-excluded-sku-options">
            {excludedSkuSuggestions.map(sku => <option key={sku} value={sku} />)}
          </datalist>
        </div>
        <button
          type="button"
          className="btn btn-neutral"
          onClick={addCurrentExclusion}
          disabled={!excludedSkuQuery.trim()}
        >
          Escludi SKU
        </button>
      </div>
      {excludedSkus.length > 0 ? (
        <div className="picking-excluded-sku-list" aria-label="SKU escluse dalla simulazione">
          {excludedSkus.map(sku => (
            <span key={sku} className="picking-excluded-sku-chip">
              <strong>{sku}</strong>
              <button
                type="button"
                onClick={() => removeExcludedSku(sku)}
                aria-label={`Rimuovi ${sku} dalle SKU escluse`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="picking-sku-filter-clear"
            onClick={() => setExcludedSkus([])}
          >
            Rimuovi tutte le esclusioni
          </button>
        </div>
      ) : (
        <div className="picking-filter-empty">
          Nessuna esclusione: gli ordini non saranno filtrati in base a SKU escluse.
        </div>
      )}
    </section>
  );
}

export function PickingAdvancedSkuFilters(props) {
  const ruleCount = props.skuFilter.length + props.excludedSkus.length;

  return (
    <details className="picking-advanced-filter">
      <summary>
        <span>
          <strong>Filtri SKU avanzati</strong>
          <small>Limita facoltativamente gli ordini candidati.</small>
        </span>
        <span className="picking-advanced-status">
          {ruleCount > 0 ? `${ruleCount} regole` : 'Nessuno'}
        </span>
      </summary>
      <div className="picking-advanced-content">
        <IncludedSkuRules {...props} />
        <ExcludedSkuRules {...props} />
      </div>
    </details>
  );
}
