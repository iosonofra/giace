import { useEffect, useState } from 'react';

import { apiFetch } from '../../api/client';
import { deriveOrderStates } from './settingsPresentation';


export function useOrderSettings({
  currentSettings,
  loadedOrderStates,
  refresh,
  setSettingsError,
  showActionMsg,
}) {
  const [orderStates, setOrderStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [savedSelectedStates, setSavedSelectedStates] = useState([]);
  const [savingStateSettings, setSavingStateSettings] = useState(false);
  const [orderSettingsError, setOrderSettingsError] = useState('');
  const [searchStateQuery, setSearchStateQuery] = useState('');
  const [showOnlySelectedStates, setShowOnlySelectedStates] = useState(false);
  const [gaerSelectedStates, setGaerSelectedStates] = useState([]);
  const [savedGaerSelectedStates, setSavedGaerSelectedStates] = useState([]);
  const [savingGaerStates, setSavingGaerStates] = useState(false);
  const [gaerSettingsError, setGaerSettingsError] = useState('');
  const [gaerSearchStateQuery, setGaerSearchStateQuery] = useState('');
  const [showOnlySelectedGaerStates, setShowOnlySelectedGaerStates] = useState(false);

  useEffect(() => {
    setOrderStates(loadedOrderStates);
  }, [loadedOrderStates]);

  useEffect(() => {
    if (!currentSettings) return;
    const includedStateIds = currentSettings.included_state_ids || [];
    setSelectedStates(includedStateIds);
    setSavedSelectedStates(includedStateIds);
    const gaerStateIds = (currentSettings.gaer_state_ids || []).map(Number);
    setGaerSelectedStates(gaerStateIds);
    setSavedGaerSelectedStates(gaerStateIds);
  }, [currentSettings]);

  const presentation = deriveOrderStates({
    orderStates,
    savedSelectedStates,
    searchStateQuery,
    selectedStates,
    showOnlySelectedStates,
  });

  const handleToggleState = stateId => {
    setOrderSettingsError('');
    setSelectedStates(current =>
      current.includes(stateId)
        ? current.filter(id => id !== stateId)
        : [...current, stateId],
    );
  };

  const handleToggleGaerState = stateId => {
    setGaerSettingsError('');
    setGaerSelectedStates(current => (
      current.includes(stateId)
        ? current.filter(id => id !== stateId)
        : [...current, stateId]
    ));
  };

  const handleSelectAllGaerStates = () => {
    setGaerSettingsError('');
    setGaerSelectedStates(orderStates.map(state => Number(state.id)));
  };

  const handleDeselectAllGaerStates = () => {
    setGaerSettingsError('');
    setGaerSelectedStates([]);
  };

  const gaerStatesDirty = [...gaerSelectedStates].sort((a, b) => a - b).join(',')
    !== [...savedGaerSelectedStates].sort((a, b) => a - b).join(',');
  const normalizedGaerQuery = gaerSearchStateQuery.trim().toLowerCase();
  const filteredGaerOrderStates = orderStates.filter(state => {
    const stateId = Number(state.id);
    if (showOnlySelectedGaerStates && !gaerSelectedStates.includes(stateId)) return false;
    if (!normalizedGaerQuery) return true;
    return String(state.name || '').toLowerCase().includes(normalizedGaerQuery)
      || String(state.id).includes(normalizedGaerQuery);
  });

  const resetGaerStates = () => {
    setGaerSelectedStates(savedGaerSelectedStates);
    setGaerSettingsError('');
  };

  const handleSaveGaerStates = async () => {
    setSavingGaerStates(true);
    setGaerSettingsError('');
    try {
      const response = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaer_state_ids: gaerSelectedStates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Salvataggio stati Gaer non riuscito.');
      setSavedGaerSelectedStates(gaerSelectedStates);
      showActionMsg('Stati predefiniti Gaer salvati.');
      refresh();
    } catch (error) {
      setGaerSettingsError(error.message || 'Salvataggio stati Gaer non riuscito.');
    } finally {
      setSavingGaerStates(false);
    }
  };

  const handleSelectAllStates = () => {
    setOrderSettingsError('');
    setSelectedStates(orderStates.map(state => state.id));
  };

  const handleSelectRecommendedStates = () => {
    setOrderSettingsError('');
    setSelectedStates(current =>
      Array.from(new Set([...current, ...presentation.recommendedOrderStateIds])),
    );
  };

  const handleDeselectAllStates = () => {
    setOrderSettingsError('');
    setSelectedStates([]);
  };

  const resetOrderStates = () => {
    setSelectedStates(savedSelectedStates);
    setOrderSettingsError('');
    setSettingsError(null);
  };

  const handleSaveOrderStates = async () => {
    setSavingStateSettings(true);
    setOrderSettingsError('');
    setSettingsError(null);
    try {
      const response = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ included_state_ids: selectedStates }),
      });
      const data = await response.json();
      if (response.ok) {
        setSavedSelectedStates(selectedStates);
        showActionMsg('Stati ordine salvati con successo.');
        refresh();
      } else {
        setOrderSettingsError(
          data.detail || 'Non è stato possibile salvare gli stati ordine. Controlla la connessione e riprova.',
        );
      }
    } catch (error) {
      console.error(error);
      setOrderSettingsError('Connessione interrotta durante il salvataggio. Controlla la rete e riprova.');
    } finally {
      setSavingStateSettings(false);
    }
  };

  return {
    ...presentation,
    handleDeselectAllStates,
    handleSaveOrderStates,
    handleSelectAllStates,
    handleSelectRecommendedStates,
    handleToggleState,
    handleToggleGaerState,
    handleSelectAllGaerStates,
    handleDeselectAllGaerStates,
    handleSaveGaerStates,
    gaerSelectedStates,
    gaerSearchStateQuery,
    gaerSettingsError,
    gaerStatesDirty,
    filteredGaerOrderStates,
    resetGaerStates,
    savingGaerStates,
    setGaerSearchStateQuery,
    setShowOnlySelectedGaerStates,
    showOnlySelectedGaerStates,
    orderStates,
    orderSettingsError,
    resetOrderStates,
    savingStateSettings,
    searchStateQuery,
    selectedStates,
    setSearchStateQuery,
    setShowOnlySelectedStates,
    showOnlySelectedStates,
  };
}
