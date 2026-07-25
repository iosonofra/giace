import { PickingAdvancedSkuFilters } from './PickingAdvancedSkuFilters';
import { PickingOrderSelectionSettings } from './PickingOrderSelectionSettings';
import { PickingPlanSummary } from './PickingPlanSummary';
import { PickingSimulationBehavior } from './PickingSimulationBehavior';


export function PickingAutomaticPlanner({
  addExcludedSku,
  addSkuFilter,
  error,
  excludedSkuQuery,
  excludedSkuSuggestions,
  excludedSkus,
  limit,
  loading,
  minResidual,
  onReset,
  onSubmit,
  removeExcludedSku,
  removeSkuFilter,
  setExcludedSkuQuery,
  setExcludedSkus,
  setLimit,
  setMinResidual,
  setSkuFilter,
  setSkuLimits,
  setSkuMaxQuery,
  setSkuQuery,
  setStrategy,
  setStrict,
  skuFilter,
  skuLimits,
  skuMaxQuery,
  skuQuery,
  skuSuggestions,
  strategy,
  strict,
  updateSkuLimit,
}) {
  return (
    <form onSubmit={onSubmit} className="picking-workflow-form picking-auto-configurator">
      {error && (
        <div className="picking-alert picking-alert-danger" role="alert">
          <strong>Simulazione non generata.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="picking-config-workbench">
        <div className="picking-config-main">
          <PickingOrderSelectionSettings
            limit={limit}
            setLimit={setLimit}
            setStrategy={setStrategy}
            strategy={strategy}
          />
          <PickingSimulationBehavior
            minResidual={minResidual}
            setMinResidual={setMinResidual}
            setStrict={setStrict}
            strategy={strategy}
            strict={strict}
          />
          <PickingAdvancedSkuFilters
            addExcludedSku={addExcludedSku}
            addSkuFilter={addSkuFilter}
            excludedSkuQuery={excludedSkuQuery}
            excludedSkuSuggestions={excludedSkuSuggestions}
            excludedSkus={excludedSkus}
            removeExcludedSku={removeExcludedSku}
            removeSkuFilter={removeSkuFilter}
            setExcludedSkuQuery={setExcludedSkuQuery}
            setExcludedSkus={setExcludedSkus}
            setSkuFilter={setSkuFilter}
            setSkuLimits={setSkuLimits}
            setSkuMaxQuery={setSkuMaxQuery}
            setSkuQuery={setSkuQuery}
            skuFilter={skuFilter}
            skuLimits={skuLimits}
            skuMaxQuery={skuMaxQuery}
            skuQuery={skuQuery}
            skuSuggestions={skuSuggestions}
            updateSkuLimit={updateSkuLimit}
          />
        </div>

        <PickingPlanSummary
          excludedSkus={excludedSkus}
          limit={limit}
          loading={loading}
          minResidual={minResidual}
          onReset={onReset}
          skuFilter={skuFilter}
          strategy={strategy}
          strict={strict}
        />
      </div>
    </form>
  );
}
