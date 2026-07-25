from typing import Any

from pydantic import BaseModel


class SettingsResponse(BaseModel):
    included_state_ids: list[int]
    prestashop_url: str
    prestashop_admin_url: str
    prestashop_api_key: str
    prestashop_mock_mode: bool
    extension_api_token: str
    extension_api_token_configured: bool
    stock_source: str
    google_sheet_url: str
    google_sheet_name: str
    google_sheet_sync_interval: int
    google_sheet_last_sync: str
    google_sheet_last_error: str
    prestashop_sync_interval: int
    prestashop_last_sync: str
    prestashop_last_error: str
    mapping_sku: str
    mapping_qty: str
    mapping_desc: str
    mapping_lotto: str


class SettingsUpdatePayload(BaseModel):
    included_state_ids: Any = None
    prestashop_url: Any = None
    prestashop_admin_url: Any = None
    prestashop_api_key: Any = None
    prestashop_mock_mode: Any = None
    extension_api_token: Any = None
    stock_source: Any = None
    google_sheet_url: Any = None
    google_sheet_name: Any = None
    google_sheet_sync_interval: Any = None
    prestashop_sync_interval: Any = None
    mapping_sku: Any = None
    mapping_qty: Any = None
    mapping_desc: Any = None
    mapping_lotto: Any = None

    def provided_values(self) -> dict:
        return self.model_dump(exclude_unset=True)
