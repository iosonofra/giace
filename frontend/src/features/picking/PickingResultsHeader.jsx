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
  totalPickingSkus,
  sheetWrite,
}) {
  const counted = countedPickingSkus.size;
  const progress = totalPickingSkus > 0
    ? Math.min(100, Math.round((counted / totalPickingSkus) * 100))
    : 0;

  const handleViewKeyDown = (event) => {
    const views = ['aggregated', 'by_order'];
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = views.indexOf(pickingViewMode);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? views.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + views.length)
          % views.length;
    const nextView = views[nextIndex];
    setPickingViewMode(nextView);
    requestAnimationFrame(() => {
      document.getElementById(`picking-results-tab-${nextView}`)?.focus();
    });
  };

  return (
    <>
      {pickingLoading && (
        <div className="info-box info-box-primary" aria-live="polite">
          Aggiornamento dell'analisi in corso. I risultati precedenti restano visibili.
        </div>
      )}
      <div className="picking-results-header">
        <div className="picking-title-row">
          <h2 className="widget-title">Fabbisogno di prelievo</h2>
          <div
            className="picking-view-toggle"
            role="tablist"
            aria-label="Vista risultati prelievo"
            onKeyDown={handleViewKeyDown}
          >
            <button
              id="picking-results-tab-aggregated"
              type="button"
              className={pickingViewMode === 'aggregated' ? 'active' : ''}
              role="tab"
              aria-selected={pickingViewMode === 'aggregated'}
              aria-controls="picking-results-view-panel"
              tabIndex={pickingViewMode === 'aggregated' ? 0 : -1}
              onClick={() => setPickingViewMode('aggregated')}
            >
              Per SKU
            </button>
            <button
              id="picking-results-tab-by_order"
              type="button"
              className={pickingViewMode === 'by_order' ? 'active' : ''}
              role="tab"
              aria-selected={pickingViewMode === 'by_order'}
              aria-controls="picking-results-view-panel"
              tabIndex={pickingViewMode === 'by_order' ? 0 : -1}
              onClick={() => setPickingViewMode('by_order')}
            >
              Per ordine
            </button>
          </div>
        </div>
        <div className="picking-toolbar">
          {pickingViewMode === 'aggregated' && (
            <button
              type="button"
              className={`btn ${pickingCountingMode ? 'btn-success' : 'btn-primary'}`}
              aria-pressed={pickingCountingMode}
              onClick={togglePickingCountingMode}
            >
              {pickingCountingMode ? 'Termina conteggio' : 'Avvia conteggio'}
            </button>
          )}
          {sheetWrite?.enabled && (
            <button
              type="button"
              className="btn btn-secondary picking-sheet-write-trigger"
              onClick={sheetWrite.show}
            >
              Registra su Sheets <span className="badge">Beta</span>
            </button>
          )}
          <details className="picking-more-actions">
            <summary className="btn btn-neutral">Altre azioni</summary>
            <div className="picking-more-actions-menu">
              <button
                type="button"
                className={pickingCopyState === 'copied' ? 'is-success' : ''}
                onClick={handleCopyPickingList}
              >
                {pickingCopyState === 'copied' ? 'Elenco copiato' : 'Copia elenco'}
              </button>
              {counted > 0 && (
                <button type="button" onClick={clearCountedPickingSkus}>
                  Azzera conteggio ({counted})
                </button>
              )}
            </div>
          </details>
        </div>
      </div>
      {pickingViewMode === 'aggregated' && (pickingCountingMode || counted > 0) && (
        <div className="picking-counting-progress" aria-live="polite">
          <div className="picking-counting-progress-copy">
            <strong>{counted === totalPickingSkus && totalPickingSkus > 0 ? 'Conteggio completato' : 'Conteggio in corso'}</strong>
            <span>{counted} di {totalPickingSkus} SKU verificati</span>
          </div>
          <div
            className="picking-counting-progress-track"
            role="progressbar"
            aria-label="Avanzamento conteggio"
            aria-valuemin="0"
            aria-valuemax={totalPickingSkus}
            aria-valuenow={counted}
          >
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </div>
      )}
    </>
  );
}
