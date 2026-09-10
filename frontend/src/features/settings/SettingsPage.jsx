import { useEffect, useMemo, useState } from 'react';

import { BackupSettings } from './BackupSettings';
import { ConnectionSettings } from './ConnectionSettings';
import { ExtensionSettings } from './ExtensionSettings';
import { OrderSettings } from './OrderSettings';
import { StockSettings } from './StockSettings';
import { SettingsPreflightPanel } from './SettingsPreflightPanel';
import { deriveSettingsPreflight } from './settingsPreflight';
import { searchSettings } from './settingsSearch';

function focusSettingsElement(fieldId) {
  let element = document.getElementById(fieldId);
  if (!element) return false;
  if (element.matches(':disabled')) {
    element = element.closest('.settings-linear-section')?.querySelector('h3') || element;
  }
  if (!element.matches('input, select, textarea, button, [tabindex]')) {
    element.setAttribute('tabindex', '-1');
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
  return true;
}

export function SettingsPage({ settings }) {
  const {
    connectionSettingsDirty,
    connectionVerifiedForCurrentValues,
    connectionSettingsErrorSection,
    extensionTokenConfigured,
    extensionTokenDirty,
    extensionSettingsErrorSection,
    extensionTestResult,
    googleSheetLastSync,
    googleSheetLastError,
    lastConnectionTestAt,
    orderSettingsError,
    orderStatesDirty,
    gaerStatesDirty,
    prestashopStatusLabel,
    prestashopStatusTone,
    prestashopMockMode,
    selectedStates,
    setSettingsError,
    setSettingsSection,
    settingsError,
    settingsSection,
    settingsSections,
    stockSettingsDirty,
    stockSettingsErrorSection,
    stockSource,
  } = settings;
  const [gridNavigation, setGridNavigation] = useState(() => (
    typeof window !== 'undefined'
      && window.matchMedia('(min-width: 481px) and (max-width: 760px)').matches
  ));
  const [settingsQuery, setSettingsQuery] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [settingsFocusTarget, setSettingsFocusTarget] = useState('');

  const dirtySections = useMemo(() => ({
    connection: Boolean(connectionSettingsDirty),
    extension: Boolean(extensionTokenDirty),
    stock: Boolean(stockSettingsDirty),
    orders: Boolean(orderStatesDirty || gaerStatesDirty),
    backup: false,
  }), [connectionSettingsDirty, extensionTokenDirty, gaerStatesDirty, orderStatesDirty, stockSettingsDirty]);
  const hasUnsavedChanges = Object.values(dirtySections).some(Boolean);
  const preflight = useMemo(() => deriveSettingsPreflight(settings), [settings]);
  const settingsSearchResults = useMemo(
    () => searchSettings(settingsQuery),
    [settingsQuery],
  );
  const searchActive = Boolean(settingsQuery.trim());
  const hasContextualError = Boolean(
    (settingsSection === 'connection' && connectionSettingsErrorSection)
    || (settingsSection === 'extension' && extensionSettingsErrorSection)
    || (settingsSection === 'stock' && stockSettingsErrorSection)
    || (settingsSection === 'orders' && orderSettingsError),
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const warnBeforeUnload = event => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 481px) and (max-width: 760px)');
    const updateLayout = event => setGridNavigation(event.matches);
    setGridNavigation(query.matches);
    query.addEventListener('change', updateLayout);
    return () => query.removeEventListener('change', updateLayout);
  }, []);

  const summaries = {
    connection: {
      value: connectionSettingsDirty
        ? 'Modifiche da salvare'
        : prestashopMockMode
          ? 'Simulazione attiva'
          : connectionVerifiedForCurrentValues && lastConnectionTestAt
            ? 'Connessione verificata'
            : `${prestashopStatusLabel} · da verificare`,
      tone: connectionSettingsDirty
        ? 'warning'
        : prestashopMockMode || connectionVerifiedForCurrentValues
          ? prestashopStatusTone
          : 'neutral',
    },
    stock: {
      value: stockSettingsDirty
        ? 'Modifiche da salvare'
        : googleSheetLastError
          ? 'Ultima sincronizzazione fallita'
        : stockSource === 'google_sheets'
          ? googleSheetLastSync ? 'Google Sheets sincronizzato' : 'Google Sheets da sincronizzare'
          : 'Caricamento Excel',
      tone: stockSettingsDirty ? 'warning' : googleSheetLastError ? 'danger' : stockSource === 'google_sheets' && googleSheetLastSync ? 'success' : 'neutral',
    },
    orders: {
      value: orderStatesDirty || gaerStatesDirty ? 'Modifiche da salvare' : `${selectedStates.length} stati inclusi`,
      tone: orderStatesDirty || gaerStatesDirty ? 'warning' : 'success',
    },
    extension: {
      value: extensionTokenDirty
        ? 'Modifiche da salvare'
        : extensionTestResult?.status === 'success'
          ? 'Collegamento verificato'
          : extensionTokenConfigured ? 'Configurata · da verificare' : 'Da configurare',
      tone: extensionTokenDirty ? 'warning' : extensionTestResult?.status === 'success' ? 'success' : 'neutral',
    },
    backup: { value: 'Esporta o ripristina', tone: 'neutral' },
  };

  const changeSection = sectionId => {
    if (sectionId === settingsSection) return;
    setSettingsError(null);
    setSettingsSection(sectionId);
  };

  const openPreflightFinding = (sectionId, fieldId) => {
    setSettingsFocusTarget(fieldId || '');
    changeSection(sectionId);
    if (!fieldId) return;
    if (sectionId !== 'stock') {
      window.setTimeout(() => {
        focusSettingsElement(fieldId);
        setSettingsFocusTarget('');
      }, 80);
    }
  };

  const openSearchResult = result => {
    setSettingsQuery('');
    openPreflightFinding(result.section, result.target);
  };

  const copySectionLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('settings', settingsSection);
    try {
      await navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      setLinkCopied(false);
    }
  };

  const handleNavigationKeyDown = event => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    if (!gridNavigation && ['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const navigationSections = settingsSections;
    const currentIndex = Math.max(0, navigationSections.findIndex(section => section.id === settingsSection));
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = navigationSections.length - 1;
    if (!gridNavigation && event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + navigationSections.length) % navigationSections.length;
    if (!gridNavigation && event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % navigationSections.length;
    if (gridNavigation && event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
    if (gridNavigation && event.key === 'ArrowRight') nextIndex = Math.min(navigationSections.length - 1, currentIndex + 1);
    if (gridNavigation && event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 2);
    if (gridNavigation && event.key === 'ArrowDown') nextIndex = Math.min(navigationSections.length - 1, currentIndex + 2);
    const nextSection = navigationSections[nextIndex];
    changeSection(nextSection.id);
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <div className="settings-page settings-shell">
      <nav className="settings-category-rail" aria-label="Navigazione impostazioni">
        <div className="settings-category-rail-heading">
          <div><strong>Impostazioni</strong><button type="button" onClick={copySectionLink}>{linkCopied ? 'Copiato' : 'Copia link'}</button></div>
          <span>Configura la web app per area.</span>
        </div>
        <div className={`settings-category-search ${searchActive ? 'has-query' : ''}`}>
          <label className="sr-only" htmlFor="settings-search">Cerca nelle impostazioni</label>
          <span aria-hidden="true">⌕</span>
          <input
            id="settings-search"
            type="search"
            value={settingsQuery}
            onChange={event => setSettingsQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') setSettingsQuery('');
              if (event.key === 'ArrowDown' && settingsSearchResults.length > 0) {
                event.preventDefault();
                document.querySelector('.settings-search-result')?.focus();
              }
            }}
            placeholder="Cerca una voce"
            autoComplete="off"
            aria-controls="settings-search-results"
          />
        </div>
        {searchActive && (
          <div id="settings-search-results" className="settings-search-results" aria-label="Risultati impostazioni">
            {settingsSearchResults.map(result => (
              <button
                key={`${result.section}-${result.target}-${result.label}`}
                type="button"
                className="settings-search-result"
                onClick={() => openSearchResult(result)}
              >
                <strong>{result.label}</strong>
                <small>{result.sectionLabel}</small>
              </button>
            ))}
            {settingsSearchResults.length === 0 && (
              <div className="settings-category-empty">
                <span>Nessuna impostazione trovata.</span>
                <button type="button" onClick={() => setSettingsQuery('')}>Azzera ricerca</button>
              </div>
            )}
          </div>
        )}
        {!searchActive && <div className="settings-category-list" role="tablist" aria-orientation={gridNavigation ? 'horizontal' : 'vertical'}>
          {settingsSections.map(section => {
            const summary = summaries[section.id];
            const active = settingsSection === section.id;
            return (
              <button
                key={section.id}
                id={`settings-tab-${section.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`settings-panel-${section.id}`}
                tabIndex={active ? 0 : -1}
                className={`settings-category-item ${summary.tone} ${active ? 'active' : ''}`}
                onClick={() => changeSection(section.id)}
                onKeyDown={handleNavigationKeyDown}
              >
                <span className="settings-category-copy">
                  <strong>{section.label}</strong>
                  <small>{summary.value}</small>
                </span>
                {dirtySections[section.id] && <span className="settings-category-unsaved">Non salvato</span>}
              </button>
            );
          })}
        </div>}
        {hasUnsavedChanges && (
          <p className="settings-category-draft-note">
            Le modifiche restano disponibili passando da una sezione all’altra.
          </p>
        )}
      </nav>

      <section className="settings-main-pane" aria-label="Contenuto impostazioni">
        <SettingsPreflightPanel preflight={preflight} onSelectSection={openPreflightFinding} />
        {settingsError && !hasContextualError && (
          <div className="settings-alert settings-alert-danger" role="alert">{settingsError}</div>
        )}
        <div
          key={settingsSection}
          id={`settings-panel-${settingsSection}`}
          className="settings-section-content motion-state-reveal"
          role="tabpanel"
          aria-labelledby={`settings-tab-${settingsSection}`}
          tabIndex={0}
        >
          {settingsSection === 'connection' && <ConnectionSettings settings={settings} />}
          {settingsSection === 'stock' && <StockSettings settings={settings} focusTarget={settingsFocusTarget} onFocusTargetHandled={() => setSettingsFocusTarget('')} />}
          {settingsSection === 'orders' && <OrderSettings settings={settings} />}
          {settingsSection === 'extension' && <ExtensionSettings settings={settings} />}
          {settingsSection === 'backup' && <BackupSettings settings={settings} />}
        </div>
      </section>
    </div>
  );
}
