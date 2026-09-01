from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.picking_sessions import (
    PickingSessionError,
    create_picking_session,
    get_picking_session,
    update_picking_quantities,
    verify_picking_session,
    serialize_picking_session,
)


router = APIRouter(prefix="/api/picking/sessions", tags=["picking"])


def _run(action, *args):
    try:
        return action(*args)
    except PickingSessionError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("")
def create(payload: dict, db: Session = Depends(get_db)):
    return _run(create_picking_session, db, payload)


@router.get("/{session_id}")
def get(session_id: str, db: Session = Depends(get_db)):
    return _run(lambda: serialize_picking_session(get_picking_session(db, session_id)))


@router.patch("/{session_id}/quantities")
def update_quantities(session_id: str, payload: dict, db: Session = Depends(get_db)):
    return _run(
        update_picking_quantities,
        db,
        session_id,
        payload.get("items"),
    )


@router.post("/{session_id}/verify")
def verify(session_id: str, db: Session = Depends(get_db)):
    return _run(verify_picking_session, db, session_id)
