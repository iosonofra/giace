import { ExtensionBrowserSetup } from './ExtensionBrowserSetup';
import { ExtensionConnectionFields } from './ExtensionConnectionFields';
import { ExtensionStatusRail } from './ExtensionStatusRail';


export function ExtensionSettings({ settings }) {
  const {
    Icons,
    extensionApiStatusLabel,
    extensionApiStatusTone,
    extensionApiToken,
    extensionBrowserGuide,
    extensionDistribution,
    extensionTestResult,
    extensionTokenConfigured,
    extensionTokenDirty,
    handleCopyExtensionToken,
    handleCopyExtensionUrl,
    handleGenerateExtensionToken,
    handleSaveExtensionSettings,
    handleTestExtensionConnection,
    savedExtensionApiToken,
    savingExtensionSettings,
    setExtensionApiToken,
    setExtensionBrowserGuide,
    setExtensionTestResult,
    setSettingsError,
    setShowExtensionToken,
    showExtensionToken,
    testingExtensionConnection,
  } = settings;
  const hasToken = Boolean(extensionApiToken.trim());
  const webappUrl = typeof window === 'undefined' ? '' : window.location.origin;

  const cancelChanges = () => {
    setExtensionApiToken(savedExtensionApiToken);
    setExtensionTestResult(null);
    setSettingsError(null);
  };

  return (
    <div className="glass-panel widget-card settings-workbench settings-extension-workbench">
      <div className="settings-card-header">
        <div>
          <h2>Integrazioni browser · Feedback ordini</h2>
          <p>
            Scegli estensione o userscript, configura il collegamento e verifica che
            l’API risponda correttamente.
          </p>
        </div>
        <span className={`settings-status-pill extension-overall-status ${extensionApiStatusTone === 'success' ? 'success' : 'warning'}`}>
          <span className="settings-status-dot" />
          {extensionApiStatusTone === 'success'
            ? 'Configurazione operativa'
            : 'Configurazione incompleta'}
        </span>
      </div>

      <form onSubmit={handleSaveExtensionSettings} className="extension-guided-form">
        <ol className="extension-progress" aria-label="Avanzamento configurazione">
          <li className="complete">
            <span>1</span>
            <div><strong>Formato</strong><small>{extensionDistribution.label}</small></div>
          </li>
          <li className={hasToken ? 'complete' : 'current'}>
            <span>2</span>
            <div><strong>Collegamento</strong><small>{hasToken ? 'Token presente' : 'Da configurare'}</small></div>
          </li>
          <li className={extensionApiStatusTone === 'success' ? 'complete' : 'current'}>
            <span>3</span>
            <div><strong>Verifica</strong><small>{extensionApiStatusLabel}</small></div>
          </li>
        </ol>

        <div className="extension-workbench-layout">
          <div className="extension-workbench-main">
            <ExtensionBrowserSetup
              extensionBrowserGuide={extensionBrowserGuide}
              extensionDistribution={extensionDistribution}
              setExtensionBrowserGuide={setExtensionBrowserGuide}
            />
            <ExtensionConnectionFields
              Icons={Icons}
              extensionApiToken={extensionApiToken}
              handleCopyExtensionToken={handleCopyExtensionToken}
              handleCopyExtensionUrl={handleCopyExtensionUrl}
              handleGenerateExtensionToken={handleGenerateExtensionToken}
              setExtensionApiToken={setExtensionApiToken}
              setExtensionTestResult={setExtensionTestResult}
              setShowExtensionToken={setShowExtensionToken}
              showExtensionToken={showExtensionToken}
              webappUrl={webappUrl}
            />
          </div>

          <ExtensionStatusRail
            extensionApiStatusLabel={extensionApiStatusLabel}
            extensionApiStatusTone={extensionApiStatusTone}
            extensionApiToken={extensionApiToken}
            extensionDistribution={extensionDistribution}
            extensionTestResult={extensionTestResult}
            extensionTokenDirty={extensionTokenDirty}
            handleTestExtensionConnection={handleTestExtensionConnection}
            savingExtensionSettings={savingExtensionSettings}
            testingExtensionConnection={testingExtensionConnection}
          />
        </div>

        <footer className={`extension-save-footer ${extensionTokenDirty ? 'dirty' : ''}`}>
          <span>
            {extensionTokenDirty
              ? 'Sono presenti modifiche non salvate.'
              : extensionTokenConfigured
                ? 'Configurazione salvata e attiva immediatamente.'
                : 'Nessuna modifica da salvare.'}
          </span>
          <div className="settings-action-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelChanges}
              disabled={!extensionTokenDirty || savingExtensionSettings}
            >
              Annulla modifiche
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                savingExtensionSettings
                || !extensionTokenDirty
                || extensionApiToken.trim().length < 16
              }
            >
              {savingExtensionSettings ? 'Salvataggio...' : 'Salva configurazione'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
