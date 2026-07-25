import math
from collections import defaultdict

from backend.picking_rules import is_ignored_picking_sku


def build_components_map(components):
    """Indicizza le righe di distinta base per prodotto."""
    result = defaultdict(list)
    for component in components:
        result[component.product_id].append({
            "sku": component.sku,
            "qty_required": component.qty_required,
        })
    return dict(result)


def aggregate_stock(stock_rows):
    """Somma le giacenze duplicate ignorando le righe separatrici."""
    totals = defaultdict(float)
    for item in stock_rows:
        if item.sku.startswith("__spacer_"):
            continue
        totals[item.sku] += item.qty_total
    return dict(totals)


def calculate_sku_commitments(order_lines, components_map):
    """Espande le righe ordine nelle SKU impegnate.

    Restituisce anche le righe prive di associazione, lasciando al chiamante la
    responsabilità di trasformarle in anomalie persistenti.
    """
    commitments = defaultdict(float)
    missing_associations = []

    for line in order_lines:
        if is_ignored_picking_sku(line.product_reference):
            continue
        product_components = components_map.get(line.product_id)
        if not product_components:
            missing_associations.append(line)
            continue
        for component in product_components:
            sku = component["sku"]
            if is_ignored_picking_sku(sku):
                continue
            commitments[sku] += component["qty_required"] * line.product_quantity

    return dict(commitments), missing_associations


def calculate_product_availabilities(components_map, sku_residual_map):
    """Calcola disponibilità e SKU limitante per ogni prodotto composto."""
    result = []
    for product_id, components in components_map.items():
        minimum = float("inf")
        limiting_sku = None

        for component in components:
            sku = component["sku"]
            if is_ignored_picking_sku(sku):
                continue
            required = component["qty_required"]
            residual = sku_residual_map.get(sku, 0.0)
            ratio = max(0, math.floor(residual / required)) if required > 0 else 0
            if ratio < minimum:
                minimum = ratio
                limiting_sku = sku

        result.append({
            "product_id": product_id,
            "qty_available": 0 if minimum == float("inf") else int(minimum),
            "limiting_sku": limiting_sku,
        })

    return result
