from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.auto_picking_runner import (
    AutoPickingRequestError,
    run_auto_picking as run_auto_picking_service,
)


router = APIRouter(tags=["picking"])


def run_auto_picking(payload: dict, db: Session):
    try:
        return run_auto_picking_service(payload, db)
    except AutoPickingRequestError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


@router.post("/api/orders/auto-picking")
def auto_picking_orders(
    payload: dict,
    db: Session = Depends(get_db),
):
    return run_auto_picking(payload, db)
