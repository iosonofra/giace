import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import SessionLocal, get_db
from backend.services.picking_sheet_write import (
    PickingSheetWriteError,
    apply_sheet_write,
    complete_sheet_write_stock_sync,
    get_write_status,
    preview_sheet_write,
    test_write_connection,
)


router = APIRouter(prefix="/api/picking/sheet-write", tags=["picking"])
logger = logging.getLogger(__name__)


def _run(action, *args, **kwargs):
    try:
        return action(*args, **kwargs)
    except PickingSheetWriteError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/status")
def status(db: Session = Depends(get_db)):
    return get_write_status(db)


@router.post("/test")
def test_connection(db: Session = Depends(get_db)):
    return _run(test_write_connection, db)


@router.post("/preview")
def preview(payload: dict, db: Session = Depends(get_db)):
    return _run(preview_sheet_write, db, payload)


def _complete_stock_sync(operation_id: str) -> None:
    db = SessionLocal()
    try:
        complete_sheet_write_stock_sync(db, operation_id)
    except Exception:
        logger.exception(
            "Sincronizzazione locale post-prelievo non riuscita per %s.",
            operation_id,
        )
    finally:
        db.close()


@router.post("/apply")
def apply(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    result = _run(
        apply_sheet_write,
        db,
        payload,
        sync_after_apply=False,
    )
    if result.get("stock_sync", {}).get("status") == "pending":
        background_tasks.add_task(
            _complete_stock_sync,
            result["operation_id"],
        )
    return result
