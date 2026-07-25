import { useEffect, useRef } from 'react';

import { apiFetch } from '../../api/client';


export function useSyncStatusPolling({ setSyncProgressText }) {
  const intervalRef = useRef(null);

  const stopStatusPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSyncProgressText('');
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startStatusPolling = () => {
    stopStatusPolling();
    setSyncProgressText('Inizializzazione...');
    intervalRef.current = setInterval(async () => {
      try {
        const response = await apiFetch('/api/prestashop/sync-status');
        if (!response.ok) return;
        const status = await response.json();
        if (!status.active) return;

        if (status.phase === 'fetching_orders') {
          setSyncProgressText(
            status.total_orders > 0
              ? `Sincronizzazione ordini... (${status.synced_orders}/${status.total_orders})`
              : 'Scaricamento ordini...',
          );
        } else if (status.phase === 'saving') {
          setSyncProgressText('Salvataggio nel database...');
        } else if (status.phase === 'calculating') {
          setSyncProgressText('Ricalcolo giacenze...');
        } else {
          setSyncProgressText('Sincronizzazione in corso...');
        }
      } catch (error) {
        console.error('Errore nel polling dello stato sync:', error);
      }
    }, 1000);
  };

  return { startStatusPolling, stopStatusPolling };
}
