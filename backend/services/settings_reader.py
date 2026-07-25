import json
import os
from collections.abc import Mapping

from backend.models import AppSetting


def _boolean(value: str) -> bool:
    return value.lower() in {"true", "1", "yes"}


def _positive_integer(value: str | None, default: int = 10) -> int:
    return int(value) if value and value.isdigit() else default


def read_settings(
    db,
    environment: Mapping[str, str] | None = None,
) -> dict:
    environment = os.environ if environment is None else environment
    settings = {
        setting.key: setting.value
        for setting in db.query(AppSetting).all()
    }

    extension_token = settings.get(
        "extension_api_token",
        environment.get("GIAC_EXTENSION_TOKEN", ""),
    )
    mock_value = settings.get(
        "prestashop_mock_mode",
        environment.get("MOCK_MODE", "True"),
    )

    return {
        "included_state_ids": json.loads(
            settings.get("included_state_ids", "[12]")
        ),
        "prestashop_url": settings.get(
            "prestashop_url",
            environment.get("PRESTASHOP_URL", ""),
        ),
        "prestashop_admin_url": settings.get(
            "prestashop_admin_url",
            "",
        ),
        "prestashop_api_key": settings.get(
            "prestashop_api_key",
            environment.get("PRESTASHOP_API_KEY", ""),
        ),
        "prestashop_mock_mode": _boolean(mock_value),
        "extension_api_token": extension_token,
        "extension_api_token_configured": bool(
            extension_token.strip()
        ),
        "stock_source": settings.get(
            "stock_source",
            "local_upload",
        ),
        "google_sheet_url": settings.get("google_sheet_url", ""),
        "google_sheet_name": settings.get(
            "google_sheet_name",
            "ROSATE",
        ),
        "google_sheet_sync_interval": _positive_integer(
            settings.get("google_sheet_sync_interval")
        ),
        "google_sheet_last_sync": settings.get(
            "google_sheet_last_sync",
            "",
        ),
        "google_sheet_last_error": settings.get(
            "google_sheet_last_error",
            "",
        ),
        "prestashop_sync_interval": _positive_integer(
            settings.get("prestashop_sync_interval")
        ),
        "prestashop_last_sync": settings.get(
            "prestashop_last_sync",
            "",
        ),
        "prestashop_last_error": settings.get(
            "prestashop_last_error",
            "",
        ),
        "mapping_sku": settings.get("mapping_sku", "Sku"),
        "mapping_qty": settings.get("mapping_qty", "Qta Tot."),
        "mapping_desc": settings.get(
            "mapping_desc",
            "Descrizione Sku",
        ),
        "mapping_lotto": settings.get("mapping_lotto", "Lotto"),
    }
