export function StockSyncStatusRail({ settings }) {
  const {
    googleSheetLastError,
    googleSheetLastSync,
    googleSheetName,
    googleSheetSyncInterval,
    handleSyncGoogleSheetsNow,
    mappingQty,
    mappingSku,
    stockSource,
    syncingGoogleSheets,
  } = settings;
  const googleSheets = stockSource === 'google_sheets';

  return (
    <aside className="stock-sync-rail" aria-labelledby="stock-status-title">
      <div className="stock-section-heading">
        <h3 id="stock-status-title">Stato sincronizzazione</h3>
        <p>Riepilogo della sorgente attualmente configurata.</p>
      </div>
      <dl className="stock-status-list">
        <div><dt>Sorgente</dt><dd>{googleSheets ? 'Google Sheets' : 'Excel manuale'}</dd></div>
        <div>
          <dt>{googleSheets ? 'Foglio' : 'Modalità'}</dt>
          <dd>{googleSheets ? googleSheetName || 'Non indicato' : 'Caricamento locale'}</dd>
        </div>
        <div>
          <dt>{googleSheets ? 'Intervallo' : 'Aggiornamento'}</dt>
          <dd>{googleSheets ? `${googleSheetSyncInterval} minuti` : 'Su richiesta'}</dd>
        </div>
        <div>
          <dt>Ultima sincronizzazione</dt>
          <dd>
            {googleSheets
              ? googleSheetLastSync
                ? new Date(googleSheetLastSync).toLocaleString('it-IT')
                : 'Mai sincronizzato'
              : 'Non applicabile'}
          </dd>
        </div>
      </dl>
      <div className="stock-mapping-summary">
        <span>Mappatura attuale</span>
        <div><strong>SKU</strong><code>{mappingSku || '—'}</code></div>
        <div><strong>Quantità</strong><code>{mappingQty || '—'}</code></div>
      </div>
      {googleSheetLastError && (
        <div className="stock-sync-error" role="alert">
          <strong>Ultimo errore</strong><span>{googleSheetLastError}</span>
        </div>
      )}
      {googleSheets && (
        <button
          type="button"
          className="btn btn-secondary stock-sync-button"
          disabled={syncingGoogleSheets}
          aria-busy={syncingGoogleSheets}
          onClick={handleSyncGoogleSheetsNow}
        >
          {syncingGoogleSheets ? 'Sincronizzazione...' : 'Sincronizza ora'}
        </button>
      )}
    </aside>
  );
}
