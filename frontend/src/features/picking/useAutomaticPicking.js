import { useState } from 'react';

import { apiFetch } from '../../api/client';
import { buildAutomaticPickingRequest } from './automaticPickingRules';
import { useAutomaticPickingConfig } from './useAutomaticPickingConfig';


export function useAutomaticPicking({
  stockData,
  setPickingError,
  setPickingFilesAnomalies,
  setPickingFilesSummary,
  setPickingLoading,
  setPickingRequirementFilter,
  setPickingResults,
  setPickingViewMode,
}) {
  const config = useAutomaticPickingConfig({ setPickingError, stockData });
  const [autoPickingResultView, setAutoPickingResultView] = useState('selected');
  const [autoPickingRemainingFilter, setAutoPickingRemainingFilter] = useState('all');
  const [autoPickingRemainingQuery, setAutoPickingRemainingQuery] = useState('');
  const [
    autoPickingRemainingVisibleLimit,
    setAutoPickingRemainingVisibleLimit,
  ] = useState(100);

  const resetAutomaticPickingConfiguration = () => {
    config.resetAutomaticPickingConfig();
    setPickingResults(null);
    setPickingError(null);
    setAutoPickingResultView('selected');
  };

  const handleGenerateAutomaticPicking = async event => {
    event?.preventDefault();
    const request = buildAutomaticPickingRequest({
      excludedSkus: config.autoPickingExcludedSkus,
      limit: config.autoPickingLimit,
      minResidual: config.autoPickingMinResidual,
      skuFilter: config.autoPickingSkuFilter,
      skuLimits: config.autoPickingSkuLimits,
      strategy: config.autoPickingStrategy,
      strict: config.autoPickingStrict,
    });
    if (request.error) {
      setPickingError(request.error);
      return;
    }

    setPickingLoading(true);
    setPickingError(null);
    setPickingFilesAnomalies([]);
    setPickingFilesSummary([]);

    try {
      const response = await apiFetch('/api/orders/auto-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.payload),
      });
      const data = await response.json();
      if (response.ok) {
        setPickingResults(data);
        setPickingRequirementFilter('all');
        setPickingViewMode('by_order');
        setAutoPickingResultView('selected');
        setAutoPickingRemainingFilter('all');
        setAutoPickingRemainingQuery('');
        setAutoPickingRemainingVisibleLimit(100);
      } else {
        setPickingError(
          data.detail || 'Errore durante la generazione della lista automatica.',
        );
      }
    } catch (error) {
      setPickingError(`Errore di connessione: ${error.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  return {
    ...config,
    autoPickingRemainingFilter,
    autoPickingRemainingQuery,
    autoPickingRemainingVisibleLimit,
    autoPickingResultView,
    handleGenerateAutomaticPicking,
    resetAutomaticPickingConfiguration,
    setAutoPickingRemainingFilter,
    setAutoPickingRemainingQuery,
    setAutoPickingRemainingVisibleLimit,
    setAutoPickingResultView,
  };
}
