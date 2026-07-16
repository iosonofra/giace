import os
import io
import json
import logging
import hashlib
import zipfile
import requests
import threading
import time
import re
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, inspect, text

# Import our backend modules
from backend.database import engine, Base, get_db
from backend.models import (
    ImportBatch, WarehouseStock, ProductComponent,
    PrestashopOrder, PrestashopOrderLine, CalcRun,
    SkuCommitment, ProductAvailability, ImportAnomaly,
    AppSetting
)
from backend.excel_parser import parse_warehouse_excel, parse_associations_excel, get_excel_sheets, parse_picking_orders_excel
from backend.prestashop_client import PrestaShopClient
from backend.calculator import run_calculation
from backend.picking_rules import is_ignored_picking_sku

# Initialize logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Progress Tracker for PrestaShop Order Sincronizzazione
class SyncProgress:
    def __init__(self):
        self.active = False
        self.total_orders = 0
        self.synced_orders = 0
        self.phase = "idle"  # "idle", "fetching_orders", "fetching_customers", "saving", "calculating", "completed", "error"
        self.error_message = ""

    def start(self):
        self.active = True
        self.total_orders = 0
        self.synced_orders = 0
        self.phase = "fetching_orders"
        self.error_message = ""

    def update(self, phase=None, synced_orders=None, total_orders=None, error_message=None):
        if phase:
            self.phase = phase
        if synced_orders is not None:
            self.synced_orders = synced_orders
        if total_orders is not None:
            self.total_orders = total_orders
        if error_message:
            self.error_message = error_message
            self.phase = "error"

    def stop(self, success=True, error_msg=None):
        self.active = False
        if success:
            self.phase = "completed"
        else:
            self.phase = "error"
            self.error_message = error_msg or "Errore sconosciuto"

sync_progress = SyncProgress()
google_sheets_sync_lock = threading.Lock()
prestashop_sync_lock = threading.Lock()
AUTO_SYNC_CHECK_SECONDS = 5

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _parse_setting_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)

def _utc_iso(value) -> Optional[str]:
    if not value:
        return None
    if isinstance(value, datetime):
        parsed = value
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    try:
        parsed = _parse_setting_datetime(str(value))
        return parsed.isoformat() if parsed else None
    except Exception:
        return None

def _get_setting_int(db: Session, key: str, default: int = 10, minimum: int = 1) -> int:
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting and setting.value and setting.value.isdigit():
        return max(int(setting.value), minimum)
    return default

def _auto_sync_delay_seconds(db: Session, interval_key: str, last_sync_key: str) -> float:
    interval_mins = _get_setting_int(db, interval_key)
    last_sync_setting = db.query(AppSetting).filter(AppSetting.key == last_sync_key).first()
    try:
        last_sync = _parse_setting_datetime(last_sync_setting.value if last_sync_setting else "")
    except Exception:
        return 0
    if not last_sync:
        return 0
    next_sync_at = last_sync + timedelta(minutes=interval_mins)
    return max(0.0, (next_sync_at - datetime.now(timezone.utc)).total_seconds())

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

# create_all non aggiunge colonne alle tabelle esistenti. Manteniamo compatibili
# anche le installazioni gia avviate senza introdurre un sistema di migrazioni.
if "product_name" not in {column["name"] for column in inspect(engine).get_columns("prestashop_order_lines")}:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE prestashop_order_lines ADD COLUMN product_name VARCHAR(255)"))

if "order_id" not in {column["name"] for column in inspect(engine).get_columns("import_anomalies")}:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE import_anomalies ADD COLUMN order_id INTEGER"))

