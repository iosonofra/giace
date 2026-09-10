from collections import OrderedDict
from datetime import datetime


class GaerPickingError(ValueError):
    pass


def _identity(order, position):
    return {
        "order_id": str(order["order_id"]),
        "customer_name": order.get("customer_name") or "Cliente sconosciuto",
        "date_add": order["date_add"].isoformat() if order.get("date_add") else None,
        "current_state": order.get("current_state"),
        "current_state_label": order.get("current_state_label") or "Stato non disponibile",
        "chronological_position": position,
    }


def _line_key(line):
    return (
        int(line.get("product_id") or 0),
        int(line.get("product_attribute_id") or 0),
    )


def _identifier(value):
    if isinstance(value, dict):
        return {
            "ean": str(value.get("ean") or "").strip(),
            "product_reference": str(value.get("product_reference") or "").strip(),
            "supplier_reference": str(value.get("supplier_reference") or "").strip(),
        }
    return {
        "ean": str(value or "").strip(),
        "product_reference": "",
        "supplier_reference": "",
    }


def _order_ean_requirements(order, ean_map):
    requirements = OrderedDict()
    missing = []
    for line in order.get("lines") or []:
        product_id, attribute_id = _line_key(line)
        product_identifier = _identifier(ean_map.get((product_id, 0)))
        combination_identifier = (
            _identifier(ean_map.get((product_id, attribute_id)))
            if attribute_id
            else _identifier(None)
        )
        ean = combination_identifier["ean"] or product_identifier["ean"]
        source = ""
        if combination_identifier["ean"]:
            source = "combinazione"
        elif product_identifier["ean"]:
            source = "prodotto"
        try:
            quantity = float(line.get("product_quantity") or 1)
        except (TypeError, ValueError):
            quantity = 1.0
        if not ean:
            missing.append({
                "sku": line.get("product_reference") or f"ID {product_id}",
                "product_id": product_id,
                "product_attribute_id": attribute_id,
                "qty_required": quantity,
                "qty_available": 0,
                "qty_missing": quantity,
                "violation_type": "missing_ean",
                "message": "EAN13 non configurato in PrestaShop.",
            })
            continue
        item = requirements.setdefault(ean, {
            "quantity": 0.0,
            "description": line.get("product_name") or line.get("product_reference") or ean,
            "ean_source": source,
            "product_references": [],
            "supplier_references": [],
        })
        item["quantity"] += quantity
        product_reference = (
            combination_identifier["product_reference"]
            or product_identifier["product_reference"]
            or str(line.get("product_reference") or "").strip()
        )
        supplier_reference = str(
            combination_identifier["supplier_reference"]
            or product_identifier["supplier_reference"]
            or line.get("product_supplier_reference")
            or ""
        ).strip()
        if product_reference and product_reference not in item["product_references"]:
            item["product_references"].append(product_reference)
        if supplier_reference and supplier_reference not in item["supplier_references"]:
            item["supplier_references"].append(supplier_reference)
    return requirements, missing


