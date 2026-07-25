import { useEffect, useState } from 'react';

import { apiFetch } from '../../api/client';
import { deriveConnectionStatus } from './settingsPresentation';


export function useConnectionSettings({
  currentSettings,
  refresh,
  setOrderStates,
  setSettingsError,
  showActionMsg,
}) {
  const [prestashopUrl, setPrestashopUrl] = useState('');
  const [prestashopAdminUrl, setPrestashopAdminUrl] = useState('');
  const [prestashopApiKey, setPrestashopApiKey] = useState('');
  const [prestashopMockMode, setPrestashopMockMode] = useState(true);
  const [prestashopSyncInterval, setPrestashopSyncInterval] = useState(10);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingConnectionSettings, setSavingConnectionSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState(null);

  useEffect(() => {
    if (!currentSettings) return;
    setPrestashopUrl(currentSettings.prestashop_url || '');
    setPrestashopAdminUrl(currentSettings.prestashop_admin_url || '');
    setPrestashopApiKey(currentSettings.prestashop_api_key || '');
    setPrestashopMockMode(currentSettings.prestashop_mock_mode !== false);
    setPrestashopSyncInterval(currentSettings.prestashop_sync_interval || 10);
  }, [currentSettings]);

  const status = deriveConnectionStatus({
    prestashopApiKey,
    prestashopMockMode,
    prestashopUrl,
  });

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestConnectionResult(null);
    try {
      const response = await apiFetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestashop_url: prestashopUrl,
          prestashop_api_key: prestashopApiKey,
          prestashop_mock_mode: prestashopMockMode,
        }),
      });
      const data = await response.json();
      setTestConnectionResult(response.ok
        ? { status: 'success', message: data.message }
        : { status: 'error', message: data.detail || 'Connessione fallita.' });
    } catch (error) {
      console.error(error);
      setTestConnectionResult({ status: 'error', message: 'Errore di connessione.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConnectionSettings = async event => {
    event.preventDefault();
    if (!prestashopMockMode && !status.prestashopUrlValid) {
      setSettingsError("L'URL API PrestaShop deve terminare con /api/.");
      return;
    }
    if (!prestashopMockMode && !prestashopApiKey.trim()) {
      setSettingsError(
        'Inserisci la chiave API Webservice oppure abilita la modalità simulazione.',
      );
      return;
    }
    if (Number(prestashopSyncInterval) < 1) {
      setSettingsError(
        "L'intervallo sincronizzazione ordini deve essere almeno 1 minuto.",
      );
      return;
    }

    setSavingConnectionSettings(true);
    setSettingsError(null);
    try {
      const response = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestashop_url: prestashopUrl,
          prestashop_admin_url: prestashopAdminUrl,
          prestashop_api_key: prestashopApiKey,
          prestashop_mock_mode: prestashopMockMode,
          prestashop_sync_interval: prestashopSyncInterval,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showActionMsg('Impostazioni di connessione salvate con successo.');
        refresh();
        const statesResponse = await apiFetch('/api/order-states');
        setOrderStates(await statesResponse.json());
      } else {
        setSettingsError(data.detail || 'Errore sconosciuto durante il salvataggio.');
      }
    } catch (error) {
      console.error(error);
      setSettingsError('Errore di rete durante il salvataggio.');
    } finally {
      setSavingConnectionSettings(false);
    }
  };

  return {
    ...status,
    handleSaveConnectionSettings,
    handleTestConnection,
    prestashopApiKey,
    prestashopMockMode,
    prestashopSyncInterval,
    prestashopUrl,
    savingConnectionSettings,
    setPrestashopApiKey,
    setPrestashopMockMode,
    setPrestashopSyncInterval,
    setPrestashopUrl,
    setShowApiKey,
    showApiKey,
    testConnectionResult,
    testingConnection,
  };
}
