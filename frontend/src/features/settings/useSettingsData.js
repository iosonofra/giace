import { useEffect, useState } from 'react';

import { apiFetch } from '../../api/client';
import { SETTINGS_SECTIONS } from './settingsConstants';
import { useConnectionSettings } from './useConnectionSettings';
import { useExtensionSettings } from './useExtensionSettings';
import { useOrderSettings } from './useOrderSettings';
import { useStockSettings } from './useStockSettings';


export function useSettingsData({
  active,
  initialStockSource,
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

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    setSettingsError(null);
    setTabLoading(true);
    Promise.all([
      apiFetch('/api/order-states').then(response => response.json()),
      apiFetch('/api/settings').then(response => response.json()),
    ])
      .then(([states, settings]) => {
        if (cancelled) return;
        setLoadedOrderStates(states);
        setCurrentSettings(settings);
      })
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
  }, [active, refreshKey, setTabLoading]);

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
    setSettingsError,
    setSettingsSection,
    settingsError,
    settingsSection,
    settingsSections: SETTINGS_SECTIONS,
  };
}
