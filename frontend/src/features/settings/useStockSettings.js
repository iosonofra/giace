import { useEffect, useMemo, useState } from 'react';

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
  const [stockSettingsErrorSection, setStockSettingsErrorSection] = useState('');
  const [stockSettingsErrorField, setStockSettingsErrorField] = useState('');
  const [stockSource, setStockSource] = useState('local_upload');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetName, setGoogleSheetName] = useState('ROSATE');
  const [googleSheetSyncInterval, setGoogleSheetSyncInterval] = useState(10);
  const [googleSheetLastSync, setGoogleSheetLastSync] = useState('');
  const [googleSheetLastError, setGoogleSheetLastError] = useState('');
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
  const [googleSheetsSyncSuccessKey, setGoogleSheetsSyncSuccessKey] = useState(0);
  const [mappingSku, setMappingSku] = useState('Sku');
  const [mappingQty, setMappingQty] = useState('Qta Tot.');
  const [mappingDesc, setMappingDesc] = useState('Descrizione Sku');
  const [mappingLotto, setMappingLotto] = useState('Lotto');
  const [excludeReturnLots, setExcludeReturnLots] = useState(false);
  const [excludedLotKeywords, setExcludedLotKeywords] = useState('RESO, RESI');
  const [pickingSheetWriteEnabled, setPickingSheetWriteEnabled] = useState(false);
  const [pickingSheetWebappUrl, setPickingSheetWebappUrl] = useState('');
  const [pickingSheetSharedSecret, setPickingSheetSharedSecret] = useState('');
  const [pickingSheetRemainingHeader, setPickingSheetRemainingHeader] = useState('RIMANENTI');
  const [pickingSheetSecretConfigured, setPickingSheetSecretConfigured] = useState(false);
  const [pickingSheetTesting, setPickingSheetTesting] = useState(false);
  const [pickingSheetDayMapping, setPickingSheetDayMapping] = useState({
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: '',
    sunday: '',
  });

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
    setExcludeReturnLots(Boolean(currentSettings.exclude_return_lots));
    setExcludedLotKeywords(
      (currentSettings.excluded_lot_keywords || ['RESO', 'RESI']).join(', '),
    );
    setPickingSheetWriteEnabled(Boolean(currentSettings.picking_sheet_write_enabled));
    setPickingSheetWebappUrl(currentSettings.picking_sheet_webapp_url || '');
    setPickingSheetSharedSecret('');
    setPickingSheetRemainingHeader(
      currentSettings.picking_sheet_remaining_header || 'RIMANENTI',
    );
    setPickingSheetSecretConfigured(Boolean(
      currentSettings.picking_sheet_shared_secret_configured,
    ));
    setPickingSheetDayMapping(currentSettings.picking_sheet_day_mapping || {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: '',
      sunday: '',
    });
  }, [currentSettings]);

  const stockSettingsDirty = useMemo(() => {
    if (!currentSettings) return false;
    const savedDayMapping = currentSettings.picking_sheet_day_mapping || {};
    return (
      stockSource !== (currentSettings.stock_source || 'local_upload')
      || googleSheetUrl !== (currentSettings.google_sheet_url || '')
      || googleSheetName !== (currentSettings.google_sheet_name || 'ROSATE')
      || Number(googleSheetSyncInterval) !== Number(currentSettings.google_sheet_sync_interval || 10)
      || mappingSku !== (currentSettings.mapping_sku || 'Sku')
      || mappingQty !== (currentSettings.mapping_qty || 'Qta Tot.')
      || mappingDesc !== (currentSettings.mapping_desc || 'Descrizione Sku')
      || mappingLotto !== (currentSettings.mapping_lotto || 'Lotto')
      || excludeReturnLots !== Boolean(currentSettings.exclude_return_lots)
      || excludedLotKeywords !== (currentSettings.excluded_lot_keywords || ['RESO', 'RESI']).join(', ')
      || pickingSheetWriteEnabled !== Boolean(currentSettings.picking_sheet_write_enabled)
      || pickingSheetWebappUrl !== (currentSettings.picking_sheet_webapp_url || '')
      || Boolean(pickingSheetSharedSecret)
      || pickingSheetRemainingHeader !== (currentSettings.picking_sheet_remaining_header || 'RIMANENTI')
      || ![
        ['monday', 'Lunedì'], ['tuesday', 'Martedì'], ['wednesday', 'Mercoledì'],
        ['thursday', 'Giovedì'], ['friday', 'Venerdì'], ['saturday', ''], ['sunday', ''],
      ].every(([key, fallback]) => (
        (pickingSheetDayMapping[key] || '') === (savedDayMapping[key] ?? fallback)
      ))
    );
  }, [
    currentSettings, excludeReturnLots, excludedLotKeywords, googleSheetName,
    googleSheetSyncInterval, googleSheetUrl, mappingDesc, mappingLotto, mappingQty,
    mappingSku, pickingSheetDayMapping, pickingSheetRemainingHeader,
    pickingSheetSharedSecret, pickingSheetWebappUrl, pickingSheetWriteEnabled,
    stockSource,
  ]);

  const resetStockSettings = () => {
    if (!currentSettings) return;
    setStockSource(currentSettings.stock_source || 'local_upload');
    setGoogleSheetUrl(currentSettings.google_sheet_url || '');
    setGoogleSheetName(currentSettings.google_sheet_name || 'ROSATE');
    setGoogleSheetSyncInterval(currentSettings.google_sheet_sync_interval || 10);
    setMappingSku(currentSettings.mapping_sku || 'Sku');
    setMappingQty(currentSettings.mapping_qty || 'Qta Tot.');
    setMappingDesc(currentSettings.mapping_desc || 'Descrizione Sku');
    setMappingLotto(currentSettings.mapping_lotto || 'Lotto');
    setExcludeReturnLots(Boolean(currentSettings.exclude_return_lots));
    setExcludedLotKeywords(
      (currentSettings.excluded_lot_keywords || ['RESO', 'RESI']).join(', '),
    );
    setPickingSheetWriteEnabled(Boolean(currentSettings.picking_sheet_write_enabled));
    setPickingSheetWebappUrl(currentSettings.picking_sheet_webapp_url || '');
    setPickingSheetSharedSecret('');
    setPickingSheetRemainingHeader(
      currentSettings.picking_sheet_remaining_header || 'RIMANENTI',
    );
    setPickingSheetDayMapping(currentSettings.picking_sheet_day_mapping || {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: '',
      sunday: '',
    });
    setStockSettingsErrorSection('');
    setStockSettingsErrorField('');
    setSettingsError(null);
  };

  const handleSaveGoogleSheetsSettings = async event => {
    event.preventDefault();
    setStockSettingsErrorSection('');
    setStockSettingsErrorField('');
    if (
      stockSource === 'google_sheets' &&
      !googleSheetUrl.trim().startsWith('https://docs.google.com/spreadsheets/')
    ) {
      setStockSettingsErrorSection('source');
      setStockSettingsErrorField('google-sheet-url');
      setSettingsError('Inserisci un URL Google Sheets valido.');
      return;
    }
    if (stockSource === 'google_sheets' && !googleSheetName.trim()) {
      setStockSettingsErrorSection('source');
      setStockSettingsErrorField('google-sheet-name');
      setSettingsError('Inserisci il nome del foglio Google Sheets.');
      return;
    }
    if (
      stockSource === 'google_sheets'
      && (Number(googleSheetSyncInterval) < 1 || Number(googleSheetSyncInterval) > 1440)
    ) {
      setStockSettingsErrorSection('source');
      setStockSettingsErrorField('google-sheet-interval');
      setSettingsError(
        "L'intervallo verifica Google Sheets deve essere compreso tra 1 e 1440 minuti.",
      );
      return;
    }
    if (!mappingSku.trim() || !mappingQty.trim()) {
      setStockSettingsErrorSection('mapping');
      setStockSettingsErrorField(!mappingSku.trim() ? 'mapping-sku' : 'mapping-qty');
      setSettingsError('Le colonne SKU e Quantità sono obbligatorie.');
      return;
    }
    const normalizedLotKeywords = excludedLotKeywords
      .split(',')
      .map(keyword => keyword.trim())
      .filter(Boolean);
    if (excludeReturnLots && normalizedLotKeywords.length === 0) {
      setStockSettingsErrorSection('mapping');
      setStockSettingsErrorField('excluded-lot-keywords');
      setSettingsError('Inserisci almeno una parola per i lotti esclusi.');
      return;
    }
    if (pickingSheetWriteEnabled) {
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(
        pickingSheetWebappUrl.trim(),
      )) {
        setStockSettingsErrorSection('writeback');
        setStockSettingsErrorField('picking-sheet-webapp-url');
        setSettingsError("Inserisci l'URL /exec della Web App Apps Script.");
        return;
      }
      if (!pickingSheetSecretConfigured && pickingSheetSharedSecret.length < 32) {
        setStockSettingsErrorSection('writeback');
        setStockSettingsErrorField('picking-sheet-secret');
        setSettingsError('Configura un secret Apps Script di almeno 32 caratteri.');
        return;
      }
      if (!pickingSheetRemainingHeader.trim()) {
        setStockSettingsErrorSection('writeback');
        setStockSettingsErrorField('picking-sheet-remaining-header');
        setSettingsError('Configura il nome della colonna residuo.');
        return;
      }
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
          exclude_return_lots: excludeReturnLots,
          excluded_lot_keywords: normalizedLotKeywords,
          picking_sheet_write_enabled: pickingSheetWriteEnabled,
          picking_sheet_webapp_url: pickingSheetWebappUrl.trim(),
          picking_sheet_remaining_header: pickingSheetRemainingHeader.trim(),
          ...(pickingSheetSharedSecret
            ? { picking_sheet_shared_secret: pickingSheetSharedSecret }
            : {}),
          picking_sheet_day_mapping: pickingSheetDayMapping,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setStockSettingsErrorSection('');
        setStockSettingsErrorField('');
        setPickingSheetSecretConfigured(Boolean(
          data.picking_sheet_shared_secret_configured,
        ));
        setPickingSheetSharedSecret('');
        showActionMsg('Impostazioni giacenze salvate con successo.');
        refresh();
      } else {
        setStockSettingsErrorSection('save');
        setStockSettingsErrorField('');
        setSettingsError(data.detail || 'Errore nel salvataggio delle impostazioni.');
      }
    } catch (error) {
      console.error(error);
      setStockSettingsErrorSection('save');
      setStockSettingsErrorField('');
      setSettingsError(
        'Connessione interrotta durante il salvataggio. Controlla la rete e riprova.',
      );
    } finally {
      setSavingStockSettings(false);
    }
  };

  const generatePickingSheetSecret = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    setPickingSheetSharedSecret(
      Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''),
    );
  };

  const handleTestPickingSheetConnection = async () => {
    setStockSettingsErrorSection('');
    setStockSettingsErrorField('');
    setPickingSheetTesting(true);
    setSettingsError(null);
    try {
      const response = await apiFetch('/api/picking/sheet-write/test', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        setStockSettingsErrorSection('writeback');
        setStockSettingsErrorField('');
        setSettingsError(data.detail || 'Collegamento Apps Script non riuscito.');
        return;
      }
      showActionMsg(
        `Apps Script collegato al foglio ${data.sheet_name}. Nessuna cella modificata.`,
      );
    } catch (error) {
      setStockSettingsErrorSection('writeback');
      setStockSettingsErrorField('');
      setSettingsError(`Errore di connessione Apps Script: ${error.message}`);
    } finally {
      setPickingSheetTesting(false);
    }
  };

  const handleSyncGoogleSheetsNow = async () => {
    setStockSettingsErrorSection('');
    setStockSettingsErrorField('');
    setSyncingGoogleSheets(true);
    setSyncingStock(true);
    setSettingsError(null);
    try {
      const response = await apiFetch('/api/settings/google-sheets/sync', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setGoogleSheetsSyncSuccessKey(key => key + 1);
        showActionMsg(
          data.status === 'skipped'
            ? 'Nessuna modifica rilevata nel Google Sheet. Giacenze già aggiornate.'
            : `Sincronizzazione completata! Importate ${data.records_imported} SKU.`,
          data.status === 'skipped' ? 'warning' : 'success',
        );
        refresh();
      } else {
        setStockSettingsErrorSection('source');
        setStockSettingsErrorField('');
        setSettingsError(
          data.detail || 'Errore durante la sincronizzazione con Google Sheets.',
        );
      }
    } catch (error) {
      setStockSettingsErrorSection('source');
      setStockSettingsErrorField('');
      console.error(error);
      setSettingsError('Errore durante la connessione per la sincronizzazione.');
    } finally {
      setSyncingStock(false);
      setSyncingGoogleSheets(false);
    }
  };

  return {
    excludeReturnLots,
    excludedLotKeywords,
    googleSheetLastError,
    googleSheetLastSync,
    googleSheetName,
    googleSheetSyncInterval,
    googleSheetUrl,
    googleSheetsSyncSuccessKey,
    handleSaveGoogleSheetsSettings,
    handleSyncGoogleSheetsNow,
    mappingDesc,
    mappingLotto,
    mappingQty,
    mappingSku,
    generatePickingSheetSecret,
    handleTestPickingSheetConnection,
    pickingSheetDayMapping,
    pickingSheetSecretConfigured,
    pickingSheetSharedSecret,
    pickingSheetRemainingHeader,
    pickingSheetTesting,
    pickingSheetWebappUrl,
    pickingSheetWriteEnabled,
    resetStockSettings,
    savingStockSettings,
    setGoogleSheetName,
    setGoogleSheetSyncInterval,
    setGoogleSheetUrl,
    setMappingDesc,
    setMappingLotto,
    setMappingQty,
    setMappingSku,
    setPickingSheetDayMapping,
    setPickingSheetSharedSecret,
    setPickingSheetRemainingHeader,
    setPickingSheetWebappUrl,
    setPickingSheetWriteEnabled,
    setExcludeReturnLots,
    setExcludedLotKeywords,
    setStockSource,
    setSyncingGoogleSheets,
    stockSource,
    stockSettingsErrorSection,
    stockSettingsErrorField,
    stockSettingsDirty,
    syncingGoogleSheets,
  };
}
