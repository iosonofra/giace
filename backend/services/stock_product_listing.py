from backend.models import (
    CalcRun,
    ImportBatch,
    ProductAvailability,
    ProductComponent,
)
from backend.services.product_metadata import (
    resolve_product_metadata,
)


class InvalidStockSkuError(Exception):
    """Raised when a stock SKU is empty or invalid."""


def list_associated_products(
    db,
    sku,
    *,
    client_factory,
) -> list[dict]:
    normalized_sku = str(sku or "").strip()
    if not normalized_sku:
        raise InvalidStockSkuError("SKU mancante o non valida.")

    active_associations = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    if not active_associations:
        return []

    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == active_associations.id,
            ProductComponent.sku == normalized_sku,
        )
        .order_by(ProductComponent.product_id.asc())
        .all()
    )
    if not components:
        return []

    product_ids = sorted(
        {
            component.product_id
            for component in components
        }
    )
    metadata, metadata_sources = resolve_product_metadata(
        db,
        product_ids,
        client_factory=client_factory,
    )
    availability_map = _load_latest_availability(
        db,
        product_ids,
    )

    return [
        _serialize_product(
            component,
            metadata,
            metadata_sources,
            availability_map,
        )
        for component in components
    ]


def _load_latest_availability(db, product_ids):
    latest_run = (
        db.query(CalcRun)
        .filter(CalcRun.status == "completed")
        .order_by(CalcRun.completed_at.desc())
        .first()
    )
    if not latest_run:
        return {}

    availabilities = (
        db.query(ProductAvailability)
        .filter(
            ProductAvailability.calc_run_id == latest_run.id,
            ProductAvailability.product_id.in_(product_ids),
        )
        .all()
    )
    return {
        item.product_id: item
        for item in availabilities
    }


def _serialize_product(
    component,
    metadata,
    metadata_sources,
    availability_map,
):
    product_metadata = metadata.get(component.product_id, {})
    availability = availability_map.get(component.product_id)
    return {
        "product_id": component.product_id,
        "product_name": product_metadata.get(
            "product_name",
            "",
        ),
        "product_reference": product_metadata.get(
            "product_reference",
            "",
        ),
        "metadata_source": metadata_sources.get(
            component.product_id,
            "fallback",
        ),
        "qty_required": component.qty_required,
        "qty_available": (
            availability.qty_available
            if availability
            else None
        ),
        "limiting_sku": (
            availability.limiting_sku
            if availability
            else ""
        ),
    }