app = FastAPI(title="PrestaShop Composite Inventory Manager API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get PrestaShop Client
def get_ps_client(db: Session = Depends(get_db)) -> PrestaShopClient:
    url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_url").first()
    key_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_api_key").first()
    mock_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_mock_mode").first()
    
    url = url_setting.value if url_setting else os.getenv("PRESTASHOP_URL", "")
    key = key_setting.value if key_setting else os.getenv("PRESTASHOP_API_KEY", "")
    
    if mock_setting:
        mock_env = mock_setting.value.lower() in ("true", "1", "yes")
    else:
        mock_env = os.getenv("MOCK_MODE", "True").lower() in ("true", "1", "yes")
    
    return PrestaShopClient(url=url, api_key=key, mock_mode=mock_env)

from backend.database import SessionLocal

def convert_google_sheets_url(url: str) -> str:
    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
    if not match:
        raise ValueError("URL di Google Sheets non valido. Assicurati che contenga '/spreadsheets/d/{id}'.")
    spreadsheet_id = match.group(1)
    
    gid_match = re.search(r'[#&]gid=([0-9]+)', url)
    if gid_match:
        gid = gid_match.group(1)
        return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=xlsx&gid={gid}"
    
    return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=xlsx"

def sync_stock_from_google_sheets(db: Session, force: bool = False) -> dict:
    if not google_sheets_sync_lock.acquire(blocking=False):
        return {
            "status": "skipped",
            "message": "Sincronizzazione Google Sheets già in corso."
        }
    try:
        source_setting = db.query(AppSetting).filter(AppSetting.key == "stock_source").first()
        url_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_url").first()
        sheet_name_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_name").first()
        hash_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_hash").first()

        # Load mapping settings
        m_sku_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_sku").first()
        m_qty_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_qty").first()
        m_desc_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_desc").first()
        m_lotto_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_lotto").first()

        col_sku = m_sku_setting.value if m_sku_setting else "Sku"
        col_qty = m_qty_setting.value if m_qty_setting else "Qta Tot."
        col_desc = m_desc_setting.value if m_desc_setting else "Descrizione Sku"
        col_lotto = m_lotto_setting.value if m_lotto_setting else "Lotto"

        source = source_setting.value if source_setting else "local_upload"
        url = url_setting.value if url_setting else ""
        sheet_name = sheet_name_setting.value if sheet_name_setting else "ROSATE"
        old_hash = hash_setting.value if hash_setting else ""

        if not url:
            raise ValueError("L'URL del Google Sheet non è impostato nelle impostazioni.")

        try:
            export_url = convert_google_sheets_url(url)
        except Exception as e:
            raise ValueError(f"URL di Google Sheets non valido: {str(e)}")

        try:
            response = requests.get(export_url, timeout=30)
            if response.status_code != 200:
                raise ValueError(f"HTTP {response.status_code} durante il download dal Google Sheet.")
            file_content = response.content
        except Exception as e:
            raise ValueError(f"Errore nella connessione/scaricamento del Google Sheet: {str(e)}")

        new_hash = hashlib.md5(file_content).hexdigest()

        if new_hash == old_hash and not force:
            # Update google_sheet_last_sync to prevent repeated polling when skipped
            setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_sync").first()
            if setting:
                setting.value = _utc_now_iso()
            else:
                db.add(AppSetting(key="google_sheet_last_sync", value=_utc_now_iso()))
            db.commit()

            return {
                "status": "skipped",
                "message": "Nessun cambiamento rilevato nel Google Sheet rispetto all'ultimo calcolo.",
                "hash": new_hash
            }

        try:
            valid_rows, anomalies = parse_warehouse_excel(
                file_content,
                sheet_name,
                col_sku=col_sku,
                col_qty=col_qty,
                col_desc=col_desc,
                col_lotto=col_lotto
            )
        except Exception as e:
            raise ValueError(f"Errore nel parsing del Google Sheet: {str(e)}")

        db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse").update({ImportBatch.is_active: False})

        batch = ImportBatch(
            file_type="warehouse",
            filename="Google Sheet Sincronizzato",
            sheet_name=sheet_name,
            record_count=len([r for r in valid_rows if not r["sku"].startswith("__spacer_")]),
            is_active=True
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)

        stock_items = []
        for r in valid_rows:
            stock_items.append(WarehouseStock(
                import_batch_id=batch.id,
                sku=r["sku"],
                description=r["description"],
                lotto=r["lotto"],
                qty_total=r["qty_total"]
            ))

        db.bulk_save_objects(stock_items)

        # Save anomalies
        for an in anomalies:
            db.add(ImportAnomaly(
                source=an["source"],
                record_key=an["record_key"],
                anomaly_type=an["anomaly_type"],
                message=an["message"]
            ))

        for key, val in [
            ("google_sheet_hash", new_hash),
            ("google_sheet_last_sync", _utc_now_iso()),
            ("google_sheet_last_error", "")
        ]:
            setting = db.query(AppSetting).filter(AppSetting.key == key).first()
            if setting:
                setting.value = val
            else:
                db.add(AppSetting(key=key, value=val))

        db.commit()

        try:
            run_calculation(db, warehouse_batch_id=batch.id)
        except Exception as calc_err:
            logger.error(f"Errore nel calcolo automatico dopo sincronizzazione Google Sheet: {calc_err}")

        return {
            "status": "success",
            "batch_id": batch.id,
            "records_imported": len([r for r in valid_rows if not r["sku"].startswith("__spacer_")]),
            "hash": new_hash
        }
    finally:
        google_sheets_sync_lock.release()

def google_sheets_polling_worker():
    logger.info("Google Sheets polling worker avviato.")
    while True:
        sleep_seconds = AUTO_SYNC_CHECK_SECONDS
        db = SessionLocal()
        try:
            source_setting = db.query(AppSetting).filter(AppSetting.key == "stock_source").first()
            if source_setting and source_setting.value == "google_sheets":
                delay_seconds = _auto_sync_delay_seconds(
                    db,
                    "google_sheet_sync_interval",
                    "google_sheet_last_sync"
                )
                if delay_seconds <= 0:
                    logger.info("Avvio sincronizzazione automatica da Google Sheets...")
                    try:
                        res = sync_stock_from_google_sheets(db, force=False)
                        logger.info(f"Sincronizzazione automatica completata: {res}")
                    except Exception as sync_err:
                        logger.error(f"Errore nella sincronizzazione automatica Google Sheets: {sync_err}")
                        err_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_error").first()
                        if err_setting:
                            err_setting.value = str(sync_err)
                        else:
                            db.add(AppSetting(key="google_sheet_last_error", value=str(sync_err)))
                        db.commit()
                    sleep_seconds = AUTO_SYNC_CHECK_SECONDS
                else:
                    sleep_seconds = min(delay_seconds, AUTO_SYNC_CHECK_SECONDS)
        except Exception as loop_err:
            logger.error(f"Errore nel ciclo del worker Google Sheets: {loop_err}")
        finally:
            db.close()
        time.sleep(sleep_seconds)

def prestashop_orders_polling_worker():
    logger.info("PrestaShop orders polling worker avviato.")
    while True:
        sleep_seconds = AUTO_SYNC_CHECK_SECONDS
        db = SessionLocal()
        try:
            delay_seconds = _auto_sync_delay_seconds(
                db,
                "prestashop_sync_interval",
                "prestashop_last_sync"
            )
            if delay_seconds <= 0:
                logger.info("Avvio sincronizzazione automatica ordini da PrestaShop...")
                try:
                    client = get_ps_client(db)
                    res = sync_orders_internal(db, client, force=False)
                    logger.info(f"Sincronizzazione automatica ordini completata: {res}")
                except Exception as sync_err:
                    logger.error(f"Errore nella sincronizzazione automatica ordini: {sync_err}")
                sleep_seconds = AUTO_SYNC_CHECK_SECONDS
            else:
                sleep_seconds = min(delay_seconds, AUTO_SYNC_CHECK_SECONDS)
        except Exception as loop_err:
            logger.error(f"Errore nel ciclo del worker PrestaShop: {loop_err}")
        finally:
            db.close()
        time.sleep(sleep_seconds)

# Initialize default settings if they don't exist
@app.on_event("startup")
def setup_default_settings():
    db = next(get_db())
    try:
        # Check if included_state_ids exists
        state_setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
        if not state_setting:
            default_ids = os.getenv("DEFAULT_STATE_IDS", "12")
            ids_list = [int(x.strip()) for x in default_ids.split(",") if x.strip().isdigit()]
            if not ids_list:
                ids_list = [12] # Default to magazzino rosate
            
            db.add(AppSetting(key="included_state_ids", value=json.dumps(ids_list)))
            
        # Check prestashop_url
        url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_url").first()
        if not url_setting:
            db.add(AppSetting(key="prestashop_url", value=os.getenv("PRESTASHOP_URL", "")))
            
        # Check prestashop_admin_url
        admin_url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_admin_url").first()
        if not admin_url_setting:
            db.add(AppSetting(key="prestashop_admin_url", value=""))
            
        # Check prestashop_api_key
        key_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_api_key").first()
        if not key_setting:
            db.add(AppSetting(key="prestashop_api_key", value=os.getenv("PRESTASHOP_API_KEY", "")))
            
        # Check prestashop_mock_mode
        mock_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_mock_mode").first()
        if not mock_setting:
            default_mock = os.getenv("MOCK_MODE", "True").lower() in ("true", "1", "yes")
            db.add(AppSetting(key="prestashop_mock_mode", value="true" if default_mock else "false"))
            
        # Google Sheet Sync Settings initialization
        if not db.query(AppSetting).filter(AppSetting.key == "stock_source").first():
            db.add(AppSetting(key="stock_source", value="local_upload"))
            
        if not db.query(AppSetting).filter(AppSetting.key == "google_sheet_url").first():
            db.add(AppSetting(key="google_sheet_url", value="https://docs.google.com/spreadsheets/d/1F0I-N5IRe7aH0EBsBJK0XT8N0h-R9Gg6/"))
            
        if not db.query(AppSetting).filter(AppSetting.key == "google_sheet_name").first():
            db.add(AppSetting(key="google_sheet_name", value="ROSATE"))
            
        if not db.query(AppSetting).filter(AppSetting.key == "google_sheet_sync_interval").first():
            db.add(AppSetting(key="google_sheet_sync_interval", value="10"))

        # PrestaShop Sync Settings initialization
        if not db.query(AppSetting).filter(AppSetting.key == "prestashop_sync_interval").first():
            db.add(AppSetting(key="prestashop_sync_interval", value="10"))
            
        if not db.query(AppSetting).filter(AppSetting.key == "prestashop_last_sync").first():
            db.add(AppSetting(key="prestashop_last_sync", value=""))
            
        if not db.query(AppSetting).filter(AppSetting.key == "prestashop_last_error").first():
            db.add(AppSetting(key="prestashop_last_error", value=""))

        # Column Mapping Settings initialization
        if not db.query(AppSetting).filter(AppSetting.key == "mapping_sku").first():
            db.add(AppSetting(key="mapping_sku", value="Sku"))

        if not db.query(AppSetting).filter(AppSetting.key == "mapping_qty").first():
            db.add(AppSetting(key="mapping_qty", value="Qta Tot."))

        if not db.query(AppSetting).filter(AppSetting.key == "mapping_desc").first():
            db.add(AppSetting(key="mapping_desc", value="Descrizione Sku"))

        if not db.query(AppSetting).filter(AppSetting.key == "mapping_lotto").first():
            db.add(AppSetting(key="mapping_lotto", value="Lotto"))

        db.commit()
        logger.info("Impostazioni inizializzate con successo nel database.")
        
        # Start background worker threads
        t = threading.Thread(target=google_sheets_polling_worker, daemon=True)
        t.start()
        logger.info("Thread di polling Google Sheets avviato.")
        
        t_ps = threading.Thread(target=prestashop_orders_polling_worker, daemon=True)
        t_ps.start()
        logger.info("Thread di polling PrestaShop avviato.")
    except Exception as e:
        logger.error(f"Errore nell'inizializzazione delle impostazioni: {e}")
    finally:
        db.close()

# ----------------- STATUS & SETTINGS ENDPOINTS -----------------

@app.get("/api/status")
def get_status(db: Session = Depends(get_db), client: PrestaShopClient = Depends(get_ps_client)):
    # Get active batches
    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    
    latest_calc = db.query(CalcRun).filter(CalcRun.status == "completed").order_by(CalcRun.completed_at.desc()).first()
    
    # Prefer the scheduler checkpoint, because it is updated even when a sync
    # is skipped due to no remote changes.
    p_last_sync_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_sync").first()
    prestashop_last_sync = p_last_sync_setting.value if p_last_sync_setting and p_last_sync_setting.value else None

    # Keep the last data write available separately for diagnostics.
    latest_order = db.query(PrestashopOrder).order_by(PrestashopOrder.synced_at.desc()).first()
    last_orders_data_sync = latest_order.synced_at.isoformat() + "Z" if latest_order and latest_order.synced_at else None
    last_orders_sync = prestashop_last_sync or last_orders_data_sync
    
    # Get last google sheet sync check
    g_last_sync_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_sync").first()
    google_sheet_last_sync = g_last_sync_setting.value if g_last_sync_setting else None
    
    # Check local files presence in working directory
    workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    giacenza_local = os.path.exists(os.path.join(workspace_dir, "giacenza.xlsx"))
    associazione_local = os.path.exists(os.path.join(workspace_dir, "associazione.xlsx"))
    
    # Count prestashop orders in cache
    orders_count = db.query(PrestashopOrder).count()
    
    return {
        "mock_mode": client.mock_mode,
        "prestashop_url": client.url if not client.mock_mode else "Simulato (Mock Mode)",
        "database": "SQLite (attivo)",
        "last_orders_sync": last_orders_sync,
        "last_orders_data_sync": last_orders_data_sync,
        "google_sheet_last_sync": google_sheet_last_sync,
        "prestashop_orders_count": orders_count,
        "active_warehouse_batch": {
            "id": active_w.id if active_w else None,
            "filename": active_w.filename if active_w else None,
            "sheet_name": active_w.sheet_name if active_w else None,
            "imported_at": active_w.imported_at.isoformat() + "Z" if active_w and active_w.imported_at else None,
            "record_count": active_w.record_count if active_w else 0
        } if active_w else None,
        "active_associations_batch": {
            "id": active_a.id if active_a else None,
            "filename": active_a.filename if active_a else None,
            "imported_at": active_a.imported_at.isoformat() + "Z" if active_a and active_a.imported_at else None,
            "record_count": active_a.record_count if active_a else 0
        } if active_a else None,
        "latest_calculation": {
            "id": latest_calc.id,
            "completed_at": latest_calc.completed_at.isoformat() + "Z" if latest_calc and latest_calc.completed_at else None,
            "status": latest_calc.status
        } if latest_calc else None,
        "local_files": {
            "giacenza_exists": giacenza_local,
            "associazione_exists": associazione_local,
            "workspace_path": workspace_dir
        }
    }

@app.get("/api/order-states")
def get_order_states(client: PrestaShopClient = Depends(get_ps_client)):
    return client.get_order_states()

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    state_setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
    url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_url").first()
    admin_url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_admin_url").first()
    key_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_api_key").first()
    mock_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_mock_mode").first()
    extension_token_setting = db.query(AppSetting).filter(AppSetting.key == "extension_api_token").first()
    
    # Google Sheets settings
    source_setting = db.query(AppSetting).filter(AppSetting.key == "stock_source").first()
    g_url_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_url").first()
    g_name_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_name").first()
    g_interval_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_sync_interval").first()
    g_last_sync_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_sync").first()
    g_last_err_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_error").first()
    
    # PrestaShop Sync settings
    p_interval_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_sync_interval").first()
    p_last_sync_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_sync").first()
    p_last_err_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_error").first()

    # Column mapping settings
    m_sku = db.query(AppSetting).filter(AppSetting.key == "mapping_sku").first()
    m_qty = db.query(AppSetting).filter(AppSetting.key == "mapping_qty").first()
    m_desc = db.query(AppSetting).filter(AppSetting.key == "mapping_desc").first()
    m_lotto = db.query(AppSetting).filter(AppSetting.key == "mapping_lotto").first()
    
    included_state_ids = json.loads(state_setting.value) if state_setting else [12]
    prestashop_url = url_setting.value if url_setting else os.getenv("PRESTASHOP_URL", "")
    prestashop_admin_url = admin_url_setting.value if admin_url_setting else ""
    prestashop_api_key = key_setting.value if key_setting else os.getenv("PRESTASHOP_API_KEY", "")
    extension_api_token = (
        extension_token_setting.value
        if extension_token_setting
        else os.getenv("GIAC_EXTENSION_TOKEN", "")
    )
    
    if mock_setting:
        prestashop_mock_mode = mock_setting.value.lower() in ("true", "1", "yes")
    else:
        prestashop_mock_mode = os.getenv("MOCK_MODE", "True").lower() in ("true", "1", "yes")
        
    return {
        "included_state_ids": included_state_ids,
        "prestashop_url": prestashop_url,
        "prestashop_admin_url": prestashop_admin_url,
        "prestashop_api_key": prestashop_api_key,
        "prestashop_mock_mode": prestashop_mock_mode,
        "extension_api_token": extension_api_token,
        "extension_api_token_configured": bool(extension_api_token.strip()),
        # Google Sheets
        "stock_source": source_setting.value if source_setting else "local_upload",
        "google_sheet_url": g_url_setting.value if g_url_setting else "",
        "google_sheet_name": g_name_setting.value if g_name_setting else "ROSATE",
        "google_sheet_sync_interval": int(g_interval_setting.value) if (g_interval_setting and g_interval_setting.value.isdigit()) else 10,
        "google_sheet_last_sync": g_last_sync_setting.value if g_last_sync_setting else "",
        "google_sheet_last_error": g_last_err_setting.value if g_last_err_setting else "",
        # PrestaShop Sync
        "prestashop_sync_interval": int(p_interval_setting.value) if (p_interval_setting and p_interval_setting.value.isdigit()) else 10,
        "prestashop_last_sync": p_last_sync_setting.value if p_last_sync_setting else "",
        "prestashop_last_error": p_last_err_setting.value if p_last_err_setting else "",
        # Column mappings
        "mapping_sku": m_sku.value if m_sku else "Sku",
        "mapping_qty": m_qty.value if m_qty else "Qta Tot.",
        "mapping_desc": m_desc.value if m_desc else "Descrizione Sku",
        "mapping_lotto": m_lotto.value if m_lotto else "Lotto"
    }


def _sync_env_file(db: Session):
    """
    Riscrive backend/.env con i valori correnti del database.
    Viene chiamata automaticamente ad ogni salvataggio delle Impostazioni
    così il file rimane sempre allineato — utile al riavvio a freddo del server.
    Valori non presenti nel DB vengono lasciati invariati nel file esistente.
    """
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    example_path = os.path.join(os.path.dirname(__file__), ".env.example")

    # Leggi le righe esistenti (o usa il template se il file non esiste)
    source_path = env_path if os.path.exists(env_path) else example_path
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        lines = []

    # Recupera i valori correnti dal database
    def _db_val(key: str, fallback: str = "") -> str:
        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        return row.value if row else fallback

    db_values = {
        "PRESTASHOP_URL":     _db_val("prestashop_url"),
        "PRESTASHOP_API_KEY": _db_val("prestashop_api_key"),
        "MOCK_MODE":          _db_val("prestashop_mock_mode", "True"),
        "DATABASE_URL":       os.getenv("DATABASE_URL", "sqlite:///./inventory.db"),
        "DEFAULT_STATE_IDS":  _db_val("included_state_ids", ""),
        "GIAC_EXTENSION_TOKEN": _db_val("extension_api_token", os.getenv("GIAC_EXTENSION_TOKEN", "")),
    }

    # Normalizza: MOCK_MODE → "True"/"False"
    mock_raw = db_values["MOCK_MODE"].lower()
    db_values["MOCK_MODE"] = "True" if mock_raw in ("true", "1", "yes") else "False"

    # Normalizza DEFAULT_STATE_IDS: potrebbe essere JSON list "[12, 13]"
    try:
        state_ids_parsed = json.loads(db_values["DEFAULT_STATE_IDS"])
        if isinstance(state_ids_parsed, list):
            db_values["DEFAULT_STATE_IDS"] = ",".join(str(i) for i in state_ids_parsed)
    except Exception:
        pass  # già stringa semplice

    # Riscrivi le righe aggiornando le chiavi trovate
    written_keys = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#") or "=" not in stripped:
            new_lines.append(line)
            continue
        key_part = stripped.split("=", 1)[0].strip()
        if key_part in db_values:
            new_lines.append(f"{key_part}={db_values[key_part]}\n")
            written_keys.add(key_part)
        else:
            new_lines.append(line)

    # Aggiungi le chiavi mancanti in fondo (presenti nel DB ma non nel file)
    for key, val in db_values.items():
        if key not in written_keys and val:
            new_lines.append(f"{key}={val}\n")

    # Scrivi il file
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        logger.info(f"backend/.env aggiornato con le impostazioni correnti.")
    except Exception as e:
        logger.warning(f"Impossibile aggiornare backend/.env: {e}")


@app.post("/api/settings")
def update_settings(payload: dict, db: Session = Depends(get_db)):
    state_ids = payload.get("included_state_ids")
    url = payload.get("prestashop_url")
    admin_url = payload.get("prestashop_admin_url")
    key = payload.get("prestashop_api_key")
    mock_mode = payload.get("prestashop_mock_mode")
    extension_api_token = payload.get("extension_api_token")
    # Google Sheets
    stock_source = payload.get("stock_source")
    google_sheet_url = payload.get("google_sheet_url")
    google_sheet_name = payload.get("google_sheet_name")
    google_sheet_sync_interval = payload.get("google_sheet_sync_interval")
    # PrestaShop
    prestashop_sync_interval = payload.get("prestashop_sync_interval")
    # Column mapping settings
    mapping_sku = payload.get("mapping_sku")
    mapping_qty = payload.get("mapping_qty")
    mapping_desc = payload.get("mapping_desc")
    mapping_lotto = payload.get("mapping_lotto")
    
    # 1. Resolve values to perform validation check
    target_mock = mock_mode
    if target_mock is None:
        mock_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_mock_mode").first()
        if mock_setting:
            target_mock = mock_setting.value.lower() in ("true", "1", "yes")
        else:
            target_mock = os.getenv("MOCK_MODE", "True").lower() in ("true", "1", "yes")
            
    target_url = url
    if target_url is None:
        url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_url").first()
        target_url = url_setting.value if url_setting else os.getenv("PRESTASHOP_URL", "")
        
    target_key = key
    if target_key is None:
        key_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_api_key").first()
        target_key = key_setting.value if key_setting else os.getenv("PRESTASHOP_API_KEY", "")

    # 2. Perform connection validation if mock_mode is set to False
    if not target_mock:
        if not target_url or not target_key:
            raise HTTPException(
                status_code=400,
                detail="Per disattivare la modalità simulazione, devi configurare l'URL del sito e la chiave API di PrestaShop."
            )
        
        # Test connection by fetching states
        clean_url = target_url.rstrip('/') + '/'
        try:
            test_response = requests.get(
                f"{clean_url}order_states",
                params={"display": "[id]", "output_format": "JSON", "ws_key": target_key},
                timeout=8
            )
            test_response.raise_for_status()
        except Exception as conn_err:
            raise HTTPException(
                status_code=400, 
                detail=f"Errore di connessione a PrestaShop: {str(conn_err)}. Controlla l'URL (es: https://mio-sito.com/api) e la Chiave API."
            )

    # 3. Save to database
    # State IDs
    if state_ids is not None:
        if not isinstance(state_ids, list):
            raise HTTPException(status_code=400, detail="Formato non valido. 'included_state_ids' deve essere una lista di interi.")
        try:
            state_ids_parsed = [int(sid) for sid in state_ids]
        except ValueError:
            raise HTTPException(status_code=400, detail="Tutti gli ID degli stati devono essere numeri interi.")
        
        setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
        if not setting:
            db.add(AppSetting(key="included_state_ids", value=json.dumps(state_ids_parsed)))
        else:
            setting.value = json.dumps(state_ids_parsed)

    # URL
    if url is not None:
        if not isinstance(url, str):
            raise HTTPException(status_code=400, detail="L'URL deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_url").first()
        if not setting:
            db.add(AppSetting(key="prestashop_url", value=url.strip()))
        else:
            setting.value = url.strip()

    # Admin URL
    if admin_url is not None:
        if not isinstance(admin_url, str):
            raise HTTPException(status_code=400, detail="L'URL del pannello di amministrazione deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_admin_url").first()
        if not setting:
            db.add(AppSetting(key="prestashop_admin_url", value=admin_url.strip()))
        else:
            setting.value = admin_url.strip()

    # Key
    if key is not None:
        if not isinstance(key, str):
            raise HTTPException(status_code=400, detail="La chiave API deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_api_key").first()
        if not setting:
            db.add(AppSetting(key="prestashop_api_key", value=key.strip()))
        else:
            setting.value = key.strip()

    # Chrome extension API token
    if extension_api_token is not None:
        if not isinstance(extension_api_token, str):
            raise HTTPException(status_code=400, detail="Il token estensione deve essere una stringa.")
        clean_extension_token = extension_api_token.strip()
        if clean_extension_token and len(clean_extension_token) < 16:
            raise HTTPException(
                status_code=400,
                detail="Il token estensione deve contenere almeno 16 caratteri."
            )
        if len(clean_extension_token) > 256 or (
            clean_extension_token
            and not re.fullmatch(r"[A-Za-z0-9._~-]+", clean_extension_token)
        ):
            raise HTTPException(
                status_code=400,
                detail="Il token estensione può contenere solo lettere, numeri, punto, trattino e underscore (massimo 256 caratteri)."
            )
        setting = db.query(AppSetting).filter(AppSetting.key == "extension_api_token").first()
        if not setting:
            db.add(AppSetting(key="extension_api_token", value=clean_extension_token))
        else:
            setting.value = clean_extension_token

    # Mock Mode
    if mock_mode is not None:
        if not isinstance(mock_mode, bool):
            raise HTTPException(status_code=400, detail="prestashop_mock_mode deve essere un booleano.")
        setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_mock_mode").first()
        val_str = "true" if mock_mode else "false"
        if not setting:
            db.add(AppSetting(key="prestashop_mock_mode", value=val_str))
        else:
            setting.value = val_str

    # Google Sheets settings save
    if stock_source is not None:
        if stock_source not in ("local_upload", "google_sheets"):
            raise HTTPException(status_code=400, detail="Sorgente stock non valida.")
        setting = db.query(AppSetting).filter(AppSetting.key == "stock_source").first()
        if not setting:
            db.add(AppSetting(key="stock_source", value=stock_source))
        else:
            setting.value = stock_source

    if google_sheet_url is not None:
        if not isinstance(google_sheet_url, str):
            raise HTTPException(status_code=400, detail="L'URL del foglio deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_url").first()
        if not setting:
            db.add(AppSetting(key="google_sheet_url", value=google_sheet_url.strip()))
        else:
            setting.value = google_sheet_url.strip()

    if google_sheet_name is not None:
        if not isinstance(google_sheet_name, str):
            raise HTTPException(status_code=400, detail="Il nome del foglio deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_name").first()
        if not setting:
            db.add(AppSetting(key="google_sheet_name", value=google_sheet_name.strip()))
        else:
            setting.value = google_sheet_name.strip()

    if google_sheet_sync_interval is not None:
        try:
            val_int = int(google_sheet_sync_interval)
            if val_int < 1:
                raise ValueError()
        except ValueError:
            raise HTTPException(status_code=400, detail="L'intervallo deve essere un intero >= 1.")
        setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_sync_interval").first()
        if not setting:
            db.add(AppSetting(key="google_sheet_sync_interval", value=str(val_int)))
        else:
            setting.value = str(val_int)

    # PrestaShop settings save
    if prestashop_sync_interval is not None:
        try:
            val_int = int(prestashop_sync_interval)
            if val_int < 1:
                raise ValueError()
        except ValueError:
            raise HTTPException(status_code=400, detail="L'intervallo di sincronizzazione ordini deve essere un intero >= 1.")
        setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_sync_interval").first()
        if not setting:
            db.add(AppSetting(key="prestashop_sync_interval", value=str(val_int)))
        else:
            setting.value = str(val_int)

    # Column mapping save
    if mapping_sku is not None:
        if not isinstance(mapping_sku, str):
            raise HTTPException(status_code=400, detail="Il nome della colonna SKU deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "mapping_sku").first()
        if not setting:
            db.add(AppSetting(key="mapping_sku", value=mapping_sku.strip()))
        else:
            setting.value = mapping_sku.strip()

    if mapping_qty is not None:
        if not isinstance(mapping_qty, str):
            raise HTTPException(status_code=400, detail="Il nome della colonna Quantità deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "mapping_qty").first()
        if not setting:
            db.add(AppSetting(key="mapping_qty", value=mapping_qty.strip()))
        else:
            setting.value = mapping_qty.strip()

    if mapping_desc is not None:
        if not isinstance(mapping_desc, str):
            raise HTTPException(status_code=400, detail="Il nome della colonna Descrizione deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "mapping_desc").first()
        if not setting:
            db.add(AppSetting(key="mapping_desc", value=mapping_desc.strip()))
        else:
            setting.value = mapping_desc.strip()

    if mapping_lotto is not None:
        if not isinstance(mapping_lotto, str):
            raise HTTPException(status_code=400, detail="Il nome della colonna Lotto deve essere una stringa.")
        setting = db.query(AppSetting).filter(AppSetting.key == "mapping_lotto").first()
        if not setting:
            db.add(AppSetting(key="mapping_lotto", value=mapping_lotto.strip()))
        else:
            setting.value = mapping_lotto.strip()

    db.commit()
    
    # Sync settings back to backend/.env so the file stays up-to-date
    # for cold-start bootstrap (e.g. after a clean git clone + restart)
    _sync_env_file(db)
    
    # Return updated settings
    return get_settings(db)

@app.post("/api/settings/google-sheets/sync")
def trigger_google_sheets_sync(db: Session = Depends(get_db)):
    try:
        res = sync_stock_from_google_sheets(db, force=True)
        return res
    except Exception as e:
        err_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_error").first()
        if err_setting:
            err_setting.value = str(e)
        else:
            db.add(AppSetting(key="google_sheet_last_error", value=str(e)))
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/settings/test-connection")
def test_prestashop_connection(payload: dict):
    url = payload.get("prestashop_url", "")
    api_key = payload.get("prestashop_api_key", "")
    mock_mode = payload.get("prestashop_mock_mode", False)
    
    if mock_mode:
        return {"status": "success", "message": "Connessione simulata riuscita (Mock Mode attiva)."}
        
    if not url or not api_key:
        raise HTTPException(status_code=400, detail="URL e Chiave API sono richiesti.")
        
    try:
        clean_url = url.rstrip('/') + '/'
        states_url = f"{clean_url}order_states"
        params = {
            "display": "[id]",
            "limit": "1",
            "output_format": "JSON",
            "ws_key": api_key
        }
        response = requests.get(states_url, params=params, timeout=10)
        response.raise_for_status()
        return {"status": "success", "message": "Connessione al server PrestaShop riuscita!"}
    except Exception as e:
        logger.error(f"Errore durante il test di connessione PrestaShop: {e}")
        raise HTTPException(status_code=400, detail=f"Errore di connessione: {str(e)}")

# ----------------- IMPORT ENDPOINTS -----------------

@app.get("/api/import/sheets")
def get_local_sheets():
    """
    Returns sheet names of the local giacenza.xlsx in the workspace directory.
    """
    workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    filepath = os.path.join(workspace_dir, "giacenza.xlsx")
    if not os.path.exists(filepath):
         raise HTTPException(status_code=404, detail="File 'giacenza.xlsx' non trovato nella cartella di lavoro.")
         
    try:
        with open(filepath, "rb") as f:
            content = f.read()
        sheets = get_excel_sheets(content)
        return {"sheets": sheets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella lettura dei fogli Excel: {str(e)}")

@app.post("/api/import/warehouse")
def import_warehouse(
    file: Optional[UploadFile] = File(None),
    use_local: bool = Form(False),
    sheet_name: str = Form("ROSATE"),
    db: Session = Depends(get_db)
):
    # Load mapping settings
    m_sku_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_sku").first()
    m_qty_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_qty").first()
    m_desc_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_desc").first()
    m_lotto_setting = db.query(AppSetting).filter(AppSetting.key == "mapping_lotto").first()
    
    col_sku = m_sku_setting.value if m_sku_setting else "Sku"
    col_qty = m_qty_setting.value if m_qty_setting else "Qta Tot."
    col_desc = m_desc_setting.value if m_desc_setting else "Descrizione Sku"
    col_lotto = m_lotto_setting.value if m_lotto_setting else "Lotto"

    filename = "giacenza.xlsx"
    file_content = None
    
    if use_local:
        workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        filepath = os.path.join(workspace_dir, "giacenza.xlsx")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File local 'giacenza.xlsx' non trovato nella cartella.")
        try:
            with open(filepath, "rb") as f:
                file_content = f.read()
            filename = "giacenza.xlsx (Locale)"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Errore nella lettura del file locale: {str(e)}")
    elif file is not None:
        filename = file.filename
        file_content = file.file.read()
    else:
        raise HTTPException(status_code=400, detail="Devi caricare un file o abilitare 'use_local=true'.")
 
    # Parse file
    try:
        valid_rows, anomalies = parse_warehouse_excel(
            file_content, 
            sheet_name,
            col_sku=col_sku,
            col_qty=col_qty,
            col_desc=col_desc,
            col_lotto=col_lotto
        )
    except Exception as e:
        # Record anomaly about parsing error
        anomaly = ImportAnomaly(
            source="stock_import",
            anomaly_type="parse_error",
            message=f"Errore fatale nel parsing di {filename}: {str(e)}"
        )
        db.add(anomaly)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))

    # Disable previous active warehouse batches
    db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse").update({ImportBatch.is_active: False})
    
    # Create new Batch
    batch = ImportBatch(
        file_type="warehouse",
        filename=filename,
        sheet_name=sheet_name,
        record_count=len([r for r in valid_rows if not r["sku"].startswith("__spacer_")]),
        is_active=True
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    # Save valid rows
    stock_items = []
    for r in valid_rows:
        stock_items.append(WarehouseStock(
            import_batch_id=batch.id,
            sku=r["sku"],
            description=r["description"],
            lotto=r["lotto"],
            qty_total=r["qty_total"]
        ))
    
    db.bulk_save_objects(stock_items)
    
    # Save anomalies
    for an in anomalies:
        db.add(ImportAnomaly(
            source=an["source"],
            record_key=an["record_key"],
            anomaly_type=an["anomaly_type"],
            message=an["message"]
        ))
        
    db.commit()
    
    # Trigger auto calculation in background
    try:
        run_calculation(db, warehouse_batch_id=batch.id)
    except Exception as calc_err:
        logger.error(f"Errore nel calcolo automatico dopo import stock: {calc_err}")
        
    return {
        "status": "success",
        "batch_id": batch.id,
        "records_imported": len([r for r in valid_rows if not r["sku"].startswith("__spacer_")]),
        "anomalies_found": len(anomalies)
    }

@app.post("/api/import/associations")
def import_associations(
    file: Optional[UploadFile] = File(None),
    use_local: bool = Form(False),
    db: Session = Depends(get_db)
):
    filename = "associazione.xlsx"
    file_content = None
    
    if use_local:
        workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        filepath = os.path.join(workspace_dir, "associazione.xlsx")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File local 'associazione.xlsx' non trovato nella cartella.")
        try:
            with open(filepath, "rb") as f:
                file_content = f.read()
            filename = "associazione.xlsx (Locale)"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Errore nella lettura del file locale: {str(e)}")
    elif file is not None:
        filename = file.filename
        file_content = file.file.read()
    else:
        raise HTTPException(status_code=400, detail="Devi caricare un file o abilitare 'use_local=true'.")

    # Parse file
    try:
        associations, anomalies = parse_associations_excel(file_content)
    except Exception as e:
        anomaly = ImportAnomaly(
            source="associations_import",
            anomaly_type="parse_error",
            message=f"Errore fatale nel parsing di {filename}: {str(e)}"
        )
        db.add(anomaly)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))

    # Disable previous active associations batches
    db.query(ImportBatch).filter(ImportBatch.file_type == "associations").update({ImportBatch.is_active: False})
    
    # Create new Batch
    batch = ImportBatch(
        file_type="associations",
        filename=filename,
        record_count=len(associations),
        is_active=True
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    # Save associations
    comp_items = []
    for assoc in associations:
        comp_items.append(ProductComponent(
            import_batch_id=batch.id,
            product_id=assoc["product_id"],
            sku=assoc["sku"],
            qty_required=assoc["qty_required"]
        ))
        
    db.bulk_save_objects(comp_items)
    
    # Save anomalies
    for an in anomalies:
        db.add(ImportAnomaly(
            source=an["source"],
            record_key=an["record_key"],
            anomaly_type=an["anomaly_type"],
            message=an["message"]
        ))
        
    db.commit()
    
    # Trigger auto calculation in background
    try:
        run_calculation(db, associations_batch_id=batch.id)
    except Exception as calc_err:
        logger.error(f"Errore nel calcolo automatico dopo import associazioni: {calc_err}")
        
    return {
        "status": "success",
        "batch_id": batch.id,
        "records_imported": len(associations),
        "anomalies_found": len(anomalies)
    }

# ----------------- PRESTASHOP SYNC & RECALC -----------------

def sync_orders_internal(db: Session, client: PrestaShopClient, force: bool = False) -> dict:
    if not prestashop_sync_lock.acquire(blocking=False):
        return {
            "status": "skipped",
            "message": "Sincronizzazione ordini PrestaShop già in corso.",
            "mock_mode": client.mock_mode
        }
    try:
        return _sync_orders_internal_unlocked(db, client, force=force)
    finally:
        prestashop_sync_lock.release()

def _sync_orders_internal_unlocked(db: Session, client: PrestaShopClient, force: bool = False) -> dict:
    sync_progress.start()
    # 1. Get states to sync
    setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
    if setting:
        included_states = json.loads(setting.value)
    else:
        included_states = [12]
        
    if not included_states:
        sync_progress.stop(success=False, error_msg="Nessuno stato ordine configurato nelle impostazioni.")
        raise ValueError("Nessuno stato ordine configurato nelle impostazioni.")
        
    # Get active product IDs from associations to generate realistic mocks if in Mock mode
    active_assoc_batch = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    
    valid_product_ids = []
    if active_assoc_batch:
        valid_product_ids = [
            r[0] for r in db.query(ProductComponent.product_id)
            .filter(ProductComponent.import_batch_id == active_assoc_batch.id)
            .distinct().all()
        ]
        
    # If no associations exist yet, use default placeholder IDs for mock data
    if not valid_product_ids:
        valid_product_ids = [609286, 609287, 605652]
        
    try:
        # Check if we can skip the sync using the lightweight check
        if not force:
            try:
                remote_orders = client.get_order_ids_and_update_times(included_states, valid_product_ids)
                db_orders = db.query(PrestashopOrder).all()
                db_orders_map = {o.order_id: o.date_upd for o in db_orders}
                product_names_need_backfill = db.query(PrestashopOrderLine.id).filter(
                    (PrestashopOrderLine.product_name == None) |
                    (PrestashopOrderLine.product_name == "")
                ).first() is not None
                
                # Check for sync errors and completed calculations
                last_calc = db.query(CalcRun).filter(CalcRun.status == "completed").first()
                err_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_error").first()
                has_error = err_setting and err_setting.value
                
                if last_calc and not has_error and not product_names_need_backfill and len(db_orders_map) == len(remote_orders):
                    all_match = True
                    for remote in remote_orders:
                        oid = remote["id"]
                        if oid not in db_orders_map:
                            all_match = False
                            break
                        
                        r_date_str = remote["date_upd"]
                        r_date = None
                        if r_date_str:
                            try:
                                r_date = datetime.strptime(r_date_str, "%Y-%m-%d %H:%M:%S")
                            except Exception:
                                pass
                        
                        db_date = db_orders_map[oid]
                        if db_date != r_date:
                            all_match = False
                            break
                            
                    if all_match:
                        logger.info("Nessuna modifica rilevata negli ordini PrestaShop. Sincronizzazione saltata.")
                        # Save last sync setting anyway
                        last_sync_val = _utc_now_iso()
                        ls_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_sync").first()
                        if ls_setting:
                            ls_setting.value = last_sync_val
                        else:
                            db.add(AppSetting(key="prestashop_last_sync", value=last_sync_val))
                        db.commit()
                        
                        sync_progress.stop(success=True)
                        return {
                            "status": "skipped",
                            "message": "Nessuna modifica rilevata negli ordini PrestaShop rispetto all'ultimo calcolo.",
                            "orders_synced": len(db_orders),
                            "mock_mode": client.mock_mode
                        }
            except Exception as check_err:
                logger.warning(f"Errore durante il controllo rapido delle modifiche: {check_err}. Si procede con il sync completo.")
                raise check_err

        # Fetch orders
        def on_progress(phase, current, total):
            if phase == "fetching_orders":
                sync_progress.update(phase="fetching_orders", synced_orders=current, total_orders=total)

        orders_data = client.get_orders(included_states, valid_product_ids, progress_callback=on_progress)
        
        # We need a map of order states to save state labels
        states_map = {s["id"]: s["name"] for s in client.get_order_states()}
        
        sync_progress.update(phase="saving")
        
        # Transactional write: clear previous synced orders and write new ones
        # This acts as a full snapshot sync.
        db.query(PrestashopOrderLine).delete()
        db.query(PrestashopOrder).delete()
        db.query(ImportAnomaly).filter(ImportAnomaly.source == "orders_sync").delete()
        
        seen_order_ids = set()
        synced_count = 0
        now_val = datetime.utcnow()
        orders_to_save = []
        lines_to_save = []
        for o in orders_data:
            order_id = o["order_id"]
            if order_id in seen_order_ids:
                logger.warning(f"Ordine duplicato ignorato durante il salvataggio: {order_id}")
                continue
            seen_order_ids.add(order_id)

            state_label = states_map.get(o["current_state"], f"Stato {o['current_state']}")
            
            db_order = PrestashopOrder(
                order_id=order_id,
                current_state=o["current_state"],
                current_state_label=state_label,
                date_add=o["date_add"],
                date_upd=o["date_upd"],
                customer_name=o.get("customer_name"),
                total_paid=o.get("total_paid"),
                synced_at=now_val
            )
            orders_to_save.append(db_order)
            
            for line in o["lines"]:
                db_line = PrestashopOrderLine(
                    order_id=order_id,
                    line_id=line["line_id"],
                    product_id=line["product_id"],
                    product_attribute_id=line["product_attribute_id"],
                    product_reference=line["product_reference"],
                    product_name=line.get("product_name"),
                    product_quantity=line["product_quantity"]
                )
                lines_to_save.append(db_line)
                
            synced_count += 1
            
        if orders_to_save:
            db.bulk_save_objects(orders_to_save)
        if lines_to_save:
            db.bulk_save_objects(lines_to_save)
            
        db.commit()
        
        # Save last sync setting
        last_sync_val = _utc_now_iso()
        ls_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_sync").first()
        if ls_setting:
            ls_setting.value = last_sync_val
        else:
            db.add(AppSetting(key="prestashop_last_sync", value=last_sync_val))
        
        err_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_error").first()
        if err_setting:
            err_setting.value = ""
        else:
            db.add(AppSetting(key="prestashop_last_error", value=""))
        db.commit()
        
        sync_progress.update(phase="calculating")
        # Trigger auto calculation
        try:
            run_calculation(db)
        except Exception as calc_err:
            logger.error(f"Errore nel calcolo automatico dopo sync ordini: {calc_err}")
            
        sync_progress.stop(success=True)
        return {
            "status": "success",
            "orders_synced": synced_count,
            "mock_mode": client.mock_mode
        }
        
    except Exception as e:
        sync_progress.stop(success=False, error_msg=str(e))
        db.rollback()
        err_msg = f"Errore durante la sincronizzazione degli ordini: {str(e)}"
        
        err_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_error").first()
        if err_setting:
            err_setting.value = err_msg
        else:
            db.add(AppSetting(key="prestashop_last_error", value=err_msg))
            
        # Save order sync anomaly
        db.add(ImportAnomaly(
            source="orders_sync",
            anomaly_type="sync_error",
            message=err_msg
        ))
        db.commit()
        raise e

@app.get("/api/prestashop/sync-status")
def get_sync_status():
    return {
        "active": sync_progress.active,
        "phase": sync_progress.phase,
        "synced_orders": sync_progress.synced_orders,
        "total_orders": sync_progress.total_orders,
        "error_message": sync_progress.error_message
    }

@app.post("/api/prestashop/sync-orders")
def sync_orders(force: bool = True, db: Session = Depends(get_db), client: PrestaShopClient = Depends(get_ps_client)):
    try:
        res = sync_orders_internal(db, client, force=force)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def sync_specific_orders_internal(db: Session, client: PrestaShopClient, order_ids: List[int]) -> dict:
    from datetime import timedelta
    import random
    clean_ids = []
    for oid in order_ids:
        try:
            clean_ids.append(int(oid))
        except (ValueError, TypeError):
            continue
    clean_ids = list(dict.fromkeys(clean_ids))
    if not clean_ids:
        return {"status": "success", "orders_synced": 0, "mock_mode": client.mock_mode}

    active_assoc_batch = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    
    valid_product_ids = []
    if active_assoc_batch:
        valid_product_ids = [
            r[0] for r in db.query(ProductComponent.product_id)
            .filter(ProductComponent.import_batch_id == active_assoc_batch.id)
            .distinct().all()
        ]
        
    if not valid_product_ids:
        valid_product_ids = [609286, 609287, 605652]

    orders_data = []
    if client.mock_mode:
        states_map = {s["id"]: s["name"] for s in client.get_order_states()}
        mock_customers = ["Mario Rossi", "Giulia Bianchi", "Luca Verdi", "Anna Ferrari", "Paolo Esposito"]
        mock_prices = [12.50, 24.90, 34.00, 18.75, 45.00]
        random.seed(42)
        
        setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
        state_ids = json.loads(setting.value) if setting else [12]
        
        for idx, oid in enumerate(clean_ids):
            current_state = random.choice(state_ids) if state_ids else 12
            date_add = datetime.utcnow()
            date_upd = date_add
            num_lines = random.randint(1, 3)
            selected_products = random.sample(valid_product_ids, min(num_lines, len(valid_product_ids)))
            lines = []
            for l_idx, prod_id in enumerate(selected_products):
                lines.append({
                    "line_id": l_idx + 1,
                    "product_id": prod_id,
                    "product_attribute_id": 0,
                    "product_reference": f"REF-{prod_id}",
                    "product_name": f"Prodotto demo {prod_id}",
                    "product_quantity": random.choice([1, 1, 2])
                })
            orders_data.append({
                "order_id": oid,
                "current_state": current_state,
                "date_add": date_add,
                "date_upd": date_upd,
                "customer_name": mock_customers[idx % len(mock_customers)],
                "total_paid": mock_prices[idx % len(mock_prices)],
                "lines": lines
            })
    else:
        orders_list = []
        customer_cache = {}
        states_map = {s["id"]: s["name"] for s in client.get_order_states()}
        
        limit = 50
        for i in range(0, len(clean_ids), limit):
            chunk = clean_ids[i:i+limit]
            ids_filter = "|".join(str(oid) for oid in chunk)
            params = {
                "display": "full",
                "output_format": "JSON",
                "filter[id]": f"[{ids_filter}]",
                "ws_key": client.api_key
            }
            orders_url = f"{client.url}orders"
            response = client._make_request(orders_url, params=params, timeout=30)
            if response.status_code == 404:
                continue
            response.raise_for_status()
            data = response.json()
            raw_orders = data.get("orders", [])
            if isinstance(raw_orders, dict):
                raw_orders = [raw_orders]
            elif not isinstance(raw_orders, list):
                raw_orders = []
                
            cust_ids_to_fetch = []
            for order_data in raw_orders:
                if isinstance(order_data, dict):
                    firstname = client._clean_name_field(order_data.get("customer_firstname"))
                    lastname = client._clean_name_field(order_data.get("customer_lastname"))
                    if not (firstname or lastname):
                        id_customer = order_data.get("id_customer")
                        if id_customer:
                            try:
                                id_customer = int(id_customer)
                                if id_customer not in customer_cache:
                                    cust_ids_to_fetch.append(id_customer)
                            except (ValueError, TypeError):
                                pass
            if cust_ids_to_fetch:
                client._fetch_customer_names_batch(cust_ids_to_fetch, customer_cache, None)
                
            for order_data in raw_orders:
                if not isinstance(order_data, dict):
                    continue
                order_id = int(order_data.get("id"))
                current_state = int(order_data.get("current_state"))
                
                date_add_str = order_data.get("date_add")
                date_upd_str = order_data.get("date_upd")
                date_add = None
                date_upd = None
                try:
                    if date_add_str:
                        date_add = datetime.strptime(date_add_str, "%Y-%m-%d %H:%M:%S")
                    if date_upd_str:
                        date_upd = datetime.strptime(date_upd_str, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    pass
                    
                assoc = order_data.get("associations", {})
                order_rows_raw = []
                if isinstance(assoc, dict):
                    order_rows_raw = assoc.get("order_rows", [])
                if isinstance(order_rows_raw, dict):
                    order_rows_raw = [order_rows_raw]
                elif not isinstance(order_rows_raw, list):
                    order_rows_raw = []
                    
                order_lines = []
                for line in order_rows_raw:
                    if not isinstance(line, dict):
                        continue
                    product_id = int(line.get("product_id"))
                    qty = int(line.get("product_quantity", 1))
                    line_id = int(line.get("id")) if line.get("id") else None
                    prod_attr_id = int(line.get("product_attribute_id", 0)) if line.get("product_attribute_id") else 0
                    ref = line.get("product_reference", "")
                    product_name = client._clean_name_field(line.get("product_name")) or ""
                    
                    order_lines.append({
                        "line_id": line_id,
                        "product_id": product_id,
                        "product_attribute_id": prod_attr_id,
                        "product_reference": ref,
                        "product_name": product_name,
                        "product_quantity": qty
                    })
                    
                customer_name = client._get_customer_name(order_data, customer_cache)
                try:
                    total_paid = float(order_data.get("total_paid_tax_incl") or 0)
                except (ValueError, TypeError):
                    total_paid = None
                    
                orders_list.append({
                    "order_id": order_id,
                    "current_state": current_state,
                    "date_add": date_add,
                    "date_upd": date_upd,
                    "customer_name": customer_name,
                    "total_paid": total_paid,
                    "lines": order_lines
                })
                
        orders_data = orders_list

    states_map = {s["id"]: s["name"] for s in client.get_order_states()}
    now_val = datetime.utcnow()
    synced_count = 0
    
    for o in orders_data:
        order_id = o["order_id"]
        state_label = states_map.get(o["current_state"], f"Stato {o['current_state']}")
        
        db.query(PrestashopOrderLine).filter(PrestashopOrderLine.order_id == order_id).delete()
        db.query(PrestashopOrder).filter(PrestashopOrder.order_id == order_id).delete()
        
        db_order = PrestashopOrder(
            order_id=order_id,
            current_state=o["current_state"],
            current_state_label=state_label,
            date_add=o["date_add"],
            date_upd=o["date_upd"],
            customer_name=o.get("customer_name"),
            total_paid=o.get("total_paid"),
            synced_at=now_val
        )
        db.add(db_order)
        db.commit()
        
        for line in o["lines"]:
            db_line = PrestashopOrderLine(
                order_id=order_id,
                line_id=line["line_id"],
                product_id=line["product_id"],
                product_attribute_id=line["product_attribute_id"],
                product_reference=line["product_reference"],
                product_name=line.get("product_name"),
                product_quantity=line["product_quantity"]
            )
            db.add(db_line)
        
        synced_count += 1
        
    db.commit()
    
    try:
        run_calculation(db)
    except Exception as calc_err:
        logger.error(f"Errore nel calcolo automatico dopo sync specifico: {calc_err}")
        
    return {
        "status": "success",
        "orders_synced": synced_count,
        "mock_mode": client.mock_mode
    }

@app.post("/api/prestashop/sync-specific-orders")
def sync_specific_orders(payload: dict, db: Session = Depends(get_db), client: PrestaShopClient = Depends(get_ps_client)):
    order_ids = payload.get("order_ids", [])
    try:
        res = sync_specific_orders_internal(db, client, order_ids=order_ids)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calc/run")
def run_calc(db: Session = Depends(get_db)):
    try:
        run_id = run_calculation(db)
        return {"status": "success", "calc_run_id": run_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- DATA RETRIEVAL ENDPOINTS -----------------

@app.get("/api/dashboard")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    # 1. Total SKU count in active batch (excluding spacer rows)
    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    sku_count = db.query(WarehouseStock).filter(
        WarehouseStock.import_batch_id == active_w.id,
        ~WarehouseStock.sku.like('__spacer_%')
    ).count() if active_w else 0
    
    # 2. Total compound products in active batch
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    product_count = db.query(ProductComponent.product_id).filter(ProductComponent.import_batch_id == active_a.id).distinct().count() if active_a else 0
    
    # 3. Active orders and total products ordered
    order_count = db.query(PrestashopOrder).count()
    items_ordered = db.query(func.sum(PrestashopOrderLine.product_quantity)).scalar() or 0
    
    # 4. Critical SKUs (residual stock <= 0 or committed > 0)
    latest_run = db.query(CalcRun).filter(CalcRun.status == "completed").order_by(CalcRun.completed_at.desc()).first()
    
    critical_skus = 0
    zero_availability_products = 0
    
    if latest_run:
        critical_skus = db.query(SkuCommitment).filter(
            SkuCommitment.calc_run_id == latest_run.id,
            SkuCommitment.qty_residual <= 0
        ).count()
        
        zero_availability_products = db.query(ProductAvailability).filter(
            ProductAvailability.calc_run_id == latest_run.id,
            ProductAvailability.qty_available == 0
        ).count()
        
    # 5. Active anomalies
    anomalies_count = db.query(ImportAnomaly).count()
    
    return {
        "sku_count": sku_count,
        "product_count": product_count,
        "order_count": order_count,
        "items_ordered": int(items_ordered),
        "critical_skus": critical_skus,
        "zero_availability_products": zero_availability_products,
        "anomalies_count": anomalies_count,
        "latest_import_warehouse": active_w.imported_at.isoformat() + "Z" if active_w and active_w.imported_at else None,
        "latest_import_associations": active_a.imported_at.isoformat() + "Z" if active_a and active_a.imported_at else None,
        "latest_calculation_run": latest_run.completed_at.isoformat() + "Z" if latest_run and latest_run.completed_at else None,
    }
@app.get("/api/stock/missing")
def get_missing_stock(db: Session = Depends(get_db)):
    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    active_w_id = active_w.id if active_w else None
    
    latest_run = db.query(CalcRun).filter(CalcRun.status == "completed").order_by(CalcRun.completed_at.desc()).first()
    if not latest_run:
        return []
        
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    if not active_a:
        return []
        
    query = db.query(SkuCommitment).filter(
        SkuCommitment.calc_run_id == latest_run.id,
        SkuCommitment.qty_committed > 0
    )
    if active_w_id:
        stock_skus_select = db.query(WarehouseStock.sku).filter(WarehouseStock.import_batch_id == active_w_id)
        query = query.filter(~SkuCommitment.sku.in_(stock_skus_select))
        
    commitments = query.all()
    
    associated_skus = set(
        r[0] for r in db.query(ProductComponent.sku)
        .filter(ProductComponent.import_batch_id == active_a.id)
        .all()
    )
    
    counts = db.query(
        ProductComponent.sku, 
        func.count(ProductComponent.product_id.distinct())
    ).filter(ProductComponent.import_batch_id == active_a.id).group_by(ProductComponent.sku).all()
    connected_counts = {sku: cnt for sku, cnt in counts}
    
    result = []
    idx = 1
    for comm in commitments:
        if comm.sku not in associated_skus:
            continue
            
        result.append({
            "index": idx,
            "sku": comm.sku,
            "description": "NON INVENTARIATO (Sku non presente nel file)",
            "lotto": "-",
            "qty_total": 0.0,
            "qty_committed": comm.qty_committed,
            "qty_residual": 0.0,
            "connected_products": connected_counts.get(comm.sku, 0),
            "is_spacer": False,
            "is_missing": True
        })
        idx += 1
        
    return result

@app.get("/api/stock")
def get_stock(db: Session = Depends(get_db)):
    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    if not active_w:
        return []
        
    latest_run = db.query(CalcRun).filter(CalcRun.status == "completed").order_by(CalcRun.completed_at.desc()).first()
    
    # Find all stock items ordered by insertion ID (Excel order)
    stock_items = db.query(WarehouseStock).filter(
        WarehouseStock.import_batch_id == active_w.id
    ).order_by(WarehouseStock.id.asc()).all()
    
    # Get commitments for latest run
    commitments = {}
    if latest_run:
        coms = db.query(SkuCommitment).filter(SkuCommitment.calc_run_id == latest_run.id).all()
        commitments = {c.sku: c for c in coms}
        
    # Count connected products for each SKU in the active associations batch
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    connected_counts = {}
    if active_a:
        counts = db.query(
            ProductComponent.sku, 
            func.count(ProductComponent.product_id.distinct())
        ).filter(ProductComponent.import_batch_id == active_a.id).group_by(ProductComponent.sku).all()
        connected_counts = {sku: cnt for sku, cnt in counts}
        
    # Count occurrences of each SKU in the stock
    sku_counts = {}
    for item in stock_items:
        if not item.sku.startswith("__spacer_"):
            sku_counts[item.sku] = sku_counts.get(item.sku, 0) + 1

    sku_processed_count = {}
    sku_allocated_commitment = {}

    result = []
    for idx, item in enumerate(stock_items):
        if item.sku.startswith("__spacer_"):
            result.append({
                "index": idx + 1,
                "sku": "",
                "description": "",
                "lotto": "",
                "qty_total": 0.0,
                "qty_committed": 0.0,
                "qty_residual": 0.0,
                "connected_products": 0,
                "is_spacer": True
            })
            continue

        comm = commitments.get(item.sku)
        total_sku_committed = comm.qty_committed if comm else 0.0

        # Track occurrence order for FIFO distribution
        sku_processed_count[item.sku] = sku_processed_count.get(item.sku, 0) + 1
        is_last_row = (sku_processed_count[item.sku] == sku_counts[item.sku])

        already_allocated = sku_allocated_commitment.get(item.sku, 0.0)
        remaining_commitment = total_sku_committed - already_allocated

        if is_last_row:
            allocated_to_this_row = remaining_commitment
        else:
            allocated_to_this_row = max(0.0, min(item.qty_total, remaining_commitment))

        sku_allocated_commitment[item.sku] = already_allocated + allocated_to_this_row
        qty_residual = item.qty_total - allocated_to_this_row

        result.append({
            "index": idx + 1,
            "sku": item.sku,
            "description": item.description or "",
            "lotto": item.lotto or "",
            "qty_total": item.qty_total,
            "qty_committed": allocated_to_this_row,
            "qty_residual": qty_residual,
            "connected_products": connected_counts.get(item.sku, 0),
            "is_spacer": False
        })

    return result

@app.get("/api/stock/{sku:path}/orders")
def get_stock_orders(sku: str, db: Session = Depends(get_db)):
    active_a = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    if not active_a:
        return []

    components = db.query(ProductComponent).filter(
        ProductComponent.import_batch_id == active_a.id,
        ProductComponent.sku == sku
    ).all()
    
    if not components:
        return []
        
    prod_req_map = {c.product_id: c.qty_required for c in components}
    product_ids = list(prod_req_map.keys())

    state_setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
    included_states = json.loads(state_setting.value) if state_setting else [12]

    matching_lines = db.query(PrestashopOrderLine).join(
        PrestashopOrder, PrestashopOrderLine.order_id == PrestashopOrder.order_id
    ).filter(
        PrestashopOrder.current_state.in_(included_states),
        PrestashopOrderLine.product_id.in_(product_ids)
    ).all()

    # Fetch PrestaShop admin URL for direct order links
    ps_url_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_url").first()
    ps_url = ps_url_setting.value.strip() if ps_url_setting and ps_url_setting.value else ""
    
    ps_admin_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_admin_url").first()
    prestashop_admin_url = ps_admin_setting.value.strip() if ps_admin_setting and ps_admin_setting.value else ""
    
    if not prestashop_admin_url and ps_url:
        # Fallback: strip '/api/' from the end of the URL
        if "/api" in ps_url:
            prestashop_admin_url = ps_url.split("/api")[0].rstrip('/')
        else:
            prestashop_admin_url = ps_url.rstrip('/')

    orders_contrib = []
    for line in matching_lines:
        order = db.query(PrestashopOrder).filter(PrestashopOrder.order_id == line.order_id).first()
        qty_req = prod_req_map.get(line.product_id, 1)
        contribution = qty_req * line.product_quantity
        unit_price = round(order.total_paid / line.product_quantity, 2) if (order and order.total_paid and line.product_quantity) else None
        total_line_value = round((order.total_paid or 0), 2) if order else None

        # Build direct link to order in PrestaShop admin
        order_link = None
        if prestashop_admin_url and order:
            order_link = f"{prestashop_admin_url}/index.php?controller=AdminOrders&id_order={order.order_id}&vieworder"
        
        orders_contrib.append({
            "order_id": line.order_id,
            "current_state_label": order.current_state_label if order else "",
            "date_add": order.date_add.isoformat() if order and order.date_add else None,
            "product_id": line.product_id,
            "product_reference": line.product_reference or f"ID {line.product_id}",
            "product_quantity": line.product_quantity,
            "qty_required": qty_req,
            "contribution": contribution,
            "customer_name": order.customer_name if order else None,
            "total_paid": total_line_value,
            "unit_price": unit_price,
            "order_link": order_link
        })
        
    orders_contrib.sort(key=lambda x: x["date_add"] or datetime.min, reverse=True)
    return orders_contrib

@app.get("/api/stock/{sku:path}/orders/smart-counter")
def get_stock_orders_smart_counter(sku: str, db: Session = Depends(get_db)):
    active_a = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    if not active_a:
        return {"orders": [], "summary": {"counted": 0, "blocked": 0, "selected_sku_shortage": 0}}

    components = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).all()
    components_map = {}
    selected_product_ids = set()
    for comp in components:
        components_map.setdefault(comp.product_id, []).append(comp)
        if comp.sku == sku:
            selected_product_ids.add(comp.product_id)

    if not selected_product_ids:
        return {"orders": [], "summary": {"counted": 0, "blocked": 0, "selected_sku_shortage": 0}}

    active_w = db.query(ImportBatch).filter(
        ImportBatch.file_type == "warehouse",
        ImportBatch.is_active == True
    ).first()
    stock_map = {}
    if active_w:
        stock_items = db.query(WarehouseStock).filter(WarehouseStock.import_batch_id == active_w.id).all()
        for item in stock_items:
            sku_key = item.sku.strip()
            if not sku_key or sku_key.startswith("__spacer_"):
                continue
            if sku_key not in stock_map:
                stock_map[sku_key] = {
                    "description": item.description or "",
                    "qty_total": 0.0
                }
            stock_map[sku_key]["qty_total"] += item.qty_total

    running_stock = {sku_key: info["qty_total"] for sku_key, info in stock_map.items()}

    state_setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
    try:
        included_states = json.loads(state_setting.value) if state_setting else [12]
    except Exception:
        included_states = [12]

    orders_query = db.query(PrestashopOrder)
    if included_states:
        orders_query = orders_query.filter(PrestashopOrder.current_state.in_(included_states))
    else:
        orders_query = orders_query.filter(False)

    active_orders = orders_query.order_by(
        asc(PrestashopOrder.date_add),
        asc(PrestashopOrder.order_id)
    ).all()

    order_ids = [order.order_id for order in active_orders]
    lines_by_order = {}
    if order_ids:
        all_lines = db.query(PrestashopOrderLine).filter(
            PrestashopOrderLine.order_id.in_(order_ids)
        ).order_by(
            asc(PrestashopOrderLine.order_id),
            asc(PrestashopOrderLine.id)
        ).all()
        for line in all_lines:
            lines_by_order.setdefault(line.order_id, []).append(line)

    rows = []
    summary = {
        "counted": 0,
        "blocked": 0,
        "selected_sku_shortage": 0,
        "initial_selected_stock": running_stock.get(sku, 0.0),
        "final_selected_stock": running_stock.get(sku, 0.0)
    }

    def format_smart_qty(value):
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            return value
        return int(numeric) if numeric.is_integer() else round(numeric, 2)

    def build_line_requirements(line):
        product_qty = line.product_quantity or 1
        reqs = {}

        if is_ignored_picking_sku(line.product_reference):
            return reqs

        if line.product_id in components_map:
            for comp in components_map.get(line.product_id, []):
                sku_key = comp.sku.strip()
                if sku_key and not is_ignored_picking_sku(sku_key):
                    reqs[sku_key] = reqs.get(sku_key, 0.0) + (comp.qty_required * product_qty)
        else:
            sku_key = (line.product_reference or "").strip()
            if sku_key and not is_ignored_picking_sku(sku_key):
                reqs[sku_key] = reqs.get(sku_key, 0.0) + product_qty

        return reqs

    for order in active_orders:
        order_lines = lines_by_order.get(order.order_id, [])
        selected_lines = [line for line in order_lines if line.product_id in selected_product_ids]
        order_reqs = {}
        selected_required_by_line_id = {}

        for line in order_lines:
            line_reqs = build_line_requirements(line)
            for req_sku, req_qty in line_reqs.items():
                order_reqs[req_sku] = order_reqs.get(req_sku, 0.0) + req_qty

            if line.product_id in selected_product_ids:
                selected_required_by_line_id[line.id] = line_reqs.get(sku, 0.0)

        if not order_reqs:
            continue

        selected_before = running_stock.get(sku, 0.0)
        issues = []
        component_requirements = []

        for req_sku, req_qty in sorted(order_reqs.items()):
            available_before = running_stock.get(req_sku, 0.0)
            available_after_if_counted = available_before - req_qty
            stock_info = stock_map.get(req_sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
            is_available = available_before >= req_qty
            component_requirements.append({
                "sku": req_sku,
                "description": stock_info["description"],
                "qty_required": req_qty,
                "qty_available_before": available_before,
                "qty_available_after_if_counted": available_after_if_counted,
                "status": "available" if is_available else "missing"
            })
            if not is_available:
                issues.append({
                    "sku": req_sku,
                    "description": stock_info["description"],
                    "qty_required": req_qty,
                    "qty_available": available_before,
                    "qty_missing": req_qty - available_before,
                    "is_selected_sku": req_sku == sku
                })

        can_count = not issues
        if can_count:
            for req_sku, req_qty in order_reqs.items():
                running_stock[req_sku] = running_stock.get(req_sku, 0.0) - req_qty
            selected_after = running_stock.get(sku, 0.0)
            smart_status = "counted"
            smart_label = "Conteggiato"
            smart_note = f"{sku}: {selected_before} -> {selected_after}"
        else:
            selected_after = selected_before
            selected_issue = next((issue for issue in issues if issue["is_selected_sku"]), None)
            if selected_issue:
                smart_status = "selected_sku_shortage"
                smart_label = "SKU insufficiente"
                smart_note = f"{sku}: richiesti {format_smart_qty(selected_issue['qty_required'])}, disponibili {format_smart_qty(selected_issue['qty_available'])}"
            else:
                smart_status = "blocked_combo"
                smart_label = "Bloccato da altra SKU"
                if issues:
                    smart_note = "Manca " + ", ".join(
                        f"{issue['sku']} ({format_smart_qty(issue['qty_missing'])})" for issue in issues[:3]
                    )
                else:
                    smart_note = "Nessun componente SKU ricavabile"

        for line in selected_lines:
            selected_required = selected_required_by_line_id.get(line.id, 0.0)
            if selected_required <= 0:
                continue

            if smart_status == "counted":
                summary["counted"] += 1
            elif smart_status == "selected_sku_shortage":
                summary["selected_sku_shortage"] += 1
            else:
                summary["blocked"] += 1

            rows.append({
                "order_id": line.order_id,
                "current_state_label": order.current_state_label if order else "",
                "date_add": order.date_add.isoformat() if order and order.date_add else None,
                "product_id": line.product_id,
                "product_reference": line.product_reference or f"ID {line.product_id}",
                "product_quantity": line.product_quantity,
                "qty_required": selected_required,
                "contribution": selected_required,
                "customer_name": order.customer_name if order else None,
                "total_paid": round((order.total_paid or 0), 2) if order else None,
                "smart_status": smart_status,
                "smart_label": smart_label,
                "smart_note": smart_note,
                "selected_qty_before": selected_before,
                "selected_qty_after": selected_after,
                "component_issues": issues,
                "component_requirements": component_requirements
            })

    summary["final_selected_stock"] = running_stock.get(sku, 0.0)
    summary["simulated_orders"] = len(rows)
    return {"orders": rows, "summary": summary}

@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    if not active_a:
        return []
        
    latest_run = db.query(CalcRun).filter(CalcRun.status == "completed").order_by(CalcRun.completed_at.desc()).first()
    
    # Group components by product_id
    components = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).all()
    components_map = {}
    for comp in components:
        if comp.product_id not in components_map:
            components_map[comp.product_id] = []
        components_map[comp.product_id].append(comp)
        
    # Get availability for latest run
    availabilities = {}
    if latest_run:
        avs = db.query(ProductAvailability).filter(ProductAvailability.calc_run_id == latest_run.id).all()
        availabilities = {a.product_id: a for a in avs}
        
    result = []
    for prod_id, comps in components_map.items():
        av = availabilities.get(prod_id)
        qty_available = av.qty_available if av else 0
        limiting_sku = av.limiting_sku if av else ""
        
        # Build components string and formula detail
        components_str = ", ".join(f"{c.sku} (x{c.qty_required})" for c in comps)
        
        result.append({
            "product_id": prod_id,
            "components_str": components_str,
            "qty_available": qty_available,
            "limiting_sku": limiting_sku,
            # Format: '609287 | CL5000M79/3E,CL2000UW35E,CL2000UW35E,CL2000UW35E'
            "raw_association": f"{prod_id} | " + ",".join([c.sku for c in comps for _ in range(c.qty_required)])
        })
        
    return result

@app.get("/api/associations/{product_id}")
def get_association(product_id: int, db: Session = Depends(get_db)):
    active_a = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    if not active_a:
        return {"product_id": product_id, "components": []}
        
    comps = db.query(ProductComponent).filter(
        ProductComponent.import_batch_id == active_a.id,
        ProductComponent.product_id == product_id
    ).all()
    
    return {
        "product_id": product_id,
        "components": [{"sku": c.sku, "qty_required": c.qty_required} for c in comps]
    }

@app.post("/api/associations")
def save_association(payload: dict, db: Session = Depends(get_db)):
    product_id = payload.get("product_id")
    components = payload.get("components", [])
    
    if not product_id:
        raise HTTPException(status_code=400, detail="Product ID mancante o non valido")
        
    try:
        product_id = int(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Product ID deve essere un numero intero")
        
    active_a = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    
    if not active_a:
        # Create a manual active batch
        active_a = ImportBatch(
            file_type="associations",
            filename="associazione_manuale.xlsx",
            is_active=True,
            record_count=0
        )
        db.add(active_a)
        db.commit()
        db.refresh(active_a)
        
    # Group components by SKU to avoid unique constraint violations
    sku_qty_map = {}
    for comp in components:
        sku = comp.get("sku", "").strip()
        qty_required = comp.get("qty_required", 1)
        if not sku:
            continue
        try:
            qty_required = int(qty_required)
            if qty_required <= 0:
                continue
        except ValueError:
            continue
        sku_qty_map[sku] = sku_qty_map.get(sku, 0) + qty_required

    # Delete existing components for this product_id
    db.query(ProductComponent).filter(
        ProductComponent.import_batch_id == active_a.id,
        ProductComponent.product_id == product_id
    ).delete()
    
    # Insert new components
    for sku, qty in sku_qty_map.items():
        new_comp = ProductComponent(
            import_batch_id=active_a.id,
            product_id=product_id,
            sku=sku,
            qty_required=qty
        )
        db.add(new_comp)
        
    db.commit()
    
    # Update record_count for the batch
    total_comps = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).count()
    active_a.record_count = total_comps
    db.commit()
    
    # Trigger recalculation automatically!
    try:
        run_calculation(db)
    except Exception as calc_err:
        logger.error(f"Errore nel ricalcolo automatico dopo modifica associazione: {calc_err}")
        
    return {"status": "success"}

@app.delete("/api/associations/{product_id}")
def delete_association(product_id: int, db: Session = Depends(get_db)):
    active_a = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    if not active_a:
        return {"status": "success", "message": "Nessun batch attivo"}
        
    db.query(ProductComponent).filter(
        ProductComponent.import_batch_id == active_a.id,
        ProductComponent.product_id == product_id
    ).delete()
    
    db.commit()
    
    # Update record_count for the batch
    total_comps = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).count()
    active_a.record_count = total_comps
    db.commit()
    
    # Trigger recalculation automatically!
    try:
        run_calculation(db)
    except Exception as calc_err:
        logger.error(f"Errore nel ricalcolo automatico dopo eliminazione associazione: {calc_err}")
        
    return {"status": "success"}

@app.post("/api/orders/analyze")
def analyze_orders(payload: dict, db: Session = Depends(get_db)):
    order_ids_raw = payload.get("order_ids", [])
    
    # Clean order_ids (preserve insertion order, remove duplicates and invalid integers)
    order_ids = []
    for oid in order_ids_raw:
        try:
            order_ids.append(int(oid))
        except (ValueError, TypeError):
            continue
    order_ids = list(dict.fromkeys(order_ids))
    
    if not order_ids:
        return {
            "orders_found": [],
            "orders_missing": [],
            "sku_requirements": [],
            "order_requirements": []
        }
        
    # Query prestashop orders and preserve the input sequence
    orders = db.query(PrestashopOrder).filter(PrestashopOrder.order_id.in_(order_ids)).all()
    order_map = {o.order_id: o for o in orders}
    sorted_found_orders = [order_map[oid] for oid in order_ids if oid in order_map]
    
    found_order_ids = [o.order_id for o in sorted_found_orders]
    missing_order_ids = [oid for oid in order_ids if oid not in order_map]
    
    # Extract order lines
    order_lines = []
    if found_order_ids:
        order_lines = db.query(PrestashopOrderLine).filter(PrestashopOrderLine.order_id.in_(found_order_ids)).all()
    
    # Get active associations batch
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    
    # Load all components for active batch
    components_map = {}
    if active_a:
        comps = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).all()
        for c in comps:
            if c.product_id not in components_map:
                components_map[c.product_id] = []
            components_map[c.product_id].append((c.sku, c.qty_required))
            
    # Load all warehouse stock for active warehouse batch
    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    stock_map = {}
    if active_w:
        stock_items = db.query(WarehouseStock).filter(WarehouseStock.import_batch_id == active_w.id).all()
        for item in stock_items:
            sku_key = item.sku.strip()
            if not sku_key or sku_key.startswith("__spacer_"):
                continue
            if sku_key not in stock_map:
                stock_map[sku_key] = {
                    "description": item.description or "",
                    "qty_total": 0.0
                }
            stock_map[sku_key]["qty_total"] += item.qty_total
            
    # Calculate required SKUs (aggregated)
    sku_required_map = {}
    for line in order_lines:
        if is_ignored_picking_sku(line.product_reference):
            continue
        prod_id = line.product_id
        qty_ordered = line.product_quantity or 1
        
        if prod_id in components_map:
            # Composed product (explode it!)
            for sku, qty_req in components_map[prod_id]:
                sku_key = sku.strip()
                if is_ignored_picking_sku(sku_key):
                    continue
                sku_required_map[sku_key] = sku_required_map.get(sku_key, 0) + (qty_req * qty_ordered)
        else:
            # Single product, reference is SKU
            sku_key = (line.product_reference or "").strip()
            if sku_key and not is_ignored_picking_sku(sku_key):
                sku_required_map[sku_key] = sku_required_map.get(sku_key, 0) + qty_ordered
                
    # Build aggregated result
    sku_requirements = []
    for sku, qty_req in sku_required_map.items():
        stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
        sku_requirements.append({
            "sku": sku,
            "description": stock_info["description"],
            "qty_required": qty_req,
            "qty_stock": stock_info["qty_total"]
        })
        
    # Sort by SKU
    sku_requirements.sort(key=lambda x: x["sku"])
    
    # Build order-by-order requirements with progressive stock
    running_stock = {}
    for sku, info in stock_map.items():
        running_stock[sku] = info["qty_total"]
        
    order_requirements = []
    for o in sorted_found_orders:
        lines = db.query(PrestashopOrderLine).filter(PrestashopOrderLine.order_id == o.order_id).all()
        
        sku_reqs = {}
        for line in lines:
            if is_ignored_picking_sku(line.product_reference):
                continue
            prod_id = line.product_id
            qty_ordered = line.product_quantity or 1
            
            if prod_id in components_map:
                for sku, qty_req in components_map[prod_id]:
                    sku_key = sku.strip()
                    if is_ignored_picking_sku(sku_key):
                        continue
                    sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + (qty_req * qty_ordered)
            else:
                sku_key = (line.product_reference or "").strip()
                if sku_key and not is_ignored_picking_sku(sku_key):
                    sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + qty_ordered
                    
        items = []
        for sku, req_qty in sorted(sku_reqs.items()):
            stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
            qty_stock = stock_info["qty_total"]
            desc = stock_info["description"]
            
            avail_before = running_stock.get(sku, 0.0)
            running_stock[sku] = avail_before - req_qty
            avail_after = running_stock[sku]
            
            if avail_before >= req_qty:
                status = "disponibile"
                qty_fulfilled = req_qty
            elif avail_before > 0:
                status = "parziale"
                qty_fulfilled = avail_before
            else:
                status = "mancante"
                qty_fulfilled = 0.0
                
            items.append({
                "sku": sku,
                "description": desc,
                "qty_required": req_qty,
                "qty_stock": qty_stock,
                "avail_before": avail_before,
                "avail_after": avail_after,
                "qty_fulfilled": qty_fulfilled,
                "status": status
            })
            
        order_requirements.append({
            "order_id": str(o.order_id),
            "customer_name": o.customer_name or "Cliente sconosciuto",
            "items": items
        })
        
    return {
        "orders_found": found_order_ids,
        "orders_missing": missing_order_ids,
        "sku_requirements": sku_requirements,
        "order_requirements": order_requirements
    }

@app.post("/api/orders/auto-picking")
def auto_picking_orders(payload: dict, db: Session = Depends(get_db)):
    try:
        limit = int(payload.get("limit", 20))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Il numero ordini deve essere un intero valido.")

    if limit < 1 or limit > 5000:
        raise HTTPException(status_code=400, detail="Il numero ordini deve essere compreso tra 1 e 5000.")

    strict_chronology = bool(payload.get("strict_chronology", False))
    selection_strategy = str(payload.get("selection_strategy", "chronological")).strip().lower()
    if selection_strategy not in ("chronological", "maximize_orders"):
        raise HTTPException(status_code=400, detail="Strategia lista automatica non valida.")

    try:
        min_sku_residual = float(payload.get("min_sku_residual", 0) or 0)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="La scorta minima SKU deve essere un numero valido.")
    if min_sku_residual < 0:
        raise HTTPException(status_code=400, detail="La scorta minima SKU non può essere negativa.")

    sku_filter_raw = payload.get("sku_filter", [])
    if isinstance(sku_filter_raw, str):
        sku_filter_raw = [s.strip() for s in sku_filter_raw.split(",")]
    if not isinstance(sku_filter_raw, list):
        sku_filter_raw = []
    sku_filter = {
        str(sku).strip().upper()
        for sku in sku_filter_raw
        if str(sku).strip()
    }

    sku_limits_raw = payload.get("sku_limits", {})
    if not isinstance(sku_limits_raw, dict):
        raise HTTPException(status_code=400, detail="I limiti quantità per SKU devono essere una mappa valida.")
    sku_limits = {}
    for raw_sku, raw_limit in sku_limits_raw.items():
        sku_key = str(raw_sku).strip().upper()
        if not sku_key:
            continue
        try:
            max_per_order_value = float(raw_limit)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Il massimo per ordine della SKU {raw_sku} deve essere un numero valido."
            )
        if max_per_order_value <= 0 or not max_per_order_value.is_integer():
            raise HTTPException(
                status_code=400,
                detail=f"Il massimo per ordine della SKU {raw_sku} deve essere un numero intero superiore a 0."
            )
        sku_limits[sku_key] = int(max_per_order_value)
    sku_filter.update(sku_limits.keys())

    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    components_map = {}
    if active_a:
        comps = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).all()
        for c in comps:
            components_map.setdefault(c.product_id, []).append((c.sku, c.qty_required))

    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    stock_map = {}
    stock_order = {}
    if active_w:
        stock_items = db.query(WarehouseStock).filter(WarehouseStock.import_batch_id == active_w.id).order_by(WarehouseStock.id).all()
        for item in stock_items:
            sku_key = item.sku.strip()
            if not sku_key or sku_key.startswith("__spacer_"):
                continue
            if sku_key not in stock_map:
                stock_order[sku_key] = len(stock_order)
                stock_map[sku_key] = {
                    "description": item.description or "",
                    "qty_total": 0.0
                }
            stock_map[sku_key]["qty_total"] += item.qty_total

    running_stock = {sku: info["qty_total"] for sku, info in stock_map.items()}

    state_setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
    try:
        included_states = json.loads(state_setting.value) if state_setting else [12]
    except Exception:
        included_states = [12]

    orders_query = db.query(PrestashopOrder)
    if included_states:
        orders_query = orders_query.filter(PrestashopOrder.current_state.in_(included_states))
    else:
        orders_query = orders_query.filter(False)

    orders = orders_query.order_by(
        asc(PrestashopOrder.date_add),
        asc(PrestashopOrder.order_id)
    ).all()

    order_ids = [o.order_id for o in orders]
    lines_by_order = {}
    if order_ids:
        lines = db.query(PrestashopOrderLine).filter(PrestashopOrderLine.order_id.in_(order_ids)).all()
        for line in lines:
            lines_by_order.setdefault(line.order_id, []).append(line)

    selected_orders = []
    skipped_orders = []
    order_requirements = []
    sku_required_map = {}
    evaluated_count = 0
    candidate_orders = []
    sku_limit_excluded_orders = []

    for order in orders:
        sku_reqs = {}
        missing_reference_lines = []

        for line in lines_by_order.get(order.order_id, []):
            if is_ignored_picking_sku(line.product_reference):
                continue
            prod_id = line.product_id
            qty_ordered = line.product_quantity or 1

            if prod_id in components_map:
                for sku, qty_req in components_map[prod_id]:
                    sku_key = sku.strip()
                    if sku_key and not is_ignored_picking_sku(sku_key):
                        sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + (qty_req * qty_ordered)
            else:
                sku_key = (line.product_reference or "").strip()
                if sku_key and not is_ignored_picking_sku(sku_key):
                    sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + qty_ordered
                else:
                    missing_reference_lines.append({
                        "product_id": prod_id,
                        "qty_ordered": qty_ordered
                    })

        if sku_filter and not any(sku.upper() in sku_filter for sku in sku_reqs):
            continue

        exceeded_sku_limits = []
        for sku, required_qty in sorted(sku_reqs.items()):
            max_per_order = sku_limits.get(sku.upper())
            if max_per_order is not None and required_qty > max_per_order:
                exceeded_sku_limits.append({
                    "sku": sku,
                    "qty_required": required_qty,
                    "max_per_order": max_per_order,
                    "qty_excess": required_qty - max_per_order
                })

        if exceeded_sku_limits:
            sku_limit_excluded_orders.append({
                "order_id": str(order.order_id),
                "customer_name": order.customer_name or "Cliente sconosciuto",
                "date_add": order.date_add.isoformat() if order.date_add else None,
                "current_state": order.current_state,
                "current_state_label": order.current_state_label or f"Stato {order.current_state}",
                "reason": "Quantità SKU superiore al massimo per ordine",
                "exceeded_items": exceeded_sku_limits
            })
            continue

        candidate_orders.append({
            "order": order,
            "sku_reqs": sku_reqs,
            "missing_reference_lines": missing_reference_lines,
            "chronological_position": len(candidate_orders) + 1
        })

    def _stock_violations(sku_reqs, stock_snapshot):
        violations = []
        for sku, req_qty in sorted(sku_reqs.items()):
            available = stock_snapshot.get(sku, 0.0)
            available_after = available - req_qty
            stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
            if available < req_qty:
                violations.append({
                    "sku": sku,
                    "description": stock_info["description"],
                    "qty_required": req_qty,
                    "qty_available": available,
                    "qty_stock": stock_info["qty_total"],
                    "qty_available_after": available_after,
                    "qty_missing": req_qty - available,
                    "min_residual": min_sku_residual,
                    "violation_type": "insufficient_stock",
                    "detail": f"Richiesti {req_qty}, disponibili {available}: mancano {req_qty - available}."
                })
            elif min_sku_residual > 0 and available_after < min_sku_residual:
                violations.append({
                    "sku": sku,
                    "description": stock_info["description"],
                    "qty_required": req_qty,
                    "qty_available": available,
                    "qty_stock": stock_info["qty_total"],
                    "qty_available_after": available_after,
                    "qty_missing": 0,
                    "min_residual": min_sku_residual,
                    "violation_type": "protected_residual",
                    "detail": f"Dopo il prelievo resterebbero {available_after}, sotto la scorta minima {min_sku_residual}."
                })
        return violations

    def _skip_payload(candidate, violations):
        order = candidate["order"]
        missing_refs = candidate["missing_reference_lines"]
        has_protected = any(v.get("violation_type") == "protected_residual" for v in violations)
        if missing_refs:
            reason = "Riferimento prodotto mancante"
            reason_detail = "Una o più righe ordine non hanno un riferimento SKU o associazione utilizzabile."
        elif has_protected:
            reason = "SKU protetta da scorta minima"
            reason_detail = "L'ordine è preparabile, ma consumerebbe una SKU sotto la scorta minima impostata."
        elif not candidate["sku_reqs"]:
            reason = "Nessuna SKU ricavabile"
            reason_detail = "L'ordine non genera componenti SKU utili per il prelievo."
        else:
            reason = "Stock insufficiente"
            reason_detail = "Una o più SKU non hanno disponibilità sufficiente."

        return {
            "order_id": str(order.order_id),
            "customer_name": order.customer_name or "Cliente sconosciuto",
            "date_add": order.date_add.isoformat() if order.date_add else None,
            "current_state": order.current_state,
            "current_state_label": order.current_state_label or f"Stato {order.current_state}",
            "chronological_position": candidate["chronological_position"],
            "total_units": sum(candidate["sku_reqs"].values()),
            "distinct_skus": len(candidate["sku_reqs"]),
            "reason": reason,
            "reason_detail": reason_detail,
            "missing_items": violations,
            "missing_references": missing_refs
        }

    def _apply_selected_order(candidate):
        order = candidate["order"]
        sku_reqs = candidate["sku_reqs"]
        items = []
        for sku, req_qty in sorted(sku_reqs.items(), key=lambda item: (stock_order.get(item[0], 10**9), item[0])):
            stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
            avail_before = running_stock.get(sku, 0.0)
            running_stock[sku] = avail_before - req_qty
            avail_after = running_stock[sku]
            sku_required_map[sku] = sku_required_map.get(sku, 0.0) + req_qty

            items.append({
                "sku": sku,
                "description": stock_info["description"],
                "qty_required": req_qty,
                "qty_stock": stock_info["qty_total"],
                "avail_before": avail_before,
                "avail_after": avail_after,
                "qty_fulfilled": req_qty,
                "status": "disponibile"
            })

        order_requirements.append({
            "order_id": str(order.order_id),
            "customer_name": order.customer_name or "Cliente sconosciuto",
            "date_add": order.date_add.isoformat() if order.date_add else None,
            "current_state": order.current_state,
            "current_state_label": order.current_state_label or f"Stato {order.current_state}",
            "chronological_position": candidate["chronological_position"],
            "selection_position": len(selected_orders) + 1,
            "total_units": sum(sku_reqs.values()),
            "distinct_skus": len(sku_reqs),
            "items": items
        })
        selected_orders.append({
            "order_id": str(order.order_id),
            "customer_name": order.customer_name or "Cliente sconosciuto",
            "date_add": order.date_add.isoformat() if order.date_add else None,
            "current_state": order.current_state,
            "current_state_label": order.current_state_label or f"Stato {order.current_state}",
            "chronological_position": candidate["chronological_position"],
            "selection_position": len(selected_orders) + 1,
            "total_units": sum(sku_reqs.values()),
            "distinct_skus": len(sku_reqs)
        })

    if selection_strategy == "maximize_orders":
        remaining_candidates = list(candidate_orders)
        evaluated_count = len(remaining_candidates)
        while len(selected_orders) < limit and remaining_candidates:
            preparable = []
            blocked = []

            for candidate in remaining_candidates:
                violations = _stock_violations(candidate["sku_reqs"], running_stock)
                can_prepare = bool(candidate["sku_reqs"]) and not violations and not candidate["missing_reference_lines"]
                if can_prepare:
                    total_required = sum(candidate["sku_reqs"].values())
                    distinct_skus = len(candidate["sku_reqs"])
                    oldest = candidate["order"].date_add or datetime.min
                    preparable.append((total_required, distinct_skus, oldest, candidate["order"].order_id, candidate))
                else:
                    blocked.append((candidate, violations))

            if not preparable:
                skipped_orders.extend(_skip_payload(candidate, violations) for candidate, violations in blocked)
                break

            preparable.sort(key=lambda item: (item[0], item[1], item[2], item[3]))
            selected_candidate = preparable[0][4]
            _apply_selected_order(selected_candidate)
            remaining_candidates = [candidate for candidate in remaining_candidates if candidate is not selected_candidate]
    else:
        for candidate in candidate_orders:
            if len(selected_orders) >= limit:
                break

            evaluated_count += 1
            violations = _stock_violations(candidate["sku_reqs"], running_stock)
            can_prepare = bool(candidate["sku_reqs"]) and not violations and not candidate["missing_reference_lines"]

            if not can_prepare:
                skipped_orders.append(_skip_payload(candidate, violations))
                if strict_chronology:
                    break
                continue

            _apply_selected_order(candidate)

    sku_requirements = []
    for sku, qty_req in sku_required_map.items():
        stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
        sku_requirements.append({
            "sku": sku,
            "description": stock_info["description"],
            "qty_required": qty_req,
            "qty_stock": stock_info["qty_total"],
            "qty_remaining": running_stock.get(sku, 0.0)
        })

    sku_requirements.sort(key=lambda item: (stock_order.get(item["sku"], 10**9), item["sku"]))

    selected_ids = {item["order_id"] for item in selected_orders}
    skipped_ids = {item["order_id"] for item in skipped_orders}
    remaining_orders = []
    stopped_by_strict_chronology = (
        selection_strategy == "chronological"
        and strict_chronology
        and len(selected_orders) < limit
        and bool(skipped_orders)
    )

    for candidate in candidate_orders:
        order = candidate["order"]
        order_id = str(order.order_id)
        if order_id in selected_ids or order_id in skipped_ids:
            continue

        violations = _stock_violations(candidate["sku_reqs"], running_stock)
        currently_preparable = (
            bool(candidate["sku_reqs"])
            and not violations
            and not candidate["missing_reference_lines"]
        )

        if len(selected_orders) >= limit:
            pending_reason = "Limite lista raggiunto"
            pending_detail = "L'ordine resta fuori dalla proposta perché è stato raggiunto il numero massimo richiesto."
        elif stopped_by_strict_chronology:
            pending_reason = "Non valutato dopo il blocco cronologico"
            pending_detail = "La coda rigida si è fermata sul primo ordine non preparabile."
        else:
            pending_reason = "Non incluso nella proposta"
            pending_detail = "L'ordine è rimasto fuori dalla selezione corrente."

        remaining_orders.append({
            "order_id": order_id,
            "customer_name": order.customer_name or "Cliente sconosciuto",
            "date_add": order.date_add.isoformat() if order.date_add else None,
            "current_state": order.current_state,
            "current_state_label": order.current_state_label or f"Stato {order.current_state}",
            "chronological_position": candidate["chronological_position"],
            "total_units": sum(candidate["sku_reqs"].values()),
            "distinct_skus": len(candidate["sku_reqs"]),
            "currently_preparable": currently_preparable,
            "reason": pending_reason,
            "reason_detail": pending_detail,
            "missing_items": violations,
            "missing_references": candidate["missing_reference_lines"]
        })

    simulated_units = sum(item["qty_required"] for item in sku_requirements)
    initial_units_on_touched_skus = sum(item["qty_stock"] for item in sku_requirements)
    remaining_units_on_touched_skus = sum(item["qty_remaining"] for item in sku_requirements)
    stock_simulation = []
    for item in sku_requirements:
        initial_stock = item["qty_stock"]
        simulated_pick = item["qty_required"]
        final_stock = item["qty_remaining"]
        usable_stock = max(0.0, initial_stock - min_sku_residual)
        utilization_pct = (simulated_pick / usable_stock * 100) if usable_stock > 0 else 0
        stock_simulation.append({
            "sku": item["sku"],
            "description": item["description"],
            "initial_stock": initial_stock,
            "simulated_pick": simulated_pick,
            "final_stock": final_stock,
            "min_residual": min_sku_residual,
            "usable_stock": usable_stock,
            "utilization_pct": round(utilization_pct, 1),
            "at_minimum": min_sku_residual > 0 and final_stock == min_sku_residual,
            "near_minimum": min_sku_residual > 0 and final_stock < (min_sku_residual + max(1.0, simulated_pick))
        })

    selected_dates = [
        item["date_add"]
        for item in selected_orders
        if item.get("date_add")
    ]

    return {
        "mode": "automatic",
        "orders_found": [int(o["order_id"]) for o in selected_orders],
        "orders_missing": [],
        "sku_requirements": sku_requirements,
        "order_requirements": order_requirements,
        "selected_orders": selected_orders,
        "skipped_orders": skipped_orders,
        "remaining_orders": remaining_orders,
        "sku_limit_excluded_orders": sku_limit_excluded_orders,
        "stock_simulation": stock_simulation,
        "simulation_summary": {
            "selected_units": simulated_units,
            "selected_distinct_skus": len(sku_requirements),
            "initial_units_on_touched_skus": initial_units_on_touched_skus,
            "remaining_units_on_touched_skus": remaining_units_on_touched_skus,
            "oldest_selected_date": min(selected_dates) if selected_dates else None,
            "newest_selected_date": max(selected_dates) if selected_dates else None,
            "remaining_count": len(remaining_orders),
            "remaining_preparable_count": sum(1 for item in remaining_orders if item["currently_preparable"]),
            "stopped_by_strict_chronology": stopped_by_strict_chronology
        },
        "auto_picking": {
            "requested_limit": limit,
            "selected_count": len(selected_orders),
            "skipped_count": len(skipped_orders),
            "evaluated_count": evaluated_count,
            "strict_chronology": strict_chronology,
            "selection_strategy": selection_strategy,
            "min_sku_residual": min_sku_residual,
            "candidate_count": len(candidate_orders),
            "sku_filter": sorted(sku_filter),
            "sku_limits": sku_limits,
            "sku_limit_excluded_count": len(sku_limit_excluded_orders),
            "remaining_count": len(remaining_orders)
        }
    }

