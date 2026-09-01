export function ExtensionConnectionFields({
  Icons,
  extensionApiToken,
  handleCopyExtensionToken,
  handleCopyExtensionUrl,
  handleGenerateExtensionToken,
  setExtensionApiToken,
  setExtensionTestResult,
  setShowExtensionToken,
  showExtensionToken,
  webappUrl,
  error = '',
  embedded = false,
}) {
  return (
    <section className={`extension-workbench-section ${embedded ? 'embedded' : ''}`} aria-label="Collegamento alla web app">
      {!embedded && (
        <div className="extension-section-heading">
          <div>
            <h3>Configura il collegamento</h3>
            <p>Usa URL webapp e token per autorizzare la distribuzione installata.</p>
          </div>
        </div>
      )}

      <div className="settings-form-stack">
        <div className="form-group">
          <span id="extension-webapp-url-label" className="settings-label">URL webapp Giac</span>
          <div className="extension-copy-field" aria-labelledby="extension-webapp-url-label">
            <code>{webappUrl}</code>
            <button type="button" className="btn btn-secondary" onClick={handleCopyExtensionUrl}>
              Copia URL
            </button>
          </div>
          <small className="settings-help">
            L’indirizzo viene incluso automaticamente nello userscript; per le estensioni
            va copiato nelle opzioni.
          </small>
        </div>

        <div className="form-group">
          <label className="settings-label" htmlFor="extension-api-token">Token estensione</label>
          <div className="settings-secret-field">
            <input
              id="extension-api-token"
              type={showExtensionToken ? 'text' : 'password'}
              className="settings-input extension-token-input"
              placeholder="Genera un token sicuro oppure inseriscine uno esistente"
              value={extensionApiToken}
              onChange={event => {
                setExtensionApiToken(event.target.value);
                setExtensionTestResult(null);
              }}
              autoComplete="off"
              spellCheck="false"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'extension-token-error' : 'extension-token-help'}
            />
            <button
              type="button"
              className="settings-secret-toggle"
              onClick={() => setShowExtensionToken(!showExtensionToken)}
              title={showExtensionToken ? 'Nascondi token' : 'Mostra token'}
              aria-label={showExtensionToken
                ? 'Nascondi token estensione'
                : 'Mostra token estensione'}
            >
              <Icons.Eye />
            </button>
          </div>
          <small id="extension-token-help" className="settings-help">
            Minimo 16 caratteri. Il generatore crea un token casuale da 64 caratteri.
          </small>
          {error && <div id="extension-token-error" className="settings-inline-error" role="alert">{error}</div>}
        </div>

        <div className="extension-token-actions">
          <button type="button" className="btn btn-secondary" onClick={handleGenerateExtensionToken}>
            Genera token sicuro
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyExtensionToken}
            disabled={!extensionApiToken.trim()}
          >
            Copia token
          </button>
        </div>
      </div>
    </section>
  );
}
