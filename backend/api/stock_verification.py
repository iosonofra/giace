from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.stock_verification import (
    MAX_STOCK_VERIFICATION_FILE_SIZE,
    StockVerificationError,
    analyze_stock_verification,
    export_stock_verification,
    stock_verification_filename,
)


router = APIRouter(prefix="/api/stock-verification", tags=["stock-verification"])


def _read_file(file: UploadFile) -> bytes:
    filename = str(file.filename or "")
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Carica un file di verifica in formato .xlsx.",
        )
    content = file.file.read(MAX_STOCK_VERIFICATION_FILE_SIZE + 1)
    if len(content) > MAX_STOCK_VERIFICATION_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Il file di verifica supera il limite di 10 MB.",
        )
    return content


def _analyze(
    db,
    content,
    *,
    sku_column,
    quantity_column,
    header_row,
):
    try:
        return analyze_stock_verification(
            db,
            content,
            sku_column=sku_column or None,
            quantity_column=quantity_column or None,
            header_row=header_row,
        )
    except StockVerificationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/analyze")
def analyze(
    file: UploadFile = File(...),
    sku_column: str = Form(""),
    quantity_column: str = Form(""),
    header_row: int | None = Form(None),
    db: Session = Depends(get_db),
):
    return _analyze(
        db,
        _read_file(file),
        sku_column=sku_column,
        quantity_column=quantity_column,
        header_row=header_row,
    )


@router.post("/export")
def export(
    file: UploadFile = File(...),
    sku_column: str = Form(...),
    quantity_column: str = Form(...),
    header_row: int = Form(...),
    db: Session = Depends(get_db),
):
    content = _read_file(file)
    verification = _analyze(
        db,
        content,
        sku_column=sku_column,
        quantity_column=quantity_column,
        header_row=header_row,
    )
    if verification.get("mapping_required"):
        raise HTTPException(
            status_code=400,
            detail="Completa la mappatura delle colonne prima di esportare.",
        )
    output = export_stock_verification(db, verification)
    filename = stock_verification_filename(file.filename or "verifica.xlsx")
    return Response(
        content=output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{quote(filename, safe='')}"
            ),
        },
    )
