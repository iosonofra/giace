# Piano dettagliato per la web app di giacenza e disponibilità prodotti composti

## Obiettivo del progetto

La web app deve calcolare la disponibilità reale dei prodotti finali venduti su PrestaShop partendo da due file locali presenti nella cartella di lavoro, `giacenza.xlsx` e `associazione.xlsx`, e dagli ordini letti tramite Webservice PrestaShop.[cite:25][cite:28]

La logica di business è definita in modo preciso: negli ordini compare il `product_id` finale, che coincide con l'ID presente nel file associazioni; dal calcolo devono essere considerati solo gli ordini nello stato “magazzino rosate”; nel file giacenza ogni SKU è presente una sola volta; le SKU delle associazioni coincidono esattamente con il campo `Sku` del file giacenza.[cite:28]

L'obiettivo operativo non è solo visualizzare lo stock per SKU, ma determinare quanti prodotti composti sono ancora vendibili in base alla disponibilità residua delle SKU che li compongono.[cite:28]

## File di input

### `giacenza.xlsx`

Il file `giacenza.xlsx` contiene almeno queste colonne:

- `Sku` — chiave tecnica principale per tutte le join.
- `Qta Tot.` — quantità fisica disponibile.
- `Descrizione Sku` — metadato opzionale per UI e ricerca.
- `LOTTO` — metadato opzionale, non necessario per il calcolo principale.

Per il motore di calcolo, i soli campi obbligatori sono `Sku` e `Qta Tot.`. Le altre colonne vanno importate solo come informazioni accessorie.[cite:1]

### `associazione.xlsx`

Il file `associazione.xlsx` è strutturato in forma compatta:

- colonna A = `product_id` del prodotto finale;
- colonna B = elenco SKU separate da virgola;
- se una SKU compare più volte nella cella, la ripetizione rappresenta la quantità richiesta di quella SKU nel prodotto composto.[cite:28]

Esempio logico:

- `609287 | CL5000M79/3E,CL2000UW35E,CL2000UW35E,CL2000UW35E`

corrisponde a:

- `CL5000M79/3E` quantità richiesta 1;
- `CL2000UW35E` quantità richiesta 3.[cite:28]

## Regole di business

Le regole di business da implementare sono le seguenti:

1. La giacenza fisica è determinata esclusivamente dal file `giacenza.xlsx`.[cite:1]
2. Gli ordini vengono letti dal Webservice PrestaShop tramite la risorsa `orders`, che espone anche il `current_state` e il dettaglio delle righe ordine nelle `order_rows`.[cite:25][cite:28]
3. Devono essere sottratti solo gli ordini nello stato “magazzino rosate”; operativamente, ciò significa filtrare gli ordini in base al valore di `current_state`, che PrestaShop espone via Webservice e consente anche di filtrare lato API.[cite:33][cite:40]
4. Ogni riga ordine contiene il `product_id` finale del prodotto venduto, non la SKU singola.[cite:28]
5. Il `product_id` dell'ordine va espanso nelle SKU componenti usando il file `associazione.xlsx` normalizzato.[cite:28]
6. La quantità impegnata di ciascuna SKU è la somma del consumo generato dagli ordini validi.[cite:1]
7. La disponibilità finale del prodotto composto è il minimo tra i rapporti tra residuo SKU e quantità richiesta della SKU nel bundle.[cite:1]

Formula operativa:

- `qty_residual_sku = qty_total_sku - qty_committed_sku`
- `qty_available_product = min(floor(qty_residual_sku / qty_required_component))`

## Obiettivi funzionali della web app

La web app deve coprire almeno queste funzioni:

- import manuale di `giacenza.xlsx`;
- import manuale di `associazione.xlsx`;
- sincronizzazione ordini PrestaShop via Webservice;
- calcolo dell'impegnato per SKU;
- calcolo del residuo per SKU;
- calcolo della disponibilità per prodotto composto;
- visualizzazione di anomalie e mismatch;
- esportazione dei risultati in CSV o XLSX.[cite:25][cite:28][cite:1]

## Architettura proposta

### Stack consigliato

Per un'applicazione interna orientata a rapidità di sviluppo e manutenzione, è consigliata un'architettura con:

- backend `Node.js` con `Fastify` oppure `Python` con `FastAPI`;
- frontend React o Vue per dashboard e tabelle;
- database PostgreSQL per storico import, snapshot di calcolo e audit;
- job schedulato per sincronizzazione ordini e ricalcolo periodico.[cite:1]

Dato il contesto tecnico del progetto e la necessità di gestire import di file Excel, parsing, API esterne e query SQL leggibili, PostgreSQL è la scelta più solida per la prima versione produttiva.[cite:1]

