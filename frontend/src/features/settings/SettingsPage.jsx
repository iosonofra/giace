import { ConnectionSettings } from './ConnectionSettings';
import { ExtensionSettings } from './ExtensionSettings';
import { StockSettings } from './StockSettings';
import { OrderSettings } from './OrderSettings';
import { BackupSettings } from './BackupSettings';

export function SettingsPage({ settings }) {
  const {
    extensionTokenConfigured,
    getRelativeTimeString,
    orderStatesDirty,
    prestashopStatusLabel,
    prestashopStatusTone,
    selectedStates,
    setSettingsSection,
    settingsError,
    settingsSection,
    settingsSections,
    status,
    stockSource,
  } = settings;

  return (
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
                  <div className={`settings-summary-item ${extensionTokenConfigured ? 'success' : 'warning'}`}>
                    <span className="settings-summary-label">Estensione Chrome</span>
                    <strong><span className="settings-status-dot" />{extensionTokenConfigured ? 'Token protetto' : 'API senza token'}</strong>
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

                {settingsSection === 'connection' && <ConnectionSettings settings={settings} />}

                {settingsSection === 'extension' && <ExtensionSettings settings={settings} />}

                {settingsSection === 'stock' && <StockSettings settings={settings} />}

                {settingsSection === 'orders' && <OrderSettings settings={settings} />}

                {settingsSection === 'backup' && <BackupSettings settings={settings} />}

              </div>
  );
}
