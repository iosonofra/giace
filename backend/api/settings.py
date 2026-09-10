import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.calculator import run_calculation
from backend.schemas.settings import (
    SettingsResponse,
    SettingsImportPayload,
    SettingsUpdatePayload,
)
from backend.services.settings_actions import (
    SettingsActionError,
    run_google_sheets_sync,
    test_prestashop_connection as check_prestashop_connection,
)
from backend.services.settings_env import BACKEND_DIR, sync_env_file
from backend.services.settings_reader import read_settings
from backend.services.settings_writer import (
    SettingsValidationError,
    write_settings,
)
from backend.services.calculation_inputs import (
    resolve_calculation_batch_ids,
)


router = APIRouter(tags=["settings"])
logger = logging.getLogger(__name__)

TRANSFERABLE_SETTING_FIELDS = {
    "included_state_ids",
    "gaer_state_ids",
    "prestashop_url",
    "prestashop_admin_url",
    "prestashop_mock_mode",
    "stock_source",
    "google_sheet_url",
    "google_sheet_name",
    "google_sheet_sync_interval",
    "prestashop_sync_interval",
    "mapping_sku",
    "mapping_qty",
    "mapping_desc",
    "mapping_lotto",
    "exclude_return_lots",
    "excluded_lot_keywords",
    "picking_sheet_write_enabled",
    "picking_sheet_webapp_url",
    "picking_sheet_remaining_header",
    "picking_sheet_day_mapping",
}


def _recalculate_after_policy_change(db: Session) -> None:
    try:
        batch_ids = resolve_calculation_batch_ids(db)
        if batch_ids.warehouse and batch_ids.associations:
            run_calculation(db)
    except Exception:
        logger.exception(
            "Impossibile ricalcolare le giacenze dopo la modifica "
            "della policy sui lotti."
        )


@router.get("/api/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    return read_settings(db)


@router.get("/api/settings/export")
def export_settings(db: Session = Depends(get_db)):
    current = read_settings(db)
    return {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "settings": {
            key: current[key]
            for key in TRANSFERABLE_SETTING_FIELDS
        },
        "sensitive_fields_omitted": [
            "prestashop_api_key",
            "extension_api_token",
            "picking_sheet_shared_secret",
        ],
    }


@router.post("/api/settings/import", response_model=SettingsResponse)
def import_settings(
    payload: SettingsImportPayload,
    db: Session = Depends(get_db),
):
    if payload.version != 1:
        raise HTTPException(
            status_code=400,
            detail="Versione del file di configurazione non supportata.",
        )
    unknown_fields = set(payload.settings) - TRANSFERABLE_SETTING_FIELDS
    if unknown_fields:
        raise HTTPException(
            status_code=400,
            detail=(
                "Il file contiene opzioni non riconosciute: "
                + ", ".join(sorted(unknown_fields))
            ),
        )
    try:
        write_settings(db, payload.settings)
    except SettingsValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    _sync_env_file(db)
    if {"exclude_return_lots", "excluded_lot_keywords"} & payload.settings.keys():
        _recalculate_after_policy_change(db)
    return get_settings(db)


_sync_env_file = sync_env_file


@router.post(
    "/api/settings",
    response_model=SettingsResponse,
)
def update_settings(
    payload: SettingsUpdatePayload,
    db: Session = Depends(get_db),
):
    if isinstance(payload, SettingsUpdatePayload):
        payload = payload.provided_values()
    calculation_policy_changed = bool(
        {"exclude_return_lots", "excluded_lot_keywords"}
        & payload.keys()
    )
    try:
        write_settings(db, payload)
    except SettingsValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    _sync_env_file(db)
    if calculation_policy_changed:
        _recalculate_after_policy_change(db)
    return get_settings(db)

@router.post("/api/settings/google-sheets/sync")
def trigger_google_sheets_sync(db: Session = Depends(get_db)):
    try:
        return run_google_sheets_sync(db)
    except SettingsActionError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

@router.post("/api/settings/test-connection")
def test_prestashop_connection(payload: dict):
    try:
        return check_prestashop_connection(payload)
    except SettingsActionError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
