import math
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import (
    ImportBatch, WarehouseStock, ProductComponent,
    PrestashopOrder, PrestashopOrderLine, CalcRun,
    SkuCommitment, ProductAvailability, ImportAnomaly,
    AppSetting
)
import json

def run_calculation(db: Session, warehouse_batch_id: int = None, associations_batch_id: int = None) -> int:
    """
    Executes the inventory availability calculation.
    
    If batch IDs are not provided, it will auto-detect the active batches.
    
    Formula:
    1. Sum commitments for each SKU from orders in the included states.
    2. Sku Residual = Sku Total - Sku Committed
    3. Product Availability = min( floor(Sku Residual / Sku Required) )
    """
    # 1. Initialize Calculation Run record
    run = CalcRun(status="running", started_at=datetime.now())
    db.add(run)
    db.commit()
    db.refresh(run)
    
    try:
        # 2. Resolve Active Batches if not provided
        if not warehouse_batch_id:
            active_w_batch = db.query(ImportBatch).filter(
                ImportBatch.file_type == "warehouse",
                ImportBatch.is_active == True
            ).order_by(ImportBatch.imported_at.desc()).first()
            if active_w_batch:
                warehouse_batch_id = active_w_batch.id
                
        if not associations_batch_id:
            active_a_batch = db.query(ImportBatch).filter(
                ImportBatch.file_type == "associations",
                ImportBatch.is_active == True
            ).order_by(ImportBatch.imported_at.desc()).first()
            if active_a_batch:
                associations_batch_id = active_a_batch.id
                
        run.warehouse_batch_id = warehouse_batch_id
        run.associations_batch_id = associations_batch_id
        db.commit()
        
        # Check if batches exist
        if not warehouse_batch_id or not associations_batch_id:
            error_msg = ""
            if not warehouse_batch_id:
                error_msg += "Nessun batch di giacenza (magazzino) attivo trovato. "
            if not associations_batch_id:
                error_msg += "Nessun batch di associazioni attivo trovato. "
            raise ValueError(error_msg.strip())
            
        # 3. Load App Settings (included state IDs for calculation)
        included_states = []
        state_setting = db.query(AppSetting).filter(AppSetting.key == "included_state_ids").first()
        if state_setting:
            try:
                included_states = json.loads(state_setting.value)
            except Exception:
                pass
        
        if not included_states:
            # Fallback to default state IDs from environment or default to [12]
            # (Note: standard value fallback is handled here)
            included_states = [12] # Default to magazzino rosate (12)
            
        # 4. Load Active Orders in those states
        orders = db.query(PrestashopOrder).filter(PrestashopOrder.current_state.in_(included_states)).all()
        order_ids = [o.order_id for o in orders]
        
        # Load all order lines for these orders
        order_lines = []
        if order_ids:
            order_lines = db.query(PrestashopOrderLine).filter(PrestashopOrderLine.order_id.in_(order_ids)).all()
            
        # 5. Load Active Associations (Product Components)
        components = db.query(ProductComponent).filter(ProductComponent.import_batch_id == associations_batch_id).all()
        
        # Index components by product_id
        # product_id -> list of components {sku: qty_required}
        components_map = {}
        for comp in components:
            if comp.product_id not in components_map:
                components_map[comp.product_id] = []
            components_map[comp.product_id].append({
                "sku": comp.sku,
                "qty_required": comp.qty_required
            })
            
        # 6. Load Active Stock
        stock = db.query(WarehouseStock).filter(WarehouseStock.import_batch_id == warehouse_batch_id).all()
        
        # Calculate total stock per SKU, ignoring spacer rows
        sku_total_stock = {}
        for item in stock:
            if item.sku.startswith("__spacer_"):
                continue
            sku_total_stock[item.sku] = sku_total_stock.get(item.sku, 0.0) + item.qty_total
            
        # 7. Step 1: Calculate commitments per SKU
        sku_commitments = {} # sku -> total committed quantity
        
        # Delete any previous anomalies from previous calculations to avoid clutter
        db.query(ImportAnomaly).filter(ImportAnomaly.source == "calculation").delete()
        
        for line in order_lines:
            product_id = line.product_id
            order_qty = line.product_quantity
            
            # Check if this product is in our associations
            if product_id not in components_map:
                # Anomaly: Product in order is not mapped in associations
                db.add(ImportAnomaly(
                    source="calculation",
                    record_key=str(product_id),
                    anomaly_type="missing_association",
                    message=f"Ordine {line.order_id}: Il prodotto venduto (ID {product_id}, Qta {order_qty}) non è presente nelle associazioni. SKU non deducibili."
                ))
                continue
                
            # Expand product into its components and add commits
            product_comps = components_map[product_id]
            for comp in product_comps:
                sku = comp["sku"]
                req_qty = comp["qty_required"]
                
                committed_for_line = req_qty * order_qty
                sku_commitments[sku] = sku_commitments.get(sku, 0.0) + committed_for_line
                
        # 8. Step 2: Calculate SKU Residuals
        # Save commitments for all SKUs.
        # We need to cover all SKUs present in Stock plus any SKUs that are committed but missing from stock.
        all_skus = set(sku_total_stock.keys()) | set(sku_commitments.keys())
        
        sku_residual_map = {} # sku -> qty_residual
        
        for sku in all_skus:
            # Check stock
            qty_total = sku_total_stock.get(sku, 0.0)
            
            # Check if SKU is missing from stock but has associations or commitments
            if sku not in sku_total_stock:
                # This is a missing stock item anomaly! We'll record it.
                db.add(ImportAnomaly(
                    source="calculation",
                    record_key=sku,
                    anomaly_type="missing_sku_in_stock",
                    message=f"La SKU '{sku}' è richiesta nelle associazioni o impegnata negli ordini ma non è presente nell'inventario. Trattata come stock = 0."
                ))
                
            qty_committed = sku_commitments.get(sku, 0.0)
            qty_residual = qty_total - qty_committed
            sku_residual_map[sku] = qty_residual
            
            # Persist SKU commitment
            db.add(SkuCommitment(
                calc_run_id=run.id,
                sku=sku,
                qty_committed=qty_committed,
                qty_total=qty_total,
                qty_residual=qty_residual
            ))
            
        # 9. Step 3: Calculate Availability for each compound product
        for product_id, product_comps in components_map.items():
            min_available = float('inf')
            limiting_sku = None
            
            for comp in product_comps:
                sku = comp["sku"]
                qty_req = comp["qty_required"]
                
                # Get residual stock of component
                # If component SKU is missing from stock, its residual is defined in sku_residual_map (defaults to 0 - committed)
                residual = sku_residual_map.get(sku, 0.0)
                
                # Availability ratio
                if qty_req > 0:
                    ratio = math.floor(residual / qty_req)
                    # Clamp to 0 if negative, as you cannot have negative physical availability for sale
                    ratio = max(0, ratio)
                else:
                    ratio = 0
                    
                if ratio < min_available:
                    min_available = ratio
                    limiting_sku = sku
                    
            if min_available == float('inf'):
                min_available = 0
                
            db.add(ProductAvailability(
                calc_run_id=run.id,
                product_id=product_id,
                qty_available=int(min_available),
                limiting_sku=limiting_sku
            ))
            
        # 10. Complete calculation run
        run.status = "completed"
        run.completed_at = datetime.now()
        db.commit()
        return run.id
        
    except Exception as e:
        db.rollback()
        # Mark run as failed
        run.status = "failed"
        run.completed_at = datetime.now()
        db.commit()
        
        # Log calculation error anomaly
        db.add(ImportAnomaly(
            source="calculation",
            record_key=f"Run {run.id}",
            anomaly_type="calculation_error",
            message=f"Errore critico durante il calcolo della disponibilità: {str(e)}"
        ))
        db.commit()
        raise e
