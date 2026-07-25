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
from backend.services.picking_order_analysis import (
    analyze_stored_orders,
)


logger = logging.getLogger(__name__)
router = APIRouter(tags=["picking"])


@router.post("/api/orders/analyze")
def analyze_orders(payload: dict, db: Session = Depends(get_db)):
    return analyze_stored_orders(
        db,
        payload.get("order_ids", []),
    )

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
