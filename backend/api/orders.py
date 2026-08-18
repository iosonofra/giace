import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.dependencies import get_ps_client
from backend.database import get_db
from backend.prestashop_client import PrestaShopClient
from backend.services.order_listing import (
    list_enabled_order_states,
    list_orders,
)
from backend.services.order_sync import (
    sync_orders_internal,
    sync_progress,
    sync_specific_orders_internal,
)


router = APIRouter(tags=["orders"])
logger = logging.getLogger(__name__)


@router.get("/api/prestashop/sync-status")
def get_sync_status():
    return sync_progress.as_dict()

@router.post("/api/prestashop/sync-orders")
def sync_orders(force: bool = True, db: Session = Depends(get_db), client: PrestaShopClient = Depends(get_ps_client)):
    try:
        res = sync_orders_internal(db, client, force=force)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/prestashop/sync-specific-orders")
def sync_specific_orders(payload: dict, db: Session = Depends(get_db), client: PrestaShopClient = Depends(get_ps_client)):
    order_ids = payload.get("order_ids", [])
    try:
        res = sync_specific_orders_internal(db, client, order_ids=order_ids)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/orders")
def get_orders(
    page: int = 1,
    limit: int = 50,
    state_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return list_orders(
        db,
        page=page,
        limit=limit,
        state_id=state_id,
    )


@router.get("/api/orders/available-states")
def get_available_order_states(
    db: Session = Depends(get_db),
    client: PrestaShopClient = Depends(get_ps_client),
):
    try:
        prestashop_states = client.get_order_states()
    except Exception as error:
        logger.warning(
            "Impossibile aggiornare i nomi degli stati PrestaShop: %s",
            error,
        )
        prestashop_states = []

    return {
        "states": list_enabled_order_states(
            db,
            prestashop_states,
        )
    }
