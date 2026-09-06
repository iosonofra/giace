export const SETTINGS_SEARCH_ITEMS = Object.freeze([
  { section: 'connection', sectionLabel: 'Connessione', label: 'URL API PrestaShop', target: 'prestashop-api-url', keywords: 'endpoint indirizzo negozio webservice' },
  { section: 'connection', sectionLabel: 'Connessione', label: 'Chiave API Webservice', target: 'prestashop-api-key', keywords: 'credenziali password token prestashop' },
  { section: 'connection', sectionLabel: 'Connessione', label: 'Modalità simulazione', target: 'connection-behavior-title', keywords: 'mock dati dimostrativi webservice reale sorgente ordini' },
  { section: 'connection', sectionLabel: 'Connessione', label: 'Intervallo aggiornamento ordini', target: 'prestashop-sync-interval', keywords: 'frequenza sincronizzazione minuti' },
  { section: 'connection', sectionLabel: 'Connessione', label: 'Verifica connessione', target: 'connection-verification-title', keywords: 'test endpoint autenticazione accesso' },

  { section: 'stock', sectionLabel: 'Giacenze', label: 'Sorgente giacenze', target: 'stock-source-title', keywords: 'excel google sheets caricamento sincronizzazione' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'URL Google Sheet', target: 'google-sheet-url', keywords: 'foglio drive collegamento sorgente' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Nome foglio', target: 'google-sheet-name', keywords: 'tab scheda google sheets rosate' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Intervallo verifica Google Sheets', target: 'google-sheet-interval', keywords: 'frequenza sincronizzazione minuti' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Nome colonna SKU', target: 'mapping-sku', keywords: 'mappatura intestazione codice' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Nome colonna quantità', target: 'mapping-qty', keywords: 'mappatura intestazione totale qta' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Colonna descrizione', target: 'mapping-description', keywords: 'mappatura intestazione prodotto' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Colonna lotto', target: 'mapping-lotto', keywords: 'mappatura intestazione resi reso' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Escludi i lotti di reso', target: 'exclude-return-lots', keywords: 'giacenze escluse calcolo resi lotto' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Parole riconosciute nel lotto', target: 'excluded-lot-keywords', keywords: 'reso resi esclusione keywords' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Registrazione prelievi su Google Sheets', target: 'stock-settings-trigger-writeback', keywords: 'picking scrittura scarico beta apps script' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'URL Web App Apps Script', target: 'picking-sheet-webapp-url', keywords: 'endpoint registrazione prelievi google' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Secret condiviso Apps Script', target: 'picking-sheet-secret', keywords: 'password credenziale sicurezza prelievi' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Colonna residuo', target: 'picking-sheet-remaining-header', keywords: 'rimanenti anteprima prelievi' },
  { section: 'stock', sectionLabel: 'Giacenze', label: 'Mappatura giorni', target: 'picking-sheet-days-title', keywords: 'lunedi martedi mercoledi giovedi venerdi sabato domenica data' },

  { section: 'orders', sectionLabel: 'Ordini', label: 'Sincronizzazione ordini PrestaShop', target: 'orders-sync-title', keywords: 'scarica aggiorna cache importazione' },
  { section: 'orders', sectionLabel: 'Ordini', label: 'Stati che scalano la disponibilità', target: 'order-states-search', keywords: 'inclusi impegnata filtro stato ordine' },

  { section: 'extension', sectionLabel: 'Integrazioni', label: 'Estensione Chrome', target: 'extension-browser-chrome', keywords: 'browser pacchetto download installazione' },
  { section: 'extension', sectionLabel: 'Integrazioni', label: 'Estensione Firefox', target: 'extension-browser-firefox', keywords: 'browser xpi firma addons download installazione' },
  { section: 'extension', sectionLabel: 'Integrazioni', label: 'Userscript', target: 'extension-browser-userscript', keywords: 'tampermonkey violentmonkey download installazione' },
  { section: 'extension', sectionLabel: 'Integrazioni', label: 'Token estensione', target: 'extension-api-token', keywords: 'credenziale api autorizzazione browser' },
  { section: 'extension', sectionLabel: 'Integrazioni', label: 'Verifica integrazione', target: 'integration-verification-title', keywords: 'test collegamento endpoint token' },

  { section: 'backup', sectionLabel: 'Backup', label: 'Esporta configurazione', target: 'settings-transfer-title', keywords: 'json opzioni impostazioni scarica' },
  { section: 'backup', sectionLabel: 'Backup', label: 'Importa configurazione', target: 'settings-transfer-title', keywords: 'json opzioni impostazioni carica' },
  { section: 'backup', sectionLabel: 'Backup', label: 'Scarica backup database', target: 'backup-export-title', keywords: 'sqlite db esporta completo' },
  { section: 'backup', sectionLabel: 'Backup', label: 'Ripristina database', target: 'backup-restore-title', keywords: 'sqlite db importa recupero' },
]);

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('it')
    .trim();
}

export function searchSettings(query) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return SETTINGS_SEARCH_ITEMS.filter(item => {
    const searchable = normalizeSearchText(
      `${item.label} ${item.sectionLabel} ${item.keywords}`,
    );
    return terms.every(term => searchable.includes(term));
  });
}
