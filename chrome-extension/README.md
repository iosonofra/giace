# Giac Feedback Ordini PrestaShop — Beta

Estensione Chrome Manifest V3 che aggiunge un badge di disponibilità alle righe della lista ordini PrestaShop/Ordini++.

## Installazione beta

1. Riavvia il backend Giac aggiornato.
2. In Chrome apri `chrome://extensions`.
3. Attiva **Modalità sviluppatore**.
4. Premi **Carica estensione non pacchettizzata**.
5. Seleziona la cartella `chrome-extension`.
6. Si aprirà automaticamente la pagina di configurazione.

## Configurazione

- **URL webapp Giac**: per esempio `http://192.168.1.50:8000`.
- **Dominio amministrazione PrestaShop**: per esempio `https://admin.esempio.it`.
- **Token**: nella webapp apri **Impostazioni → Estensione beta**, genera e salva il token, quindi copialo nelle opzioni dell'estensione.

Il token salvato dalla webapp è attivo immediatamente, senza riavviare il servizio. Lasciandolo vuoto, gli endpoint dell'estensione restano accessibili senza autenticazione.

## Funzionamento

- Il content script riconosce la pagina ordini e legge gli ID dalle righe visibili.
- Il service worker interroga `/api/extension/orders-availability`.
- Il backend valuta l'intera coda negli stati configurati, in ordine cronologico.
- Gli ordini non preparabili vengono saltati senza consumare stock.
- Il badge viene inserito accanto all'ID ordine.
- Il popover operativo mostra SKU richieste, quantità disponibili, residui, mancanze e freschezza dei dati.
- La freschezza distingue l'ultimo controllo della sorgente dall'ultima modifica effettiva delle giacenze, usando timestamp UTC.
- Passa sul badge per un controllo rapido oppure cliccalo per mantenere il dettaglio aperto.
- Il pulsante **Aggiorna verifica** svuota la cache e ricalcola i badge visibili.
- Il pulsante **Apri webapp** apre in una nuova scheda l'indirizzo Giac configurato nell'estensione.

## Stati

- **Gestibile**: tutte le SKU sono disponibili.
- **Scorta protetta**: l'ordine porterebbe una SKU sotto il minimo configurato.
- **Non gestibile**: almeno una SKU è insufficiente o senza riferimento.
- **Fuori dagli stati inclusi**: l'ordine esiste ma non partecipa alla coda.
- **Non sincronizzato**: l'ordine non è ancora presente nella webapp.
- **Giac offline**: la webapp non è raggiungibile o il token non è valido.

## Limiti della beta

- I selettori DOM sono volutamente flessibili, ma un aggiornamento importante del modulo Ordini++ potrebbe richiedere un adattamento.
- Il manifest usa permessi host HTTP/HTTPS ampi perché gli indirizzi di PrestaShop e Giac sono configurabili.
- La cache dell'estensione dura 30 secondi, ma può essere svuotata dal popover.
