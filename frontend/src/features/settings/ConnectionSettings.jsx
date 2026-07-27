export function ConnectionSettings({ settings }) {
  const {
    Icons,
    handleSaveConnectionSettings,
    handleTestConnection,
    prestashopApiKey,
    prestashopApiKeyPresent,
    prestashopMockMode,
    prestashopRealReady,
    prestashopStatusLabel,
    prestashopStatusTone,
    prestashopSyncInterval,
    prestashopUrl,
    prestashopUrlValid,
    savingConnectionSettings,
    setPrestashopApiKey,
    setPrestashopMockMode,
    setPrestashopSyncInterval,
    setPrestashopUrl,
    setShowApiKey,
    showApiKey,
    testConnectionResult,
    testingConnection,
  } = settings;

  return (
    <div className="glass-panel widget-card settings-workbench prestashop-settings-workbench">
                      <div className="settings-card-header">
                        <div>
                          <h2>Configurazione Connessione PrestaShop</h2>
                          <p>
                            Imposta endpoint Webservice, chiave API e frequenza di aggiornamento ordini.
                          </p>
                        </div>
                        <span className={`settings-status-pill ${prestashopStatusTone}`}>
                          <span className="settings-status-dot" />
                          {prestashopStatusLabel}
                        </span>
                      </div>

                      <form onSubmit={handleSaveConnectionSettings} className="prestashop-console-form">
                        <div className="prestashop-console-layout">
                          <div className="prestashop-console-main">
                            <section className="prestashop-form-section">
                              <div className="prestashop-section-heading">
                                <h3>Credenziali Webservice</h3>
                                <p>Indica l’endpoint API e la chiave autorizzata a leggere gli ordini.</p>
                              </div>

                              <div className="form-group">
                                <label className="settings-label">
                                  URL API PrestaShop
                                </label>
                                <input 
                                  type="text" 
                                  className="settings-input" 
                                  placeholder="https://mio-sito.it/api/" 
                                  value={prestashopUrl} 
                                  onChange={(e) => setPrestashopUrl(e.target.value)}
                                  disabled={prestashopMockMode}
                                />
                                <small className="settings-help">
                                  Formato richiesto: <code>https://www.tuonegozio.it/api/</code>
                                </small>
                              </div>

                              <div className="form-group">
                                <label className="settings-label">
                                  Chiave API Webservice
                                </label>
                                <div className="settings-secret-field">
                                  <input 
                                    type={showApiKey ? "text" : "password"} 
                                    className="settings-input" 
                                    placeholder="Inserisci la chiave API del webservice" 
                                    value={prestashopApiKey} 
                                    onChange={(e) => setPrestashopApiKey(e.target.value)}
                                    disabled={prestashopMockMode}
                                  />
                                  <button 
                                    type="button" 
                                    className="settings-secret-toggle"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    disabled={prestashopMockMode}
                                    title={showApiKey ? "Nascondi chiave" : "Mostra chiave"}
                                    aria-label={showApiKey ? "Nascondi chiave API" : "Mostra chiave API"}
                                  >
                                    <Icons.Eye />
                                  </button>
                                </div>
                              </div>
                            </section>

                            <section className="prestashop-form-section prestashop-sync-section">
                              <div className="prestashop-section-heading">
                                <h3>Sincronizzazione ordini</h3>
                                <p>Definisci ogni quanto il backend deve controllare la presenza di nuovi ordini.</p>
                              </div>
                              <div className="form-group prestashop-interval-group">
                                <label className="settings-label">
                                  Intervallo di aggiornamento
                                </label>
                                <div className="prestashop-number-field">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    className="settings-input" 
                                    placeholder="10" 
                                    value={prestashopSyncInterval} 
                                    onChange={(e) => setPrestashopSyncInterval(parseInt(e.target.value) || 10)}
                                  />
                                  <span>minuti</span>
                                </div>
                              </div>
                            </section>
                          </div>

                          <aside className="prestashop-console-rail">
                            <div className="prestashop-rail-heading">
                              <h3>Stato connessione</h3>
                              <p>Riepilogo della configurazione Webservice attualmente impostata.</p>
                            </div>

                            <label className={`settings-switch-card prestashop-mode-switch ${prestashopMockMode ? 'active' : ''}`}>
                              <div>
                                <strong>Modalità simulazione</strong>
                                <span>
                                  {prestashopMockMode
                                    ? 'Attiva: usa dati di test, nessuna chiamata reale.'
                                    : 'Disattiva: usa il Webservice PrestaShop reale.'}
                                </span>
                              </div>
                              <span className="settings-switch">
                                <input 
                                  type="checkbox" 
                                  checked={prestashopMockMode} 
                                  onChange={(e) => setPrestashopMockMode(e.target.checked)} 
                                />
                                <span />
                              </span>
                            </label>

                            <dl className="prestashop-status-list">
                              <div>
                                <dt>Modalità</dt>
                                <dd>{prestashopMockMode ? 'Simulazione' : 'Webservice reale'}</dd>
                              </div>
                              <div>
                                <dt>Endpoint</dt>
                                <dd>{prestashopMockMode ? 'Dati di test' : prestashopUrlValid ? 'Valido · /api/' : 'Da completare'}</dd>
                              </div>
                              <div>
                                <dt>Chiave API</dt>
                                <dd>{prestashopMockMode ? 'Non richiesta' : prestashopApiKeyPresent ? 'Configurata' : 'Assente'}</dd>
                              </div>
                              <div>
                                <dt>Stato test</dt>
                                <dd>
                                  {prestashopMockMode
                                    ? 'Non necessario'
                                    : testConnectionResult
                                      ? testConnectionResult.message
                                      : 'Connessione non verificata'}
                                </dd>
                              </div>
                            </dl>

                            {!prestashopMockMode && (
                              <button
                                type="button"
                                className="btn btn-secondary prestashop-test-button"
                                onClick={handleTestConnection}
                                disabled={testingConnection || savingConnectionSettings || !prestashopRealReady}
                                aria-busy={testingConnection}
                              >
                                {testingConnection ? (
                                  <>
                                    <span className="spinner spinner-inline" />
                                    Verifica...
                                  </>
                                ) : (
                                  "Test Connessione"
                                )}
                              </button>
                            )}
                          </aside>
                        </div>

                        <div className="prestashop-console-footer">
                          <span>
                            {prestashopMockMode
                              ? 'Salva per mantenere la modalità simulazione.'
                              : prestashopRealReady
                                ? 'Configurazione pronta per verifica e salvataggio.'
                                : 'Completa URL e chiave prima del test.'}
                          </span>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={savingConnectionSettings || testingConnection}
                            aria-busy={savingConnectionSettings}
                            data-loading-indicator="true"
                          >
                            {savingConnectionSettings ? "Salvataggio..." : "Salva Configurazione"}
                          </button>
                        </div>
                      </form>
                    </div>
  );
}
