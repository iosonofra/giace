import { useEffect, useState } from 'react';

import { StockMappingSettings } from './StockMappingSettings';
import { StockCalculationPolicySettings } from './StockCalculationPolicySettings';
import { StockSourceSettings } from './StockSourceSettings';
import { StockSyncStatusRail } from './StockSyncStatusRail';
import { PickingSheetWriteSettings } from './PickingSheetWriteSettings';
import { SettingsLinearSection } from './ProgressiveSettings';

const STOCK_SECTION_STORAGE_KEY = 'giac.stock-settings.active-section';
const STOCK_SECTION_IDS = new Set(['source', 'mapping', 'writeback']);

function readStoredSection() {
  try {
    if (typeof window === 'undefined') return 'source';
    const stored = window.sessionStorage.getItem(STOCK_SECTION_STORAGE_KEY);
    return STOCK_SECTION_IDS.has(stored) ? stored : 'source';
  } catch {
    return 'source';
  }
}

function DisclosureChevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function StockSettingsDisclosure({ active, badge, children, description, id, onToggle, summary, title }) {
  const panelId = `stock-settings-panel-${id}`;
  const triggerId = `stock-settings-trigger-${id}`;
  return (
    <section className={`stock-settings-disclosure ${active ? 'active' : ''}`}>
      <button
        type="button"
        id={triggerId}
        className="stock-settings-disclosure-trigger"
        aria-expanded={active}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
      >
        <span className="stock-settings-disclosure-copy">
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <span className="stock-settings-disclosure-meta">
          {badge && <span className={`badge ${badge.tone || 'badge-neutral'}`}>{badge.label}</span>}
          <span className="stock-settings-disclosure-summary">{summary}</span>
          <span className="stock-settings-disclosure-chevron"><DisclosureChevron /></span>
        </span>
      </button>
      {active && (
        <div
          id={panelId}
          className="stock-settings-disclosure-panel"
          role="region"
          aria-labelledby={triggerId}
        >
          {children}
        </div>
      )}
    </section>
  );
}

