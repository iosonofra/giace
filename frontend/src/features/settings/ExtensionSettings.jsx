import { useEffect } from 'react';

import { ExtensionBrowserSetup } from './ExtensionBrowserSetup';
import { ExtensionConnectionFields } from './ExtensionConnectionFields';
import { ExtensionStatusRail } from './ExtensionStatusRail';
import { SettingsLinearSection } from './ProgressiveSettings';

export function ExtensionSettings({ settings }) {
  const {
    Icons,
    extensionApiStatusLabel,
    extensionApiStatusTone,
    extensionApiToken,
    extensionBrowserGuide,
    extensionDistribution,
    extensionTestResult,
    extensionSettingsErrorSection,
    extensionTokenConfigured,
    extensionTokenDirty,
    handleCopyExtensionToken,
    handleCopyExtensionUrl,
    handleGenerateExtensionToken,
    handleSaveExtensionSettings,
    handleTestExtensionConnection,
    lastExtensionTestAt,
    savedExtensionApiToken,
    savingExtensionSettings,
    setExtensionApiToken,
    setExtensionBrowserGuide,
    setExtensionTestResult,
    setSettingsError,
    settingsError,
    setShowExtensionToken,
    showExtensionToken,
    testingExtensionConnection,
  } = settings;
  const webappUrl = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    if (!extensionSettingsErrorSection) return;
    const targetId = extensionSettingsErrorSection === 'save'
      ? 'extension-save-error'
      : 'extension-api-token';
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
  }, [extensionSettingsErrorSection]);

  const connectionSummary = extensionTokenDirty
    ? 'Modifiche da salvare'
    : extensionTokenConfigured ? 'Token configurato' : 'Token da configurare';

  const cancelChanges = () => {
    setExtensionApiToken(savedExtensionApiToken);
    setExtensionTestResult(null);
    setSettingsError(null);
  };

  return (
    <div className="glass-panel widget-card settings-workbench settings-extension-workbench">
      <div className="settings-card-header">
        <div>
          <h2>Integrazioni browser</h2>
          <p>Scegli il formato, collega la web app e verifica l’API seguendo un unico percorso.</p>
        </div>
      </div>

      <form onSubmit={handleSaveExtensionSettings} className="extension-guided-form">
        <ol className="settings-setup-flow settings-linear-sections">
          <li>
            <SettingsLinearSection id="integration-format" title="Scegli e installa il formato" description="Seleziona Chrome, Firefox o userscript e segui soltanto le istruzioni necessarie." status={`${extensionDistribution.label} · ${extensionDistribution.version}`}>
              <ExtensionBrowserSetup
                extensionBrowserGuide={extensionBrowserGuide}
                extensionDistribution={extensionDistribution}
                setExtensionBrowserGuide={setExtensionBrowserGuide}
                embedded
              />
            </SettingsLinearSection>
          </li>

          <li>
            <SettingsLinearSection id="integration-connection" title="Collega l’integrazione" description="Configura URL e token condiviso usati dall’integrazione installata." status={connectionSummary}>
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
                error={extensionSettingsErrorSection === 'connection' ? settingsError : ''}
                embedded
              />
            </SettingsLinearSection>
          </li>

          <li>
            <SettingsLinearSection id="integration-verification" title="Verifica il collegamento" description="Controlla che endpoint e token siano accettati dal backend." status={extensionApiStatusLabel}>
              <ExtensionStatusRail
                extensionApiStatusLabel={extensionApiStatusLabel}
                extensionApiStatusTone={extensionApiStatusTone}
                extensionApiToken={extensionApiToken}
                extensionTestResult={extensionTestResult}
                extensionTokenDirty={extensionTokenDirty}
                handleTestExtensionConnection={handleTestExtensionConnection}
                savingExtensionSettings={savingExtensionSettings}
                testingExtensionConnection={testingExtensionConnection}
                lastExtensionTestAt={lastExtensionTestAt}
                embedded
              />
            </SettingsLinearSection>
          </li>
        </ol>

        <footer className={`extension-save-footer ${extensionTokenDirty ? 'dirty' : ''} ${extensionSettingsErrorSection === 'save' && settingsError ? 'has-error' : ''}`}>
          {extensionSettingsErrorSection === 'save' && settingsError && <div id="extension-save-error" className="settings-save-error" role="alert" tabIndex="-1">{settingsError}</div>}
          <span>{extensionTokenDirty ? 'Modifiche non salvate in Integrazioni.' : extensionTokenConfigured ? 'Configurazione salvata e attiva.' : 'Completa il token per attivare l’integrazione.'}</span>
          <div className="settings-action-buttons">
            <button type="button" className="btn btn-secondary" onClick={cancelChanges} disabled={!extensionTokenDirty || savingExtensionSettings} title={!extensionTokenDirty ? 'Non ci sono modifiche da annullare.' : undefined}>Annulla modifiche</button>
            <button type="submit" className="btn btn-primary" disabled={savingExtensionSettings || !extensionTokenDirty || extensionApiToken.trim().length < 16} title={extensionApiToken.trim().length < 16 ? 'Il token deve contenere almeno 16 caratteri.' : !extensionTokenDirty ? 'Modifica il token prima di salvare.' : undefined} aria-busy={savingExtensionSettings} data-loading-indicator="true">
              {savingExtensionSettings ? 'Salvataggio...' : 'Salva integrazione'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
