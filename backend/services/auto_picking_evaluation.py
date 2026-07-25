from backend.services.auto_picking_candidates import order_identity_payload


MISSING_STOCK = {
    "description": "Non presente in magazzino",
    "qty_total": 0.0,
}


def find_stock_violations(
    sku_reqs,
    stock_snapshot,
    stock_map,
    min_sku_residual,
):
    violations = []
    for sku, required_qty in sorted(sku_reqs.items()):
        available = stock_snapshot.get(sku, 0.0)
        available_after = available - required_qty
        stock_info = stock_map.get(sku, MISSING_STOCK)
        if available < required_qty:
            violations.append({
                "sku": sku,
                "description": stock_info["description"],
                "qty_required": required_qty,
                "qty_available": available,
                "qty_stock": stock_info["qty_total"],
                "qty_available_after": available_after,
                "qty_missing": required_qty - available,
                "min_residual": min_sku_residual,
                "violation_type": "insufficient_stock",
                "detail": (
                    f"Richiesti {required_qty}, disponibili {available}: "
                    f"mancano {required_qty - available}."
                ),
            })
        elif min_sku_residual > 0 and available_after < min_sku_residual:
            violations.append({
                "sku": sku,
                "description": stock_info["description"],
                "qty_required": required_qty,
                "qty_available": available,
                "qty_stock": stock_info["qty_total"],
                "qty_available_after": available_after,
                "qty_missing": 0,
                "min_residual": min_sku_residual,
                "violation_type": "protected_residual",
                "detail": (
                    f"Dopo il prelievo resterebbero {available_after}, "
                    f"sotto la scorta minima {min_sku_residual}."
                ),
            })
    return violations


def build_skip_payload(candidate, violations):
    missing_refs = candidate["missing_reference_lines"]
    has_protected = any(
        item.get("violation_type") == "protected_residual"
        for item in violations
    )
    if missing_refs:
        reason = "Riferimento prodotto mancante"
        detail = (
            "Una o più righe ordine non hanno un riferimento SKU "
            "o associazione utilizzabile."
        )
    elif has_protected:
        reason = "SKU protetta da scorta minima"
        detail = (
            "L'ordine è preparabile, ma consumerebbe una SKU "
            "sotto la scorta minima impostata."
        )
    elif not candidate["sku_reqs"]:
        reason = "Nessuna SKU ricavabile"
        detail = "L'ordine non genera componenti SKU utili per il prelievo."
    else:
        reason = "Stock insufficiente"
        detail = "Una o più SKU non hanno disponibilità sufficiente."

    return {
        **order_identity_payload(candidate["order"]),
        "chronological_position": candidate["chronological_position"],
        "total_units": sum(candidate["sku_reqs"].values()),
        "distinct_skus": len(candidate["sku_reqs"]),
        "reason": reason,
        "reason_detail": detail,
        "missing_items": violations,
        "missing_references": missing_refs,
    }


def candidate_is_preparable(candidate, violations):
    return bool(
        candidate["sku_reqs"]
        and not violations
        and not candidate["missing_reference_lines"]
    )