export function StockSettings({ settings, focusTarget = '', onFocusTargetHandled }) {
  const {
    excludeReturnLots,
    excludedLotKeywords,
    googleSheetLastError,
    googleSheetName,
    googleSheetSyncInterval,
    handleSaveGoogleSheetsSettings,
    mappingQty,
    mappingSku,
    pickingSheetWriteEnabled,
    resetStockSettings,
    savingStockSettings,
    settingsError,
    stockSettingsErrorField,
    stockSettingsErrorSection,
    stockSettingsDirty,
    stockSource,
  } = settings;
  const [activeSection, setActiveSection] = useState(readStoredSection);

  useEffect(() => {
    if (googleSheetLastError) setActiveSection('source');
  }, [googleSheetLastError]);

  useEffect(() => {
    if (!stockSettingsErrorSection) return undefined;
    if (stockSettingsErrorSection === 'writeback') setActiveSection('writeback');
    const focusFrame = window.requestAnimationFrame(() => {
      const fieldIds = {
        source: stockSource === 'google_sheets' ? 'google-sheet-url' : '',
        mapping: 'mapping-sku',
        save: 'stock-settings-save-error',
      };
      const targetId = stockSettingsErrorField || fieldIds[stockSettingsErrorSection];
      const field = targetId
        ? document.getElementById(targetId)
        : document.getElementById(`stock-settings-panel-${stockSettingsErrorSection}`)?.querySelector(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
        );
      field?.focus();
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [stockSettingsErrorField, stockSettingsErrorSection, stockSource]);

  useEffect(() => {
    if (!focusTarget) return undefined;
    if (focusTarget.startsWith('picking-sheet-')) setActiveSection('writeback');
    const focusTimer = window.setTimeout(() => {
      document.getElementById(focusTarget)?.focus();
      onFocusTargetHandled?.();
    }, 100);
    return () => window.clearTimeout(focusTimer);
  }, [focusTarget, onFocusTargetHandled]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (activeSection) window.sessionStorage.setItem(STOCK_SECTION_STORAGE_KEY, activeSection);
      else window.sessionStorage.removeItem(STOCK_SECTION_STORAGE_KEY);
    } catch {
      // La navigazione resta operativa anche se lo storage è disabilitato.
    }
  }, [activeSection]);

  const toggleSection = id => setActiveSection(current => (current === id ? '' : id));
  const sourceSummary = stockSource === 'google_sheets'
    ? `${googleSheetName || 'Foglio non indicato'} · ogni ${googleSheetSyncInterval} min`
    : 'Caricamento Excel manuale';
  const mappingSummary = `${mappingSku || 'SKU'} → ${mappingQty || 'Quantità'}${
    excludeReturnLots ? ` · esclusi ${excludedLotKeywords || 'lotti configurati'}` : ''
  }`;

  return (
    <div className="glass-panel widget-card settings-workbench stock-settings-workbench">
      <div className="settings-card-header">
        <div>
          <h2>Giacenze e sincronizzazione</h2>
          <p>Configura la sorgente, le regole di calcolo e la registrazione dei prelievi.</p>
        </div>
      </div>

      <form onSubmit={handleSaveGoogleSheetsSettings} className="stock-settings-form">
        <StockSyncStatusRail settings={settings} />

        <div className="settings-linear-sections stock-settings-sections">
          <SettingsLinearSection id="stock-source" title="Sorgente e sincronizzazione" description="Scegli da dove leggere le quantità fisiche e con quale frequenza aggiornarle." status={sourceSummary}>
            {stockSettingsErrorSection === 'source' && settingsError && <div id="stock-source-error" className="settings-inline-error settings-inline-error-panel" role="alert">{settingsError}</div>}
            <StockSourceSettings settings={settings} embedded />
          </SettingsLinearSection>

          <SettingsLinearSection id="stock-mapping" title="Colonne e regole di calcolo" description="Abbina le intestazioni e stabilisci quali giacenze non devono partecipare ai calcoli." status={mappingSummary}>
            {stockSettingsErrorSection === 'mapping' && settingsError && <div id="stock-mapping-error" className="settings-inline-error settings-inline-error-panel" role="alert">{settingsError}</div>}
            <StockMappingSettings settings={settings} />
            <StockCalculationPolicySettings settings={settings} />
          </SettingsLinearSection>

          <StockSettingsDisclosure
            id="writeback"
            active={activeSection === 'writeback'}
            onToggle={toggleSection}
            title="Registrazione prelievi su Google Sheets"
            description="Configura la scrittura confermata dei prelievi tramite Apps Script."
            summary={pickingSheetWriteEnabled ? 'Funzione attiva' : 'Funzione disattivata'}
            badge={{ label: 'Beta', tone: 'badge-primary' }}
          >
            {stockSettingsErrorSection === 'writeback' && settingsError && <div id="stock-writeback-error" className="settings-inline-error settings-inline-error-panel" role="alert">{settingsError}</div>}
            <PickingSheetWriteSettings settings={settings} embedded />
          </StockSettingsDisclosure>
        </div>

        <footer className={`stock-settings-footer ${stockSettingsDirty ? 'dirty' : ''} ${stockSettingsErrorSection === 'save' && settingsError ? 'has-error' : ''}`}>
          {stockSettingsErrorSection === 'save' && settingsError && <div id="stock-settings-save-error" className="settings-save-error" role="alert" tabIndex="-1">{settingsError}</div>}
          <span>{stockSettingsDirty ? 'Modifiche non salvate' : ''}</span>
          <div className="settings-footer-actions">
            <button type="button" className="btn btn-secondary" onClick={resetStockSettings} disabled={savingStockSettings || !stockSettingsDirty} title={!stockSettingsDirty ? 'Non ci sono modifiche da annullare.' : undefined}>Annulla modifiche</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingStockSettings || !stockSettingsDirty}
              title={!stockSettingsDirty ? 'Modifica almeno un’opzione prima di salvare.' : undefined}
              aria-busy={savingStockSettings}
              data-loading-indicator="true"
            >
              {savingStockSettings ? 'Salvataggio...' : 'Salva impostazioni giacenze'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
