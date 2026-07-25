import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import {
  getAnomalyMeta,
  getAnomalySourceLabel,
  getAnomalyTypeLabel,
} from './anomalyMetadata';

export function useAnomaliesData({
  active,
  refresh,
  refreshKey,
  setTabLoading,
  showActionMsg,
}) {
  const [anomaliesPage, setAnomaliesPage] = useState(1);
  const [anomaliesLimit] = useState(50);
  const [anomalySearch, setAnomalySearch] = useState('');
  const [anomalySourceFilter, setAnomalySourceFilter] = useState('all');
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState('all');
  const [anomalyOrderStateFilter, setAnomalyOrderStateFilter] = useState('all');
  const [anomalyOnlyActionable, setAnomalyOnlyActionable] = useState(false);
  const [anomalyData, setAnomalyData] = useState([]);
  const [showClearAnomaliesConfirm, setShowClearAnomaliesConfirm] = useState(false);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    setTabLoading(true);
    apiFetch('/api/anomalies')
      .then(response => response.json())
      .then(data => {
        if (!cancelled) setAnomalyData(data || []);
      })
      .catch(error => {
        if (!cancelled) console.error(error);
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, refreshKey, setTabLoading]);

  useEffect(() => {
    setAnomaliesPage(1);
  }, [
    anomalyData.length,
    anomalyOnlyActionable,
    anomalyOrderStateFilter,
    anomalySearch,
    anomalySourceFilter,
    anomalyTypeFilter,
  ]);

  const handleClearAnomalies = () => {
    setShowClearAnomaliesConfirm(true);
  };

  const executeClearAnomalies = async () => {
    setShowClearAnomaliesConfirm(false);
    try {
      const response = await apiFetch('/api/anomalies/clear', { method: 'POST' });
      if (!response.ok) return;

      setAnomalyData([]);
      showActionMsg('Registro anomalie svuotato.');
      refresh();
    } catch (error) {
      console.error(error);
      showActionMsg('Errore durante la pulizia del registro.', 'danger');
    }
  };

  const handleExportAnomaliesCsv = rows => {
    const headers = [
      'Origine',
      'Oggetto',
      'Nome prodotto',
      'ID ordine',
      'Stato ordine',
      'Problema',
      'Gravita',
      'Dettaglio',
      'Rilevata il',
    ];
    const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(anomaly => {
      const meta = getAnomalyMeta(anomaly);
      return [
        meta.sourceLabel,
        anomaly.record_key || '',
        anomaly.product_name || '',
        anomaly.order_id || '',
        anomaly.current_state_label || '',
        meta.typeLabel,
        meta.severityLabel,
        anomaly.message || '',
        anomaly.created_at
          ? new Date(anomaly.created_at).toLocaleString('it-IT')
          : '-',
      ].map(escapeCell).join(',');
    });
    const csv = [headers.map(escapeCell).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro-anomalie-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    anomaliesLimit,
    anomaliesPage,
    anomalyData,
    anomalyOnlyActionable,
    anomalyOrderStateFilter,
    anomalySearch,
    anomalySourceFilter,
    anomalyTypeFilter,
    executeClearAnomalies,
    getAnomalyMeta,
    getAnomalySourceLabel,
    getAnomalyTypeLabel,
    handleClearAnomalies,
    handleExportAnomaliesCsv,
    setAnomaliesPage,
    setAnomalyOnlyActionable,
    setAnomalyOrderStateFilter,
    setAnomalySearch,
    setAnomalySourceFilter,
    setAnomalyTypeFilter,
    setShowClearAnomaliesConfirm,
    showClearAnomaliesConfirm,
  };
}
