export function StockCalculationPolicySettings({ settings }) {
  const {
    excludeReturnLots,
    excludedLotKeywords,
    setExcludeReturnLots,
    setExcludedLotKeywords,
  } = settings;

  return (
    <section className="stock-config-section" aria-labelledby="stock-policy-title">
      <div className="stock-section-heading">
        <h3 id="stock-policy-title">Giacenze escluse dal calcolo</h3>
        <p>
          Mantiene visibili i lotti di reso, senza usarne le quantità per
          disponibilità, prelievi e Conteggio Smart.
        </p>
      </div>

      <div className={`stock-policy-card ${excludeReturnLots ? 'active' : ''}`}>
        <label className="stock-policy-toggle" htmlFor="exclude-return-lots">
          <span>
            <strong>Escludi i lotti di reso</strong>
            <small>La giacenza importata non viene modificata.</small>
          </span>
          <input
            id="exclude-return-lots"
            type="checkbox"
            checked={excludeReturnLots}
            onChange={event => setExcludeReturnLots(event.target.checked)}
          />
          <span className="stock-policy-switch" aria-hidden="true" />
        </label>

        <div className="form-group stock-policy-keywords">
          <label className="settings-label" htmlFor="excluded-lot-keywords">
            Parole riconosciute nel lotto
          </label>
          <input
            id="excluded-lot-keywords"
            type="text"
            className="settings-input"
            value={excludedLotKeywords}
            onChange={event => setExcludedLotKeywords(event.target.value)}
            placeholder="RESO, RESI"
            disabled={!excludeReturnLots}
          />
          <small className="settings-help">
            Separate da virgola e riconosciute come parole intere, senza
            distinzione tra maiuscole e minuscole.
          </small>
        </div>
      </div>
    </section>
  );
}
