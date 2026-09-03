from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.picking_history import (
    PickingHistoryError,
    get_picking_history_detail,
    list_picking_history,
)


router = APIRouter(prefix="/api/picking/history", tags=["picking"])


def _run(action, *args, **kwargs):
    try:
        return action(*args, **kwargs)
    except PickingHistoryError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("")
def history(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: str = "all",
    query: str = "",
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
):
    return _run(
        list_picking_history,
        db,
        page=page,
        page_size=page_size,
        status=status,
        query=query,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{operation_id}")
def detail(operation_id: str, db: Session = Depends(get_db)):
    try:
        return get_picking_history_detail(db, operation_id)
    except PickingHistoryError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
