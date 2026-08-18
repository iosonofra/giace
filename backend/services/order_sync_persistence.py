import logging
from datetime import datetime, timezone

from backend.models import (
    ImportAnomaly,
    PrestashopOrder,
    PrestashopOrderLine,
)


logger = logging.getLogger(__name__)


def _utc_naive_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _build_order(
    order: dict,
    states_map: dict[int, str],
    synced_at: datetime,
) -> PrestashopOrder:
    state_id = order["current_state"]
    return PrestashopOrder(
        order_id=order["order_id"],
        current_state=state_id,
        current_state_label=states_map.get(
            state_id,
            f"Stato {state_id}",
        ),
        date_add=order["date_add"],
        date_upd=order["date_upd"],
        customer_name=order.get("customer_name"),
        total_paid=order.get("total_paid"),
        synced_at=synced_at,
    )


def _build_line(
    order_id: int,
    line: dict,
) -> PrestashopOrderLine:
    return PrestashopOrderLine(
        order_id=order_id,
        line_id=line["line_id"],
        product_id=line["product_id"],
        product_attribute_id=line["product_attribute_id"],
        product_reference=line["product_reference"],
        product_name=line.get("product_name"),
        product_quantity=line["product_quantity"],
    )


def save_order_snapshot(
    db,
    orders_data: list[dict],
    states_map: dict[int, str],
    synced_at: datetime | None = None,
) -> int:
    """Replace the local order snapshot and return saved order count."""
    db.query(PrestashopOrderLine).delete()
    db.query(PrestashopOrder).delete()
    (
        db.query(ImportAnomaly)
        .filter(ImportAnomaly.source == "orders_sync")
        .delete()
    )

    synced_at = synced_at or _utc_naive_now()
    seen_order_ids = set()
    orders_to_save = []
    lines_to_save = []

    for order in orders_data:
        order_id = order["order_id"]
        if order_id in seen_order_ids:
            logger.warning(
                "Ordine duplicato ignorato durante il salvataggio: %s",
                order_id,
            )
            continue
        seen_order_ids.add(order_id)

        orders_to_save.append(
            _build_order(order, states_map, synced_at)
        )

        for line in order["lines"]:
            lines_to_save.append(
                _build_line(order_id, line)
            )

    if orders_to_save:
        db.bulk_save_objects(orders_to_save)
    if lines_to_save:
        db.bulk_save_objects(lines_to_save)
    db.commit()

    return len(orders_to_save)


def save_specific_orders(
    db,
    orders_data: list[dict],
    states_map: dict[int, str],
    synced_at: datetime | None = None,
) -> int:
    """Replace requested orders in one transaction."""
    return apply_order_delta(
        db,
        orders_data,
        [order["order_id"] for order in orders_data],
        states_map,
        synced_at=synced_at,
        clear_sync_anomalies=False,
    )


def apply_order_delta(
    db,
    orders_data: list[dict],
    replace_order_ids,
    states_map: dict[int, str],
    synced_at: datetime | None = None,
    *,
    clear_sync_anomalies: bool = True,
) -> int:
    """Atomically remove stale rows and insert changed order details."""
    synced_at = synced_at or _utc_naive_now()
    replace_ids = {
        int(order_id)
        for order_id in replace_order_ids
    }
    unique_orders = {}
    for order in orders_data:
        order_id = int(order["order_id"])
        replace_ids.add(order_id)
        if order_id in unique_orders:
            logger.warning(
                "Ordine duplicato ignorato durante il delta: %s",
                order_id,
            )
            continue
        unique_orders[order_id] = order

    if replace_ids:
        (
            db.query(PrestashopOrderLine)
            .filter(PrestashopOrderLine.order_id.in_(replace_ids))
            .delete()
        )
        (
            db.query(PrestashopOrder)
            .filter(PrestashopOrder.order_id.in_(replace_ids))
            .delete()
        )

    if clear_sync_anomalies:
        (
            db.query(ImportAnomaly)
            .filter(ImportAnomaly.source == "orders_sync")
            .delete()
        )

    orders_to_save = [
        _build_order(order, states_map, synced_at)
        for order in unique_orders.values()
    ]
    lines_to_save = [
        _build_line(order_id, line)
        for order_id, order in unique_orders.items()
        for line in order["lines"]
    ]

    if orders_to_save:
        db.bulk_save_objects(orders_to_save)
    if lines_to_save:
        db.bulk_save_objects(lines_to_save)

    db.commit()
    return len(orders_to_save)
