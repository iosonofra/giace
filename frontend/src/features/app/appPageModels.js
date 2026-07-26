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
      associationSummary: associations.associationSummary,
      availabilityFilter: associations.availabilityFilter,
      handleDeleteAssociation: (
        associations.handleDeleteAssociation
      ),
      handleOpenEditAssociation: (
        associationEditor.handleOpenEditAssociation
      ),
      handleSortProduct: associations.handleSortProduct,
      handleFileUpload: syncActions.handleFileUpload,
      highlightText: shared.highlightText,
      Icons: shared.Icons,
      paginatedProducts: associations.paginatedProducts,
      Pagination: shared.Pagination,
      productData: associations.productData,
      productsLimit: associations.productsLimit,
      productsPage: associations.productsPage,
      productSort: associations.productSort,
      searchProduct: associations.searchProduct,
      setProductsPage: associations.setProductsPage,
      setProductsLimit: associations.setProductsLimit,
      setAvailabilityFilter: associations.setAvailabilityFilter,
      setSearchProduct: associations.setSearchProduct,
      sortedProducts: associations.sortedProducts,
      TableSkeleton: shared.TableSkeleton,
      tabLoading: runtime.tabLoading,
      loading: appData.loading,
      totalProductsPages: associations.totalProductsPages,
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
      copiedOrderId: orders.copiedOrderId,
      filteredOrders: orders.filteredOrders,
      formatDate: shared.formatDate,
      getOrderStateBadgeClass: (
        shared.getOrderStateBadgeClass
      ),
      handleCopyOrderId: orders.handleCopyOrderId,
      highlightText: shared.highlightText,
      loading: appData.loading,
      ordersAvailableStates: orders.ordersAvailableStates,
      ordersLimit: orders.ordersLimit,
      ordersPage: orders.ordersPage,
      ordersWithoutAssociations: (
        orders.ordersWithoutAssociations
      ),
      orderStateFilter: orders.orderStateFilter,
      Pagination: shared.Pagination,
      searchOrder: orders.searchOrder,
      setOrderStateFilter: orders.setOrderStateFilter,
      setOrdersLimit: orders.setOrdersLimit,
      setOrdersPage: orders.setOrdersPage,
      setSearchOrder: orders.setSearchOrder,
      TableSkeleton: shared.TableSkeleton,
      tabLoading: runtime.tabLoading,
      totalOrders: orders.totalOrders,
      totalOrdersPages: orders.totalOrdersPages,
    },
    stockUi: {
      ...stock,
      getRelativeTimeString: shared.getRelativeTimeString,
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
      formatPickingQty: shared.formatPickingQty,
      getStateBadgeClass: shared.getStateBadgeClass,
      handleCopyOrderId: orders.handleCopyOrderId,
    },
  };
}
