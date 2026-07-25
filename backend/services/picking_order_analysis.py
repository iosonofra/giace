from collections import defaultdict

from backend.models import (
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
    WarehouseStock,
)
from backend.picking_rules import is_ignored_picking_sku


def analyze_stored_orders(db, order_ids_raw) -> dict:
    order_ids = _normalize_order_ids(order_ids_raw)
    if not order_ids:
        return _empty_result()

    orders = (
        db.query(PrestashopOrder)
        .filter(PrestashopOrder.order_id.in_(order_ids))
        .all()
    )
    order_map = {
        order.order_id: order
        for order in orders
    }
    sorted_orders = [
        order_map[order_id]
        for order_id in order_ids
        if order_id in order_map
    ]
    found_order_ids = [
        order.order_id
        for order in sorted_orders
    ]
    missing_order_ids = [
        order_id
        for order_id in order_ids
        if order_id not in order_map
    ]

    lines_by_order = _load_lines_by_order(db, found_order_ids)
    components_map, stock_map = load_inventory_context(db)
    all_requirements = _aggregate_requirements(
        (
            line
            for order_lines in lines_by_order.values()
            for line in order_lines
        ),
        components_map,
    )

    return {
        "orders_found": found_order_ids,
        "orders_missing": missing_order_ids,
        "sku_requirements": serialize_aggregate_requirements(
            all_requirements,
            stock_map,
        ),
        "order_requirements": _build_progressive_requirements(
            sorted_orders,
            lines_by_order,
            components_map,
            stock_map,
        ),
    }


def _normalize_order_ids(order_ids_raw) -> list[int]:
    normalized = []
    for order_id in order_ids_raw:
        try:
            normalized.append(int(order_id))
        except (TypeError, ValueError):
            continue
    return list(dict.fromkeys(normalized))


def _empty_result() -> dict:
    return {
        "orders_found": [],
        "orders_missing": [],
        "sku_requirements": [],
        "order_requirements": [],
    }


def _load_lines_by_order(db, order_ids):
    if not order_ids:
        return {}

    lines = (
        db.query(PrestashopOrderLine)
        .filter(PrestashopOrderLine.order_id.in_(order_ids))
        .order_by(
            PrestashopOrderLine.order_id,
            PrestashopOrderLine.id,
        )
        .all()
    )
    lines_by_order = defaultdict(list)
    for line in lines:
        lines_by_order[line.order_id].append(line)
    return lines_by_order


def load_inventory_context(db):
    active_associations = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    components_map = defaultdict(list)
    if active_associations:
        components = (
            db.query(ProductComponent)
            .filter(
                ProductComponent.import_batch_id
                == active_associations.id
            )
            .order_by(
                ProductComponent.product_id,
                ProductComponent.id,
            )
            .all()
        )
        for component in components:
            components_map[component.product_id].append(
                (component.sku, component.qty_required)
            )

    active_warehouse = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "warehouse",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    stock_map = {}
    if active_warehouse:
        stock_items = (
            db.query(WarehouseStock)
            .filter(
                WarehouseStock.import_batch_id
                == active_warehouse.id
            )
            .all()
        )
        for item in stock_items:
            sku = item.sku.strip()
            if not sku or sku.startswith("__spacer_"):
                continue
            stock_info = stock_map.setdefault(
                sku,
                {
                    "description": item.description or "",
                    "qty_total": 0.0,
                },
            )
            stock_info["qty_total"] += item.qty_total

    return components_map, stock_map


def _aggregate_requirements(
    lines,
    components_map,
    *,
    zero=0,
):
    requirements = {}
    for line in lines:
        for sku, quantity in _line_requirements(
            line,
            components_map,
        ).items():
            requirements[sku] = requirements.get(sku, zero) + quantity
    return requirements


def _line_requirements(line, components_map):
    if is_ignored_picking_sku(line.product_reference):
        return {}

    quantity_ordered = line.product_quantity or 1
    components = components_map.get(line.product_id)
    if components:
        requirements = {}
        for sku, quantity_required in components:
            normalized_sku = sku.strip()
            if is_ignored_picking_sku(normalized_sku):
                continue
            requirements[normalized_sku] = (
                requirements.get(normalized_sku, 0)
                + quantity_required * quantity_ordered
            )
        return requirements

    sku = (line.product_reference or "").strip()
    if not sku or is_ignored_picking_sku(sku):
        return {}
    return {sku: quantity_ordered}


def serialize_aggregate_requirements(requirements, stock_map):
    return [
        {
            "sku": sku,
            "description": _stock_info(stock_map, sku)["description"],
            "qty_required": quantity,
            "qty_stock": _stock_info(stock_map, sku)["qty_total"],
        }
        for sku, quantity in sorted(requirements.items())
    ]


def _build_progressive_requirements(
    orders,
    lines_by_order,
    components_map,
    stock_map,
):
    running_stock = {
        sku: info["qty_total"]
        for sku, info in stock_map.items()
    }
    order_requirements = []

    for order in orders:
        requirements = _aggregate_requirements(
            lines_by_order.get(order.order_id, []),
            components_map,
            zero=0.0,
        )
        items = [
            allocate_requirement(
                sku,
                quantity,
                stock_map,
                running_stock,
            )
            for sku, quantity in sorted(requirements.items())
        ]
        order_requirements.append(
            {
                "order_id": str(order.order_id),
                "customer_name": (
                    order.customer_name
                    or "Cliente sconosciuto"
                ),
                "items": items,
            }
        )

    return order_requirements


def allocate_requirement(
    sku,
    quantity,
    stock_map,
    running_stock,
):
    stock_info = _stock_info(stock_map, sku)
    available_before = running_stock.get(sku, 0.0)
    available_after = available_before - quantity
    running_stock[sku] = available_after

    if available_before >= quantity:
        status = "disponibile"
        fulfilled = quantity
    elif available_before > 0:
        status = "parziale"
        fulfilled = available_before
    else:
        status = "mancante"
        fulfilled = 0.0

    return {
        "sku": sku,
        "description": stock_info["description"],
        "qty_required": quantity,
        "qty_stock": stock_info["qty_total"],
        "avail_before": available_before,
        "avail_after": available_after,
        "qty_fulfilled": fulfilled,
        "status": status,
    }


def _stock_info(stock_map, sku):
    return stock_map.get(
        sku,
        {
            "description": "Non presente in magazzino",
            "qty_total": 0.0,
        },
    )
