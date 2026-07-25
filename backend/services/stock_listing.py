from sqlalchemy import func

from backend.models import (
    CalcRun,
    ImportBatch,
    ProductComponent,
    SkuCommitment,
    WarehouseStock,
)


def list_stock(db) -> list[dict]:
    active_batches = (
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
    for batch in active_batches:
        batches_by_type.setdefault(batch.file_type, batch)

    warehouse_batch = batches_by_type.get("warehouse")
    if not warehouse_batch:
        return []

    latest_run = (
        db.query(CalcRun)
        .filter(CalcRun.status == "completed")
        .order_by(CalcRun.completed_at.desc())
        .first()
    )
    stock_items = (
        db.query(WarehouseStock)
        .filter(
            WarehouseStock.import_batch_id
            == warehouse_batch.id,
        )
        .order_by(WarehouseStock.id.asc())
        .all()
    )
    commitments = _load_commitments(db, latest_run)
    connected_counts = _load_connected_counts(
        db,
        batches_by_type.get("associations"),
    )

    return _serialize_stock_items(
        stock_items,
        commitments,
        connected_counts,
    )


def _load_commitments(db, latest_run) -> dict:
    if not latest_run:
        return {}

    items = (
        db.query(SkuCommitment)
        .filter(SkuCommitment.calc_run_id == latest_run.id)
        .all()
    )
    return {item.sku: item for item in items}


def _load_connected_counts(db, associations_batch) -> dict:
    if not associations_batch:
        return {}

    counts = (
        db.query(
            ProductComponent.sku,
            func.count(ProductComponent.product_id.distinct()),
        )
        .filter(
            ProductComponent.import_batch_id
            == associations_batch.id,
        )
        .group_by(ProductComponent.sku)
        .all()
    )
    return dict(counts)


def _serialize_stock_items(
    stock_items,
    commitments,
    connected_counts,
) -> list[dict]:
    sku_counts = {}
    for item in stock_items:
        if not _is_spacer(item):
            sku_counts[item.sku] = sku_counts.get(item.sku, 0) + 1

    processed_counts = {}
    allocated_commitments = {}
    result = []

    for index, item in enumerate(stock_items, start=1):
        if _is_spacer(item):
            result.append(_serialize_spacer(index))
            continue

        allocated = _allocate_commitment(
            item,
            commitments,
            sku_counts,
            processed_counts,
            allocated_commitments,
        )
        result.append(
            {
                "index": index,
                "sku": item.sku,
                "description": item.description or "",
                "lotto": item.lotto or "",
                "qty_total": item.qty_total,
                "qty_committed": allocated,
                "qty_residual": item.qty_total - allocated,
                "connected_products": connected_counts.get(
                    item.sku,
                    0,
                ),
                "is_spacer": False,
            }
        )

    return result


def _allocate_commitment(
    item,
    commitments,
    sku_counts,
    processed_counts,
    allocated_commitments,
):
    commitment = commitments.get(item.sku)
    total_committed = (
        commitment.qty_committed
        if commitment
        else 0.0
    )

    processed_counts[item.sku] = (
        processed_counts.get(item.sku, 0) + 1
    )
    is_last_row = (
        processed_counts[item.sku] == sku_counts[item.sku]
    )
    already_allocated = allocated_commitments.get(item.sku, 0.0)
    remaining = total_committed - already_allocated

    if is_last_row:
        allocated = remaining
    else:
        allocated = max(0.0, min(item.qty_total, remaining))

    allocated_commitments[item.sku] = (
        already_allocated + allocated
    )
    return allocated


def _is_spacer(item) -> bool:
    return item.sku.startswith("__spacer_")


def _serialize_spacer(index: int) -> dict:
    return {
        "index": index,
        "sku": "",
        "description": "",
        "lotto": "",
        "qty_total": 0.0,
        "qty_committed": 0.0,
        "qty_residual": 0.0,
        "connected_products": 0,
        "is_spacer": True,
    }
