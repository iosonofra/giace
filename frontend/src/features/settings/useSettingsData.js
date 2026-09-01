import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { apiFetch } from '../../api/client';
import { SETTINGS_SECTIONS } from './settingsConstants';
import { useConnectionSettings } from './useConnectionSettings';
import { useExtensionSettings } from './useExtensionSettings';
import { useOrderSettings } from './useOrderSettings';
import { useStockSettings } from './useStockSettings';

const SETTINGS_SECTION_IDS = SETTINGS_SECTIONS.map(section => section.id);

function readSettingsSection() {
  if (typeof window === 'undefined') return 'connection';
  const requested = new URLSearchParams(window.location.search).get('settings');
  return SETTINGS_SECTION_IDS.includes(requested) ? requested : 'connection';
}

export function useSettingsData({
  active,
  initialStockSource,
  preload,
  refresh,
  refreshKey,
  setSyncingStock,
  setTabLoading,
  showActionMsg,
}) {
  const [settingsSection, setSettingsSection] = useState(readSettingsSection);
  const [settingsError, setSettingsError] = useState(null);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [loadedOrderStates, setLoadedOrderStates] = useState([]);
  const [loadedSettingsKey, setLoadedSettingsKey] = useState(null);
  const [orderStatesReady, setOrderStatesReady] = useState(false);
  const [orderStatesError, setOrderStatesError] = useState('');
  const [exportingSettings, setExportingSettings] = useState(false);
  const [importingSettings, setImportingSettings] = useState(false);
  const [settingsTransferError, setSettingsTransferError] = useState('');
  const orderStatesRequestRef = useRef(null);
  const requestRef = useRef(null);

  const selectSettingsSection = useCallback(sectionId => {
    if (!SETTINGS_SECTION_IDS.includes(sectionId)) return;
    setSettingsSection(sectionId);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('settings', sectionId);
    window.history.replaceState(window.history.state, '', url);
  }, []);

  useEffect(() => {
    const syncFromHistory = () => setSettingsSection(readSettingsSection());
    window.addEventListener('popstate', syncFromHistory);
    return () => window.removeEventListener('popstate', syncFromHistory);
  }, []);

  const loadOrderStates = useCallback((requestKey) => {
    if (orderStatesRequestRef.current?.key === requestKey) {
      return orderStatesRequestRef.current.promise;
    }
    setOrderStatesReady(false);
    setOrderStatesError('');
    const request = apiFetch('/api/order-states')
      .then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.detail || 'PrestaShop non ha restituito gli stati ordine.');
        }
        if (!Array.isArray(data)) {
          throw new Error('La risposta degli stati ordine non è valida.');
        }
        return data;
      })
      .then(states => {
        setLoadedOrderStates(states);
      })
      .catch(error => {
        console.error(error);
        setOrderStatesError(
          error.message || 'Gli stati ordine non sono disponibili.',
        );
      })
      .finally(() => {
        setOrderStatesReady(true);
      });
    orderStatesRequestRef.current = {
      key: requestKey,
      promise: request,
    };
    const clearRequest = () => {
      if (orderStatesRequestRef.current?.promise === request) {
        orderStatesRequestRef.current = null;
      }
    };
    request.then(clearRequest, clearRequest);
    return request;
  }, []);

  const retryLoadOrderStates = useCallback(() => {
    orderStatesRequestRef.current = null;
    return loadOrderStates(refreshKey);
  }, [loadOrderStates, refreshKey]);

  const handleExportSettings = useCallback(async () => {
    setExportingSettings(true);
    setSettingsTransferError('');
    try {
      const response = await apiFetch('/api/settings/export');
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || 'Esportazione non riuscita.');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `giac_config_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showActionMsg('Configurazione esportata senza credenziali sensibili.');
    } catch (error) {
      console.error(error);
      setSettingsTransferError(error.message || 'Esportazione non riuscita.');
    } finally {
      setExportingSettings(false);
    }
  }, [showActionMsg]);

  const handleImportSettings = useCallback(async payload => {
    setImportingSettings(true);
    setSettingsTransferError('');
    try {
      const response = await apiFetch('/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || 'Importazione non riuscita.');
      setCurrentSettings(data);
      setLoadedSettingsKey(refreshKey);
      showActionMsg('Configurazione importata. Le credenziali esistenti sono rimaste invariate.');
      refresh();
      return true;
    } catch (error) {
      console.error(error);
      setSettingsTransferError(error.message || 'Importazione non riuscita.');
      return false;
    } finally {
      setImportingSettings(false);
    }
  }, [refresh, refreshKey, showActionMsg]);

  const updateLoadedOrderStates = useCallback(states => {
    setLoadedOrderStates(Array.isArray(states) ? states : []);
    setOrderStatesError('');
    setOrderStatesReady(true);
  }, []);

  const loadSettings = useCallback((requestKey) => {
    if (requestRef.current?.key === requestKey) {
      return requestRef.current.promise;
    }

    loadOrderStates(requestKey);
    const request = apiFetch('/api/settings')
      .then(response => response.json())
      .then(settings => {
        setCurrentSettings(settings);
        setLoadedSettingsKey(requestKey);
      });
    requestRef.current = {
      key: requestKey,
      promise: request,
    };
    const clearRequest = () => {
      if (requestRef.current?.promise === request) {
        requestRef.current = null;
      }
    };
    request.then(clearRequest, clearRequest);
    return request;
  }, [loadOrderStates]);

  useEffect(() => {
    if (!active && !preload) return undefined;
    if (loadedSettingsKey === refreshKey) {
      if (active) setTabLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSettingsError(null);
    if (active && loadedSettingsKey !== refreshKey) {
      setTabLoading(true);
    }
    loadSettings(refreshKey)
      .catch(error => {
        if (cancelled) return;
        console.error(error);
        setSettingsError('Errore nel caricamento delle impostazioni da PrestaShop.');
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    active,
    loadSettings,
    loadedSettingsKey,
    preload,
    refreshKey,
    setTabLoading,
  ]);

  const connection = useConnectionSettings({
    currentSettings,
    refresh,
    setOrderStates: updateLoadedOrderStates,
    setSettingsError,
    showActionMsg,
  });
  const extension = useExtensionSettings({
    currentSettings,
    setSettingsError,
    showActionMsg,
  });
  const orders = useOrderSettings({
    currentSettings,
    loadedOrderStates,
    refresh,
    setSettingsError,
    showActionMsg,
  });
  const stock = useStockSettings({
    currentSettings,
    initialStockSource,
    refresh,
    setSettingsError,
    setSyncingStock,
    showActionMsg,
  });

  return {
    ...connection,
    ...extension,
    ...orders,
    ...stock,
    exportingSettings,
    handleExportSettings,
    handleImportSettings,
    importingSettings,
    orderStatesError,
    orderStatesReady,
    retryLoadOrderStates,
    setSettingsError,
    setSettingsSection: selectSettingsSection,
    settingsError,
    settingsReady: (
      currentSettings !== null
      && loadedSettingsKey === refreshKey
    ),
    settingsSection,
    settingsSections: SETTINGS_SECTIONS,
    settingsTransferError,
  };
}
