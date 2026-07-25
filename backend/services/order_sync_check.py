import logging
from datetime import datetime, timezone
from typing import Any, Optional

from backend.models import (
    AppSetting,
    CalcRun,
    PrestashopOrder,
    PrestashopOrderLine,
)


logger = logging.getLogger(__name__)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_remote_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.strptime(
            str(value),
            "%Y-%m-%d %H:%M:%S",
        )
    except (TypeError, ValueError):
        return None


def orders_match(
    remote_orders: list[dict],
    local_orders: list,
) -> bool:
    local_dates = {
        order.order_id: order.date_upd
        for order in local_orders
    }
    if len(local_dates) != len(remote_orders):
        return False

    for remote_order in remote_orders:
        order_id = remote_order.get("id")
        if order_id not in local_dates:
            return False
        if local_dates[order_id] != parse_remote_datetime(
            remote_order.get("date_upd")
        ):
            return False
    return True


def _product_names_need_backfill(db) -> bool:
    return (
        db.query(PrestashopOrderLine.id)
        .filter(
            (PrestashopOrderLine.product_name == None)
            | (PrestashopOrderLine.product_name == "")
        )
        .first()
        is not None
    )


def _has_completed_calculation(db) -> bool:
    return (
        db.query(CalcRun)
        .filter(CalcRun.status == "completed")
        .first()
        is not None
    )


def _has_previous_error(db) -> bool:
    error_setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "prestashop_last_error")
        .first()
    )
    return bool(error_setting and error_setting.value)


def _save_last_check(db, checked_at: str) -> None:
    last_sync_setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "prestashop_last_sync")
        .first()
    )
    if last_sync_setting:
        last_sync_setting.value = checked_at
    else:
        db.add(
            AppSetting(
                key="prestashop_last_sync",
                value=checked_at,
            )
        )
    db.commit()


def run_quick_sync_check(
    db,
    client,
    included_states: list[int],
    valid_product_ids: list[int],
    now_factory=utc_now_iso,
) -> dict | None:
    remote_orders = client.get_order_ids_and_update_times(
        included_states,
        valid_product_ids,
    )
    local_orders = db.query(PrestashopOrder).all()

    can_compare = (
        _has_completed_calculation(db)
        and not _has_previous_error(db)
        and not _product_names_need_backfill(db)
    )
    if not can_compare or not orders_match(
        remote_orders,
        local_orders,
    ):
        return None

    logger.info(
        "Nessuna modifica rilevata negli ordini PrestaShop. "
        "Sincronizzazione saltata."
    )
    _save_last_check(db, now_factory())
    return {
        "status": "skipped",
        "message": (
            "Nessuna modifica rilevata negli ordini PrestaShop "
            "rispetto all'ultimo calcolo."
        ),
        "orders_synced": len(local_orders),
        "mock_mode": client.mock_mode,
    }
