from datetime import datetime

from backend.services.auto_picking_candidates import (
    build_auto_picking_candidates,
)
from backend.services.auto_picking_evaluation import (
    build_skip_payload,
    candidate_is_preparable,
    find_stock_violations,
)
from backend.services.auto_picking_result import (
    apply_selected_order,
    build_remaining_orders,
    build_sku_requirements,
    build_stock_simulation,
)


def simulate_auto_picking(
    *,
    orders,
    lines_by_order,
    components_map,
    stock_map,
    stock_order,
    limit,
    strict_chronology,
    independent_availability,
    selection_strategy,
    min_sku_residual,
    sku_filter,
    sku_limits,
    excluded_skus,
):
    running_stock = {
        sku: info["qty_total"]
        for sku, info in stock_map.items()
    }
    initial_stock = dict(running_stock)
    selected_orders = []
    skipped_orders = []
    order_requirements = []
    sku_required_map = {}

    (
        candidate_orders,
        sku_excluded_orders,
        sku_limit_excluded_orders,
    ) = build_auto_picking_candidates(
        orders=orders,
        lines_by_order=lines_by_order,
        components_map=components_map,
        excluded_skus=excluded_skus,
        sku_filter=sku_filter,
        sku_limits=sku_limits,
    )

    def violations_for(candidate):
        snapshot = (
            initial_stock
            if independent_availability
            else running_stock
        )
        return find_stock_violations(
            candidate["sku_reqs"],
            snapshot,
            stock_map,
            min_sku_residual,
        )

    def select(candidate):
        apply_selected_order(
            candidate,
            independent_availability=independent_availability,
            initial_stock=initial_stock,
            order_requirements=order_requirements,
            running_stock=running_stock,
            selected_orders=selected_orders,
            sku_required_map=sku_required_map,
            stock_map=stock_map,
            stock_order=stock_order,
        )

    if selection_strategy == "maximize_orders":
        remaining_candidates = list(candidate_orders)
        evaluated_count = len(remaining_candidates)
        while len(selected_orders) < limit and remaining_candidates:
            preparable = []
            blocked = []
            for candidate in remaining_candidates:
                violations = violations_for(candidate)
                if candidate_is_preparable(candidate, violations):
                    total_required = sum(candidate["sku_reqs"].values())
                    distinct_skus = len(candidate["sku_reqs"])
                    oldest = candidate["order"].date_add or datetime.min
                    preparable.append((
                        total_required,
                        distinct_skus,
                        oldest,
                        candidate["order"].order_id,
                        candidate,
                    ))
                else:
                    blocked.append((candidate, violations))

            if not preparable:
                skipped_orders.extend(
                    build_skip_payload(candidate, violations)
                    for candidate, violations in blocked
                )
                break

            preparable.sort(key=lambda item: item[:4])
            selected_candidate = preparable[0][4]
            select(selected_candidate)
            remaining_candidates = [
                candidate
                for candidate in remaining_candidates
                if candidate is not selected_candidate
            ]
    else:
        evaluated_count = 0
        for candidate in candidate_orders:
            if len(selected_orders) >= limit:
                break
            evaluated_count += 1
            violations = violations_for(candidate)
            if not candidate_is_preparable(candidate, violations):
                skipped_orders.append(
                    build_skip_payload(candidate, violations),
                )
                if strict_chronology:
                    break
                continue
            select(candidate)

    sku_requirements = build_sku_requirements(
        sku_required_map,
        running_stock=running_stock,
        stock_map=stock_map,
        stock_order=stock_order,
    )
    stopped_by_strict_chronology = bool(
        selection_strategy == "chronological"
        and strict_chronology
        and len(selected_orders) < limit
        and skipped_orders
    )
    remaining_orders = build_remaining_orders(
        candidate_orders,
        independent_availability=independent_availability,
        initial_stock=initial_stock,
        limit=limit,
        min_sku_residual=min_sku_residual,
        running_stock=running_stock,
        selected_orders=selected_orders,
        skipped_orders=skipped_orders,
        stock_map=stock_map,
        stopped_by_strict_chronology=stopped_by_strict_chronology,
    )
    stock_simulation = build_stock_simulation(
        sku_requirements,
        min_sku_residual,
    )
    selected_dates = [
        item["date_add"]
        for item in selected_orders
        if item.get("date_add")
    ]

    return {
        "mode": "automatic",
        "orders_found": [
            int(order["order_id"])
            for order in selected_orders
        ],
        "orders_missing": [],
        "sku_requirements": sku_requirements,
        "order_requirements": order_requirements,
        "selected_orders": selected_orders,
        "skipped_orders": skipped_orders,
        "remaining_orders": remaining_orders,
        "sku_limit_excluded_orders": sku_limit_excluded_orders,
        "sku_excluded_orders": sku_excluded_orders,
        "stock_simulation": stock_simulation,
        "simulation_summary": {
            "selected_units": sum(
                item["qty_required"]
                for item in sku_requirements
            ),
            "selected_distinct_skus": len(sku_requirements),
            "initial_units_on_touched_skus": sum(
                item["qty_stock"]
                for item in sku_requirements
            ),
            "remaining_units_on_touched_skus": sum(
                item["qty_remaining"]
                for item in sku_requirements
            ),
            "oldest_selected_date": (
                min(selected_dates) if selected_dates else None
            ),
            "newest_selected_date": (
                max(selected_dates) if selected_dates else None
            ),
            "remaining_count": len(remaining_orders),
            "remaining_preparable_count": sum(
                1
                for item in remaining_orders
                if item["currently_preparable"]
            ),
            "stopped_by_strict_chronology": (
                stopped_by_strict_chronology
            ),
        },
        "auto_picking": {
            "requested_limit": limit,
            "selected_count": len(selected_orders),
            "skipped_count": len(skipped_orders),
            "evaluated_count": evaluated_count,
            "strict_chronology": strict_chronology,
            "independent_availability": independent_availability,
            "selection_strategy": selection_strategy,
            "min_sku_residual": min_sku_residual,
            "candidate_count": len(candidate_orders),
            "sku_filter": sorted(sku_filter),
            "sku_limits": sku_limits,
            "excluded_skus": sorted(excluded_skus),
            "sku_excluded_count": len(sku_excluded_orders),
            "sku_limit_excluded_count": len(
                sku_limit_excluded_orders,
            ),
            "remaining_count": len(remaining_orders),
        },
    }
