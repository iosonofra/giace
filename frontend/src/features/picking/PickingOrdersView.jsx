import { AutomaticRemainingOrders } from './AutomaticRemainingOrders';
import { AutomaticSkippedOrders } from './AutomaticSkippedOrders';
import { PickingSelectedOrders } from './PickingSelectedOrders';


export function PickingOrdersView({
  autoPickingRemainingFilter,
  autoPickingRemainingQuery,
  autoPickingResultView,
  automaticRemainingCount,
  automaticRemainingOrders,
  automaticUnclassifiedCount,
  copiedOrderId,
  filteredAutomaticRemainingOrders,
  formatPickingQty,
  getOrderPickingMeta,
  getRelativeTimeString,
  getStateBadgeClass,
  handleCopyOrderId,
  hasAutomaticRemainingDetails,
  pickingResults,
  setAutoPickingRemainingFilter,
  setAutoPickingRemainingQuery,
  setAutoPickingRemainingVisibleLimit,
  setAutoPickingResultView,
  sortedPickingOrders,
  visibleAutomaticRemainingOrders,
}) {
  const automaticMode = pickingResults.mode === 'automatic';

  return (
    <div className={automaticMode ? 'picking-automatic-split' : ''}>
      {automaticMode && (
        <div
          className="picking-auto-result-switch"
          role="tablist"
          aria-label="Risultati lista prelievo automatica"
        >
          <button
            type="button"
            className={autoPickingResultView === 'selected' ? 'active success' : ''}
            role="tab"
            aria-selected={autoPickingResultView === 'selected'}
            onClick={() => setAutoPickingResultView('selected')}
          >
            <span>Proposti</span>
            <strong>{sortedPickingOrders.length}</strong>
          </button>
          <button
            type="button"
            className={autoPickingResultView === 'skipped' ? 'active danger' : ''}
            role="tab"
            aria-selected={autoPickingResultView === 'skipped'}
            onClick={() => setAutoPickingResultView('skipped')}
          >
            <span>Saltati</span>
            <strong>{pickingResults.skipped_orders?.length || 0}</strong>
          </button>
          <button
            type="button"
            className={autoPickingResultView === 'remaining' ? 'active warning' : ''}
            role="tab"
            aria-selected={autoPickingResultView === 'remaining'}
            onClick={() => setAutoPickingResultView('remaining')}
          >
            <span>Fuori proposta</span>
            <strong>{automaticRemainingCount}</strong>
          </button>
        </div>
      )}

      {(!automaticMode || autoPickingResultView === 'selected') && (
        <PickingSelectedOrders
          pickingResults={pickingResults}
          sortedPickingOrders={sortedPickingOrders}
          getOrderPickingMeta={getOrderPickingMeta}
          handleCopyOrderId={handleCopyOrderId}
          copiedOrderId={copiedOrderId}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          formatPickingQty={formatPickingQty}
        />
      )}

      {automaticMode && autoPickingResultView === 'skipped' && (
        <AutomaticSkippedOrders
          pickingResults={pickingResults}
          handleCopyOrderId={handleCopyOrderId}
          copiedOrderId={copiedOrderId}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          formatPickingQty={formatPickingQty}
        />
      )}

      {automaticMode && autoPickingResultView === 'remaining' && (
        <AutomaticRemainingOrders
          automaticRemainingCount={automaticRemainingCount}
          hasAutomaticRemainingDetails={hasAutomaticRemainingDetails}
          automaticRemainingOrders={automaticRemainingOrders}
          autoPickingRemainingQuery={autoPickingRemainingQuery}
          setAutoPickingRemainingQuery={setAutoPickingRemainingQuery}
          autoPickingRemainingFilter={autoPickingRemainingFilter}
          setAutoPickingRemainingFilter={setAutoPickingRemainingFilter}
          setAutoPickingRemainingVisibleLimit={setAutoPickingRemainingVisibleLimit}
          filteredAutomaticRemainingOrders={filteredAutomaticRemainingOrders}
          visibleAutomaticRemainingOrders={visibleAutomaticRemainingOrders}
          handleCopyOrderId={handleCopyOrderId}
          copiedOrderId={copiedOrderId}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          formatPickingQty={formatPickingQty}
          automaticUnclassifiedCount={automaticUnclassifiedCount}
        />
      )}
    </div>
  );
}
