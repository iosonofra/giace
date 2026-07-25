import logging
from collections.abc import Callable
from typing import Any

from backend.prestashop_parsing import clean_localized_name


logger = logging.getLogger(__name__)

FALLBACK_ORDER_STATES = (
    {"id": 12, "name": "magazzino rosate (Fallback)"},
)


class PrestaShopOrderStateResource:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        request_get: Callable,
    ):
        self._base_url = base_url
        self._api_key = api_key
        self._request_get = request_get

    def get_all(self) -> list[dict[str, Any]]:
        try:
            response = self._request_get(
                f"{self._base_url}order_states",
                params={
                    "display": "[id,name]",
                    "output_format": "JSON",
                    "ws_key": self._api_key,
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            raw_states = (
                data.get("order_states", [])
                if isinstance(data, dict)
                else []
            )
            if isinstance(raw_states, dict):
                raw_states = [raw_states]
            if not isinstance(raw_states, list):
                raw_states = []

            return [
                {
                    "id": int(state.get("id")),
                    "name": clean_localized_name(
                        state.get("name", "")
                    ),
                }
                for state in raw_states
                if isinstance(state, dict)
            ]
        except Exception as error:
            logger.error(
                "Errore nel recupero degli stati ordine da PrestaShop: %s",
                error,
            )
            return [
                dict(state)
                for state in FALLBACK_ORDER_STATES
            ]