### Moduli applicativi

L'app può essere divisa in questi moduli:

1. **Import stock** — gestione `giacenza.xlsx`.
2. **Import associazioni** — gestione `associazione.xlsx`.
3. **Connettore PrestaShop** — lettura ordini e righe ordine da Webservice.[cite:25][cite:28]
4. **Motore di calcolo** — genera impegnato SKU, residui e disponibilità prodotto.
5. **Dashboard** — visualizzazione dati operativi.
6. **Audit e anomalie** — monitoraggio qualità dati.
7. **Export** — download dei risultati filtrati.[cite:1]

## Modello dati

Il sistema deve normalizzare i file sorgente in un modello relazionale.

### Tabelle principali

#### `warehouse_stock`

Contiene lo snapshot della giacenza corrente per SKU.

Campi consigliati:

- `sku` (PK logica)
- `description`
- `lotto`
- `qty_total`
- `import_batch_id`
- `imported_at`

#### `product_components`

Contiene l'esplosione relazionale di `associazione.xlsx`.

Campi consigliati:

- `product_id`
- `sku`
- `qty_required`
- `source_row`
- `import_batch_id`
- `imported_at`

#### `prestashop_orders`

Snapshot locale degli ordini sincronizzati da PrestaShop.

Campi consigliati:

- `order_id`
- `current_state`
- `current_state_label`
- `date_add`
- `date_upd`
- `synced_at`

#### `prestashop_order_lines`

Dettaglio delle righe ordine lette dalle `order_rows`.[cite:28]

Campi consigliati:

- `order_id`
- `line_id`
- `product_id`
- `product_attribute_id`
- `product_reference`
- `product_quantity`

#### `calc_runs`

Registro dei ricalcoli eseguiti.

Campi consigliati:

- `calc_run_id`
- `warehouse_batch_id`
- `associations_batch_id`
- `started_at`
- `completed_at`
- `status`

#### `sku_commitments`

Risultato del calcolo dell'impegnato e del residuo per SKU.

Campi consigliati:

- `calc_run_id`
- `sku`
- `qty_committed`
- `qty_total`
- `qty_residual`

#### `product_availability`

Risultato del calcolo della disponibilità dei prodotti finali.

Campi consigliati:

- `calc_run_id`
- `product_id`
- `qty_available`
- `limiting_sku`

#### `import_anomalies`

Tabella tecnica per anomalie di import e mapping.

Campi consigliati:

- `source`
- `record_key`
- `anomaly_type`
- `message`
- `created_at`

## Parsing dei file

### Parsing di `giacenza.xlsx`

Regole:

1. Leggere il foglio principale.
2. Individuare le colonne `Sku` e `Qta Tot.`.
3. Normalizzare il valore di `Sku` con trim degli spazi laterali.
4. Convertire `Qta Tot.` in numero.
5. Importare `Descrizione Sku` e `LOTTO` solo se presenti.
6. Scartare o segnalare righe senza SKU o con quantità non numerica.
7. Salvare uno snapshot completo legato a un `import_batch_id`.[cite:1]

Poiché ogni SKU nel file giacenza è unica, non è necessario implementare logiche di consolidamento dei duplicati come regola principale, ma un controllo difensivo va comunque mantenuto per sicurezza.[cite:1]

### Parsing di `associazione.xlsx`

Regole:

1. Leggere colonna A come `product_id`.
2. Leggere colonna B come stringa SKU grezza.
3. Eseguire split su `,`.
4. Eseguire trim su ciascuna SKU.
5. Eliminare valori vuoti.
6. Contare le occorrenze di ciascuna SKU nella riga.
7. Salvare una riga normalizzata per coppia `product_id + sku` con `qty_required` pari al numero di occorrenze.[cite:28]

Esempio di trasformazione:

| product_id | valore sorgente | output normalizzato |
|---|---|---|
| 609286 | `CL5000M79/3E,CL2000UW35E,CL2000UW35E,CL2000UW26E` | `CL5000M79/3E=1`, `CL2000UW35E=2`, `CL2000UW26E=1` |
| 609287 | `CL5000M79/3E,CL2000UW35E,CL2000UW35E,CL2000UW35E` | `CL5000M79/3E=1`, `CL2000UW35E=3` |

## Integrazione PrestaShop

La sincronizzazione ordini deve usare il Webservice PrestaShop con autenticazione tramite chiave e risorsa `orders`.[cite:25]

La risorsa ordini espone i campi utili al progetto, inclusi `current_state` e le associazioni delle righe ordine (`order_rows`), che permettono di risalire al `product_id` ordinato e alla quantità.[cite:25][cite:28]

