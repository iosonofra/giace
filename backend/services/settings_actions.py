import logging
from collections.abc import Callable
from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.models import AppSetting
from backend.services.google_sheets import sync_stock_from_google_sheets


logger = logging.getLogger(__name__)


class SettingsActionError(Exception):
    """Raised when an operational settings action cannot be completed."""


def run_google_sheets_sync(
    db: Session,
    *,
    stock_sync: Callable[..., dict] = sync_stock_from_google_sheets,
) -> dict:
    try:
        return stock_sync(db, force=True)
    except Exception as error:
        _save_google_sheet_error(db, str(error))
        raise SettingsActionError(str(error)) from error


def test_prestashop_connection(
    payload: dict[str, Any],
    *,
    request_get: Callable[..., Any] = requests.get,
) -> dict[str, str]:
    url = payload.get("prestashop_url", "")
    api_key = payload.get("prestashop_api_key", "")
    mock_mode = payload.get("prestashop_mock_mode", False)

    if mock_mode:
        return {
            "status": "success",
            "message": "Connessione simulata riuscita (Mock Mode attiva).",
        }

    if not url or not api_key:
        raise SettingsActionError("URL e Chiave API sono richiesti.")

    try:
        response = request_get(
            f"{url.rstrip('/')}/order_states",
            params={
                "display": "[id]",
                "limit": "1",
                "output_format": "JSON",
                "ws_key": api_key,
            },
            timeout=10,
        )
        response.raise_for_status()
    except Exception as error:
        logger.error(
            "Errore durante il test di connessione PrestaShop: %s",
            error,
        )
        raise SettingsActionError(
            f"Errore di connessione: {error}",
        ) from error

    return {
        "status": "success",
        "message": "Connessione al server PrestaShop riuscita!",
    }


def _save_google_sheet_error(db: Session, message: str) -> None:
    setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "google_sheet_last_error")
        .first()
    )
    if setting:
        setting.value = message
    else:
        db.add(
            AppSetting(
                key="google_sheet_last_error",
                value=message,
            )
        )
    db.commit()
