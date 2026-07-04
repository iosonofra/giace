import React, { useState, useEffect, useRef } from 'react';

// SVG Icons
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
    </svg>
  ),
  Stock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Product: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Orders: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Anomaly: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Associations: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Delete: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Picking: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Sync: ({ spinning = false } = {}) => (
    <svg
      style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: '-0.125em', animation: spinning ? 'spin 0.8s linear infinite' : 'none', transformOrigin: 'center' }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Full circular arrow (iOS arrow.clockwise style) */}
      <path d="M21 12a9 9 0 1 1-9-9" />
      <polyline points="21 3 21 9 15 9" fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  ),

  Eye: () => (
    <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  ExternalLink: () => (
    <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
};

const getRelativeTimeString = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(date.getTime())) return '';
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'meno di un minuto fa';
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;
};

/** Maps a state label string to a semantic CSS class for the drawer badge */
const getStateBadgeClass = (label = '') => {
  const l = label.toLowerCase();
  if (l.includes('magazzin') || l.includes('preparazione') || l.includes('attesa'))
    return 'badge-state badge-state-magazzino';
  if (l.includes('pagamento') || l.includes('payment'))
    return 'badge-state badge-state-pagamento';
  if (l.includes('spedito') || l.includes('consegnato') || l.includes('shipped') || l.includes('delivered'))
    return 'badge-state badge-state-spedito';
  if (l.includes('annullat') || l.includes('rimbors') || l.includes('cancel') || l.includes('refund'))
    return 'badge-state badge-state-annullato';
  return 'badge-state badge-state-default';
};

