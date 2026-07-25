import os

from sqlalchemy import func

from backend.models import (
    AppSetting,
    CalcRun,
    ImportBatch,
    PrestashopOrder,
)


def get_system_status(
    db,
    client,
    *,
    workspace_dir: str,
) -> dict:
    batches_by_type = _load_active_batches(db)
    warehouse_batch = batches_by_type.get("warehouse")
    associations_batch = batches_by_type.get("associations")

    latest_calculation = (
        db.query(CalcRun)
        .filter(CalcRun.status == "completed")
        .order_by(CalcRun.completed_at.desc())
        .first()
    )
    settings = _load_sync_settings(db)
    order_stats = (
        db.query(
            func.max(PrestashopOrder.synced_at),
            func.count(PrestashopOrder.order_id),
        )
        .first()
    )
    last_orders_data_sync = _iso_z(
        order_stats[0] if order_stats else None
    )
    orders_count = (
        order_stats[1]
        if order_stats
        else 0
    )
    prestashop_setting = settings.get(
        "prestashop_last_sync"
    )
    prestashop_last_sync = (
        prestashop_setting.value
        if prestashop_setting
        and prestashop_setting.value
        else None
    )
    google_setting = settings.get(
        "google_sheet_last_sync"
    )

    return {
        "mock_mode": client.mock_mode,
        "prestashop_url": (
            client.url
            if not client.mock_mode
            else "Simulato (Mock Mode)"
        ),
        "database": "SQLite (attivo)",
        "last_orders_sync": (
            prestashop_last_sync
            or last_orders_data_sync
        ),
        "last_orders_data_sync": last_orders_data_sync,
        "google_sheet_last_sync": (
            google_setting.value
            if google_setting
            else None
        ),
        "prestashop_orders_count": orders_count,
        "active_warehouse_batch": _serialize_batch(
            warehouse_batch,
            include_sheet=True,
        ),
        "active_associations_batch": _serialize_batch(
            associations_batch,
            include_sheet=False,
        ),
        "latest_calculation": (
            {
                "id": latest_calculation.id,
                "completed_at": _iso_z(
                    latest_calculation.completed_at
                ),
                "status": latest_calculation.status,
            }
            if latest_calculation
            else None
        ),
        "local_files": {
            "giacenza_exists": os.path.exists(
                os.path.join(
                    workspace_dir,
                    "giacenza.xlsx",
                )
            ),
            "associazione_exists": os.path.exists(
                os.path.join(
                    workspace_dir,
                    "associazione.xlsx",
                )
            ),
            "workspace_path": workspace_dir,
        },
    }


def _load_active_batches(db) -> dict:
    batches = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type.in_(
                ("warehouse", "associations"),
            ),
            ImportBatch.is_active.is_(True),
        )
        .order_by(ImportBatch.id.asc())
        .all()
    )
    result = {}
    for batch in batches:
        result.setdefault(batch.file_type, batch)
    return result


def _load_sync_settings(db) -> dict:
    settings = (
        db.query(AppSetting)
        .filter(
            AppSetting.key.in_(
                (
                    "prestashop_last_sync",
                    "google_sheet_last_sync",
                )
            )
        )
        .all()
    )
    return {
        setting.key: setting
        for setting in settings
    }


def _serialize_batch(
    batch,
    *,
    include_sheet: bool,
):
    if not batch:
        return None

    result = {
        "id": batch.id,
        "filename": batch.filename,
    }
    if include_sheet:
        result["sheet_name"] = batch.sheet_name
    result.update(
        {
            "imported_at": _iso_z(batch.imported_at),
            "record_count": batch.record_count,
        }
    )
    return result


def _iso_z(value):
    return (
        value.isoformat() + "Z"
        if value
        else None
    )
