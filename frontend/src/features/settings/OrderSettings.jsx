import { useEffect } from 'react';

import { SettingsLinearSection } from './ProgressiveSettings';

export function OrderSettings({ settings }) {
  const {
    filteredOrderStates, getRelativeTimeString, handleDeselectAllStates,
    handleSaveOrderStates, handleSelectAllStates, handleSelectRecommendedStates,
    handleSyncOrders, handleToggleState, Icons, loading, orderSettingsError,
    orderStates, orderStatesDirty, orderStatesError, orderStatesReady,
    recommendedOrderStateIds, resetOrderStates, savingStateSettings, searchStateQuery, selectedStates,
    retryLoadOrderStates, setSearchStateQuery, setShowOnlySelectedStates, showOnlySelectedStates, status,
    syncingOrders, syncProgressText,
    gaerSelectedStates, gaerSettingsError, gaerStatesDirty,
    handleSaveGaerStates, handleToggleGaerState, resetGaerStates, savingGaerStates,
    handleSelectAllGaerStates, handleDeselectAllGaerStates,
    filteredGaerOrderStates, gaerSearchStateQuery, setGaerSearchStateQuery,
    setShowOnlySelectedGaerStates, showOnlySelectedGaerStates,
  } = settings;
  const lastSync = status?.last_orders_sync
    ? getRelativeTimeString(status.last_orders_sync)
    : 'Mai sincronizzati';
  const cachedOrders = status?.prestashop_orders_count ?? 0;
  const statesSummary = !orderStatesReady
    ? 'Caricamento stati…'
    : orderStatesError && orderStates.length === 0
      ? 'Stati non disponibili'
      : `${selectedStates.length} inclusi${orderStatesDirty ? ' · da salvare' : ''}`;

  useEffect(() => {
    if (!orderSettingsError) return;
    requestAnimationFrame(() => document.getElementById('order-settings-save-error')?.focus());
  }, [orderSettingsError]);

  const clearStateFilters = () => {
    setSearchStateQuery('');
    setShowOnlySelectedStates(false);
  };
  const clearGaerStateFilters = () => {
    setGaerSearchStateQuery('');
    setShowOnlySelectedGaerStates(false);
  };

  return (
    <div className="glass-panel widget-card settings-workbench order-settings-progressive settings-progressive-workbench">
      <div className="settings-card-header">
        <div>
          <h2>Ordini e disponibilità</h2>
          <p>Sincronizza gli ordini e scegli quali stati impegnano le giacenze.</p>
        </div>
      </div>

      <div className="settings-linear-sections">
        <SettingsLinearSection id="orders-sync" title="Sincronizzazione ordini PrestaShop" description="Scarica gli ordini negli stati inclusi e aggiorna il database locale." status={`${cachedOrders} ordini · ${lastSync}`}>
          <section className="settings-progressive-panel-content order-sync-progressive-panel" aria-label="Sincronizzazione ordini">
            <div className="orders-sync-meta" aria-label="Stato sincronizzazione ordini">
              <div className="orders-sync-stat">
                <span>Ultima sincronizzazione</span>
                <strong>{status?.last_orders_sync ? new Date(status.last_orders_sync).toLocaleString('it-IT') : 'Mai'}</strong>
                {status?.last_orders_sync && <small>{lastSync}</small>}
              </div>
              <div className="orders-sync-stat orders-cache-stat"><span>Ordini in cache</span><strong>{cachedOrders}</strong></div>
            </div>
            <button className="btn btn-primary orders-sync-button" onClick={handleSyncOrders} disabled={syncingOrders || loading} aria-busy={syncingOrders}>
              {syncingOrders ? <><Icons.Sync className="orders-sync-icon" />{syncProgressText || 'Sincronizzazione in corso...'}</> : 'Sincronizza ordini ora'}
            </button>
          </section>
        </SettingsLinearSection>

        <SettingsLinearSection id="orders-states" title="Stati che scalano la disponibilità" description="Scegli quali ordini vengono conteggiati come impegnati." status={statesSummary}>
          <section className="settings-progressive-panel-content order-states-progressive-panel" aria-label="Stati che scalano la disponibilità">
            {!orderStatesReady ? (
              <div className="settings-data-state settings-data-state-loading" role="status" aria-live="polite">
                <span className="settings-data-state-spinner" aria-hidden="true" />
                <div><strong>Caricamento stati ordine</strong><span>Recupero la configurazione disponibile da PrestaShop.</span></div>
              </div>
            ) : orderStatesError && orderStates.length === 0 ? (
              <div className="settings-data-state settings-data-state-error" role="alert">
                <div><strong>Impossibile caricare gli stati ordine</strong><span>{orderStatesError}</span></div>
                <button type="button" className="btn btn-secondary" onClick={retryLoadOrderStates}>Riprova</button>
              </div>
            ) : orderStates.length === 0 ? (
              <div className="settings-data-state settings-data-state-empty">
                <div><strong>Nessuno stato ordine disponibile</strong><span>Verifica la connessione a PrestaShop o aggiorna l’elenco.</span></div>
                <button type="button" className="btn btn-secondary" onClick={retryLoadOrderStates}>Aggiorna elenco</button>
              </div>
            ) : (
              <div className="settings-grid order-states-workbench">
                {orderStatesError && (
                  <div className="settings-data-state settings-data-state-warning" role="status">
                    <div><strong>Elenco non aggiornato</strong><span>{orderStatesError} Continuo a mostrare gli ultimi stati disponibili.</span></div>
                    <button type="button" className="btn btn-secondary" onClick={retryLoadOrderStates}>Riprova</button>
                  </div>
                )}
                <div className="states-filter-bar order-states-toolbar">
                  <div className="states-search-wrapper">
                    <svg className="states-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" /></svg>
                    <label className="sr-only" htmlFor="order-states-search">Cerca uno stato ordine per nome o ID</label>
                    <input id="order-states-search" type="search" className="states-search-input" placeholder="Filtra stati per nome o ID..." value={searchStateQuery} onChange={event => setSearchStateQuery(event.target.value)} aria-controls="order-state-list" aria-describedby="order-states-results-summary" />
                  </div>
                  <div className="states-actions-wrapper">
                    <button type="button" className="btn-small-link order-states-recommended-action" onClick={handleSelectRecommendedStates} disabled={recommendedOrderStateIds.length === 0} title={recommendedOrderStateIds.length === 0 ? 'Non sono disponibili stati consigliati da aggiungere.' : undefined}>Aggiungi consigliati</button>
                    <button type="button" className={`btn-small-link ${showOnlySelectedStates ? 'active' : ''}`} onClick={() => setShowOnlySelectedStates(!showOnlySelectedStates)}>{showOnlySelectedStates ? 'Mostra tutti' : 'Solo selezionati'}</button>
                    <details className="settings-more-actions">
                      <summary>Altre azioni</summary>
                      <div>
                        <button type="button" onClick={handleSelectAllStates}>Seleziona tutti</button>
                        <button type="button" onClick={handleDeselectAllStates}>Deseleziona tutti</button>
                      </div>
                    </details>
                  </div>
                </div>

                <p id="order-states-results-summary" className="sr-only" role="status" aria-live="polite">{filteredOrderStates.length} stati visualizzati, {selectedStates.length} selezionati.</p>
                <div className="states-scrollbox" id="order-state-list">
                  {filteredOrderStates.length > 0 ? (
                    <div className="checkbox-list order-state-list">
                      {filteredOrderStates.map(state => {
                        const isSelected = selectedStates.includes(state.id);
                        const isRecommended = recommendedOrderStateIds.includes(state.id);
                        return (
                          <label key={state.id} className={`checkbox-label order-state-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}>
                            <input type="checkbox" className="checkbox-control" checked={isSelected} onChange={() => handleToggleState(state.id)} />
                            <div>
                              <div className="order-state-title-row"><span>{state.name}</span>{isSelected && <em>Incluso</em>}</div>
                              <div className="order-state-meta"><span>ID {state.id}</span>{isRecommended && <span>Consigliato</span>}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="order-states-empty">
                      <strong>Nessuno stato corrisponde ai filtri</strong>
                      <span>Modifica la ricerca oppure torna all’elenco completo.</span>
                      <button type="button" className="btn btn-secondary" onClick={clearStateFilters}>Azzera filtri</button>
                    </div>
                  )}
                </div>

                <footer className={`order-states-footer ${orderSettingsError ? 'has-error' : ''}`}>
                  {orderSettingsError && <div id="order-settings-save-error" className="settings-save-error" role="alert" tabIndex="-1">{orderSettingsError}</div>}
                  <div className="order-states-footer-copy">
                    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div><strong>{selectedStates.length} stati selezionati</strong><span>Le modifiche diventano attive dopo il salvataggio e il prossimo ricalcolo.</span></div>
                  </div>
                  <div className="order-states-footer-actions">
                    <button type="button" className="btn btn-secondary" onClick={resetOrderStates} disabled={!orderStatesDirty || savingStateSettings} title={!orderStatesDirty ? 'Non ci sono modifiche da annullare.' : undefined}>Annulla modifiche</button>
                    <button type="button" className="btn btn-primary" onClick={handleSaveOrderStates} disabled={!orderStatesDirty || savingStateSettings} title={!orderStatesDirty ? 'Modifica almeno uno stato prima di salvare.' : undefined} aria-busy={savingStateSettings} aria-describedby={orderSettingsError ? 'order-settings-save-error' : undefined} data-loading-indicator="true">{savingStateSettings ? 'Salvataggio...' : 'Salva stati ordine'}</button>
                  </div>
                </footer>
              </div>
            )}
          </section>
        </SettingsLinearSection>

        <SettingsLinearSection
          id="orders-gaer-states"
          title="Stati predefiniti per Gaer"
          description="Preselezionati nel tab Gaer e modificabili prima di ogni calcolo."
          status={`${gaerSelectedStates.length} preselezionati${gaerStatesDirty ? ' · da salvare' : ''}`}
        >
          <section className="settings-progressive-panel-content order-states-progressive-panel gaer-settings-panel" aria-label="Stati predefiniti Gaer">
            {!orderStatesReady ? (
              <div className="settings-data-state settings-data-state-loading" role="status"><span className="settings-data-state-spinner" /><div><strong>Caricamento stati</strong><span>Recupero gli stati disponibili da PrestaShop.</span></div></div>
            ) : orderStates.length === 0 ? (
              <div className="settings-data-state settings-data-state-empty"><div><strong>Nessuno stato disponibile</strong><span>Verifica la connessione PrestaShop.</span></div></div>
            ) : (
              <div className="settings-grid order-states-workbench gaer-states-workbench">
                <div className="states-filter-bar order-states-toolbar">
                  <div className="states-search-wrapper">
                    <svg className="states-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" /></svg>
                    <label className="sr-only" htmlFor="gaer-order-states-search">Cerca uno stato Gaer per nome o ID</label>
                    <input id="gaer-order-states-search" type="search" className="states-search-input" placeholder="Filtra stati per nome o ID..." value={gaerSearchStateQuery} onChange={event => setGaerSearchStateQuery(event.target.value)} aria-controls="gaer-order-state-list" aria-describedby="gaer-order-states-results-summary" />
                  </div>
                  <div className="states-actions-wrapper">
                    <button type="button" className={`btn-small-link ${showOnlySelectedGaerStates ? 'active' : ''}`} onClick={() => setShowOnlySelectedGaerStates(!showOnlySelectedGaerStates)}>{showOnlySelectedGaerStates ? 'Mostra tutti' : 'Solo selezionati'}</button>
                    <details className="settings-more-actions">
                      <summary>Altre azioni</summary>
                      <div>
                        <button type="button" onClick={handleSelectAllGaerStates}>Seleziona tutti</button>
                        <button type="button" onClick={handleDeselectAllGaerStates}>Deseleziona tutti</button>
                      </div>
                    </details>
                  </div>
                </div>

                <p id="gaer-order-states-results-summary" className="sr-only" role="status" aria-live="polite">{filteredGaerOrderStates.length} stati visualizzati, {gaerSelectedStates.length} preselezionati.</p>
                <div className="states-scrollbox" id="gaer-order-state-list">
                  {filteredGaerOrderStates.length > 0 ? (
                    <div className="checkbox-list order-state-list">
                      {filteredGaerOrderStates.map(state => {
                        const stateId = Number(state.id);
                        const selected = gaerSelectedStates.includes(stateId);
                        return (
                          <label key={state.id} className={`checkbox-label order-state-card ${selected ? 'selected' : ''}`}>
                            <input type="checkbox" className="checkbox-control" checked={selected} onChange={() => handleToggleGaerState(stateId)} />
                            <div><div className="order-state-title-row"><span>{state.name}</span>{selected && <em>Predefinito</em>}</div><div className="order-state-meta"><span>ID {state.id}</span></div></div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="order-states-empty">
                      <strong>Nessuno stato corrisponde ai filtri</strong>
                      <span>Modifica la ricerca oppure torna all’elenco completo.</span>
                      <button type="button" className="btn btn-secondary" onClick={clearGaerStateFilters}>Azzera filtri</button>
                    </div>
                  )}
                </div>

                <footer className={`order-states-footer ${gaerSettingsError ? 'has-error' : ''}`}>
                  {gaerSettingsError && <div className="settings-save-error" role="alert">{gaerSettingsError}</div>}
                  <div className="order-states-footer-copy">
                    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div><strong>{gaerSelectedStates.length} stati Gaer preselezionati</strong><span>Restano indipendenti dalla giacenza principale e modificabili durante il caricamento.</span></div>
                  </div>
                  <div className="order-states-footer-actions">
                    <button type="button" className="btn btn-secondary" disabled={!gaerStatesDirty || savingGaerStates} onClick={resetGaerStates} title={!gaerStatesDirty ? 'Non ci sono modifiche da annullare.' : undefined}>Annulla modifiche</button>
                    <button type="button" className="btn btn-primary" disabled={!gaerStatesDirty || savingGaerStates} onClick={handleSaveGaerStates} title={!gaerStatesDirty ? 'Modifica almeno uno stato prima di salvare.' : undefined} aria-busy={savingGaerStates} data-loading-indicator="true">{savingGaerStates ? 'Salvataggio…' : 'Salva stati Gaer'}</button>
                  </div>
                </footer>
              </div>
            )}
          </section>
        </SettingsLinearSection>
      </div>
    </div>
  );
}
