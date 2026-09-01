const SECTION_LABELS = {
  connection: 'Connessione',
  stock: 'Giacenze',
  orders: 'Ordini',
  extension: 'Integrazioni',
  backup: 'Backup',
};

function issue(section, message, field = '') {
  return { field, message, section, sectionLabel: SECTION_LABELS[section] };
}

export function deriveSettingsPreflight(settings) {
  const issues = [];
  const warnings = [];

  if (!settings.prestashopMockMode) {
    if (!settings.prestashopUrlValid) {
      issues.push(issue('connection', 'Completa l’URL API PrestaShop.', 'prestashop-api-url'));
    }
    if (!settings.prestashopApiKey?.trim()) {
      issues.push(issue('connection', 'Inserisci la chiave API PrestaShop.', 'prestashop-api-key'));
    }
    if (!settings.lastConnectionTestAt || !settings.connectionVerifiedForCurrentValues) {
      warnings.push(issue('connection', 'Verifica la connessione reale prima della prossima sincronizzazione.'));
    }
  }
  if (Number(settings.prestashopSyncInterval) < 1 || Number(settings.prestashopSyncInterval) > 1440) {
    issues.push(issue('connection', 'Imposta un intervallo ordini tra 1 e 1440 minuti.', 'prestashop-sync-interval'));
  }

  if (settings.stockSource === 'google_sheets') {
    if (!settings.googleSheetUrl?.trim().startsWith('https://docs.google.com/spreadsheets/')) {
      issues.push(issue('stock', 'Inserisci un URL Google Sheets valido.', 'google-sheet-url'));
    }
    if (!settings.googleSheetName?.trim()) {
      issues.push(issue('stock', 'Indica il nome del foglio da sincronizzare.', 'google-sheet-name'));
    }
    if (Number(settings.googleSheetSyncInterval) < 1 || Number(settings.googleSheetSyncInterval) > 1440) {
      issues.push(issue('stock', 'Imposta un intervallo Google Sheets tra 1 e 1440 minuti.', 'google-sheet-interval'));
    }
    if (!settings.googleSheetLastSync) {
      warnings.push(issue('stock', 'Google Sheets è configurato ma non è ancora stato sincronizzato.'));
    }
  }
  if (!settings.mappingSku?.trim()) {
    issues.push(issue('stock', 'Configura la colonna SKU.', 'mapping-sku'));
  }
  if (!settings.mappingQty?.trim()) {
    issues.push(issue('stock', 'Configura la colonna quantità.', 'mapping-qty'));
  }
  if (settings.excludeReturnLots && !settings.excludedLotKeywords?.trim()) {
    issues.push(issue('stock', 'Aggiungi almeno una parola per riconoscere i lotti esclusi.', 'excluded-lot-keywords'));
  }
  if (settings.pickingSheetWriteEnabled) {
    if (settings.stockSource !== 'google_sheets') {
      issues.push(issue('stock', 'La registrazione prelievi richiede Google Sheets come sorgente.'));
    }
    if (!settings.pickingSheetWebappUrl?.trim()) {
      issues.push(issue('stock', 'Configura l’URL della Web App Apps Script.', 'picking-sheet-webapp-url'));
    }
    if (!settings.pickingSheetSecretConfigured && !settings.pickingSheetSharedSecret) {
      issues.push(issue('stock', 'Configura il secret condiviso di Apps Script.', 'picking-sheet-secret'));
    }
  }

  if (settings.selectedStates?.length === 0) {
    warnings.push(issue('orders', 'Nessuno stato ordine impegna attualmente la giacenza.'));
  }
  if (!settings.extensionTokenConfigured && !settings.extensionApiToken?.trim()) {
    warnings.push(issue('extension', 'L’integrazione browser non è ancora configurata.'));
  }

  return {
    issues,
    ready: issues.length === 0,
    warnings,
  };
}

export const SETTINGS_SEARCH_TERMS = {
  connection: 'connessione prestashop api chiave credenziali webservice sincronizzazione intervallo simulazione mock',
  stock: 'giacenze google sheets excel colonne mappatura sku quantità lotto resi prelievi apps script giorni',
  orders: 'ordini stati disponibilità impegnata sincronizzazione prestashop',
  extension: 'integrazioni estensioni chrome firefox userscript token api download',
  backup: 'backup ripristino database esporta importa configurazione json sqlite',
};
