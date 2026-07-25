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
  const [searchStateQuery, setSearchStateQuery] = useState('');
  const [showOnlySelectedStates, setShowOnlySelectedStates] = useState(false);

  useEffect(() => {
    setOrderStates(loadedOrderStates);
  }, [loadedOrderStates]);

  useEffect(() => {
    if (!currentSettings) return;
    const includedStateIds = currentSettings.included_state_ids || [];
    setSelectedStates(includedStateIds);
    setSavedSelectedStates(includedStateIds);
  }, [currentSettings]);

  const presentation = deriveOrderStates({
    orderStates,
    savedSelectedStates,
    searchStateQuery,
    selectedStates,
    showOnlySelectedStates,
  });

  const handleToggleState = stateId => {
    setSelectedStates(current =>
      current.includes(stateId)
        ? current.filter(id => id !== stateId)
        : [...current, stateId],
    );
  };

  const handleSelectAllStates = () => {
    setSelectedStates(orderStates.map(state => state.id));
  };

  const handleSelectRecommendedStates = () => {
    setSelectedStates(current =>
      Array.from(new Set([...current, ...presentation.recommendedOrderStateIds])),
    );
  };

  const handleDeselectAllStates = () => {
    setSelectedStates([]);
  };

  const handleSaveOrderStates = async () => {
    setSavingStateSettings(true);
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
        setSettingsError(data.detail || 'Errore nel salvataggio degli stati ordine.');
      }
    } catch (error) {
      console.error(error);
      setSettingsError('Errore di rete durante il salvataggio degli stati ordine.');
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
    orderStates,
    savingStateSettings,
    searchStateQuery,
    selectedStates,
    setSearchStateQuery,
    setShowOnlySelectedStates,
    showOnlySelectedStates,
  };
}
