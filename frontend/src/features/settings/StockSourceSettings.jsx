export function StockSourceSettings({ settings, embedded = false }) {
  const {
    googleSheetName,
    googleSheetSyncInterval,
    googleSheetUrl,
    setGoogleSheetName,
    setGoogleSheetSyncInterval,
    setGoogleSheetUrl,
    setStockSource,
    stockSettingsErrorField,
    stockSettingsErrorSection,
    stockSource,
  } = settings;
  const sourceError = stockSettingsErrorSection === 'source';

  const getErrorProps = fieldId => ({
    'aria-invalid': sourceError && stockSettingsErrorField === fieldId,
    'aria-describedby': sourceError && stockSettingsErrorField === fieldId
      ? 'stock-source-error'
      : undefined,
  });

  return (
    <section
      className="stock-config-section"
      aria-labelledby={embedded ? undefined : 'stock-source-title'}
      aria-label={embedded ? 'Configurazione sorgente giacenze' : undefined}
    >
      {!embedded && (
        <div className="stock-section-heading">
          <h3 id="stock-source-title">Sorgente giacenze</h3>
          <p>Seleziona il sistema utilizzato per aggiornare le quantità fisiche.</p>
        </div>
      )}
      <div className="stock-source-switch" role="radiogroup" aria-label="Sorgente giacenze">
        {[
          ['local_upload', 'Caricamento manuale Excel', 'Carica il file giacenza.xlsx dal computer.'],
          ['google_sheets', 'Sincronizzazione Google Sheets', 'Download e ricalcolo automatico in background.'],
        ].map(([value, label, description]) => (
          <label key={value} className={`stock-source-option ${stockSource === value ? 'active' : ''}`}>
            <input
              type="radio"
              name="stockSource"
              value={value}
              checked={stockSource === value}
              onChange={() => setStockSource(value)}
            />
            <span className="stock-source-radio" aria-hidden="true" />
            <span><strong>{label}</strong><small>{description}</small></span>
          </label>
        ))}
      </div>

      {stockSource === 'google_sheets' && (
        <div className="stock-source-fields">
          <div className="form-group stock-field-wide">
            <label className="settings-label" htmlFor="google-sheet-url">URL Google Sheet</label>
            <input
              id="google-sheet-url"
              type="text"
              className="settings-input"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={googleSheetUrl}
              onChange={event => setGoogleSheetUrl(event.target.value)}
              required
              {...getErrorProps('google-sheet-url')}
            />
            <small className="settings-help">
              Il foglio deve essere condiviso con “Chiunque abbia il link può visualizzare”.
            </small>
          </div>
          <div className="form-group">
            <label className="settings-label" htmlFor="google-sheet-name">Nome foglio (tab)</label>
            <input
              id="google-sheet-name"
              type="text"
              className="settings-input"
              placeholder="ROSATE"
              value={googleSheetName}
              onChange={event => setGoogleSheetName(event.target.value)}
              required
              {...getErrorProps('google-sheet-name')}
            />
          </div>
          <div className="form-group">
            <label className="settings-label" htmlFor="google-sheet-interval">
              Intervallo verifica (minuti)
            </label>
            <input
              id="google-sheet-interval"
              type="number"
              className="settings-input"
              min="1"
              max="1440"
              inputMode="numeric"
              value={googleSheetSyncInterval}
              onChange={event => setGoogleSheetSyncInterval(event.target.value)}
              onBlur={() => { if (googleSheetSyncInterval === '') setGoogleSheetSyncInterval(10); }}
              required
              {...getErrorProps('google-sheet-interval')}
            />
          </div>
        </div>
      )}
    </section>
  );
}
