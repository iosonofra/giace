import { PickingAggregatedView } from './PickingAggregatedView';
import { PickingAutomaticInsights } from './PickingAutomaticInsights';
import { PickingContextOverview } from './PickingContextOverview';
import { PickingOrdersView } from './PickingOrdersView';
import { PickingResultsHeader } from './PickingResultsHeader';


export function PickingResultsPanel({
  autoPickingRemainingFilter,
  autoPickingRemainingQuery,
  autoPickingResultView,
  automaticMinResidual,
  automaticRemainingCount,
  automaticRemainingOrders,
  automaticSimulationSummary,
  automaticSkuExcludedOrders,
  automaticSkuLimitExcludedOrders,
  automaticStockAuditBySku,
  automaticUnclassifiedCount,
  clearCountedPickingSkus,
  copiedOrderId,
  countedPickingCount,
  countedPickingSkus,
  filteredAutomaticRemainingOrders,
  formatPickingQty,
  getOrderPickingMeta,
  getPickingRemainingQty,
  getRelativeTimeString,
  getRequirementMeta,
  getStateBadgeClass,
  handleCopyOrderId,
  handleCopyPickingList,
  handleSyncSpecificOrders,
  hasAutomaticRemainingDetails,
  pickingCopyState,
  pickingCountingMode,
  pickingFilesAnomalies,
  pickingFilesSummary,
  pickingInputMode,
  pickingLoading,
  pickingRequirementFilter,
  pickingResults,
  pickingViewMode,
  setAutoPickingRemainingFilter,
  setAutoPickingRemainingQuery,
  setAutoPickingRemainingVisibleLimit,
  setAutoPickingResultView,
  setPickingRequirementFilter,
  setPickingViewMode,
  sortedPickingOrders,
  syncingSpecificOrders,
  togglePickingCountingMode,
  togglePickingSkuCounted,
  visibleAutomaticRemainingOrders,
  visiblePickingRequirements,
}) {
  if (!pickingResults) return null;

  return (
    <div className="glass-panel widget-card picking-results-panel">
      <PickingResultsHeader
        clearCountedPickingSkus={clearCountedPickingSkus}
        countedPickingSkus={countedPickingSkus}
        handleCopyPickingList={handleCopyPickingList}
        pickingCopyState={pickingCopyState}
        pickingCountingMode={pickingCountingMode}
        pickingLoading={pickingLoading}
        pickingViewMode={pickingViewMode}
        setPickingViewMode={setPickingViewMode}
        togglePickingCountingMode={togglePickingCountingMode}
      />

      <PickingContextOverview
        formatPickingQty={formatPickingQty}
        handleSyncSpecificOrders={handleSyncSpecificOrders}
        pickingFilesAnomalies={pickingFilesAnomalies}
        pickingFilesSummary={pickingFilesSummary}
        pickingInputMode={pickingInputMode}
        pickingResults={pickingResults}
        syncingSpecificOrders={syncingSpecificOrders}
      />

      <PickingAutomaticInsights
        automaticSimulationSummary={automaticSimulationSummary}
        automaticSkuExcludedOrders={automaticSkuExcludedOrders}
        automaticSkuLimitExcludedOrders={automaticSkuLimitExcludedOrders}
        copiedOrderId={copiedOrderId}
        formatPickingQty={formatPickingQty}
        getRelativeTimeString={getRelativeTimeString}
        getStateBadgeClass={getStateBadgeClass}
        handleCopyOrderId={handleCopyOrderId}
        pickingResults={pickingResults}
        pickingViewMode={pickingViewMode}
      />

      {pickingViewMode === 'aggregated' ? (
        <PickingAggregatedView
          automaticMinResidual={automaticMinResidual}
          automaticStockAuditBySku={automaticStockAuditBySku}
          countedPickingCount={countedPickingCount}
          countedPickingSkus={countedPickingSkus}
          formatPickingQty={formatPickingQty}
          getPickingRemainingQty={getPickingRemainingQty}
          getRequirementMeta={getRequirementMeta}
          pickingCountingMode={pickingCountingMode}
          pickingRequirementFilter={pickingRequirementFilter}
          pickingResults={pickingResults}
          setPickingRequirementFilter={setPickingRequirementFilter}
          togglePickingSkuCounted={togglePickingSkuCounted}
          visiblePickingRequirements={visiblePickingRequirements}
        />
      ) : (
        <PickingOrdersView
          autoPickingRemainingFilter={autoPickingRemainingFilter}
          autoPickingRemainingQuery={autoPickingRemainingQuery}
          autoPickingResultView={autoPickingResultView}
          automaticRemainingCount={automaticRemainingCount}
          automaticRemainingOrders={automaticRemainingOrders}
          automaticUnclassifiedCount={automaticUnclassifiedCount}
          copiedOrderId={copiedOrderId}
          filteredAutomaticRemainingOrders={filteredAutomaticRemainingOrders}
          formatPickingQty={formatPickingQty}
          getOrderPickingMeta={getOrderPickingMeta}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          handleCopyOrderId={handleCopyOrderId}
          hasAutomaticRemainingDetails={hasAutomaticRemainingDetails}
          pickingResults={pickingResults}
          setAutoPickingRemainingFilter={setAutoPickingRemainingFilter}
          setAutoPickingRemainingQuery={setAutoPickingRemainingQuery}
          setAutoPickingRemainingVisibleLimit={setAutoPickingRemainingVisibleLimit}
          setAutoPickingResultView={setAutoPickingResultView}
          sortedPickingOrders={sortedPickingOrders}
          visibleAutomaticRemainingOrders={visibleAutomaticRemainingOrders}
        />
      )}
    </div>
  );
}
