import { StockMappingSettings } from './StockMappingSettings';
import { StockSourceSettings } from './StockSourceSettings';
import { StockSyncStatusRail } from './StockSyncStatusRail';


export function StockSettings({ settings }) {
  const {
    googleSheetLastError,
    googleSheetSyncInterval,
    handleSaveGoogleSheetsSettings,
    savingStockSettings,
    stockSource,
  } = settings;

  return (
    <div className="glass-panel widget-card settings-workbench stock-settings-workbench">
      <div className="settings-card-header">
        <div>
          <h2>Sorgente Giacenze (SKU) e Sincronizzazione</h2>
          <p>
            Scegli se caricare le giacenze fisiche manualmente tramite file Excel
            o sincronizzarle automaticamente da Google Sheets.
          </p>
        </div>
        <span className={`settings-status-pill ${googleSheetLastError ? 'danger' : stockSource === 'google_sheets' ? 'success' : 'warning'}`}>
          <span className="settings-status-dot" />
          {stockSource === 'google_sheets'
            ? `Google Sheets · ogni ${googleSheetSyncInterval} min`
            : 'Excel manuale'}
        </span>
      </div>

      <form onSubmit={handleSaveGoogleSheetsSettings} className="stock-settings-form">
        <div className="stock-workbench-layout">
          <div className="stock-workbench-main">
            <StockSourceSettings settings={settings} />
            <StockMappingSettings settings={settings} />
          </div>
          <StockSyncStatusRail settings={settings} />
        </div>
        <footer className="stock-settings-footer">
          <span>Le modifiche diventano attive dopo il salvataggio.</span>
          <button type="submit" className="btn btn-primary" disabled={savingStockSettings}>
            {savingStockSettings ? 'Salvataggio...' : 'Salva impostazioni giacenze'}
          </button>
        </footer>
      </form>
    </div>
  );
}
