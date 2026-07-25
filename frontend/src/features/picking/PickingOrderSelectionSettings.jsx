export function PickingOrderSelectionSettings({
  limit,
  setLimit,
  setStrategy,
  strategy,
}) {
  return (
    <section className="picking-config-section" aria-labelledby="picking-selection-title">
      <div className="picking-config-section-head">
        <div>
          <h3 id="picking-selection-title">Selezione ordini</h3>
          <p>Definisci la dimensione della proposta e il criterio con cui comporla.</p>
        </div>
      </div>

      <div className="picking-selection-layout">
        <div className="picking-setting-block picking-setting-limit">
          <label className="picking-field-label" htmlFor="auto-picking-limit">
            Ordini da proporre
          </label>
          <div className="picking-number-control">
            <input
              id="auto-picking-limit"
              className="settings-input"
              type="number"
              min="1"
              max="500"
              step="1"
              value={limit}
              onChange={event => setLimit(event.target.value)}
              aria-describedby="auto-picking-limit-help"
            />
            <span>ordini</span>
          </div>
          <small id="auto-picking-limit-help" className="picking-field-help">
            La simulazione può valutarne di più, ma ne propone al massimo questo numero.
          </small>
        </div>

        <div className="picking-setting-block">
          <span className="picking-field-label" id="picking-priority-title">Priorità</span>
          <div
            className="picking-option-grid picking-option-list"
            role="group"
            aria-labelledby="picking-priority-title"
          >
            <button
              type="button"
              aria-pressed={strategy === 'chronological'}
              className={`picking-option-card ${strategy === 'chronological' ? 'active' : ''}`}
              onClick={() => setStrategy('chronological')}
            >
              <span className="picking-option-indicator" aria-hidden="true" />
              <span>
                <strong>Ordini più vecchi</strong>
                <small>Segue la coda cronologica e scala progressivamente la giacenza.</small>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={strategy === 'maximize_orders'}
              className={`picking-option-card ${strategy === 'maximize_orders' ? 'active' : ''}`}
              onClick={() => setStrategy('maximize_orders')}
            >
              <span className="picking-option-indicator" aria-hidden="true" />
              <span>
                <strong>Massimizza ordini gestibili</strong>
                <small>Privilegia gli ordini con minore consumo; la data decide a parità.</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
