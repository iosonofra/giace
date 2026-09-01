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
    setOrderSettingsError('');
    setSelectedStates(current =>
      current.includes(stateId)
        ? current.filter(id => id !== stateId)
        : [...current, stateId],
    );
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
