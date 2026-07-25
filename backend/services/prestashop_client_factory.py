import os
from collections.abc import Mapping
from typing import Any

from backend.models import AppSetting
from backend.prestashop_client import PrestaShopClient


PRESTASHOP_SETTING_KEYS = (
    "prestashop_url",
    "prestashop_api_key",
    "prestashop_mock_mode",
)


def create_prestashop_client(
    db,
    *,
    environment: Mapping[str, str] | None = None,
    client_type: type[PrestaShopClient] = PrestaShopClient,
) -> PrestaShopClient:
    environment = os.environ if environment is None else environment
    settings = _read_prestashop_settings(db)

    return client_type(
        url=settings.get(
            "prestashop_url",
            environment.get("PRESTASHOP_URL", ""),
        ),
        api_key=settings.get(
            "prestashop_api_key",
            environment.get("PRESTASHOP_API_KEY", ""),
        ),
        mock_mode=_boolean(
            settings.get(
                "prestashop_mock_mode",
                environment.get("MOCK_MODE", "True"),
            )
        ),
    )


def _read_prestashop_settings(db) -> dict[str, Any]:
    rows = (
        db.query(AppSetting)
        .filter(AppSetting.key.in_(PRESTASHOP_SETTING_KEYS))
        .all()
    )
    return {
        setting.key: setting.value
        for setting in rows
    }


def _boolean(value: Any) -> bool:
    return str(value).lower() in {"true", "1", "yes"}
