from sqlalchemy.orm import Session
from backend.services.calculation_inputs import (
    load_calculation_inputs,
    resolve_calculation_batch_ids,
)
from backend.services.calculation_results import (
    build_calculation_results,
    persist_calculation_results,
)
from backend.services.calculation_run_lifecycle import (
    assign_calculation_batches,
    complete_calculation_run,
    fail_calculation_run,
    start_calculation_run,
)

def run_calculation(db: Session, warehouse_batch_id: int = None, associations_batch_id: int = None) -> int:
    """
    Executes the inventory availability calculation.
    
    If batch IDs are not provided, it will auto-detect the active batches.
    
    Formula:
    1. Sum commitments for each SKU from orders in the included states.
    2. Sku Residual = Sku Total - Sku Committed
    3. Product Availability = min( floor(Sku Residual / Sku Required) )
    """
    run = start_calculation_run(db)
    
    try:
        # 2. Resolve Active Batches if not provided
        batch_ids = resolve_calculation_batch_ids(
            db,
            warehouse_batch_id=warehouse_batch_id,
            associations_batch_id=associations_batch_id,
        )
        assign_calculation_batches(db, run, batch_ids)
        inputs = load_calculation_inputs(db, batch_ids)
        results = build_calculation_results(
            inputs.order_lines,
            inputs.components_map,
            inputs.sku_total_stock,
        )
        persist_calculation_results(
            db,
            run.id,
            results,
        )
            
        return complete_calculation_run(db, run)

    except Exception as error:
        fail_calculation_run(db, run, error)
        raise
