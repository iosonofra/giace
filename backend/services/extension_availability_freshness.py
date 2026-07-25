from datetime import datetime, timezone

from sqlalchemy import func

from backend.models import AppSetting, ImportBatch, PrestashopOrder


FRESHNESS_SETTING_KEYS = (
    "stock_source",
    "google_sheet_last_sync",
    "prestashop_last_sync",
)


def load_freshness(db):
    batches = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type.in_(("warehouse", "associations")),
            ImportBatch.is_active.is_(True),
        )
        .order_by(ImportBatch.id)
        .all()
    )
    batch_map = {}
    for batch in batches:
        batch_map.setdefault(batch.file_type, batch)

    latest_order_sync = db.query(
        func.max(PrestashopOrder.synced_at)
    ).scalar()
    settings = {
        setting.key: setting.value
        for setting in (
            db.query(AppSetting)
            .filter(AppSetting.key.in_(FRESHNESS_SETTING_KEYS))
            .all()
        )
    }

    active_warehouse = batch_map.get("warehouse")
    active_associations = batch_map.get("associations")
    stock_source = settings.get("stock_source", "local_upload")
    warehouse_changed_at = (
        utc_iso(active_warehouse.imported_at)
        if active_warehouse
        else None
    )
    google_sync = settings.get("google_sheet_last_sync")
    warehouse_checked_at = (
        utc_iso(google_sync)
        if stock_source == "google_sheets" and google_sync
        else warehouse_changed_at
    )
    prestashop_sync = settings.get("prestashop_last_sync")
    orders_checked_at = (
        utc_iso(prestashop_sync)
        if prestashop_sync
        else utc_iso(latest_order_sync)
    )

    return {
        "stock_source": stock_source,
        "warehouse_checked_at": warehouse_checked_at,
        "warehouse_changed_at": warehouse_changed_at,
        "warehouse_imported_at": warehouse_changed_at,
        "associations_imported_at": (
            utc_iso(active_associations.imported_at)
            if active_associations
            else None
        ),
        "orders_checked_at": orders_checked_at,
        "orders_synced_at": orders_checked_at,
    }


def utc_iso(value):
    if not value:
        return None
    try:
        return _parse_utc(value).isoformat()
    except (TypeError, ValueError):
        return None


def _parse_utc(value):
    if isinstance(value, datetime):
        parsed = value
    else:
        normalized = str(value).strip()
        if normalized.endswith("Z"):
            normalized = normalized[:-1] + "+00:00"
        parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
