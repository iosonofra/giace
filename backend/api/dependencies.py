from fastapi import Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.prestashop_client import PrestaShopClient
from backend.services.prestashop_client_factory import (
    create_prestashop_client,
)


def get_ps_client(db: Session = Depends(get_db)) -> PrestaShopClient:
    return create_prestashop_client(db)
