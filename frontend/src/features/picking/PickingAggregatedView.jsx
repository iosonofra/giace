export function PickingAggregatedView({
  automaticMinResidual,
  automaticStockAuditBySku,
  countedPickingCount,
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
  const totalRequirements = pickingResults.sku_requirements?.length || 0;

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
        {pickingCountingMode && (
          <span className="picking-counted-summary">
            {countedPickingCount}/{totalRequirements} contate
          </span>
        )}
      </div>

      <div className="table-container">
        {visiblePickingRequirements.length > 0 ? (
          <table className="custom-table picking-table">
            <thead>
              <tr>
                <th>SKU Componente</th>
                <th>Descrizione Magazzino</th>
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
                <th className="status-col">Stato Prelievo</th>
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
                    onClick={() => togglePickingSkuCounted(requirement.sku)}
                    title={pickingCountingMode
                      ? (isCounted
                        ? 'Clicca per segnare come non contata'
                        : 'Clicca per segnare come contata')
                      : undefined}
                  >
                    <td className="picking-sku-cell">{requirement.sku}</td>
                    <td className="picking-description-cell">{requirement.description}</td>
                    <td className="num-col strong-num">
                      {formatPickingQty(requirement.qty_required)}
                    </td>
                    <td className="num-col muted-num">
                      {formatPickingQty(requirement.qty_stock)}
                    </td>
                    {pickingResults.mode === 'automatic' && (
                      <>
                        <td className="num-col strong-num">
                          {formatPickingQty(remainingQty)}
                        </td>
                        <td className="num-col muted-num">
                          {formatPickingQty(utilization)}%
                        </td>
                      </>
                    )}
                    <td className="status-col">
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
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            Nessuna riga corrisponde al filtro selezionato.
          </p>
        )}
      </div>
    </>
  );
}
