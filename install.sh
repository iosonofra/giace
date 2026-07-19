#!/bin/sh
# =============================================================================
#  install.sh — Installazione/Reinstallazione Gestore Giacenze su Alpine Linux
# =============================================================================
# Utilizzo (come root):
#   chmod +x install.sh && ./install.sh
#
# Funziona sia per la prima installazione che in caso di reinstallazione:
# se /opt/giac esiste già, esegue un aggiornamento (git pull) invece del clone.
# =============================================================================

set -e

REPO_URL="https://github.com/iosonofra/giace.git"
APP_DIR="/opt/giac"
APP_USER="giac"
APP_PORT=8000
SERVICE_FILE="/etc/init.d/giac"

echo ""
echo "============================================================"
echo "  Installazione Gestore Giacenze PrestaShop"
echo "============================================================"
echo ""

# ---------- 1. Dipendenze di sistema ----------
echo "[1/6] Installazione dipendenze di sistema..."
apk update -q
apk add --no-cache \
    python3 py3-pip python3-dev \
    gcc g++ musl-dev linux-headers libffi-dev \
    nodejs npm \
    git curl openrc

# ---------- 2. Utente di servizio ----------
echo "[2/6] Creazione utente '$APP_USER'..."
if ! id "$APP_USER" >/dev/null 2>&1; then
    addgroup -S "$APP_USER"
    adduser -S -G "$APP_USER" -h "$APP_DIR" -s /sbin/nologin "$APP_USER"
    echo "  Utente '$APP_USER' creato."
else
    echo "  Utente '$APP_USER' già presente."
fi

# ---------- 3. Codice sorgente ----------
echo "[3/6] Installazione codice sorgente..."
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [ -f "$SCRIPT_DIR/backend/main.py" ]; then
    echo "  Rilevato codice sorgente locale in $SCRIPT_DIR."
    if [ "$SCRIPT_DIR" = "$APP_DIR" ]; then
        echo "  Esecuzione direttamente da $APP_DIR. Nessuna copia necessaria."
    else
        echo "  Copia dei file da $SCRIPT_DIR a $APP_DIR..."
        mkdir -p "$APP_DIR"
        
        # Creiamo le cartelle di destinazione principali
        mkdir -p "$APP_DIR/backend" "$APP_DIR/frontend"
        
        # Copiamo i file della root
        find "$SCRIPT_DIR" -maxdepth 1 -type f ! -name "*.zip" ! -name "*.xlsx" ! -name "*.db" -exec cp -p {} "$APP_DIR/" \;
        
        # Copiamo il backend (escludendo .env o db)
        find "$SCRIPT_DIR/backend" -maxdepth 1 -type f ! -name ".env" ! -name "*.db" -exec cp -p {} "$APP_DIR/backend/" \;
        
        # Copiamo la cartella frontend ricorsivamente
        if [ -d "$SCRIPT_DIR/frontend" ]; then
            # Copiamo package.json e altri file della root frontend
            find "$SCRIPT_DIR/frontend" -maxdepth 1 -type f -exec cp -p {} "$APP_DIR/frontend/" \;
            
            # Copiamo le sottocartelle src, public e dist
            for dir in src public dist; do
                if [ -d "$SCRIPT_DIR/frontend/$dir" ]; then
                    cp -pr "$SCRIPT_DIR/frontend/$dir" "$APP_DIR/frontend/"
                fi
            done
        fi

        # Copiamo le sorgenti delle integrazioni browser usate dagli endpoint di download
        for dir in chrome-extension firefox-extension userscript; do
            if [ -d "$SCRIPT_DIR/$dir" ]; then
                cp -pr "$SCRIPT_DIR/$dir" "$APP_DIR/"
            fi
        done
    fi
else
    # Fallback al clone da git se non ci sono sorgenti locali
    if [ -d "$APP_DIR/.git" ]; then
        echo "  Repository git già presente — eseguo git pull..."
        git -C "$APP_DIR" pull origin main
    else
        if [ -d "$APP_DIR" ]; then
            echo "  Cartella $APP_DIR esistente senza .git — rimozione e reclone..."
            rm -rf "$APP_DIR"
        fi
        echo "  Clone del repository da $REPO_URL in $APP_DIR..."
        git clone "$REPO_URL" "$APP_DIR"
    fi
fi

# Imposta permessi eseguibili sugli script (sicuro anche dopo clone da Windows)
chmod +x "$APP_DIR/install.sh" "$APP_DIR/update.sh"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ---------- 4. Configurazione ambiente ----------
echo "[4/6] Configurazione ambiente..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
    echo "  File backend/.env creato (modalità simulazione attiva)."
    echo "  Configura URL e chiave API PrestaShop dalla pagina Impostazioni."
else
    echo "  backend/.env già presente — lasciato invariato."
fi

mkdir -p "$APP_DIR/backups"

# ---------- 5. Dipendenze Python + Build frontend ----------
echo "[5/6] Dipendenze Python e build frontend..."
pip3 install --break-system-packages --no-cache-dir -r "$APP_DIR/backend/requirements.txt"

cd "$APP_DIR/frontend"
npm install
npm run build
cd "$APP_DIR"

# ---------- 6. Servizio OpenRC ----------
echo "[6/6] Creazione servizio OpenRC..."
cat > "$SERVICE_FILE" << INITEOF
#!/sbin/openrc-run

name="giac"
description="Gestore Giacenze PrestaShop"
directory="$APP_DIR"
command="/usr/bin/uvicorn"
command_args="backend.main:app --host 0.0.0.0 --port $APP_PORT"
command_user="$APP_USER"
command_background=true
pidfile="/run/giac.pid"
stdout_log="/var/log/giac.log"
stderr_log="/var/log/giac.log"

depend() {
    need net
}

start_pre() {
    export PYTHONPATH="$APP_DIR"
    if [ -f "$APP_DIR/backend/.env" ]; then
        set -a; . "$APP_DIR/backend/.env"; set +a
    fi
}
INITEOF

chmod +x "$SERVICE_FILE"

# Riavvia se già attivo, altrimenti avvia per la prima volta
if rc-service giac status >/dev/null 2>&1; then
    echo "  Servizio già presente — riavvio..."
    rc-service giac restart
else
    rc-update add giac default 2>/dev/null || true
    rc-service giac start
fi

echo ""
echo "============================================================"
echo "  Installazione completata!"
echo "  Accedi su: http://$(hostname -i 2>/dev/null || echo '<IP-SERVER>'):$APP_PORT"
echo ""
echo "  La webapp parte in modalità simulazione."
echo "  Vai su Impostazioni per configurare PrestaShop:"
echo "  le credenziali vengono scritte automaticamente in backend/.env"
echo ""
echo "  Aggiornamenti futuri:"
echo "    cd $APP_DIR && ./update.sh"
echo "============================================================"
echo ""
