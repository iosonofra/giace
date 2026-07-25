export function createPickingPageModel({
  automatic,
  clipboard,
  core,
  orders,
  presentation,
  shared,
}) {
  return {
    inputMode: core.pickingInputMode,
    setInputMode: core.setPickingInputMode,
    error: core.pickingError,
    setError: core.setPickingError,
    loading: core.pickingLoading,
    results: core.pickingResults,
    setResults: core.setPickingResults,
    rawText: core.rawPickingText,
    setRawText: core.setRawPickingText,
    detectedOrderCount: core.detectedPickingOrderCount,
    onCalculateText: core.handleCalculatePicking,
    selectedFiles: core.selectedPickingFiles,
    setSelectedFiles: core.setSelectedPickingFiles,
    onUploadFiles: core.handleUploadPickingFiles,
    setFileAnomalies: core.setPickingFilesAnomalies,
    setFileSummary: core.setPickingFilesSummary,
    LoadingSkeleton: shared.TableSkeleton,
    automaticPlannerProps: {
      onSubmit: automatic.handleGenerateAutomaticPicking,
      error: core.pickingError,
      loading: core.pickingLoading,
      limit: automatic.autoPickingLimit,
      setLimit: automatic.setAutoPickingLimit,
      strategy: automatic.autoPickingStrategy,
      setStrategy: automatic.setAutoPickingStrategy,
      strict: automatic.autoPickingStrict,
      setStrict: automatic.setAutoPickingStrict,
      minResidual: automatic.autoPickingMinResidual,
      setMinResidual: automatic.setAutoPickingMinResidual,
      skuFilter: automatic.autoPickingSkuFilter,
      setSkuFilter: automatic.setAutoPickingSkuFilter,
      skuQuery: automatic.autoPickingSkuQuery,
      setSkuQuery: automatic.setAutoPickingSkuQuery,
      skuMaxQuery: automatic.autoPickingSkuMaxQuery,
      setSkuMaxQuery: automatic.setAutoPickingSkuMaxQuery,
      skuLimits: automatic.autoPickingSkuLimits,
      setSkuLimits: automatic.setAutoPickingSkuLimits,
      skuSuggestions: automatic.autoPickingSkuSuggestions,
      addSkuFilter: automatic.addAutoPickingSkuFilter,
      updateSkuLimit: automatic.updateAutoPickingSkuLimit,
      removeSkuFilter: automatic.removeAutoPickingSkuFilter,
      excludedSkus: automatic.autoPickingExcludedSkus,
      setExcludedSkus: automatic.setAutoPickingExcludedSkus,
      excludedSkuQuery: (
        automatic.autoPickingExcludedSkuQuery
      ),
      setExcludedSkuQuery: (
        automatic.setAutoPickingExcludedSkuQuery
      ),
      excludedSkuSuggestions: (
        automatic.autoPickingExcludedSkuSuggestions
      ),
      addExcludedSku: automatic.addAutoPickingExcludedSku,
      removeExcludedSku: (
        automatic.removeAutoPickingExcludedSku
      ),
      onReset: automatic.resetAutomaticPickingConfiguration,
    },
    resultsProps: {
      pickingResults: core.pickingResults,
      pickingLoading: core.pickingLoading,
      pickingViewMode: core.pickingViewMode,
      setPickingViewMode: core.setPickingViewMode,
      pickingCountingMode: core.pickingCountingMode,
      togglePickingCountingMode: core.togglePickingCountingMode,
      countedPickingSkus: core.countedPickingSkus,
      clearCountedPickingSkus: core.clearCountedPickingSkus,
      pickingCopyState: clipboard.pickingCopyState,
      handleCopyPickingList: clipboard.handleCopyPickingList,
      pickingInputMode: core.pickingInputMode,
      pickingFilesAnomalies: core.pickingFilesAnomalies,
      pickingFilesSummary: core.pickingFilesSummary,
      syncingSpecificOrders: core.syncingSpecificOrders,
      handleSyncSpecificOrders: core.handleSyncSpecificOrders,
      automaticSkuExcludedOrders: (
        presentation.automaticSkuExcludedOrders
      ),
      automaticSkuLimitExcludedOrders: (
        presentation.automaticSkuLimitExcludedOrders
      ),
      automaticSimulationSummary: (
        presentation.automaticSimulationSummary
      ),
      automaticRemainingCount: (
        presentation.automaticRemainingCount
      ),
      autoPickingResultView: automatic.autoPickingResultView,
      setAutoPickingResultView: (
        automatic.setAutoPickingResultView
      ),
      visiblePickingRequirements: (
        presentation.visiblePickingRequirements
      ),
      pickingRequirementFilter: core.pickingRequirementFilter,
      setPickingRequirementFilter: (
        core.setPickingRequirementFilter
      ),
      countedPickingCount: presentation.countedPickingCount,
      togglePickingSkuCounted: core.togglePickingSkuCounted,
      getRequirementMeta: shared.getRequirementMeta,
      formatPickingQty: shared.formatPickingQty,
      getPickingRemainingQty: shared.getPickingRemainingQty,
      automaticStockAuditBySku: (
        presentation.automaticStockAuditBySku
      ),
      automaticMinResidual: presentation.automaticMinResidual,
      sortedPickingOrders: presentation.sortedPickingOrders,
      getOrderPickingMeta: shared.getOrderPickingMeta,
      handleCopyOrderId: orders.handleCopyOrderId,
      copiedOrderId: orders.copiedOrderId,
      getRelativeTimeString: shared.getRelativeTimeString,
      getStateBadgeClass: shared.getStateBadgeClass,
      hasAutomaticRemainingDetails: (
        presentation.hasAutomaticRemainingDetails
      ),
      automaticRemainingOrders: (
        presentation.automaticRemainingOrders
      ),
      automaticUnclassifiedCount: (
        presentation.automaticUnclassifiedCount
      ),
      filteredAutomaticRemainingOrders: (
        presentation.filteredAutomaticRemainingOrders
      ),
      visibleAutomaticRemainingOrders: (
        presentation.visibleAutomaticRemainingOrders
      ),
      autoPickingRemainingQuery: (
        automatic.autoPickingRemainingQuery
      ),
      setAutoPickingRemainingQuery: (
        automatic.setAutoPickingRemainingQuery
      ),
      autoPickingRemainingFilter: (
        automatic.autoPickingRemainingFilter
      ),
      setAutoPickingRemainingFilter: (
        automatic.setAutoPickingRemainingFilter
      ),
      setAutoPickingRemainingVisibleLimit: (
        automatic.setAutoPickingRemainingVisibleLimit
      ),
    },
  };
}
