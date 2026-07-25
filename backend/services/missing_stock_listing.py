from sqlalchemy import func

from backend.models import (
    CalcRun,
    ImportBatch,
    ProductComponent,
    SkuCommitment,
    WarehouseStock,
)


def list_missing_stock(db) -> list[dict]:
    batches_by_type = _load_active_batches(db)
    associations_batch = batches_by_type.get("associations")
    if not associations_batch:
        return []

    latest_run = (
        db.query(CalcRun)
        .filter(CalcRun.status == "completed")
        .order_by(CalcRun.completed_at.desc())
        .first()
    )
    if not latest_run:
        return []

    commitments = _load_missing_commitments(
        db,
        latest_run.id,
        batches_by_type.get("warehouse"),
    )
    connected_counts = _load_connected_counts(
        db,
        associations_batch.id,
    )

    result = []
    for commitment in commitments:
        connected_products = connected_counts.get(
            commitment.sku,
            0,
        )
        if not connected_products:
            continue

        result.append(
            {
                "index": len(result) + 1,
                "sku": commitment.sku,
                "description": (
                    "NON INVENTARIATO "
                    "(Sku non presente nel file)"
                ),
                "lotto": "-",
                "qty_total": 0.0,
                "qty_committed": commitment.qty_committed,
                "qty_residual": 0.0,
                "connected_products": connected_products,
                "is_spacer": False,
                "is_missing": True,
            }
        )

    return result


def _load_active_batches(db) -> dict:
    batches = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type.in_(
                ("warehouse", "associations"),
            ),
            ImportBatch.is_active.is_(True),
        )
        .order_by(ImportBatch.id.asc())
        .all()
    )
    batches_by_type = {}
    for batch in batches:
        batches_by_type.setdefault(batch.file_type, batch)
    return batches_by_type


def _load_missing_commitments(
    db,
    calc_run_id,
    warehouse_batch,
):
    query = (
        db.query(SkuCommitment)
        .filter(
            SkuCommitment.calc_run_id == calc_run_id,
            SkuCommitment.qty_committed > 0,
        )
    )
    if warehouse_batch:
        stock_skus = (
            db.query(WarehouseStock.sku)
            .filter(
                WarehouseStock.import_batch_id
                == warehouse_batch.id,
            )
        )
        query = query.filter(
            ~SkuCommitment.sku.in_(stock_skus),
        )
    return query.all()


def _load_connected_counts(
    db,
    associations_batch_id,
) -> dict:
    counts = (
        db.query(
            ProductComponent.sku,
            func.count(ProductComponent.product_id.distinct()),
        )
        .filter(
            ProductComponent.import_batch_id
            == associations_batch_id,
        )
        .group_by(ProductComponent.sku)
        .all()
    )
    return dict(counts)
