import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../../api/client';

const ORDER_ID_PATTERN = /\b\d{4,8}\b/g;

function extractOrderIds(rawText) {
  const matches = rawText.match(ORDER_ID_PATTERN) || [];
  return Array.from(new Set(matches.map(Number)));
}

function getPickingProgressKey(results) {
  if (!results?.sku_requirements?.length) return null;
  const signature = JSON.stringify({
    mode: results.mode || 'standard',
    orders: [...(results.orders_found || [])].map(String).sort(),
    requirements: results.sku_requirements.map(item => [
      String(item.sku || ''),
      Number(item.qty_required || 0),
      Number(item.qty_stock || 0),
    ]),
  });
  let hash = 2166136261;
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `giac:picking-progress:${(hash >>> 0).toString(36)}`;
}

export function usePickingCore({ showActionMsg }) {
  const [rawPickingText, setRawPickingText] = useState('');
  const [pickingResults, setPickingResults] = useState(null);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [pickingError, setPickingError] = useState(null);
  const [pickingInputMode, setPickingInputMode] = useState('text');
  const [selectedPickingFiles, setSelectedPickingFiles] = useState([]);
  const [pickingOrderStates, setPickingOrderStates] = useState([]);
  const [selectedPickingStateId, setSelectedPickingStateId] = useState('');
  const [pickingStatesLoading, setPickingStatesLoading] = useState(false);
  const [pickingStatesError, setPickingStatesError] = useState(null);
  const [pickingFilesAnomalies, setPickingFilesAnomalies] = useState([]);
  const [pickingFilesSummary, setPickingFilesSummary] = useState([]);
  const [pickingViewMode, setPickingViewMode] = useState('aggregated');
  const [gaerFile, setGaerFile] = useState(null);
  const [gaerStates, setGaerStates] = useState([]);
  const [selectedGaerStateIds, setSelectedGaerStateIds] = useState([]);
  const [gaerStatesLoading, setGaerStatesLoading] = useState(false);
  const [gaerStatesError, setGaerStatesError] = useState('');
  const [gaerColumns, setGaerColumns] = useState([]);
  const [gaerMappingRequired, setGaerMappingRequired] = useState(false);
  const [gaerEanColumn, setGaerEanColumn] = useState('');
  const [gaerQuantityColumn, setGaerQuantityColumn] = useState('');
  const [gaerHeaderRow, setGaerHeaderRow] = useState(null);
  const [gaerExporting, setGaerExporting] = useState(false);
  const [gaerExportError, setGaerExportError] = useState('');
  const [pickingRequirementFilter, setPickingRequirementFilter] = useState('all');
  const [pickingCountingMode, setPickingCountingMode] = useState(false);
  const [countedPickingSkus, setCountedPickingSkus] = useState(() => new Set());
  const [syncingSpecificOrders, setSyncingSpecificOrders] = useState(false);
  const skipProgressPersistRef = useRef(null);

  const pickingProgressKey = useMemo(
    () => getPickingProgressKey(pickingResults),
    [pickingResults],
  );

  useEffect(() => {
    skipProgressPersistRef.current = pickingProgressKey;
    if (!pickingProgressKey || typeof window === 'undefined') {
      setCountedPickingSkus(new Set());
      setPickingCountingMode(false);
      return;
    }
    try {
      const validSkus = new Set(
        (pickingResults?.sku_requirements || []).map(item => String(item.sku)),
      );
      const stored = JSON.parse(window.localStorage.getItem(pickingProgressKey) || '[]');
      const restored = new Set(
        Array.isArray(stored) ? stored.map(String).filter(sku => validSkus.has(sku)) : [],
      );
      setCountedPickingSkus(restored);
      setPickingCountingMode(restored.size > 0);
    } catch {
      setCountedPickingSkus(new Set());
      setPickingCountingMode(false);
    }
  }, [pickingProgressKey, pickingResults]);

  useEffect(() => {
    if (!pickingProgressKey || typeof window === 'undefined') return;
    if (skipProgressPersistRef.current === pickingProgressKey) {
      skipProgressPersistRef.current = null;
      return;
    }
    try {
      window.localStorage.setItem(
        pickingProgressKey,
        JSON.stringify(Array.from(countedPickingSkus)),
      );
    } catch {
      // Il conteggio resta disponibile nella sessione anche se lo storage è bloccato.
    }
  }, [countedPickingSkus, pickingProgressKey]);

  const detectedPickingOrderCount = useMemo(
    () => new Set(rawPickingText.match(ORDER_ID_PATTERN) || []).size,
    [rawPickingText],
  );

  const loadPickingOrderStates = useCallback(async () => {
    setPickingStatesLoading(true);
    setPickingStatesError(null);
    try {
      const response = await apiFetch('/api/orders/available-states');
      const data = await response.json();
      if (!response.ok) {
        setPickingStatesError(
          data.detail || 'Impossibile caricare gli stati ordine.',
        );
        return;
      }
      const nextStates = data.states || [];
      setPickingOrderStates(nextStates);
      setSelectedPickingStateId(current => (
        nextStates.some(state => String(state.id) === String(current))
          ? current
          : ''
      ));
    } catch (error) {
      setPickingStatesError(`Errore di connessione: ${error.message}`);
    } finally {
      setPickingStatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pickingInputMode !== 'state' || pickingOrderStates.length > 0) return;
    loadPickingOrderStates();
  }, [loadPickingOrderStates, pickingInputMode, pickingOrderStates.length]);

  const loadGaerStates = useCallback(async () => {
    setGaerStatesLoading(true);
    setGaerStatesError('');
    try {
      const response = await apiFetch('/api/gaer/states');
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Stati Gaer non disponibili.');
      setGaerStates(data.states || []);
      setSelectedGaerStateIds(current => (
        current.length > 0 ? current : (data.selected_state_ids || []).map(Number)
      ));
    } catch (loadError) {
      setGaerStatesError(loadError.message || 'Stati Gaer non disponibili.');
    } finally {
      setGaerStatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pickingInputMode !== 'gaer' || gaerStates.length > 0) return;
    loadGaerStates();
  }, [gaerStates.length, loadGaerStates, pickingInputMode]);

  const selectGaerFile = (file) => {
    setGaerFile(file);
    setGaerColumns([]);
    setGaerMappingRequired(false);
    setGaerEanColumn('');
    setGaerQuantityColumn('');
    setGaerHeaderRow(null);
    setGaerExportError('');
    setPickingError(null);
  };

  const toggleGaerState = (stateId) => {
    setSelectedGaerStateIds(current => (
      current.includes(stateId)
        ? current.filter(id => id !== stateId)
        : [...current, stateId]
    ));
    setPickingResults(null);
    setPickingError(null);
  };

  const handleAnalyzeGaer = async (event) => {
    event?.preventDefault();
    if (!gaerFile || selectedGaerStateIds.length === 0) {
      setPickingError('Seleziona il file Gaer e almeno uno stato ordine.');
      return;
    }
    setPickingLoading(true);
    setPickingError(null);
    setGaerExportError('');
    const formData = new FormData();
    formData.append('file', gaerFile);
    formData.append('state_ids', JSON.stringify(selectedGaerStateIds));
    if (gaerEanColumn) formData.append('ean_column', gaerEanColumn);
    if (gaerQuantityColumn) formData.append('quantity_column', gaerQuantityColumn);
    if (gaerHeaderRow) formData.append('header_row', String(gaerHeaderRow));
    try {
      const response = await apiFetch('/api/gaer/analyze', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Analisi Gaer non riuscita.');
      if (data.mapping_required) {
        setGaerColumns(data.columns || []);
        setGaerMappingRequired(true);
        setGaerHeaderRow(data.header_row || null);
        setGaerEanColumn(data.suggested_mapping?.ean || '');
        setGaerQuantityColumn(data.suggested_mapping?.quantity || '');
        return;
      }
      setGaerMappingRequired(false);
      setPickingResults(data);
      setPickingViewMode('by_order');
      setPickingRequirementFilter('all');
      setPickingFilesAnomalies((data.gaer?.file_warnings || []).map(item => ({
        record_key: item.ean || `Riga ${item.row}`,
        message: item.message,
      })));
      setPickingFilesSummary([{
        filename: data.gaer?.filename || gaerFile.name,
        rows_count: data.gaer?.parsed_rows || 0,
      }]);
    } catch (analysisError) {
      setPickingError(analysisError.message || 'Analisi Gaer non riuscita.');
    } finally {
      setPickingLoading(false);
    }
  };

  const handleExportGaer = async () => {
    if (!gaerFile || pickingResults?.mode !== 'gaer') return;

    const allocations = {};
    for (const order of pickingResults.order_requirements || []) {
      const orderId = Number(order.order_id);
      if (!Number.isInteger(orderId) || orderId <= 0) continue;
      for (const item of order.items || []) {
        const ean = String(item.ean || item.sku || '').trim();
        const quantity = Number(item.qty_required || 0);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          setGaerExportError(
            `La quantità proposta per l'EAN ${ean || 'non identificato'} non è intera.`,
          );
          return;
        }
        if (!allocations[ean]) allocations[ean] = [];
        for (let unit = 0; unit < quantity; unit += 1) {
          allocations[ean].push(orderId);
        }
      }
    }

    const gaerMetadata = pickingResults.gaer || {};
    const mapping = gaerMetadata.mapping || {};
    if (
      Object.keys(allocations).length === 0
      || !mapping.ean
      || !mapping.quantity
      || !gaerMetadata.header_row
    ) {
      setGaerExportError('I dati dell’analisi Gaer non sono completi. Ripeti il calcolo.');
      return;
    }

    setGaerExporting(true);
    setGaerExportError('');
    const formData = new FormData();
    formData.append('file', gaerFile);
    formData.append('allocations', JSON.stringify(allocations));
    formData.append('ean_column', mapping.ean);
    formData.append('quantity_column', mapping.quantity);
    formData.append('header_row', String(gaerMetadata.header_row));
    if (gaerMetadata.sheet_name) formData.append('sheet_name', gaerMetadata.sheet_name);

    try {
      const response = await apiFetch('/api/gaer/export', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Esportazione del file Gaer non riuscita.');
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = gaerFile.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
      showActionMsg('File Gaer esportato con gli ID degli ordini proposti.');
    } catch (exportError) {
      setGaerExportError(exportError.message || 'Esportazione del file Gaer non riuscita.');
    } finally {
      setGaerExporting(false);
    }
  };

  const handleCalculatePicking = async (event) => {
    event?.preventDefault();
    if (!rawPickingText.trim()) {
      setPickingError('Inserisci o incolla del testo contenente gli ID ordine da analizzare.');
      return;
    }

    const orderIds = extractOrderIds(rawPickingText);
    if (orderIds.length === 0) {
      setPickingError('Nessun ID ordine valido (numero da 4 a 8 cifre) trovato nel testo incollato.');
      return;
    }

    setPickingLoading(true);
    setPickingError(null);
    try {
      const response = await apiFetch('/api/orders/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds }),
      });
      const data = await response.json();
      if (response.ok) {
        setPickingResults(data);
        setPickingRequirementFilter('all');
      } else {
        setPickingError(data.detail || "Errore durante l'elaborazione del fabbisogno.");
      }
    } catch (error) {
      setPickingError(`Errore di connessione: ${error.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const handleUploadPickingFiles = async (event) => {
    event?.preventDefault();
    if (selectedPickingFiles.length === 0) {
      setPickingError('Seleziona almeno un file Excel da caricare.');
      return;
    }

    setPickingLoading(true);
    setPickingError(null);
    setPickingFilesAnomalies([]);
    setPickingFilesSummary([]);

    const formData = new FormData();
    selectedPickingFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await apiFetch('/api/orders/analyze-files', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setPickingResults({
          orders_found: data.orders_found,
          orders_missing: data.orders_missing,
          sku_requirements: data.sku_requirements,
          order_requirements: data.order_requirements,
        });
        setPickingRequirementFilter('all');
        setPickingFilesAnomalies(data.anomalies || []);
        setPickingFilesSummary(data.files_processed || []);
      } else {
        setPickingError(data.detail || "Errore durante l'elaborazione del file di prelievo.");
      }
    } catch (error) {
      setPickingError(`Errore di connessione: ${error.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const handleCalculatePickingState = async (event) => {
    event?.preventDefault();
    if (!selectedPickingStateId) {
      setPickingError('Seleziona lo stato degli ordini da importare.');
      return;
    }

    setPickingLoading(true);
    setPickingError(null);
    setPickingFilesAnomalies([]);
    setPickingFilesSummary([]);
    try {
      const response = await apiFetch('/api/orders/analyze-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state_id: Number(selectedPickingStateId) }),
      });
      const data = await response.json();
      if (response.ok) {
        setPickingResults(data);
        setPickingRequirementFilter('all');
        if (data.source_state) {
          setPickingOrderStates(current => current.map(state => (
            String(state.id) === String(data.source_state.id)
              ? { ...state, ...data.source_state }
              : state
          )));
        }
      } else {
        setPickingError(
          data.detail || "Errore durante l'importazione degli ordini.",
        );
      }
    } catch (error) {
      setPickingError(`Errore di connessione: ${error.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const togglePickingSkuCounted = (sku) => {
    if (!pickingCountingMode || !sku) return;
    setCountedPickingSkus((current) => {
      const next = new Set(current);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const clearCountedPickingSkus = () => setCountedPickingSkus(new Set());

  const resetPickingOperation = useCallback(() => {
    if (pickingProgressKey && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(pickingProgressKey);
      } catch {
        // Il reset dell'interfaccia prosegue anche se lo storage non è disponibile.
      }
    }
    setRawPickingText('');
    setSelectedPickingFiles([]);
    setSelectedPickingStateId('');
    setGaerFile(null);
    setSelectedGaerStateIds([]);
    setGaerColumns([]);
    setGaerMappingRequired(false);
    setGaerEanColumn('');
    setGaerQuantityColumn('');
    setGaerHeaderRow(null);
    setGaerExportError('');
    setGaerExporting(false);
    setPickingFilesAnomalies([]);
    setPickingFilesSummary([]);
    setPickingError(null);
    setPickingResults(null);
    setPickingViewMode('aggregated');
    setPickingRequirementFilter('all');
    setPickingCountingMode(false);
    setCountedPickingSkus(new Set());
  }, [pickingProgressKey]);

  const togglePickingCountingMode = () => {
    setPickingCountingMode(current => !current);
  };

  const handleSyncSpecificOrders = async () => {
    const missingOrderIds = pickingResults?.orders_missing || [];
    if (missingOrderIds.length === 0) return;

    setSyncingSpecificOrders(true);
    try {
      const response = await apiFetch('/api/prestashop/sync-specific-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: missingOrderIds }),
      });
      const data = await response.json();
      if (!response.ok) {
        showActionMsg(data.detail || 'Errore durante la sincronizzazione degli ordini.', 'danger');
        return;
      }

      showActionMsg(`Sincronizzati con successo ${data.orders_synced} ordini mancanti!`);
      const orderIds = extractOrderIds(rawPickingText);
      if (orderIds.length === 0) return;

      const analyzeResponse = await apiFetch('/api/orders/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds }),
      });
      const analyzeData = await analyzeResponse.json();
      if (analyzeResponse.ok) {
        setPickingResults(analyzeData);
        setPickingRequirementFilter('all');
      }
    } catch (error) {
      showActionMsg(`Errore di connessione: ${error.message}`, 'danger');
    } finally {
      setSyncingSpecificOrders(false);
    }
  };

  return {
    clearCountedPickingSkus,
    countedPickingSkus,
    detectedPickingOrderCount,
    handleCalculatePicking,
    handleCalculatePickingState,
    handleAnalyzeGaer,
    handleExportGaer,
    handleSyncSpecificOrders,
    handleUploadPickingFiles,
    pickingCountingMode,
    pickingError,
    pickingFilesAnomalies,
    pickingFilesSummary,
    pickingInputMode,
    pickingLoading,
    pickingOrderStates,
    pickingRequirementFilter,
    pickingResults,
    pickingStatesError,
    pickingStatesLoading,
    pickingViewMode,
    gaerFile,
    gaerStates,
    selectedGaerStateIds,
    gaerStatesLoading,
    gaerStatesError,
    gaerColumns,
    gaerMappingRequired,
    gaerExporting,
    gaerExportError,
    gaerEanColumn,
    gaerQuantityColumn,
    loadGaerStates,
    selectGaerFile,
    toggleGaerState,
    setGaerEanColumn,
    setGaerQuantityColumn,
    rawPickingText,
    resetPickingOperation,
    selectedPickingFiles,
    setPickingError,
    setPickingFilesAnomalies,
    setPickingFilesSummary,
    setPickingInputMode,
    setPickingLoading,
    setPickingRequirementFilter,
    setPickingResults,
    setPickingViewMode,
    setRawPickingText,
    setSelectedPickingFiles,
    selectedPickingStateId,
    setSelectedPickingStateId,
    loadPickingOrderStates,
    syncingSpecificOrders,
    togglePickingCountingMode,
    togglePickingSkuCounted,
  };
}