def simulate_gaer_picking(*, orders, stock_items, ean_map, state_ids):
    stock_map = OrderedDict(
        (
            item["ean"],
            {
                "article": str(item.get("article") or "").strip(),
                "description": item.get("description") or "Prodotto Gaer",
                "qty_total": float(item["quantity"]),
            },
        )
        for item in stock_items
    )
    running = {ean: item["qty_total"] for ean, item in stock_map.items()}
    selected_orders = []
    skipped_orders = []
    order_requirements = []
    selected_totals = OrderedDict()
    selected_metadata = OrderedDict()

    sorted_orders = sorted(
        orders,
        key=lambda order: (
            order.get("date_add") or datetime.max,
            int(order.get("order_id") or 0),
        ),
    )
    for position, order in enumerate(sorted_orders, start=1):
        identity = _identity(order, position)
        requirements, missing_eans = _order_ean_requirements(order, ean_map)
        violations = list(missing_eans)
        for ean, requirement in requirements.items():
            required = requirement["quantity"]
            available = running.get(ean, 0.0)
            if available < required:
                violations.append({
                    "sku": ean,
                    "qty_required": required,
                    "qty_available": available,
                    "qty_missing": required - available,
                    "violation_type": "missing_stock" if ean in stock_map else "ean_not_in_file",
                    "message": (
                        "EAN non presente nel file Gaer."
                        if ean not in stock_map
                        else "Quantità Gaer insufficiente."
                    ),
                })
        total_units = (
            sum(item["quantity"] for item in requirements.values())
            + sum(float(item.get("qty_required") or 0) for item in missing_eans)
        )
        if violations or not requirements:
            skipped_orders.append({
                **identity,
                "reason": "Ordine non completamente preparabile",
                "reason_detail": "La disponibilità resta invariata e viene valutato l’ordine successivo.",
                "missing_items": violations,
                "missing_references": [],
                "total_units": total_units,
                "distinct_skus": len(requirements),
            })
            continue

        items = []
        for ean, requirement in requirements.items():
            required = requirement["quantity"]
            before = running[ean]
            after = before - required
            running[ean] = after
            selected_totals[ean] = selected_totals.get(ean, 0.0) + required
            metadata = selected_metadata.setdefault(ean, {
                "product_references": [],
                "supplier_references": [],
            })
            for reference in requirement["product_references"]:
                if reference not in metadata["product_references"]:
                    metadata["product_references"].append(reference)
            for reference in requirement["supplier_references"]:
                if reference not in metadata["supplier_references"]:
                    metadata["supplier_references"].append(reference)
            items.append({
                "sku": ean,
                "ean": ean,
                "article": stock_map[ean]["article"],
                "description": requirement["description"] or stock_map[ean]["description"],
                "product_reference": ", ".join(requirement["product_references"]),
                "supplier_reference": ", ".join(requirement["supplier_references"]),
                "qty_required": required,
                "qty_stock": stock_map[ean]["qty_total"],
                "avail_before": before,
                "avail_after": after,
                "qty_fulfilled": required,
                "status": "disponibile",
            })
        selected = {
            **identity,
            "selection_position": len(selected_orders) + 1,
            "total_units": total_units,
            "distinct_skus": len(requirements),
        }
        selected_orders.append(selected)
        order_requirements.append({**selected, "items": items})

    sku_requirements = [
        {
            "sku": ean,
            "ean": ean,
            "article": stock_map[ean]["article"],
            "description": stock_map[ean]["description"],
            "product_reference": ", ".join(
                selected_metadata[ean]["product_references"]
            ),
            "supplier_reference": ", ".join(
                selected_metadata[ean]["supplier_references"]
            ),
            "qty_required": quantity,
            "qty_stock": stock_map[ean]["qty_total"],
            "qty_remaining": running[ean],
        }
        for ean, quantity in selected_totals.items()
    ]
    touched = set(selected_totals)
    return {
        "mode": "gaer",
        "orders_found": [int(order["order_id"]) for order in selected_orders],
        "orders_missing": [],
        "sku_requirements": sku_requirements,
        "order_requirements": order_requirements,
        "selected_orders": selected_orders,
        "skipped_orders": skipped_orders,
        "remaining_orders": [],
        "stock_simulation": [],
        "simulation_summary": {
            "selected_units": sum(selected_totals.values()),
            "selected_distinct_skus": len(selected_totals),
            "initial_units_on_touched_skus": sum(stock_map[ean]["qty_total"] for ean in touched),
            "remaining_units_on_touched_skus": sum(running[ean] for ean in touched),
            "remaining_count": 0,
            "remaining_preparable_count": 0,
            "stopped_by_strict_chronology": False,
        },
        "auto_picking": {
            "requested_limit": len(sorted_orders),
            "selected_count": len(selected_orders),
            "skipped_count": len(skipped_orders),
            "evaluated_count": len(sorted_orders),
            "candidate_count": len(sorted_orders),
            "strict_chronology": False,
            "selection_strategy": "chronological",
            "min_sku_residual": 0,
        },
        "gaer": {
            "state_ids": list(state_ids),
            "file_ean_count": len(stock_items),
            "file_units": sum(float(item["quantity"]) for item in stock_items),
            "unused_ean_count": sum(1 for ean in stock_map if ean not in touched),
        },
    }
