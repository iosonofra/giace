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
