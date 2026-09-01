import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Icons } from './components/ui/Icons';
import { Pagination } from './components/ui/Pagination';
import { TableSkeleton } from './components/ui/TableSkeleton';
import { ToastStack } from './components/ui/ToastStack';
import { AppHeader } from './features/app/AppHeader';
import { AppOverlays } from './features/app/AppOverlays';
import { AppSidebar } from './features/app/AppSidebar';
import {
  formatDate,
  getOrderStateBadgeClass,
  highlightText,
} from './features/app/appPresentation';
import { createAppPageModels } from './features/app/appPageModels';
import { useAppData } from './features/app/useAppData';
import { useAppShellEffects } from './features/app/useAppShellEffects';
import { readStoredTheme } from './features/app/theme';
import { useAnomaliesData } from './features/anomalies/useAnomaliesData';
import { useAssociationsData } from './features/associations/useAssociationsData';
import {
  deriveDashboardPresentation,
} from './features/dashboard/dashboardPresentation';
import { useAssociationEditor } from './features/associations/useAssociationEditor';
import { useOrdersData } from './features/orders/useOrdersData';
import { PickingPage } from './features/picking/PickingPage';
import {
  formatPickingQty,
  getOrderPickingMeta,
  getPickingRemainingQty,
  getRelativeTimeString,
  getRequirementMeta,
  getStateBadgeClass,
} from './features/picking/pickingUtils';
import { usePickingCore } from './features/picking/usePickingCore';
import { derivePickingPresentation } from './features/picking/pickingPresentation';
import { createPickingPageModel } from './features/picking/pickingPageModel';
import { usePickingClipboard } from './features/picking/usePickingClipboard';
import { useAutomaticPicking } from './features/picking/useAutomaticPicking';
import { usePickingSheetWrite } from './features/picking/usePickingSheetWrite';
import { useBackupRestore } from './features/settings/useBackupRestore';
import { useSettingsData } from './features/settings/useSettingsData';
import { StockPage } from './features/stock/StockPage';
import { useStockData } from './features/stock/useStockData';
import { useSyncActions } from './features/sync/useSyncActions';

const deferredPageLoaders = {
  anomalies: () => import('./features/anomalies/AnomaliesPage'),
  associations: () => import('./features/associations/AssociationsPage'),
  dashboard: () => import('./features/dashboard/DashboardPage'),
  orders: () => import('./features/orders/OrdersPage'),
  settings: () => import('./features/settings/SettingsPage'),
};

const AnomaliesPage = lazy(() => deferredPageLoaders.anomalies()
  .then(module => ({ default: module.AnomaliesPage })));
const AssociationsPage = lazy(() => deferredPageLoaders.associations()
  .then(module => ({ default: module.AssociationsPage })));
const DashboardPage = lazy(() => deferredPageLoaders.dashboard()
  .then(module => ({ default: module.DashboardPage })));
const OrdersPage = lazy(() => deferredPageLoaders.orders()
  .then(module => ({ default: module.OrdersPage })));
const SettingsPage = lazy(() => deferredPageLoaders.settings()
  .then(module => ({ default: module.SettingsPage })));


