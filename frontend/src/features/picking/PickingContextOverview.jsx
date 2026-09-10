function OrderReferences({ orderIds, emptyLabel = 'Nessuno' }) {
  if (!orderIds?.length) return <p>{emptyLabel}</p>;
  return (
    <details className="picking-context-details">
      <summary>Mostra {orderIds.length} ID ordine</summary>
      <p>{orderIds.join(', ')}</p>
    </details>
  );
}

function AutomaticContext({ formatPickingQty, pickingResults }) {
  const automatic = pickingResults.auto_picking || {};
  const isGaer = pickingResults.mode === 'gaer';

  return (
    <>
      <div className="picking-context-card success">
        <div>Ordini proposti</div>
        <strong>{automatic.selected_count || 0} ordini</strong>
        <OrderReferences
          orderIds={pickingResults.orders_found}
          emptyLabel="Nessun ordine preparabile"
        />
      </div>
      <div className={`picking-context-card ${(automatic.skipped_count || 0) > 0 ? 'danger' : 'success'}`}>
        <div>Ordini saltati</div>
        <strong>{automatic.skipped_count || 0} ordini</strong>
        <p>{automatic.evaluated_count || 0} ordini valutati su {automatic.candidate_count || 0}</p>
      </div>
      <div className="picking-context-card file">
        <div>{isGaer ? 'Sorgente disponibilità' : 'Criterio'}</div>
        <strong>
          {isGaer
            ? 'File Gaer per EAN13'
            : automatic.selection_strategy === 'maximize_orders'
            ? 'Massimizza ordini'
            : (automatic.strict_chronology ? 'Coda rigida' : 'Salto intelligente')}
        </strong>
        <p>
          {isGaer
            ? `${pickingResults.gaer?.file_ean_count || 0} EAN · ${formatPickingQty(pickingResults.gaer?.file_units || 0)} unità · ${(pickingResults.gaer?.states || []).map(state => state.name).join(', ')}`
            : `Richiesta: ${automatic.requested_limit || 0} ordini`}
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
        <OrderReferences orderIds={pickingResults.orders_found} />
      </div>
      <div className={`picking-context-card ${pickingResults.orders_missing.length > 0 ? 'danger' : ''}`}>
        <div>Ordini non trovati</div>
        <strong>{pickingResults.orders_missing.length} ordini</strong>
        {pickingResults.orders_missing.length > 0 ? (
          <>
            <OrderReferences orderIds={pickingResults.orders_missing} />
            <div className="picking-context-action">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={syncingSpecificOrders}
                aria-busy={syncingSpecificOrders}
                data-loading-indicator="true"
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
        <OrderReferences orderIds={pickingResults.orders_found} />
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

function StateContext({ pickingResults, pickingSourceState }) {
  const state = pickingSourceState || pickingResults.source_state || {};
  const sync = pickingResults.orders_sync || {};
  const hasIncrementalStats = sync.sync_mode === 'incremental';

  return (
    <>
      <div className="picking-context-card success">
        <div>Ordini importati</div>
        <strong>{pickingResults.orders_found.length} ordini</strong>
        <OrderReferences
          orderIds={pickingResults.orders_found}
          emptyLabel="Nessun ordine nello stato selezionato"
        />
      </div>
      <div className="picking-context-card file">
        <div>Stato ordine selezionato</div>
        <strong>{state.name || `Stato ${state.id || '—'}`}</strong>
        <p>
          {hasIncrementalStats
            ? `Aggiornati ${sync.orders_added_or_updated || 0} · rimossi ${sync.orders_removed || 0} · invariati ${sync.orders_unchanged || 0}`
            : 'Elaborazione cronologica dal più vecchio al più recente.'}
        </p>
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
  pickingSourceState,
  syncingSpecificOrders,
}) {
  return (
    <>
      {['file', 'gaer'].includes(pickingInputMode) && pickingFilesAnomalies.length > 0 && (
        <div className="picking-anomaly-panel" role="alert">
          <span>Problemi nei file ({pickingFilesAnomalies.length})</span>
          <div className="picking-anomaly-list">
            {pickingFilesAnomalies.map((anomaly, index) => (
              <div key={index}>
                <strong>{anomaly.record_key}:</strong> {anomaly.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`picking-context-grid ${['automatic', 'gaer'].includes(pickingResults.mode) ? 'auto' : ''}`}>
        {['automatic', 'gaer'].includes(pickingResults.mode) ? (
          <AutomaticContext
            formatPickingQty={formatPickingQty}
            pickingResults={pickingResults}
          />
        ) : pickingResults.source_state ? (
          <StateContext
            pickingResults={pickingResults}
            pickingSourceState={pickingSourceState}
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
