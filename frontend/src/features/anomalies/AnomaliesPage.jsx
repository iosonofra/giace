import { AnomalyFilters } from './AnomalyFilters';
import { AnomalyTable } from './AnomalyTable';
import {
  deriveAnomaliesPresentation,
  getAnomalyActionKind,
} from './anomaliesPresentation';


export function AnomaliesPage({ anomalies }) {
  const {
    anomaliesLimit,
    anomaliesPage,
    anomalyData,
    anomalyOnlyActionable,
    anomalyOrderStateFilter,
    anomalySearch,
    anomalySourceFilter,
    anomalyTypeFilter,
    formatDate,
    getAnomalyMeta,
    getAnomalySourceLabel,
    getAnomalyTypeLabel,
    getOrderStateBadgeClass,
    handleClearAnomalies,
    handleExportAnomaliesCsv,
    handleResolveMissingAssociation,
    handleRunCalculation,
    Pagination,
    setActiveTab,
    setAnomaliesPage,
    setAnomalyOnlyActionable,
    setAnomalyOrderStateFilter,
    setAnomalySearch,
    setAnomalySourceFilter,
    setAnomalyTypeFilter,
    setSettingsSection,
    TableSkeleton,
    tabLoading,
  } = anomalies;

  const presentation = deriveAnomaliesPresentation({
    anomalyData,
    filters: {
      onlyActionable: anomalyOnlyActionable,
      orderState: anomalyOrderStateFilter,
      search: anomalySearch,
      source: anomalySourceFilter,
      type: anomalyTypeFilter,
    },
    getAnomalyMeta,
    limit: anomaliesLimit,
    page: anomaliesPage,
  });

  const handleAnomalyAction = (anomaly, meta) => {
    const action = getAnomalyActionKind(anomaly, meta);
    if (action === 'association') {
      handleResolveMissingAssociation(anomaly.record_key);
    } else if (action === 'connection') {
      setSettingsSection('connection');
      setActiveTab('settings');
    } else if (action === 'associations') {
      setActiveTab('associations');
    } else if (action === 'calculation') {
      handleRunCalculation();
    } else if (action === 'stock') {
      setActiveTab('stock');
    }
  };

  return (
    <div className="glass-panel widget-card anomalies-workbench">
      <div
        className={`anomaly-summary-grid ${
          anomalyData.length > 0 ? 'has-actions' : ''
        }`.trim()}
      >
        <div className="anomaly-summary-card danger">
          <span>Critiche</span><strong>{presentation.stats.critical}</strong>
        </div>
        <div className="anomaly-summary-card warning">
          <span>Da verificare</span><strong>{presentation.stats.warning}</strong>
        </div>
        <div className="anomaly-summary-card neutral">
          <span>Informative</span><strong>{presentation.stats.info}</strong>
        </div>
        <div className="anomaly-summary-card primary">
          <span>Risolvibili</span><strong>{presentation.stats.actionable}</strong>
        </div>
        {anomalyData.length > 0 && (
          <div className="anomalies-header-actions">
            <>
              <button
                className="btn btn-secondary"
                onClick={() => handleExportAnomaliesCsv(presentation.filtered)}
                disabled={presentation.filtered.length === 0}
              >
                Esporta CSV
              </button>
              <button className="btn btn-danger" onClick={handleClearAnomalies}>
                Svuota registro
              </button>
            </>
          </div>
        )}
      </div>

      {anomalyData.length > 0 && (
        <AnomalyFilters
          getAnomalySourceLabel={getAnomalySourceLabel}
          getAnomalyTypeLabel={getAnomalyTypeLabel}
          filteredCount={presentation.filtered.length}
          onlyActionable={anomalyOnlyActionable}
          orderState={anomalyOrderStateFilter}
          orderStates={presentation.orderStates}
          search={anomalySearch}
          setOnlyActionable={setAnomalyOnlyActionable}
          setOrderState={setAnomalyOrderStateFilter}
          setSearch={setAnomalySearch}
          setSource={setAnomalySourceFilter}
          setType={setAnomalyTypeFilter}
          source={anomalySourceFilter}
          sources={presentation.sources}
          type={anomalyTypeFilter}
          types={presentation.types}
          totalCount={anomalyData.length}
        />
      )}

      <div className="anomaly-table-region">
        {tabLoading ? (
          <div className="anomaly-table-scroll">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : anomalyData.length > 0 ? (
          presentation.filtered.length > 0 ? (
            <>
              <div className="anomaly-table-scroll">
                <AnomalyTable
                  anomalies={presentation.paginated}
                  formatDate={formatDate}
                  getAnomalyMeta={getAnomalyMeta}
                  getOrderStateBadgeClass={getOrderStateBadgeClass}
                  onAction={handleAnomalyAction}
                />
              </div>
              <Pagination
                currentPage={anomaliesPage}
                totalPages={presentation.totalPages}
                onPageChange={setAnomaliesPage}
                disabled={tabLoading}
              />
            </>
          ) : (
            <div className="anomaly-empty-state compact">
              <p>Nessuna anomalia corrisponde ai filtri</p>
              <span>Allarga la ricerca o disattiva il filtro “Solo risolvibili”.</span>
            </div>
          )
        ) : (
          <div className="anomaly-empty-state">
            <svg className="w-12 h-12 mx-auto mb-4 text-emerald-500" style={{ color: 'var(--color-success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Nessuna anomalia nel registro corrente</p>
            <span>Import e sincronizzazioni recenti non hanno prodotto avvisi.</span>
          </div>
        )}
      </div>
    </div>
  );
}
