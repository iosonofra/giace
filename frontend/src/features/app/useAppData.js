import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../api/client';

export function useAppData({ notify }) {
  const [status, setStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [availableSheets, setAvailableSheets] = useState(['ROSATE']);
  const [selectedSheet, setSelectedSheet] = useState('ROSATE');
  const [configuredStockSource, setConfiguredStockSource] =
    useState('local_upload');
  const notifyRef = useRef(notify);
  const initialLoadStartedRef = useRef(false);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const refreshAppData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusResponse, dashboardResponse, settingsResponse] =
        await Promise.all([
          apiFetch('/api/status'),
          apiFetch('/api/dashboard'),
          apiFetch('/api/settings'),
        ]);
      const [nextStatus, nextDashboard] = await Promise.all([
        statusResponse.json(),
        dashboardResponse.json(),
      ]);

      setStatus(nextStatus);
      setDashboardData(nextDashboard);

      if (settingsResponse.ok) {
        const currentSettings = await settingsResponse.json();
        setConfiguredStockSource(
          currentSettings.stock_source || 'local_upload',
        );
      }

      if (nextStatus.local_files?.giacenza_exists) {
        try {
          const sheetsResponse = await apiFetch('/api/import/sheets');
          const sheetsData = await sheetsResponse.json();
          if (sheetsData.sheets) {
            setAvailableSheets(sheetsData.sheets);
            if (
              sheetsData.sheets.includes('ROSATE') &&
              !nextStatus.active_warehouse_batch
            ) {
              setSelectedSheet('ROSATE');
            } else if (nextStatus.active_warehouse_batch?.sheet_name) {
              setSelectedSheet(nextStatus.active_warehouse_batch.sheet_name);
            }
          }
        } catch (error) {
          console.error('Sheets loading failed', error);
        }
      }
    } catch (error) {
      console.error(error);
      notifyRef.current?.('Errore nel recupero dei dati del server.', 'danger');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    refreshAppData();
  }, [refreshAppData]);

  return {
    availableSheets,
    configuredStockSource,
    dashboardData,
    initialized,
    loading,
    refreshAppData,
    selectedSheet,
    setLoading,
    setSelectedSheet,
    status,
  };
}
