from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.picking_sheet_write import (
    PickingSheetWriteError,
    apply_sheet_write,
    get_write_status,
    preview_sheet_write,
    test_write_connection,
)


router = APIRouter(prefix="/api/picking/sheet-write", tags=["picking"])


def _run(action, *args):
    try:
        return action(*args)
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


@router.post("/apply")
def apply(payload: dict, db: Session = Depends(get_db)):
    return _run(apply_sheet_write, db, payload)
