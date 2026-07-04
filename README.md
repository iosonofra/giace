# Gestore Giacenze PrestaShop

Applicazione web per la gestione delle giacenze di magazzino integrate con PrestaShop.

---

## Installazione (Alpine Linux su Proxmox LXC)

### Prima installazione

```bash
# 1. Scarica lo script di installazione
wget https://raw.githubusercontent.com/TUO_USERNAME/giac/main/install.sh

# 2. Modifica la variabile REPO_URL nello script con la tua URL GitHub
nano install.sh

# 3. Esegui l'installazione (come root)
chmod +x install.sh && ./install.sh
```

Al termine l'app si avvia automaticamente in **modalità simulazione** (nessuna connessione PrestaShop).  
Apri il browser su `http://<IP-SERVER>:8000`, vai su **Impostazioni** e inserisci URL e chiave API PrestaShop:  
le credenziali vengono salvate nel database **e scritte automaticamente in `backend/.env`** — non serve `nano`.

### Aggiornamento

```bash
cd /opt/giac
./update.sh
```

`update.sh` fa esattamente questo:
1. **Backup automatico del database** → `/opt/giac/backups/inventory_TIMESTAMP.db`
2. `git pull` — aggiorna solo il codice (mai `.env` o il database)
3. `pip install -r requirements.txt` — aggiorna dipendenze Python
4. `npm install && npm run build` — ricompila il frontend
5. Riavvia il servizio

---

## Configurazione — `backend/.env`

Copia il template e compila i tuoi valori:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

| Variabile | Descrizione |
|---|---|
| `PRESTASHOP_URL` | URL API PrestaShop (es. `https://mionegozio.it/api/`) |
| `PRESTASHOP_API_KEY` | Chiave Webservice PrestaShop |
| `MOCK_MODE` | `True` = dati simulati, `False` = connessione reale |
| `DATABASE_URL` | Lascia `sqlite:///./inventory.db` |
| `DEFAULT_STATE_IDS` | ID stati ordine da includere nel calcolo (es. `12`) |

> ⚠️ Il file `backend/.env` non viene mai committato su Git (escluso dal `.gitignore`).

---

## File protetti dagli aggiornamenti

Questi file sono nel `.gitignore` e **non vengono mai toccati** da `git pull`:

| File | Contenuto |
|---|---|
| `backend/.env` | Configurazione e credenziali |
| `inventory.db` | Database con tutti i dati |
| `*.xlsx` | File giacenze caricati manualmente |

---

## Comandi utili

```bash
rc-service giac start       # avvia
rc-service giac stop        # ferma
rc-service giac restart     # riavvia
rc-service giac status      # stato
tail -f /var/log/giac.log   # log in tempo reale
```

---

## Struttura del progetto

```
giac/
├── backend/
│   ├── main.py              # FastAPI — tutti gli endpoint
│   ├── models.py            # Modelli SQLAlchemy
│   ├── database.py          # Connessione database
│   ├── calculator.py        # Calcolo giacenze/impegni
│   ├── excel_parser.py      # Parser Excel (giacenze, associazioni)
│   ├── prestashop_client.py # Client PrestaShop Webservice
│   ├── requirements.txt     # Dipendenze Python
│   └── .env.example         # Template configurazione
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # App React principale
│   │   └── index.css        # Stili
│   ├── package.json
│   └── vite.config.js
├── start.py                 # Launcher locale (sviluppo)
├── install.sh               # Script prima installazione Alpine
├── update.sh                # Script aggiornamento (git pull + build)
└── .env.example             # Vedi backend/.env.example
```
