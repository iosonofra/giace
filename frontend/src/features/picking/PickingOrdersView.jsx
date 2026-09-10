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
  copyFeedbackKey,
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
  const automaticMode = ['automatic', 'gaer'].includes(pickingResults.mode);
  const gaerMode = pickingResults.mode === 'gaer';
  const activeResultView = gaerMode && autoPickingResultView === 'remaining'
    ? 'selected'
    : autoPickingResultView;

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
            className={activeResultView === 'selected' ? 'active success' : ''}
            role="tab"
            aria-selected={activeResultView === 'selected'}
            onClick={() => setAutoPickingResultView('selected')}
          >
            <span>Proposti</span>
            <strong>{sortedPickingOrders.length}</strong>
          </button>
          <button
            type="button"
            className={activeResultView === 'skipped' ? 'active danger' : ''}
            role="tab"
            aria-selected={activeResultView === 'skipped'}
            onClick={() => setAutoPickingResultView('skipped')}
          >
            <span>Saltati</span>
            <strong>{pickingResults.skipped_orders?.length || 0}</strong>
          </button>
          {!gaerMode && <button
            type="button"
            className={autoPickingResultView === 'remaining' ? 'active warning' : ''}
            role="tab"
            aria-selected={autoPickingResultView === 'remaining'}
            onClick={() => setAutoPickingResultView('remaining')}
          >
            <span>Fuori proposta</span>
            <strong>{automaticRemainingCount}</strong>
          </button>}
        </div>
      )}

      {(!automaticMode || activeResultView === 'selected') && (
        <PickingSelectedOrders
          pickingResults={pickingResults}
          sortedPickingOrders={sortedPickingOrders}
          getOrderPickingMeta={getOrderPickingMeta}
          handleCopyOrderId={handleCopyOrderId}
          copiedOrderId={copiedOrderId}
          copyFeedbackKey={copyFeedbackKey}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          formatPickingQty={formatPickingQty}
        />
      )}

      {automaticMode && activeResultView === 'skipped' && (
        <AutomaticSkippedOrders
          pickingResults={pickingResults}
          handleCopyOrderId={handleCopyOrderId}
          copiedOrderId={copiedOrderId}
          copyFeedbackKey={copyFeedbackKey}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          formatPickingQty={formatPickingQty}
        />
      )}

      {automaticMode && !gaerMode && activeResultView === 'remaining' && (
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
          copyFeedbackKey={copyFeedbackKey}
          getRelativeTimeString={getRelativeTimeString}
          getStateBadgeClass={getStateBadgeClass}
          formatPickingQty={formatPickingQty}
          automaticUnclassifiedCount={automaticUnclassifiedCount}
        />
      )}
    </div>
  );
}
