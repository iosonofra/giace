import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api/client';

const ORDER_ID_PATTERN = /\b\d{4,8}\b/g;

function extractOrderIds(rawText) {
  const matches = rawText.match(ORDER_ID_PATTERN) || [];
  return Array.from(new Set(matches.map(Number)));
}

export function usePickingCore({ showActionMsg }) {
  const [rawPickingText, setRawPickingText] = useState('');
  const [pickingResults, setPickingResults] = useState(null);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [pickingError, setPickingError] = useState(null);
  const [pickingInputMode, setPickingInputMode] = useState('text');
  const [selectedPickingFiles, setSelectedPickingFiles] = useState([]);
  const [pickingFilesAnomalies, setPickingFilesAnomalies] = useState([]);
  const [pickingFilesSummary, setPickingFilesSummary] = useState([]);
  const [pickingViewMode, setPickingViewMode] = useState('aggregated');
  const [pickingRequirementFilter, setPickingRequirementFilter] = useState('all');
  const [pickingCountingMode, setPickingCountingMode] = useState(false);
  const [countedPickingSkus, setCountedPickingSkus] = useState(() => new Set());
  const [syncingSpecificOrders, setSyncingSpecificOrders] = useState(false);

  useEffect(() => {
    setCountedPickingSkus(new Set());
    setPickingCountingMode(false);
  }, [pickingResults]);

  const detectedPickingOrderCount = useMemo(
    () => new Set(rawPickingText.match(ORDER_ID_PATTERN) || []).size,
    [rawPickingText],
  );

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

  const togglePickingCountingMode = () => {
    setPickingCountingMode((current) => {
      if (current) setCountedPickingSkus(new Set());
      return !current;
    });
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
    handleSyncSpecificOrders,
    handleUploadPickingFiles,
    pickingCountingMode,
    pickingError,
    pickingFilesAnomalies,
    pickingFilesSummary,
    pickingInputMode,
    pickingLoading,
    pickingRequirementFilter,
    pickingResults,
    pickingViewMode,
    rawPickingText,
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
    syncingSpecificOrders,
    togglePickingCountingMode,
    togglePickingSkuCounted,
  };
}