function DeferredPageFallback() {
  return (
    <div className="glass-panel widget-card deferred-page-fallback">
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}


function App() {
  const [activeTab, setActiveTab] = useState(() => (
    new URLSearchParams(window.location.search).has('settings') ? 'settings' : 'stock'
  ));
  const [, setTimeTick] = useState(Date.now());
  const [tabLoading, setTabLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Theme settings
  const [theme, setTheme] = useState(readStoredTheme);

  const [syncingStock, setSyncingStock] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState('');

  const pickingCore = usePickingCore({ showActionMsg });
  const {
    countedPickingSkus,
    pickingInputMode,
    pickingRequirementFilter,
    pickingResults,
    pickingViewMode,
    setPickingError,
    setPickingFilesAnomalies,
    setPickingFilesSummary,
    setPickingLoading,
    setPickingRequirementFilter,
    setPickingResults,
    setPickingViewMode,
  } = pickingCore;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const appData = useAppData({ notify: showActionMsg });
  const {
    configuredStockSource,
    dashboardData,
    initialized,
    loading,
    refreshAppData,
    selectedSheet,
    setLoading,
    status,
  } = appData;

  useEffect(() => {
    if (!initialized) return;
    Object.values(deferredPageLoaders).forEach(loadPage => {
      loadPage().catch(() => {
        // React.lazy will retry and surface a loading error on navigation.
      });
    });
  }, [initialized]);

  const backupState = useBackupRestore({ showActionMsg });
  const {
    backupLoading,
    handleDownloadBackup,
    handleRestoreDatabase,
    lastBackupAt,
    restoreCountdown,
    restoreLoading,
    setShowRestoreConfirm,
  } = backupState;

  const settingsData = useSettingsData({
    active: activeTab === 'settings',
    initialStockSource: configuredStockSource,
    preload: Boolean(status),
    refresh: refreshAppData,
    refreshKey: [
      status?.latest_calculation?.id,
      status?.active_warehouse_batch?.id,
      status?.active_associations_batch?.id,
    ].join(':'),
    setSyncingStock,
    setTabLoading,
    showActionMsg,
  });
  const {
    settingsReady,
    setSyncingGoogleSheets,
    stockSource,
    syncingGoogleSheets,
  } = settingsData;

  const handleNavigate = useCallback((nextTab) => {
    if (nextTab === activeTab) return;
    const needsForegroundData = [
      'anomalies',
      'associations',
      'orders',
      'settings',
      'stock',
    ].includes(nextTab);
    setTabLoading(
      needsForegroundData
      && !(nextTab === 'settings' && settingsReady),
    );
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setActiveTab(nextTab);
  }, [activeTab, settingsReady]);

  const syncActions = useSyncActions({
    refresh: refreshAppData,
    selectedSheet,
    setLoading,
    setSyncingGoogleSheets,
    setSyncingOrders,
    setSyncingStock,
    setSyncProgressText,
    showActionMsg,
    stockSource,
  });
  const {
    handleRunCalculation,
    handleSyncAll,
    handleSyncOrders,
    ordersSyncSuccessKey,
    syncAllSuccessKey,
  } = syncActions;

  const stockState = useStockData({
    active: activeTab === 'stock' && initialized,
    ensureLoaded: activeTab === 'picking' && pickingInputMode === 'automatic',
    refreshKey: [
      status?.latest_calculation?.id,
      status?.active_warehouse_batch?.id,
      status?.active_associations_batch?.id,
    ].join(':'),
    setTabLoading,
    showActionMsg,
  });
  const {
    selectedSkuForOrders,
    selectedSkuForProducts,
    selectedAssociatedProduct,
    setSelectedAssociatedProduct,
    setSelectedSkuForOrders,
    setSelectedSkuForProducts,
    stockData,
  } = stockState;

  const anomaliesState = useAnomaliesData({
    active: activeTab === 'anomalies',
    refresh: refreshAppData,
    refreshKey: [
      status?.latest_calculation?.id,
      status?.active_warehouse_batch?.id,
      status?.active_associations_batch?.id,
    ].join(':'),
    setTabLoading,
    showActionMsg,
  });
  const { setShowClearAnomaliesConfirm } = anomaliesState;

  const associationsState = useAssociationsData({
    active: activeTab === 'associations',
    refresh: refreshAppData,
    refreshKey: [
      status?.latest_calculation?.id,
      status?.active_warehouse_batch?.id,
      status?.active_associations_batch?.id,
    ].join(':'),
    setTabLoading,
    showActionMsg,
  });
  const { setShowDeleteAssociationConfirm } = associationsState;

  const associationEditor = useAssociationEditor({
    notify: showActionMsg,
    refresh: refreshAppData,
  });
  const automaticPicking = useAutomaticPicking({
    stockData,
    setPickingError,
    setPickingFilesAnomalies,
    setPickingFilesSummary,
    setPickingLoading,
    setPickingRequirementFilter,
    setPickingResults,
    setPickingViewMode,
  });
  const {
    autoPickingRemainingFilter,
    autoPickingRemainingQuery,
    autoPickingRemainingVisibleLimit,
  } = automaticPicking;

  const {
    setIsAssociationModalOpen,
    setEditingProductId,
    setIsNewAssociation,
    setAssociationModalMode,
    setGuidedComponents,
    setRawAssociationText,
  } = associationEditor;

  const ordersState = useOrdersData({
    active: activeTab === 'orders',
    refreshKey: [
      status?.latest_calculation?.id,
      status?.active_warehouse_batch?.id,
      status?.active_associations_batch?.id,
    ].join(':'),
    setTabLoading,
    showActionMsg,
  });
  useAppShellEffects({
    activeTab,
    selectedSkuForOrders,
    selectedSkuForProducts,
    selectedAssociatedProduct,
    setActiveTab: handleNavigate,
    setIsAssociationModalOpen,
    setIsMobileSidebarOpen,
    setSelectedSkuForOrders,
    setSelectedSkuForProducts,
    setSelectedAssociatedProduct,
    setShowClearAnomaliesConfirm,
    setShowDeleteAssociationConfirm,
    setShowRestoreConfirm,
    setTimeTick,
    theme,
  });

  function showActionMsg(text, type = 'success', options = {}) {
    const serial = toastIdRef.current += 1;
    const id = options.id || `toast-${serial}`;
    const normalizedType = ['success', 'warning', 'danger', 'info'].includes(type) ? type : 'info';
    const nextToast = {
      id,
      instanceId: `${id}-${serial}`,
      text,
      type: normalizedType,
      action: options.action,
      duration: options.duration,
    };

    setToasts(current => {
      const withoutRepeatedToast = current.filter(toast => (
        toast.id !== id && !(toast.text === text && toast.type === normalizedType)
      ));
      return [...withoutRepeatedToast, nextToast].slice(-3);
    });
  }

  function dismissToast(id) {
    setToasts(current => current.filter(toast => toast.id !== id));
  }

  const handleResolveMissingAssociation = (productId) => {
    handleNavigate('associations');
    setEditingProductId(productId);
    setIsNewAssociation(true);
    setAssociationModalMode('guided');
    setGuidedComponents([{ sku: '', qty_required: 1 }]);
    setRawAssociationText('');
    setIsAssociationModalOpen(true);
  };

  const {
    dashboardHasAssociations,
    dashboardHasOrdersSync,
    dashboardHasStock,
    dashboardHealthLabel,
    dashboardHealthText,
    dashboardHealthTone,
    dashboardNextAction,
  } = deriveDashboardPresentation({
    dashboardData,
    onNavigate: handleNavigate,
    onRunCalculation: handleRunCalculation,
    onSyncAll: handleSyncAll,
    status,
  });

  const pickingPresentation = derivePickingPresentation({
    results: pickingResults,
    countedSkus: countedPickingSkus,
    requirementFilter: pickingRequirementFilter,
    remainingFilter: autoPickingRemainingFilter,
    remainingQuery: autoPickingRemainingQuery,
    remainingVisibleLimit: autoPickingRemainingVisibleLimit,
  });
  const pickingClipboard = usePickingClipboard({
    results: pickingResults,
    viewMode: pickingViewMode,
    notify: showActionMsg,
  });
  const pickingSheetWrite = usePickingSheetWrite({
    notify: showActionMsg,
    refresh: refreshAppData,
    results: pickingResults,
  });
  const pickingPageModel = createPickingPageModel({
    automatic: automaticPicking,
    clipboard: pickingClipboard,
    core: pickingCore,
    orders: ordersState,
    presentation: pickingPresentation,
    sheetWrite: pickingSheetWrite,
    shared: {
      formatPickingQty,
      getOrderPickingMeta,
      getPickingRemainingQty,
      getRelativeTimeString,
      getRequirementMeta,
      getStateBadgeClass,
      TableSkeleton,
    },
  });

  const {
    anomaliesUi,
    associationsUi,
    dashboardUi,
    ordersUi,
    stockUi,
  } = createAppPageModels({
    appData,
    associationEditor,
    associations: associationsState,
    anomalies: anomaliesState,
    dashboardPresentation: {
      dashboardHasAssociations,
      dashboardHasOrdersSync,
      dashboardHasStock,
      dashboardHealthLabel,
      dashboardHealthText,
      dashboardHealthTone,
      dashboardNextAction,
    },
    orders: ordersState,
    runtime: {
      handleResolveMissingAssociation,
      setActiveTab: handleNavigate,
      syncingOrders,
      syncingStock,
      syncProgressText,
      tabLoading,
    },
    settings: settingsData,
    shared: {
      formatDate,
      formatPickingQty,
      getOrderStateBadgeClass,
      getRelativeTimeString,
      getStateBadgeClass,
      highlightText,
      Icons,
      Pagination,
      TableSkeleton,
    },
    stock: stockState,
    syncActions,
  });

  return (
    <div className="app-container">
      <AppSidebar
        activeTab={activeTab}
        anomaliesCount={dashboardData?.anomalies_count || 0}
        icons={Icons}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigate={handleNavigate}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        status={status}
        theme={theme}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <ToastStack toasts={toasts} onDismiss={dismissToast} />

        <AppHeader
          activeTab={activeTab}
          icons={Icons}
          loading={loading}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onRefresh={refreshAppData}
          onSyncAll={handleSyncAll}
          onSyncOrders={handleSyncOrders}
          ordersSyncSuccessKey={ordersSyncSuccessKey}
          stockSource={stockSource}
          syncAllSuccessKey={syncAllSuccessKey}
          syncingGoogleSheets={syncingGoogleSheets}
          syncingOrders={syncingOrders}
        />



        <div key={activeTab} className="app-page-stage">
          <Suspense fallback={<DeferredPageFallback />}>
            {/* --- DASHBOARD TAB --- */}
            {activeTab === 'dashboard' && dashboardData && <DashboardPage dashboard={dashboardUi} />}

            {/* --- STOCK TAB --- */}
            {activeTab === 'stock' && <StockPage stock={stockUi} />}

            {/* --- ORDERS TAB --- */}
            {activeTab === 'orders' && <OrdersPage orders={ordersUi} />}

            {/* --- ANOMALIES TAB --- */}
            {activeTab === 'anomalies' && <AnomaliesPage anomalies={anomaliesUi} />}

            {/* --- ASSOCIATIONS EDITOR TAB --- */}
            {activeTab === 'associations' && <AssociationsPage associations={associationsUi} />}

            {/* --- PICKING LIST TAB --- */}
            {activeTab === 'picking' && (
              <PickingPage {...pickingPageModel} />
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
              tabLoading ? (
                <DeferredPageFallback />
              ) : (
                <SettingsPage
                  settings={{
                    ...settingsData,
                    backupLoading,
                    getRelativeTimeString,
                    handleDownloadBackup,
                    handleRestoreDatabase,
                    handleSyncOrders,
                    Icons,
                    loading,
                    lastBackupAt,
                    restoreCountdown,
                    restoreLoading,
                    status,
                    syncingOrders,
                    syncProgressText,
                  }}
                />
              )
            )}
          </Suspense>
        </div>

      </main>

      <AppOverlays
        associationEditor={associationEditor}
        associations={associationsState}
        anomalies={anomaliesState}
        backup={backupState}
        stockData={stockData}
        stockUi={stockUi}
      />
    </div>
  );
}

export default App;
