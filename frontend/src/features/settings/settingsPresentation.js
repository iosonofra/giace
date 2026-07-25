export function deriveConnectionStatus({
  prestashopApiKey,
  prestashopMockMode,
  prestashopUrl,
}) {
  const prestashopUrlValid = prestashopUrl.trim().endsWith('/api/');
  const prestashopApiKeyPresent = prestashopApiKey.trim().length > 0;
  const prestashopRealReady =
    !prestashopMockMode && prestashopUrlValid && prestashopApiKeyPresent;

  return {
    prestashopApiKeyPresent,
    prestashopRealReady,
    prestashopStatusLabel: prestashopMockMode
      ? 'Simulazione'
      : prestashopRealReady
        ? 'API reale configurata'
        : 'Connessione da completare',
    prestashopStatusTone: prestashopMockMode
      ? 'warning'
      : prestashopRealReady
        ? 'success'
        : 'danger',
    prestashopUrlValid,
  };
}

export function deriveExtensionStatus({
  extensionApiToken,
  extensionTestResult,
  savedExtensionApiToken,
}) {
  const extensionTokenConfigured = savedExtensionApiToken.trim().length > 0;
  const extensionTokenDirty = extensionApiToken !== savedExtensionApiToken;

  return {
    extensionApiStatusLabel: extensionTokenDirty
      ? 'Modifiche da salvare'
      : extensionTestResult?.status === 'success'
        ? 'API verificata'
        : extensionTestResult?.status === 'error'
          ? 'Verifica fallita'
          : 'API non verificata',
    extensionApiStatusTone: extensionTokenDirty
      ? 'warning'
      : extensionTestResult?.status === 'success'
        ? 'success'
        : extensionTestResult?.status === 'error'
          ? 'danger'
          : 'neutral',
    extensionTokenConfigured,
    extensionTokenDirty,
  };
}

export function deriveOrderStates({
  orderStates,
  savedSelectedStates,
  searchStateQuery,
  selectedStates,
  showOnlySelectedStates,
}) {
  const recommendedOrderStates = orderStates.filter(state => {
    const name = String(state.name || '').toLowerCase();
    return (
      [2, 3, 12, 89].includes(Number(state.id)) ||
      name.includes('pagamento accettato') ||
      name.includes('preparazione in corso') ||
      name.includes('magazzino rosate')
    );
  });
  const selectedStatesKey = [...selectedStates].sort((a, b) => a - b).join(',');
  const savedSelectedStatesKey = [...savedSelectedStates].sort((a, b) => a - b).join(',');

  return {
    filteredOrderStates: orderStates.filter(state => {
      const matchesSearch =
        String(state.name || '').toLowerCase().includes(searchStateQuery.toLowerCase()) ||
        String(state.id).includes(searchStateQuery);
      const matchesSelected = !showOnlySelectedStates || selectedStates.includes(state.id);
      return matchesSearch && matchesSelected;
    }),
    orderStatesDirty: selectedStatesKey !== savedSelectedStatesKey,
    recommendedOrderStateIds: recommendedOrderStates.map(state => state.id),
  };
}
