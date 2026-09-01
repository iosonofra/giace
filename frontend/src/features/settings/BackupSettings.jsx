import { useState } from 'react';

import { SettingsLinearSection } from './ProgressiveSettings';

function DownloadIcon() {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" /></svg>;
}

function RestoreIcon() {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" /></svg>;
}

export function BackupSettings({ settings }) {
  const [pendingConfiguration, setPendingConfiguration] = useState(null);
  const [configurationFileName, setConfigurationFileName] = useState('');
  const [configurationReadError, setConfigurationReadError] = useState('');
  const {
    backupLoading, exportingSettings, handleDownloadBackup, handleExportSettings,
    handleImportSettings, handleRestoreDatabase, importingSettings, restoreCountdown,
    restoreLoading, settingsTransferError,
  } = settings;
  const restoreSummary = restoreLoading
    ? restoreCountdown !== null ? `Riavvio in ${restoreCountdown}s` : 'Ripristino in corso'
    : 'Richiede conferma';

  const prepareConfigurationImport = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setConfigurationReadError('');
    setPendingConfiguration(null);
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || parsed.version !== 1 || typeof parsed.settings !== 'object') {
        throw new Error('Il file non è una configurazione Giac valida.');
      }
      setConfigurationFileName(file.name);
      setPendingConfiguration(parsed);
    } catch (error) {
      setConfigurationReadError(error.message || 'Impossibile leggere il file selezionato.');
    }
  };

  const confirmConfigurationImport = async () => {
    if (!pendingConfiguration) return;
    const imported = await handleImportSettings(pendingConfiguration);
    if (imported) {
      setPendingConfiguration(null);
      setConfigurationFileName('');
    }
  };

  return (
    <div className="glass-panel widget-card settings-workbench backup-settings-progressive settings-progressive-workbench">
      <div className="settings-card-header">
        <div>
          <h2>Backup e ripristino database</h2>
          <p>Esporta una copia completa dei dati oppure ripristina un archivio precedente.</p>
        </div>
      </div>

      {restoreCountdown !== null && (
        <div className="backup-restore-reveal backup-restore-progress" role="status" aria-live="polite">
          <span className="backup-restore-countdown">{restoreCountdown}</span>
          <div><strong className="backup-restore-success">Database ripristinato con successo</strong><span className="backup-restore-message">Il server si sta riavviando. La pagina si aggiornerà automaticamente.</span></div>
          <span className="spinner" />
        </div>
      )}

      <div className="settings-linear-sections backup-settings-actions">
        <SettingsLinearSection id="settings-transfer" title="Esporta o importa la configurazione" description="Trasferisce soltanto le opzioni della web app, senza database né credenziali sensibili." status="Formato .json">
          <div className="settings-transfer-panel">
            <div className="settings-transfer-action">
              <div><strong>Esporta configurazione</strong><p>Salva sorgenti, mappature, stati ordine e preferenze operative.</p></div>
              <button type="button" className="btn btn-secondary" onClick={handleExportSettings} disabled={exportingSettings || importingSettings} aria-busy={exportingSettings}>{exportingSettings ? 'Esportazione…' : 'Esporta .json'}</button>
            </div>
            <div className="settings-transfer-action">
              <div><strong>Importa configurazione</strong><p>Mostra una conferma prima di applicare il file e mantiene le credenziali già presenti.</p></div>
              <label className={`btn btn-secondary settings-transfer-file ${importingSettings ? 'is-disabled' : ''}`}>
                Scegli file .json
                <input type="file" accept="application/json,.json" onChange={prepareConfigurationImport} disabled={importingSettings} />
              </label>
            </div>
            {(configurationReadError || settingsTransferError) && <div className="settings-inline-error" role="alert">{configurationReadError || settingsTransferError}</div>}
            {pendingConfiguration && (
              <div className="settings-transfer-confirm" role="alertdialog" aria-labelledby="settings-transfer-confirm-title">
                <div><strong id="settings-transfer-confirm-title">Importare {configurationFileName}?</strong><p>Le opzioni presenti nel file sostituiranno quelle correnti. Chiavi API, token e secret non verranno modificati.</p></div>
                <div>
                  <button type="button" className="btn btn-secondary" onClick={() => setPendingConfiguration(null)} disabled={importingSettings}>Annulla</button>
                  <button type="button" className="btn btn-primary" onClick={confirmConfigurationImport} disabled={importingSettings} aria-busy={importingSettings}>{importingSettings ? 'Importazione…' : 'Importa configurazione'}</button>
                </div>
              </div>
            )}
          </div>
        </SettingsLinearSection>

        <SettingsLinearSection id="backup-export" title="Esporta il database" description="Crea un file SQLite completo e conservalo in una posizione sicura." status={backupLoading ? 'Preparazione in corso' : 'Formato .db'}>
          <div className="backup-operation-panel export" aria-label="Scarica backup">
            <span className="backup-operation-icon"><DownloadIcon /></span>
            <div className="backup-operation-copy"><strong>Backup completo</strong><p>Include ordini, giacenze, associazioni e impostazioni ed è pronto per un eventuale ripristino.</p></div>
            <button type="button" className="btn btn-primary backup-download-action" onClick={handleDownloadBackup} disabled={backupLoading || restoreLoading} aria-busy={backupLoading}>
              {backupLoading ? <><span className="spinner spinner-inline" />Preparazione...</> : 'Scarica backup (.db)'}
            </button>
          </div>
        </SettingsLinearSection>

        <SettingsLinearSection id="backup-restore" title="Ripristina un backup" description="Sostituisce il database corrente soltanto dopo una conferma esplicita." status={restoreSummary}>
          <div className={`backup-operation-panel restore ${restoreLoading ? 'active' : ''}`} aria-label="Ripristina database">
            <span className="backup-operation-icon"><RestoreIcon /></span>
            <div className="backup-operation-copy">
              <strong>Ripristino protetto</strong>
              <p>Carica un file <code>.db</code>. Prima della sostituzione viene creata automaticamente una copia di emergenza.</p>
              <span className="backup-danger-copy">Tutti i dati correnti verranno sovrascritti e il server sarà riavviato.</span>
            </div>
            <label className={`backup-restore-action ${restoreLoading || backupLoading ? 'is-disabled' : ''}`} aria-busy={restoreLoading}>
              {restoreLoading ? <><span className="spinner spinner-inline spinner-danger" />{restoreCountdown !== null ? `Riavvio in ${restoreCountdown}s...` : 'Ripristino in corso...'}</> : 'Scegli file .db'}
              <input type="file" accept=".db" className="backup-file-input" onChange={handleRestoreDatabase} disabled={restoreLoading || backupLoading} />
            </label>
          </div>
        </SettingsLinearSection>
      </div>
    </div>
  );
}
