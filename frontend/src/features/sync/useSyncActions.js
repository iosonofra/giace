import { apiFetch } from '../../api/client';
import { useDataImportActions } from './useDataImportActions';
import { useSyncStatusPolling } from './useSyncStatusPolling';

export function useSyncActions({
  refresh,
  selectedSheet,
  setLoading,
  setSyncingGoogleSheets,
  setSyncingOrders,
  setSyncingStock,
  setSyncProgressText,
  showActionMsg,
  stockSource,
}) {
  const { startStatusPolling, stopStatusPolling } = useSyncStatusPolling({
    setSyncProgressText,
  });
  const { handleFileUpload, handleLocalImport } = useDataImportActions({
    refresh,
    selectedSheet,
    setLoading,
    setSyncingStock,
    showActionMsg,
  });

  const handleSyncOrders = async () => {
    setLoading(true);
    setSyncingOrders(true);
    startStatusPolling();
    try {
      const response = await apiFetch('/api/prestashop/sync-orders', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        showActionMsg(
          `Sincronizzati ${data.orders_synced} ordini con successo! (Mode: ${data.mock_mode ? 'MOCK' : 'REAL'})`,
        );
        refresh();
      } else {
        showActionMsg(
          `Errore sincronizzazione ordini: ${data.detail}`,
          'danger',
        );
      }
    } catch (error) {
      showActionMsg(`Errore nel sync: ${error.message}`, 'danger');
    } finally {
      stopStatusPolling();
      setSyncingOrders(false);
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setLoading(true);
    setSyncingOrders(true);
    if (stockSource === 'google_sheets') {
      setSyncingStock(true);
      setSyncingGoogleSheets(true);
    }
    startStatusPolling();

    try {
      if (stockSource === 'google_sheets') {
        const stockResponse = await apiFetch(
          '/api/settings/google-sheets/sync',
          { method: 'POST' },
        );
        const stockResult = await stockResponse.json();
        if (!stockResponse.ok) {
          showActionMsg(
            `Errore sincronizzazione Google Sheets: ${stockResult.detail}`,
            'danger',
          );
          return;
        }
        setSyncingStock(false);
        setSyncingGoogleSheets(false);
      }

      const ordersResponse = await apiFetch('/api/prestashop/sync-orders', {
        method: 'POST',
      });
      const ordersResult = await ordersResponse.json();
      if (ordersResponse.ok) {
        showActionMsg(
          stockSource === 'google_sheets'
            ? `Sincronizzazione completata! Giacenze Google Sheets aggiornate e sincronizzati ${ordersResult.orders_synced} ordini PrestaShop.`
            : `Sincronizzazione completata! Sincronizzati ${ordersResult.orders_synced} ordini PrestaShop. Le giacenze fisiche rimangono quelle del file Excel locale.`,
        );
        refresh();
      } else {
        showActionMsg(
          `Errore sincronizzazione ordini: ${ordersResult.detail}`,
          'danger',
        );
      }
    } catch (error) {
      showActionMsg(
        `Errore durante la sincronizzazione: ${error.message}`,
        'danger',
      );
    } finally {
      stopStatusPolling();
      setSyncingStock(false);
      setSyncingGoogleSheets(false);
      setSyncingOrders(false);
      setLoading(false);
    }
  };

  const handleRunCalculation = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/calc/run', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        showActionMsg(
          `Ricalcolo completato con successo (Run ID: ${data.calc_run_id})!`,
        );
        refresh();
      } else {
        showActionMsg(`Errore ricalcolo: ${data.detail}`, 'danger');
      }
    } catch (error) {
      showActionMsg(`Errore ricalcolo: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return {
    handleFileUpload,
    handleLocalImport,
    handleRunCalculation,
    handleSyncAll,
    handleSyncOrders,
  };
}
