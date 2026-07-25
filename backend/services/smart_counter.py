from backend.picking_rules import is_ignored_picking_sku


EMPTY_SUMMARY = {
    "counted": 0,
    "blocked": 0,
    "selected_sku_shortage": 0,
}


def format_smart_qty(value):
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return value
    return int(numeric) if numeric.is_integer() else round(numeric, 2)


def build_line_requirements(line, components_map):
    product_qty = line.product_quantity or 1
    requirements = {}

    if is_ignored_picking_sku(line.product_reference):
        return requirements

    if line.product_id in components_map:
        for component in components_map.get(line.product_id, []):
            sku = component.sku.strip()
            if sku and not is_ignored_picking_sku(sku):
                requirements[sku] = (
                    requirements.get(sku, 0.0)
                    + component.qty_required * product_qty
                )
    else:
        sku = (line.product_reference or "").strip()
        if sku and not is_ignored_picking_sku(sku):
            requirements[sku] = requirements.get(sku, 0.0) + product_qty

    return requirements


def simulate_smart_counter(
    selected_sku,
    active_orders,
    lines_by_order,
    components_map,
    selected_product_ids,
    stock_map,
):
    running_stock = {
        sku: stock_info["qty_total"]
        for sku, stock_info in stock_map.items()
    }
    rows = []
    summary = {
        **EMPTY_SUMMARY,
        "initial_selected_stock": running_stock.get(selected_sku, 0.0),
        "final_selected_stock": running_stock.get(selected_sku, 0.0),
    }

    for order in active_orders:
        order_lines = lines_by_order.get(order.order_id, [])
        selected_lines = [
            line for line in order_lines
            if line.product_id in selected_product_ids
        ]
        order_requirements = {}
        selected_required_by_line_id = {}

        for line in order_lines:
            line_requirements = build_line_requirements(line, components_map)
            for required_sku, required_qty in line_requirements.items():
                order_requirements[required_sku] = (
                    order_requirements.get(required_sku, 0.0) + required_qty
                )

            if line.product_id in selected_product_ids:
                selected_required_by_line_id[line.id] = line_requirements.get(
                    selected_sku,
                    0.0,
                )

        if not order_requirements:
            continue

        selected_before = running_stock.get(selected_sku, 0.0)
        issues = []
        component_requirements = []

        for required_sku, required_qty in sorted(order_requirements.items()):
            available_before = running_stock.get(required_sku, 0.0)
            available_after = available_before - required_qty
            stock_info = stock_map.get(
                required_sku,
                {
                    "description": "Non presente in magazzino",
                    "qty_total": 0.0,
                },
            )
            is_available = available_before >= required_qty
            component_requirements.append({
                "sku": required_sku,
                "description": stock_info["description"],
                "qty_required": required_qty,
                "qty_available_before": available_before,
                "qty_available_after_if_counted": available_after,
                "status": "available" if is_available else "missing",
            })
            if not is_available:
                issues.append({
                    "sku": required_sku,
                    "description": stock_info["description"],
                    "qty_required": required_qty,
                    "qty_available": available_before,
                    "qty_missing": required_qty - available_before,
                    "is_selected_sku": required_sku == selected_sku,
                })

        if not issues:
            for required_sku, required_qty in order_requirements.items():
                running_stock[required_sku] = (
                    running_stock.get(required_sku, 0.0) - required_qty
                )
            selected_after = running_stock.get(selected_sku, 0.0)
            smart_status = "counted"
            smart_label = "Conteggiato"
            smart_note = (
                f"{selected_sku}: {selected_before} -> {selected_after}"
            )
        else:
            selected_after = selected_before
            selected_issue = next(
                (issue for issue in issues if issue["is_selected_sku"]),
                None,
            )
            if selected_issue:
                smart_status = "selected_sku_shortage"
                smart_label = "SKU insufficiente"
                smart_note = (
                    f"{selected_sku}: richiesti "
                    f"{format_smart_qty(selected_issue['qty_required'])}, "
                    f"disponibili "
                    f"{format_smart_qty(selected_issue['qty_available'])}"
                )
            else:
                smart_status = "blocked_combo"
                smart_label = "Bloccato da altra SKU"
                smart_note = "Manca " + ", ".join(
                    f"{issue['sku']} "
                    f"({format_smart_qty(issue['qty_missing'])})"
                    for issue in issues[:3]
                )

        for line in selected_lines:
            selected_required = selected_required_by_line_id.get(line.id, 0.0)
            if selected_required <= 0:
                continue

            if smart_status == "counted":
                summary["counted"] += 1
            elif smart_status == "selected_sku_shortage":
                summary["selected_sku_shortage"] += 1
            else:
                summary["blocked"] += 1

            rows.append({
                "order_id": line.order_id,
                "current_state_label": order.current_state_label if order else "",
                "date_add": (
                    order.date_add.isoformat()
                    if order and order.date_add
                    else None
                ),
                "product_id": line.product_id,
                "product_reference": (
                    line.product_reference or f"ID {line.product_id}"
                ),
                "product_quantity": line.product_quantity,
                "qty_required": selected_required,
                "contribution": selected_required,
                "customer_name": order.customer_name if order else None,
                "total_paid": (
                    round((order.total_paid or 0), 2)
                    if order
                    else None
                ),
                "smart_status": smart_status,
                "smart_label": smart_label,
                "smart_note": smart_note,
                "selected_qty_before": selected_before,
                "selected_qty_after": selected_after,
                "component_issues": issues,
                "component_requirements": component_requirements,
            })

    summary["final_selected_stock"] = running_stock.get(selected_sku, 0.0)
    summary["simulated_orders"] = len(rows)
    return {"orders": rows, "summary": summary}
