import logging
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.api.dependencies import get_ps_client
from backend.database import get_db
from backend.excel_parser import parse_picking_orders_excel
from backend.prestashop_client import PrestaShopClient
from backend.services.picking_file_analysis import (
    PickingFileAnalysisError,
    analyze_uploaded_files,
)
from backend.services.order_sync import sync_orders_incremental_internal
from backend.services.order_sync_config import load_included_state_ids
from backend.services.picking_order_analysis import (
    analyze_stored_orders,
    analyze_stored_orders_by_state,
)


logger = logging.getLogger(__name__)
router = APIRouter(tags=["picking"])


@router.post("/api/orders/analyze")
def analyze_orders(payload: dict, db: Session = Depends(get_db)):
    return analyze_stored_orders(
        db,
        payload.get("order_ids", []),
    )


@router.post("/api/orders/analyze-state")
def analyze_orders_by_state(
    payload: dict,
    db: Session = Depends(get_db),
    ps_client: PrestaShopClient = Depends(get_ps_client),
):
    try:
        state_id = int(payload.get("state_id"))
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=400,
            detail="Seleziona uno stato ordine valido.",
        ) from error

    if state_id not in load_included_state_ids(db):
        raise HTTPException(
            status_code=400,
            detail=(
                "Lo stato selezionato non è più abilitato nelle "
                "Impostazioni Ordini."
            ),
        )

    try:
        sync_result = sync_orders_incremental_internal(
            db,
            ps_client,
        )
    except Exception as error:
        logger.error(
            "Sincronizzazione precedente al calcolo per stato fallita: %s",
            error,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Impossibile aggiornare gli ordini da PrestaShop. "
                "Il calcolo non è stato eseguito su dati non aggiornati."
            ),
        ) from error

    if sync_result.get("status") == "skipped":
        raise HTTPException(
            status_code=409,
            detail=(
                "È già in corso una sincronizzazione degli ordini. "
                "Attendi il completamento e riprova."
            ),
        )

    result = analyze_stored_orders_by_state(db, state_id)
    result["orders_sync"] = sync_result
    return result


@router.post("/api/orders/analyze-files")
def analyze_orders_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    ps_client: PrestaShopClient = Depends(get_ps_client)
):
    try:
        return analyze_uploaded_files(
            files,
            db,
            ps_client,
            parser=parse_picking_orders_excel,
        )
    except PickingFileAnalysisError as error:
        logger.error(str(error))
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
