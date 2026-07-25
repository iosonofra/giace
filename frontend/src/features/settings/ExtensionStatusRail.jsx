export function ExtensionStatusRail({
  extensionApiStatusLabel,
  extensionApiStatusTone,
  extensionApiToken,
  extensionDistribution,
  extensionTestResult,
  extensionTokenDirty,
  handleTestExtensionConnection,
  savingExtensionSettings,
  testingExtensionConnection,
}) {
  const hasToken = Boolean(extensionApiToken.trim());

  return (
    <aside className="extension-status-rail" aria-labelledby="extension-status-title">
      <div className="extension-status-heading">
        <div>
          <h3 id="extension-status-title">Stato configurazione</h3>
          <p>Riepilogo della distribuzione e del collegamento API.</p>
        </div>
      </div>

      <div className="extension-status-list">
        <div className="extension-status-row complete">
          <span className="extension-status-check">✓</span>
          <div><small>Formato</small><strong>{extensionDistribution.label}</strong></div>
        </div>
        <div className={`extension-status-row ${hasToken ? 'complete' : 'pending'}`}>
          <span className="extension-status-check">{hasToken ? '✓' : '2'}</span>
          <div><small>Token</small><strong>{hasToken ? 'Presente' : 'Da generare'}</strong></div>
        </div>
        <div className={`extension-status-row ${extensionApiStatusTone}`}>
          <span className="extension-status-check">
            {extensionApiStatusTone === 'success' ? '✓' : '3'}
          </span>
          <div><small>API</small><strong>{extensionApiStatusLabel}</strong></div>
        </div>
      </div>

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
      <button
        type="button"
        className="btn btn-primary extension-verify-button"
        onClick={handleTestExtensionConnection}
        disabled={
          testingExtensionConnection
          || savingExtensionSettings
          || extensionTokenDirty
        }
      >
        {testingExtensionConnection ? 'Verifica in corso...' : 'Verifica collegamento'}
      </button>
    </aside>
  );
}
