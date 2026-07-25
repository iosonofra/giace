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
  const [settingsSection, setSettingsSection] = useState('connection');
  const [settingsError, setSettingsError] = useState(null);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [loadedOrderStates, setLoadedOrderStates] = useState([]);
  const [loadedSettingsKey, setLoadedSettingsKey] = useState(null);
  const [orderStatesReady, setOrderStatesReady] = useState(false);
  const orderStatesRequestRef = useRef(null);
  const requestRef = useRef(null);

  const loadOrderStates = useCallback((requestKey) => {
    if (orderStatesRequestRef.current?.key === requestKey) {
      return orderStatesRequestRef.current.promise;
    }
    setOrderStatesReady(false);
    const request = apiFetch('/api/order-states')
      .then(response => response.json())
      .then(states => {
        setLoadedOrderStates(states);
        setOrderStatesReady(true);
      })
      .catch(error => {
        console.error(error);
        setSettingsError(
          'Configurazione caricata, ma gli stati ordine non sono disponibili.',
        );
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
    setOrderStates: setLoadedOrderStates,
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
    orderStatesReady,
    setSettingsError,
    setSettingsSection,
    settingsError,
    settingsReady: (
      currentSettings !== null
      && loadedSettingsKey === refreshKey
    ),
    settingsSection,
    settingsSections: SETTINGS_SECTIONS,
  };
}
