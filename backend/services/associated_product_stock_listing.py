import math

from backend.models import (
    CalcRun,
    ImportBatch,
    ProductAvailability,
    ProductComponent,
    SkuCommitment,
)
from backend.picking_rules import is_ignored_picking_sku
from backend.services.product_metadata import resolve_product_metadata


def list_associated_product_stock(
    db,
    *,
    client_factory,
) -> list[dict]:
    """Return a product-centric, read-only projection of current stock.

    This deliberately uses its own endpoint and serializer so the contracts of
    ``/api/stock`` and ``/api/stock/missing`` remain unchanged.
    """
    associations_batch = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    if not associations_batch:
        return []

    latest_run = (
        db.query(CalcRun)
        .filter(
            CalcRun.status == "completed",
            CalcRun.associations_batch_id == associations_batch.id,
        )
        .order_by(CalcRun.completed_at.desc(), CalcRun.id.desc())
        .first()
    )
    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == associations_batch.id,
        )
        .order_by(
            ProductComponent.product_id.asc(),
            ProductComponent.sku.asc(),
        )
        .all()
    )
    if not components:
        return []

    components_by_product = _group_components(components)
    product_ids = tuple(components_by_product)
    sku_set = {
        component.sku
        for component in components
    }
    availability_map = _load_availabilities(
        db,
        latest_run,
        product_ids,
    )
    stock_map = _load_calculated_stock(
        db,
        latest_run,
        sku_set,
    )
    metadata, metadata_sources = resolve_product_metadata(
        db,
        product_ids,
        client_factory=client_factory,
    )

    return [
        _serialize_product(
            index,
            product_id,
            product_components,
            availability_map.get(product_id),
            stock_map,
            metadata.get(product_id, {}),
            metadata_sources.get(product_id, "fallback"),
        )
        for index, (product_id, product_components)
        in enumerate(components_by_product.items(), start=1)
    ]


def _group_components(components) -> dict:
    grouped = {}
    for component in components:
        grouped.setdefault(component.product_id, []).append(component)
    return grouped


def _load_availabilities(db, latest_run, product_ids) -> dict:
    if not latest_run:
        return {}
    rows = (
        db.query(ProductAvailability)
        .filter(
            ProductAvailability.calc_run_id == latest_run.id,
            ProductAvailability.product_id.in_(product_ids),
        )
        .all()
    )
    return {row.product_id: row for row in rows}


def _load_calculated_stock(db, latest_run, skus) -> dict:
    if not latest_run or not skus:
        return {}
    rows = (
        db.query(SkuCommitment)
        .filter(
            SkuCommitment.calc_run_id == latest_run.id,
            SkuCommitment.sku.in_(skus),
        )
        .all()
    )
    return {row.sku: row for row in rows}


def _serialize_product(
    index,
    product_id,
    components,
    availability,
    stock_map,
    metadata,
    metadata_source,
) -> dict:
    limiting_sku = availability.limiting_sku if availability else ""
    quantity_total = _product_capacity(
        components,
        stock_map,
        "qty_total",
        clamp_to_zero=True,
    ) if availability else None
    quantity_residual = _product_capacity(
        components,
        stock_map,
        "qty_residual",
        clamp_to_zero=False,
    ) if availability else None
    quantity_committed = (
        max(0, quantity_total - quantity_residual)
        if quantity_total is not None and quantity_residual is not None
        else None
    )
    return {
        "index": index,
        "product_id": product_id,
        "product_name": metadata.get("product_name", ""),
        "product_reference": metadata.get("product_reference", ""),
        "metadata_source": metadata_source,
        "qty_total": quantity_total,
        "qty_committed": quantity_committed,
        "qty_residual": quantity_residual,
        "qty_available": (
            max(0, quantity_residual)
            if quantity_residual is not None
            else None
        ),
        "limiting_sku": limiting_sku or "",
        "components": [
            _serialize_component(
                component,
                stock_map.get(component.sku),
                limiting_sku,
            )
            for component in components
        ],
    }


def _product_capacity(
    components,
    stock_map,
    field,
    *,
    clamp_to_zero,
) -> int:
    capacities = []
    for component in components:
        if is_ignored_picking_sku(component.sku):
            continue
        required = component.qty_required
        stock = stock_map.get(component.sku)
        quantity = getattr(stock, field, 0) if stock else 0
        capacity = math.floor(quantity / required) if required > 0 else 0
        capacities.append(max(0, capacity) if clamp_to_zero else capacity)
    return min(capacities) if capacities else 0


def _serialize_component(component, stock, limiting_sku) -> dict:
    return {
        "sku": component.sku,
        "qty_required": component.qty_required,
        "qty_total": stock.qty_total if stock else 0,
        "qty_committed": stock.qty_committed if stock else 0,
        "qty_residual": stock.qty_residual if stock else 0,
        "is_limiting": component.sku == limiting_sku,
    }