def _verify_extension_api_token(provided_token: Optional[str], db: Session) -> bool:
    token_setting = db.query(AppSetting).filter(AppSetting.key == "extension_api_token").first()
    expected_token = (token_setting.value if token_setting else os.getenv("GIAC_EXTENSION_TOKEN", "")).strip()
    if expected_token and provided_token != expected_token:
        raise HTTPException(status_code=401, detail="Token estensione non valido.")
    return bool(expected_token)


@app.get("/api/extension/health")
def extension_health(
    x_giac_extension_token: Optional[str] = Header(default=None, alias="X-Giac-Extension-Token"),
    db: Session = Depends(get_db)
):
    token_required = _verify_extension_api_token(x_giac_extension_token, db)
    return {
        "status": "ok",
        "extension_api": True,
        "token_required": token_required
    }


def _build_extension_archive_response(directory_name: str, filename_prefix: str, browser_label: str):
    extension_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", directory_name))
    manifest_path = os.path.join(extension_dir, "manifest.json")
    if not os.path.isdir(extension_dir) or not os.path.isfile(manifest_path):
        raise HTTPException(
            status_code=404,
            detail=f"Pacchetto dell'estensione {browser_label} non disponibile."
        )

    try:
        with open(manifest_path, "r", encoding="utf-8") as manifest_file:
            manifest = json.load(manifest_file)
        version = str(manifest.get("version") or "beta").strip()
    except Exception:
        version = "beta"

    archive_buffer = io.BytesIO()
    with zipfile.ZipFile(archive_buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for root, directories, files in os.walk(extension_dir):
            directories[:] = [
                directory for directory in directories
                if directory not in {"__pycache__", ".git"}
            ]
            for filename in files:
                if filename in {".DS_Store"} or filename.endswith((".pyc", ".zip")):
                    continue
                absolute_path = os.path.join(root, filename)
                archive_name = os.path.relpath(absolute_path, extension_dir).replace(os.sep, "/")
                archive.write(absolute_path, archive_name)

    archive_buffer.seek(0)
    download_filename = f"{filename_prefix}_{version}.zip"
    return StreamingResponse(
        archive_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"',
            "Cache-Control": "no-store"
        }
    )


