from collections import defaultdict

from sqlalchemy import desc, func

from backend.models import (
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
)


def list_orders(
    db,
    *,
    page: int = 1,
    limit: int = 50,
    state_id: int | None = None,
) -> dict:
    available_states = _load_available_states(db)
    orders_query = db.query(PrestashopOrder)
    if state_id is not None:
        orders_query = orders_query.filter(
            PrestashopOrder.current_state == state_id
        )

    total_orders = orders_query.count()
    orders = (
        orders_query
        .order_by(desc(PrestashopOrder.date_add))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    lines_by_order, components_by_product = _load_order_details(
        db,
        orders,
    )

    return {
        "orders": [
            _serialize_order(
                order,
                lines_by_order.get(order.order_id, []),
                components_by_product,
            )
            for order in orders
        ],
        "total": total_orders,
        "page": page,
        "limit": limit,
        "total_pages": (
            (total_orders + limit - 1) // limit
            if limit > 0
            else 1
        ),
        "available_states": [
            {
                "id": state_value,
                "name": label or f"Stato {state_value}",
                "count": count,
            }
            for state_value, label, count in available_states
        ],
    }


def _load_available_states(db):
    return (
        db.query(
            PrestashopOrder.current_state,
            PrestashopOrder.current_state_label,
            func.count(PrestashopOrder.order_id),
        )
        .group_by(
            PrestashopOrder.current_state,
            PrestashopOrder.current_state_label,
        )
        .order_by(PrestashopOrder.current_state_label)
        .all()
    )


def _load_order_details(db, orders):
    order_ids = [order.order_id for order in orders]
    if not order_ids:
        return {}, {}

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

    active_batch = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    if not active_batch or not lines:
        return lines_by_order, {}

    product_ids = {
        line.product_id
        for line in lines
    }
    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id == active_batch.id,
            ProductComponent.product_id.in_(product_ids),
        )
        .order_by(
            ProductComponent.product_id,
            ProductComponent.id,
        )
        .all()
    )
    components_by_product = defaultdict(list)
    for component in components:
        components_by_product[component.product_id].append(component)

    return lines_by_order, components_by_product


def _serialize_order(order, lines, components_by_product):
    return {
        "order_id": order.order_id,
        "current_state": order.current_state,
        "current_state_label": (
            order.current_state_label
            or f"Stato {order.current_state}"
        ),
        "date_add": (
            order.date_add.isoformat()
            if order.date_add
            else None
        ),
        "date_upd": (
            order.date_upd.isoformat()
            if order.date_upd
            else None
        ),
        "lines": [
            _serialize_line(
                line,
                components_by_product.get(line.product_id, []),
            )
            for line in lines
        ],
    }


def _serialize_line(line, components):
    generated_skus = [
        f"{component.sku} "
        f"(x{component.qty_required * line.product_quantity})"
        for component in components
    ]
    return {
        "product_id": line.product_id,
        "product_reference": line.product_reference or "",
        "product_name": line.product_name or "",
        "product_quantity": line.product_quantity,
        "has_association": bool(generated_skus),
        "skus_generated": (
            ", ".join(generated_skus)
            if generated_skus
            else "Nessuna associazione trovata"
        ),
    }
