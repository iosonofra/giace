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
    """Replace only the requested orders, preserving the other rows."""
    synced_at = synced_at or _utc_naive_now()
    saved_count = 0

    for order in orders_data:
        order_id = order["order_id"]
        (
            db.query(PrestashopOrderLine)
            .filter(PrestashopOrderLine.order_id == order_id)
            .delete()
        )
        (
            db.query(PrestashopOrder)
            .filter(PrestashopOrder.order_id == order_id)
            .delete()
        )

        db.add(_build_order(order, states_map, synced_at))
        db.commit()

        for line in order["lines"]:
            db.add(_build_line(order_id, line))
        saved_count += 1

    db.commit()
    return saved_count
