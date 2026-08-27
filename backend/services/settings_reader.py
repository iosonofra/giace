import json
import os
from collections.abc import Mapping

from backend.models import AppSetting


def _boolean(value: str) -> bool:
    return value.lower() in {"true", "1", "yes"}


def _positive_integer(value: str | None, default: int = 10) -> int:
    return int(value) if value and value.isdigit() else default


def _keyword_list(value: str | None) -> list[str]:
    try:
        parsed = json.loads(value or '["RESO", "RESI"]')
    except (TypeError, ValueError):
        parsed = ["RESO", "RESI"]
    if not isinstance(parsed, list):
        return ["RESO", "RESI"]
    normalized = []
    for item in parsed:
        keyword = str(item or "").strip().upper()
        if keyword and keyword not in normalized:
            normalized.append(keyword)
    return normalized or ["RESO", "RESI"]


DEFAULT_PICKING_DAY_MAPPING = {
    "monday": "Lunedì",
    "tuesday": "Martedì",
    "wednesday": "Mercoledì",
    "thursday": "Giovedì",
    "friday": "Venerdì",
    "saturday": "",
    "sunday": "",
}


def _day_mapping(value: str | None) -> dict[str, str]:
    try:
        parsed = json.loads(value or "{}")
    except (TypeError, ValueError):
        parsed = {}
    if not isinstance(parsed, dict):
        parsed = {}
    return {
        key: str(parsed.get(key, default) or "").strip()
        for key, default in DEFAULT_PICKING_DAY_MAPPING.items()
    }


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
        "exclude_return_lots": _boolean(
            settings.get("exclude_return_lots", "false")
        ),
        "excluded_lot_keywords": _keyword_list(
            settings.get("excluded_lot_keywords")
        ),
        "picking_sheet_write_enabled": _boolean(
            settings.get("picking_sheet_write_enabled", "false")
        ),
        "picking_sheet_webapp_url": settings.get(
            "picking_sheet_webapp_url",
            "",
        ),
        "picking_sheet_shared_secret_configured": bool(
            settings.get("picking_sheet_shared_secret", "").strip()
        ),
        "picking_sheet_remaining_header": settings.get(
            "picking_sheet_remaining_header",
            "RIMANENTI",
        ),
        "picking_sheet_day_mapping": _day_mapping(
            settings.get("picking_sheet_day_mapping")
        ),
    }
