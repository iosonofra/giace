from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.association_export import (
    export_associations_excel,
)
from backend.services.association_management import (
    delete_product_association,
    read_association,
    save_product_association,
)


router = APIRouter(tags=["associations"])


@router.get("/api/associations/export")
def export_associations(db: Session = Depends(get_db)):
    return StreamingResponse(
        BytesIO(export_associations_excel(db)),
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                'attachment; filename="associazioni.xlsx"'
            ),
            "Cache-Control": "no-store",
        },
    )


@router.get("/api/associations/{product_id}")
def get_association(product_id: int, db: Session = Depends(get_db)):
    return read_association(db, product_id)

@router.post("/api/associations")
def save_association(payload: dict, db: Session = Depends(get_db)):
    product_id = payload.get("product_id")
    components = payload.get("components", [])
    
    if not product_id:
        raise HTTPException(status_code=400, detail="Product ID mancante o non valido")
        
    try:
        product_id = int(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Product ID deve essere un numero intero")
        
    return save_product_association(
        db,
        product_id,
        components,
    )

@router.delete("/api/associations/{product_id}")
def delete_association(product_id: int, db: Session = Depends(get_db)):
    return delete_product_association(db, product_id)
