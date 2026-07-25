export function PickingSimulationBehavior({
  minResidual,
  setMinResidual,
  setStrict,
  strategy,
  strict,
}) {
  return (
    <section className="picking-config-section" aria-labelledby="picking-behavior-title">
      <div className="picking-config-section-head">
        <div>
          <h3 id="picking-behavior-title">Comportamento della simulazione</h3>
          <p>Stabilisci come trattare i blocchi e quanta giacenza preservare.</p>
        </div>
      </div>

      <div className={`picking-behavior-layout ${strategy === 'chronological' ? '' : 'single'}`}>
        {strategy === 'chronological' && (
          <div className="picking-setting-block" aria-labelledby="picking-blocked-orders-title">
            <span className="picking-field-label" id="picking-blocked-orders-title">
              Se un ordine è bloccato
            </span>
            <div
              className="picking-option-grid picking-option-list"
              role="group"
              aria-labelledby="picking-blocked-orders-title"
            >
              <button
                type="button"
                aria-pressed={!strict}
                className={`picking-option-card ${!strict ? 'active' : ''}`}
                onClick={() => setStrict(false)}
              >
                <span className="picking-option-indicator" aria-hidden="true" />
                <span>
                  <strong>Continua con i successivi</strong>
                  <small>Registra il blocco senza consumare stock e prova il prossimo ordine.</small>
                </span>
              </button>
              <button
                type="button"
                aria-pressed={strict}
                className={`picking-option-card ${strict ? 'active' : ''}`}
                onClick={() => setStrict(true)}
              >
                <span className="picking-option-indicator" aria-hidden="true" />
                <span>
                  <strong>Ferma la coda</strong>
                  <small>Preserva rigidamente la precedenza cronologica.</small>
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="picking-setting-block" aria-labelledby="picking-stock-protection-title">
          <label
            className="picking-field-label"
            id="picking-stock-protection-title"
            htmlFor="auto-picking-min-residual"
          >
            Scorta minima per SKU
          </label>
          <div className="picking-number-control">
            <input
              id="auto-picking-min-residual"
              className="settings-input"
              type="number"
              min="0"
              step="1"
              value={minResidual}
              onChange={event => setMinResidual(event.target.value)}
              aria-describedby="auto-picking-residual-help"
            />
            <span>unità</span>
          </div>
          <small id="auto-picking-residual-help" className="picking-field-help">
            Con 0 non viene protetta alcuna scorta. La soglia viene applicata a ogni SKU.
          </small>
        </div>
      </div>
    </section>
  );
}
