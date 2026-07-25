from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.prestashop_client_factory import (
    create_prestashop_client,
)
from backend.services.smart_counter_runner import run_smart_counter
from backend.services.stock_order_listing import list_stock_orders
from backend.services.stock_product_listing import (
    InvalidStockSkuError,
    list_associated_products,
)


router = APIRouter(tags=["stock"])


@router.get("/api/stock/{sku:path}/products")
def get_stock_associated_products(sku: str, db: Session = Depends(get_db)):
    try:
        return list_associated_products(
            db,
            sku,
            client_factory=lambda: create_prestashop_client(db),
        )
    except InvalidStockSkuError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


@router.get("/api/stock/{sku:path}/orders")
def get_stock_orders(sku: str, db: Session = Depends(get_db)):
    return list_stock_orders(db, sku)


@router.get("/api/stock/{sku:path}/orders/smart-counter")
def get_stock_orders_smart_counter(sku: str, db: Session = Depends(get_db)):
    return run_smart_counter(db, sku)
