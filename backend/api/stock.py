from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.missing_stock_listing import list_missing_stock
from backend.services.product_catalog_listing import list_products
from backend.services.stock_listing import list_stock


router = APIRouter(tags=["stock"])


@router.get("/api/stock/missing")
def get_missing_stock(db: Session = Depends(get_db)):
    return list_missing_stock(db)

@router.get("/api/stock")
def get_stock(db: Session = Depends(get_db)):
    return list_stock(db)

@router.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return list_products(db)
