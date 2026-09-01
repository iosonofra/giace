import { useEffect, useMemo, useState } from 'react';

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
  const [testedConnectionFingerprint, setTestedConnectionFingerprint] = useState('');
  const [lastConnectionTestAt, setLastConnectionTestAt] = useState('');
  const [connectionSettingsErrorSection, setConnectionSettingsErrorSection] = useState('');
  const [connectionSettingsErrorField, setConnectionSettingsErrorField] = useState('');
  const [savedConnectionSettings, setSavedConnectionSettings] = useState(null);

  useEffect(() => {
    if (!currentSettings) return;
    setPrestashopUrl(currentSettings.prestashop_url || '');
    setPrestashopAdminUrl(currentSettings.prestashop_admin_url || '');
    setPrestashopApiKey(currentSettings.prestashop_api_key || '');
    setPrestashopMockMode(currentSettings.prestashop_mock_mode !== false);
    setPrestashopSyncInterval(currentSettings.prestashop_sync_interval || 10);
    setSavedConnectionSettings({
      apiKey: currentSettings.prestashop_api_key || '',
      mockMode: currentSettings.prestashop_mock_mode !== false,
      syncInterval: currentSettings.prestashop_sync_interval || 10,
      url: currentSettings.prestashop_url || '',
    });
    setConnectionSettingsErrorSection('');
    setConnectionSettingsErrorField('');
  }, [currentSettings]);

  const status = deriveConnectionStatus({
    prestashopApiKey,
    prestashopMockMode,
    prestashopUrl,
  });
  const connectionFingerprint = JSON.stringify([
    prestashopUrl.trim(),
    prestashopApiKey,
    prestashopMockMode,
  ]);
  const connectionTestStale = Boolean(
    testConnectionResult
    && testedConnectionFingerprint
    && testedConnectionFingerprint !== connectionFingerprint,
  );
  const connectionVerifiedForCurrentValues = Boolean(
    testConnectionResult?.status === 'success' && !connectionTestStale,
  );

  const connectionSettingsDirty = useMemo(() => {
    if (!savedConnectionSettings) return false;
    return (
      prestashopUrl !== savedConnectionSettings.url
      || prestashopApiKey !== savedConnectionSettings.apiKey
      || prestashopMockMode !== savedConnectionSettings.mockMode
      || Number(prestashopSyncInterval) !== Number(savedConnectionSettings.syncInterval)
    );
  }, [
    prestashopApiKey, prestashopMockMode, savedConnectionSettings,
    prestashopSyncInterval, prestashopUrl,
  ]);

  const resetConnectionSettings = () => {
    if (!savedConnectionSettings) return;
    setPrestashopUrl(savedConnectionSettings.url);
    setPrestashopApiKey(savedConnectionSettings.apiKey);
    setPrestashopMockMode(savedConnectionSettings.mockMode);
    setPrestashopSyncInterval(savedConnectionSettings.syncInterval);
    setTestConnectionResult(null);
    setTestedConnectionFingerprint('');
    setLastConnectionTestAt('');
    setConnectionSettingsErrorSection('');
    setConnectionSettingsErrorField('');
    setSettingsError(null);
  };

  const handleTestConnection = async () => {
    setConnectionSettingsErrorSection('');
    setConnectionSettingsErrorField('');
    setSettingsError(null);
    setTestingConnection(true);
    setTestConnectionResult(null);
    const testedFingerprint = connectionFingerprint;
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
      setTestedConnectionFingerprint(testedFingerprint);
      setLastConnectionTestAt(new Date().toISOString());
    } catch (error) {
      console.error(error);
      setTestConnectionResult({
        status: 'error',
        message: 'Il server Giacenza non è raggiungibile. Controlla la rete e riprova.',
      });
      setTestedConnectionFingerprint(testedFingerprint);
      setLastConnectionTestAt(new Date().toISOString());
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConnectionSettings = async event => {
    event.preventDefault();
    setConnectionSettingsErrorSection('');
    setConnectionSettingsErrorField('');
    if (!prestashopMockMode && !status.prestashopUrlValid) {
      setConnectionSettingsErrorSection('credentials');
      setConnectionSettingsErrorField('prestashop-api-url');
      setSettingsError("L'URL API PrestaShop deve terminare con /api/.");
      return;
    }
    if (!prestashopMockMode && !prestashopApiKey.trim()) {
      setConnectionSettingsErrorSection('credentials');
      setConnectionSettingsErrorField('prestashop-api-key');
      setSettingsError(
        'Inserisci la chiave API Webservice oppure abilita la modalità simulazione.',
      );
      return;
    }
    if (Number(prestashopSyncInterval) < 1 || Number(prestashopSyncInterval) > 1440) {
      setConnectionSettingsErrorSection('behavior');
      setConnectionSettingsErrorField('prestashop-sync-interval');
      setSettingsError(
        "L'intervallo sincronizzazione ordini deve essere compreso tra 1 e 1440 minuti.",
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
        setConnectionSettingsErrorSection('');
        setSavedConnectionSettings({
          apiKey: prestashopApiKey,
          mockMode: prestashopMockMode,
          syncInterval: prestashopSyncInterval,
          url: prestashopUrl,
        });
        if (!prestashopMockMode) {
          setTestConnectionResult({
            status: 'success',
            message: 'Connessione verificata durante il salvataggio.',
          });
          setTestedConnectionFingerprint(connectionFingerprint);
          setLastConnectionTestAt(new Date().toISOString());
        }
        showActionMsg('Impostazioni di connessione salvate con successo.');
        refresh();
        try {
          const statesResponse = await apiFetch('/api/order-states');
          if (statesResponse.ok) setOrderStates(await statesResponse.json());
        } catch (refreshError) {
          console.error(refreshError);
        }
      } else {
        setConnectionSettingsErrorSection('save');
        setConnectionSettingsErrorField('');
        setSettingsError(data.detail || 'Errore sconosciuto durante il salvataggio.');
      }
    } catch (error) {
      console.error(error);
      setConnectionSettingsErrorSection('save');
      setConnectionSettingsErrorField('');
      setSettingsError('Connessione interrotta durante il salvataggio. Controlla la rete e riprova.');
    } finally {
      setSavingConnectionSettings(false);
    }
  };

  return {
    ...status,
    connectionSettingsDirty,
    connectionTestStale,
    connectionVerifiedForCurrentValues,
    connectionSettingsErrorField,
    connectionSettingsErrorSection,
    handleSaveConnectionSettings,
    handleTestConnection,
    lastConnectionTestAt,
    prestashopApiKey,
    prestashopMockMode,
    prestashopSyncInterval,
    prestashopUrl,
    resetConnectionSettings,
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
