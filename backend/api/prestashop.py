from fastapi import APIRouter, Depends

from backend.api.dependencies import get_ps_client
from backend.prestashop_client import PrestaShopClient


router = APIRouter(tags=["prestashop"])


@router.get("/api/order-states")
def get_order_states(
    client: PrestaShopClient = Depends(get_ps_client),
):
    return client.get_order_states()
