export function createAppPageModels({
  appData,
  associationEditor,
  associations,
  anomalies,
  dashboardPresentation,
  orders,
  runtime,
  settings,
  shared,
  stock,
  syncActions,
}) {
  return {
    dashboardUi: {
      availableSheets: appData.availableSheets,
      dashboardData: appData.dashboardData,
      ...dashboardPresentation,
      formatDate: shared.formatDate,
      getRelativeTimeString: shared.getRelativeTimeString,
      googleSheetLastSync: settings.googleSheetLastSync,
      handleFileUpload: syncActions.handleFileUpload,
      handleLocalImport: syncActions.handleLocalImport,
      handleSyncGoogleSheetsNow: (
        settings.handleSyncGoogleSheetsNow
      ),
      handleSyncOrders: syncActions.handleSyncOrders,
      Icons: shared.Icons,
      loading: appData.loading,
      selectedSheet: appData.selectedSheet,
      setActiveTab: runtime.setActiveTab,
      setSelectedSheet: appData.setSelectedSheet,
      status: appData.status,
      stockSource: settings.stockSource,
      syncingGoogleSheets: settings.syncingGoogleSheets,
      syncingOrders: runtime.syncingOrders,
    },
    associationsUi: {
      ...associations,
      handleOpenEditAssociation: (
        associationEditor.handleOpenEditAssociation
      ),
      handleFileUpload: syncActions.handleFileUpload,
      highlightText: shared.highlightText,
      Icons: shared.Icons,
      Pagination: shared.Pagination,
      TableSkeleton: shared.TableSkeleton,
      tabLoading: runtime.tabLoading,
      loading: appData.loading,
    },
    anomaliesUi: {
      anomaliesLimit: anomalies.anomaliesLimit,
      anomaliesPage: anomalies.anomaliesPage,
      anomalyData: anomalies.anomalyData,
      anomalyOnlyActionable: anomalies.anomalyOnlyActionable,
      anomalyOrderStateFilter: (
        anomalies.anomalyOrderStateFilter
      ),
      anomalySearch: anomalies.anomalySearch,
      anomalySourceFilter: anomalies.anomalySourceFilter,
      anomalyTypeFilter: anomalies.anomalyTypeFilter,
      formatDate: shared.formatDate,
      getAnomalyMeta: anomalies.getAnomalyMeta,
      getAnomalySourceLabel: anomalies.getAnomalySourceLabel,
      getAnomalyTypeLabel: anomalies.getAnomalyTypeLabel,
      getOrderStateBadgeClass: (
        shared.getOrderStateBadgeClass
      ),
      handleClearAnomalies: anomalies.handleClearAnomalies,
      handleExportAnomaliesCsv: (
        anomalies.handleExportAnomaliesCsv
      ),
      handleResolveMissingAssociation: (
        runtime.handleResolveMissingAssociation
      ),
      handleRunCalculation: syncActions.handleRunCalculation,
      Pagination: shared.Pagination,
      setActiveTab: runtime.setActiveTab,
      setAnomaliesPage: anomalies.setAnomaliesPage,
      setAnomalyOnlyActionable: (
        anomalies.setAnomalyOnlyActionable
      ),
      setAnomalyOrderStateFilter: (
        anomalies.setAnomalyOrderStateFilter
      ),
      setAnomalySearch: anomalies.setAnomalySearch,
      setAnomalySourceFilter: anomalies.setAnomalySourceFilter,
      setAnomalyTypeFilter: anomalies.setAnomalyTypeFilter,
      setSettingsSection: settings.setSettingsSection,
      TableSkeleton: shared.TableSkeleton,
      tabLoading: runtime.tabLoading,
    },
    ordersUi: {
      ...orders,
      formatDate: shared.formatDate,
      getOrderStateBadgeClass: (
        shared.getOrderStateBadgeClass
      ),
      handleResolveMissingAssociation: (
        runtime.handleResolveMissingAssociation
      ),
      highlightText: shared.highlightText,
      loading: appData.loading,
      Pagination: shared.Pagination,
      TableSkeleton: shared.TableSkeleton,
      tabLoading: runtime.tabLoading,
    },
    stockUi: {
      ...stock,
      getRelativeTimeString: shared.getRelativeTimeString,
      googleSheetsSyncSuccessKey: settings.googleSheetsSyncSuccessKey,
      handleSyncGoogleSheetsNow: (
        settings.handleSyncGoogleSheetsNow
      ),
      highlightText: shared.highlightText,
      Icons: shared.Icons,
      Pagination: shared.Pagination,
      status: appData.status,
      stockSource: settings.stockSource,
      syncingGoogleSheets: settings.syncingGoogleSheets,
      syncingOrders: runtime.syncingOrders,
      syncingStock: runtime.syncingStock,
      syncProgressText: runtime.syncProgressText,
      tabLoading: runtime.tabLoading,
      TableSkeleton: shared.TableSkeleton,
      copiedOrderId: orders.copiedOrderId,
      copyFeedbackKey: orders.copyFeedbackKey,
      formatPickingQty: shared.formatPickingQty,
      getStateBadgeClass: shared.getStateBadgeClass,
      handleCopyOrderId: orders.handleCopyOrderId,
    },
  };
}