### Strategia di sincronizzazione

1. Recuperare gli ordini aggiornati in una finestra temporale o tramite sincronizzazione completa iniziale.[cite:25]
2. Filtrare gli ordini per `current_state`, includendo solo lo stato “magazzino rosate”. PrestaShop supporta filtri per `current_state` nel Webservice.[cite:33]
3. Salvare ordini e righe ordine nel database locale.
4. Eseguire il ricalcolo su dati locali per non dipendere dal Webservice in tempo reale.[cite:1]

### Configurazione dello stato ordine

Lo stato “magazzino rosate” deve essere gestito come configurazione, non hardcoded nel codice applicativo. La configurazione minima deve includere:

- `included_order_state_ids`
- `included_order_state_labels`

Questo perché il `current_state` in PrestaShop è gestito tramite ID e la lista degli stati è esposta separatamente come risorsa `order_states`.[cite:40]

## Motore di calcolo

Il motore di calcolo deve essere indipendente dall'import e dalla sincronizzazione API, così da poter essere rilanciato in ogni momento su snapshot già importati.[cite:1]

### Fase 1: calcolo impegnato per SKU

Per ogni riga ordine valida:

1. Leggere `product_id` e `product_quantity` dalla riga ordine.[cite:28]
2. Recuperare i componenti del prodotto da `product_components`.
3. Per ogni componente, calcolare:
   - `component_qty_committed = qty_required * product_quantity`
4. Aggregare il consumo totale per SKU.

### Fase 2: calcolo residuo per SKU

Per ogni SKU della giacenza:

1. Leggere `qty_total`.
2. Cercare l'impegnato aggregato in `sku_commitments`.
3. Se la SKU non è impegnata, usare zero.
4. Calcolare `qty_residual = qty_total - qty_committed`.
5. Salvare il risultato.

### Fase 3: calcolo disponibilità prodotto finale

Per ogni `product_id` presente nelle associazioni:

1. Recuperare le SKU componenti.
2. Per ogni componente, leggere il `qty_residual` della SKU.
3. Calcolare il rapporto `floor(qty_residual / qty_required)`.
4. Prendere il minimo tra i rapporti ottenuti.
5. Salvare quel valore come `qty_available` del prodotto.
6. Memorizzare anche la `limiting_sku`, cioè la SKU che determina il minimo.[cite:1]

## Esempio di algoritmo

```text
runCalculation(warehouseBatchId, associationsBatchId):
  validOrders = loadPrestashopOrdersByState("magazzino rosate")
  componentsMap = loadProductComponents(associationsBatchId)
  stockMap = loadWarehouseStock(warehouseBatchId)

  commitments = {}

  for each orderLine in validOrders:
    productId = orderLine.product_id
    orderedQty = orderLine.product_quantity
    components = componentsMap[productId]

    for each component in components:
      commitments[component.sku] += component.qty_required * orderedQty

  for each sku in stockMap:
    qtyTotal = stockMap[sku].qty_total
    qtyCommitted = commitments.get(sku, 0)
    qtyResidual = qtyTotal - qtyCommitted
    saveSkuCommitment(sku, qtyCommitted, qtyTotal, qtyResidual)

  for each productId in componentsMap:
    minAvailable = infinity
    limitingSku = null

    for each component in componentsMap[productId]:
      ratio = floor(getResidual(component.sku) / component.qty_required)
      if ratio < minAvailable:
        minAvailable = ratio
        limitingSku = component.sku

    saveProductAvailability(productId, minAvailable, limitingSku)
```

## Endpoint API consigliati

### Import e sync

- `POST /api/import/warehouse` — importa `giacenza.xlsx`.
- `POST /api/import/associations` — importa `associazione.xlsx`.
- `POST /api/prestashop/sync-orders` — sincronizza ordini da Webservice.[cite:25]
- `POST /api/calc/run` — avvia un ricalcolo completo.

### Lettura dati

- `GET /api/dashboard` — KPI principali.
- `GET /api/stock` — elenco SKU con totale, impegnato e residuo.
- `GET /api/products` — prodotti finali con disponibilità e SKU bloccante.
- `GET /api/orders` — ordini considerati nel calcolo.
- `GET /api/anomalies` — elenco anomalie.[cite:1]

## Interfaccia utente

### Dashboard

La dashboard iniziale deve mostrare:

- numero SKU importate;
- numero prodotti composti;
- ordini nello stato “magazzino rosate” considerati nel calcolo;
- SKU critiche;
- prodotti con disponibilità zero;
- timestamp ultimo import e ultimo ricalcolo.[cite:1]

### Vista Stock

Tabella con colonne consigliate:

