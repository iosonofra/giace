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

const getRequirementMeta = (req = {}) => {
  const required = Number(req.qty_required || 0);
  const stock = Number(req.qty_stock || 0);
  const diff = stock - required;

  if (diff < 0) {
    return {
      rank: 0,
      tone: 'danger',
      label: `Mancano ${Math.abs(diff)}`,
      rowClass: 'picking-row-critical'
    };
  }

  if (required > 0 && diff === 0) {
    return {
      rank: 1,
      tone: 'warning',
      label: 'Stock a zero',
      rowClass: 'picking-row-warning'
    };
  }

  return {
    rank: 2,
    tone: 'success',
    label: `Disponibile (+${diff})`,
    rowClass: ''
  };
};

const getOrderPickingMeta = (ord = {}) => {
  const items = ord.items || [];
  const missingCount = items.filter(item => item.status === 'mancante').length;
  const partialCount = items.filter(item => item.status === 'parziale').length;

  if (missingCount > 0) {
    return {
      rank: 0,
      tone: 'danger',
      label: `${missingCount} mancanti`
    };
  }

  if (partialCount > 0) {
    return {
      rank: 1,
      tone: 'warning',
      label: `${partialCount} parziali`
    };
  }

  return {
    rank: 2,
    tone: 'success',
    label: 'Pronto'
  };
};

/** Reusable Confirmation Modal component to avoid code duplication */
const ConfirmModal = ({ isOpen, title, message, warningText, onCancel, onConfirm, confirmText, variant = 'danger' }) => {
  if (!isOpen) return null;
  
  // Choose icon based on variant
  const icon = variant === 'danger' ? (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <>
      <div className="modal-overlay" onClick={onCancel}></div>
      <div className="confirm-modal">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ 
            padding: '8px', 
            borderRadius: '50%', 
            background: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
            color: variant === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0 
          }}>
            {icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {message}
            </p>
          </div>
        </div>
        
        {warningText && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            background: variant === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)', 
            border: variant === 'danger' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)', 
            fontSize: '0.8rem', 
            color: variant === 'danger' ? '#fca5a5' : '#fde68a',
            lineHeight: '1.5'
          }}>
            {warningText}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button 
            type="button" 
            className="btn btn-neutral" 
            onClick={onCancel}
          >
            Annulla
          </button>
          <button 
            type="button" 
            className={`btn btn-${variant}`} 
            style={variant === 'danger' ? { backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' } : {}}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};

/** Reusable Pagination component to unify layout and controls across lists */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  limit, 
  onLimitChange, 
  limitOptions = [10, 25, 50, 100], 
  disabled = false 
}) => {
  if (totalPages <= 1 && !onLimitChange) return null;

  return (
    <div className="pagination-bar">
      <button 
        type="button" 
        className="btn btn-neutral btn-sm" 
        disabled={currentPage === 1 || disabled}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Indietro
      </button>
      
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Pagina <strong>{currentPage}</strong> di <strong>{totalPages || 1}</strong>
      </span>
      
      <button 
        type="button" 
        className="btn btn-neutral btn-sm" 
        disabled={currentPage === totalPages || totalPages === 0 || disabled}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Avanti
      </button>

      {onLimitChange && limit !== undefined && (
        <select 
          className="settings-input" 
          style={{ width: '90px', height: '30px', padding: '0 8px', margin: '0 0 0 8px', fontSize: '0.8rem' }}
          value={limit} 
          disabled={disabled}
          onChange={(e) => {
            onLimitChange(parseInt(e.target.value, 10));
            onPageChange(1);
          }}
        >
          {limitOptions.map(opt => (
            <option key={opt} value={opt}>{opt} / pag</option>
          ))}
        </select>
      )}
    </div>
  );
};

