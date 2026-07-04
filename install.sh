#!/bin/sh
# =============================================================================
#  install.sh — Prima installazione su Alpine Linux (Proxmox LXC)
# =============================================================================
# Utilizzo (come root):
#   chmod +x install.sh && ./install.sh
#
# Prima di eseguire, aggiorna la variabile REPO_URL con il tuo repository.
# =============================================================================

set -e

REPO_URL="https://github.com/TUO_USERNAME/giac.git"   # <-- cambia qui
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
fi

# ---------- 3. Clone repository ----------
echo "[3/6] Clone del repository in $APP_DIR..."
git clone "$REPO_URL" "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ---------- 4. Configurazione ambiente ----------
echo "[4/6] Configurazione ambiente..."
cd "$APP_DIR"
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "  File backend/.env creato (modalità simulazione attiva)."
    echo "  Le impostazioni (URL PrestaShop, chiave API, ecc.) si configurano"
    echo "  direttamente dalla pagina Impostazioni dell'interfaccia web."
fi

# Crea cartella backups
mkdir -p "$APP_DIR/backups"

# ---------- 5. Dipendenze Python + Build frontend ----------
echo "[5/6] Installazione dipendenze Python..."
pip3 install --break-system-packages --no-cache-dir -r backend/requirements.txt

echo "  Build frontend..."
cd frontend && npm install && npm run build && cd ..

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
rc-update add giac default
rc-service giac start

echo ""
echo "============================================================"
echo "  Installazione completata!"
echo "  Accedi su: http://$(hostname -i):$APP_PORT"
echo ""
echo "  All'avvio la webapp è in modalità simulazione (MOCK_MODE=True)."
echo "  Vai su Impostazioni per inserire URL e chiave API PrestaShop:"
echo "  le credenziali vengono salvate nel database e scritte"
echo "  automaticamente in backend/.env."
echo "============================================================"
echo ""
