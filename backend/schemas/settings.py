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
    exclude_return_lots: bool
    excluded_lot_keywords: list[str]
    picking_sheet_write_enabled: bool
    picking_sheet_webapp_url: str
    picking_sheet_shared_secret_configured: bool
    picking_sheet_remaining_header: str
    picking_sheet_day_mapping: dict[str, str]


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
    exclude_return_lots: Any = None
    excluded_lot_keywords: Any = None
    picking_sheet_write_enabled: Any = None
    picking_sheet_webapp_url: Any = None
    picking_sheet_shared_secret: Any = None
    picking_sheet_remaining_header: Any = None
    picking_sheet_day_mapping: Any = None

    def provided_values(self) -> dict:
        return self.model_dump(exclude_unset=True)
