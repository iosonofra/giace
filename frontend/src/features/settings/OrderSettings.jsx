export function OrderSettings({ settings }) {
  const {
    filteredOrderStates,
    getRelativeTimeString,
    handleDeselectAllStates,
    handleSaveOrderStates,
    handleSelectAllStates,
    handleSelectRecommendedStates,
    handleSyncOrders,
    handleToggleState,
    Icons,
    loading,
    orderStates,
    orderStatesDirty,
    recommendedOrderStateIds,
    savingStateSettings,
    searchStateQuery,
    selectedStates,
    setSearchStateQuery,
    setShowOnlySelectedStates,
    showOnlySelectedStates,
    status,
    syncingOrders,
    syncProgressText,
  } = settings;

  return (
    <>
      <div className="glass-panel widget-card orders-sync-card">
                        <div className="orders-sync-copy">
                          <h2>Sincronizzazione Ordini PrestaShop</h2>
                          <p>
                            Scarica dal Webservice gli ordini negli stati inclusi e aggiorna il database locale.
                          </p>
                        </div>

                        <div className="orders-sync-meta" aria-label="Stato sincronizzazione ordini">
                          {status?.last_orders_sync && (
                            <div className="orders-sync-stat">
                              <span>Ultima sincronizzazione</span>
                              <strong>{new Date(status.last_orders_sync).toLocaleString('it-IT')}</strong>
                              <small>{getRelativeTimeString(status.last_orders_sync)}</small>
                            </div>
                          )}
                          {status?.prestashop_orders_count !== undefined && (
                            <div className="orders-sync-stat orders-cache-stat">
                              <span>Ordini in cache</span>
                              <strong>{status.prestashop_orders_count}</strong>
                            </div>
                          )}
                        </div>

                        <button
                          className="btn btn-primary orders-sync-button"
                          onClick={handleSyncOrders}
                          disabled={syncingOrders || loading}
                          aria-busy={syncingOrders}
                        >
                          {syncingOrders ? (
                            <>
                              <Icons.Sync className="orders-sync-icon" />
                              {syncProgressText || 'Sincronizzazione in corso...'}
                            </>
                          ) : (
                            'Sincronizza Ordini Ora'
                          )}
                        </button>
                      </div>

      <div className="glass-panel widget-card order-states-card order-states-selection-workbench">
                        <div className="settings-card-header">
                          <div>
                            <h2>Stati Ordine che Scalano la Disponibilita</h2>
                            <p>
                              Scegli quali ordini devono essere conteggiati come impegnati e sottratti dalla disponibilita dei prodotti.
                            </p>
                          </div>
                          <div className="order-states-header-status">
                            <span className="order-states-count-pill"><strong>{selectedStates.length}</strong> inclusi</span>
                            <span className={`settings-status-pill ${orderStatesDirty ? 'warning' : 'success'}`}>
                              <span className="settings-status-dot" />
                              {orderStatesDirty ? 'Modifiche non salvate' : 'Salvato'}
                            </span>
                          </div>
                        </div>

                        {orderStates.length > 0 ? (
                          <div className="settings-grid order-states-workbench">
                            <div className="states-filter-bar order-states-toolbar">
                              <div className="states-search-wrapper">
                                <svg className="states-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
                                <input 
                                  type="text" 
                                  className="states-search-input" 
                                  placeholder="Filtra stati per nome o ID..." 
                                  value={searchStateQuery}
                                  onChange={(e) => setSearchStateQuery(e.target.value)}
                                />
                              </div>
                              <div className="states-actions-wrapper">
                                <button
                                  type="button"
                                  className="btn-small-link order-states-recommended-action"
                                  onClick={handleSelectRecommendedStates}
                                  disabled={recommendedOrderStateIds.length === 0}
                                >
                                  Aggiungi consigliati
                                </button>
                                <button
                                  type="button"
                                  className={`btn-small-link ${showOnlySelectedStates ? 'active' : ''}`}
                                  onClick={() => setShowOnlySelectedStates(!showOnlySelectedStates)}
                                >
                                  {showOnlySelectedStates ? 'Mostra tutti' : 'Solo selezionati'}
                                </button>
                                <button type="button" className="btn-small-link" onClick={handleSelectAllStates}>
                                  Seleziona tutti
                                </button>
                                <button type="button" className="btn-small-link" onClick={handleDeselectAllStates}>
                                  Deseleziona tutti
                                </button>
                              </div>
                            </div>

                            <div className="states-scrollbox">
                              {filteredOrderStates.length > 0 ? (
                                <div className="checkbox-list order-state-list">
                                  {filteredOrderStates.map(state => {
                                    const isSelected = selectedStates.includes(state.id);
                                    const isRecommended = recommendedOrderStateIds.includes(state.id);
                                    return (
                                    <label key={state.id} className={`checkbox-label order-state-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}>
                                      <input type="checkbox" className="checkbox-control" checked={isSelected} onChange={() => handleToggleState(state.id)} />
                                      <div>
                                        <div className="order-state-title-row">
                                          <span>{state.name}</span>
                                          {isSelected && <em>Incluso</em>}
                                        </div>
                                        <div className="order-state-meta">
                                          <span>ID {state.id}</span>
                                          {isRecommended && <span>Consigliato</span>}
                                        </div>
                                      </div>
                                    </label>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="order-states-empty" style={{ color: 'var(--text-secondary)', margin: '8px 0', textAlign: 'center' }}>Nessuno stato trovato per la ricerca inserita.</p>
                              )}
                            </div>

                            <footer className="order-states-footer">
                              <div className="order-states-footer-copy">
                                <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <div>
                                  <strong>{selectedStates.length} stati selezionati</strong>
                                  <span>Le modifiche diventano attive dopo il salvataggio e il prossimo ricalcolo.</span>
                                </div>
                              </div>
                              <div className="order-states-footer-actions">
                                {orderStatesDirty && <span className="settings-unsaved-badge">Modifiche non salvate</span>}
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={handleSaveOrderStates}
                                  disabled={!orderStatesDirty || savingStateSettings}
                                  aria-busy={savingStateSettings}
                                  data-loading-indicator="true"
                                >
                                  {savingStateSettings ? "Salvataggio..." : "Salva Stati Ordine"}
                                </button>
                              </div>
                            </footer>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)' }}>Caricamento degli stati ordine da PrestaShop...</p>
                        )}
                      </div>
    </>
  );
}
