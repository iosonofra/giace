from collections import defaultdict
from collections.abc import Callable

from backend.models import PrestashopOrderLine
from backend.picking_rules import is_ignored_picking_sku
from backend.services.picking_order_analysis import (
    allocate_requirement,
    load_inventory_context,
    serialize_aggregate_requirements,
)


class PickingFileAnalysisError(Exception):
    """Raised when an uploaded picking file cannot be parsed."""


def analyze_uploaded_files(
    files,
    db,
    ps_client,
    *,
    parser: Callable,
) -> dict:
    (
        rows,
        order_references,
        anomalies,
        files_processed,
    ) = _parse_files(files, parser)
    if not rows:
        return {
            "orders_found": [],
            "orders_missing": [],
            "sku_requirements": [],
            "order_requirements": [],
            "anomalies": anomalies,
            "files_processed": files_processed,
        }

    components_map, stock_map = load_inventory_context(db)
    product_quantities = _aggregate_products(rows)
    references = _resolve_product_references(
        db,
        product_quantities,
        components_map,
        ps_client,
        anomalies,
    )
    aggregate_requirements = _requirements_for_products(
        product_quantities,
        components_map,
        references,
    )
    order_groups, order_sequence = _group_rows(rows)

    return {
        "orders_found": (
            sorted(order_references)
            if order_references
            else sorted(order_sequence)
        ),
        "orders_missing": [],
        "sku_requirements": serialize_aggregate_requirements(
            aggregate_requirements,
            stock_map,
        ),
        "order_requirements": _build_progressive_orders(
            order_groups,
            order_sequence,
            components_map,
            references,
            stock_map,
        ),
        "anomalies": anomalies,
        "files_processed": files_processed,
    }


def _parse_files(files, parser):
    all_rows = []
    order_references = set()
    anomalies = []
    files_processed = []

    for upload_file in files:
        try:
            rows, references, file_anomalies = parser(
                upload_file.file.read(),
                upload_file.filename,
            )
        except Exception as error:
            raise PickingFileAnalysisError(
                f"Errore nel parsing del file "
                f"{upload_file.filename}: {error}"
            ) from error

        for row in rows:
            row["filename"] = upload_file.filename
        all_rows.extend(rows)
        order_references.update(references)
        anomalies.extend(file_anomalies)
        files_processed.append(
            {
                "filename": upload_file.filename,
                "rows_count": len(rows),
            }
        )

    return (
        all_rows,
        order_references,
        anomalies,
        files_processed,
    )


def _aggregate_products(rows):
    quantities = {}
    for row in rows:
        product_id = row["product_id"]
        quantities[product_id] = (
            quantities.get(product_id, 0.0)
            + row["quantity"]
        )
    return quantities


def _resolve_product_references(
    db,
    product_quantities,
    components_map,
    ps_client,
    anomalies,
):
    simple_product_ids = [
        product_id
        for product_id in product_quantities
        if product_id not in components_map
    ]
    references = _load_local_references(
        db,
        simple_product_ids,
    )

    for product_id in simple_product_ids:
        sku = references.get(product_id)
        if not sku and ps_client:
            sku = ps_client.get_product_reference(product_id)
        if sku:
            references[product_id] = sku
            continue

        fallback_sku = f"ID-{product_id}"
        references[product_id] = fallback_sku
        anomalies.append(
            {
                "source": "file_picking_import",
                "record_key": f"ID {product_id}",
                "anomaly_type": "missing_reference",
                "message": (
                    "Impossibile trovare il codice SKU "
                    f"(riferimento) per il Prodotto ID {product_id}. "
                    f"Utilizzato SKU provvisorio '{fallback_sku}'."
                ),
            }
        )

    return references


def _load_local_references(db, product_ids):
    if not product_ids:
        return {}

    rows = (
        db.query(
            PrestashopOrderLine.product_id,
            PrestashopOrderLine.product_reference,
        )
        .filter(
            PrestashopOrderLine.product_id.in_(product_ids),
            PrestashopOrderLine.product_reference.is_not(None),
            PrestashopOrderLine.product_reference != "",
        )
        .order_by(PrestashopOrderLine.id)
        .all()
    )
    references = {}
    for product_id, reference in rows:
        references.setdefault(
            product_id,
            reference.strip(),
        )
    return references


def _requirements_for_products(
    product_quantities,
    components_map,
    references,
):
    requirements = {}
    for product_id, quantity in product_quantities.items():
        for sku, required in _product_requirements(
            product_id,
            quantity,
            components_map,
            references,
        ).items():
            requirements[sku] = (
                requirements.get(sku, 0.0)
                + required
            )
    return requirements


def _product_requirements(
    product_id,
    quantity,
    components_map,
    references,
):
    components = components_map.get(product_id)
    if components:
        requirements = {}
        for sku, quantity_required in components:
            normalized_sku = sku.strip()
            if is_ignored_picking_sku(normalized_sku):
                continue
            requirements[normalized_sku] = (
                requirements.get(normalized_sku, 0.0)
                + quantity_required * quantity
            )
        return requirements

    sku = references.get(product_id, f"ID-{product_id}")
    if is_ignored_picking_sku(sku):
        return {}
    return {sku: quantity}


def _group_rows(rows):
    groups = {}
    sequence = []

    for row in rows:
        order_reference = row.get("order_ref")
        order_key = (
            str(order_reference)
            if order_reference
            else f"File: {row.get('filename', 'excel')}"
        )
        customer = row.get("customer")

        if order_key not in groups:
            groups[order_key] = {
                "customer": customer or "Cliente sconosciuto",
                "rows": [],
            }
            sequence.append(order_key)
        if (
            customer
            and groups[order_key]["customer"]
            == "Cliente sconosciuto"
        ):
            groups[order_key]["customer"] = customer
        groups[order_key]["rows"].append(row)

    return groups, sequence


def _build_progressive_orders(
    groups,
    sequence,
    components_map,
    references,
    stock_map,
):
    running_stock = {
        sku: info["qty_total"]
        for sku, info in stock_map.items()
    }
    order_requirements = []

    for order_key in sequence:
        group = groups[order_key]
        quantities = _aggregate_products(group["rows"])
        requirements = _requirements_for_products(
            quantities,
            components_map,
            references,
        )
        items = [
            allocate_requirement(
                sku,
                quantity,
                stock_map,
                running_stock,
            )
            for sku, quantity in sorted(requirements.items())
        ]
        order_requirements.append(
            {
                "order_id": order_key,
                "customer_name": group["customer"],
                "items": items,
            }
        )

    return order_requirements
