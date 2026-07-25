from backend.models import PrestashopOrder


def serialize_simulation_orders(
    simulation,
    requested_ids,
    chronological_mode,
):
    requested_set = set(requested_ids)
    response_orders = {}

    for order in simulation.get("order_requirements", []):
        order_id = str(order["order_id"])
        if int(order_id) not in requested_set:
            continue
        items = order.get("items", [])
        response_orders[order_id] = {
            "status": "preparable",
            "label": "Gestibile",
            "queue_position": (
                order.get("chronological_position")
                if chronological_mode
                else None
            ),
            "selection_position": order.get("selection_position"),
            "date_add": order.get("date_add"),
            "current_state_label": order.get("current_state_label"),
            "minimum_remaining": min(
                (item.get("avail_after", 0) for item in items),
                default=None,
            ),
            "items": items,
        }

    for order in simulation.get("skipped_orders", []):
        order_id = str(order["order_id"])
        if int(order_id) not in requested_set:
            continue
        missing_items = order.get("missing_items", [])
        protected_only = bool(missing_items) and all(
            item.get("violation_type") == "protected_residual"
            for item in missing_items
        )
        response_orders[order_id] = {
            "status": "protected" if protected_only else "blocked",
            "label": (
                "Scorta protetta" if protected_only else "Non gestibile"
            ),
            "queue_position": (
                order.get("chronological_position")
                if chronological_mode
                else None
            ),
            "date_add": order.get("date_add"),
            "current_state_label": order.get("current_state_label"),
            "reason": order.get("reason"),
            "reason_detail": order.get("reason_detail"),
            "limiting_skus": missing_items,
            "missing_references": order.get("missing_references", []),
        }

    for order in simulation.get("remaining_orders", []):
        order_id = str(order["order_id"])
        if int(order_id) not in requested_set:
            continue
        response_orders[order_id] = {
            "status": "pending",
            "label": "Non valutato",
            "queue_position": (
                order.get("chronological_position")
                if chronological_mode
                else None
            ),
            "date_add": order.get("date_add"),
            "current_state_label": order.get("current_state_label"),
            "reason": order.get("reason"),
            "reason_detail": order.get("reason_detail"),
        }

    return response_orders


def add_out_of_scope_orders(db, requested_ids, response_orders):
    unresolved_ids = [
        order_id
        for order_id in requested_ids
        if str(order_id) not in response_orders
    ]
    if not unresolved_ids:
        return

    orders = (
        db.query(PrestashopOrder)
        .filter(PrestashopOrder.order_id.in_(unresolved_ids))
        .all()
    )
    order_map = {order.order_id: order for order in orders}
    for order_id in unresolved_ids:
        order = order_map.get(order_id)
        response_orders[str(order_id)] = {
            "status": "not_in_scope" if order else "not_found",
            "label": (
                "Fuori dagli stati inclusi"
                if order
                else "Non sincronizzato"
            ),
            "current_state_label": (
                order.current_state_label if order else None
            ),
            "date_add": (
                order.date_add.isoformat()
                if order and order.date_add
                else None
            ),
        }


def summarize_orders(response_orders, requested_ids, simulation):
    return {
        "requested_count": len(requested_ids),
        "queue_count": simulation.get("auto_picking", {}).get(
            "candidate_count", 0
        ),
        "preparable_count": sum(
            1
            for item in response_orders.values()
            if item["status"] == "preparable"
        ),
        "blocked_count": sum(
            1
            for item in response_orders.values()
            if item["status"] in ("blocked", "protected")
        ),
    }
