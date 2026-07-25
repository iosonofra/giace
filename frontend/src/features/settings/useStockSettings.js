import { useEffect, useState } from 'react';

import { apiFetch } from '../../api/client';


export function useStockSettings({
  currentSettings,
  initialStockSource,
  refresh,
  setSettingsError,
  setSyncingStock,
  showActionMsg,
}) {
  const [savingStockSettings, setSavingStockSettings] = useState(false);
  const [stockSource, setStockSource] = useState('local_upload');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetName, setGoogleSheetName] = useState('ROSATE');
  const [googleSheetSyncInterval, setGoogleSheetSyncInterval] = useState(10);
  const [googleSheetLastSync, setGoogleSheetLastSync] = useState('');
  const [googleSheetLastError, setGoogleSheetLastError] = useState('');
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
  const [mappingSku, setMappingSku] = useState('Sku');
  const [mappingQty, setMappingQty] = useState('Qta Tot.');
  const [mappingDesc, setMappingDesc] = useState('Descrizione Sku');
  const [mappingLotto, setMappingLotto] = useState('Lotto');

  useEffect(() => {
    if (initialStockSource) setStockSource(initialStockSource);
  }, [initialStockSource]);

  useEffect(() => {
    if (!currentSettings) return;
    setStockSource(currentSettings.stock_source || 'local_upload');
    setGoogleSheetUrl(currentSettings.google_sheet_url || '');
    setGoogleSheetName(currentSettings.google_sheet_name || 'ROSATE');
    setGoogleSheetSyncInterval(currentSettings.google_sheet_sync_interval || 10);
    setGoogleSheetLastSync(currentSettings.google_sheet_last_sync || '');
    setGoogleSheetLastError(currentSettings.google_sheet_last_error || '');
    setMappingSku(currentSettings.mapping_sku || 'Sku');
    setMappingQty(currentSettings.mapping_qty || 'Qta Tot.');
    setMappingDesc(currentSettings.mapping_desc || 'Descrizione Sku');
    setMappingLotto(currentSettings.mapping_lotto || 'Lotto');
  }, [currentSettings]);

  const handleSaveGoogleSheetsSettings = async event => {
    event.preventDefault();
    if (
      stockSource === 'google_sheets' &&
      !googleSheetUrl.trim().startsWith('https://docs.google.com/spreadsheets/')
    ) {
      setSettingsError('Inserisci un URL Google Sheets valido.');
      return;
    }
    if (stockSource === 'google_sheets' && !googleSheetName.trim()) {
      setSettingsError('Inserisci il nome del foglio Google Sheets.');
      return;
    }
    if (stockSource === 'google_sheets' && Number(googleSheetSyncInterval) < 1) {
      setSettingsError(
        "L'intervallo verifica Google Sheets deve essere almeno 1 minuto.",
      );
      return;
    }
    if (!mappingSku.trim() || !mappingQty.trim()) {
      setSettingsError('Le colonne SKU e Quantità sono obbligatorie.');
      return;
    }

    setSavingStockSettings(true);
    setSettingsError(null);
    try {
      const response = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_source: stockSource,
          google_sheet_url: googleSheetUrl,
          google_sheet_name: googleSheetName,
          google_sheet_sync_interval: googleSheetSyncInterval,
          mapping_sku: mappingSku,
          mapping_qty: mappingQty,
          mapping_desc: mappingDesc,
          mapping_lotto: mappingLotto,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showActionMsg('Impostazioni giacenze salvate con successo.');
        refresh();
      } else {
        setSettingsError(data.detail || 'Errore nel salvataggio delle impostazioni.');
      }
    } catch (error) {
      console.error(error);
      setSettingsError(
        'Errore nella richiesta di salvataggio delle impostazioni.',
      );
    } finally {
      setSavingStockSettings(false);
    }
  };

  const handleSyncGoogleSheetsNow = async () => {
    setSyncingGoogleSheets(true);
    setSyncingStock(true);
    setSettingsError(null);
    try {
      const response = await apiFetch('/api/settings/google-sheets/sync', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        showActionMsg(
          data.status === 'skipped'
            ? 'Nessuna modifica rilevata nel Google Sheet. Giacenze già aggiornate.'
            : `Sincronizzazione completata! Importate ${data.records_imported} SKU.`,
          data.status === 'skipped' ? 'warning' : 'success',
        );
        refresh();
      } else {
        setSettingsError(
          data.detail || 'Errore durante la sincronizzazione con Google Sheets.',
        );
      }
    } catch (error) {
      console.error(error);
      setSettingsError('Errore durante la connessione per la sincronizzazione.');
    } finally {
      setSyncingStock(false);
      setSyncingGoogleSheets(false);
    }
  };

  return {
    googleSheetLastError,
    googleSheetLastSync,
    googleSheetName,
    googleSheetSyncInterval,
    googleSheetUrl,
    handleSaveGoogleSheetsSettings,
    handleSyncGoogleSheetsNow,
    mappingDesc,
    mappingLotto,
    mappingQty,
    mappingSku,
    savingStockSettings,
    setGoogleSheetName,
    setGoogleSheetSyncInterval,
    setGoogleSheetUrl,
    setMappingDesc,
    setMappingLotto,
    setMappingQty,
    setMappingSku,
    setStockSource,
    setSyncingGoogleSheets,
    stockSource,
    syncingGoogleSheets,
  };
}