function App() {
  const [activeTab, setActiveTab] = useState('stock');
  const [timeTick, setTimeTick] = useState(Date.now());
  const [tabLoading, setTabLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Theme settings
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // States settings
  const [orderStates, setOrderStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  
  // PrestaShop connection settings
  const [prestashopUrl, setPrestashopUrl] = useState('');
  const [prestashopAdminUrl, setPrestashopAdminUrl] = useState('');
  const [prestashopApiKey, setPrestashopApiKey] = useState('');
  const [prestashopMockMode, setPrestashopMockMode] = useState(true);
  const [prestashopSyncInterval, setPrestashopSyncInterval] = useState(10);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [syncingStock, setSyncingStock] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Pagination states for Orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(50);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalOrdersPages, setTotalOrdersPages] = useState(1);

  // Pagination states for Products (Kits)
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(50);

  // Pagination states for Anomalies
  const [anomaliesPage, setAnomaliesPage] = useState(1);
  const [anomaliesLimit, setAnomaliesLimit] = useState(50);
  
  // Modal Editor states for Associations
  const [isAssociationModalOpen, setIsAssociationModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [isNewAssociation, setIsNewAssociation] = useState(false);
  const [associationModalMode, setAssociationModalMode] = useState('guided');
  const [guidedComponents, setGuidedComponents] = useState([{ sku: '', qty_required: 1 }]);
  const [rawAssociationText, setRawAssociationText] = useState('');
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(null);
  
  // Picking List states
  const [rawPickingText, setRawPickingText] = useState('');
  const [pickingResults, setPickingResults] = useState(null);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [pickingError, setPickingError] = useState(null);
  
  // Backup & Restore states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreCountdown, setRestoreCountdown] = useState(null);
  const [restoreFileRef, setRestoreFileRef] = useState(null);
  
  // Sheet select list for giacenza.xlsx
  const [availableSheets, setAvailableSheets] = useState(['ROSATE']);
  const [selectedSheet, setSelectedSheet] = useState('ROSATE');

  // Search filters
  const [searchStock, setSearchStock] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');

  // Table Sorting States
  const [stockSort, setStockSort] = useState({ field: 'index', direction: 'asc' });
  const [productSort, setProductSort] = useState({ field: 'product_id', direction: 'asc' });

  // Table Data
  const [stockData, setStockData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [anomalyData, setAnomalyData] = useState([]);

  // States for committed orders popup
  const [selectedSkuForOrders, setSelectedSkuForOrders] = useState(null);
  const [skuOrdersData, setSkuOrdersData] = useState([]);
  const [loadingSkuOrders, setLoadingSkuOrders] = useState(false);

  // States for Google Sheets integration
  const [stockSource, setStockSource] = useState('local_upload');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetName, setGoogleSheetName] = useState('ROSATE');
  const [googleSheetSyncInterval, setGoogleSheetSyncInterval] = useState(10);
  const [googleSheetLastSync, setGoogleSheetLastSync] = useState('');
  const [googleSheetLastError, setGoogleSheetLastError] = useState('');
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);

  // States for column mapping
  const [mappingSku, setMappingSku] = useState('Sku');
  const [mappingQty, setMappingQty] = useState('Qta Tot.');
  const [mappingDesc, setMappingDesc] = useState('Descrizione Sku');
  const [mappingLotto, setMappingLotto] = useState('Lotto');

  // Apply theme class to body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Tick timer to refresh relative times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch status and KPIs
  const fetchData = async () => {
    setLoading(true);
    try {
      const resStatus = await fetch('/api/status');
      const dataStatus = await resStatus.json();
      setStatus(dataStatus);

      const resDash = await fetch('/api/dashboard');
      const dataDash = await resDash.json();
      setDashboardData(dataDash);
      
      // Load current settings (like stockSource) on startup
      try {
        const resSettings = await fetch('/api/settings');
        if (resSettings.ok) {
          const currentSettings = await resSettings.json();
          setStockSource(currentSettings.stock_source || 'local_upload');
        }
      } catch (err) {
        console.error("Failed to load settings in fetchData", err);
      }
      
      // Fetch sheet names if local file exists
      if (dataStatus.local_files?.giacenza_exists) {
        try {
          const resSheets = await fetch('/api/import/sheets');
          const dataSheets = await resSheets.json();
          if (dataSheets.sheets) {
            setAvailableSheets(dataSheets.sheets);
            if (dataSheets.sheets.includes('ROSATE') && !dataStatus.active_warehouse_batch) {
              setSelectedSheet('ROSATE');
            } else if (dataStatus.active_warehouse_batch?.sheet_name) {
              setSelectedSheet(dataStatus.active_warehouse_batch.sheet_name);
            }
          }
        } catch (e) {
          console.error("Sheets loading failed", e);
        }
      }
    } catch (e) {
      console.error(e);
      showActionMsg('Errore nel recupero dei dati del server.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset productsPage to 1 when search or sorting changes
  useEffect(() => {
    setProductsPage(1);
  }, [searchProduct, productSort]);

  // Reset anomaliesPage to 1 when anomalies length changes
  useEffect(() => {
    setAnomaliesPage(1);
  }, [anomalyData.length]);

  // Fetch specific tab data
  useEffect(() => {
    setTabLoading(true);
    if (activeTab === 'stock') {
      fetch('/api/stock')
        .then(r => r.json())
        .then(setStockData)
        .catch(console.error)
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'associations') {
      fetch('/api/products')
        .then(r => r.json())
        .then(setProductData)
        .catch(console.error)
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'orders') {
      fetch(`/api/orders?page=${ordersPage}&limit=${ordersLimit}`)
        .then(r => r.json())
        .then(data => {
          setOrderData(data.orders || []);
          setTotalOrders(data.total || 0);
          setTotalOrdersPages(data.total_pages || 1);
        })
        .catch(console.error)
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'anomalies') {
      fetch('/api/anomalies')
        .then(r => r.json())
        .then(setAnomalyData)
        .catch(console.error)
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'settings') {
      // Fetch states and active settings
      setSettingsError(null);
      Promise.all([
        fetch('/api/order-states').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
      ]).then(([states, currentSettings]) => {
        setOrderStates(states);
        setSelectedStates(currentSettings.included_state_ids || []);
        setPrestashopUrl(currentSettings.prestashop_url || '');
        setPrestashopAdminUrl(currentSettings.prestashop_admin_url || '');
        setPrestashopApiKey(currentSettings.prestashop_api_key || '');
        setPrestashopMockMode(currentSettings.prestashop_mock_mode !== false);
        setPrestashopSyncInterval(currentSettings.prestashop_sync_interval || 10);
        // Google Sheets Sync Settings
        setStockSource(currentSettings.stock_source || 'local_upload');
        setGoogleSheetUrl(currentSettings.google_sheet_url || '');
        setGoogleSheetName(currentSettings.google_sheet_name || 'ROSATE');
        setGoogleSheetSyncInterval(currentSettings.google_sheet_sync_interval || 10);
        setGoogleSheetLastSync(currentSettings.google_sheet_last_sync || '');
        setGoogleSheetLastError(currentSettings.google_sheet_last_error || '');
        // Column mapping settings
        setMappingSku(currentSettings.mapping_sku || 'Sku');
        setMappingQty(currentSettings.mapping_qty || 'Qta Tot.');
        setMappingDesc(currentSettings.mapping_desc || 'Descrizione Sku');
        setMappingLotto(currentSettings.mapping_lotto || 'Lotto');
      }).catch(err => {
        console.error(err);
        setSettingsError("Errore nel caricamento delle impostazioni da PrestaShop.");
      }).finally(() => setTabLoading(false));
    } else {
      setTabLoading(false);
    }
  }, [activeTab, ordersPage, ordersLimit]);

  const showActionMsg = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Import local files
  const handleLocalImport = async (fileType) => {
    setLoading(true);
    setSyncingStock(true);
    try {
      const formData = new FormData();
      formData.append('use_local', 'true');
      if (fileType === 'warehouse') {
        formData.append('sheet_name', selectedSheet);
      }
      
      const endpoint = fileType === 'warehouse' ? '/api/import/warehouse' : '/api/import/associations';
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg(`Importato ${fileType} con successo! Record: ${data.records_imported}, Anomalie: ${data.anomalies_found}`);
        fetchData();
      } else {
        showActionMsg(`Errore nell'importazione: ${data.detail}`, 'danger');
      }
    } catch (e) {
      showActionMsg(`Errore: ${e.message}`, 'danger');
    } finally {
      setSyncingStock(false);
      setLoading(false);
    }
  };

  // Upload custom file
  const handleFileUpload = async (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setSyncingStock(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fileType === 'warehouse') {
        formData.append('sheet_name', selectedSheet);
      }
      
      const endpoint = fileType === 'warehouse' ? '/api/import/warehouse' : '/api/import/associations';
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg(`Caricato ${file.name} con successo! Record: ${data.records_imported}, Anomalie: ${data.anomalies_found}`);
        fetchData();
      } else {
        showActionMsg(`Errore caricamento: ${data.detail}`, 'danger');
      }
    } catch (e) {
      showActionMsg(`Errore caricamento: ${e.message}`, 'danger');
    } finally {
      setSyncingStock(false);
      setLoading(false);
    }
  };

  // Start polling synchronization progress
  const startStatusPolling = () => {
    setSyncProgressText('Inizializzazione...');
    const intervalId = setInterval(async () => {
      try {
        const resp = await fetch('/api/prestashop/sync-status');
        if (resp.ok) {
          const statusData = await resp.json();
          if (statusData.active) {
            let msg = '';
            if (statusData.phase === 'fetching_orders') {
              if (statusData.total_orders > 0) {
                msg = `Sincronizzazione ordini... (${statusData.synced_orders}/${statusData.total_orders})`;
              } else {
                msg = `Scaricamento ordini...`;
              }
            } else if (statusData.phase === 'saving') {
              msg = `Salvataggio nel database...`;
            } else if (statusData.phase === 'calculating') {
              msg = `Ricalcolo giacenze...`;
            } else {
              msg = `Sincronizzazione in corso...`;
            }
            setSyncProgressText(msg);
          }
        }
      } catch (err) {
        console.error("Errore nel polling dello stato sync:", err);
      }
    }, 1000);
    return intervalId;
  };

  // Sync orders from PrestaShop webservice
  const handleSyncOrders = async () => {
    setLoading(true);
    setSyncingOrders(true);
    const pollId = startStatusPolling();
    try {
      const res = await fetch('/api/prestashop/sync-orders', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showActionMsg(`Sincronizzati ${data.orders_synced} ordini con successo! (Mode: ${data.mock_mode ? 'MOCK' : 'REAL'})`);
        fetchData();
      } else {
        showActionMsg(`Errore sincronizzazione ordini: ${data.detail}`, 'danger');
      }
    } catch (e) {
      showActionMsg(`Errore nel sync: ${e.message}`, 'danger');
    } finally {
      clearInterval(pollId);
      setSyncingOrders(false);
      setLoading(false);
      setSyncProgressText('');
    }
  };

  // Sync stock from Google Sheets (if active) and orders from PrestaShop, then recalculate
  const handleSyncAll = async () => {
    setLoading(true);
    setSyncingOrders(true);
    if (stockSource === 'google_sheets') {
      setSyncingStock(true);
    }
    const pollId = startStatusPolling();
    try {
      // 1. Sync Stock if Google Sheets is active
      if (stockSource === 'google_sheets') {
        const resStock = await fetch('/api/settings/google-sheets/sync', { method: 'POST' });
        const dataStock = await resStock.json();
        if (!resStock.ok) {
          showActionMsg(`Errore sincronizzazione Google Sheets: ${dataStock.detail}`, 'danger');
          setSyncingStock(false);
          setSyncingOrders(false);
          setLoading(false);
          clearInterval(pollId);
          setSyncProgressText('');
          return;
        }
        setSyncingStock(false);
      }
      
      // 2. Sync PrestaShop Orders
      const resOrders = await fetch('/api/prestashop/sync-orders', { method: 'POST' });
      const dataOrders = await resOrders.json();
      if (resOrders.ok) {
        let msg = '';
        if (stockSource === 'google_sheets') {
          msg = `Sincronizzazione completata! Giacenze Google Sheets aggiornate e sincronizzati ${dataOrders.orders_synced} ordini PrestaShop.`;
        } else {
          msg = `Sincronizzazione completata! Sincronizzati ${dataOrders.orders_synced} ordini PrestaShop. Le giacenze fisiche rimangono quelle del file Excel locale.`;
        }
        showActionMsg(msg, 'success');
        fetchData();
      } else {
        showActionMsg(`Errore sincronizzazione ordini: ${dataOrders.detail}`, 'danger');
      }
    } catch (e) {
      showActionMsg(`Errore durante la sincronizzazione: ${e.message}`, 'danger');
    } finally {
      clearInterval(pollId);
      setSyncingStock(false);
      setSyncingOrders(false);
      setLoading(false);
      setSyncProgressText('');
    }
  };

  // Re-run calculation manually
  const handleRunCalculation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calc/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showActionMsg(`Ricalcolo completato con successo (Run ID: ${data.calc_run_id})!`);
        fetchData();
      } else {
        showActionMsg(`Errore ricalcolo: ${data.detail}`, 'danger');
      }
    } catch (e) {
      showActionMsg(`Errore ricalcolo: ${e.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Clear anomalies log
  const handleClearAnomalies = async () => {
    if (!window.confirm("Sei sicuro di voler pulire il registro delle anomalie?")) return;
    try {
      const res = await fetch('/api/anomalies/clear', { method: 'POST' });
      if (res.ok) {
        showActionMsg("Registro anomalie svuotato.");
        if (activeTab === 'anomalies') {
          setAnomalyData([]);
        }
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Settings checkbox handler
  const handleToggleState = async (stateId) => {
    const isSelected = selectedStates.includes(stateId);
    let updated;
    if (isSelected) {
      updated = selectedStates.filter(id => id !== stateId);
    } else {
      updated = [...selectedStates, stateId];
    }
    
    setSelectedStates(updated);
    
    // Save settings
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ included_state_ids: updated })
      });
      if (res.ok) {
        showActionMsg("Impostazioni salvate con successo.");
      }
    } catch (e) {
       console.error("Failed to save settings", e);
    }
  };

  const fetchSkuOrders = async (sku) => {
    setLoadingSkuOrders(true);
    setSelectedSkuForOrders(sku);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(sku)}/orders`);
      if (res.ok) {
        const data = await res.json();
        setSkuOrdersData(data);
      } else {
        setSkuOrdersData([]);
      }
    } catch (err) {
      console.error("Errore nel recupero degli ordini impegnati:", err);
      setSkuOrdersData([]);
    } finally {
      setLoadingSkuOrders(false);
    }
  };

  const handleSaveConnectionSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError(null);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestashop_url: prestashopUrl,
          prestashop_admin_url: prestashopAdminUrl,
          prestashop_api_key: prestashopApiKey,
          prestashop_mock_mode: prestashopMockMode,
          prestashop_sync_interval: prestashopSyncInterval
        })
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg("Impostazioni di connessione salvate con successo.");
        // Refresh status and order states
        fetchData();
        // Reload order states from API
        const statesRes = await fetch('/api/order-states');
        const statesData = await statesRes.json();
        setOrderStates(statesData);
      } else {
        setSettingsError(data.detail || "Errore sconosciuto durante il salvataggio.");
      }
    } catch (err) {
      console.error(err);
      setSettingsError("Errore di rete durante il salvataggio.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveGoogleSheetsSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_source: stockSource,
          google_sheet_url: googleSheetUrl,
          google_sheet_name: googleSheetName,
          google_sheet_sync_interval: googleSheetSyncInterval,
          mapping_sku: mappingSku,
          mapping_qty: mappingQty,
          mapping_desc: mappingDesc,
          mapping_lotto: mappingLotto
        })
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg("Impostazioni giacenze salvate con successo.");
        fetchData();
      } else {
        setSettingsError(data.detail || "Errore nel salvataggio delle impostazioni.");
      }
    } catch (err) {
      console.error(err);
      setSettingsError("Errore nella richiesta di salvataggio delle impostazioni.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSyncGoogleSheetsNow = async () => {
    setSyncingGoogleSheets(true);
    setSyncingStock(true);
    setSettingsError(null);
    try {
      const res = await fetch('/api/settings/google-sheets/sync', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'skipped') {
          showActionMsg("Nessuna modifica rilevata nel Google Sheet. Giacenze già aggiornate.", "warning");
        } else {
          showActionMsg(`Sincronizzazione completata! Importate ${data.records_imported} SKU.`);
        }
        fetchData();
      } else {
        setSettingsError(data.detail || "Errore durante la sincronizzazione con Google Sheets.");
      }
    } catch (err) {
      console.error(err);
      setSettingsError("Errore durante la connessione per la sincronizzazione.");
    } finally {
      setSyncingStock(false);
      setSyncingGoogleSheets(false);
    }
  };

  const handleOpenEditAssociation = async (productId = null) => {
    if (productId) {
      setIsNewAssociation(false);
      setEditingProductId(String(productId));
      setAssociationModalMode('guided');
      try {
        const res = await fetch(`/api/associations/${productId}`);
        const data = await res.json();
        if (res.ok) {
          const comps = data.components && data.components.length > 0
            ? data.components.map(c => ({ sku: c.sku, qty_required: c.qty_required }))
            : [{ sku: '', qty_required: 1 }];
          setGuidedComponents(comps);
          // Calculate raw text representation
          const rawText = comps
            .filter(c => c.sku.trim())
            .map(c => Array(c.qty_required).fill(c.sku).join(','))
            .filter(Boolean)
            .join(',');
          setRawAssociationText(rawText);
          setIsAssociationModalOpen(true);
        } else {
          showActionMsg(`Errore nel caricamento dell'associazione: ${data.detail}`, 'danger');
        }
      } catch (err) {
        showActionMsg(`Errore di connessione: ${err.message}`, 'danger');
      }
    } else {
      setIsNewAssociation(true);
      setEditingProductId('');
      setAssociationModalMode('guided');
      setGuidedComponents([{ sku: '', qty_required: 1 }]);
      setRawAssociationText('');
      setIsAssociationModalOpen(true);
    }
  };

  const handleDeleteAssociation = async (productId) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'associazione per il prodotto composto ${productId}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/associations/${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg(`Associazione del prodotto ${productId} eliminata.`);
        fetchData();
      } else {
        showActionMsg(`Errore nell'eliminazione: ${data.detail || data.message}`, 'danger');
      }
    } catch (err) {
      showActionMsg(`Errore: ${err.message}`, 'danger');
    }
  };

  const handleSaveAssociation = async (e) => {
    if (e) e.preventDefault();
    
    if (!editingProductId || isNaN(editingProductId)) {
      showActionMsg("Il Product ID deve essere un numero valido.", "danger");
      return;
    }
    
    let compsToSend = [];
    if (associationModalMode === 'guided') {
      compsToSend = guidedComponents.filter(c => c.sku.trim() !== '');
    } else {
      // Parse raw comma-separated text
      const skus = rawAssociationText.split(',').map(s => s.trim()).filter(Boolean);
      const counts = {};
      for (const s of skus) {
        counts[s] = (counts[s] || 0) + 1;
      }
      compsToSend = Object.entries(counts).map(([sku, qty]) => ({ sku, qty_required: qty }));
    }
    
    if (compsToSend.length === 0) {
      showActionMsg("Inserisci almeno un componente SKU valido.", "danger");
      return;
    }
    
    try {
      const res = await fetch('/api/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(editingProductId),
          components: compsToSend
        })
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg("Associazione salvata con successo!");
        setIsAssociationModalOpen(false);
        fetchData();
      } else {
        showActionMsg(`Errore nel salvataggio: ${data.detail}`, 'danger');
      }
    } catch (err) {
      showActionMsg(`Errore: ${err.message}`, 'danger');
    }
  };

  const handleCalculatePicking = async (e) => {
    if (e) e.preventDefault();
    if (!rawPickingText.trim()) {
      setPickingError("Inserisci o incolla del testo contenente gli ID ordine da analizzare.");
      return;
    }
    
    // Extract unique standalone numbers (length 4 to 8 digits)
    const regex = /\b\d{4,8}\b/g;
    const matches = rawPickingText.match(regex) || [];
    const orderIds = Array.from(new Set(matches.map(Number)));
    
    if (orderIds.length === 0) {
      setPickingError("Nessun ID ordine valido (numero da 4 a 8 cifre) trovato nel testo incollato.");
      return;
    }
    
    setPickingLoading(true);
    setPickingError(null);
    setPickingResults(null);
    
    try {
      const res = await fetch('/api/orders/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds })
      });
      const data = await res.json();
      if (res.ok) {
        setPickingResults(data);
      } else {
        setPickingError(data.detail || "Errore durante l'elaborazione del fabbisogno.");
      }
    } catch (err) {
      setPickingError(`Errore di connessione: ${err.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const handleCopyPickingList = () => {
    if (!pickingResults || !pickingResults.sku_requirements) return;
    
    const textLines = [
      "=== LISTA PRELIEVO ===",
      `Data: ${new Date().toLocaleString('it-IT')}`,
      `Ordini trovati nel database: ${pickingResults.orders_found.join(', ')}`,
      pickingResults.orders_missing.length > 0 
        ? `Ordini non trovati: ${pickingResults.orders_missing.join(', ')}`
        : "Tutti gli ordini sono stati trovati nel database.",
      "",
      "SKU | DESCRIZIONE | RICHIESTO | DISPONIBILE | STATO",
      "-------------------------------------------------------"
    ];
    
    pickingResults.sku_requirements.forEach(req => {
      const diff = req.qty_stock - req.qty_required;
      const statusText = diff >= 0 ? "Disponibile" : `Mancano ${Math.abs(diff)}`;
      textLines.push(`${req.sku} | ${req.description} | Richiesto: ${req.qty_required} | Stock: ${req.qty_stock} | ${statusText}`);
    });
    
    navigator.clipboard.writeText(textLines.join('\n'))
      .then(() => {
        showActionMsg("Lista prelievo copiata negli appunti con successo!");
      })
      .catch(err => {
        showActionMsg("Errore durante la copia negli appunti.", "danger");
      });
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showActionMsg(data.detail || 'Errore durante il download del backup.', 'danger');
        return;
      }
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `inventory_backup_${today}.db`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showActionMsg(`Backup scaricato con successo: ${filename}`);
    } catch (err) {
      showActionMsg(`Errore nel download del backup: ${err.message}`, 'danger');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreDatabase = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset the file input so the same file can be reselected after an error
    e.target.value = '';
    
    const confirmed = window.confirm(
      `⚠️ ATTENZIONE: stai per ripristinare il database da "${file.name}".\n\n` +
      `Questa operazione SOVRASCRIVERÀ IRREVOCABILMENTE tutti i dati attuali (ordini, giacenze, associazioni, impostazioni).\n\n` +
      `Prima di procedere, viene salvata automaticamente una copia di emergenza del database corrente.\n\n` +
      `Vuoi continuare?`
    );
    if (!confirmed) return;
    
    setRestoreLoading(true);
    setRestoreCountdown(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/restore', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        showActionMsg(data.detail || 'Errore durante il ripristino del database.', 'danger');
        setRestoreLoading(false);
        return;
      }
      // Successful restore — start countdown and auto-reload
      let count = 6;
      setRestoreCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setRestoreCountdown(null);
          setRestoreLoading(false);
          window.location.reload();
        } else {
          setRestoreCountdown(count);
        }
      }, 1000);
    } catch (err) {
      showActionMsg(`Errore di connessione durante il ripristino: ${err.message}`, 'danger');
      setRestoreLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString('it-IT');
  };

  const handleCopyOrderId = (orderId) => {
    navigator.clipboard.writeText(String(orderId))
      .then(() => {
        setCopiedOrderId(orderId);
        setTimeout(() => setCopiedOrderId(null), 1500);
      })
      .catch((err) => {
        console.error("Errore nella copia dell'ID Ordine:", err);
      });
  };

  // Text search highlighter
  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const textStr = String(text);
    const parts = textStr.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i}>{part}</mark> 
            : part
        )}
      </span>
    );
  };

  // Sorting handlers
  const handleSortStock = (field) => {
    const direction = stockSort.field === field && stockSort.direction === 'asc' ? 'desc' : 'asc';
    setStockSort({ field, direction });
  };

  const handleSortProduct = (field) => {
    const direction = productSort.field === field && productSort.direction === 'asc' ? 'desc' : 'asc';
    setProductSort({ field, direction });
  };

  // Filters stock items
  const filteredStock = stockData.filter(item => 
    item.sku.toLowerCase().includes(searchStock.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchStock.toLowerCase()))
  );

  // Sort stock items
  const sortedStock = [...filteredStock].sort((a, b) => {
    let valA = a[stockSort.field];
    let valB = b[stockSort.field];
    
    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';
    
    if (typeof valA === 'number' && typeof valB === 'number') {
      return stockSort.direction === 'asc' ? valA - valB : valB - valA;
    }
    
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    return stockSort.direction === 'asc' 
      ? valA.localeCompare(valB) 
      : valB.localeCompare(valA);
  });

  // Filters products
  const filteredProducts = productData.filter(prod => 
    String(prod.product_id).includes(searchProduct) ||
    prod.components_str.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (prod.limiting_sku && prod.limiting_sku.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[productSort.field];
    let valB = b[productSort.field];
    
    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';
    
    if (typeof valA === 'number' && typeof valB === 'number') {
      return productSort.direction === 'asc' ? valA - valB : valB - valA;
    }
    
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    return productSort.direction === 'asc' 
      ? valA.localeCompare(valB) 
      : valB.localeCompare(valA);
  });

  const totalProductsPages = Math.ceil(sortedProducts.length / productsLimit) || 1;
  const paginatedProducts = sortedProducts.slice(
    (productsPage - 1) * productsLimit,
    productsPage * productsLimit
  );

  // Filters orders
  const filteredOrders = orderData.filter(order => 
    String(order.order_id).includes(searchOrder) ||
    order.current_state_label.toLowerCase().includes(searchOrder.toLowerCase()) ||
    order.lines.some(l => String(l.product_id).includes(searchOrder))
  );

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">G</div>
          <span className="brand-name">Giacenza</span>
        </div>

        <ul className="nav-list">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Icons.Dashboard />
            <span>Dashboard</span>
          </li>
          <li className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
            <Icons.Stock />
            <span>Giacenza</span>
          </li>

          <li className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Icons.Orders />
            <span>Ordini</span>
          </li>
          <li className={`nav-item ${activeTab === 'picking' ? 'active' : ''}`} onClick={() => setActiveTab('picking')}>
            <Icons.Picking />
            <span>Lista Prelievo</span>
          </li>
          <li className={`nav-item ${activeTab === 'anomalies' ? 'active' : ''}`} onClick={() => setActiveTab('anomalies')}>
            <Icons.Anomaly />
            <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              Anomalie
              {dashboardData?.anomalies_count > 0 && (
                <span className="badge badge-danger" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                  {dashboardData.anomalies_count}
                </span>
              )}
            </span>
          </li>
          <li className={`nav-item ${activeTab === 'associations' ? 'active' : ''}`} onClick={() => setActiveTab('associations')}>
            <Icons.Associations />
            <span>Editor Associazioni</span>
          </li>
          <li className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Icons.Settings />
            <span>Impostazioni</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button 
            type="button"
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <>
                <Icons.Sun />
                <span>Tema Chiaro</span>
              </>
            ) : (
              <>
                <Icons.Moon />
                <span>Tema Scuro</span>
              </>
            )}
          </button>

          {status && (
            <div className="status-card-sidebar">
              <div className="status-row">
                <span className={`status-indicator ${status.mock_mode ? 'warning' : 'success'}`}></span>
                <span className="status-label">
                  {status.mock_mode ? 'Mock Mode Attiva' : 'PrestaShop Connesso'}
                </span>
              </div>
              <div className="status-row second">
                <svg className="db-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span className="status-db-label">DB: SQLite locale</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top bar alert messages */}
        {actionMessage && (
          <div className={`badge badge-${actionMessage.type === 'danger' ? 'danger' : actionMessage.type === 'warning' ? 'warning' : 'success'}`} 
               style={{ width: '100%', borderRadius: '8px', padding: '12px 20px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Dynamic Headers based on active tab */}
        <header className="content-header">
          <div className="page-title">
            {activeTab === 'dashboard' && (
              <>
                <h1>Dashboard di Controllo</h1>
                <p>Panoramica e strumenti di caricamento/sync della disponibilità magazzino.</p>
              </>
            )}
            {activeTab === 'stock' && (
              <>
                <h1>Giacenza</h1>
                <p>Fai click sulle intestazioni di colonna per ordinare. Visualizza il livello di stock residuo.</p>
              </>
            )}
            {activeTab === 'associations' && (
              <>
                <h1>Editor Associazioni e Disponibilità Kit</h1>
                <p style={{ marginTop: '6px', lineHeight: '1.5', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Gestisci le associazioni tra i <strong>prodotti composti (kit o bundle)</strong> e i singoli articoli fisici.
                  Visualizza la <em>Disponibilità Finale</em> calcolata in tempo reale in base alle giacenze residue di ciascun articolo 
                  e scopri lo <em>SKU Limitante</em> che ne blocca/limita la vendita.
                </p>
              </>
            )}
            {activeTab === 'orders' && (
              <>
                <h1>Ordini Sincronizzati</h1>
                <p>Dettaglio ordini nello stato configurato con relative righe prodotto.</p>
              </>
            )}
            {activeTab === 'picking' && (
              <>
                <h1>Lista Prelievo (Preparazione Ordini)</h1>
                <p>Incolla qui l'elenco grezzo contenente gli ID ordine per calcolare all'istante il fabbisogno delle SKU necessarie.</p>
              </>
            )}
            {activeTab === 'anomalies' && (
              <>
                <h1>Registro Anomalie</h1>
                <p>Problematiche riscontrate nell'import dei file Excel e nella corrispondenza dei codici.</p>
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <h1>Impostazioni di Sincronizzazione</h1>
                <p>Configura quali stati degli ordini PrestaShop devono essere conteggiati come impegnato.</p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
              <Icons.Sync /> Ricarica Vista
            </button>
            <button className="btn btn-primary" onClick={handleSyncAll} disabled={loading}>
              Sincronizza Tutto
            </button>
          </div>
        </header>



        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && dashboardData && (
          <>
            {/* KPI Cards Grid */}
            <section className="kpi-grid">
              <div className="glass-panel kpi-card">
                <span className="kpi-title">SKU in Stock</span>
                <span className="kpi-value">{dashboardData.sku_count}</span>
                <span className="kpi-desc">
                  Ultimo import: {formatDate(dashboardData.latest_import_warehouse)}
                </span>
              </div>
              <div className="glass-panel kpi-card">
                <span className="kpi-title">Prodotti Composti</span>
                <span className="kpi-value">{dashboardData.product_count}</span>
                <span className="kpi-desc">
                  Ultimo import: {formatDate(dashboardData.latest_import_associations)}
                </span>
              </div>
              <div className="glass-panel kpi-card warning">
                <span className="kpi-title">Ordini Attivi</span>
                <span className="kpi-value">{dashboardData.order_count}</span>
                <span className="kpi-desc">{dashboardData.items_ordered} righe vendute</span>
              </div>
              <div className={`glass-panel kpi-card ${dashboardData.anomalies_count > 0 ? 'danger' : 'success'}`}>
                <span className="kpi-title">Anomalie</span>
                <span className="kpi-value">{dashboardData.anomalies_count}</span>
                <span className="kpi-desc">
                  {dashboardData.anomalies_count > 0 ? 'Richiede attenzione' : 'Dati integri e coerenti'}
                </span>
              </div>
            </section>

            {/* Dashboard Widgets */}
            <div className="dashboard-grid">
              {/* Operations & Imports Widget */}
              <div className="glass-panel widget-card">
                <span className="widget-title">Azioni e Ingestione File</span>
                
                <div className="upload-zone-wrapper">
                  {/* Stock Excel import / Google Sheets sync */}
                  {stockSource === 'google_sheets' ? (
                    <div style={{ background: 'rgba(99, 102, 241, 0.03)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span>
                        Sincronizzazione Google Sheets Attiva
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                        L'inventario delle giacenze è collegato al foglio di calcolo remoto.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-primary" 
                          disabled={syncingGoogleSheets}
                          onClick={handleSyncGoogleSheetsNow}
                          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        >
                          {syncingGoogleSheets ? "Sincronizzazione..." : "Sincronizza Ora"}
                        </button>
                        
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Verificato: {googleSheetLastSync ? new Date(googleSheetLastSync).toLocaleString('it-IT') : 'Mai'}
                        </span>
                      </div>
                      {status?.active_warehouse_batch && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '0' }}>
                          Batch attivo: <strong>{status.active_warehouse_batch.filename}</strong> (Foglio: {status.active_warehouse_batch.sheet_name}) con {status.active_warehouse_batch.record_count} SKU.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Carica Inventario (giacenza.xlsx)</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                        Seleziona il foglio di stock da elaborare.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {status?.local_files?.giacenza_exists && (
                          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Foglio Excel</label>
                            <select className="select-control" style={{ width: '180px' }} value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                              {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: status?.local_files?.giacenza_exists ? '18px' : '0' }}>
                          {status?.local_files?.giacenza_exists ? (
                            <button className="btn btn-primary" onClick={() => handleLocalImport('warehouse')} disabled={loading}>
                              Importa Local [{selectedSheet}]
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File giacenza.xlsx locale non trovato.</span>
                          )}
                          
                          <label className="btn btn-secondary">
                            Sfoglia File...
                            <input type="file" className="file-input" accept=".xlsx" onChange={(e) => handleFileUpload(e, 'warehouse')} />
                          </label>
                        </div>
                      </div>
                      {status?.active_warehouse_batch && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '0' }}>
                          Batch attivo: <strong>{status.active_warehouse_batch.filename}</strong> (Foglio: {status.active_warehouse_batch.sheet_name}) con {status.active_warehouse_batch.record_count} SKU.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Associations Excel import */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Carica Associazioni (associazione.xlsx)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      Importa l'esplosione dei prodotti composti in SKU.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {status?.local_files?.associazione_exists ? (
                        <button className="btn btn-primary" onClick={() => handleLocalImport('associations')} disabled={loading}>
                          Importa Local
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File associazione.xlsx locale non trovato.</span>
                      )}
                      
                      <label className="btn btn-secondary">
                        Sfoglia File...
                        <input type="file" className="file-input" accept=".xlsx" onChange={(e) => handleFileUpload(e, 'associations')} />
                      </label>
                    </div>
                    {status?.active_associations_batch && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                        Batch attivo: <strong>{status.active_associations_batch.filename}</strong> con {status.active_associations_batch.record_count} associazioni.
                      </p>
                    )}
                  </div>

                  {/* PrestaShop sync */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Sincronizzazione Webservice PrestaShop</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      Sincronizza gli ordini attivi degli stati selezionati.
                    </p>
                    <button className="btn btn-primary" onClick={handleSyncOrders} disabled={loading}>
                      Sincronizza Ordini da Webservice
                    </button>
                  </div>
                </div>
              </div>

              {/* Status and Summary Information widget */}
              <div className="glass-panel widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="widget-title">Stato Elaborazione</span>
                
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Ultimo Ricalcolo Completo:</h4>
                  <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>
                    {dashboardData.latest_calculation_run ? formatDate(dashboardData.latest_calculation_run) : "Mai eseguito"}
                  </p>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Configurazione Cartella di Lavoro:</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>giacenza.xlsx locale:</span>
                      <strong style={{ color: status?.local_files?.giacenza_exists ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {status?.local_files?.giacenza_exists ? 'PRESENTE' : 'MANCANTE'}
                      </strong>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>associazione.xlsx locale:</span>
                      <strong style={{ color: status?.local_files?.associazione_exists ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {status?.local_files?.associazione_exists ? 'PRESENTE' : 'MANCANTE'}
                      </strong>
                    </li>
                  </ul>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', wordBreak: 'break-all' }}>
                    Path: {status?.local_files?.workspace_path}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('settings')}>
                    Gestisci Stati Sincronizzazione
                  </button>
                  {dashboardData.anomalies_count > 0 && (
                    <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('anomalies')}>
                      Visualizza {dashboardData.anomalies_count} Anomalie
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- STOCK TAB --- */}
        {activeTab === 'stock' && (
          <>
            <div className="sync-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className={`glass-panel ${syncingStock ? 'card-loading-pulse-green' : ''}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', transition: 'all 0.3s ease' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Stock style={{ width: '24px', height: '24px', animation: syncingStock ? 'spin 1s infinite linear' : 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Sincronizzazione Giacenze</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
                    Sorgente: <span style={{ color: 'var(--color-primary)' }}>{status?.active_warehouse_batch?.sheet_name || status?.active_warehouse_batch?.filename || 'File locale'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Ultimo sync: <strong style={{ color: 'var(--text-primary)' }}>{status?.active_warehouse_batch?.imported_at ? new Date(status.active_warehouse_batch.imported_at).toLocaleString('it-IT') : 'Mai'}</strong>
                    {status?.active_warehouse_batch?.imported_at && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        | {getRelativeTimeString(status.active_warehouse_batch.imported_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`glass-panel ${syncingOrders ? 'card-loading-pulse' : ''}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', transition: 'all 0.3s ease' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Orders style={{ width: '24px', height: '24px', animation: syncingOrders ? 'spin 1s infinite linear' : 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Sincronizzazione PrestaShop</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
                    Stato: <span className={`badge ${status?.mock_mode ? 'badge-warning' : 'badge-success'}`} style={{ padding: '2px 8px', fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '4px' }}>{status?.mock_mode ? 'Simulazione' : 'Connesso'}</span>
                  </div>
                  {syncingOrders && syncProgressText ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '2px', fontWeight: '600' }}>
                      {syncProgressText}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Ultimo sync: <strong style={{ color: 'var(--text-primary)' }}>{status?.last_orders_sync ? new Date(status.last_orders_sync).toLocaleString('it-IT') : 'Mai'}</strong>
                      {status?.last_orders_sync && (
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                          | {getRelativeTimeString(status.last_orders_sync)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel widget-card">
            <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="search-wrapper">
                  <input type="text" className="search-input" placeholder="Cerca per SKU o descrizione..." value={searchStock} onChange={(e) => setSearchStock(e.target.value)} />
                  <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
                </div>
                {stockSource === 'google_sheets' && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(99,102,241,0.3)', height: '32px' }}
                    disabled={syncingGoogleSheets}
                    onClick={handleSyncGoogleSheetsNow}
                  >
                    <svg className="w-4 h-4" style={{ animation: syncingGoogleSheets ? 'spin 1s infinite linear' : 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"></path>
                    </svg>
                    {syncingGoogleSheets ? "Sincronizzazione..." : "Sincronizza Google Sheets"}
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visualizzate: {sortedStock.length} di {stockData.length} SKU
              </span>
            </div>

            <div className="table-container">
              {tabLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                  <div className="spinner"></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento dati in corso...</p>
                </div>
              ) : sortedStock.length > 0 ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSortStock('index')}>
                        # {stockSort.field === 'index' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="sortable" onClick={() => handleSortStock('sku')}>
                        SKU {stockSort.field === 'sku' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="sortable" onClick={() => handleSortStock('description')}>
                        Descrizione Sku {stockSort.field === 'description' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="sortable" onClick={() => handleSortStock('lotto')}>
                        Lotto {stockSort.field === 'lotto' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="sortable" style={{ textAlign: 'right' }} onClick={() => handleSortStock('qty_total')}>
                        Qta Totale {stockSort.field === 'qty_total' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="sortable" style={{ textAlign: 'right' }} onClick={() => handleSortStock('qty_committed')}>
                        Qta Impegnata {stockSort.field === 'qty_committed' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="sortable" style={{ textAlign: 'right' }} onClick={() => handleSortStock('qty_residual')}>
                        Qta Residua {stockSort.field === 'qty_residual' && (stockSort.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th style={{ textAlign: 'center' }}>Livello Stock</th>
                      <th style={{ textAlign: 'center' }}>Prodotti Ass.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStock.map(item => {
                      const isSpacer = item.is_spacer || (item.sku && item.sku.startsWith('__spacer_'));
                      const percent = !isSpacer && item.qty_total > 0 ? Math.min(100, Math.max(0, (item.qty_residual / item.qty_total) * 100)) : 0;
                      const barClass = percent <= 0 ? 'danger' : percent < 30 ? 'warning' : 'success';
                      
                      return (
                        <tr key={item.index} style={
                          isSpacer 
                            ? { height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.005)' } 
                            : item.qty_residual <= 0 
                              ? { backgroundColor: 'rgba(239, 68, 68, 0.03)' } 
                              : {}
                        }>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{item.index}</td>
                          <td style={{ fontWeight: '600' }}>{isSpacer ? "" : highlightText(item.sku, searchStock)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{isSpacer ? "" : highlightText(item.description || "-", searchStock)}</td>
                          <td>{isSpacer ? "" : (item.lotto ? <span className="badge badge-neutral">{item.lotto}</span> : "-")}</td>
                          <td style={{ textAlign: 'right', fontWeight: '500' }}>{isSpacer ? "" : item.qty_total}</td>
                          <td style={{ textAlign: 'right' }}>
                            {isSpacer ? "" : item.qty_committed > 0 ? (
                              <span 
                                className="clickable-qty-badge"
                                onClick={() => fetchSkuOrders(item.sku)}
                              >
                                <span>{item.qty_committed}</span>
                                <Icons.Eye />
                              </span>
                            ) : (
                              <span className="qty-committed-zero-badge">
                                <span>0</span>
                                <Icons.Eye style={{ visibility: 'hidden' }} />
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: item.qty_residual <= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                            {isSpacer ? "" : item.qty_residual}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {isSpacer ? "" : (
                              <div className="stock-bar-wrapper" style={{ justifyContent: 'center' }}>
                                <div className="stock-bar-container">
                                  <div className={`stock-bar-fill ${barClass}`} style={{ width: `${percent}%` }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '32px', textAlign: 'right' }}>
                                  {Math.round(percent)}%
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isSpacer ? "" : (
                              <span className="badge badge-neutral">{item.connected_products}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  Nessuna SKU trovata. Assicurati di aver caricato il file 'giacenza.xlsx' ed eseguito il calcolo.
                </p>
              )}
            </div>
          </div>
        </>
      )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="glass-panel widget-card">
            <div className="filter-bar">
              <div className="search-wrapper">
                <input type="text" className="search-input" placeholder="Cerca per Order ID, stato o Product ID..." value={searchOrder} onChange={(e) => setSearchOrder(e.target.value)} />
                <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visualizzati: {filteredOrders.length} di {totalOrders} Ordini Totali
              </span>
            </div>

            <div className="table-container">
              {tabLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                  <div className="spinner"></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento dati in corso...</p>
                </div>
              ) : filteredOrders.length > 0 ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Stato Ordine</th>
                      <th>Data Creazione</th>
                      <th>Linee Prodotto</th>
                      <th>SKU generate dal bundle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <React.Fragment key={order.order_id}>
                        {order.lines.map((line, idx) => (
                          <tr key={`${order.order_id}-${idx}`} style={{ borderBottom: idx === order.lines.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            {idx === 0 ? (
                              <td 
                                rowSpan={order.lines.length} 
                                style={{ position: 'relative', fontWeight: '700', verticalAlign: 'top', paddingTop: '14px', cursor: 'pointer', color: 'var(--color-primary)' }}
                                onClick={() => handleCopyOrderId(order.order_id)}
                                title="Clicca per copiare l'ID ordine"
                              >
                                {highlightText(order.order_id, searchOrder)}
                                {copiedOrderId === order.order_id && (
                                  <span style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%) translateY(-4px)',
                                    background: 'rgba(16, 185, 129, 0.95)',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    pointerEvents: 'none',
                                    zIndex: 9999,
                                    fontWeight: '600'
                                  }}>
                                    Copiato!
                                  </span>
                                )}
                              </td>
                            ) : null}
                            {idx === 0 ? (
                              <td rowSpan={order.lines.length} style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                                <span className="badge badge-warning">{highlightText(order.current_state_label, searchOrder)}</span>
                              </td>
                            ) : null}
                            {idx === 0 ? (
                              <td rowSpan={order.lines.length} style={{ color: 'var(--text-secondary)', verticalAlign: 'top', paddingTop: '14px' }}>
                                {formatDate(order.date_add)}
                              </td>
                            ) : null}
                            <td>
                              Prod ID: <strong>{highlightText(line.product_id, searchOrder)}</strong> (Qta: {line.product_quantity})
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {line.skus_generated}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  Nessun ordine sincronizzato. Seleziona gli stati nelle impostazioni e premi "Sincronizza Ordini da Webservice" in Dashboard.
                </p>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalOrdersPages > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ height: '36px', padding: '0 16px' }}
                  disabled={ordersPage === 1 || loading}
                  onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                >
                  Precedente
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Pagina <strong>{ordersPage}</strong> di <strong>{totalOrdersPages}</strong>
                </span>
                <button 
                  className="btn btn-secondary" 
                  style={{ height: '36px', padding: '0 16px' }}
                  disabled={ordersPage === totalOrdersPages || loading}
                  onClick={() => setOrdersPage(prev => Math.min(totalOrdersPages, prev + 1))}
                >
                  Successiva
                </button>
                <select 
                  className="settings-input" 
                  style={{ width: '80px', height: '36px', padding: '0 8px', margin: 0 }}
                  value={ordersLimit} 
                  onChange={(e) => {
                    setOrdersLimit(parseInt(e.target.value));
                    setOrdersPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* --- ANOMALIES TAB --- */}
        {activeTab === 'anomalies' && (() => {
          const totalAnomaliesPages = Math.ceil(anomalyData.length / anomaliesLimit) || 1;
          const paginatedAnomalies = anomalyData.slice(
            (anomaliesPage - 1) * anomaliesLimit,
            anomaliesPage * anomaliesLimit
          );
          return (
            <div className="glass-panel widget-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Anomalie totali nel registro: {anomalyData.length}
                </span>
                {anomalyData.length > 0 && (
                  <button className="btn btn-danger" onClick={handleClearAnomalies}>
                    Pulisci Registro
                  </button>
                )}
              </div>

              <div className="table-container">
                {tabLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento dati in corso...</p>
                  </div>
                ) : anomalyData.length > 0 ? (
                  <>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Sorgente</th>
                          <th>Codice/Chiave</th>
                          <th>Tipo Anomalia</th>
                          <th>Descrizione Errore</th>
                          <th>Data Rilevazione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAnomalies.map(an => (
                          <tr key={an.id} style={{ backgroundColor: an.anomaly_type.includes('missing') || an.anomaly_type.includes('error') ? 'rgba(239, 68, 68, 0.02)' : '' }}>
                            <td>
                              <span className={`badge ${an.source === 'stock_import' ? 'badge-neutral' : an.source === 'orders_sync' ? 'badge-warning' : 'badge-danger'}`}>
                                {an.source}
                              </span>
                            </td>
                            <td style={{ fontWeight: '600' }}>{an.record_key || "-"}</td>
                            <td>
                              <span className="badge badge-danger" style={{ backgroundColor: 'transparent', border: '1px solid var(--color-danger)', color: '#fca5a5' }}>
                                {an.anomaly_type}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-primary)', maxWidth: '400px' }}>{an.message}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(an.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {totalAnomaliesPages > 1 && (
                      <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                        <button 
                          className="btn btn-neutral btn-sm" 
                          disabled={anomaliesPage === 1 || tabLoading}
                          onClick={() => setAnomaliesPage(prev => Math.max(1, prev - 1))}
                        >
                          Indietro
                        </button>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Pagina <strong>{anomaliesPage}</strong> di <strong>{totalAnomaliesPages}</strong>
                        </span>
                        <button 
                          className="btn btn-neutral btn-sm" 
                          disabled={anomaliesPage === totalAnomaliesPages || tabLoading}
                          onClick={() => setAnomaliesPage(prev => Math.min(totalAnomaliesPages, prev + 1))}
                        >
                          Avanti
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    <svg className="w-12 h-12 mx-auto mb-4 text-emerald-500" style={{ color: 'var(--color-success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p style={{ fontSize: '1.05rem', fontWeight: '500', color: 'var(--text-primary)' }}>Nessuna anomalia riscontrata</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>I dati importati e gli ordini sincronizzati sono perfettamente coerenti.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* --- ASSOCIATIONS EDITOR TAB --- */}
        {activeTab === 'associations' && (() => {
          return (
            <div className="glass-panel widget-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                <div className="search-wrapper" style={{ flexGrow: 1, maxWidth: '400px' }}>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Cerca Product ID, SKU o SKU limitante..." 
                    value={searchProduct} 
                    onChange={(e) => setSearchProduct(e.target.value)} 
                  />
                  <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
                </div>
                
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Visualizzate: {sortedProducts.length} di {productData.length} Associazioni
                </span>

                <button 
                  className="btn btn-primary" 
                  onClick={() => handleOpenEditAssociation(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Icons.Plus /> Nuova Associazione
                </button>
              </div>

              <div className="table-container">
                {tabLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento dati in corso...</p>
                  </div>
                ) : sortedProducts.length > 0 ? (
                  <>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th className="sortable" onClick={() => handleSortProduct('product_id')}>
                            Product ID {productSort.field === 'product_id' && (productSort.direction === 'asc' ? '▲' : '▼')}
                          </th>
                          <th>Componenti SKU (Quantità)</th>
                          <th className="sortable" style={{ textAlign: 'right' }} onClick={() => handleSortProduct('qty_available')}>
                            Disponibilità Finale {productSort.field === 'qty_available' && (productSort.direction === 'asc' ? '▲' : '▼')}
                          </th>
                          <th className="sortable" onClick={() => handleSortProduct('limiting_sku')}>
                            SKU Limitante (Bloccante) {productSort.field === 'limiting_sku' && (productSort.direction === 'asc' ? '▲' : '▼')}
                          </th>
                          <th>Associazione Grezza</th>
                          <th style={{ textAlign: 'center', width: '100px' }}>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map(assoc => (
                          <tr key={assoc.product_id} style={assoc.qty_available === 0 ? { backgroundColor: 'rgba(239, 68, 68, 0.02)' } : {}}>
                            <td style={{ fontWeight: '700' }}>{highlightText(assoc.product_id, searchProduct)}</td>
                            <td style={{ color: 'var(--text-secondary)', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {highlightText(assoc.components_str, searchProduct)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.05rem', color: assoc.qty_available === 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                              {assoc.qty_available}
                            </td>
                            <td>
                              {assoc.limiting_sku ? (
                                <span className={`badge ${assoc.qty_available === 0 ? 'badge-danger' : 'badge-warning'}`}>
                                  {highlightText(assoc.limiting_sku, searchProduct)}
                                </span>
                              ) : (
                                <span className="badge badge-neutral">-</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {highlightText(assoc.raw_association, searchProduct)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button 
                                  className="btn btn-neutral btn-sm" 
                                  onClick={() => handleOpenEditAssociation(assoc.product_id)}
                                  title="Modifica associazione"
                                  style={{ padding: '6px' }}
                                  type="button"
                                >
                                  <Icons.Edit />
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  onClick={() => handleDeleteAssociation(assoc.product_id)}
                                  title="Elimina associazione"
                                  style={{ padding: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}
                                  type="button"
                                >
                                  <Icons.Delete />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {totalProductsPages > 1 && (
                      <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                        <button 
                          className="btn btn-neutral btn-sm" 
                          disabled={productsPage === 1 || tabLoading}
                          onClick={() => setProductsPage(prev => Math.max(1, prev - 1))}
                          type="button"
                        >
                          Indietro
                        </button>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Pagina <strong>{productsPage}</strong> di <strong>{totalProductsPages}</strong>
                        </span>
                        <button 
                          className="btn btn-neutral btn-sm" 
                          disabled={productsPage === totalProductsPages || tabLoading}
                          onClick={() => setProductsPage(prev => Math.min(totalProductsPages, prev + 1))}
                          type="button"
                        >
                          Avanti
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nessuna associazione trovata. Clicca su "+ Nuova Associazione" per inserirne una.
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* --- PICKING LIST TAB --- */}
        {activeTab === 'picking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel widget-card">
              <span className="widget-title">Pianificazione Prelievo da Elenco Grezzo</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>
                Incolla qui qualsiasi testo o elenco di ordini (es. esportazioni di testo, email, log di logistica). 
                Il sistema estrarrà automaticamente i numeri corrispondenti agli ID ordine, recupererà gli articoli/componenti 
                e confronterà il fabbisogno con la giacenza effettiva a magazzino.
              </p>
              
              <form onSubmit={handleCalculatePicking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <textarea
                    className="settings-input"
                    style={{ width: '100%', minHeight: '140px', fontFamily: 'monospace', fontSize: '0.9rem', padding: '12px', resize: 'vertical' }}
                    placeholder={`Esempio di testo incollato:
206542 > Meesseman 
206794 > Wallbruch 
208927 > BV FRE 
209465 > Herting`}
                    value={rawPickingText}
                    onChange={(e) => setRawPickingText(e.target.value)}
                  />
                </div>
                
                {pickingError && (
                  <div className="anomaly-bar danger-theme" style={{ display: 'flex', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', backgroundColor: 'rgba(220, 38, 38, 0.05)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                    {pickingError}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={pickingLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {pickingLoading ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>
                        Elaborazione in corso...
                      </>
                    ) : (
                      <>
                        Calcola Fabbisogno
                      </>
                    )}
                  </button>
                  
                  {pickingResults && (
                    <button 
                      type="button" 
                      className="btn btn-neutral" 
                      onClick={() => {
                        setRawPickingText('');
                        setPickingResults(null);
                        setPickingError(null);
                      }}
                    >
                      Nuovo Calcolo
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Results sections */}
            {pickingResults && (
              <div className="glass-panel widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <span className="widget-title" style={{ margin: 0 }}>Analisi del Fabbisogno di Prelievo</span>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleCopyPickingList}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 16px', fontSize: '0.85rem' }}
                  >
                    Copia Lista Prelievo (Testo)
                  </button>
                </div>

                {/* Orders match summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Ordini Trovati nel Database</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '4px', color: 'var(--color-success)' }}>
                      {pickingResults.orders_found.length} ordini
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                      {pickingResults.orders_found.length > 0 ? pickingResults.orders_found.join(', ') : 'Nessuno'}
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: pickingResults.orders_missing.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(71, 85, 105, 0.03)', border: pickingResults.orders_missing.length > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Ordini Non Trovati</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '4px', color: pickingResults.orders_missing.length > 0 ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                      {pickingResults.orders_missing.length} ordini
                    </div>
                    {pickingResults.orders_missing.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '4px', wordBreak: 'break-all' }}>
                        {pickingResults.orders_missing.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* SKU Requirements Table */}
                <div className="table-container">
                  {pickingResults.sku_requirements.length > 0 ? (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>SKU Componente</th>
                          <th>Descrizione Magazzino</th>
                          <th style={{ textAlign: 'right', width: '120px' }}>Quantità Richiesta</th>
                          <th style={{ textAlign: 'right', width: '120px' }}>Disponibile Magazzino</th>
                          <th style={{ textAlign: 'center', width: '140px' }}>Stato Prelievo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickingResults.sku_requirements.map(req => {
                          const diff = req.qty_stock - req.qty_required;
                          const hasEnough = diff >= 0;
                          
                          return (
                            <tr key={req.sku}>
                              <td style={{ fontWeight: '700' }}>{req.sku}</td>
                              <td style={{ color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.description}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '600' }}>{req.qty_required}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{req.qty_stock}</td>
                              <td style={{ textAlign: 'center' }}>
                                {hasEnough ? (
                                  <span className="badge badge-success" style={{ display: 'inline-block', width: '90%' }}>
                                    Disponibile (+{diff})
                                  </span>
                                ) : (
                                  <span className="badge badge-danger" style={{ display: 'inline-block', width: '90%' }}>
                                    Mancano {Math.abs(diff)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      Nessun articolo o SKU richiesto per gli ordini trovati.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Card 1: Configurazione Connessione PrestaShop */}
            <div className="glass-panel widget-card">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Configurazione Connessione PrestaShop</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Imposta l'indirizzo web dell'API del tuo PrestaShop e la chiave Webservice generata dal pannello di amministrazione.
              </p>
              
              {settingsError && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {settingsError}
                </div>
              )}
              
              <form onSubmit={handleSaveConnectionSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    URL API PrestaShop
                  </label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    placeholder="Esempio: https://mio-sito.it/api/" 
                    value={prestashopUrl} 
                    onChange={(e) => setPrestashopUrl(e.target.value)}
                    disabled={prestashopMockMode}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                    Deve terminare con <code>/api/</code>. Ad esempio: <code>https://www.tuonegozio.it/api/</code>
                  </small>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Chiave API Webservice
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showApiKey ? "text" : "password"} 
                      className="settings-input" 
                      placeholder="Inserisci la chiave API del webservice" 
                      value={prestashopApiKey} 
                      onChange={(e) => setPrestashopApiKey(e.target.value)}
                      disabled={prestashopMockMode}
                      style={{ paddingRight: '70px' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      disabled={prestashopMockMode}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      {showApiKey ? "NASCONDI" : "MOSTRA"}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      className="checkbox-control" 
                      checked={prestashopMockMode} 
                      onChange={(e) => setPrestashopMockMode(e.target.checked)} 
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>Abilita Modalità Simulazione (Mock Mode)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Se attiva, l'applicazione utilizzerà dati di test simulati senza connettersi al server reale di PrestaShop.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Intervallo Sincronizzazione Ordini (minuti)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    className="settings-input" 
                    placeholder="Esempio: 10" 
                    value={prestashopSyncInterval} 
                    onChange={(e) => setPrestashopSyncInterval(parseInt(e.target.value) || 10)}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                    Frequenza con cui il backend interroga periodicamente PrestaShop per scaricare nuovi ordini in background.
                  </small>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                    {savingSettings ? "Connessione in corso..." : "Salva Configurazione Connessione"}
                  </button>
                </div>
              </form>
            </div>

            {/* Card 1b: Sincronizzazione Manuale Ordini PrestaShop */}
            <div className="glass-panel widget-card">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Sincronizzazione Ordini PrestaShop</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Avvia una sincronizzazione manuale degli ordini dal Webservice PrestaShop. Gli ordini negli stati selezionati verranno scaricati e salvati nel database locale.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSyncOrders}
                  disabled={syncingOrders || loading}
                >
                  {syncingOrders ? (
                    <>
                      <Icons.Sync style={{ animation: 'spin 1.5s infinite linear', marginRight: '8px' }} />
                      {syncProgressText || 'Sincronizzazione in corso...'}
                    </>
                  ) : (
                    'Sincronizza Ordini Ora'
                  )}
                </button>

                {status?.last_orders_sync && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Ultima sincronizzazione:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {new Date(status.last_orders_sync).toLocaleString('it-IT')}
                    </strong>
                    {' '}— {getRelativeTimeString(status.last_orders_sync)}
                  </span>
                )}
              </div>

              {status?.prestashop_orders_count !== undefined && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                  Ordini in cache: <strong style={{ color: 'var(--color-primary)' }}>{status.prestashop_orders_count}</strong>
                </p>
              )}
            </div>

            {/* Card 2: Sorgente Giacenze (SKU) e Sincronizzazione */}
            <div className="glass-panel widget-card">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Sorgente Giacenze (SKU) e Sincronizzazione</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Scegli se caricare le giacenze fisiche manualmente tramite file Excel o attivare la sincronizzazione automatica da un foglio Google Sheets.
              </p>
              
              <form onSubmit={handleSaveGoogleSheetsSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Sorgente Giacenze
                  </label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                    <label className="checkbox-label" style={{ flex: 1, padding: '10px 14px', border: stockSource === 'local_upload' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="stockSource" 
                        value="local_upload" 
                        checked={stockSource === 'local_upload'} 
                        onChange={() => setStockSource('local_upload')}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Caricamento Manuale Excel</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Carica il file giacenza.xlsx dal computer.</div>
                      </div>
                    </label>
                    <label className="checkbox-label" style={{ flex: 1, padding: '10px 14px', border: stockSource === 'google_sheets' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="stockSource" 
                        value="google_sheets" 
                        checked={stockSource === 'google_sheets'} 
                        onChange={() => setStockSource('google_sheets')}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sincronizzazione Google Sheets</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Download e ricalcolo in background.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {stockSource === 'google_sheets' && (
                  <>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        URL Google Sheet
                      </label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        placeholder="https://docs.google.com/spreadsheets/d/..." 
                        value={googleSheetUrl} 
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        required
                      />
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                        Assicurati che il foglio sia condiviso con "Chiunque abbia il link può visualizzare".
                      </small>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Nome Foglio (Tab)
                        </label>
                        <input 
                          type="text" 
                          className="settings-input" 
                          placeholder="ROSATE" 
                          value={googleSheetName} 
                          onChange={(e) => setGoogleSheetName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Intervallo Verifica (Minuti)
                        </label>
                        <input 
                          type="number" 
                          className="settings-input" 
                          min="1" 
                          value={googleSheetSyncInterval} 
                          onChange={(e) => setGoogleSheetSyncInterval(parseInt(e.target.value) || 10)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '4px', padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Ultima Sincronizzazione:</span>
                        <span style={{ fontWeight: '600' }}>
                          {googleSheetLastSync ? new Date(googleSheetLastSync).toLocaleString('it-IT') : 'Mai sincronizzato'}
                        </span>
                      </div>
                      {googleSheetLastError && (
                        <div style={{ color: '#fca5a5', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                          <strong>Ultimo Errore:</strong> {googleSheetLastError}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Mappatura Colonne Excel / Google Sheets</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Nome Colonna SKU
                      </label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        placeholder="Es: Sku" 
                        value={mappingSku} 
                        onChange={(e) => setMappingSku(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Nome Colonna Quantità
                      </label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        placeholder="Es: Qta Tot." 
                        value={mappingQty} 
                        onChange={(e) => setMappingQty(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Colonna Descrizione (Opzionale)
                      </label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        placeholder="Es: Descrizione Sku" 
                        value={mappingDesc} 
                        onChange={(e) => setMappingDesc(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Colonna Lotto (Opzionale)
                      </label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        placeholder="Es: Lotto" 
                        value={mappingLotto} 
                        onChange={(e) => setMappingLotto(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                    Salva Impostazioni Giacenze
                  </button>
                  
                  {stockSource === 'google_sheets' && (
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }}
                      disabled={syncingGoogleSheets}
                      onClick={handleSyncGoogleSheetsNow}
                    >
                      {syncingGoogleSheets ? "Sincronizzazione..." : "Sincronizza Ora"}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Card 3: Stati Ordini da Includere nell'Impegnato */}
            <div className="glass-panel widget-card">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Stati Ordini da Includere nell'Impegnato</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Gli ordini che si trovano in uno degli stati selezionati di seguito verranno estratti dal Webservice PrestaShop. 
                Le SKU dei relativi prodotti venduti verranno aggregate e sottratte come "impegnate" dalla giacenza fisica totale.
              </p>
              
              {orderStates.length > 0 ? (
                <div className="settings-grid">
                  <div className="checkbox-list">
                    {orderStates.map(state => (
                      <label key={state.id} className="checkbox-label">
                        <input type="checkbox" className="checkbox-control" checked={selectedStates.includes(state.id)} onChange={() => handleToggleState(state.id)} />
                        <div>
                          <div style={{ fontWeight: '500' }}>{state.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID Stato: {state.id}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>
                      Nota: Di default, lo stato <strong>magazzino rosate</strong> (solitamente ID 12) è quello utilizzato per l'impegnato. Le modifiche qui impostate si applicano istantaneamente ai ricalcoli.
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Caricamento degli stati ordine da PrestaShop...</p>
              )}
            </div>

            {/* Card 4: Backup & Ripristino Database */}
            <div className="glass-panel widget-card">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Backup & Ripristino Database</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
                Salva una copia completa dell'intero database locale (ordini, giacenze, associazioni, impostazioni) oppure ripristina un backup precedente.
                Il ripristino sovrascrive tutti i dati correnti e riavvia automaticamente il server.
              </p>

              {/* Restore countdown overlay */}
              {restoreCountdown !== null && (
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(99,102,241,0.07)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                    {restoreCountdown}
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    Database ripristinato con successo!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Il server si sta riavviando… la pagina si aggiornerà automaticamente tra {restoreCountdown} secondi.
                  </div>
                  <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Download Backup */}
                <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <svg width="22" height="22" fill="none" stroke="var(--color-success)" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Scarica Backup</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                    Scarica una copia del database SQLite (<code>.db</code>). Contiene tutti i tuoi dati, pronto per il ripristino.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={handleDownloadBackup}
                    disabled={backupLoading || restoreLoading}
                  >
                    {backupLoading ? (
                      <>
                        <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(16,185,129,0.3)', borderTopColor: 'var(--color-success)' }}></div>
                        Preparazione...
                      </>
                    ) : (
                      'Scarica Backup (.db)'
                    )}
                  </button>
                </div>

                {/* Restore Database */}
                <div style={{ padding: '20px', borderRadius: '10px', border: restoreLoading ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)', backgroundColor: restoreLoading ? 'rgba(239,68,68,0.03)' : 'rgba(239, 68, 68, 0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <svg width="22" height="22" fill="none" stroke="var(--color-danger)" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Ripristina Database</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                    Carica un file <code>.db</code> precedentemente scaricato. <strong style={{ color: 'var(--color-danger)' }}>Sovrascrive tutti i dati correnti.</strong>
                    Prima del ripristino viene salvata una copia di emergenza automatica.
                  </p>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      backgroundColor: restoreLoading ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.08)',
                      color: 'var(--color-danger)',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: restoreLoading || backupLoading ? 'not-allowed' : 'pointer',
                      opacity: restoreLoading || backupLoading ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {restoreLoading ? (
                      <>
                        <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: 'var(--color-danger)' }}></div>
                        {restoreCountdown !== null ? `Riavvio in ${restoreCountdown}s...` : 'Ripristino in corso...'}
                      </>
                    ) : (
                      'Scegli file .db e Ripristina'
                    )}
                    <input
                      type="file"
                      accept=".db"
                      style={{ display: 'none' }}
                      onChange={handleRestoreDatabase}
                      disabled={restoreLoading || backupLoading}
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Right-side Drawer for SKU Committed Orders Detail */}
      {selectedSkuForOrders && (() => {
        // Aggregate stats for header chips
        const totalOrders = skuOrdersData.length;
        const totalCommitted = skuOrdersData.reduce((sum, o) => sum + (o.contribution || 0), 0);
        const totalValue = skuOrdersData.reduce((sum, o) => sum + (o.total_paid || 0), 0);

        return (
          <>
            {/* Dim overlay — click to close */}
            <div className="order-drawer-overlay" onClick={() => setSelectedSkuForOrders(null)} />

            {/* Drawer panel */}
            <div className="order-drawer">

              {/* Header */}
              <div className="order-drawer-header">
                <div className="order-drawer-title-row">
                  <h3>
                    Ordini impegnati — SKU:{' '}
                    <span style={{ color: 'var(--color-primary)' }}>{selectedSkuForOrders}</span>
                  </h3>
                  <button className="order-drawer-close" onClick={() => setSelectedSkuForOrders(null)}>
                    &times;
                  </button>
                </div>

                {/* Stat chips */}
                {!loadingSkuOrders && skuOrdersData.length > 0 && (
                  <div className="order-drawer-stats">
                    <div className="drawer-stat-chip">
                      <span className="stat-value">{totalOrders}</span>
                      <span className="stat-label">Ordini</span>
                    </div>
                    <div className="drawer-stat-chip">
                      <span className="stat-value">{totalCommitted}</span>
                      <span className="stat-label">SKU Impegnate</span>
                    </div>
                    {totalValue > 0 && (
                      <div className="drawer-stat-chip">
                        <span className="stat-value">€ {totalValue.toFixed(2)}</span>
                        <span className="stat-label">Valore Stimato</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="order-drawer-body">
                {loadingSkuOrders ? (
                  <div className="spinner-container" style={{ paddingTop: '60px' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Caricamento ordini in corso...</p>
                  </div>
                ) : skuOrdersData.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ordine</th>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Stato</th>
                        <th>Prodotto</th>
                        <th style={{ textAlign: 'right' }}>Qta</th>
                        <th style={{ textAlign: 'right' }}>×SKU</th>
                        <th style={{ textAlign: 'right' }}>Impegnato</th>
                        <th style={{ textAlign: 'right' }}>Valore</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skuOrdersData.map((order, i) => (
                        <tr key={`${order.order_id}-${order.product_id}-${i}`}>
                          {/* ID */}
                          <td 
                            style={{ position: 'relative', fontWeight: '700', color: 'var(--color-primary)', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onClick={() => handleCopyOrderId(order.order_id)}
                            title="Clicca per copiare l'ID ordine"
                          >
                            {order.order_id}
                            {copiedOrderId === order.order_id && (
                              <span style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%) translateY(-4px)',
                                background: 'rgba(16, 185, 129, 0.95)',
                                color: '#fff',
                                fontSize: '0.7rem',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                                zIndex: 9999,
                                fontWeight: '600'
                              }}>
                                Copiato!
                              </span>
                            )}
                          </td>
                          {/* Data */}
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {order.date_add
                              ? new Date(order.date_add).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </td>
                          {/* Cliente */}
                          <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
                            {order.customer_name || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>N/D</span>}
                          </td>
                          {/* Stato */}
                          <td>
                            <span className={getStateBadgeClass(order.current_state_label)}>
                              {order.current_state_label || 'Incluso'}
                            </span>
                          </td>
                          {/* Prodotto */}
                          <td>
                            <span style={{ fontWeight: '500' }}>{order.product_reference}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginLeft: '4px' }}>
                              (SKU: {selectedSkuForOrders})
                            </span>
                          </td>
                          {/* Qta Ordinata */}
                          <td style={{ textAlign: 'right', fontWeight: '500' }}>{order.product_quantity}</td>
                          {/* Consumo SKU */}
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>×{order.qty_required}</td>
                          {/* Impegnato Tot. */}
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-primary)' }}>
                            {order.contribution}
                          </td>
                          {/* Valore */}
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {order.total_paid != null ? `€ ${Number(order.total_paid).toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals row */}
                    <tfoot>
                      <tr className="table-total-row">
                        <td colSpan={5} style={{ fontWeight: '700' }}>Totali</td>
                        <td style={{ textAlign: 'right' }}>
                          {skuOrdersData.reduce((s, o) => s + (o.product_quantity || 0), 0)}
                        </td>
                        <td></td>
                        <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                          {totalCommitted}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {totalValue > 0 ? `€ ${totalValue.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3 }}>📦</div>
                    <p style={{ margin: 0 }}>Nessun ordine attivo trovato per questa SKU.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="order-drawer-footer">
                <button className="btn btn-primary" onClick={() => setSelectedSkuForOrders(null)}>
                  Chiudi
                </button>
              </div>

            </div>
          </>
        );
      })()}

      {/* Association Editor Modal */}
      {isAssociationModalOpen && (() => {
        // Unique warehouse SKUs list for autocomplete suggestions
        const uniqueWarehouseSkus = Array.from(new Set(stockData.map(item => item.sku))).filter(Boolean).sort();
        
        const handleAddGuidedRow = () => {
          setGuidedComponents(prev => [...prev, { sku: '', qty_required: 1 }]);
        };

        const handleRemoveGuidedRow = (idx) => {
          setGuidedComponents(prev => {
            const next = prev.filter((_, i) => i !== idx);
            return next.length > 0 ? next : [{ sku: '', qty_required: 1 }];
          });
        };

        const handleUpdateGuidedRow = (idx, field, value) => {
          setGuidedComponents(prev => prev.map((c, i) => {
            if (i === idx) {
              return { ...c, [field]: value };
            }
            return c;
          }));
        };

        const handleSelectAutocomplete = (idx, sku) => {
          handleUpdateGuidedRow(idx, 'sku', sku);
          setActiveAutocompleteIndex(null);
        };

        // Switch modes and sync content
        const handleSwitchMode = (newMode) => {
          if (newMode === associationModalMode) return;
          
          if (newMode === 'raw') {
            // Guided -> Raw
            const rawText = guidedComponents
              .filter(c => c.sku.trim())
              .map(c => Array(c.qty_required).fill(c.sku.trim()).join(','))
              .filter(Boolean)
              .join(',');
            setRawAssociationText(rawText);
          } else {
            // Raw -> Guided
            const skus = rawAssociationText.split(',').map(s => s.trim()).filter(Boolean);
            const counts = {};
            for (const s of skus) {
              counts[s] = (counts[s] || 0) + 1;
            }
            const comps = Object.entries(counts).map(([sku, qty]) => ({ sku, qty_required: qty }));
            setGuidedComponents(comps.length > 0 ? comps : [{ sku: '', qty_required: 1 }]);
          }
          setAssociationModalMode(newMode);
        };

        return (
          <>
            <div className="modal-overlay" onClick={() => setIsAssociationModalOpen(false)} />
            <div className="custom-modal association-editor-modal">
              <div className="modal-header">
                <h3>{isNewAssociation ? "Nuova Associazione" : `Modifica Associazione - Prodotto ${editingProductId}`}</h3>
                <button className="modal-close" onClick={() => setIsAssociationModalOpen(false)}>&times;</button>
              </div>
              
              <form onSubmit={handleSaveAssociation}>
                <div className="modal-body">
                  {/* Product ID Input (editable only if creating a new one) */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                      Product ID (ID Prodotto PrestaShop)
                    </label>
                    <input 
                      type="text" 
                      className="settings-input" 
                      placeholder="Esempio: 614988" 
                      value={editingProductId}
                      onChange={(e) => setEditingProductId(e.target.value)}
                      disabled={!isNewAssociation}
                      required
                    />
                  </div>

                  {/* Mode Selector tabs */}
                  <div className="modal-mode-selector">
                    <button 
                      type="button"
                      className={`mode-tab ${associationModalMode === 'guided' ? 'active' : ''}`}
                      onClick={() => handleSwitchMode('guided')}
                    >
                      Modalità Guidata (Interattiva)
                    </button>
                    <button 
                      type="button"
                      className={`mode-tab ${associationModalMode === 'raw' ? 'active' : ''}`}
                      onClick={() => handleSwitchMode('raw')}
                    >
                      Modalità Testo (Raw)
                    </button>
                  </div>

                  {associationModalMode === 'guided' ? (
                    /* GUIDED MODE LAYOUT */
                    <div className="guided-mode-container">
                      <div className="guided-headers">
                        <span style={{ flexGrow: 1, fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Componente SKU</span>
                        <span style={{ width: '80px', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Quantità</span>
                        <span style={{ width: '40px' }}></span>
                      </div>
                      
                      <div className="guided-rows-list">
                        {guidedComponents.map((comp, idx) => {
                          // Autocomplete filtering
                          const query = comp.sku || '';
                          const suggestions = query.length >= 1
                            ? uniqueWarehouseSkus.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
                            : [];

                          return (
                            <div key={idx} className="guided-row" style={{ position: 'relative' }}>
                              {/* SKU Input & Autocomplete */}
                              <div style={{ flexGrow: 1, position: 'relative' }}>
                                <input 
                                  type="text" 
                                  className="settings-input sku-input" 
                                  placeholder="Inserisci o cerca SKU..." 
                                  value={comp.sku}
                                  onChange={(e) => {
                                    handleUpdateGuidedRow(idx, 'sku', e.target.value);
                                    setActiveAutocompleteIndex(idx);
                                  }}
                                  onFocus={() => setActiveAutocompleteIndex(idx)}
                                  onBlur={() => {
                                    // Delay blur to allow clicks on autocomplete items
                                    setTimeout(() => {
                                      setActiveAutocompleteIndex(prev => prev === idx ? null : prev);
                                    }, 200);
                                  }}
                                  autoComplete="off"
                                />
                                {/* Suggestions dropdown */}
                                {activeAutocompleteIndex === idx && suggestions.length > 0 && (
                                  <ul className="autocomplete-dropdown">
                                    {suggestions.map((s, sIdx) => (
                                      <li 
                                        key={sIdx} 
                                        onClick={() => handleSelectAutocomplete(idx, s)}
                                      >
                                        {s}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* Quantity input */}
                              <input 
                                type="number" 
                                className="settings-input qty-input" 
                                style={{ width: '80px', textAlign: 'right' }} 
                                min="1"
                                value={comp.qty_required}
                                onChange={(e) => handleUpdateGuidedRow(idx, 'qty_required', parseInt(e.target.value) || 1)}
                              />

                              {/* Delete row */}
                              <button 
                                type="button" 
                                className="btn btn-neutral btn-sm"
                                style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                                onClick={() => handleRemoveGuidedRow(idx)}
                              >
                                &times;
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button 
                        type="button" 
                        className="btn btn-neutral btn-sm" 
                        style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={handleAddGuidedRow}
                      >
                        <Icons.Plus /> Aggiungi Componente
                      </button>
                    </div>
                  ) : (
                    /* RAW MODE LAYOUT */
                    <div className="raw-mode-container">
                      <label style={{ fontWeight: '500', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                        Inserisci le SKU separate da virgole (es. <code>SKU_A, SKU_B, SKU_A</code> per indicare 2x SKU_A e 1x SKU_B)
                      </label>
                      <textarea 
                        className="settings-input"
                        style={{ width: '100%', minHeight: '120px', fontFamily: 'monospace', fontSize: '0.9rem', padding: '12px', resize: 'vertical' }}
                        placeholder="SKU_1, SKU_2, SKU_2, SKU_3"
                        value={rawAssociationText}
                        onChange={(e) => setRawAssociationText(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn-neutral" onClick={() => setIsAssociationModalOpen(false)}>Annulla</button>
                  <button type="submit" className="btn btn-primary">Salva Associazione</button>
                </div>
              </form>
            </div>
          </>
        );
      })()}
    </div>
  );
}

export default App;
