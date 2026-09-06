from backend.models import (
    CalcRun,
    ImportBatch,
    ProductAvailability,
    ProductComponent,
    PrestashopOrderLine,
    PrestashopProductCache,
)
from sqlalchemy import select


def list_products(db) -> list[dict]:
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
        .filter(CalcRun.status == "completed")
        .order_by(CalcRun.completed_at.desc())
        .first()
    )
    latest_name = (
        select(PrestashopOrderLine.product_name)
        .where(
            PrestashopOrderLine.product_id == ProductComponent.product_id,
            PrestashopOrderLine.product_name.isnot(None),
            PrestashopOrderLine.product_name != "",
        )
        .order_by(PrestashopOrderLine.id.desc())
        .limit(1)
        .scalar_subquery()
    )
    latest_reference = (
        select(PrestashopOrderLine.product_reference)
        .where(
            PrestashopOrderLine.product_id == ProductComponent.product_id,
            PrestashopOrderLine.product_reference.isnot(None),
            PrestashopOrderLine.product_reference != "",
        )
        .order_by(PrestashopOrderLine.id.desc())
        .limit(1)
        .scalar_subquery()
    )
    component_rows = (
        db.query(
            ProductComponent,
            PrestashopProductCache.product_name,
            PrestashopProductCache.product_reference,
            latest_name.label("order_product_name"),
            latest_reference.label("order_product_reference"),
        )
        .outerjoin(
            PrestashopProductCache,
            PrestashopProductCache.product_id == ProductComponent.product_id,
        )
        .filter(
            ProductComponent.import_batch_id
            == associations_batch.id,
        )
        .all()
    )
    components_by_product, metadata_by_product = _group_components(component_rows)
    availabilities = _load_availabilities(
        db,
        latest_run,
        components_by_product,
    )

    return [
        _serialize_product(
            product_id,
            product_components,
            availabilities.get(product_id),
            metadata_by_product.get(product_id, {}),
        )
        for product_id, product_components
        in components_by_product.items()
    ]


def _group_components(component_rows) -> tuple[dict, dict]:
    grouped = {}
    metadata = {}
    for row in component_rows:
        component = row[0]
        grouped.setdefault(component.product_id, []).append(
            component
        )
        metadata.setdefault(component.product_id, {
            "product_name": row.product_name or row.order_product_name or "",
            "product_reference": (
                row.product_reference
                or row.order_product_reference
                or ""
            ),
        })
    return grouped, metadata


def _load_availabilities(
    db,
    latest_run,
    components_by_product,
) -> dict:
    if not latest_run:
        return {}

    product_ids = tuple(components_by_product)
    query = db.query(ProductAvailability).filter(
        ProductAvailability.calc_run_id == latest_run.id,
    )
    if product_ids:
        query = query.filter(
            ProductAvailability.product_id.in_(product_ids),
        )
    items = query.all()
    return {item.product_id: item for item in items}


def _serialize_product(
    product_id,
    components,
    availability,
    metadata,
) -> dict:
    components_str = ", ".join(
        f"{component.sku} (x{component.qty_required})"
        for component in components
    )
    raw_components = ",".join(
        component.sku
        for component in components
        for _ in range(component.qty_required)
    )
    return {
        "product_id": product_id,
        "product_name": metadata.get("product_name", ""),
        "product_reference": metadata.get("product_reference", ""),
        "components_str": components_str,
        "qty_available": (
            availability.qty_available
            if availability
            else 0
        ),
        "limiting_sku": (
            availability.limiting_sku
            if availability
            else ""
        ),
        "raw_association": (
            f"{product_id} | {raw_components}"
        ),
    }
