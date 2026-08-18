import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.calculator import run_calculation
from backend.schemas.settings import (
    SettingsResponse,
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


@router.get("/api/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    return read_settings(db)


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
        try:
            batch_ids = resolve_calculation_batch_ids(db)
            if batch_ids.warehouse and batch_ids.associations:
                run_calculation(db)
        except Exception:
            logger.exception(
                "Impossibile ricalcolare le giacenze dopo la modifica "
                "della policy sui lotti."
            )
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
