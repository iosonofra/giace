import logging

from backend.calculator import run_calculation
from backend.models import ImportBatch, ProductComponent


logger = logging.getLogger(__name__)


def read_association(db, product_id: int) -> dict:
    active_batch = _load_active_batch(db)
    if not active_batch:
        return {
            "product_id": product_id,
            "components": [],
        }

    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == active_batch.id,
            ProductComponent.product_id == product_id,
        )
        .all()
    )
    return {
        "product_id": product_id,
        "components": [
            {
                "sku": component.sku,
                "qty_required": component.qty_required,
            }
            for component in components
        ],
    }


def save_product_association(
    db,
    product_id: int,
    components,
    *,
    calculation_runner=run_calculation,
) -> dict:
    normalized_components = _normalize_components(components)
    try:
        active_batch = _load_active_batch(db)
        if not active_batch:
            active_batch = ImportBatch(
                file_type="associations",
                filename="associazione_manuale.xlsx",
                is_active=True,
                record_count=0,
            )
            db.add(active_batch)
            db.flush()

        (
            db.query(ProductComponent)
            .filter(
                ProductComponent.import_batch_id
                == active_batch.id,
                ProductComponent.product_id == product_id,
            )
            .delete()
        )
        db.add_all(
            [
                ProductComponent(
                    import_batch_id=active_batch.id,
                    product_id=product_id,
                    sku=sku,
                    qty_required=quantity,
                )
                for sku, quantity
                in normalized_components.items()
            ]
        )
        db.flush()
        active_batch.record_count = (
            db.query(ProductComponent)
            .filter(
                ProductComponent.import_batch_id
                == active_batch.id,
            )
            .count()
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    _run_recalculation(
        db,
        calculation_runner,
        operation="modifica",
    )
    return {"status": "success"}


def delete_product_association(
    db,
    product_id: int,
    *,
    calculation_runner=run_calculation,
) -> dict:
    active_batch = _load_active_batch(db)
    if not active_batch:
        return {
            "status": "success",
            "message": "Nessun batch attivo",
        }

    try:
        (
            db.query(ProductComponent)
            .filter(
                ProductComponent.import_batch_id
                == active_batch.id,
                ProductComponent.product_id == product_id,
            )
            .delete()
        )
        db.flush()
        active_batch.record_count = (
            db.query(ProductComponent)
            .filter(
                ProductComponent.import_batch_id
                == active_batch.id,
            )
            .count()
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    _run_recalculation(
        db,
        calculation_runner,
        operation="eliminazione",
    )
    return {"status": "success"}


def _load_active_batch(db):
    return (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )


def _normalize_components(components) -> dict:
    normalized = {}
    for component in components or []:
        sku = str(component.get("sku") or "").strip()
        if not sku:
            continue
        try:
            quantity = int(
                component.get("qty_required", 1)
            )
        except (TypeError, ValueError):
            continue
        if quantity <= 0:
            continue
        normalized[sku] = normalized.get(sku, 0) + quantity
    return normalized


def _run_recalculation(
    db,
    calculation_runner,
    *,
    operation: str,
) -> None:
    try:
        calculation_runner(db)
    except Exception as error:
        logger.error(
            "Errore nel ricalcolo automatico dopo %s "
            "associazione: %s",
            operation,
            error,
        )
