from sqlalchemy import func, select

from backend.models import (
    CalcRun,
    ImportAnomaly,
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductAvailability,
    ProductComponent,
    SkuCommitment,
    WarehouseStock,
)


def get_dashboard_metrics(db) -> dict:
    batches_by_type = _load_active_batches(db)
    warehouse_batch = batches_by_type.get("warehouse")
    associations_batch = batches_by_type.get("associations")

    sku_count, product_count = _load_inventory_counts(
        db,
        warehouse_batch,
        associations_batch,
    )
    order_count, items_ordered, anomalies_count = (
        _load_operational_counts(db)
    )
    (
        latest_run,
        critical_skus,
        zero_availability_products,
    ) = _load_latest_calculation_metrics(db)

    return {
        "sku_count": sku_count,
        "product_count": product_count,
        "order_count": order_count,
        "items_ordered": int(items_ordered),
        "critical_skus": critical_skus,
        "zero_availability_products": (
            zero_availability_products
        ),
        "anomalies_count": anomalies_count,
        "latest_import_warehouse": _iso_z(
            warehouse_batch.imported_at
            if warehouse_batch
            else None
        ),
        "latest_import_associations": _iso_z(
            associations_batch.imported_at
            if associations_batch
            else None
        ),
        "latest_calculation_run": _iso_z(
            latest_run.completed_at
            if latest_run
            else None
        ),
    }


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
    result = {}
    for batch in batches:
        result.setdefault(batch.file_type, batch)
    return result


def _load_inventory_counts(
    db,
    warehouse_batch,
    associations_batch,
):
    if not warehouse_batch and not associations_batch:
        return 0, 0

    sku_count = (
        select(func.count(WarehouseStock.id))
        .where(
            WarehouseStock.import_batch_id
            == warehouse_batch.id,
            ~WarehouseStock.sku.like("__spacer_%"),
        )
        .scalar_subquery()
        if warehouse_batch
        else select(0).scalar_subquery()
    )
    product_count = (
        select(
            func.count(
                ProductComponent.product_id.distinct()
            )
        )
        .where(
            ProductComponent.import_batch_id
            == associations_batch.id,
        )
        .scalar_subquery()
        if associations_batch
        else select(0).scalar_subquery()
    )
    row = db.query(sku_count, product_count).first()
    return (
        row[0] if row else 0,
        row[1] if row else 0,
    )


def _load_operational_counts(db):
    order_count = (
        select(func.count(PrestashopOrder.order_id))
        .scalar_subquery()
    )
    items_ordered = (
        select(
            func.coalesce(
                func.sum(
                    PrestashopOrderLine.product_quantity
                ),
                0,
            )
        )
        .scalar_subquery()
    )
    anomalies_count = (
        select(func.count(ImportAnomaly.id))
        .scalar_subquery()
    )
    row = db.query(
        order_count,
        items_ordered,
        anomalies_count,
    ).first()
    return (
        row[0] if row else 0,
        row[1] if row else 0,
        row[2] if row else 0,
    )


def _load_latest_calculation_metrics(db):
    critical_skus = (
        select(func.count(SkuCommitment.id))
        .where(
            SkuCommitment.calc_run_id == CalcRun.id,
            SkuCommitment.qty_residual <= 0,
        )
        .correlate(CalcRun)
        .scalar_subquery()
    )
    zero_availability = (
        select(func.count(ProductAvailability.id))
        .where(
            ProductAvailability.calc_run_id == CalcRun.id,
            ProductAvailability.qty_available == 0,
        )
        .correlate(CalcRun)
        .scalar_subquery()
    )
    row = (
        db.query(
            CalcRun,
            critical_skus,
            zero_availability,
        )
        .filter(CalcRun.status == "completed")
        .order_by(CalcRun.completed_at.desc())
        .first()
    )
    if not row:
        return None, 0, 0
    return row[0], row[1], row[2]


def _iso_z(value):
    return value.isoformat() + "Z" if value else None
