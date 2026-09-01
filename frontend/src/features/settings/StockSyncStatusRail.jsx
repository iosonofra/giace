import { SyncActionIcon } from '../../components/ui/SyncActionIcon';


export function StockSyncStatusRail({ settings }) {
  const {
    googleSheetLastError,
    googleSheetLastSync,
    googleSheetName,
    googleSheetSyncInterval,
    googleSheetsSyncSuccessKey,
    handleSyncGoogleSheetsNow,
    stockSource,
    syncingGoogleSheets,
  } = settings;
  const googleSheets = stockSource === 'google_sheets';
  const lastSync = googleSheets
    ? googleSheetLastSync
      ? new Date(googleSheetLastSync).toLocaleString('it-IT')
      : 'Mai sincronizzato'
    : 'Aggiornamento su richiesta';

  return (
    <aside className={`stock-sync-rail ${googleSheetLastError ? 'has-error' : ''}`} aria-labelledby="stock-status-title">
      <div className="stock-sync-identity">
        <span className={`settings-status-dot ${googleSheetLastError ? 'danger' : googleSheets ? 'success' : 'neutral'}`} />
        <div>
          <span id="stock-status-title">Stato sincronizzazione</span>
          <strong>{googleSheets ? 'Google Sheets' : 'Excel manuale'}</strong>
        </div>
      </div>
      <div className="stock-sync-meta">
        <div><span>{googleSheets ? 'Foglio' : 'Modalità'}</span><strong>{googleSheets ? googleSheetName || 'Non indicato' : 'Caricamento locale'}</strong></div>
        <div><span>{googleSheets ? 'Intervallo' : 'Frequenza'}</span><strong>{googleSheets ? `${googleSheetSyncInterval} minuti` : 'Manuale'}</strong></div>
        <div><span>Ultima sincronizzazione</span><strong>{lastSync}</strong></div>
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
          <SyncActionIcon
            busy={syncingGoogleSheets}
            successKey={googleSheetsSyncSuccessKey}
          />
          {syncingGoogleSheets ? 'Sincronizzazione...' : 'Sincronizza ora'}
        </button>
      )}
    </aside>
  );
}
