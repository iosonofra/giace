from backend.models import (
    CalcRun,
    ImportBatch,
    ProductAvailability,
    ProductComponent,
)


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
    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == associations_batch.id,
        )
        .all()
    )
    components_by_product = _group_components(components)
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
        )
        for product_id, product_components
        in components_by_product.items()
    ]


def _group_components(components) -> dict:
    grouped = {}
    for component in components:
        grouped.setdefault(component.product_id, []).append(
            component
        )
    return grouped


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
