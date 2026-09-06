from collections import defaultdict

from sqlalchemy import String, and_, asc, case, cast, desc, func, or_

from backend.models import (
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
)
from backend.services.order_sync_config import load_included_state_ids


def list_orders(
    db,
    *,
    page: int = 1,
    limit: int = 50,
    state_id: int | None = None,
    query: str | None = None,
    missing_association: bool = False,
    sort_by: str = "date_add",
    sort_direction: str = "desc",
) -> dict:
    available_states = list_available_order_states(db)
    active_batch = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    active_batch_id = active_batch.id if active_batch else None
    orders_query = db.query(PrestashopOrder)
    if state_id is not None:
        orders_query = orders_query.filter(
            PrestashopOrder.current_state == state_id
        )

    normalized_query = (query or "").strip()
    if normalized_query:
        search_pattern = f"%{normalized_query}%"
        matching_line = (
            db.query(PrestashopOrderLine.id)
            .filter(
                PrestashopOrderLine.order_id == PrestashopOrder.order_id,
                or_(
                    cast(PrestashopOrderLine.product_id, String).ilike(search_pattern),
                    PrestashopOrderLine.product_reference.ilike(search_pattern),
                    PrestashopOrderLine.product_name.ilike(search_pattern),
                ),
            )
            .correlate(PrestashopOrder)
            .exists()
        )
        predicates = [
            cast(PrestashopOrder.order_id, String).ilike(search_pattern),
            PrestashopOrder.current_state_label.ilike(search_pattern),
            cast(PrestashopOrder.current_state, String).ilike(search_pattern),
            matching_line,
        ]
        if active_batch_id is not None:
            matching_component = (
                db.query(ProductComponent.id)
                .join(
                    PrestashopOrderLine,
                    PrestashopOrderLine.product_id == ProductComponent.product_id,
                )
                .filter(
                    PrestashopOrderLine.order_id == PrestashopOrder.order_id,
                    ProductComponent.import_batch_id == active_batch_id,
                    ProductComponent.sku.ilike(search_pattern),
                )
                .correlate(PrestashopOrder)
                .exists()
            )
            predicates.append(matching_component)
        orders_query = orders_query.filter(or_(*predicates))

    missing_line = _missing_association_expression(db, active_batch_id)
    if missing_association:
        orders_query = orders_query.filter(missing_line)

    component_join = and_(
        ProductComponent.product_id == PrestashopOrderLine.product_id,
        ProductComponent.import_batch_id == active_batch_id,
    )
    total_orders, total_product_lines, orders_without_associations = (
        orders_query
        .with_entities(
            func.count(func.distinct(PrestashopOrder.order_id)),
            func.count(func.distinct(PrestashopOrderLine.id)),
            func.count(
                func.distinct(
                    case(
                        (
                            ProductComponent.id.is_(None),
                            PrestashopOrder.order_id,
                        ),
                        else_=None,
                    )
                )
            ),
        )
        .outerjoin(
            PrestashopOrderLine,
            PrestashopOrderLine.order_id == PrestashopOrder.order_id,
        )
        .outerjoin(ProductComponent, component_join)
        .one()
    )
    total_orders = int(total_orders or 0)
    total_product_lines = int(total_product_lines or 0)
    orders_without_associations = int(orders_without_associations or 0)

    sort_columns = {
        "order_id": PrestashopOrder.order_id,
        "state": PrestashopOrder.current_state_label,
        "date_add": PrestashopOrder.date_add,
    }
    sort_column = sort_columns.get(sort_by, PrestashopOrder.date_add)
    sort_function = asc if sort_direction == "asc" else desc
    orders = (
        orders_query
        .order_by(
            sort_function(sort_column),
            desc(PrestashopOrder.order_id),
        )
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    lines_by_order, components_by_product = _load_order_details(
        db,
        orders,
        active_batch_id=active_batch_id,
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
        "available_states": available_states,
        "summary": {
            "product_lines": total_product_lines,
            "without_associations": orders_without_associations,
        },
    }


def _missing_association_expression(db, active_batch_id):
    component_exists = (
        db.query(ProductComponent.id)
        .filter(
            ProductComponent.product_id == PrestashopOrderLine.product_id,
            ProductComponent.import_batch_id == active_batch_id,
        )
        .correlate(PrestashopOrderLine)
        .exists()
    )
    return (
        db.query(PrestashopOrderLine.id)
        .filter(
            PrestashopOrderLine.order_id == PrestashopOrder.order_id,
            ~component_exists,
        )
        .correlate(PrestashopOrder)
        .exists()
    )


def list_available_order_states(db) -> list[dict]:
    states = (
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
    return [
        {
            "id": state_value,
            "name": label or f"Stato {state_value}",
            "count": count,
        }
        for state_value, label, count in states
    ]


def list_enabled_order_states(
    db,
    prestashop_states: list[dict] | None = None,
) -> list[dict]:
    enabled_ids = load_included_state_ids(db)
    local_states = {
        state["id"]: state
        for state in list_available_order_states(db)
    }
    prestashop_names = {}
    for state in prestashop_states or []:
        try:
            state_id = int(state.get("id"))
        except (AttributeError, TypeError, ValueError):
            continue
        name = str(state.get("name") or "").strip()
        if name:
            prestashop_names[state_id] = name

    return [
        {
            "id": state_id,
            "name": (
                prestashop_names.get(state_id)
                or local_states.get(state_id, {}).get("name")
                or f"Stato {state_id}"
            ),
            "count": local_states.get(state_id, {}).get("count", 0),
        }
        for state_id in enabled_ids
    ]


def _load_order_details(db, orders, *, active_batch_id=None):
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

    if active_batch_id is None or not lines:
        return lines_by_order, {}

    product_ids = {
        line.product_id
        for line in lines
    }
    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id == active_batch_id,
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
