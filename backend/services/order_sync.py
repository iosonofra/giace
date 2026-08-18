import logging
import threading
from typing import List

from sqlalchemy.orm import Session

from backend.models import PrestashopOrder, PrestashopOrderLine
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
from backend.services.order_sync_delta import (
    OrderSyncDeltaError,
    build_order_sync_delta,
)
from backend.services.order_sync_persistence import (
    apply_order_delta,
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


def sync_orders_incremental_internal(
    db: Session,
    client: PrestaShopClient,
) -> dict:
    """Synchronize only changed orders while preserving a complete snapshot."""
    if not prestashop_sync_lock.acquire(blocking=False):
        return {
            "status": "skipped",
            "message": "Sincronizzazione ordini PrestaShop già in corso.",
            "mock_mode": client.mock_mode,
        }
    try:
        return _sync_orders_incremental_unlocked(db, client)
    finally:
        prestashop_sync_lock.release()


def _load_stale_order_ids(db: Session) -> list[int]:
    rows = (
        db.query(PrestashopOrderLine.order_id)
        .filter(
            PrestashopOrderLine.product_name.is_(None)
            | (PrestashopOrderLine.product_name == "")
        )
        .distinct()
        .all()
    )
    return [int(row[0]) for row in rows]


def _sync_orders_incremental_unlocked(
    db: Session,
    client: PrestaShopClient,
) -> dict:
    sync_progress.start()
    included_states = load_included_state_ids(db)
    if not included_states:
        message = "Nessuno stato ordine configurato nelle impostazioni."
        sync_progress.stop(success=False, error_msg=message)
        raise ValueError(message)

    valid_product_ids = load_valid_product_ids(db)

    try:
        sync_progress.update(phase="checking_changes")
        remote_orders = client.get_order_ids_and_update_times(
            included_states,
            valid_product_ids,
        )
        local_orders = db.query(PrestashopOrder).all()
        stale_order_ids = _load_stale_order_ids(db)
        delta = build_order_sync_delta(
            remote_orders,
            local_orders,
            stale_order_ids,
        )
    except OrderSyncDeltaError as error:
        logger.warning(
            "Snapshot incrementale non affidabile (%s). "
            "Esecuzione della sincronizzazione completa.",
            error,
        )
        return _sync_orders_internal_unlocked(db, client, force=True)
    except Exception as error:
        sync_progress.stop(success=False, error_msg=str(error))
        record_sync_failure(db, error)
        raise

    try:
        if not delta.changed_ids and not delta.removed_ids:
            mark_sync_success(db)
            sync_progress.stop(success=True)
            return {
                "status": "success",
                "sync_mode": "incremental",
                "orders_synced": delta.remote_count,
                "orders_added_or_updated": 0,
                "orders_removed": 0,
                "orders_unchanged": delta.unchanged_count,
                "mock_mode": client.mock_mode,
            }

        changed_orders = []
        if delta.changed_ids:
            sync_progress.update(
                phase="fetching_changes",
                synced_orders=0,
                total_orders=len(delta.changed_ids),
            )
            changed_orders = client.get_orders_by_ids(
                delta.changed_ids,
                included_states,
                valid_product_ids,
            )
            returned_ids = {
                int(order["order_id"])
                for order in changed_orders
            }
            missing_ids = set(delta.changed_ids) - returned_ids
            if missing_ids:
                raise OrderSyncDeltaError(
                    "Dettagli mancanti per gli ordini: "
                    + ", ".join(str(order_id) for order_id in sorted(missing_ids))
                )
            changed_orders = [
                order
                for order in changed_orders
                if int(order["current_state"]) in included_states
            ]
            sync_progress.update(
                phase="fetching_changes",
                synced_orders=len(delta.changed_ids),
                total_orders=len(delta.changed_ids),
            )

        states_map = (
            {
                int(state["id"]): state["name"]
                for state in client.get_order_states()
            }
            if changed_orders
            else {}
        )
        sync_progress.update(phase="saving")
        replace_ids = set(delta.changed_ids) | set(delta.removed_ids)
        saved_count = apply_order_delta(
            db,
            changed_orders,
            replace_ids,
            states_map,
        )
        mark_sync_success(db)

        sync_progress.update(phase="calculating")
        run_order_calculation(db, "dopo sync ordini incrementale")
        sync_progress.stop(success=True)
        return {
            "status": "success",
            "sync_mode": "incremental",
            "orders_synced": delta.remote_count,
            "orders_added_or_updated": saved_count,
            "orders_removed": len(delta.removed_ids),
            "orders_unchanged": delta.unchanged_count,
            "mock_mode": client.mock_mode,
        }
    except OrderSyncDeltaError as error:
        logger.warning(
            "Dettaglio incrementale incompleto (%s). "
            "Esecuzione della sincronizzazione completa.",
            error,
        )
        return _sync_orders_internal_unlocked(db, client, force=True)
    except Exception as error:
        sync_progress.stop(success=False, error_msg=str(error))
        record_sync_failure(db, error)
        raise

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
