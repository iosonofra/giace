import logging
from collections.abc import Callable
from typing import Any, Optional


logger = logging.getLogger(__name__)


class PrestaShopProductResource:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        request_get: Callable,
        clean_name: Callable[[Any], str],
    ):
        self._base_url = base_url
        self._api_key = api_key
        self._request_get = request_get
        self._clean_name = clean_name

    def get_reference(self, product_id: int) -> Optional[str]:
        try:
            response = self._request_get(
                f"{self._base_url}products/{product_id}",
                params={
                    "display": "[reference]",
                    "output_format": "JSON",
                    "ws_key": self._api_key,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            product = data.get("product", {})
            if isinstance(product, dict):
                return str(product.get("reference", "")).strip()
            if isinstance(product, list) and product:
                return str(product[0].get("reference", "")).strip()
            return None
        except Exception as error:
            logger.error(
                "Errore nel recupero della reference per il prodotto %s "
                "da PrestaShop: %s",
                product_id,
                error,
            )
            return None

    def get_details(
        self,
        product_ids: list[int],
    ) -> dict[int, dict[str, str]]:
        products = {}

        for offset in range(0, len(product_ids), 50):
            chunk = product_ids[offset:offset + 50]
            ids_filter = "|".join(
                str(product_id)
                for product_id in chunk
            )
            response = self._request_get(
                f"{self._base_url}products",
                params={
                    "display": "[id,name,reference]",
                    "filter[id]": f"[{ids_filter}]",
                    "output_format": "JSON",
                    "ws_key": self._api_key,
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            raw_products = (
                data.get("products", [])
                if isinstance(data, dict)
                else data
            )
            if isinstance(raw_products, dict):
                raw_products = [raw_products]
            if not isinstance(raw_products, list):
                raw_products = []

            for product in raw_products:
                if not isinstance(product, dict) or not product.get("id"):
                    continue
                product_id = int(product["id"])
                products[product_id] = {
                    "product_name": self._clean_name(
                        product.get("name")
                    ),
                    "product_reference": str(
                        product.get("reference") or ""
                    ).strip(),
                }

        return products
