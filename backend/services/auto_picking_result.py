from backend.services.auto_picking_candidates import order_identity_payload
from backend.services.auto_picking_evaluation import (
    MISSING_STOCK,
    candidate_is_preparable,
    find_stock_violations,
)


def apply_selected_order(
    candidate,
    *,
    independent_availability,
    initial_stock,
    order_requirements,
    running_stock,
    selected_orders,
    sku_required_map,
    stock_map,
    stock_order,
):
    sku_reqs = candidate["sku_reqs"]
    items = []
    ordered_requirements = sorted(
        sku_reqs.items(),
        key=lambda item: (stock_order.get(item[0], 10**9), item[0]),
    )
    for sku, required_qty in ordered_requirements:
        stock_info = stock_map.get(sku, MISSING_STOCK)
        available_before = (
            initial_stock.get(sku, 0.0)
            if independent_availability
            else running_stock.get(sku, 0.0)
        )
        available_after = available_before - required_qty
        if not independent_availability:
            running_stock[sku] = available_after
            sku_required_map[sku] = (
                sku_required_map.get(sku, 0.0) + required_qty
            )
        items.append({
            "sku": sku,
            "description": stock_info["description"],
            "qty_required": required_qty,
            "qty_stock": stock_info["qty_total"],
            "avail_before": available_before,
            "avail_after": available_after,
            "qty_fulfilled": required_qty,
            "status": "disponibile",
        })

    base_payload = {
        **order_identity_payload(candidate["order"]),
        "chronological_position": candidate["chronological_position"],
        "selection_position": len(selected_orders) + 1,
        "total_units": sum(sku_reqs.values()),
        "distinct_skus": len(sku_reqs),
    }
    order_requirements.append({**base_payload, "items": items})
    selected_orders.append(base_payload)


def build_sku_requirements(
    sku_required_map,
    *,
    running_stock,
    stock_map,
    stock_order,
):
    requirements = []
    for sku, required_qty in sku_required_map.items():
        stock_info = stock_map.get(sku, MISSING_STOCK)
        requirements.append({
            "sku": sku,
            "description": stock_info["description"],
            "qty_required": required_qty,
            "qty_stock": stock_info["qty_total"],
            "qty_remaining": running_stock.get(sku, 0.0),
        })
    requirements.sort(
        key=lambda item: (
            stock_order.get(item["sku"], 10**9),
            item["sku"],
        ),
    )
    return requirements


def build_remaining_orders(
    candidates,
    *,
    independent_availability,
    initial_stock,
    limit,
    min_sku_residual,
    running_stock,
    selected_orders,
    skipped_orders,
    stock_map,
    stopped_by_strict_chronology,
):
    selected_ids = {item["order_id"] for item in selected_orders}
    skipped_ids = {item["order_id"] for item in skipped_orders}
    remaining = []
    for candidate in candidates:
        order_id = str(candidate["order"].order_id)
        if order_id in selected_ids or order_id in skipped_ids:
            continue
        snapshot = initial_stock if independent_availability else running_stock
        violations = find_stock_violations(
            candidate["sku_reqs"],
            snapshot,
            stock_map,
            min_sku_residual,
        )
        currently_preparable = candidate_is_preparable(candidate, violations)
        if len(selected_orders) >= limit:
            reason = "Limite lista raggiunto"
            detail = (
                "L'ordine resta fuori dalla proposta perché è stato "
                "raggiunto il numero massimo richiesto."
            )
        elif stopped_by_strict_chronology:
            reason = "Non valutato dopo il blocco cronologico"
            detail = "La coda rigida si è fermata sul primo ordine non preparabile."
        else:
            reason = "Non incluso nella proposta"
            detail = "L'ordine è rimasto fuori dalla selezione corrente."
        remaining.append({
            **order_identity_payload(candidate["order"]),
            "chronological_position": candidate["chronological_position"],
            "total_units": sum(candidate["sku_reqs"].values()),
            "distinct_skus": len(candidate["sku_reqs"]),
            "currently_preparable": currently_preparable,
            "reason": reason,
            "reason_detail": detail,
            "missing_items": violations,
            "missing_references": candidate["missing_reference_lines"],
        })
    return remaining


def build_stock_simulation(sku_requirements, min_sku_residual):
    simulation = []
    for item in sku_requirements:
        initial_stock = item["qty_stock"]
        simulated_pick = item["qty_required"]
        final_stock = item["qty_remaining"]
        usable_stock = max(0.0, initial_stock - min_sku_residual)
        utilization = (
            simulated_pick / usable_stock * 100
            if usable_stock > 0
            else 0
        )
        simulation.append({
            "sku": item["sku"],
            "description": item["description"],
            "initial_stock": initial_stock,
            "simulated_pick": simulated_pick,
            "final_stock": final_stock,
            "min_residual": min_sku_residual,
            "usable_stock": usable_stock,
            "utilization_pct": round(utilization, 1),
            "at_minimum": (
                min_sku_residual > 0
                and final_stock == min_sku_residual
            ),
            "near_minimum": (
                min_sku_residual > 0
                and final_stock
                < min_sku_residual + max(1.0, simulated_pick)
            ),
        })
    return simulation