/** TableSkeleton component to render skeleton placeholder loaders for data tables */
const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="skeleton-container" style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Table header placeholder */}
        <div style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          {Array(cols).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="skeleton-pulse" 
              style={{ 
                height: '16px', 
                flex: 1, 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '4px' 
              }}
            />
          ))}
        </div>
        
        {/* Table rows placeholder */}
        {Array(rows).fill(0).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            style={{ 
              display: 'flex', 
              gap: '16px', 
              padding: '12px 0', 
              borderBottom: '1px solid var(--border-color)' 
            }}
          >
            {Array(cols).fill(0).map((_, colIndex) => {
              const width = `${Math.max(42, 92 - colIndex * 11 - (rowIndex % 3) * 6)}%`;
              return (
              <div 
                key={colIndex} 
                className="skeleton-pulse" 
                style={{ 
                  height: '14px', 
                  flex: 1, 
                  backgroundColor: 'rgba(255, 255, 255, 0.025)', 
                  borderRadius: '4px',
                  maxWidth: colIndex === cols - 1 ? '80px' : width
                }}
              />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
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
  const [savedSelectedStates, setSavedSelectedStates] = useState([]);
  const [settingsSection, setSettingsSection] = useState('connection');
  
  // PrestaShop connection settings
  const [prestashopUrl, setPrestashopUrl] = useState('');
  const [prestashopAdminUrl, setPrestashopAdminUrl] = useState('');
  const [prestashopApiKey, setPrestashopApiKey] = useState('');
  const [prestashopMockMode, setPrestashopMockMode] = useState(true);
  const [prestashopSyncInterval, setPrestashopSyncInterval] = useState(10);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingConnectionSettings, setSavingConnectionSettings] = useState(false);
  const [savingStockSettings, setSavingStockSettings] = useState(false);
  const [savingStateSettings, setSavingStateSettings] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [searchStateQuery, setSearchStateQuery] = useState('');
  const [showOnlySelectedStates, setShowOnlySelectedStates] = useState(false);
  const [showClearAnomaliesConfirm, setShowClearAnomaliesConfirm] = useState(false);
  const [associationToDelete, setAssociationToDelete] = useState(null);
  const [showDeleteAssociationConfirm, setShowDeleteAssociationConfirm] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [pickingCopyState, setPickingCopyState] = useState('idle');
  const pickingCopyTimeoutRef = useRef(null);

  // Pagination states for Orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(50);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalOrdersPages, setTotalOrdersPages] = useState(1);
  const [ordersAvailableStates, setOrdersAvailableStates] = useState([]);
  const [orderStateFilter, setOrderStateFilter] = useState('all');

  // Pagination states for Products (Kits)
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(50);

  // Pagination states for Anomalies
  const [anomaliesPage, setAnomaliesPage] = useState(1);
  const [anomaliesLimit, setAnomaliesLimit] = useState(50);
  const [anomalySearch, setAnomalySearch] = useState('');
  const [anomalySourceFilter, setAnomalySourceFilter] = useState('all');
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState('all');
  const [anomalyOrderStateFilter, setAnomalyOrderStateFilter] = useState('all');
  const [anomalyOnlyActionable, setAnomalyOnlyActionable] = useState(false);
  
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
  const [pickingInputMode, setPickingInputMode] = useState('text'); // 'text', 'file' or 'automatic'
  const [selectedPickingFiles, setSelectedPickingFiles] = useState([]);
  const [pickingFilesAnomalies, setPickingFilesAnomalies] = useState([]);
  const [pickingFilesSummary, setPickingFilesSummary] = useState([]);
  const [pickingViewMode, setPickingViewMode] = useState('aggregated'); // 'aggregated' or 'by_order'
  const [pickingRequirementFilter, setPickingRequirementFilter] = useState('all'); // 'missing', 'all' or 'available'
  const [pickingCountingMode, setPickingCountingMode] = useState(false);
  const [countedPickingSkus, setCountedPickingSkus] = useState(() => new Set());
  const [autoPickingLimit, setAutoPickingLimit] = useState(20);
  const [autoPickingStrict, setAutoPickingStrict] = useState(false);
  const [autoPickingStrategy, setAutoPickingStrategy] = useState('chronological');
  const [autoPickingMinResidual, setAutoPickingMinResidual] = useState(0);
  const [autoPickingResultView, setAutoPickingResultView] = useState('selected');
  const [autoPickingSkuFilter, setAutoPickingSkuFilter] = useState([]);
  const [autoPickingSkuQuery, setAutoPickingSkuQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [syncingSpecificOrders, setSyncingSpecificOrders] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
  const [stockViewMode, setStockViewMode] = useState('standard');
  const [missingStockData, setMissingStockData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [anomalyData, setAnomalyData] = useState([]);

  // States for committed orders popup
  const [selectedSkuForOrders, setSelectedSkuForOrders] = useState(null);
  const [skuOrdersData, setSkuOrdersData] = useState([]);
  const [loadingSkuOrders, setLoadingSkuOrders] = useState(false);
  const [skuOrdersSortDirection, setSkuOrdersSortDirection] = useState('asc');
  const [smartSkuCounterEnabled, setSmartSkuCounterEnabled] = useState(false);
  const [smartSkuCounterData, setSmartSkuCounterData] = useState(null);
  const [loadingSmartSkuCounter, setLoadingSmartSkuCounter] = useState(false);

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

  // Close mobile sidebar when activeTab changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTab]);

  // Lock page scroll while the right-side orders drawer is open.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (selectedSkuForOrders) {
      root.classList.add('drawer-open');
      body.classList.add('drawer-open');
    } else {
      root.classList.remove('drawer-open');
      body.classList.remove('drawer-open');
    }

    return () => {
      root.classList.remove('drawer-open');
      body.classList.remove('drawer-open');
    };
  }, [selectedSkuForOrders]);

  useEffect(() => {
    return () => {
      if (pickingCopyTimeoutRef.current) {
        window.clearTimeout(pickingCopyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCountedPickingSkus(new Set());
    setPickingCountingMode(false);
  }, [pickingResults]);

  // Keyboard shortcuts and global key listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape closes modals/drawers
      if (e.key === 'Escape') {
        setIsAssociationModalOpen(false);
        setSelectedSkuForOrders(null);
        setShowRestoreConfirm(false);
        setShowClearAnomaliesConfirm(false);
        setShowDeleteAssociationConfirm(false);
        setIsMobileSidebarOpen(false);
      }

      // Alt + Number switches tabs
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const tabMap = {
          '1': 'dashboard',
          '2': 'stock',
          '3': 'associations',
          '4': 'orders',
          '5': 'picking',
          '6': 'anomalies',
          '7': 'settings'
        };
        const targetTab = tabMap[e.key];
        if (targetTab) {
          setActiveTab(targetTab);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
  }, [anomalyData.length, anomalySearch, anomalySourceFilter, anomalyTypeFilter, anomalyOrderStateFilter, anomalyOnlyActionable]);

  // Fetch specific tab data
  useEffect(() => {
    setTabLoading(true);
    if (activeTab === 'stock') {
      Promise.all([
        fetch('/api/stock').then(r => r.json()),
        fetch('/api/stock/missing').then(r => r.json())
      ])
        .then(([stock, missing]) => {
          setStockData(stock || []);
          setMissingStockData(missing || []);
        })
        .catch(console.error)
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'associations') {
      fetch('/api/products')
        .then(r => r.json())
        .then(setProductData)
        .catch(console.error)
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'orders') {
      const stateQuery = orderStateFilter === 'all' ? '' : `&state_id=${encodeURIComponent(orderStateFilter)}`;
      fetch(`/api/orders?page=${ordersPage}&limit=${ordersLimit}${stateQuery}`)
        .then(r => r.json())
        .then(data => {
          setOrderData(data.orders || []);
          setTotalOrders(data.total || 0);
          setTotalOrdersPages(data.total_pages || 1);
          setOrdersAvailableStates(data.available_states || []);
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
        const includedStateIds = currentSettings.included_state_ids || [];
        setSelectedStates(includedStateIds);
        setSavedSelectedStates(includedStateIds);
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
  }, [activeTab, ordersPage, ordersLimit, orderStateFilter, status?.latest_calculation?.id, status?.active_warehouse_batch?.id, status?.active_associations_batch?.id]);

  useEffect(() => {
    if (activeTab !== 'picking' || pickingInputMode !== 'automatic' || stockData.length > 0) return;

    fetch('/api/stock')
      .then(r => r.json())
      .then(data => setStockData(data || []))
      .catch(console.error);
  }, [activeTab, pickingInputMode, stockData.length]);

  const showActionMsg = (text, type = 'success') => {
    setActionMessage({ text, type });
    // Errors stay visible until manually dismissed; success/warning auto-dismiss
    if (type !== 'danger') {
      setTimeout(() => setActionMessage(null), 5000);
    }
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
      setSyncingGoogleSheets(true);
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
          setSyncingGoogleSheets(false);
          setSyncingOrders(false);
          setLoading(false);
          clearInterval(pollId);
          setSyncProgressText('');
          return;
        }
        setSyncingStock(false);
        setSyncingGoogleSheets(false);
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
      setSyncingGoogleSheets(false);
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

  const getOrderStateBadgeClass = (stateLabel) => {
    if (!stateLabel) return 'badge-state-default';
    const label = stateLabel.toLowerCase();
    if (label.includes('magazzino') || label.includes('rosate')) {
      return 'badge-state-magazzino';
    }
    if (label.includes('pagamento') || label.includes('accettato') || label.includes('attesa')) {
      return 'badge-state-pagamento';
    }
    if (label.includes('spedito') || label.includes('consegnato') || label.includes('inviato')) {
      return 'badge-state-spedito';
    }
    if (label.includes('annullato') || label.includes('rimborsato') || label.includes('errore')) {
      return 'badge-state-annullato';
    }
    return 'badge-state-default';
  };

  const handleResolveMissingAssociation = (productId) => {
    setActiveTab('associations');
    setEditingProductId(productId);
    setIsNewAssociation(true);
    setAssociationModalMode('guided');
    setGuidedComponents([{ sku: '', qty_required: 1 }]);
    setRawAssociationText('');
    setIsAssociationModalOpen(true);
  };

  // Clear anomalies log
  const handleClearAnomalies = () => {
    setShowClearAnomaliesConfirm(true);
  };

  const executeClearAnomalies = async () => {
    setShowClearAnomaliesConfirm(false);
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
      showActionMsg("Errore durante la pulizia del registro.", "danger");
    }
  };

  const handleToggleState = async (stateId) => {
    const isSelected = selectedStates.includes(stateId);
    if (isSelected) {
      setSelectedStates(selectedStates.filter(id => id !== stateId));
    } else {
      setSelectedStates([...selectedStates, stateId]);
    }
  };

  const fetchSkuOrders = async (sku) => {
    setLoadingSkuOrders(true);
    setSelectedSkuForOrders(sku);
    setSkuOrdersSortDirection('asc');
    setSmartSkuCounterData(null);
    if (smartSkuCounterEnabled) {
      fetchSmartSkuCounter(sku);
    }
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

  const fetchSmartSkuCounter = async (sku) => {
    if (!sku) return;

    setLoadingSmartSkuCounter(true);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(sku)}/orders/smart-counter`);
      if (res.ok) {
        const data = await res.json();
        setSmartSkuCounterData(data);
      } else {
        setSmartSkuCounterData(null);
      }
    } catch (err) {
      console.error("Errore nel recupero del contatore smart:", err);
      setSmartSkuCounterData(null);
    } finally {
      setLoadingSmartSkuCounter(false);
    }
  };

  const toggleSmartSkuCounter = () => {
    setSmartSkuCounterEnabled(prev => {
      const next = !prev;
      if (next) {
        setSkuOrdersSortDirection('asc');
        fetchSmartSkuCounter(selectedSkuForOrders);
      } else {
        setSmartSkuCounterData(null);
      }
      return next;
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestConnectionResult(null);
    try {
      const res = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestashop_url: prestashopUrl,
          prestashop_api_key: prestashopApiKey,
          prestashop_mock_mode: prestashopMockMode
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestConnectionResult({ status: 'success', message: data.message });
      } else {
        setTestConnectionResult({ status: 'error', message: data.detail || "Connessione fallita." });
      }
    } catch (err) {
      console.error(err);
      setTestConnectionResult({ status: 'error', message: "Errore di connessione." });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSelectAllStates = async () => {
    const allIds = orderStates.map(s => s.id);
    setSelectedStates(allIds);
  };

  const handleSelectRecommendedStates = async () => {
    setSelectedStates(Array.from(new Set([...selectedStates, ...recommendedOrderStateIds])));
  };

  const handleDeselectAllStates = async () => {
    setSelectedStates([]);
  };

  const handleSaveOrderStates = async () => {
    setSavingStateSettings(true);
    setSettingsError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ included_state_ids: selectedStates })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedSelectedStates(selectedStates);
        showActionMsg("Stati ordine salvati con successo.");
        fetchData();
      } else {
        setSettingsError(data.detail || "Errore nel salvataggio degli stati ordine.");
      }
    } catch (e) {
      console.error(e);
      setSettingsError("Errore di rete durante il salvataggio degli stati ordine.");
    } finally {
      setSavingStateSettings(false);
    }
  };

  const handleSaveConnectionSettings = async (e) => {
    e.preventDefault();
    if (!prestashopMockMode) {
      if (!prestashopUrl.trim().endsWith('/api/')) {
        setSettingsError("L'URL API PrestaShop deve terminare con /api/.");
        return;
      }
      if (!prestashopApiKey.trim()) {
        setSettingsError("Inserisci la chiave API Webservice oppure abilita la modalità simulazione.");
        return;
      }
    }
    if (Number(prestashopSyncInterval) < 1) {
      setSettingsError("L'intervallo sincronizzazione ordini deve essere almeno 1 minuto.");
      return;
    }
    setSavingConnectionSettings(true);
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
      setSavingConnectionSettings(false);
    }
  };

  const handleSaveGoogleSheetsSettings = async (e) => {
    e.preventDefault();
    if (stockSource === 'google_sheets') {
      if (!googleSheetUrl.trim().startsWith('https://docs.google.com/spreadsheets/')) {
        setSettingsError("Inserisci un URL Google Sheets valido.");
        return;
      }
      if (!googleSheetName.trim()) {
        setSettingsError("Inserisci il nome del foglio Google Sheets.");
        return;
      }
      if (Number(googleSheetSyncInterval) < 1) {
        setSettingsError("L'intervallo verifica Google Sheets deve essere almeno 1 minuto.");
        return;
      }
    }
    if (!mappingSku.trim() || !mappingQty.trim()) {
      setSettingsError("Le colonne SKU e Quantità sono obbligatorie.");
      return;
    }
    setSavingStockSettings(true);
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
      setSavingStockSettings(false);
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

  const handleDeleteAssociation = (productId) => {
    setAssociationToDelete(productId);
    setShowDeleteAssociationConfirm(true);
  };

  const executeDeleteAssociation = async () => {
    if (!associationToDelete) return;
    const productId = associationToDelete;
    setAssociationToDelete(null);
    setShowDeleteAssociationConfirm(false);
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
    
    try {
      const res = await fetch('/api/orders/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds })
      });
      const data = await res.json();
      if (res.ok) {
        setPickingResults(data);
        setPickingRequirementFilter('all');
      } else {
        setPickingError(data.detail || "Errore durante l'elaborazione del fabbisogno.");
      }
    } catch (err) {
      setPickingError(`Errore di connessione: ${err.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const handleUploadPickingFiles = async (e) => {
    if (e) e.preventDefault();
    if (selectedPickingFiles.length === 0) {
      setPickingError("Seleziona almeno un file Excel da caricare.");
      return;
    }
    
    setPickingLoading(true);
    setPickingError(null);
    setPickingFilesAnomalies([]);
    setPickingFilesSummary([]);
    
    const formData = new FormData();
    for (let i = 0; i < selectedPickingFiles.length; i++) {
      formData.append('files', selectedPickingFiles[i]);
    }
    
    try {
      const res = await fetch('/api/orders/analyze-files', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setPickingResults({
          orders_found: data.orders_found,
          orders_missing: data.orders_missing,
          sku_requirements: data.sku_requirements,
          order_requirements: data.order_requirements
        });
        setPickingRequirementFilter('all');
        setPickingFilesAnomalies(data.anomalies || []);
        setPickingFilesSummary(data.files_processed || []);
      } else {
        setPickingError(data.detail || "Errore durante l'elaborazione del file di prelievo.");
      }
    } catch (err) {
      setPickingError(`Errore di connessione: ${err.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const addAutoPickingSkuFilter = (skuValue = autoPickingSkuQuery) => {
    const rawSku = String(skuValue || '').trim();
    if (!rawSku) return;

    const stockMatch = stockData.find(item => 
      item.sku && item.sku.trim().toUpperCase() === rawSku.toUpperCase()
    );
    const sku = stockMatch ? stockMatch.sku.trim() : rawSku;

    setAutoPickingSkuFilter(prev => (
      prev.some(existing => existing.toUpperCase() === sku.toUpperCase())
        ? prev
        : [...prev, sku]
    ));
    setAutoPickingSkuQuery('');
  };

  const removeAutoPickingSkuFilter = (sku) => {
    setAutoPickingSkuFilter(prev => prev.filter(existing => existing !== sku));
  };

  const handleGenerateAutomaticPicking = async (e) => {
    if (e) e.preventDefault();

    const limit = parseInt(autoPickingLimit, 10);
    if (!Number.isFinite(limit) || limit < 1 || limit > 500) {
      setPickingError("Inserisci un numero ordini compreso tra 1 e 500.");
      return;
    }

    const minResidual = Number(autoPickingMinResidual || 0);
    if (!Number.isFinite(minResidual) || minResidual < 0) {
      setPickingError("Inserisci una scorta minima SKU valida, pari a 0 o superiore.");
      return;
    }

    setPickingLoading(true);
    setPickingError(null);
    setPickingFilesAnomalies([]);
    setPickingFilesSummary([]);

    try {
      const res = await fetch('/api/orders/auto-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit,
          strict_chronology: autoPickingStrict,
          selection_strategy: autoPickingStrategy,
          min_sku_residual: minResidual,
          sku_filter: autoPickingSkuFilter
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPickingResults(data);
        setPickingRequirementFilter('all');
        setPickingViewMode('by_order');
        setAutoPickingResultView('selected');
      } else {
        setPickingError(data.detail || "Errore durante la generazione della lista automatica.");
      }
    } catch (err) {
      setPickingError(`Errore di connessione: ${err.message}`);
    } finally {
      setPickingLoading(false);
    }
  };

  const togglePickingSkuCounted = (sku) => {
    if (!pickingCountingMode || !sku) return;

    setCountedPickingSkus(prev => {
      const next = new Set(prev);
      if (next.has(sku)) {
        next.delete(sku);
      } else {
        next.add(sku);
      }
      return next;
    });
  };

  const clearCountedPickingSkus = () => {
    setCountedPickingSkus(new Set());
  };

  const togglePickingCountingMode = () => {
    setPickingCountingMode(prev => {
      if (prev) {
        setCountedPickingSkus(new Set());
      }
      return !prev;
    });
  };

  const handleCopyPickingList = () => {
    if (!pickingResults) return;
    
    let clipboardText = "";
    
    if (pickingViewMode === 'aggregated') {
      if (!pickingResults.sku_requirements) return;
      const textLines = [
        "=== LISTA PRELIEVO (AGGREGATA) ===",
        `Data: ${new Date().toLocaleString('it-IT')}`,
        `Ordini trovati nel database: ${pickingResults.orders_found.join(', ')}`,
        pickingResults.orders_missing && pickingResults.orders_missing.length > 0 
          ? `Ordini non trovati: ${pickingResults.orders_missing.join(', ')}`
          : "Tutti gli ordini sono stati trovati nel database.",
        "",
        "SKU | DESCRIZIONE | RICHIESTO | DISPONIBILE | STATO",
        "-------------------------------------------------------"
      ];

      if (pickingResults.mode === 'automatic') {
        textLines.splice(
          3,
          0,
          `Modalità automatica: ${pickingResults.auto_picking?.selection_strategy === 'maximize_orders' ? 'massimizza ordini' : (pickingResults.auto_picking?.strict_chronology ? 'coda rigida' : 'salta non preparabili')}`,
          `Scorta minima SKU: ${pickingResults.auto_picking?.min_sku_residual || 0}`,
          `Ordini saltati: ${pickingResults.skipped_orders?.length || 0}`
        );
      }
      
      pickingResults.sku_requirements.forEach(req => {
        const diff = req.qty_stock - req.qty_required;
        const statusText = diff >= 0 ? "Disponibile" : `Mancano ${Math.abs(diff)}`;
        textLines.push(`${req.sku} | ${req.description} | Richiesto: ${req.qty_required} | Stock: ${req.qty_stock} | ${statusText}`);
      });
      clipboardText = textLines.join('\n');
    } else {
      if (!pickingResults.order_requirements) return;
      const textLines = [
        "=== DETTAGLIO PRELIEVO PER ORDINE ===",
        `Data: ${new Date().toLocaleString('it-IT')}`,
        ""
      ];

      if (pickingResults.mode === 'automatic') {
        textLines.push(`Modalità automatica: ${pickingResults.auto_picking?.selection_strategy === 'maximize_orders' ? 'massimizza ordini' : (pickingResults.auto_picking?.strict_chronology ? 'coda rigida' : 'salta non preparabili')}`);
        textLines.push(`Scorta minima SKU: ${pickingResults.auto_picking?.min_sku_residual || 0}`);
        textLines.push(`Ordini saltati: ${pickingResults.skipped_orders?.length || 0}`);
        textLines.push("");
      }
      
      pickingResults.order_requirements.forEach(ord => {
        const orderDate = ord.date_add ? ` - Data: ${new Date(ord.date_add).toLocaleString('it-IT')}` : '';
        const orderAge = ord.date_add ? ` - Eta: ${getRelativeTimeString(ord.date_add)}` : '';
        const orderState = ord.current_state_label ? ` - Stato: ${ord.current_state_label}` : '';
        textLines.push(`Ordine: ${ord.order_id} - Cliente: ${ord.customer_name}${orderDate}${orderAge}${orderState}`);
        textLines.push("--------------------------------------------------------------------------------");
        ord.items.forEach(req => {
          let statusText = "";
          if (req.status === 'disponibile') {
            statusText = `Disponibile (Residuo: ${req.avail_after})`;
          } else if (req.status === 'parziale') {
            statusText = `Parziale (Coperti ${req.qty_fulfilled} di ${req.qty_required})`;
          } else {
            statusText = `Mancante (Richiesto: ${req.qty_required})`;
          }
          textLines.push(`- SKU: ${req.sku} | ${req.description} | Richiesto: ${req.qty_required} | Stock: ${req.qty_stock} | ${statusText}`);
        });
        textLines.push("");
      });
      clipboardText = textLines.join('\n');
    }
    
    navigator.clipboard.writeText(clipboardText)
      .then(() => {
        setPickingCopyState('copied');
        if (pickingCopyTimeoutRef.current) {
          window.clearTimeout(pickingCopyTimeoutRef.current);
        }
        pickingCopyTimeoutRef.current = window.setTimeout(() => {
          setPickingCopyState('idle');
          pickingCopyTimeoutRef.current = null;
        }, 2000);
        showActionMsg("Lista prelievo copiata negli appunti con successo!");
      })
      .catch(err => {
        showActionMsg("Errore durante la copia negli appunti.", "danger");
      });
  };

  const handleSyncSpecificOrders = async () => {
    if (!pickingResults || !pickingResults.orders_missing || pickingResults.orders_missing.length === 0) return;
    setSyncingSpecificOrders(true);
    try {
      const res = await fetch('/api/prestashop/sync-specific-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: pickingResults.orders_missing })
      });
      const data = await res.json();
      if (res.ok) {
        showActionMsg(`Sincronizzati con successo ${data.orders_synced} ordini mancanti!`);
        
        // Ricalcola il fabbisogno con gli ordini appena sincronizzati
        const regex = /\b\d{4,8}\b/g;
        const matches = rawPickingText.match(regex) || [];
        const orderIds = Array.from(new Set(matches.map(Number)));
        
        if (orderIds.length > 0) {
          const resAnalyze = await fetch('/api/orders/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_ids: orderIds })
          });
          const dataAnalyze = await resAnalyze.json();
          if (resAnalyze.ok) {
            setPickingResults(dataAnalyze);
            setPickingRequirementFilter('all');
          }
        }
      } else {
        showActionMsg(data.detail || "Errore durante la sincronizzazione degli ordini.", "danger");
      }
    } catch (err) {
      showActionMsg(`Errore di connessione: ${err.message}`, "danger");
    } finally {
      setSyncingSpecificOrders(false);
    }
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

  const handleRestoreDatabase = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPendingRestoreFile(file);
    setShowRestoreConfirm(true);
    
    // Reset the file input so the same file can be reselected
    e.target.value = '';
  };

  const executeRestoreDatabase = async () => {
    if (!pendingRestoreFile) return;
    
    const file = pendingRestoreFile;
    setPendingRestoreFile(null);
    setShowRestoreConfirm(false);
    
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

  const getAnomalySourceLabel = (source) => ({
    stock_import: 'Import giacenze',
    associations_import: 'Import associazioni',
    orders_sync: 'Sync PrestaShop',
    calculation: 'Calcolo disponibilita'
  }[source] || source || 'Origine sconosciuta');

  const getAnomalyTypeLabel = (type) => ({
    missing_sku: 'SKU mancante',
    missing_sku_in_stock: 'SKU non in giacenza',
    missing_association: 'Associazione mancante',
    negative_quantity: 'Quantita negativa',
    invalid_quantity: 'Quantita non valida',
    duplicate_sku: 'SKU duplicato',
    missing_product_id: 'Product ID mancante',
    invalid_product_id: 'Product ID non valido',
    empty_sku_list: 'Lista SKU vuota',
    duplicate_association: 'Associazione duplicata',
    parse_error: 'Errore lettura file',
    sync_error: 'Errore sincronizzazione',
    calculation_error: 'Errore calcolo',
    missing_reference: 'Riferimento mancante'
  }[type] || type || 'Anomalia');

  const getAnomalyMeta = (anomaly) => {
    const type = anomaly?.anomaly_type || '';
    const source = anomaly?.source || '';
    const isCritical = ['parse_error', 'sync_error', 'calculation_error', 'missing_association', 'missing_sku_in_stock'].includes(type);
    const isWarning = ['invalid_quantity', 'negative_quantity', 'missing_sku', 'missing_product_id', 'invalid_product_id', 'empty_sku_list'].includes(type);
    const actionLabel = type.includes('missing_association')
      ? 'Crea associazione'
      : type.includes('missing_sku_in_stock') || type.includes('missing_sku') || (source === 'stock_import' && type !== 'duplicate_sku')
        ? 'Controlla giacenze'
        : type.includes('sync_error')
          ? 'Controlla connessione'
          : source === 'associations_import'
            ? 'Controlla associazioni'
            : type.includes('calculation_error')
              ? 'Ricalcola'
              : '';

    return {
      sourceLabel: getAnomalySourceLabel(source),
      typeLabel: getAnomalyTypeLabel(type),
      severity: isCritical ? 'critical' : isWarning ? 'warning' : 'info',
      severityLabel: isCritical ? 'Critica' : isWarning ? 'Da verificare' : 'Info',
      actionLabel,
      actionable: Boolean(actionLabel)
    };
  };

  const handleExportAnomaliesCsv = (rows) => {
    const headers = ['Origine', 'Oggetto', 'Nome prodotto', 'ID ordine', 'Stato ordine', 'Problema', 'Gravita', 'Dettaglio', 'Rilevata il'];
    const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(anomaly => {
      const meta = getAnomalyMeta(anomaly);
      return [
        meta.sourceLabel,
        anomaly.record_key || '',
        anomaly.product_name || '',
        anomaly.order_id || '',
        anomaly.current_state_label || '',
        meta.typeLabel,
        meta.severityLabel,
        anomaly.message || '',
        formatDate(anomaly.created_at)
      ].map(escapeCell).join(',');
    });
    const csv = [headers.map(escapeCell).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro-anomalie-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyOrderId = (orderId) => {
    navigator.clipboard.writeText(String(orderId))
      .then(() => {
        setCopiedOrderId(orderId);
        setTimeout(() => setCopiedOrderId(null), 1500);
        showActionMsg(`ID ordine ${orderId} copiato.`);
      })
      .catch((err) => {
        console.error("Errore nella copia dell'ID Ordine:", err);
        showActionMsg("Errore durante la copia dell'ID ordine.", "danger");
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
  const currentStockSourceData = stockViewMode === 'standard' ? stockData : missingStockData;

  const filteredStock = currentStockSourceData.filter(item => 
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
    order.lines.some(l =>
      String(l.product_id).includes(searchOrder) ||
      (l.product_name || '').toLowerCase().includes(searchOrder.toLowerCase())
    )
  );
  const ordersWithoutAssociations = filteredOrders.filter(order =>
    order.lines.some(line => line.has_association === false)
  ).length;

  const recommendedOrderStates = orderStates.filter(state => {
    const name = String(state.name || '').toLowerCase();
    return (
      [2, 3, 12, 89].includes(Number(state.id)) ||
      name.includes('pagamento accettato') ||
      name.includes('preparazione in corso') ||
      name.includes('magazzino rosate')
    );
  });
  const recommendedOrderStateIds = recommendedOrderStates.map(state => state.id);
  const filteredOrderStates = orderStates.filter(state => {
    const matchesSearch = (
      state.name.toLowerCase().includes(searchStateQuery.toLowerCase()) ||
      state.id.toString().includes(searchStateQuery)
    );
    const matchesSelectedFilter = !showOnlySelectedStates || selectedStates.includes(state.id);
    return matchesSearch && matchesSelectedFilter;
  });
  const selectedStatesKey = [...selectedStates].sort((a, b) => a - b).join(',');
  const savedSelectedStatesKey = [...savedSelectedStates].sort((a, b) => a - b).join(',');
  const orderStatesDirty = selectedStatesKey !== savedSelectedStatesKey;
  const settingsSections = [
    { id: 'connection', label: 'Connessione' },
    { id: 'stock', label: 'Giacenze' },
    { id: 'orders', label: 'Ordini' },
    { id: 'backup', label: 'Backup' }
  ];
  const prestashopUrlValid = prestashopUrl.trim().endsWith('/api/');
  const prestashopApiKeyPresent = prestashopApiKey.trim().length > 0;
  const prestashopRealReady = !prestashopMockMode && prestashopUrlValid && prestashopApiKeyPresent;
  const prestashopStatusLabel = prestashopMockMode
    ? 'Simulazione'
    : (prestashopRealReady ? 'API reale configurata' : 'Connessione da completare');
  const prestashopStatusTone = prestashopMockMode
    ? 'warning'
    : (prestashopRealReady ? 'success' : 'danger');
  const dashboardHasStock = (dashboardData?.sku_count || 0) > 0;
  const dashboardHasAssociations = (dashboardData?.product_count || 0) > 0;
  const dashboardHasOrders = (dashboardData?.order_count || 0) > 0;
  const dashboardHasAnomalies = (dashboardData?.anomalies_count || 0) > 0;
  const dashboardHasCalculation = Boolean(dashboardData?.latest_calculation_run);
  const dashboardHasOrdersSync = Boolean(status?.last_orders_sync);
  const dashboardHealthTone = !dashboardHasStock || !dashboardHasAssociations || dashboardHasAnomalies
    ? 'danger'
    : (!dashboardHasCalculation || !dashboardHasOrdersSync ? 'warning' : 'success');
  const dashboardHealthLabel = dashboardHealthTone === 'success'
    ? 'Sistema operativo'
    : dashboardHealthTone === 'warning'
      ? 'Da aggiornare'
      : 'Richiede attenzione';
  const dashboardHealthText = !dashboardHasStock
    ? 'Manca il file giacenze: importa o collega la sorgente prima di lavorare sulla disponibilita.'
    : !dashboardHasAssociations
      ? 'Mancano le associazioni kit: carica la composizione dei prodotti composti.'
      : dashboardHasAnomalies
        ? `${dashboardData.anomalies_count} anomalie aperte richiedono verifica.`
        : !dashboardHasCalculation
          ? 'Dati presenti: esegui il primo ricalcolo per aggiornare la disponibilita.'
          : !dashboardHasOrdersSync
            ? "Dati presenti: sincronizza gli ordini PrestaShop per aggiornare l'impegnato."
            : 'Giacenze, associazioni, ordini e calcolo risultano aggiornati.';
  const dashboardNextAction = !dashboardHasStock
    ? { label: 'Importa giacenze', action: () => setActiveTab('stock') }
    : !dashboardHasAssociations
      ? { label: 'Carica associazioni', action: () => setActiveTab('associations') }
      : dashboardHasAnomalies
        ? { label: `Risolvi ${dashboardData.anomalies_count} anomalie`, action: () => setActiveTab('anomalies') }
        : !dashboardHasCalculation
          ? { label: 'Esegui ricalcolo', action: handleRunCalculation }
          : { label: 'Aggiorna tutto', action: handleSyncAll };

  const autoPickingSkuSuggestions = Array.from(
    new Map(
      stockData
        .filter(item => item.sku && !String(item.sku).startsWith('__spacer_'))
        .map(item => [String(item.sku).trim().toUpperCase(), String(item.sku).trim()])
    ).values()
  )
    .filter(sku =>
      !autoPickingSkuFilter.some(selected => selected.toUpperCase() === sku.toUpperCase()) &&
      (!autoPickingSkuQuery.trim() || sku.toLowerCase().includes(autoPickingSkuQuery.trim().toLowerCase()))
    )
    .slice(0, 12);

  const pickingRequirements = pickingResults?.sku_requirements || [];
  const pickingOrders = pickingResults?.order_requirements || [];
  const countedPickingCount = pickingRequirements.filter(req => countedPickingSkus.has(req.sku)).length;
  const visiblePickingRequirements = pickingRequirements.filter(req => {
    const tone = getRequirementMeta(req).tone;
    if (pickingRequirementFilter === 'missing') return tone === 'danger';
    if (pickingRequirementFilter === 'available') return tone !== 'danger';
    return true;
  });
  const sortedPickingOrders = pickingResults?.mode === 'automatic'
    ? pickingOrders
    : [...pickingOrders].sort((a, b) => {
      const metaA = getOrderPickingMeta(a);
      const metaB = getOrderPickingMeta(b);
      if (metaA.rank !== metaB.rank) return metaA.rank - metaB.rank;
      return String(a.order_id || '').localeCompare(String(b.order_id || ''));
    });
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      {isMobileSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>}
      <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
              <rect x="4" y="5" width="24" height="22" rx="5" fill="var(--color-primary-bg)" stroke="var(--color-primary)" strokeWidth="2" />
              <path d="M10 13h12M10 18h8M10 23h12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 8v6l2-1.5L25 14V8" fill="var(--color-primary)" />
            </svg>
          </div>
          <span className="brand-name">Giacenza</span>
        </div>

        <ul className="nav-list" role="tablist">
          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dashboard')}
            role="tab"
            aria-selected={activeTab === 'dashboard'}
          >
            <Icons.Dashboard />
            <span>Dashboard</span>
          </button>
          </li>
          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stock')}
            role="tab"
            aria-selected={activeTab === 'stock'}
          >
            <Icons.Stock />
            <span>Giacenza</span>
          </button>
          </li>

          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => setActiveTab('orders')}
            role="tab"
            aria-selected={activeTab === 'orders'}
          >
            <Icons.Orders />
            <span>Ordini</span>
          </button>
          </li>
          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'picking' ? 'active' : ''}`} 
            onClick={() => setActiveTab('picking')}
            role="tab"
            aria-selected={activeTab === 'picking'}
          >
            <Icons.Picking />
            <span>Lista Prelievo</span>
          </button>
          </li>
          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'anomalies' ? 'active' : ''}`} 
            onClick={() => setActiveTab('anomalies')}
            role="tab"
            aria-selected={activeTab === 'anomalies'}
          >
            <Icons.Anomaly />
            <span className="nav-item-badge-wrapper">
              Anomalie
              {dashboardData?.anomalies_count > 0 && (
                <span className="badge badge-danger" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                  {dashboardData.anomalies_count}
                </span>
              )}
            </span>
          </button>
          </li>
          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'associations' ? 'active' : ''}`} 
            onClick={() => setActiveTab('associations')}
            role="tab"
            aria-selected={activeTab === 'associations'}
          >
            <Icons.Associations />
            <span>Editor Associazioni</span>
          </button>
          </li>
          <li role="presentation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')}
            role="tab"
            aria-selected={activeTab === 'settings'}
          >
            <Icons.Settings />
            <span>Impostazioni</span>
          </button>
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
        {/* Fixed-position toast alerts */}
        {actionMessage && (
          <div className="toast-container">
            <div className={`toast-alert badge-${actionMessage.type === 'danger' ? 'danger' : actionMessage.type === 'warning' ? 'warning' : 'success'}`}>
              <span>{actionMessage.text}</span>
              <button className="toast-close" onClick={() => setActionMessage(null)} aria-label="Chiudi notifica">x</button>
            </div>
          </div>
        )}

        {/* Dynamic Headers based on active tab */}
        <header className="content-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="button" 
            className="mobile-nav-toggle btn btn-secondary" 
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Apri menu"
            style={{ padding: '8px', minWidth: '40px', minHeight: '40px', display: 'none', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="page-title" style={{ flexGrow: 1 }}>
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

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {activeTab !== 'settings' && activeTab !== 'picking' && (
              <button 
                className="btn btn-secondary" 
                onClick={fetchData} 
                disabled={loading}
                title="Ricarica i dati salvati nel database locale senza avviare nuove richieste esterne (veloce)"
              >
                <Icons.Sync spinning={loading} /> Aggiorna Dati
              </button>
            )}
            
            {activeTab === 'dashboard' && (
              <button 
                className="btn btn-primary" 
                onClick={handleSyncAll} 
                disabled={loading}
                title="Avvia la sincronizzazione da Google Sheets ed esegue il calcolo degli ordini da PrestaShop (richiede qualche secondo)"
              >
                Sincronizza Tutto
              </button>
            )}
            
            {activeTab === 'stock' && (
              stockSource === 'google_sheets' ? (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSyncAll} 
                  disabled={syncingGoogleSheets || syncingOrders || loading}
                  title="Avvia la sincronizzazione da Google Sheets ed esegue il calcolo degli ordini da PrestaShop (richiede qualche secondo)"
                >
                  <Icons.Sync spinning={syncingGoogleSheets || syncingOrders} /> Sincronizza Tutto (Sheets & Ordini)
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSyncOrders} 
                  disabled={syncingOrders || loading}
                  title="Scarica i nuovi ordini da PrestaShop e ricalcola le giacenze (richiede qualche secondo)"
                >
                  <Icons.Sync spinning={syncingOrders} /> Sincronizza Ordini
                </button>
              )
            )}

            {activeTab === 'orders' && (
              <button 
                className="btn btn-primary" 
                onClick={handleSyncOrders} 
                disabled={syncingOrders || loading}
              >
                <Icons.Sync spinning={syncingOrders} /> Sincronizza Ordini
              </button>
            )}
          </div>
        </header>



        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && dashboardData && (
          <>
            {/* Onboarding Banner when no data is loaded */}
            {dashboardData.sku_count === 0 && dashboardData.product_count === 0 && (
              <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderLeft: '3px solid var(--color-primary)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Stock /> Configurazione iniziale giacenze
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '16px' }}>
                  Questo strumento ti permette di sincronizzare e calcolare in tempo reale le giacenze fisiche di magazzino con le quantità vendute o impegnate sul tuo portale e-commerce. Per iniziare, segui questi passaggi consigliati:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.82rem', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>1. Configura Connessione</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Vai su <strong>Impostazioni</strong> per inserire le credenziali API PrestaShop e i filtri di stato ordine.</span>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.82rem', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>2. Importa Giacenze Magazzino</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Carica il file Excel <code>giacenza.xlsx</code> o configura un Google Sheet pubblico per il polling automatico.</span>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.82rem', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>3. Crea Associazioni Kit</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Definisci la composizione dei tuoi prodotti composti (kit/bundle) caricando <code>associazione.xlsx</code>.</span>
                  </div>
                </div>
              </div>
            )}

            <section className={`dashboard-health-panel ${dashboardHealthTone}`}>
              <div className="dashboard-health-main">
                <span className="dashboard-health-kicker">Stato sistema</span>
                <h2>{dashboardHealthLabel}</h2>
                <p>{dashboardHealthText}</p>
              </div>
              <div className="dashboard-next-action">
                <span>Prossima azione</span>
                <button className={`btn ${dashboardHealthTone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={dashboardNextAction.action} disabled={loading || syncingGoogleSheets || syncingOrders}>
                  {dashboardNextAction.label}
                </button>
              </div>
            </section>

            {/* KPI Cards Grid */}
            <section className="kpi-grid">
              <div className={`glass-panel kpi-card ${dashboardHasStock ? 'success' : 'danger'}`}>
                <span className="kpi-title">Giacenze</span>
                <span className="kpi-value">{dashboardData.sku_count}</span>
                <span className="kpi-desc">
                  {dashboardHasStock ? `Ultimo import: ${formatDate(dashboardData.latest_import_warehouse)}` : 'Import giacenze mancante'}
                </span>
              </div>
              <div className={`glass-panel kpi-card ${dashboardHasAssociations ? 'success' : 'danger'}`}>
                <span className="kpi-title">Composizione kit</span>
                <span className="kpi-value">{dashboardData.product_count}</span>
                <span className="kpi-desc">
                  {dashboardHasAssociations ? `Ultimo import: ${formatDate(dashboardData.latest_import_associations)}` : 'Associazioni mancanti'}
                </span>
              </div>
              <div className={`glass-panel kpi-card ${dashboardHasOrdersSync ? 'success' : 'warning'}`}>
                <span className="kpi-title">Ordini impegnati</span>
                <span className="kpi-value">{dashboardData.order_count}</span>
                <span className="kpi-desc">
                  {dashboardData.items_ordered} righe vendute · Sync {status?.last_orders_sync ? getRelativeTimeString(status.last_orders_sync) : 'mai'}
                </span>
              </div>
              <div className={`glass-panel kpi-card ${dashboardData.anomalies_count > 0 ? 'danger' : 'success'}`}>
                <span className="kpi-title">Anomalie</span>
                <span className="kpi-value">{dashboardData.anomalies_count}</span>
                <span className="kpi-desc">
                  {dashboardData.anomalies_count > 0 ? 'Aperte nel registro' : 'Nessuna anomalia aperta'}
                </span>
              </div>
            </section>

            {/* Dashboard Widgets */}
            <div className="dashboard-grid">
              {/* Left Column: Ingestion cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Physical Inventory Card */}
                <div className="glass-panel widget-card" style={{ gap: '16px' }}>
                  <span className="widget-title">Ingestione Inventario Fisico (Giacenze)</span>
                  
                  {stockSource === 'google_sheets' ? (
                    <div style={{ background: 'rgba(5, 150, 105, 0.045)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.18)' }}>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span>
                        Sincronizzazione Google Sheets Attiva
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '12px' }}>
                        L'inventario è collegato al foglio di calcolo remoto.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-primary" 
                          disabled={syncingGoogleSheets}
                          onClick={handleSyncGoogleSheetsNow}
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {status?.local_files?.giacenza_exists && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Foglio Excel Attivo</label>
                            <select className="select-control" style={{ width: '180px', height: '32px', fontSize: '0.82rem' }} value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                              {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <button className="btn btn-primary" style={{ height: '32px', fontSize: '0.82rem', padding: '0 12px' }} onClick={() => handleLocalImport('warehouse')} disabled={loading}>
                            Importa da [{selectedSheet}]
                          </button>
                        </div>
                      )}
                      
                      <label className="upload-card" style={{ width: '100%', cursor: 'pointer' }}>
                        <svg width="28" height="28" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '4px' }}>Sfoglia o trascina giacenza.xlsx</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Carica il file delle giacenze fisiche in formato Excel (.xlsx)</span>
                        <input type="file" className="file-input" accept=".xlsx" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'warehouse')} />
                      </label>

                      {status?.active_warehouse_batch && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '0' }}>
                          Batch attivo: <strong>{status.active_warehouse_batch.filename}</strong> (Foglio: {status.active_warehouse_batch.sheet_name}) con {status.active_warehouse_batch.record_count} SKU.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Compound Products Card */}
                <div className="glass-panel widget-card" style={{ gap: '16px' }}>
                  <span className="widget-title">Carica Esplosione Distinte (Associazioni)</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {status?.local_files?.associazione_exists && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Trovato file <code>associazione.xlsx</code> in locale.</span>
                        <button className="btn btn-primary" style={{ height: '32px', fontSize: '0.82rem', padding: '0 12px' }} onClick={() => handleLocalImport('associations')} disabled={loading}>
                          Importa File Local
                        </button>
                      </div>
                    )}
                    
                    <label className="upload-card" style={{ width: '100%', cursor: 'pointer' }}>
                      <svg width="28" height="28" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '4px' }}>Sfoglia o trascina associazione.xlsx</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Carica il file con l'esplosione dei kit in SKU (.xlsx)</span>
                      <input type="file" className="file-input" accept=".xlsx" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'associations')} />
                    </label>

                    {status?.active_associations_batch && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '0' }}>
                        Batch attivo: <strong>{status.active_associations_batch.filename}</strong> con {status.active_associations_batch.record_count} associazioni.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Status & Operational actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Processing Status widget */}
                <div className="glass-panel widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span className="widget-title">Stato Elaborazione</span>
                  
                  <div>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Ultimo Ricalcolo Completo:</h4>
                    <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>
                      {dashboardData.latest_calculation_run ? formatDate(dashboardData.latest_calculation_run) : "Mai eseguito"}
                    </p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Cartella di Lavoro Locale:</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>giacenza.xlsx:</span>
                        <strong style={{ color: status?.local_files?.giacenza_exists ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {status?.local_files?.giacenza_exists ? 'PRESENTE' : 'MANCANTE'}
                        </strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>associazione.xlsx:</span>
                        <strong style={{ color: status?.local_files?.associazione_exists ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {status?.local_files?.associazione_exists ? 'PRESENTE' : 'MANCANTE'}
                        </strong>
                      </li>
                    </ul>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '8px', wordBreak: 'break-all' }}>
                      Path: {status?.local_files?.workspace_path}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', height: '32px' }} onClick={() => setActiveTab('settings')}>
                      Gestisci Stati Sincronizzazione
                    </button>
                    {dashboardData.anomalies_count > 0 && (
                      <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', height: '32px' }} onClick={() => setActiveTab('anomalies')}>
                        Visualizza {dashboardData.anomalies_count} Anomalie
                      </button>
                    )}
                  </div>
                </div>

                {/* PrestaShop Sync card */}
                <div className="glass-panel widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span className="widget-title">PrestaShop Webservice</span>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.4', margin: '0' }}>
                    Sincronizza gli ordini attivi degli stati selezionati configurati nelle impostazioni.
                  </p>
                  
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '8px 12px' }} onClick={handleSyncOrders} disabled={loading}>
                    Sincronizza Ordini Ora
                  </button>

                  {status?.last_orders_sync && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      Verificato: <strong style={{ color: 'var(--text-primary)' }}>{new Date(status.last_orders_sync).toLocaleString('it-IT')}</strong>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

        {/* --- STOCK TAB --- */}
        {activeTab === 'stock' && (
          <>
            <div className="sync-cards-grid">
              <div className={`glass-panel sync-card ${syncingStock ? 'card-loading-pulse-green' : ''}`}>
                <div className="sync-card-icon stock">
                  <Icons.Stock style={{ width: '24px', height: '24px', animation: syncingStock ? 'spin 1s infinite linear' : 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Sincronizzazione Giacenze</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
                    Sorgente: <span style={{ color: 'var(--color-primary)' }}>{status?.active_warehouse_batch?.sheet_name || status?.active_warehouse_batch?.filename || 'File locale'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Ultimo sync: <strong style={{ color: 'var(--text-primary)' }}>
                      {stockSource === 'google_sheets'
                        ? (status?.google_sheet_last_sync ? new Date(status.google_sheet_last_sync).toLocaleString('it-IT') : 'Mai')
                        : (status?.active_warehouse_batch?.imported_at ? new Date(status.active_warehouse_batch.imported_at).toLocaleString('it-IT') : 'Mai')
                      }
                    </strong>
                    {((stockSource === 'google_sheets' && status?.google_sheet_last_sync) || (stockSource !== 'google_sheets' && status?.active_warehouse_batch?.imported_at)) && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        | {getRelativeTimeString(stockSource === 'google_sheets' ? status.google_sheet_last_sync : status.active_warehouse_batch.imported_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`glass-panel sync-card ${syncingOrders ? 'card-loading-pulse' : ''}`}>
                <div className="sync-card-icon orders">
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
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-wrapper">
                  <input type="text" className="search-input" placeholder="Cerca per SKU o descrizione..." value={searchStock} onChange={(e) => setSearchStock(e.target.value)} />
                  <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
                </div>
                
                {/* View Mode Toggle Buttons */}
                <div className="toggle-group" style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button 
                    className={`btn ${stockViewMode === 'standard' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.8rem', padding: '4px 12px', border: 'none', background: stockViewMode === 'standard' ? 'var(--color-primary)' : 'transparent', color: stockViewMode === 'standard' ? '#fff' : 'var(--text-secondary)', borderRadius: '6px', height: '28px', transition: 'all 0.2s', cursor: 'pointer' }}
                    onClick={() => setStockViewMode('standard')}
                  >
                    Giacenza Standard
                  </button>
                  <button 
                    className={`btn ${stockViewMode === 'missing' ? 'btn-danger' : ''}`}
                    style={{ fontSize: '0.8rem', padding: '4px 12px', border: 'none', background: stockViewMode === 'missing' ? 'var(--color-danger)' : 'transparent', color: stockViewMode === 'missing' ? '#fff' : 'var(--text-secondary)', borderRadius: '6px', height: '28px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    onClick={() => setStockViewMode('missing')}
                  >
                    SKU Non in File
                    {missingStockData.length > 0 && (
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {missingStockData.length}
                      </span>
                    )}
                  </button>
                </div>

                {stockSource === 'google_sheets' && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(99,102,241,0.3)', height: '32px' }}
                    disabled={syncingGoogleSheets}
                    onClick={handleSyncGoogleSheetsNow}
                  >
                    <Icons.Sync spinning={syncingGoogleSheets} />
                    {syncingGoogleSheets ? "Sincronizzazione..." : "Sincronizza Google Sheets"}
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visualizzate: {sortedStock.length} di {currentStockSourceData.length} SKU
              </span>
            </div>
            <div className="table-container">
              {tabLoading ? (
                <TableSkeleton rows={8} cols={9} />
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
                      const isMissing = item.is_missing;
                      const percent = !isSpacer && !isMissing && item.qty_total > 0 ? Math.min(100, Math.max(0, (item.qty_residual / item.qty_total) * 100)) : 0;
                      const barClass = isMissing || percent <= 0 ? 'danger' : percent < 30 ? 'warning' : 'success';
                      
                      return (
                        <tr key={item.index} style={
                          isSpacer 
                            ? { height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.005)' } 
                            : (item.qty_residual <= 0 || isMissing)
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
                          <td style={{ textAlign: 'right', fontWeight: '700', color: (item.qty_residual <= 0 || isMissing) ? 'var(--color-danger)' : 'var(--color-success)' }}>
                            {isSpacer ? "" : (isMissing ? "0" : item.qty_residual)}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {isSpacer ? "" : isMissing ? (
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <span className="badge badge-danger" style={{ fontWeight: '700', letterSpacing: '0.5px' }}>NON DISPONIBILE</span>
                              </div>
                            ) : (
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
                  {stockViewMode === 'missing' 
                    ? "Nessuna SKU non in file trovata (tutte le SKU impegnate sono presenti a inventario)."
                    : "Nessuna SKU trovata. Assicurati di aver caricato il file 'giacenza.xlsx' ed eseguito il calcolo."
                  }
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
                <input type="text" className="search-input" placeholder="Cerca per Order ID, stato, prodotto o Product ID..." value={searchOrder} onChange={(e) => setSearchOrder(e.target.value)} />
                <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
              </div>
              <select
                className="select-control order-state-filter"
                aria-label="Filtra ordini per stato attuale PrestaShop"
                value={orderStateFilter}
                onChange={(e) => {
                  setOrderStateFilter(e.target.value);
                  setOrdersPage(1);
                }}
              >
                <option value="all">Tutti gli stati attuali</option>
                {ordersAvailableStates.map(state => (
                  <option key={state.id} value={state.id}>{state.name} ({state.count})</option>
                ))}
              </select>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visualizzati: {filteredOrders.length} di {totalOrders} Ordini Totali
              </span>
              {ordersWithoutAssociations > 0 && (
                <span className="orders-missing-summary" aria-live="polite">
                  {ordersWithoutAssociations} {ordersWithoutAssociations === 1 ? 'ordine' : 'ordini'} senza associazione
                </span>
              )}
            </div>
            <div className="table-container">
              {tabLoading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : filteredOrders.length > 0 ? (
                <table className="custom-table orders-table">
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
                    {filteredOrders.map(order => {
                      const orderHasMissingAssociation = order.lines.some(line => line.has_association === false);
                      return (
                      <React.Fragment key={order.order_id}>
                        {order.lines.map((line, idx) => {
                          const lineHasMissingAssociation = line.has_association === false;
                          return (
                          <tr 
                            key={`${order.order_id}-${idx}`} 
                            className={`${orderHasMissingAssociation ? 'order-row-missing-association' : ''} ${lineHasMissingAssociation ? 'order-line-missing-association' : ''}`.trim()}
                            style={{ 
                              borderBottom: idx === order.lines.length - 1 
                                ? '2px solid var(--border-color)' 
                                : '1px dashed rgba(255, 255, 255, 0.03)' 
                            }}
                          >
                            {idx === 0 ? (
                              <td 
                                rowSpan={order.lines.length} 
                                style={{ position: 'relative', fontWeight: '700', verticalAlign: 'top', paddingTop: '14px', cursor: 'pointer', color: 'var(--color-primary)', fontFamily: 'monospace' }}
                                onClick={() => handleCopyOrderId(order.order_id)}
                                title="Clicca per copiare l'ID ordine"
                              >
                                <div className="order-id-stack">
                                  <span>{highlightText(order.order_id, searchOrder)}</span>
                                  {orderHasMissingAssociation && (
                                    <span className="order-missing-label">
                                      <svg aria-hidden="true" viewBox="0 0 20 20">
                                        <path d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      Associazione mancante
                                    </span>
                                  )}
                                </div>
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
                                <span className={`badge ${getOrderStateBadgeClass(order.current_state_label)}`}>
                                  {highlightText(order.current_state_label, searchOrder)}
                                </span>
                              </td>
                            ) : null}
                            {idx === 0 ? (
                              <td rowSpan={order.lines.length} style={{ color: 'var(--text-secondary)', verticalAlign: 'top', paddingTop: '14px' }}>
                                {formatDate(order.date_add)}
                              </td>
                            ) : null}
                            <td>
                              <div className="order-product-cell">
                                <strong>{highlightText(line.product_name || 'Nome prodotto non disponibile', searchOrder)}</strong>
                                <span>Prod ID: {highlightText(line.product_id, searchOrder)} · Qta: {line.product_quantity}</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {lineHasMissingAssociation ? (
                                <span className="order-association-warning" role="status">
                                  <svg aria-hidden="true" viewBox="0 0 20 20">
                                    <path d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Nessuna associazione trovata
                                </span>
                              ) : line.skus_generated}
                            </td>
                          </tr>
                          );
                        })}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  {searchOrder || orderStateFilter !== 'all'
                    ? 'Nessun ordine corrisponde ai filtri selezionati.'
                    : 'Nessun ordine sincronizzato. Seleziona gli stati nelle impostazioni e premi "Sincronizza Ordini da Webservice" in Dashboard.'}
                </p>
              )}
            </div>
            
            {/* Pagination Controls */}
            <Pagination 
              currentPage={ordersPage}
              totalPages={totalOrdersPages}
              onPageChange={setOrdersPage}
              limit={ordersLimit}
              onLimitChange={setOrdersLimit}
              disabled={loading}
            />
          </div>
        )}

        {/* --- ANOMALIES TAB --- */}
        {activeTab === 'anomalies' && (() => {
          const anomalySources = Array.from(new Set(anomalyData.map(an => an.source).filter(Boolean)));
          const anomalyTypes = Array.from(new Set(anomalyData.map(an => an.anomaly_type).filter(Boolean)));
          const anomalyOrderStatesMap = anomalyData.reduce((states, anomaly) => {
            if (anomaly.current_state != null) {
              const key = String(anomaly.current_state);
              if (!states.has(key)) {
                states.set(key, {
                  id: key,
                  label: anomaly.current_state_label || `Stato ${key}`,
                  count: 0
                });
              }
              states.get(key).count += 1;
            }
            return states;
          }, new Map());
          const anomalyOrderStates = Array.from(anomalyOrderStatesMap.values())
            .sort((a, b) => a.label.localeCompare(b.label, 'it'));
          const anomalyStats = anomalyData.reduce((acc, anomaly) => {
            const meta = getAnomalyMeta(anomaly);
            acc.total += 1;
            acc[meta.severity] += 1;
            if (meta.actionable) acc.actionable += 1;
            return acc;
          }, { total: 0, critical: 0, warning: 0, info: 0, actionable: 0 });
          const filteredAnomalies = anomalyData.filter(anomaly => {
            const meta = getAnomalyMeta(anomaly);
            const text = [
              anomaly.source,
              meta.sourceLabel,
              anomaly.record_key,
              anomaly.product_name,
              anomaly.order_id,
              anomaly.current_state_label,
              anomaly.anomaly_type,
              meta.typeLabel,
              anomaly.message
            ].join(' ').toLowerCase();
            return (
              (!anomalySearch.trim() || text.includes(anomalySearch.trim().toLowerCase())) &&
              (anomalySourceFilter === 'all' || anomaly.source === anomalySourceFilter) &&
              (anomalyTypeFilter === 'all' || anomaly.anomaly_type === anomalyTypeFilter) &&
              (anomalyOrderStateFilter === 'all' || String(anomaly.current_state) === anomalyOrderStateFilter) &&
              (!anomalyOnlyActionable || meta.actionable)
            );
          });
          const totalAnomaliesPages = Math.ceil(filteredAnomalies.length / anomaliesLimit) || 1;
          const paginatedAnomalies = filteredAnomalies.slice(
            (anomaliesPage - 1) * anomaliesLimit,
            anomaliesPage * anomaliesLimit
          );
          const handleAnomalyAction = (anomaly, meta) => {
            if (anomaly.anomaly_type.includes('missing_association') && anomaly.record_key) {
              handleResolveMissingAssociation(anomaly.record_key);
              return;
            }
            if (anomaly.anomaly_type.includes('sync_error')) {
              setSettingsSection('connection');
              setActiveTab('settings');
              return;
            }
            if (anomaly.source === 'associations_import') {
              setActiveTab('associations');
              return;
            }
            if (anomaly.anomaly_type.includes('calculation_error')) {
              handleRunCalculation();
              return;
            }
            if (meta.actionable) {
              setActiveTab('stock');
            }
          };
          return (
            <div className="glass-panel widget-card anomalies-workbench">
              <div className="anomalies-header">
                <div>
                  <h2>Registro Anomalie</h2>
                  <p>Controlla problemi rilevati da import, sincronizzazione e calcolo disponibilita.</p>
                </div>
                {anomalyData.length > 0 && (
                  <div className="anomalies-header-actions">
                    <button className="btn btn-secondary" onClick={() => handleExportAnomaliesCsv(filteredAnomalies)} disabled={filteredAnomalies.length === 0}>
                      Esporta CSV
                    </button>
                    <button className="btn btn-danger" onClick={handleClearAnomalies}>
                      Svuota registro
                    </button>
                  </div>
                )}
              </div>

              <div className="anomaly-summary-grid">
                <div className="anomaly-summary-card danger">
                  <span>Critiche</span>
                  <strong>{anomalyStats.critical}</strong>
                </div>
                <div className="anomaly-summary-card warning">
                  <span>Da verificare</span>
                  <strong>{anomalyStats.warning}</strong>
                </div>
                <div className="anomaly-summary-card neutral">
                  <span>Info</span>
                  <strong>{anomalyStats.info}</strong>
                </div>
                <div className="anomaly-summary-card primary">
                  <span>Con azione</span>
                  <strong>{anomalyStats.actionable}</strong>
                </div>
              </div>

              {anomalyData.length > 0 && (
                <div className="anomaly-filter-panel">
                  <div className="search-wrapper anomaly-search">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Cerca ID, nome prodotto, SKU, problema o dettaglio..."
                      value={anomalySearch}
                      onChange={(e) => setAnomalySearch(e.target.value)}
                    />
                  </div>
                  <select className="select-control" value={anomalySourceFilter} onChange={(e) => setAnomalySourceFilter(e.target.value)}>
                    <option value="all">Tutte le origini</option>
                    {anomalySources.map(source => (
                      <option key={source} value={source}>{getAnomalySourceLabel(source)}</option>
                    ))}
                  </select>
                  <select className="select-control" value={anomalyTypeFilter} onChange={(e) => setAnomalyTypeFilter(e.target.value)}>
                    <option value="all">Tutti i problemi</option>
                    {anomalyTypes.map(type => (
                      <option key={type} value={type}>{getAnomalyTypeLabel(type)}</option>
                    ))}
                  </select>
                  <select
                    className="select-control"
                    aria-label="Filtra anomalie per stato ordine attuale PrestaShop"
                    value={anomalyOrderStateFilter}
                    onChange={(e) => setAnomalyOrderStateFilter(e.target.value)}
                  >
                    <option value="all">Tutti gli stati ordine</option>
                    {anomalyOrderStates.map(state => (
                      <option key={state.id} value={state.id}>{state.label} ({state.count})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`btn-small-link anomaly-toggle ${anomalyOnlyActionable ? 'active' : ''}`}
                    onClick={() => setAnomalyOnlyActionable(!anomalyOnlyActionable)}
                  >
                    {anomalyOnlyActionable ? 'Mostra tutte' : 'Solo risolvibili'}
                  </button>
                </div>
              )}

              <div className="table-container">
                {tabLoading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : anomalyData.length > 0 ? (
                  <>
                    <div className="anomaly-results-line">
                      {filteredAnomalies.length} di {anomalyData.length} anomalie visualizzate
                    </div>
                    {filteredAnomalies.length > 0 ? (
                    <>
                    <table className="custom-table anomaly-table">
                      <thead>
                        <tr>
                          <th>Problema</th>
                          <th>Oggetto</th>
                          <th>Stato ordine</th>
                          <th>Origine</th>
                          <th>Impatto</th>
                          <th>Dettaglio</th>
                          <th>Rilevata il</th>
                          <th style={{ textAlign: 'center', width: '140px' }}>Prossima azione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAnomalies.map(an => {
                          const meta = getAnomalyMeta(an);
                          return (
                          <tr key={an.id} className={`anomaly-row ${meta.severity}`}>
                            <td>
                              <span className={`anomaly-problem ${meta.severity}`}>
                                {meta.typeLabel}
                              </span>
                            </td>
                            <td>
                              <div className="anomaly-object-cell">
                                <span className="anomaly-record-key">{an.record_key || "Nessuna chiave"}</span>
                                {an.product_name && <span className="anomaly-product-name">{an.product_name}</span>}
                              </div>
                            </td>
                            <td>
                              {an.current_state_label ? (
                                <div className="anomaly-order-state-cell">
                                  <span className={`badge ${getOrderStateBadgeClass(an.current_state_label)}`}>
                                    {an.current_state_label}
                                  </span>
                                  {an.order_id && <small>Ordine {an.order_id}</small>}
                                </div>
                              ) : (
                                <span className="anomaly-no-order">Non collegata</span>
                              )}
                            </td>
                            <td>
                              <span className="badge badge-neutral">
                                {meta.sourceLabel}
                              </span>
                            </td>
                            <td>
                              <span className={`anomaly-severity ${meta.severity}`}>
                                {meta.severityLabel}
                              </span>
                            </td>
                            <td className="anomaly-message">{an.message}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(an.created_at)}</td>
                            <td style={{ textAlign: 'center' }}>
                              {meta.actionable ? (
                                <button 
                                  className="btn btn-neutral btn-sm" 
                                  onClick={() => handleAnomalyAction(an, meta)}
                                  title={meta.actionLabel}
                                >
                                  {meta.actionLabel}
                                </button>
                              ) : "-"}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <Pagination 
                      currentPage={anomaliesPage}
                      totalPages={totalAnomaliesPages}
                      onPageChange={setAnomaliesPage}
                      disabled={tabLoading}
                    />
                    </>
                    ) : (
                      <div className="anomaly-empty-state compact">
                        <p>Nessuna anomalia corrisponde ai filtri</p>
                        <span>Allarga la ricerca o disattiva il filtro “Solo risolvibili”.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="anomaly-empty-state">
                    <svg className="w-12 h-12 mx-auto mb-4 text-emerald-500" style={{ color: 'var(--color-success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>Nessuna anomalia nel registro corrente</p>
                    <span>Import e sincronizzazioni recenti non hanno prodotto avvisi.</span>
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
                  <TableSkeleton rows={8} cols={5} />
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
                          <th style={{ textAlign: 'center', width: '100px' }}>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map(assoc => (
                          <tr key={assoc.product_id} style={assoc.qty_available === 0 ? { backgroundColor: 'rgba(239, 68, 68, 0.02)' } : {}}>
                            <td style={{ fontWeight: '700' }}>{highlightText(assoc.product_id, searchProduct)}</td>
                            <td style={{ maxWidth: '380px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {assoc.components_str.split(',').map((compStr, idx) => {
                                  const trimmed = compStr.trim();
                                  return (
                                    <span 
                                      key={idx} 
                                      className="badge badge-neutral" 
                                      style={{ 
                                        fontSize: '0.72rem', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)',
                                        display: 'inline-block',
                                        fontFamily: 'monospace'
                                      }}
                                    >
                                      {highlightText(trimmed, searchProduct)}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.05rem', color: assoc.qty_available === 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                              {assoc.qty_available}
                            </td>
                            <td>
                              {assoc.limiting_sku ? (
                                <span className={`badge ${assoc.qty_available === 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontFamily: 'monospace' }}>
                                  {highlightText(assoc.limiting_sku, searchProduct)}
                                </span>
                              ) : (
                                <span className="badge badge-neutral">-</span>
                              )}
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

                    <Pagination 
                      currentPage={productsPage}
                      totalPages={totalProductsPages}
                      onPageChange={setProductsPage}
                      disabled={tabLoading}
                    />
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
          <div className="picking-page">
            <div className="glass-panel widget-card picking-input-panel">
              <div className="picking-section-head">
                <div>
                  <span className="widget-title">Pianificazione Prelievo</span>
                  <p>Inserisci ordini da testo oppure importa uno o più Excel di prelievo.</p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="picking-mode-switch" role="tablist" aria-label="Modalità inserimento lista prelievo">
                <button
                  type="button"
                  className={`picking-mode-btn ${pickingInputMode === 'text' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={pickingInputMode === 'text'}
                  onClick={() => {
                    setPickingInputMode('text');
                    setPickingError(null);
                  }}
                >
                  Incolla ID
                </button>
                <button
                  type="button"
                  className={`picking-mode-btn ${pickingInputMode === 'file' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={pickingInputMode === 'file'}
                  onClick={() => {
                    setPickingInputMode('file');
                    setPickingError(null);
                  }}
                >
                  Carica Excel
                </button>
                <button
                  type="button"
                  className={`picking-mode-btn ${pickingInputMode === 'automatic' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={pickingInputMode === 'automatic'}
                  onClick={() => {
                    setPickingInputMode('automatic');
                    setPickingError(null);
                  }}
                >
                  Automatica
                </button>
              </div>
              
              {pickingInputMode === 'text' ? (
                <form onSubmit={handleCalculatePicking} className="picking-workflow-form">
                  <div className="form-group">
                    <textarea
                      className="settings-input picking-textarea"
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
                    <div className="picking-alert picking-alert-danger">
                      <strong>Input non valido.</strong>
                      <span>{pickingError}</span>
                    </div>
                  )}
                  
                  <div className="picking-form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={pickingLoading}
                    >
                      {pickingLoading ? (
                        <>
                          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>
                          Elaborazione in corso...
                        </>
                      ) : (
                        "Calcola Fabbisogno"
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
              ) : pickingInputMode === 'file' ? (
                <div className="picking-workflow-form">
                  <div 
                    className={`picking-upload-target ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
                        if (files.length > 0) {
                          setSelectedPickingFiles(prev => [...prev, ...files]);
                        }
                      }
                    }}
                    onClick={() => document.getElementById('picking-file-input').click()}
                  >
                    <svg width="24" height="24" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span>Trascina o clicca per caricare Excel</span>
                      <small>File .xlsx o .xls, anche multipli</small>
                    </div>
                    <input 
                      id="picking-file-input"
                      type="file" 
                      accept=".xlsx,.xls" 
                      multiple 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedPickingFiles(prev => [...prev, ...Array.from(e.target.files)]);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Selected files list */}
                  {selectedPickingFiles.length > 0 && (
                    <div className="picking-file-list">
                      <span className="picking-list-label">
                        File Selezionati ({selectedPickingFiles.length})
                      </span>
                      <div className="picking-file-stack">
                        {selectedPickingFiles.map((file, idx) => (
                          <div 
                            key={idx} 
                            className="picking-file-row"
                          >
                            <div className="picking-file-name">
                              <svg style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>{file.name}</span>
                              <small>
                                ({(file.size / 1024).toFixed(1)} KB)
                              </small>
                            </div>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPickingFiles(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="btn btn-neutral"
                              style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.15)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                            >
                              Rimuovi
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pickingError && (
                    <div className="picking-alert picking-alert-danger">
                      <strong>File non elaborato.</strong>
                      <span>{pickingError}</span>
                    </div>
                  )}

                  <div className="picking-form-actions">
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      disabled={pickingLoading || selectedPickingFiles.length === 0}
                      onClick={handleUploadPickingFiles}
                    >
                      {pickingLoading ? (
                        <>
                          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>
                          Elaborazione in corso...
                        </>
                      ) : (
                        "Calcola Fabbisogno da File"
                      )}
                    </button>
                    
                    {(pickingResults || selectedPickingFiles.length > 0) && (
                      <button 
                        type="button" 
                        className="btn btn-neutral" 
                        onClick={() => {
                          setSelectedPickingFiles([]);
                          setPickingResults(null);
                          setPickingError(null);
                          setPickingFilesAnomalies([]);
                          setPickingFilesSummary([]);
                        }}
                      >
                        Nuovo Calcolo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerateAutomaticPicking} className="picking-workflow-form">
                  <div className="picking-auto-grid">
                    <div className="form-group">
                      <label className="picking-field-label" htmlFor="auto-picking-limit">
                        Numero ordini da proporre
                      </label>
                      <input
                        id="auto-picking-limit"
                        className="settings-input"
                        type="number"
                        min="1"
                        max="500"
                        step="1"
                        value={autoPickingLimit}
                        onChange={(e) => setAutoPickingLimit(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <span className="picking-field-label">Strategia selezione</span>
                      <div className="picking-choice-group" role="group" aria-label="Strategia lista automatica">
                        <button
                          type="button"
                          className={autoPickingStrategy === 'chronological' ? 'active' : ''}
                          onClick={() => setAutoPickingStrategy('chronological')}
                        >
                          Cronologico
                        </button>
                        <button
                          type="button"
                          className={autoPickingStrategy === 'maximize_orders' ? 'active' : ''}
                          onClick={() => setAutoPickingStrategy('maximize_orders')}
                        >
                          Massimizza ordini
                        </button>
                      </div>
                    </div>

                    {autoPickingStrategy === 'chronological' && (
                      <div className="form-group">
                        <span className="picking-field-label">Criterio cronologico</span>
                        <div className="picking-choice-group" role="group" aria-label="Criterio cronologico lista automatica">
                          <button
                            type="button"
                            className={!autoPickingStrict ? 'active' : ''}
                            onClick={() => setAutoPickingStrict(false)}
                          >
                            Salta non preparabili
                          </button>
                          <button
                            type="button"
                            className={autoPickingStrict ? 'active' : ''}
                            onClick={() => setAutoPickingStrict(true)}
                          >
                            Coda rigida
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="picking-field-label" htmlFor="auto-picking-min-residual">
                        Scorta minima per SKU
                      </label>
                      <input
                        id="auto-picking-min-residual"
                        className="settings-input"
                        type="number"
                        min="0"
                        step="1"
                        value={autoPickingMinResidual}
                        onChange={(e) => setAutoPickingMinResidual(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="picking-auto-sku-filter">
                    <label className="picking-field-label" htmlFor="auto-picking-sku-filter">
                      Filtra per SKU
                    </label>
                    <div className="picking-sku-picker-row">
                      <input
                        id="auto-picking-sku-filter"
                        className="settings-input"
                        type="text"
                        list="auto-picking-sku-options"
                        placeholder="Cerca o inserisci SKU componente"
                        value={autoPickingSkuQuery}
                        onChange={(e) => setAutoPickingSkuQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAutoPickingSkuFilter(autoPickingSkuQuery);
                          }
                        }}
                      />
                      <datalist id="auto-picking-sku-options">
                        {autoPickingSkuSuggestions.map(sku => (
                          <option key={sku} value={sku} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        className="btn btn-neutral"
                        onClick={() => addAutoPickingSkuFilter(autoPickingSkuQuery)}
                        disabled={!autoPickingSkuQuery.trim()}
                      >
                        Aggiungi
                      </button>
                    </div>
                    {autoPickingSkuFilter.length > 0 && (
                      <div className="picking-sku-filter-chips" aria-label="SKU filtrati">
                        {autoPickingSkuFilter.map(sku => (
                          <button
                            key={sku}
                            type="button"
                            className="picking-sku-filter-chip"
                            onClick={() => removeAutoPickingSkuFilter(sku)}
                            title="Rimuovi filtro SKU"
                          >
                            <span>{sku}</span>
                            <strong aria-hidden="true">x</strong>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="picking-sku-filter-clear"
                          onClick={() => setAutoPickingSkuFilter([])}
                        >
                          Pulisci filtro
                        </button>
                      </div>
                    )}
                  </div>

                  {pickingError && (
                    <div className="picking-alert picking-alert-danger">
                      <strong>Lista non generata.</strong>
                      <span>{pickingError}</span>
                    </div>
                  )}

                  <div className="picking-form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={pickingLoading}
                    >
                      {pickingLoading ? (
                        <>
                          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>
                          Generazione in corso...
                        </>
                      ) : (
                        "Genera lista automatica"
                      )}
                    </button>

                    {pickingResults && pickingResults.mode === 'automatic' && (
                      <button 
                        type="button" 
                        className="btn btn-neutral" 
                        onClick={() => {
                          setPickingResults(null);
                          setPickingError(null);
                        }}
                      >
                        Nuovo Calcolo
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {pickingLoading && !pickingResults && (
              <div className="glass-panel widget-card picking-loading-panel" aria-live="polite">
                <div className="picking-loading-header">
                  <span className="widget-title" style={{ margin: 0 }}>Analisi del fabbisogno in corso</span>
                  <span className="badge badge-neutral">Caricamento</span>
                </div>
                <TableSkeleton rows={6} cols={5} />
              </div>
            )}

            {/* Results sections */}
            {pickingResults && (
              <div className="glass-panel widget-card picking-results-panel">
                {pickingLoading && (
                  <div className="info-box info-box-primary" aria-live="polite">
                    Aggiornamento dell'analisi in corso. I risultati precedenti restano visibili.
                  </div>
                )}
                <div className="picking-results-header">
                  <div className="picking-title-row">
                    <span className="widget-title">Analisi del Fabbisogno di Prelievo</span>
                    <div className="picking-view-toggle" role="tablist" aria-label="Vista risultati prelievo">
                      <button 
                        type="button"
                        className={pickingViewMode === 'aggregated' ? 'active' : ''}
                        role="tab"
                        aria-selected={pickingViewMode === 'aggregated'}
                        onClick={() => setPickingViewMode('aggregated')}
                      >
                        Vista Aggregata
                      </button>
                      <button 
                        type="button"
                        className={pickingViewMode === 'by_order' ? 'active' : ''}
                        role="tab"
                        aria-selected={pickingViewMode === 'by_order'}
                        onClick={() => setPickingViewMode('by_order')}
                      >
                        Vista per Ordini
                      </button>
                    </div>
                  </div>
                  <div className="picking-toolbar">
                    {pickingViewMode === 'aggregated' && (
                      <>
                        <button
                          type="button"
                          className={`btn ${pickingCountingMode ? 'btn-success' : 'btn-neutral'}`}
                          onClick={togglePickingCountingMode}
                        >
                          {pickingCountingMode ? 'Conteggio attivo' : 'Conteggio'}
                        </button>
                        {countedPickingSkus.size > 0 && (
                          <button
                            type="button"
                            className="btn btn-neutral"
                            onClick={clearCountedPickingSkus}
                          >
                            Azzera contati ({countedPickingSkus.size})
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      className={`btn ${pickingCopyState === 'copied' ? 'btn-success' : 'btn-secondary'}`}
                      onClick={handleCopyPickingList}
                    >
                      {pickingCopyState === 'copied' ? 'Copiato!' : 'Copia Lista Prelievo (Testo)'}
                    </button>
                  </div>
                </div>

                {/* Warnings / File Anomalies specific block */}
                {pickingInputMode === 'file' && pickingFilesAnomalies.length > 0 && (
                  <div className="picking-anomaly-panel">
                    <span>
                      Avvisi ed Anomalie File ({pickingFilesAnomalies.length})
                    </span>
                    <div className="picking-anomaly-list">
                      {pickingFilesAnomalies.map((anom, idx) => (
                        <div 
                          key={idx} 
                        >
                          <strong>{anom.record_key}:</strong> {anom.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`picking-context-grid ${pickingResults.mode === 'automatic' ? 'auto' : ''}`}>
                  {pickingResults.mode === 'automatic' ? (
                    <>
                      <div className="picking-context-card success">
                        <div>Ordini proposti</div>
                        <strong>{pickingResults.auto_picking?.selected_count || 0} ordini</strong>
                        <p>
                          {pickingResults.orders_found.length > 0 ? pickingResults.orders_found.join(', ') : 'Nessun ordine preparabile'}
                        </p>
                      </div>
                      <div className={`picking-context-card ${(pickingResults.auto_picking?.skipped_count || 0) > 0 ? 'danger' : 'success'}`}>
                        <div>Ordini saltati</div>
                        <strong>{pickingResults.auto_picking?.skipped_count || 0} ordini</strong>
                        <p>{pickingResults.auto_picking?.evaluated_count || 0} ordini valutati su {pickingResults.auto_picking?.candidate_count || 0}</p>
                      </div>
                      <div className="picking-context-card file">
                        <div>Criterio</div>
                        <strong>
                          {pickingResults.auto_picking?.selection_strategy === 'maximize_orders'
                            ? 'Massimizza ordini'
                            : (pickingResults.auto_picking?.strict_chronology ? 'Coda rigida' : 'Salto intelligente')}
                        </strong>
                        <p>
                          Richiesta: {pickingResults.auto_picking?.requested_limit || 0} ordini
                          {Number(pickingResults.auto_picking?.min_sku_residual || 0) > 0
                            ? ` | Scorta min: ${pickingResults.auto_picking.min_sku_residual}`
                            : ''}
                          {pickingResults.auto_picking?.sku_filter?.length > 0
                            ? ` | SKU: ${pickingResults.auto_picking.sku_filter.join(', ')}`
                            : ''}
                        </p>
                      </div>
                    </>
                  ) : pickingInputMode === 'text' ? (
                    <>
                      <div className="picking-context-card success">
                        <div>Riferimenti ordini rilevati</div>
                        <strong>{pickingResults.orders_found.length} ordini</strong>
                        <p>{pickingResults.orders_found.length > 0 ? pickingResults.orders_found.join(', ') : 'Nessuno'}</p>
                      </div>
                      <div className={`picking-context-card ${pickingResults.orders_missing.length > 0 ? 'danger' : ''}`}>
                        <div>Ordini non trovati</div>
                        <strong>{pickingResults.orders_missing.length} ordini</strong>
                        {pickingResults.orders_missing.length > 0 ? (
                          <>
                            <p>{pickingResults.orders_missing.join(', ')}</p>
                            <div className="picking-context-action">
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={syncingSpecificOrders}
                                onClick={handleSyncSpecificOrders}
                              >
                                {syncingSpecificOrders ? 'Sincronizzazione...' : 'Recupera e ricalcola'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <p>Tutti gli ordini sono presenti nel database locale.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="picking-context-card success">
                        <div>Riferimenti ordini rilevati</div>
                        <strong>{pickingResults.orders_found.length} ordini</strong>
                        <p>{pickingResults.orders_found.length > 0 ? pickingResults.orders_found.join(', ') : 'Nessuno'}</p>
                      </div>
                      <div className="picking-context-card file">
                        <div>File Excel inclusi</div>
                        <strong>{pickingFilesSummary.length} file</strong>
                        <div className="picking-file-summary">
                          {pickingFilesSummary.map((f, i) => (
                            <div key={i}>
                              <span title={f.filename}>{f.filename}</span>
                              <strong>{f.rows_count} righe</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {pickingResults.mode === 'automatic' && pickingViewMode === 'aggregated' && pickingResults.skipped_orders?.length > 0 && (
                  <div className="picking-skipped-panel">
                    <div className="picking-skipped-head">
                      <span>Ordini saltati</span>
                      <strong>{pickingResults.skipped_orders.length}</strong>
                    </div>
                    <div className="picking-skipped-list">
                      {pickingResults.skipped_orders.slice(0, 12).map(order => (
                        <div key={order.order_id} className="picking-skipped-row">
                          <div>
                            <button
                              type="button"
                              className="picking-skipped-order-id-btn"
                              onClick={() => handleCopyOrderId(order.order_id)}
                              title="Clicca per copiare l'ID ordine"
                            >
                              Ordine {order.order_id}
                            </button>
                            {copiedOrderId === order.order_id && (
                              <span className="picking-order-copied">Copiato</span>
                            )}
                            <span>{order.customer_name}</span>
                            {order.date_add && (
                              <span className="picking-skipped-date">
                                {new Date(order.date_add).toLocaleString('it-IT')} · {getRelativeTimeString(order.date_add)}
                              </span>
                            )}
                            {order.current_state_label && (
                              <span className={getStateBadgeClass(order.current_state_label)}>
                                {order.current_state_label}
                              </span>
                            )}
                          </div>
                          <div className="picking-skip-reason">
                            <span className="picking-skip-reason-label">
                              {order.reason || 'Non preparabile'}
                            </span>
                            {order.missing_items?.length > 0 ? (
                              <div className="picking-skip-missing-list">
                                {order.missing_items.map(item => (
                                  <span key={item.sku} className="picking-skip-missing-chip">
                                    <strong>{item.sku}</strong>
                                    <span>
                                      {item.violation_type === 'protected_residual'
                                        ? `dopo ${item.qty_available_after} < min ${item.min_residual}`
                                        : `manca ${item.qty_missing}`}
                                    </span>
                                    <small>
                                      richiesti {item.qty_required} / disp. {item.qty_available}
                                    </small>
                                  </span>
                                ))}
                              </div>
                            ) : order.missing_references?.length > 0 ? (
                              <div className="picking-skip-missing-list">
                                {order.missing_references.map(item => (
                                  <span key={`${item.product_id}-${item.qty_ordered}`} className="picking-skip-missing-chip">
                                    <strong>ID {item.product_id}</strong>
                                    <span>ref mancante</span>
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements Rendering based on view mode */}
                {pickingViewMode === 'aggregated' ? (
                  <>
                    <div className="picking-table-controls">
                      <span className="picking-filter-label">Mostra:</span>
                      <div className="picking-filter-group" aria-label="Filtro SKU prelievo">
                        <button
                          type="button"
                          className={pickingRequirementFilter === 'missing' ? 'active' : ''}
                          onClick={() => setPickingRequirementFilter('missing')}
                        >
                          Solo mancanti
                        </button>
                        <button
                          type="button"
                          className={pickingRequirementFilter === 'all' ? 'active' : ''}
                          onClick={() => setPickingRequirementFilter('all')}
                        >
                          Tutti
                        </button>
                        <button
                          type="button"
                          className={pickingRequirementFilter === 'available' ? 'active' : ''}
                          onClick={() => setPickingRequirementFilter('available')}
                        >
                          Disponibili
                        </button>
                      </div>
                      <span className="picking-visible-count">{visiblePickingRequirements.length} righe visibili</span>
                      {pickingCountingMode && (
                        <span className="picking-counted-summary">
                          {countedPickingCount}/{pickingRequirements.length} contate
                        </span>
                      )}
                    </div>

                    <div className="table-container">
                    {visiblePickingRequirements.length > 0 ? (
                      <table className="custom-table picking-table">
                        <thead>
                          <tr>
                            <th>SKU Componente</th>
                            <th>Descrizione Magazzino</th>
                            <th className="num-col">Quantità Richiesta</th>
                            <th className="num-col">Disponibile Magazzino</th>
                            <th className="status-col">Stato Prelievo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePickingRequirements.map(req => {
                            const meta = getRequirementMeta(req);
                            const isCounted = countedPickingSkus.has(req.sku);
                            
                            return (
                              <tr
                                key={req.sku}
                                className={`${meta.rowClass} ${isCounted ? 'picking-row-counted' : ''} ${pickingCountingMode ? 'picking-row-countable' : ''}`}
                                onClick={() => togglePickingSkuCounted(req.sku)}
                                title={pickingCountingMode ? (isCounted ? 'Clicca per segnare come non contata' : 'Clicca per segnare come contata') : undefined}
                              >
                                <td style={{ fontWeight: '700' }}>{req.sku}</td>
                                <td className="picking-description-cell">
                                  {req.description}
                                </td>
                                <td className="num-col strong-num">{req.qty_required}</td>
                                <td className="num-col muted-num">{req.qty_stock}</td>
                                <td className="status-col">
                                  <span className={`picking-status-chip ${isCounted ? 'counted' : meta.tone}`}>
                                    {isCounted ? 'Contata' : meta.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                        Nessuna riga corrisponde al filtro selezionato.
                      </p>
                    )}
                    </div>
                  </>
                ) : (
                  /* Detailed View by Order */
                  <div className={pickingResults.mode === 'automatic' ? 'picking-automatic-split' : ''}>
                    {pickingResults.mode === 'automatic' && (
                      <div className="picking-auto-result-switch" role="tablist" aria-label="Risultati lista prelievo automatica">
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
                      </div>
                    )}

                    {(pickingResults.mode !== 'automatic' || autoPickingResultView === 'selected') && (
                      <>
                      {pickingResults.mode === 'automatic' && (
                        <div className="picking-split-head success">
                          <div>
                            <span>Ordini proposti</span>
                            <strong>{sortedPickingOrders.length} preparabili</strong>
                          </div>
                          <span>Disponibili con la giacenza attuale</span>
                        </div>
                      )}

                    <div className="picking-order-list">
                      {sortedPickingOrders.length > 0 ? (
                        sortedPickingOrders.map(ord => {
                          const orderMeta = getOrderPickingMeta(ord);
                          
                          return (
                            <div 
                              key={ord.order_id} 
                              className={`picking-order-block ${orderMeta.tone}`}
                            >
                            <div className="picking-order-head">
                              <div className="picking-order-identity">
                                <div className="picking-order-mainline">
                                  <button
                                    type="button"
                                    className="picking-order-id-btn"
                                    onClick={() => handleCopyOrderId(ord.order_id)}
                                    title="Clicca per copiare l'ID ordine"
                                  >
                                    Ordine {ord.order_id}
                                  </button>
                                  {copiedOrderId === ord.order_id && (
                                    <span className="picking-order-copied">Copiato</span>
                                  )}
                                  <span>{ord.customer_name}</span>
                                </div>
                                {(ord.date_add || ord.current_state_label) && (
                                  <div className="picking-order-meta-row">
                                    {ord.date_add && (
                                      <>
                                        <span className="picking-order-date">
                                          {new Date(ord.date_add).toLocaleString('it-IT')}
                                        </span>
                                        <span className="picking-order-age">
                                          {getRelativeTimeString(ord.date_add)}
                                        </span>
                                      </>
                                    )}
                                    {ord.current_state_label && (
                                      <span className={getStateBadgeClass(ord.current_state_label)}>
                                        {ord.current_state_label}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className={`picking-status-chip ${orderMeta.tone}`}>
                                {orderMeta.label}
                              </span>
                            </div>
                            
                            <div className="table-container" style={{ margin: 0, border: 'none' }}>
                              <table className="custom-table picking-table picking-order-table">
                                <thead>
                                  <tr>
                                    <th>SKU Componente</th>
                                    <th>Descrizione Magazzino</th>
                                    <th className="num-col">Quantità Richiesta</th>
                                    <th className="num-col">Disponibile Magazzino</th>
                                    <th className="status-col">Stato Prelievo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ord.items.map(item => {
                                    const itemMeta = item.status === 'disponibile'
                                      ? { tone: 'success', label: `OK ${item.avail_after}` }
                                      : item.status === 'parziale'
                                        ? { tone: 'warning', label: `${item.qty_fulfilled}/${item.qty_required}` }
                                        : { tone: 'danger', label: `-${item.qty_required}` };
                                    
                                    return (
                                      <tr key={item.sku} className={item.status === 'mancante' ? 'picking-row-critical' : item.status === 'parziale' ? 'picking-row-warning' : ''}>
                                        <td style={{ fontWeight: '600' }}>{item.sku}</td>
                                        <td className="picking-description-cell">
                                          {item.description}
                                        </td>
                                        <td className="num-col strong-num">{item.qty_required}</td>
                                        <td className="num-col muted-num">{item.qty_stock}</td>
                                        <td className="status-col">
                                          <span className={`picking-status-chip ${itemMeta.tone}`}>
                                            {itemMeta.label}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          );
                        })
                      ) : (
                        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          Nessun dettaglio per ordine disponibile.
                        </p>
                      )}
                    </div>
                      </>
                    )}

                    {pickingResults.mode === 'automatic' && autoPickingResultView === 'skipped' && (
                      <div className="picking-skipped-section">
                        <div className="picking-split-head danger">
                          <div>
                            <span>Ordini saltati</span>
                            <strong>{pickingResults.skipped_orders?.length || 0} non preparabili</strong>
                          </div>
                          <span>Dettaglio motivo esclusione</span>
                        </div>

                        {pickingResults.skipped_orders?.length > 0 ? (
                          <div className="picking-skipped-panel full">
                            <div className="picking-skipped-list full">
                              {pickingResults.skipped_orders.map(order => (
                                <div key={order.order_id} className="picking-skipped-row full">
                                  <div>
                                    <button
                                      type="button"
                                      className="picking-skipped-order-id-btn"
                                      onClick={() => handleCopyOrderId(order.order_id)}
                                      title="Clicca per copiare l'ID ordine"
                                    >
                                      Ordine {order.order_id}
                                    </button>
                                    {copiedOrderId === order.order_id && (
                                      <span className="picking-order-copied">Copiato</span>
                                    )}
                                    <span>{order.customer_name}</span>
                                    {order.date_add && (
                                      <span className="picking-skipped-date">
                                        {new Date(order.date_add).toLocaleString('it-IT')} · {getRelativeTimeString(order.date_add)}
                                      </span>
                                    )}
                                    {order.current_state_label && (
                                      <span className={getStateBadgeClass(order.current_state_label)}>
                                        {order.current_state_label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="picking-skip-reason">
                                    <span className="picking-skip-reason-label">
                                      {order.reason || 'Non preparabile'}
                                    </span>
                                    {order.missing_items?.length > 0 ? (
                                      <div className="picking-skip-missing-list">
                                        {order.missing_items.map(item => (
                                          <span key={item.sku} className="picking-skip-missing-chip">
                                            <strong>{item.sku}</strong>
                                            <span>
                                              {item.violation_type === 'protected_residual'
                                                ? `dopo ${item.qty_available_after} < min ${item.min_residual}`
                                                : `manca ${item.qty_missing}`}
                                            </span>
                                            <small>
                                              richiesti {item.qty_required} / disp. {item.qty_available}
                                            </small>
                                          </span>
                                        ))}
                                      </div>
                                    ) : order.missing_references?.length > 0 ? (
                                      <div className="picking-skip-missing-list">
                                        {order.missing_references.map(item => (
                                          <span key={`${item.product_id}-${item.qty_ordered}`} className="picking-skip-missing-chip">
                                            <strong>ID {item.product_id}</strong>
                                            <span>ref mancante</span>
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="picking-skipped-empty">
                            Nessun ordine saltato: tutti gli ordini valutati sono preparabili.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="settings-page">
            <div className="settings-summary-grid">
              <div className={`settings-summary-item ${prestashopStatusTone}`}>
                <span className="settings-summary-label">PrestaShop</span>
                <strong><span className="settings-status-dot" />{prestashopStatusLabel}</strong>
              </div>
              <div className={`settings-summary-item ${stockSource === 'google_sheets' ? 'success' : 'neutral'}`}>
                <span className="settings-summary-label">Giacenze</span>
                <strong><span className="settings-status-dot" />{stockSource === 'google_sheets' ? 'Google Sheets' : 'Excel manuale'}</strong>
              </div>
              <div className={`settings-summary-item ${status?.last_orders_sync ? 'success' : 'neutral'}`}>
                <span className="settings-summary-label">Ultima sync ordini</span>
                <strong><span className="settings-status-dot" />{status?.last_orders_sync ? getRelativeTimeString(status.last_orders_sync) : 'Mai'}</strong>
              </div>
              <div className={`settings-summary-item ${orderStatesDirty ? 'warning' : 'success'}`}>
                <span className="settings-summary-label">Stati impegnato</span>
                <strong><span className="settings-status-dot" />{selectedStates.length} selezionati{orderStatesDirty ? ' - non salvati' : ''}</strong>
              </div>
            </div>

            <div className="settings-section-tabs" role="tablist" aria-label="Sezioni impostazioni">
              {settingsSections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  className={`settings-section-tab ${settingsSection === section.id ? 'active' : ''}`}
                  onClick={() => setSettingsSection(section.id)}
                  role="tab"
                  aria-selected={settingsSection === section.id}
                >
                  <span>{section.label}</span>
                </button>
              ))}
            </div>

            {settingsError && (
              <div className="settings-alert settings-alert-danger">
                {settingsError}
              </div>
            )}

            {/* Card 1: Configurazione Connessione PrestaShop */}
            {settingsSection === 'connection' && (
            <div className="glass-panel widget-card settings-workbench">
              <div className="settings-card-header">
                <div>
                  <h2>Configurazione Connessione PrestaShop</h2>
                  <p>
                    Imposta endpoint Webservice, chiave API e frequenza di aggiornamento ordini.
                  </p>
                </div>
                <span className={`settings-status-pill ${prestashopStatusTone}`}>
                  <span className="settings-status-dot" />
                  {prestashopStatusLabel}
                </span>
              </div>

              <form onSubmit={handleSaveConnectionSettings} className="settings-connection-form">
                <div className="settings-form-stack">
                  <div className="form-group">
                    <label className="settings-label">
                      URL API PrestaShop
                    </label>
                    <input 
                      type="text" 
                      className="settings-input" 
                      placeholder="https://mio-sito.it/api/" 
                      value={prestashopUrl} 
                      onChange={(e) => setPrestashopUrl(e.target.value)}
                      disabled={prestashopMockMode}
                    />
                    <small className="settings-help">
                      Formato richiesto: <code>https://www.tuonegozio.it/api/</code>
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="settings-label">
                      Chiave API Webservice
                    </label>
                    <div className="settings-secret-field">
                      <input 
                        type={showApiKey ? "text" : "password"} 
                        className="settings-input" 
                        placeholder="Inserisci la chiave API del webservice" 
                        value={prestashopApiKey} 
                        onChange={(e) => setPrestashopApiKey(e.target.value)}
                        disabled={prestashopMockMode}
                      />
                      <button 
                        type="button" 
                        className="settings-secret-toggle"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={prestashopMockMode}
                        title={showApiKey ? "Nascondi chiave" : "Mostra chiave"}
                        aria-label={showApiKey ? "Nascondi chiave API" : "Mostra chiave API"}
                      >
                        <Icons.Eye />
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="settings-label">
                      Intervallo Sincronizzazione Ordini
                    </label>
                    <div className="settings-inline-input">
                      <input 
                        type="number" 
                        min="1" 
                        className="settings-input" 
                        placeholder="10" 
                        value={prestashopSyncInterval} 
                        onChange={(e) => setPrestashopSyncInterval(parseInt(e.target.value) || 10)}
                      />
                      <span>minuti</span>
                    </div>
                    <small className="settings-help">
                      Frequenza con cui il backend scarica nuovi ordini in background.
                    </small>
                  </div>
                </div>

                <aside className="settings-side-panel">
                  <label className={`settings-switch-card ${prestashopMockMode ? 'active' : ''}`}>
                    <div>
                      <strong>Modalità simulazione</strong>
                      <span>
                        {prestashopMockMode
                          ? 'Attiva: usa dati di test, nessuna chiamata reale.'
                          : 'Disattiva: usa il Webservice PrestaShop reale.'}
                      </span>
                    </div>
                    <span className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={prestashopMockMode} 
                        onChange={(e) => setPrestashopMockMode(e.target.checked)} 
                      />
                      <span />
                    </span>
                  </label>

                  <div className="connection-health-panel">
                    <div className="connection-health-header">
                      <span>Checklist configurazione</span>
                      <strong>{prestashopMockMode ? 'Mock' : `${[prestashopUrlValid, prestashopApiKeyPresent].filter(Boolean).length}/2`}</strong>
                    </div>
                    <div className={`settings-check-item ${prestashopMockMode || prestashopUrlValid ? 'complete' : ''}`}>
                      <span className="settings-check-dot" />
                      <span>URL API termina con <code>/api/</code></span>
                    </div>
                    <div className={`settings-check-item ${prestashopMockMode || prestashopApiKeyPresent ? 'complete' : ''}`}>
                      <span className="settings-check-dot" />
                      <span>Chiave Webservice presente</span>
                    </div>
                    <div className={`settings-check-item ${!prestashopMockMode ? 'complete' : ''}`}>
                      <span className="settings-check-dot" />
                      <span>Modalità reale abilitata</span>
                    </div>
                  </div>

                  <div className={`connection-test-panel ${testConnectionResult?.status || (prestashopMockMode ? 'skipped' : 'idle')}`}>
                    <span className="settings-panel-label">Stato test</span>
                    <strong>
                      {prestashopMockMode
                        ? 'Non necessario in simulazione'
                        : testConnectionResult
                          ? testConnectionResult.message
                          : 'Connessione non verificata'}
                    </strong>
                  </div>
                </aside>

                <div className="settings-action-footer">
                  <span>
                    {prestashopMockMode
                      ? 'Salva per mantenere la modalità simulazione.'
                      : prestashopRealReady
                        ? 'Configurazione pronta per verifica e salvataggio.'
                        : 'Completa URL e chiave prima del test.'}
                  </span>
                  <div className="settings-action-buttons">
                    {!prestashopMockMode && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleTestConnection}
                        disabled={testingConnection || savingConnectionSettings || !prestashopRealReady}
                      >
                        {testingConnection ? (
                          <>
                            <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--text-primary)' }}></div>
                            Verifica...
                          </>
                        ) : (
                          "Test Connessione"
                        )}
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={savingConnectionSettings || testingConnection}>
                      {savingConnectionSettings ? "Salvataggio..." : "Salva Configurazione"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            )}

            {/* Card 1b: Sincronizzazione Manuale Ordini PrestaShop */}
            {settingsSection === 'orders' && (
            <>
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
            </>
            )}
            {settingsSection === 'stock' && (
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
                  <button type="submit" className="btn btn-primary" disabled={savingStockSettings}>
                    {savingStockSettings ? "Salvataggio..." : "Salva Impostazioni Giacenze"}
                  </button>
                  
                  {stockSource === 'google_sheets' && (
                    <button 
                      type="button" 
                      className="btn btn-warning" 
                      disabled={syncingGoogleSheets}
                      onClick={handleSyncGoogleSheetsNow}
                    >
                      {syncingGoogleSheets ? "Sincronizzazione..." : "Sincronizza Ora"}
                    </button>
                  )}
                </div>
              </form>
            </div>
            )}

            {/* Card 3: Stati Ordini da Includere nell'Impegnato */}
            {settingsSection === 'orders' && (
            <div className="glass-panel widget-card order-states-card">
              <div className="settings-card-header">
                <div>
                  <h2>Stati Ordine che Scalano la Disponibilita</h2>
                  <p>
                    Scegli quali ordini devono essere conteggiati come impegnati e sottratti dalla disponibilita dei prodotti.
                  </p>
                </div>
                <span className={`settings-status-pill ${orderStatesDirty ? 'warning' : 'success'}`}>
                  <span className="settings-status-dot" />
                  {orderStatesDirty ? 'Modifiche non salvate' : 'Salvato'}
                </span>
              </div>
              
              {orderStates.length > 0 ? (
                <div className="settings-grid order-states-workbench">
                  <div className="states-impact-box">
                    <div>
                      <strong>Impatto configurazione</strong>
                      <span>Influenza ordini sincronizzati, quantita impegnata e disponibilita residua.</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSelectRecommendedStates}
                      disabled={recommendedOrderStateIds.length === 0}
                    >
                      Aggiungi consigliati
                    </button>
                  </div>

                  <div className="states-filter-bar order-states-toolbar">
                    <div className="states-search-wrapper">
                      <svg className="states-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
                      <input 
                        type="text" 
                        className="states-search-input" 
                        placeholder="Filtra stati per nome o ID..." 
                        value={searchStateQuery}
                        onChange={(e) => setSearchStateQuery(e.target.value)}
                      />
                    </div>
                    <div className="states-actions-wrapper">
                      <button
                        type="button"
                        className={`btn-small-link ${showOnlySelectedStates ? 'active' : ''}`}
                        onClick={() => setShowOnlySelectedStates(!showOnlySelectedStates)}
                      >
                        {showOnlySelectedStates ? 'Mostra tutti' : 'Solo selezionati'}
                      </button>
                      <button type="button" className="btn-small-link" onClick={handleSelectAllStates}>
                        Seleziona tutti
                      </button>
                      <button type="button" className="btn-small-link" onClick={handleDeselectAllStates}>
                        Deseleziona tutti
                      </button>
                    </div>
                  </div>

                  <div className="states-save-bar">
                    <div>
                      <strong>{selectedStates.length}</strong> stati inclusi nell'impegnato
                      {orderStatesDirty && <span className="settings-unsaved-badge">Modifiche non salvate</span>}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveOrderStates}
                      disabled={!orderStatesDirty || savingStateSettings}
                    >
                      {savingStateSettings ? "Salvataggio..." : "Salva Stati Ordine"}
                    </button>
                  </div>

                  <div className="states-scrollbox">
                    {filteredOrderStates.length > 0 ? (
                      <div className="checkbox-list order-state-list">
                        {filteredOrderStates.map(state => {
                          const isSelected = selectedStates.includes(state.id);
                          const isRecommended = recommendedOrderStateIds.includes(state.id);
                          return (
                          <label key={state.id} className={`checkbox-label order-state-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}>
                            <input type="checkbox" className="checkbox-control" checked={isSelected} onChange={() => handleToggleState(state.id)} />
                            <div>
                              <div className="order-state-title-row">
                                <span>{state.name}</span>
                                {isSelected && <em>Incluso</em>}
                              </div>
                              <div className="order-state-meta">
                                <span>ID {state.id}</span>
                                {isRecommended && <span>Consigliato</span>}
                              </div>
                            </div>
                            <span className="order-state-checkmark" aria-hidden="true" />
                          </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0', textAlign: 'center' }}>Nessuno stato trovato per la ricerca inserita.</p>
                    )}
                  </div>
                  
                  <div className="settings-alert settings-alert-info order-states-note">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>
                      Le modifiche diventano attive dopo il salvataggio e il prossimo ricalcolo. Evita stati come annullato o rimborsato se non devono scalare la disponibilita.
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Caricamento degli stati ordine da PrestaShop...</p>
              )}
            </div>
            )}

            {/* Card 4: Backup & Ripristino Database */}
            {settingsSection === 'backup' && (
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
            )}

          </div>
        )}
      </main>

      {/* Right-side Drawer for SKU Committed Orders Detail */}
      {selectedSkuForOrders && (() => {
        // Aggregate stats for header chips
        const totalOrders = skuOrdersData.length;
        const totalCommitted = skuOrdersData.reduce((sum, o) => sum + (o.contribution || 0), 0);
        const totalValue = skuOrdersData.reduce((sum, o) => sum + (o.total_paid || 0), 0);
        const selectedSkuStockRows = stockData.filter(item =>
          !item.is_spacer &&
          !item.is_missing &&
          item.sku === selectedSkuForOrders
        );
        const hasSelectedSkuStock = selectedSkuStockRows.length > 0;
        const remainingStock = selectedSkuStockRows.reduce((sum, item) => sum + Number(item.qty_residual || 0), 0);
        const formatQty = (value) => Number(value).toLocaleString('it-IT', { maximumFractionDigits: 2 });
        const formatSmartNote = (value) => String(value || '').replace(/(\d+)\.0(?!\d)/g, '$1');
        const smartSummary = smartSkuCounterData?.summary || null;
        const baseRows = smartSkuCounterEnabled ? (smartSkuCounterData?.orders || []) : skuOrdersData;
        const displayedSkuOrders = [...baseRows].sort((a, b) => {
          const dateA = a.date_add ? new Date(a.date_add).getTime() : 0;
          const dateB = b.date_add ? new Date(b.date_add).getTime() : 0;
          return skuOrdersSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
        const drawerIsLoading = loadingSkuOrders || (smartSkuCounterEnabled && loadingSmartSkuCounter);

        return (
          <>
            {/* Dim overlay — click to close */}
            <div className="order-drawer-overlay" onClick={() => setSelectedSkuForOrders(null)} />

            {/* Drawer panel */}
            <div className={`order-drawer ${smartSkuCounterEnabled ? 'order-drawer-expanded' : ''}`}>

              {/* Header */}
              <div className="order-drawer-header">
                <div className="order-drawer-title-row">
                  <h3>
                    Ordini impegnati — SKU:{' '}
                    <span style={{ color: 'var(--color-primary)' }}>{selectedSkuForOrders}</span>
                  </h3>
                  <div className="order-drawer-title-actions">
                    {!loadingSkuOrders && skuOrdersData.length > 0 && (
                      <span
                        className="smart-counter-tooltip-wrap"
                        data-tooltip="Simula gli ordini attivi in ordine cronologico, scala le giacenze di tutte le SKU collegate e indica quali ordini sono preparabili."
                      >
                        <button
                          type="button"
                          className={`btn btn-sm ${smartSkuCounterEnabled ? 'btn-success' : 'btn-neutral'}`}
                          onClick={toggleSmartSkuCounter}
                          disabled={loadingSmartSkuCounter}
                        >
                          {loadingSmartSkuCounter ? 'Calcolo Smart...' : smartSkuCounterEnabled ? 'Conteggio Smart attivo' : 'Conteggio Smart'}
                        </button>
                      </span>
                    )}
                    <button className="order-drawer-close" onClick={() => setSelectedSkuForOrders(null)} aria-label="Chiudi dettaglio ordine">
                      x
                    </button>
                  </div>
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
                    {hasSelectedSkuStock && (
                      <div className={`drawer-stat-chip ${remainingStock <= 0 ? 'stat-danger' : 'stat-success'}`}>
                        <span className="stat-value">{formatQty(remainingStock)}</span>
                        <span className="stat-label">Giacenza Rimanente</span>
                      </div>
                    )}
                    {totalValue > 0 && (
                      <div className="drawer-stat-chip">
                        <span className="stat-value">€ {totalValue.toFixed(2)}</span>
                        <span className="stat-label">Valore Stimato</span>
                      </div>
                    )}
                    {smartSkuCounterEnabled && smartSummary && (
                      <>
                        <div className="drawer-stat-chip stat-success">
                          <span className="stat-value">{smartSummary.counted || 0}</span>
                          <span className="stat-label">Conteggiati</span>
                        </div>
                        <div className={`drawer-stat-chip ${(smartSummary.blocked || 0) + (smartSummary.selected_sku_shortage || 0) > 0 ? 'stat-danger' : 'stat-success'}`}>
                          <span className="stat-value">{(smartSummary.blocked || 0) + (smartSummary.selected_sku_shortage || 0)}</span>
                          <span className="stat-label">Non conteggiati</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {!loadingSkuOrders && smartSkuCounterEnabled && smartSummary && (
                  <div className="order-drawer-controls">
                    <span className="order-drawer-smart-summary">
                      {formatQty(smartSummary.initial_selected_stock || 0)} {'->'} {formatQty(smartSummary.final_selected_stock || 0)} disponibili
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="order-drawer-body">
                {drawerIsLoading ? (
                  <div className="spinner-container" style={{ paddingTop: '60px' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                      {smartSkuCounterEnabled ? 'Calcolo Conteggio Smart in corso...' : 'Caricamento ordini in corso...'}
                    </p>
                  </div>
                ) : displayedSkuOrders.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ordine</th>
                        <th>
                          <button
                            type="button"
                            className="table-sort-header"
                            onClick={() => setSkuOrdersSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            aria-label={`Ordina per data ${skuOrdersSortDirection === 'asc' ? 'dal piu recente al meno recente' : 'dal meno recente al piu recente'}`}
                            title={skuOrdersSortDirection === 'asc' ? 'Dal meno recente al piu recente' : 'Dal piu recente al meno recente'}
                          >
                            <span>Data</span>
                            <span className="sort-arrow" aria-hidden="true">
                              {skuOrdersSortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          </button>
                        </th>
                        <th>Cliente</th>
                        <th>Stato</th>
                        <th>Prodotto</th>
                        <th style={{ textAlign: 'right' }}>Qta</th>
                        <th style={{ textAlign: 'right' }}>×SKU</th>
                        <th style={{ textAlign: 'right' }}>Impegnato</th>
                        {smartSkuCounterEnabled && (
                          <>
                            <th>Esito</th>
                            <th>Residuo / Note</th>
                          </>
                        )}
                        <th style={{ textAlign: 'right' }}>Valore</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSkuOrders.map((order, i) => (
                        <tr
                          key={`${order.order_id}-${order.product_id}-${i}`}
                          className={smartSkuCounterEnabled ? `smart-counter-row ${order.smart_status || ''}` : ''}
                        >
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
                          {smartSkuCounterEnabled && (
                            <>
                              <td>
                                <span className={`smart-counter-chip ${order.smart_status || ''}`}>
                                  {order.smart_label || 'Da valutare'}
                                </span>
                              </td>
                              <td className={`smart-counter-residue ${order.smart_status === 'counted' ? 'counted' : ''}`}>
                                <span className="smart-counter-residue-value">
                                  {formatQty(order.selected_qty_before || 0)} {'->'} {formatQty(order.selected_qty_after || 0)}
                                </span>
                                {order.smart_status !== 'counted' && order.smart_note && !order.component_issues?.length && (
                                  <span className="smart-counter-note-text">{formatSmartNote(order.smart_note)}</span>
                                )}
                                {order.component_issues?.length > 0 && (
                                  <div className="smart-counter-issues">
                                    {order.component_issues.map(issue => (
                                      <span key={issue.sku}>
                                        {issue.sku}: richiesti {formatQty(issue.qty_required)}, disp. {formatQty(issue.qty_available)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </>
                          )}
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
                          {displayedSkuOrders.reduce((s, o) => s + (o.product_quantity || 0), 0)}
                        </td>
                        <td></td>
                        <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                          {displayedSkuOrders.reduce((s, o) => s + (o.contribution || 0), 0)}
                        </td>
                        {smartSkuCounterEnabled && <td colSpan={2}></td>}
                        <td style={{ textAlign: 'right' }}>
                          {displayedSkuOrders.reduce((s, o) => s + (o.total_paid || 0), 0) > 0
                            ? `€ ${displayedSkuOrders.reduce((s, o) => s + (o.total_paid || 0), 0).toFixed(2)}`
                            : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '44px', height: '44px', margin: '0 auto 12px', opacity: 0.45, color: 'var(--color-primary)' }}>
                      <Icons.Stock />
                    </div>
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
                <button className="modal-close" onClick={() => setIsAssociationModalOpen(false)} aria-label="Chiudi editor associazione">x</button>
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
                                x
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

      {/* Reusable Confirm Modals */}
      <ConfirmModal 
        isOpen={showRestoreConfirm && !!pendingRestoreFile}
        title="Conferma Ripristino"
        message={pendingRestoreFile ? `Stai per ripristinare il database dal file ${pendingRestoreFile.name}.` : ""}
        warningText="ATTENZIONE: questa operazione sovrascriverà irrevocabilmente tutti i dati attuali (ordini, giacenze, associazioni, impostazioni). Viene effettuato comunque un salvataggio automatico di emergenza."
        onCancel={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
        onConfirm={executeRestoreDatabase}
        confirmText="Conferma e Ripristina"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={showClearAnomaliesConfirm}
        title="Svuota Registro Anomalie"
        message="Sei sicuro di voler eliminare tutte le anomalie registrate?"
        warningText="Questa azione cancellerà permanentemente tutti gli avvisi del log corrente. Gli errori verranno comunque rilevati nuovamente al prossimo import o ricalcolo se non risolti."
        onCancel={() => setShowClearAnomaliesConfirm(false)}
        onConfirm={executeClearAnomalies}
        confirmText="Svuota Registro"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={showDeleteAssociationConfirm && !!associationToDelete}
        title="Elimina Associazione"
        message={associationToDelete ? `Sei sicuro di voler eliminare l'associazione per il prodotto composto ${associationToDelete}?` : ""}
        warningText="Questa operazione rimuoverà la distinta base. Il prodotto non potrà essere esploso in SKU nel calcolo delle giacenze fino a una nuova associazione."
        onCancel={() => { setShowDeleteAssociationConfirm(false); setAssociationToDelete(null); }}
        onConfirm={executeDeleteAssociation}
        confirmText="Elimina Associazione"
        variant="danger"
      />
    </div>
  );
}

export default App;
