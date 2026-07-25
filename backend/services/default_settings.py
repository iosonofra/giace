import json
import os
from collections.abc import Mapping

from backend.models import AppSetting


def _default_state_ids(environment: Mapping[str, str]) -> str:
    configured_ids = environment.get("DEFAULT_STATE_IDS", "12")
    state_ids = [
        int(value.strip())
        for value in configured_ids.split(",")
        if value.strip().isdigit()
    ]
    return json.dumps(state_ids or [12])


def _default_values(environment: Mapping[str, str]) -> dict[str, str]:
    mock_mode = environment.get("MOCK_MODE", "True").lower() in {
        "true",
        "1",
        "yes",
    }

    return {
        "included_state_ids": _default_state_ids(environment),
        "prestashop_url": environment.get("PRESTASHOP_URL", ""),
        "prestashop_admin_url": "",
        "prestashop_api_key": environment.get("PRESTASHOP_API_KEY", ""),
        "prestashop_mock_mode": "true" if mock_mode else "false",
        "stock_source": "local_upload",
        "google_sheet_url": (
            "https://docs.google.com/spreadsheets/"
            "d/1F0I-N5IRe7aH0EBsBJK0XT8N0h-R9Gg6/"
        ),
        "google_sheet_name": "ROSATE",
        "google_sheet_sync_interval": "10",
        "prestashop_sync_interval": "10",
        "prestashop_last_sync": "",
        "prestashop_last_error": "",
        "mapping_sku": "Sku",
        "mapping_qty": "Qta Tot.",
        "mapping_desc": "Descrizione Sku",
        "mapping_lotto": "Lotto",
    }


def initialize_default_settings(
    db,
    environment: Mapping[str, str] | None = None,
) -> list[str]:
    """Insert missing application settings without overwriting saved values."""
    environment = os.environ if environment is None else environment
    created_keys = []

    for key, value in _default_values(environment).items():
        existing = db.query(AppSetting).filter(AppSetting.key == key).first()
        if existing:
            continue

        db.add(AppSetting(key=key, value=value))
        created_keys.append(key)

    db.commit()
    return created_keys
