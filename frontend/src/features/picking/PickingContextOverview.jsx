function AutomaticContext({ formatPickingQty, pickingResults }) {
  const automatic = pickingResults.auto_picking || {};

  return (
    <>
      <div className="picking-context-card success">
        <div>Ordini proposti</div>
        <strong>{automatic.selected_count || 0} ordini</strong>
        <p>
          {pickingResults.orders_found.length > 0
            ? pickingResults.orders_found.join(', ')
            : 'Nessun ordine preparabile'}
        </p>
      </div>
      <div className={`picking-context-card ${(automatic.skipped_count || 0) > 0 ? 'danger' : 'success'}`}>
        <div>Ordini saltati</div>
        <strong>{automatic.skipped_count || 0} ordini</strong>
        <p>{automatic.evaluated_count || 0} ordini valutati su {automatic.candidate_count || 0}</p>
      </div>
      <div className="picking-context-card file">
        <div>Criterio</div>
        <strong>
          {automatic.selection_strategy === 'maximize_orders'
            ? 'Massimizza ordini'
            : (automatic.strict_chronology ? 'Coda rigida' : 'Salto intelligente')}
        </strong>
        <p>
          Richiesta: {automatic.requested_limit || 0} ordini
          {Number(automatic.min_sku_residual || 0) > 0
            ? ` | Scorta min: ${automatic.min_sku_residual}`
            : ''}
          {automatic.sku_filter?.length > 0
            ? ` | SKU: ${automatic.sku_filter.join(', ')}`
            : ''}
          {Object.keys(automatic.sku_limits || {}).length > 0
            ? ` | Massimi: ${Object.entries(automatic.sku_limits)
              .map(([sku, max]) => `${sku}≤${formatPickingQty(max)}`)
              .join(', ')}`
            : ''}
          {automatic.excluded_skus?.length > 0
            ? ` | SKU escluse: ${automatic.excluded_skus.join(', ')}`
            : ''}
          {automatic.sku_excluded_count > 0
            ? ` | Ordini esclusi per SKU: ${automatic.sku_excluded_count}`
            : ''}
          {automatic.sku_limit_excluded_count > 0
            ? ` | Esclusi per massimo: ${automatic.sku_limit_excluded_count}`
            : ''}
        </p>
      </div>
    </>
  );
}

function TextContext({ handleSyncSpecificOrders, pickingResults, syncingSpecificOrders }) {
  return (
    <>
      <div className="picking-context-card success">
        <div>Riferimenti ordini rilevati</div>
        <strong>{pickingResults.orders_found.length} ordini</strong>
        <p>{pickingResults.orders_found.length > 0 ? pickingResults.orders_found.join(', ') : 'Nessuno'}</p>
      </div>
      <div className={`picking-context-card ${pickingResults.orders_missing.length > 0 ? 'danger' : ''}`}>
        <div>Ordini non trovati</div>
        <strong>{pickingResults.orders_missing.length} ordini</strong>
        {pickingResults.orders_missing.length > 0 ? (
          <>
            <p>{pickingResults.orders_missing.join(', ')}</p>
            <div className="picking-context-action">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={syncingSpecificOrders}
                onClick={handleSyncSpecificOrders}
              >
                {syncingSpecificOrders ? 'Sincronizzazione...' : 'Recupera e ricalcola'}
              </button>
            </div>
          </>
        ) : (
          <p>Tutti gli ordini sono presenti nel database locale.</p>
        )}
      </div>
    </>
  );
}

function FileContext({ pickingFilesSummary, pickingResults }) {
  return (
    <>
      <div className="picking-context-card success">
        <div>Riferimenti ordini rilevati</div>
        <strong>{pickingResults.orders_found.length} ordini</strong>
        <p>{pickingResults.orders_found.length > 0 ? pickingResults.orders_found.join(', ') : 'Nessuno'}</p>
      </div>
      <div className="picking-context-card file">
        <div>File Excel inclusi</div>
        <strong>{pickingFilesSummary.length} file</strong>
        <div className="picking-file-summary">
          {pickingFilesSummary.map((file, index) => (
            <div key={index}>
              <span title={file.filename}>{file.filename}</span>
              <strong>{file.rows_count} righe</strong>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function PickingContextOverview({
  formatPickingQty,
  handleSyncSpecificOrders,
  pickingFilesAnomalies,
  pickingFilesSummary,
  pickingInputMode,
  pickingResults,
  syncingSpecificOrders,
}) {
  return (
    <>
      {pickingInputMode === 'file' && pickingFilesAnomalies.length > 0 && (
        <div className="picking-anomaly-panel">
          <span>Avvisi ed Anomalie File ({pickingFilesAnomalies.length})</span>
          <div className="picking-anomaly-list">
            {pickingFilesAnomalies.map((anomaly, index) => (
              <div key={index}>
                <strong>{anomaly.record_key}:</strong> {anomaly.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`picking-context-grid ${pickingResults.mode === 'automatic' ? 'auto' : ''}`}>
        {pickingResults.mode === 'automatic' ? (
          <AutomaticContext
            formatPickingQty={formatPickingQty}
            pickingResults={pickingResults}
          />
        ) : pickingInputMode === 'text' ? (
          <TextContext
            handleSyncSpecificOrders={handleSyncSpecificOrders}
            pickingResults={pickingResults}
            syncingSpecificOrders={syncingSpecificOrders}
          />
        ) : (
          <FileContext
            pickingFilesSummary={pickingFilesSummary}
            pickingResults={pickingResults}
          />
        )}
      </div>
    </>
  );
}