@app.get("/api/extension/download")
def download_chrome_extension():
    return _build_extension_archive_response(
        "chrome-extension",
        "giac_chrome_extension_beta",
        "Chrome"
    )


@app.get("/api/extension/firefox/download")
def download_firefox_extension():
    return _build_extension_archive_response(
        "firefox-extension",
        "giac_firefox_extension_beta",
        "Firefox"
    )


@app.get("/api/extension/firefox/install")
def install_signed_firefox_extension():
    signed_xpi_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "signed-xpi-giacenza.xpi")
    )
    if not os.path.isfile(signed_xpi_path):
        raise HTTPException(
            status_code=404,
            detail="Versione Firefox firmata da Mozilla non disponibile."
        )
    return FileResponse(
        signed_xpi_path,
        media_type="application/x-xpinstall",
        headers={
            "Content-Disposition": 'inline; filename="giac-feedback-ordini-firefox.xpi"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        }
    )


@app.post("/api/extension/orders-availability")
def extension_orders_availability(
    payload: dict,
    x_giac_extension_token: Optional[str] = Header(default=None, alias="X-Giac-Extension-Token"),
    db: Session = Depends(get_db)
):
    token_required = _verify_extension_api_token(x_giac_extension_token, db)
    requested_ids = []
    for raw_order_id in payload.get("visible_order_ids", []):
        try:
            order_id = int(raw_order_id)
        except (ValueError, TypeError):
            continue
        if order_id > 0 and order_id not in requested_ids:
            requested_ids.append(order_id)
        if len(requested_ids) >= 1000:
            break

    if not requested_ids:
        return {
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "orders": {},
            "summary": {
                "requested_count": 0,
                "queue_count": 0,
                "preparable_count": 0,
                "blocked_count": 0
            },
            "token_required": token_required
        }

    try:
        min_sku_residual = float(payload.get("min_sku_residual", 0) or 0)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="La scorta minima deve essere un numero valido.")
    if min_sku_residual < 0:
        raise HTTPException(status_code=400, detail="La scorta minima non può essere negativa.")

    simulation = auto_picking_orders({
        "limit": 5000,
        "strict_chronology": False,
        "selection_strategy": "chronological",
        "min_sku_residual": min_sku_residual,
        "sku_filter": []
    }, db)

    response_orders = {}
    for order in simulation.get("order_requirements", []):
        order_id = str(order["order_id"])
        if int(order_id) not in requested_ids:
            continue
        items = order.get("items", [])
        response_orders[order_id] = {
            "status": "preparable",
            "label": "Gestibile",
            "queue_position": order.get("chronological_position"),
            "selection_position": order.get("selection_position"),
            "customer_name": order.get("customer_name"),
            "date_add": order.get("date_add"),
            "current_state_label": order.get("current_state_label"),
            "minimum_remaining": min((item.get("avail_after", 0) for item in items), default=None),
            "items": items
        }

    for order in simulation.get("skipped_orders", []):
        order_id = str(order["order_id"])
        if int(order_id) not in requested_ids:
            continue
        missing_items = order.get("missing_items", [])
        protected_only = bool(missing_items) and all(
            item.get("violation_type") == "protected_residual"
            for item in missing_items
        )
        response_orders[order_id] = {
            "status": "protected" if protected_only else "blocked",
            "label": "Scorta protetta" if protected_only else "Non gestibile",
            "queue_position": order.get("chronological_position"),
            "customer_name": order.get("customer_name"),
            "date_add": order.get("date_add"),
            "current_state_label": order.get("current_state_label"),
            "reason": order.get("reason"),
            "reason_detail": order.get("reason_detail"),
            "limiting_skus": missing_items,
            "missing_references": order.get("missing_references", [])
        }

    for order in simulation.get("remaining_orders", []):
        order_id = str(order["order_id"])
        if int(order_id) not in requested_ids:
            continue
        response_orders[order_id] = {
            "status": "pending",
            "label": "Non valutato",
            "queue_position": order.get("chronological_position"),
            "customer_name": order.get("customer_name"),
            "date_add": order.get("date_add"),
            "current_state_label": order.get("current_state_label"),
            "reason": order.get("reason"),
            "reason_detail": order.get("reason_detail")
        }

    requested_order_rows = db.query(PrestashopOrder).filter(PrestashopOrder.order_id.in_(requested_ids)).all()
    requested_order_map = {order.order_id: order for order in requested_order_rows}
    for order_id in requested_ids:
        key = str(order_id)
        if key in response_orders:
            continue
        order = requested_order_map.get(order_id)
        response_orders[key] = {
            "status": "not_in_scope" if order else "not_found",
            "label": "Fuori dagli stati inclusi" if order else "Non sincronizzato",
            "current_state_label": order.current_state_label if order else None,
            "date_add": order.date_add.isoformat() if order and order.date_add else None
        }

    active_warehouse = db.query(ImportBatch).filter(
        ImportBatch.file_type == "warehouse",
        ImportBatch.is_active == True
    ).first()
    active_associations = db.query(ImportBatch).filter(
        ImportBatch.file_type == "associations",
        ImportBatch.is_active == True
    ).first()
    latest_order_sync = db.query(func.max(PrestashopOrder.synced_at)).scalar()
    stock_source_setting = db.query(AppSetting).filter(AppSetting.key == "stock_source").first()
    google_sheet_sync_setting = db.query(AppSetting).filter(AppSetting.key == "google_sheet_last_sync").first()
    prestashop_sync_setting = db.query(AppSetting).filter(AppSetting.key == "prestashop_last_sync").first()

    stock_source = stock_source_setting.value if stock_source_setting else "local_upload"
    warehouse_changed_at = _utc_iso(active_warehouse.imported_at) if active_warehouse else None
    warehouse_checked_at = (
        _utc_iso(google_sheet_sync_setting.value)
        if stock_source == "google_sheets" and google_sheet_sync_setting and google_sheet_sync_setting.value
        else warehouse_changed_at
    )
    orders_checked_at = (
        _utc_iso(prestashop_sync_setting.value)
        if prestashop_sync_setting and prestashop_sync_setting.value
        else _utc_iso(latest_order_sync)
    )

    return {
        "calculated_at": datetime.now(timezone.utc).isoformat(),
        "policy": {
            "selection_strategy": "chronological",
            "skip_unpreparable": True,
            "min_sku_residual": min_sku_residual
        },
        "freshness": {
            "stock_source": stock_source,
            "warehouse_checked_at": warehouse_checked_at,
            "warehouse_changed_at": warehouse_changed_at,
            "warehouse_imported_at": warehouse_changed_at,
            "associations_imported_at": _utc_iso(active_associations.imported_at) if active_associations else None,
            "orders_checked_at": orders_checked_at,
            "orders_synced_at": orders_checked_at
        },
        "orders": response_orders,
        "summary": {
            "requested_count": len(requested_ids),
            "queue_count": simulation.get("auto_picking", {}).get("candidate_count", 0),
            "preparable_count": sum(1 for item in response_orders.values() if item["status"] == "preparable"),
            "blocked_count": sum(1 for item in response_orders.values() if item["status"] in ("blocked", "protected"))
        },
        "token_required": token_required
    }

