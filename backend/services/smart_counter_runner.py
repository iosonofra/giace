import json

from sqlalchemy import asc

from backend.models import (
    AppSetting,
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
    WarehouseStock,
)
from backend.services.smart_counter import (
    EMPTY_SUMMARY,
    simulate_smart_counter,
)


def run_smart_counter(
    db,
    sku,
    *,
    simulator=simulate_smart_counter,
) -> dict:
    batches = _load_active_batches(db)
    active_associations = batches.get("associations")
    if not active_associations:
        return _empty_result()

    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == active_associations.id
        )
        .order_by(ProductComponent.id)
        .all()
    )
    components_map = {}
    selected_product_ids = set()
    for component in components:
        components_map.setdefault(
            component.product_id,
            [],
        ).append(component)
        if component.sku == sku:
            selected_product_ids.add(component.product_id)

    if not selected_product_ids:
        return _empty_result()

    stock_map = _load_stock(
        db,
        batches.get("warehouse"),
    )
    active_orders, lines_by_order = _load_orders(db)

    return simulator(
        selected_sku=sku,
        active_orders=active_orders,
        lines_by_order=lines_by_order,
        components_map=components_map,
        selected_product_ids=selected_product_ids,
        stock_map=stock_map,
    )


def _empty_result():
    return {
        "orders": [],
        "summary": dict(EMPTY_SUMMARY),
    }


def _load_active_batches(db):
    batches = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type.in_(
                ("associations", "warehouse")
            ),
            ImportBatch.is_active.is_(True),
        )
        .order_by(ImportBatch.id)
        .all()
    )
    batch_map = {}
    for batch in batches:
        batch_map.setdefault(batch.file_type, batch)
    return batch_map


def _load_stock(db, active_warehouse):
    if not active_warehouse:
        return {}

    stock_items = (
        db.query(WarehouseStock)
        .filter(
            WarehouseStock.import_batch_id
            == active_warehouse.id
        )
        .order_by(WarehouseStock.id)
        .all()
    )
    stock_map = {}
    for item in stock_items:
        sku = item.sku.strip()
        if not sku or sku.startswith("__spacer_"):
            continue
        stock_entry = stock_map.setdefault(
            sku,
            {
                "description": item.description or "",
                "qty_total": 0.0,
            },
        )
        stock_entry["qty_total"] += item.qty_total
    return stock_map


def _load_orders(db):
    state_setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "included_state_ids")
        .first()
    )
    try:
        included_states = (
            json.loads(state_setting.value)
            if state_setting
            else [12]
        )
    except Exception:
        included_states = [12]

    orders_query = db.query(PrestashopOrder)
    if included_states:
        orders_query = orders_query.filter(
            PrestashopOrder.current_state.in_(included_states)
        )
    else:
        orders_query = orders_query.filter(False)

    active_orders = (
        orders_query
        .order_by(
            asc(PrestashopOrder.date_add),
            asc(PrestashopOrder.order_id),
        )
        .all()
    )
    order_ids = [
        order.order_id
        for order in active_orders
    ]
    lines_by_order = {}
    if order_ids:
        lines = (
            db.query(PrestashopOrderLine)
            .filter(
                PrestashopOrderLine.order_id.in_(order_ids)
            )
            .order_by(
                asc(PrestashopOrderLine.order_id),
                asc(PrestashopOrderLine.id),
            )
            .all()
        )
        for line in lines:
            lines_by_order.setdefault(
                line.order_id,
                [],
            ).append(line)

    return active_orders, lines_by_order
