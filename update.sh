#!/bin/sh
# =============================================================================
#  update.sh — Aggiornamento Gestore Giacenze
# =============================================================================
# Utilizzo (da /opt/giac, come root):
#   ./update.sh
#
# Cosa fa:
#   1. Backup automatico del database (non verrà mai toccato dal git pull,
#      ma lo salviamo comunque per sicurezza)
#   2. git pull — aggiorna solo il codice sorgente
#   3. pip install — aggiorna dipendenze Python se necessario
#   4. npm install + npm run build — aggiorna e ricompila il frontend
#   5. Riavvia il servizio
#
# File MAI toccati dall'aggiornamento (esclusi da git):
#   - backend/.env       (configurazione sensibile)
#   - inventory.db       (database con tutti i dati)
#   - *.xlsx             (file giacenze caricati)
# =============================================================================

set -e

APP_DIR="/opt/giac"
DB_FILE="$APP_DIR/inventory.db"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

cd "$APP_DIR"

echo ""
echo "============================================================"
echo "  Aggiornamento Gestore Giacenze — $TIMESTAMP"
echo "============================================================"
echo ""

# ---------- 1. Backup database ----------
echo "[1/4] Backup database..."
if [ -f "$DB_FILE" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$DB_FILE" "$BACKUP_DIR/inventory_$TIMESTAMP.db"
    echo "  OK — backup salvato in: $BACKUP_DIR/inventory_$TIMESTAMP.db"
    # Mantieni solo gli ultimi 10 backup
    ls -t "$BACKUP_DIR"/inventory_*.db 2>/dev/null | tail -n +11 | xargs -r rm -f
    echo "  Backup precedenti rimossi (mantiene ultimi 10)"
else
    echo "  Nessun database trovato — primo avvio?"
fi

# ---------- 2. Aggiornamento codice ----------
if [ -d ".git" ]; then
    echo "[2/4] git pull — aggiornamento codice..."
    # Il .gitignore protegge .env, *.db e *.xlsx: non verranno mai sovrascritti
    git pull origin main
    echo "  OK — codice aggiornato"
else
    echo "[2/4] Installazione offline/zip — salto git pull (i file sono già stati aggiornati tramite estrazione)"
fi

# ---------- 3. Dipendenze Python ----------
echo "[3/4] Aggiornamento dipendenze Python..."
pip3 install --break-system-packages --no-cache-dir -r backend/requirements.txt
echo "  OK"

# ---------- 4. Build frontend ----------
echo "[4/4] npm install + build frontend..."
cd frontend
npm install
npm run build
cd ..
echo "  OK — frontend ricompilato"

# ---------- Riavvio servizio ----------
echo ""
echo "Riavvio servizio..."
rc-service giac restart
echo ""
echo "============================================================"
echo "  Aggiornamento completato!"
echo "  Database preservato in: $DB_FILE"
echo "  Backup di questa versione: $BACKUP_DIR/inventory_$TIMESTAMP.db"
echo "  Accedi su: http://$(hostname -i):8000"
echo "============================================================"
echo ""
