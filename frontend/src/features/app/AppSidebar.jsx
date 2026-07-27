import React from 'react';

const navigationItems = [
  ['dashboard', 'Dashboard', 'Dashboard'],
  ['stock', 'Giacenza', 'Stock'],
  ['orders', 'Ordini', 'Orders'],
  ['picking', 'Lista Prelievo', 'Picking'],
  ['anomalies', 'Anomalie', 'Anomaly'],
  ['associations', 'Editor Associazioni', 'Associations'],
  ['settings', 'Impostazioni', 'Settings'],
];

export function AppSidebar({
  activeTab,
  anomaliesCount,
  icons,
  isMobileOpen,
  onCloseMobile,
  onNavigate,
  onToggleTheme,
  status,
  theme,
}) {
  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile}></div>}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
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
          {navigationItems.map(([tab, label, iconName]) => {
            const Icon = icons[iconName];
            return (
              <li role="presentation" key={tab}>
                <button
                  type="button"
                  className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => onNavigate(tab)}
                  role="tab"
                  aria-selected={activeTab === tab}
                >
                  <Icon />
                  {tab === 'anomalies' ? (
                    <span className="nav-item-badge-wrapper">
                      {label}
                      {anomaliesCount > 0 && (
                        <span className="badge badge-danger nav-anomaly-count" style={{ padding: '2px 6px' }}>
                          {anomaliesCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>{label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <button type="button" className="theme-toggle-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? (
              <>
                <icons.Sun />
                <span>Tema Chiaro</span>
              </>
            ) : (
              <>
                <icons.Moon />
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
    </>
  );
}
