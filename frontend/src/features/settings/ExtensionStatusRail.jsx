export function ExtensionStatusRail({
  extensionApiStatusLabel,
  extensionApiStatusTone,
  extensionApiToken,
  extensionTestResult,
  extensionTokenDirty,
  handleTestExtensionConnection,
  savingExtensionSettings,
  testingExtensionConnection,
  lastExtensionTestAt = '',
  embedded = false,
}) {
  const hasToken = Boolean(extensionApiToken.trim());

  return (
    <aside className={`extension-status-rail ${embedded ? 'embedded' : ''}`} aria-label="Verifica integrazione">
      {!embedded && (
        <div className="extension-status-heading">
          <div>
            <h3>Stato configurazione</h3>
            <p>Riepilogo del collegamento API.</p>
          </div>
        </div>
      )}

      <div className={`extension-security-panel ${hasToken ? 'protected' : 'open'}`}>
        <span className="extension-security-icon" aria-hidden="true">{hasToken ? '✓' : '!'}</span>
        <div>
          <strong>{hasToken ? 'Accesso protetto' : 'Accesso non protetto'}</strong>
          <p>
            {hasToken
              ? 'Usa lo stesso token nell’estensione o nel menu dello userscript.'
              : 'Genera un token prima di collegare il browser.'}
          </p>
        </div>
      </div>

      <div className={`extension-verification-status ${extensionApiStatusTone}`}>
        <span className="settings-status-dot" />
        <div>
          <strong>{extensionApiStatusLabel}</strong>
          <span>
            {extensionTokenDirty
              ? 'Salva le modifiche prima della verifica.'
              : extensionTestResult?.message
                || 'Il collegamento non è ancora stato controllato.'}
          </span>
        </div>
      </div>
      <div className="extension-verification-action">
        <span>
          {lastExtensionTestAt && !extensionTokenDirty
            ? `Ultimo controllo: ${new Date(lastExtensionTestAt).toLocaleString('it-IT')}`
            : extensionTokenDirty
            ? 'Salva il token prima di eseguire il controllo.'
            : 'La verifica non modifica le impostazioni salvate.'}
        </span>
        <button
          type="button"
          className="btn btn-primary extension-verify-button"
          onClick={handleTestExtensionConnection}
          disabled={
            testingExtensionConnection
            || savingExtensionSettings
            || extensionTokenDirty
          }
          title={extensionTokenDirty ? 'Salva il token prima di verificare il collegamento.' : undefined}
        >
          {testingExtensionConnection ? 'Verifica in corso...' : 'Verifica collegamento'}
        </button>
      </div>
    </aside>
  );
}
