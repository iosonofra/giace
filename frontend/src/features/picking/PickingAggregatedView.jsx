export function PickingAggregatedView({
  automaticMinResidual,
  automaticStockAuditBySku,
  countedPickingSkus,
  formatPickingQty,
  getPickingRemainingQty,
  getRequirementMeta,
  pickingCountingMode,
  pickingRequirementFilter,
  pickingResults,
  setPickingRequirementFilter,
  togglePickingSkuCounted,
  visiblePickingRequirements,
}) {
  return (
    <>
      <div className="picking-table-controls">
        <span className="picking-filter-label">Mostra:</span>
        <div className="picking-filter-group" aria-label="Filtro SKU prelievo">
          <button
            type="button"
            className={pickingRequirementFilter === 'missing' ? 'active' : ''}
            onClick={() => setPickingRequirementFilter('missing')}
          >
            Solo mancanti
          </button>
          <button
            type="button"
            className={pickingRequirementFilter === 'all' ? 'active' : ''}
            onClick={() => setPickingRequirementFilter('all')}
          >
            Tutti
          </button>
          <button
            type="button"
            className={pickingRequirementFilter === 'available' ? 'active' : ''}
            onClick={() => setPickingRequirementFilter('available')}
          >
            Disponibili
          </button>
        </div>
        <span className="picking-visible-count">
          {visiblePickingRequirements.length} righe visibili
        </span>
      </div>

      <div className="table-container">
        {visiblePickingRequirements.length > 0 ? (
          <table className="custom-table picking-table">
            <thead>
              <tr>
                {pickingCountingMode && <th className="picking-count-col"><span className="sr-only">Conteggio</span></th>}
                <th>SKU componente</th>
                <th>Descrizione magazzino</th>
                <th className="num-col">
                  {pickingResults.mode === 'automatic' ? 'Da prelevare' : 'Quantità richiesta'}
                </th>
                <th className="num-col">
                  {pickingResults.mode === 'automatic' ? 'Stock iniziale' : 'Disponibile magazzino'}
                </th>
                {pickingResults.mode === 'automatic' && (
                  <>
                    <th className="num-col">Residuo simulato</th>
                    <th className="num-col">Utilizzo</th>
                  </>
                )}
                <th className="status-col">Disponibilità</th>
              </tr>
            </thead>
            <tbody>
              {visiblePickingRequirements.map(requirement => {
                const meta = getRequirementMeta(requirement);
                const isCounted = countedPickingSkus.has(requirement.sku);
                const remainingQty = getPickingRemainingQty(requirement);
                const utilization = automaticStockAuditBySku.get(requirement.sku)?.utilization_pct
                  ?? (
                    Number(requirement.qty_required || 0)
                    / Math.max(1, Number(requirement.qty_stock || 0) - automaticMinResidual)
                    * 100
                  );

                return (
                  <tr
                    key={requirement.sku}
                    className={`${meta.rowClass} ${isCounted ? 'picking-row-counted' : ''} ${pickingCountingMode ? 'picking-row-countable' : ''}`}
                    title={pickingCountingMode
                      ? `${isCounted ? 'Rimuovi' : 'Aggiungi'} ${requirement.sku} dal conteggio`
                      : undefined}
                    onClick={pickingCountingMode ? () => {
                      if (window.getSelection?.().toString()) return;
                      togglePickingSkuCounted(requirement.sku);
                    } : undefined}
                  >
                    {pickingCountingMode && (
                      <td className="picking-count-col" data-label="Conteggio">
                        <button
                          type="button"
                          className={`picking-count-toggle ${isCounted ? 'active' : ''}`}
                          aria-pressed={isCounted}
                          aria-label={`${isCounted ? 'Segna come non contato' : 'Segna come contato'} ${requirement.sku}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            togglePickingSkuCounted(requirement.sku);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                          </svg>
                        </button>
                      </td>
                    )}
                    <td className="picking-sku-cell" data-label="SKU">{requirement.sku}</td>
                    <td className="picking-description-cell" data-label="Descrizione">{requirement.description}</td>
                    <td className="num-col strong-num" data-label={pickingResults.mode === 'automatic' ? 'Da prelevare' : 'Richiesta'}>
                      {formatPickingQty(requirement.qty_required)}
                    </td>
                    <td className="num-col muted-num" data-label={pickingResults.mode === 'automatic' ? 'Stock iniziale' : 'Disponibile'}>
                      {formatPickingQty(requirement.qty_stock)}
                    </td>
                    {pickingResults.mode === 'automatic' && (
                      <>
                        <td className="num-col strong-num" data-label="Residuo">
                          {formatPickingQty(remainingQty)}
                        </td>
                        <td className="num-col muted-num" data-label="Utilizzo">
                          {formatPickingQty(utilization)}%
                        </td>
                      </>
                    )}
                    <td className="status-col" data-label="Disponibilità">
                      <span className={`picking-status-chip ${isCounted ? 'counted' : meta.tone}`}>
                        {isCounted
                          ? 'Contata'
                          : pickingResults.mode === 'automatic'
                            ? `Residuo ${formatPickingQty(remainingQty)}`
                            : meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="picking-empty-state">
            Nessuna riga corrisponde al filtro selezionato.
          </p>
        )}
      </div>
    </>
  );
}
