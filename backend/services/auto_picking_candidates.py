from backend.picking_rules import is_ignored_picking_sku


def order_identity_payload(order):
    return {
        "order_id": str(order.order_id),
        "customer_name": order.customer_name or "Cliente sconosciuto",
        "date_add": order.date_add.isoformat() if order.date_add else None,
        "current_state": order.current_state,
        "current_state_label": (
            order.current_state_label or f"Stato {order.current_state}"
        ),
    }


def _build_order_requirements(order, lines_by_order, components_map):
    sku_reqs = {}
    missing_reference_lines = []
    for line in lines_by_order.get(order.order_id, []):
        if is_ignored_picking_sku(line.product_reference):
            continue
        product_id = line.product_id
        qty_ordered = line.product_quantity or 1
        if product_id in components_map:
            for sku, qty_required in components_map[product_id]:
                sku_key = sku.strip()
                if sku_key and not is_ignored_picking_sku(sku_key):
                    sku_reqs[sku_key] = (
                        sku_reqs.get(sku_key, 0.0)
                        + qty_required * qty_ordered
                    )
        else:
            sku_key = (line.product_reference or "").strip()
            if sku_key and not is_ignored_picking_sku(sku_key):
                sku_reqs[sku_key] = sku_reqs.get(sku_key, 0.0) + qty_ordered
            else:
                missing_reference_lines.append({
                    "product_id": product_id,
                    "qty_ordered": qty_ordered,
                })
    return sku_reqs, missing_reference_lines


def build_auto_picking_candidates(
    *,
    orders,
    lines_by_order,
    components_map,
    excluded_skus,
    sku_filter,
    sku_limits,
):
    candidates = []
    sku_excluded_orders = []
    sku_limit_excluded_orders = []

    for order in orders:
        sku_reqs, missing_references = _build_order_requirements(
            order,
            lines_by_order,
            components_map,
        )
        excluded_items = [
            {"sku": sku, "qty_required": required_qty}
            for sku, required_qty in sorted(sku_reqs.items())
            if sku.upper() in excluded_skus
        ]
        if excluded_items:
            sku_excluded_orders.append({
                **order_identity_payload(order),
                "reason": "Ordine contenente una SKU esclusa",
                "excluded_items": excluded_items,
            })
            continue

        if sku_filter and not any(
            sku.upper() in sku_filter for sku in sku_reqs
        ):
            continue

        exceeded_items = []
        for sku, required_qty in sorted(sku_reqs.items()):
            maximum = sku_limits.get(sku.upper())
            if maximum is not None and required_qty > maximum:
                exceeded_items.append({
                    "sku": sku,
                    "qty_required": required_qty,
                    "max_per_order": maximum,
                    "qty_excess": required_qty - maximum,
                })
        if exceeded_items:
            sku_limit_excluded_orders.append({
                **order_identity_payload(order),
                "reason": "Quantità SKU superiore al massimo per ordine",
                "exceeded_items": exceeded_items,
            })
            continue

        candidates.append({
            "order": order,
            "sku_reqs": sku_reqs,
            "missing_reference_lines": missing_references,
            "chronological_position": len(candidates) + 1,
        })

    return candidates, sku_excluded_orders, sku_limit_excluded_orders