@app.post("/api/orders/analyze-files")
def analyze_orders_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    ps_client: PrestaShopClient = Depends(get_ps_client)
):
    all_rows = []
    all_order_refs = set()
    all_anomalies = []
    files_processed = []
    
    for upload_file in files:
        try:
            content = upload_file.file.read()
            valid_rows, order_refs, anomalies = parse_picking_orders_excel(content, upload_file.filename)
            
            # Attach filename to row for fallback grouping
            for r in valid_rows:
                r["filename"] = upload_file.filename
                
            all_rows.extend(valid_rows)
            all_order_refs.update(order_refs)
            all_anomalies.extend(anomalies)
            files_processed.append({
                "filename": upload_file.filename,
                "rows_count": len(valid_rows)
            })
        except Exception as e:
            logger.error(f"Errore nel parsing del file {upload_file.filename}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Errore nel parsing del file {upload_file.filename}: {str(e)}")
            
    if not all_rows:
        return {
            "orders_found": [],
            "orders_missing": [],
            "sku_requirements": [],
            "order_requirements": [],
            "anomalies": all_anomalies,
            "files_processed": files_processed
        }
        
    # Aggregate quantities by product_id
    aggregated_products = {}
    for row in all_rows:
        pid = row["product_id"]
        qty = row["quantity"]
        aggregated_products[pid] = aggregated_products.get(pid, 0.0) + qty
        
    # Load all components for active batch
    active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
    components_map = {}
    if active_a:
        comps = db.query(ProductComponent).filter(ProductComponent.import_batch_id == active_a.id).all()
        for c in comps:
            if c.product_id not in components_map:
                components_map[c.product_id] = []
            components_map[c.product_id].append((c.sku, c.qty_required))
            
    # Load all warehouse stock for active warehouse batch
    active_w = db.query(ImportBatch).filter(ImportBatch.file_type == "warehouse", ImportBatch.is_active == True).first()
    stock_map = {}
    if active_w:
        stock_items = db.query(WarehouseStock).filter(WarehouseStock.import_batch_id == active_w.id).all()
        for item in stock_items:
            sku_key = item.sku.strip()
            if not sku_key or sku_key.startswith("__spacer_"):
                continue
            if sku_key not in stock_map:
                stock_map[sku_key] = {
                    "description": item.description or "",
                    "qty_total": 0.0
                }
            stock_map[sku_key]["qty_total"] += item.qty_total
            
    # Resolve product_ids to SKUs (aggregated)
    sku_required_map = {}
    
    # Cache for DB product reference lookup
    ref_db_cache = {}
    
    for pid, qty_ordered in aggregated_products.items():
        if pid in components_map:
            # Composed product
            for sku, qty_req in components_map[pid]:
                sku_key = sku.strip()
                if is_ignored_picking_sku(sku_key):
                    continue
                sku_required_map[sku_key] = sku_required_map.get(sku_key, 0.0) + (qty_req * qty_ordered)
        else:
            # Single product, let's find the reference
            sku_key = None
            
            # 1. Check local db cache
            if pid in ref_db_cache:
                sku_key = ref_db_cache[pid]
            else:
                cached_line = db.query(PrestashopOrderLine.product_reference).filter(
                    PrestashopOrderLine.product_id == pid,
                    PrestashopOrderLine.product_reference != None,
                    PrestashopOrderLine.product_reference != ""
                ).first()
                if cached_line:
                    sku_key = cached_line[0].strip()
                    ref_db_cache[pid] = sku_key
                    
            # 2. Check PrestaShop Webservice
            if not sku_key and ps_client:
                sku_key = ps_client.get_product_reference(pid)
                if sku_key:
                    ref_db_cache[pid] = sku_key
                    
            # 3. Fallback to ID-XXXX
            if not sku_key:
                sku_key = f"ID-{pid}"
                all_anomalies.append({
                    "source": "file_picking_import",
                    "record_key": f"ID {pid}",
                    "anomaly_type": "missing_reference",
                    "message": f"Impossibile trovare il codice SKU (riferimento) per il Prodotto ID {pid}. Utilizzato SKU provvisorio '{sku_key}'."
                })
                
            if not is_ignored_picking_sku(sku_key):
                sku_required_map[sku_key] = sku_required_map.get(sku_key, 0.0) + qty_ordered
            
    # Build aggregated result
    sku_requirements = []
    for sku, qty_req in sku_required_map.items():
        stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
        sku_requirements.append({
            "sku": sku,
            "description": stock_info["description"],
            "qty_required": qty_req,
            "qty_stock": stock_info["qty_total"]
        })
        
    sku_requirements.sort(key=lambda x: x["sku"])
    
    # Group rows into order-by-order structures to preserve sequence
    order_groups = {}
    order_sequence = []
    
    for row in all_rows:
        filename = row.get("filename", "excel")
        order_ref = row.get("order_ref")
        customer = row.get("customer")
        
        if order_ref:
            order_key = str(order_ref)
        else:
            order_key = f"File: {filename}"
            
        if order_key not in order_groups:
            order_groups[order_key] = {
                "customer": customer or "Cliente sconosciuto",
                "rows": []
            }
            order_sequence.append(order_key)
            
        if customer and order_groups[order_key]["customer"] == "Cliente sconosciuto":
            order_groups[order_key]["customer"] = customer
            
        order_groups[order_key]["rows"].append(row)
        
    # Build order-by-order requirements with progressive stock
    running_stock = {}
    for sku, info in stock_map.items():
        running_stock[sku] = info["qty_total"]
        
    order_requirements = []
    for order_key in order_sequence:
        group = order_groups[order_key]
        rows = group["rows"]
        customer = group["customer"]
        
        sku_reqs = {}
        for row in rows:
            pid = row["product_id"]
            qty_ordered = row["quantity"]
            
            if pid in components_map:
                for sku, qty_req in components_map[pid]:
                    sku_key = sku.strip()
                    if is_ignored_picking_sku(sku_key):
                        continue
                    sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + (qty_req * qty_ordered)
            else:
                sku_key = None
                if pid in ref_db_cache:
                    sku_key = ref_db_cache[pid]
                else:
                    cached_line = db.query(PrestashopOrderLine.product_reference).filter(
                        PrestashopOrderLine.product_id == pid,
                        PrestashopOrderLine.product_reference != None,
                        PrestashopOrderLine.product_reference != ""
                    ).first()
                    if cached_line:
                        sku_key = cached_line[0].strip()
                        ref_db_cache[pid] = sku_key
                
                if not sku_key and ps_client:
                    sku_key = ps_client.get_product_reference(pid)
                    if sku_key:
                        ref_db_cache[pid] = sku_key
                        
                if not sku_key:
                    sku_key = f"ID-{pid}"
                    
                if not is_ignored_picking_sku(sku_key):
                    sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + qty_ordered
                
        items = []
        for sku, req_qty in sorted(sku_reqs.items()):
            stock_info = stock_map.get(sku, {"description": "Non presente in magazzino", "qty_total": 0.0})
            qty_stock = stock_info["qty_total"]
            desc = stock_info["description"]
            
            avail_before = running_stock.get(sku, 0.0)
            running_stock[sku] = avail_before - req_qty
            avail_after = running_stock[sku]
            
            if avail_before >= req_qty:
                status = "disponibile"
                qty_fulfilled = req_qty
            elif avail_before > 0:
                status = "parziale"
                qty_fulfilled = avail_before
            else:
                status = "mancante"
                qty_fulfilled = 0.0
                
            items.append({
                "sku": sku,
                "description": desc,
                "qty_required": req_qty,
                "qty_stock": qty_stock,
                "avail_before": avail_before,
                "avail_after": avail_after,
                "qty_fulfilled": qty_fulfilled,
                "status": status
            })
            
        order_requirements.append({
            "order_id": order_key,
            "customer_name": customer,
            "items": items
        })
        
    return {
        "orders_found": sorted(list(all_order_refs)) if all_order_refs else sorted(list(order_sequence)),
        "orders_missing": [],
        "sku_requirements": sku_requirements,
        "order_requirements": order_requirements,
        "anomalies": all_anomalies,
        "files_processed": files_processed
    }

