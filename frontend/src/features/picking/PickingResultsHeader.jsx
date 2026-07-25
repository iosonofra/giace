export function PickingResultsHeader({
  clearCountedPickingSkus,
  countedPickingSkus,
  handleCopyPickingList,
  pickingCopyState,
  pickingCountingMode,
  pickingLoading,
  pickingViewMode,
  setPickingViewMode,
  togglePickingCountingMode,
}) {
  return (
    <>
      {pickingLoading && (
        <div className="info-box info-box-primary" aria-live="polite">
          Aggiornamento dell'analisi in corso. I risultati precedenti restano visibili.
        </div>
      )}
      <div className="picking-results-header">
        <div className="picking-title-row">
          <span className="widget-title">Analisi del Fabbisogno di Prelievo</span>
          <div className="picking-view-toggle" role="tablist" aria-label="Vista risultati prelievo">
            <button
              type="button"
              className={pickingViewMode === 'aggregated' ? 'active' : ''}
              role="tab"
              aria-selected={pickingViewMode === 'aggregated'}
              onClick={() => setPickingViewMode('aggregated')}
            >
              Vista Aggregata
            </button>
            <button
              type="button"
              className={pickingViewMode === 'by_order' ? 'active' : ''}
              role="tab"
              aria-selected={pickingViewMode === 'by_order'}
              onClick={() => setPickingViewMode('by_order')}
            >
              Vista per Ordini
            </button>
          </div>
        </div>
        <div className="picking-toolbar">
          {pickingViewMode === 'aggregated' && (
            <>
              <button
                type="button"
                className={`btn ${pickingCountingMode ? 'btn-success' : 'btn-neutral'}`}
                onClick={togglePickingCountingMode}
              >
                {pickingCountingMode ? 'Conteggio attivo' : 'Conteggio'}
              </button>
              {countedPickingSkus.size > 0 && (
                <button
                  type="button"
                  className="btn btn-neutral"
                  onClick={clearCountedPickingSkus}
                >
                  Azzera contati ({countedPickingSkus.size})
                </button>
              )}
            </>
          )}
          <button
            className={`btn ${pickingCopyState === 'copied' ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleCopyPickingList}
          >
            {pickingCopyState === 'copied' ? 'Copiato!' : 'Copia Lista Prelievo (Testo)'}
          </button>
        </div>
      </div>
    </>
  );
}