- `SKU`
- `Descrizione`
- `Qta totale`
- `Qta impegnata`
- `Qta residua`
- `Numero prodotti collegati`

### Vista Prodotti finali

Tabella con colonne consigliate:

- `Product ID`
- `Componenti SKU`
- `Disponibilità finale`
- `SKU limitante`
- `Dettaglio formula`

### Vista Ordini

Tabella audit con:

- `Order ID`
- `Stato`
- `Data ordine`
- `Product ID`
- `Quantità`
- `SKU generate dal bundle`.[cite:25][cite:28]

### Vista Anomalie

Sezione dedicata per:

- `product_id` presenti negli ordini ma non nelle associazioni;
- SKU presenti nelle associazioni ma assenti nello stock;
- quantità negative;
- errori di parsing file;
- ordini scartati per stato non incluso.[cite:1]

## Sicurezza

La chiave Webservice PrestaShop deve essere usata solo lato backend e mai esposta nel frontend.[cite:25]

La web app deve prevedere almeno:

- autenticazione interna;
- gestione `.env` per URL PrestaShop e chiave Webservice;
- logging degli accessi amministrativi;
- log strutturati per import, sync e ricalcoli.[cite:1]

## Affidabilità e audit

Ogni import e ogni ricalcolo deve essere tracciato con un identificatore univoco di batch o run. Questo consente di sapere sempre quali file e quali ordini hanno prodotto un determinato risultato.[cite:1]

Sono raccomandate queste pratiche:

- non sovrascrivere in cieco i dati precedenti;
- mantenere storico import e ricalcoli;
- permettere il re-run del calcolo su batch precedenti;
- mostrare in UI l'origine del dato visualizzato.[cite:1]

## Piano di sviluppo

### Fase 1 — Setup progetto

- inizializzazione repository;
- configurazione backend, frontend e database;
- configurazione ambiente locale con accesso ai file `giacenza.xlsx` e `associazione.xlsx`;
- definizione variabili ambiente PrestaShop.[cite:1]

### Fase 2 — Import file

- parser Excel per `giacenza.xlsx`;
- parser Excel per `associazione.xlsx`;
- validazione dati;
- salvataggio batch import.[cite:1]

### Fase 3 — Sync ordini

- client Webservice PrestaShop;
- sincronizzazione ordini e `order_rows`;
- filtro per `current_state`;
- salvataggio snapshot locale.[cite:25][cite:28][cite:33]

### Fase 4 — Motore di calcolo

- calcolo impegnato SKU;
- calcolo residui;
- calcolo disponibilità prodotti;
- gestione SKU limitante;
- test con dataset reale.[cite:1]

### Fase 5 — Dashboard

- KPI iniziali;
- tabelle stock/prodotti/ordini/anomalie;
- filtri, ricerca e ordinamenti;
- dettaglio prodotto e dettaglio SKU.[cite:1]

### Fase 6 — Hardening

- logging strutturato;
- gestione errori;
- scheduler automatico;
- export CSV/XLSX;
- test di regressione.[cite:1]

## Checklist tecnica

### Backend

- [ ] Parser `giacenza.xlsx`
- [ ] Parser `associazione.xlsx`
- [ ] Client Webservice PrestaShop
- [ ] Persistenza database
- [ ] Servizio calcolo disponibilità
- [ ] API REST
- [ ] Gestione batch e storico
- [ ] Logging ed error handling

### Frontend

- [ ] Login interno
- [ ] Dashboard KPI
- [ ] Vista stock SKU
- [ ] Vista prodotti finali
- [ ] Vista ordini
- [ ] Vista anomalie
- [ ] Filtri ed export

### DevOps

- [ ] File `.env`
- [ ] Migrazioni database
- [ ] Backup DB
- [ ] Scheduler ricalcolo
- [ ] Deployment ambiente interno

## Deliverable del progetto

Al termine dello sviluppo, la web app deve consentire di:

- leggere i file `giacenza.xlsx` e `associazione.xlsx` direttamente dalla cartella di lavoro;
- sincronizzare gli ordini validi da PrestaShop via Webservice.[cite:25]
- calcolare automaticamente stock impegnato, residuo SKU e disponibilità prodotto;
- mostrare la SKU limitante per ogni prodotto composto;
- auditare anomalie e differenze;
- esportare i risultati per uso operativo.[cite:1]

## Evoluzioni future

Una volta stabilizzato il MVP, si possono introdurre:

- sincronizzazione automatica pianificata;
- alert su prodotti in esaurimento;
- confronto tra disponibilità calcolata e stock pubblicato su PrestaShop;
- scrittura di ritorno verso lo stock di PrestaShop usando le risorse di stock quando necessario.[cite:25]