@app.get("/api/orders")
def get_orders(
    page: int = 1,
    limit: int = 50,
    state_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    available_states = db.query(
        PrestashopOrder.current_state,
        PrestashopOrder.current_state_label,
        func.count(PrestashopOrder.order_id)
    ).group_by(
        PrestashopOrder.current_state,
        PrestashopOrder.current_state_label
    ).order_by(PrestashopOrder.current_state_label).all()

    orders_query = db.query(PrestashopOrder)
    if state_id is not None:
        orders_query = orders_query.filter(PrestashopOrder.current_state == state_id)

    total_orders = orders_query.count()
    
    orders = orders_query.order_by(desc(PrestashopOrder.date_add)).offset(offset).limit(limit).all()
    
    result = []
    for o in orders:
        lines = db.query(PrestashopOrderLine).filter(PrestashopOrderLine.order_id == o.order_id).all()
        lines_data = []
        for l in lines:
            # We want to show which SKUs are generated by this product line
            active_a = db.query(ImportBatch).filter(ImportBatch.file_type == "associations", ImportBatch.is_active == True).first()
            skus_gen = []
            if active_a:
                comps = db.query(ProductComponent).filter(
                    ProductComponent.import_batch_id == active_a.id,
                    ProductComponent.product_id == l.product_id
                ).all()
                skus_gen = [f"{c.sku} (x{c.qty_required * l.product_quantity})" for c in comps]
                
            lines_data.append({
                "product_id": l.product_id,
                "product_reference": l.product_reference or "",
                "product_name": l.product_name or "",
                "product_quantity": l.product_quantity,
                "has_association": bool(skus_gen),
                "skus_generated": ", ".join(skus_gen) if skus_gen else "Nessuna associazione trovata"
            })
            
        result.append({
            "order_id": o.order_id,
            "current_state": o.current_state,
            "current_state_label": o.current_state_label or f"Stato {o.current_state}",
            "date_add": o.date_add.isoformat() if o.date_add else None,
            "date_upd": o.date_upd.isoformat() if o.date_upd else None,
            "lines": lines_data
        })
        
    return {
        "orders": result,
        "total": total_orders,
        "page": page,
        "limit": limit,
        "total_pages": (total_orders + limit - 1) // limit if limit > 0 else 1,
        "available_states": [{
            "id": state_id_value,
            "name": state_label or f"Stato {state_id_value}",
            "count": count
        } for state_id_value, state_label, count in available_states]
    }

@app.get("/api/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(ImportAnomaly).order_by(desc(ImportAnomaly.created_at)).all()
    product_ids = {
        int(a.record_key)
        for a in anomalies
        if a.record_key and str(a.record_key).isdigit()
    }
    product_names = {}
    if product_ids:
        product_rows = db.query(
            PrestashopOrderLine.product_id,
            PrestashopOrderLine.product_name
        ).filter(
            PrestashopOrderLine.product_id.in_(product_ids),
            PrestashopOrderLine.product_name.isnot(None),
            PrestashopOrderLine.product_name != ""
        ).all()
        for product_id, product_name in product_rows:
            product_names.setdefault(product_id, product_name)

    # Le nuove anomalie salvano direttamente l'ID ordine. Per quelle storiche
    # recuperiamo l'ID dal testo "Ordine 12345" così il filtro funziona subito.
    anomaly_order_ids = {}
    for anomaly in anomalies:
        order_id = anomaly.order_id
        if order_id is None and anomaly.message:
            order_match = re.search(r"\bOrdine\s+(\d+)\b", anomaly.message, re.IGNORECASE)
            if order_match:
                order_id = int(order_match.group(1))
        if order_id is not None:
            anomaly_order_ids[anomaly.id] = order_id

    order_state_map = {}
    if anomaly_order_ids:
        related_orders = db.query(PrestashopOrder).filter(
            PrestashopOrder.order_id.in_(set(anomaly_order_ids.values()))
        ).all()
        order_state_map = {order.order_id: order for order in related_orders}

    result = []
    for anomaly in anomalies:
        order_id = anomaly_order_ids.get(anomaly.id)
        order = order_state_map.get(order_id)
        result.append({
            "id": anomaly.id,
            "source": anomaly.source,
            "record_key": anomaly.record_key or "",
            "product_name": product_names.get(int(anomaly.record_key), "") if anomaly.record_key and str(anomaly.record_key).isdigit() else "",
            "order_id": order_id,
            "current_state": order.current_state if order else None,
            "current_state_label": (order.current_state_label or f"Stato {order.current_state}") if order else "",
            "anomaly_type": anomaly.anomaly_type,
            "message": anomaly.message,
            "created_at": anomaly.created_at.isoformat() + "Z" if anomaly.created_at else None
        })
    return result

@app.post("/api/anomalies/clear")
def clear_anomalies(db: Session = Depends(get_db)):
    db.query(ImportAnomaly).delete()
    db.commit()
    return {"status": "success"}

# ----------------- BACKUP & RESTORE -----------------

def _get_db_path() -> str:
    """Return the absolute path to the SQLite database file."""
    db_url = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")
    # Strip sqlite:/// prefix and resolve relative path from process cwd
    raw_path = db_url.replace("sqlite:///", "")
    return os.path.abspath(raw_path)

@app.get("/api/backup")
def download_backup():
    """Download the full SQLite database as a binary file."""
    db_path = _get_db_path()
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found.")
    
    today = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"inventory_backup_{today}.db"
    
    return FileResponse(
        path=db_path,
        media_type="application/octet-stream",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.post("/api/restore")
async def restore_backup(file: UploadFile = File(...)):
    """Restore the SQLite database from an uploaded .db file, then restart the server."""
    db_path = _get_db_path()
    
    # Read uploaded content
    content = await file.read()
    
    # Validate SQLite magic header (first 16 bytes: "SQLite format 3\x00")
    SQLITE_MAGIC = b"SQLite format 3\x00"
    if not content[:16] == SQLITE_MAGIC:
        raise HTTPException(
            status_code=400,
            detail="File non valido: non è un database SQLite. Il ripristino è stato annullato."
        )
    
    # Save automatic pre-restore backup alongside the current db
    pre_restore_path = db_path.replace(".db", "_pre_restore.db")
    try:
        if os.path.exists(db_path):
            import shutil
            shutil.copy2(db_path, pre_restore_path)
            logger.info(f"Pre-restore backup salvato in: {pre_restore_path}")
    except Exception as e:
        logger.warning(f"Impossibile creare backup pre-ripristino: {e}")
    
    # Write new database file
    try:
        with open(db_path, "wb") as f:
            f.write(content)
        logger.info(f"Database ripristinato con successo da: {file.filename} ({len(content)} bytes)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella scrittura del database: {str(e)}")
    
    # Schedule server restart in a background thread (gives time for HTTP response to be sent)
    def _restart():
        import time
        time.sleep(1.5)
        logger.info("Avvio del riavvio del server dopo il ripristino del database...")
        # Dispose the engine connections pool
        try:
            engine.dispose()
        except Exception:
            pass
        # Re-execute the current process
        os.execv(sys.executable, [sys.executable] + sys.argv)
    
    import sys
    restart_thread = threading.Thread(target=_restart, daemon=True)
    restart_thread.start()
    
    return {
        "status": "success",
        "message": "Database ripristinato. Il server si sta riavviando...",
        "bytes_written": len(content),
        "pre_restore_backup": os.path.basename(pre_restore_path)
    }

# ----------------- SERVE FRONTEND STATIC FILES -----------------

# Set up static files serving for the frontend React app in production mode
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
    logger.info(f"Frontend static files mounted from: {frontend_dist}")
else:
    logger.warning(f"Frontend build folder '{frontend_dist}' not found. Serving API only. Run 'npm run build' in frontend first.")
    
    @app.get("/")
    def read_root():
        return {
            "message": "PrestaShop Inventory Backend API is running. Build the frontend or run Vite dev server to access the UI.",
            "api_docs": "/docs"
        }
