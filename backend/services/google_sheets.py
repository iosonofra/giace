import hashlib
import logging
import re
import threading
from datetime import datetime, timezone

import requests
from sqlalchemy.orm import Session

from backend.calculator import run_calculation
from backend.excel_parser import parse_warehouse_excel
from backend.models import AppSetting
from backend.services.warehouse_import import (
    MAPPING_DEFAULTS,
    persist_warehouse_rows,
    resolve_column_mappings,
)


logger = logging.getLogger(__name__)
google_sheets_sync_lock = threading.Lock()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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

GOOGLE_SETTING_KEYS = (
    "stock_source",
    "google_sheet_url",
    "google_sheet_name",
    "google_sheet_hash",
    "google_sheet_last_sync",
    "google_sheet_last_error",
    *MAPPING_DEFAULTS,
)


def sync_stock_from_google_sheets(
    db: Session,
    force: bool = False,
    *,
    request_get=requests.get,
    parser=parse_warehouse_excel,
    calculation_runner=run_calculation,
    now_factory=_utc_now_iso,
) -> dict:
    if not google_sheets_sync_lock.acquire(blocking=False):
        return {
            "status": "skipped",
            "message": "Sincronizzazione Google Sheets già in corso."
        }
    try:
        settings = (
            db.query(AppSetting)
            .filter(AppSetting.key.in_(GOOGLE_SETTING_KEYS))
            .all()
        )
        settings_by_key = {
            setting.key: setting
            for setting in settings
        }
        mappings = resolve_column_mappings(settings)
        url = _setting_value(
            settings_by_key,
            "google_sheet_url",
            "",
        )
        sheet_name = _setting_value(
            settings_by_key,
            "google_sheet_name",
            "ROSATE",
        )
        old_hash = _setting_value(
            settings_by_key,
            "google_sheet_hash",
            "",
        )

        if not url:
            raise ValueError("L'URL del Google Sheet non è impostato nelle impostazioni.")

        try:
            export_url = convert_google_sheets_url(url)
        except Exception as e:
            raise ValueError(f"URL di Google Sheets non valido: {str(e)}")

        try:
            response = request_get(export_url, timeout=30)
            if response.status_code != 200:
                raise ValueError(f"HTTP {response.status_code} durante il download dal Google Sheet.")
            file_content = response.content
        except Exception as e:
            raise ValueError(f"Errore nella connessione/scaricamento del Google Sheet: {str(e)}")

        new_hash = hashlib.md5(file_content).hexdigest()

        if new_hash == old_hash and not force:
            _set_setting(
                db,
                settings_by_key,
                "google_sheet_last_sync",
                now_factory(),
            )
            db.commit()

            return {
                "status": "skipped",
                "message": "Nessun cambiamento rilevato nel Google Sheet rispetto all'ultimo calcolo.",
                "hash": new_hash
            }

        try:
            valid_rows, anomalies = parser(
                file_content,
                sheet_name,
                col_sku=mappings["mapping_sku"],
                col_qty=mappings["mapping_qty"],
                col_desc=mappings["mapping_desc"],
                col_lotto=mappings["mapping_lotto"],
            )
        except Exception as e:
            raise ValueError(f"Errore nel parsing del Google Sheet: {str(e)}")

        for key, value in [
            ("google_sheet_hash", new_hash),
            ("google_sheet_last_sync", now_factory()),
            ("google_sheet_last_error", ""),
        ]:
            _set_setting(
                db,
                settings_by_key,
                key,
                value,
            )

        batch, records_imported = persist_warehouse_rows(
            db,
            valid_rows,
            anomalies,
            filename="Google Sheet Sincronizzato",
            sheet_name=sheet_name,
        )

        try:
            calculation_runner(
                db,
                warehouse_batch_id=batch.id,
            )
        except Exception as calc_err:
            logger.error(f"Errore nel calcolo automatico dopo sincronizzazione Google Sheet: {calc_err}")

        return {
            "status": "success",
            "batch_id": batch.id,
            "records_imported": records_imported,
            "hash": new_hash
        }
    finally:
        google_sheets_sync_lock.release()


def _setting_value(
    settings_by_key,
    key,
    default,
):
    setting = settings_by_key.get(key)
    return setting.value if setting and setting.value else default


def _set_setting(
    db,
    settings_by_key,
    key,
    value,
):
    setting = settings_by_key.get(key)
    if setting:
        setting.value = value
        return

    setting = AppSetting(key=key, value=value)
    settings_by_key[key] = setting
    db.add(setting)
