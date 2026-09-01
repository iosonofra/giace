import { useEffect } from 'react';

import { SettingsLinearSection } from './ProgressiveSettings';

function VerificationIcon({ state }) {
  if (state === 'testing') return <span className="spinner" aria-hidden="true" />;
  if (state === 'success') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
  if (state === 'error') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3h.01M4.9 19h14.2a2 2 0 0 0 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.17 16A2 2 0 0 0 4.9 19Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}

export function ConnectionSettings({ settings }) {
  const {
    connectionSettingsDirty, connectionSettingsErrorField, connectionSettingsErrorSection,
    connectionTestStale, connectionVerifiedForCurrentValues, handleSaveConnectionSettings,
    handleTestConnection, Icons, lastConnectionTestAt, prestashopApiKey,
    prestashopApiKeyPresent, prestashopMockMode, prestashopRealReady,
    prestashopSyncInterval, prestashopUrl, prestashopUrlValid, resetConnectionSettings,
    savingConnectionSettings, setPrestashopApiKey, setPrestashopMockMode,
    setPrestashopSyncInterval, setPrestashopUrl, setShowApiKey, settingsError,
    showApiKey, testConnectionResult, testingConnection,
  } = settings;

  useEffect(() => {
    if (!connectionSettingsErrorSection) return;
    const fieldId = connectionSettingsErrorField || {
      credentials: 'prestashop-api-url',
      behavior: 'prestashop-sync-interval',
      save: 'prestashop-save-error',
    }[connectionSettingsErrorSection];
    requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  }, [connectionSettingsErrorField, connectionSettingsErrorSection]);

  const endpointSummary = prestashopMockMode
    ? 'Non richieste in simulazione'
    : prestashopUrlValid && prestashopApiKeyPresent ? 'Credenziali configurate' : 'Da completare';
  const intervalLabel = prestashopSyncInterval === '' ? 'da impostare' : `ogni ${prestashopSyncInterval} min`;
  const modeSummary = `${prestashopMockMode ? 'Dati simulati' : 'Webservice reale'} · ${intervalLabel}`;
  const verificationState = prestashopMockMode
    ? 'simulation'
    : testingConnection ? 'testing' : connectionTestStale ? 'stale' : testConnectionResult?.status || 'idle';
  const verificationContent = {
    simulation: ['Verifica non necessaria', 'La modalità simulazione non effettua chiamate al negozio.'],
    testing: ['Verifica in corso', 'Controllo endpoint, autenticazione e accesso agli stati ordine.'],
    stale: ['Verifica da ripetere', 'URL, chiave o modalità sono cambiati dopo l’ultimo controllo.'],
    success: ['Connessione verificata', testConnectionResult?.message || 'PrestaShop ha accettato le credenziali correnti.'],
    error: ['Connessione non riuscita', testConnectionResult?.message || 'Controlla i dati e riprova.'],
    idle: ['Connessione non verificata', 'Esegui il controllo prima della prima sincronizzazione.'],
  }[verificationState];
  const verificationSummary = {
    simulation: 'Dati simulati', testing: 'Verifica in corso', stale: 'Da verificare di nuovo',
    success: 'Verificata', error: 'Verifica fallita', idle: 'Non verificata',
  }[verificationState];
  const testFreshness = lastConnectionTestAt && !connectionTestStale
    ? `Ultimo controllo ${new Date(lastConnectionTestAt).toLocaleString('it-IT')}`
    : connectionTestStale
      ? 'Il controllo precedente non corrisponde ai valori correnti.'
      : 'Nessun controllo eseguito in questa sessione.';
  const testDisabledReason = !prestashopRealReady
    ? 'Completa URL e chiave API per abilitare la verifica.'
    : savingConnectionSettings ? 'Attendi il completamento del salvataggio.' : '';
  const footerCopy = prestashopMockMode
    ? 'Modalità simulazione: gli ordini reali non verranno sincronizzati.'
    : !prestashopRealReady
      ? 'Completa URL e chiave prima di salvare.'
      : connectionVerifiedForCurrentValues
        ? 'Connessione verificata per i valori correnti.'
        : connectionSettingsDirty
          ? 'Il salvataggio verificherà anche la connessione.'
          : 'Configurazione salvata; verifica consigliata prima della sincronizzazione.';
  const saveLabel = !prestashopMockMode && connectionSettingsDirty && !connectionVerifiedForCurrentValues
    ? 'Verifica e salva' : 'Salva configurazione';

  return (
    <div className="glass-panel widget-card settings-workbench prestashop-settings-workbench settings-progressive-workbench">
      <div className="settings-card-header"><div><h2>Configurazione connessione PrestaShop</h2><p>Collega il negozio, scegli la modalità operativa e verifica l’accesso agli ordini.</p></div></div>

      <form onSubmit={handleSaveConnectionSettings} className="prestashop-console-form settings-progressive-form">
        <div className="settings-linear-sections">
          <SettingsLinearSection id="connection-credentials" title="Credenziali Webservice" description="Inserisci l’indirizzo API e la chiave autorizzata a leggere ordini e stati." status={endpointSummary}>
            <section className="settings-progressive-panel-content connection-credentials-layout" aria-label="Credenziali Webservice">
              <div className="connection-credentials-fields">
                <div className="form-group">
                  <label className="settings-label" htmlFor="prestashop-api-url">URL API PrestaShop</label>
                  <input id="prestashop-api-url" type="url" inputMode="url" autoComplete="url" spellCheck="false" className="settings-input" placeholder="https://mio-sito.it/api/" value={prestashopUrl} onChange={event => setPrestashopUrl(event.target.value)} disabled={prestashopMockMode} aria-invalid={connectionSettingsErrorField === 'prestashop-api-url'} aria-describedby={connectionSettingsErrorField === 'prestashop-api-url' ? 'prestashop-credentials-error' : 'prestashop-url-help'} />
                  <small id="prestashop-url-help" className="settings-help">Deve terminare con <code>/api/</code>.</small>
                </div>
                {connectionSettingsErrorSection === 'credentials' && settingsError && <div id="prestashop-credentials-error" className="settings-inline-error" role="alert">{settingsError}</div>}
                <div className="form-group">
                  <label className="settings-label" htmlFor="prestashop-api-key">Chiave API Webservice</label>
                  <div className="settings-secret-field">
                    <input id="prestashop-api-key" type={showApiKey ? 'text' : 'password'} className="settings-input" placeholder="Inserisci la chiave API del Webservice" value={prestashopApiKey} onChange={event => setPrestashopApiKey(event.target.value)} disabled={prestashopMockMode} autoComplete="new-password" spellCheck="false" aria-invalid={connectionSettingsErrorField === 'prestashop-api-key'} aria-describedby={connectionSettingsErrorField === 'prestashop-api-key' ? 'prestashop-credentials-error' : 'prestashop-key-help'} />
                    <button type="button" className="settings-secret-toggle" onClick={() => setShowApiKey(!showApiKey)} disabled={prestashopMockMode} title={showApiKey ? 'Nascondi chiave' : 'Mostra chiave'} aria-label={showApiKey ? 'Nascondi chiave API' : 'Mostra chiave API'}><Icons.Eye /></button>
                  </div>
                  <small id="prestashop-key-help" className="settings-help">La chiave resta mascherata e viene usata soltanto dal backend.</small>
                </div>
              </div>
              <details className="prestashop-setup-guide">
                <summary><span>Come ottenere la chiave API</span><small>Guida rapida PrestaShop</small></summary>
                <ol>
                  <li><strong>Abilita il Webservice</strong><span>In PrestaShop apri Parametri avanzati → Webservice.</span></li>
                  <li><strong>Genera una chiave</strong><span>Crea una nuova chiave e mantienila riservata.</span></li>
                  <li><strong>Assegna i permessi</strong><span>Abilita almeno la lettura di ordini e stati ordine.</span></li>
                  <li><strong>Verifica in Giacenza</strong><span>Inserisci i dati e usa “Verifica connessione”.</span></li>
                </ol>
              </details>
            </section>
          </SettingsLinearSection>

          <SettingsLinearSection id="connection-behavior" title="Modalità e sincronizzazione" description="Scegli se utilizzare il negozio reale o dati dimostrativi e imposta la frequenza." status={modeSummary}>
            <section className="settings-progressive-panel-content connection-behavior-grid" aria-label="Modalità e sincronizzazione">
              <fieldset className="prestashop-mode-choices">
                <legend className="settings-label">Sorgente ordini</legend>
                <div>
                  <label className={`prestashop-mode-choice ${!prestashopMockMode ? 'active' : ''}`}><input type="radio" name="prestashop-mode" checked={!prestashopMockMode} onChange={() => setPrestashopMockMode(false)} /><span><strong>Webservice reale</strong><small>Sincronizza gli ordini effettivi del negozio.</small></span></label>
                  <label className={`prestashop-mode-choice ${prestashopMockMode ? 'active' : ''}`}><input type="radio" name="prestashop-mode" checked={prestashopMockMode} onChange={() => setPrestashopMockMode(true)} /><span><strong>Modalità simulazione</strong><small>Usa dati dimostrativi senza contattare PrestaShop.</small></span></label>
                </div>
              </fieldset>
              <div className="form-group prestashop-interval-group">
                <label className="settings-label" htmlFor="prestashop-sync-interval">Intervallo di aggiornamento</label>
                <div className="prestashop-number-field"><input id="prestashop-sync-interval" type="number" min="1" max="1440" inputMode="numeric" className="settings-input" value={prestashopSyncInterval} onChange={event => setPrestashopSyncInterval(event.target.value)} onBlur={() => { if (prestashopSyncInterval === '') setPrestashopSyncInterval(10); }} aria-invalid={connectionSettingsErrorField === 'prestashop-sync-interval'} aria-describedby={connectionSettingsErrorField === 'prestashop-sync-interval' ? 'prestashop-behavior-error' : 'prestashop-sync-interval-help'} /><span>minuti</span></div>
                <small id="prestashop-sync-interval-help" className="settings-help">Da 1 minuto a 24 ore. Valore consigliato: 30 minuti.</small>
              </div>
              {prestashopMockMode && <div className="prestashop-simulation-warning" role="status"><strong>Dati simulati attivi</strong><span>Gli ordini reali non vengono scaricati né aggiornati.</span></div>}
              {connectionSettingsErrorSection === 'behavior' && settingsError && <div id="prestashop-behavior-error" className="settings-inline-error" role="alert">{settingsError}</div>}
            </section>
          </SettingsLinearSection>

          <SettingsLinearSection id="connection-verification" title="Verifica connessione" description="Controlla endpoint, autenticazione e accesso agli stati ordine." status={verificationSummary}>
            <section className="settings-progressive-panel-content connection-verification-panel" aria-label="Verifica connessione">
              <div className={`connection-verification-card ${verificationState}`} aria-live="polite" aria-atomic="true">
                <span className="connection-verification-icon"><VerificationIcon state={verificationState} /></span>
                <div className="connection-verification-copy"><strong>{verificationContent[0]}</strong><p>{verificationContent[1]}</p>{!prestashopMockMode && <small>{testFreshness}</small>}</div>
                {!prestashopMockMode && <div className="connection-verification-action"><button type="button" className="btn btn-secondary prestashop-test-button" onClick={handleTestConnection} disabled={testingConnection || savingConnectionSettings || !prestashopRealReady} aria-busy={testingConnection}>{testingConnection ? 'Verifica in corso…' : connectionVerifiedForCurrentValues ? 'Verifica di nuovo' : 'Verifica connessione'}</button>{testDisabledReason && !testingConnection && <small>{testDisabledReason}</small>}</div>}
              </div>
              {!prestashopMockMode && <details className="connection-technical-details"><summary>Dettagli tecnici</summary><dl><div><dt>Modalità</dt><dd>Webservice reale</dd></div><div><dt>Endpoint</dt><dd>{prestashopUrlValid ? 'Valido · /api/' : 'Da completare'}</dd></div><div><dt>Chiave API</dt><dd>{prestashopApiKeyPresent ? 'Configurata' : 'Assente'}</dd></div></dl></details>}
            </section>
          </SettingsLinearSection>
        </div>

        <footer className={`prestashop-console-footer settings-progressive-footer ${connectionSettingsDirty ? 'dirty' : ''} ${prestashopMockMode ? 'simulation' : ''} ${connectionSettingsErrorSection === 'save' && settingsError ? 'has-error' : ''}`}>
          {connectionSettingsErrorSection === 'save' && settingsError && <div id="prestashop-save-error" className="settings-save-error" role="alert" tabIndex="-1">{settingsError}</div>}
          <span>{footerCopy}</span>
          <div className="settings-action-buttons"><button type="button" className="btn btn-secondary" onClick={resetConnectionSettings} disabled={!connectionSettingsDirty || savingConnectionSettings}>Annulla modifiche</button><button type="submit" className="btn btn-primary" disabled={savingConnectionSettings || testingConnection || !connectionSettingsDirty} aria-busy={savingConnectionSettings} data-loading-indicator="true">{savingConnectionSettings ? 'Salvataggio…' : saveLabel}</button></div>
        </footer>
      </form>
    </div>
  );
}
