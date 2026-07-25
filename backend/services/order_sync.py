import logging
import threading
from typing import List

from sqlalchemy.orm import Session

from backend.prestashop_client import PrestaShopClient
from backend.services.order_sync_calculation import (
    run_order_calculation,
)
from backend.services.order_sync_check import (
    run_quick_sync_check,
)
from backend.services.order_sync_config import (
    load_included_state_ids,
    load_valid_product_ids,
)
from backend.services.order_sync_outcome import (
    mark_sync_success,
    record_sync_failure,
)
from backend.services.order_sync_persistence import (
    save_order_snapshot,
    save_specific_orders,
)
from backend.services.order_sync_progress import SyncProgress


logger = logging.getLogger(__name__)
prestashop_sync_lock = threading.Lock()


sync_progress = SyncProgress()


def sync_orders_internal(db: Session, client: PrestaShopClient, force: bool = False) -> dict:
    if not prestashop_sync_lock.acquire(blocking=False):
        return {
            "status": "skipped",
            "message": "Sincronizzazione ordini PrestaShop già in corso.",
            "mock_mode": client.mock_mode
        }
    try:
        return _sync_orders_internal_unlocked(db, client, force=force)
    finally:
        prestashop_sync_lock.release()

def _sync_orders_internal_unlocked(db: Session, client: PrestaShopClient, force: bool = False) -> dict:
    sync_progress.start()
    # 1. Get states to sync
    included_states = load_included_state_ids(db)
        
    if not included_states:
        sync_progress.stop(success=False, error_msg="Nessuno stato ordine configurato nelle impostazioni.")
        raise ValueError("Nessuno stato ordine configurato nelle impostazioni.")
        
    valid_product_ids = load_valid_product_ids(db)
        
    try:
        # Check if we can skip the sync using the lightweight check
        if not force:
            try:
                skipped_result = run_quick_sync_check(
                    db,
                    client,
                    included_states,
                    valid_product_ids,
                )
                if skipped_result:
                    sync_progress.stop(success=True)
                    return skipped_result
            except Exception as check_err:
                logger.warning(f"Errore durante il controllo rapido delle modifiche: {check_err}. Si procede con il sync completo.")
                raise check_err

        # Fetch orders
        def on_progress(phase, current, total):
            if phase == "fetching_orders":
                sync_progress.update(phase="fetching_orders", synced_orders=current, total_orders=total)

        orders_data = client.get_orders(included_states, valid_product_ids, progress_callback=on_progress)
        
        # We need a map of order states to save state labels
        states_map = {s["id"]: s["name"] for s in client.get_order_states()}
        
        sync_progress.update(phase="saving")

        synced_count = save_order_snapshot(
            db,
            orders_data,
            states_map,
        )
        
        mark_sync_success(db)
        
        sync_progress.update(phase="calculating")
        run_order_calculation(db, "dopo sync ordini")
            
        sync_progress.stop(success=True)
        return {
            "status": "success",
            "orders_synced": synced_count,
            "mock_mode": client.mock_mode
        }
        
    except Exception as e:
        sync_progress.stop(success=False, error_msg=str(e))
        record_sync_failure(db, e)
        raise


def sync_specific_orders_internal(db: Session, client: PrestaShopClient, order_ids: List[int]) -> dict:
    clean_ids = []
    for oid in order_ids:
        try:
            clean_ids.append(int(oid))
        except (ValueError, TypeError):
            continue
    clean_ids = list(dict.fromkeys(clean_ids))
    if not clean_ids:
        return {"status": "success", "orders_synced": 0, "mock_mode": client.mock_mode}

    valid_product_ids = load_valid_product_ids(db)

    state_ids = (
        load_included_state_ids(db)
        if client.mock_mode
        else []
    )
    orders_data = client.get_orders_by_ids(
        clean_ids,
        state_ids,
        valid_product_ids,
    )

    states_map = {s["id"]: s["name"] for s in client.get_order_states()}
    synced_count = save_specific_orders(
        db,
        orders_data,
        states_map,
    )
    run_order_calculation(db, "dopo sync specifico")
        
    return {
        "status": "success",
        "orders_synced": synced_count,
        "mock_mode": client.mock_mode
    }
