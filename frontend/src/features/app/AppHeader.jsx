import React from 'react';

const pageCopy = {
  dashboard: ['Dashboard di Controllo', 'Panoramica e strumenti di caricamento/sync della disponibilità magazzino.'],
  stock: ['Giacenza', 'Fai click sulle intestazioni di colonna per ordinare. Visualizza il livello di stock residuo.'],
  orders: ['Ordini Sincronizzati', 'Dettaglio ordini nello stato configurato con relative righe prodotto.'],
  picking: ['Lista Prelievo (Preparazione Ordini)', "Incolla qui l'elenco grezzo contenente gli ID ordine per calcolare all'istante il fabbisogno delle SKU necessarie."],
  anomalies: ['Registro Anomalie', "Problematiche riscontrate nell'import dei file Excel e nella corrispondenza dei codici."],
  settings: ['Impostazioni di Sincronizzazione', 'Configura quali stati degli ordini PrestaShop devono essere conteggiati come impegnato.'],
};

function PageTitle({ activeTab }) {
  if (activeTab === 'associations') {
    return (
      <>
        <h1>Editor Associazioni e Disponibilità Kit</h1>
        <p className="page-title-description" style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
          Gestisci le associazioni tra i <strong>prodotti composti (kit o bundle)</strong> e i singoli articoli fisici.
          Visualizza la <em>Disponibilità Finale</em> calcolata in tempo reale in base alle giacenze residue di ciascun articolo
          e scopri lo <em>SKU Limitante</em> che ne blocca/limita la vendita.
        </p>
      </>
    );
  }

  const copy = pageCopy[activeTab];
  if (!copy) return null;

  return (
    <>
      <h1>{copy[0]}</h1>
      <p>{copy[1]}</p>
    </>
  );
}

export function AppHeader({
  activeTab,
  icons,
  loading,
  onOpenMobileMenu,
  onRefresh,
  onSyncAll,
  onSyncOrders,
  stockSource,
  syncingGoogleSheets,
  syncingOrders,
}) {
  const syncAllBusy = syncingGoogleSheets || syncingOrders;
  const syncAllDisabled = syncingGoogleSheets || syncingOrders || loading;

  return (
    <header className="content-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <button
        type="button"
        className="mobile-nav-toggle btn btn-secondary"
        onClick={onOpenMobileMenu}
        aria-label="Apri menu"
        style={{ padding: '8px', minWidth: '40px', minHeight: '40px', display: 'none', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="page-title" style={{ flexGrow: 1 }}>
        <PageTitle activeTab={activeTab} />
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {activeTab !== 'settings' && activeTab !== 'picking' && (
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={loading}
            aria-busy={loading}
            title="Ricarica i dati salvati nel database locale senza avviare nuove richieste esterne (veloce)"
          >
            <icons.Sync spinning={loading} /> Aggiorna Dati
          </button>
        )}

        {activeTab === 'dashboard' && (
          <button
            className="btn btn-primary"
            onClick={onSyncAll}
            disabled={loading || syncAllBusy}
            aria-busy={syncAllBusy}
            data-loading-indicator="true"
            title="Avvia la sincronizzazione da Google Sheets ed esegue il calcolo degli ordini da PrestaShop (richiede qualche secondo)"
          >
            {syncAllBusy ? 'Sincronizzazione…' : 'Sincronizza Tutto'}
          </button>
        )}

        {activeTab === 'stock' && (
          stockSource === 'google_sheets' ? (
            <button
              className="btn btn-primary"
              onClick={onSyncAll}
              disabled={syncAllDisabled}
              aria-busy={syncAllBusy}
              title="Avvia la sincronizzazione da Google Sheets ed esegue il calcolo degli ordini da PrestaShop (richiede qualche secondo)"
            >
              <icons.Sync spinning={syncingGoogleSheets || syncingOrders} /> Sincronizza Tutto (Sheets &amp; Ordini)
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onSyncOrders}
              disabled={syncingOrders || loading}
              aria-busy={syncingOrders}
              title="Scarica i nuovi ordini da PrestaShop e ricalcola le giacenze (richiede qualche secondo)"
            >
              <icons.Sync spinning={syncingOrders} /> Sincronizza Ordini
            </button>
          )
        )}

        {activeTab === 'orders' && (
          <button
            className="btn btn-primary"
            onClick={onSyncOrders}
            disabled={syncingOrders || loading}
            aria-busy={syncingOrders}
          >
            <icons.Sync spinning={syncingOrders} /> Sincronizza Ordini
          </button>
        )}
      </div>
    </header>
  );
}
