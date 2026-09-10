import logging
from collections.abc import Callable
from typing import Any, Optional


logger = logging.getLogger(__name__)


def _as_list(value):
    if isinstance(value, dict):
        return [value]
    return value if isinstance(value, list) else []


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

    def get_ean_map(
        self,
        product_pairs: list[tuple[int, int]],
    ) -> dict[tuple[int, int], str]:
        return {
            key: metadata["ean"]
            for key, metadata in self.get_identifier_map(product_pairs).items()
        }

    def get_identifier_map(
        self,
        product_pairs: list[tuple[int, int]],
    ) -> dict[tuple[int, int], dict[str, str]]:
        """Load EAN and product/supplier references in bounded batches."""
        product_ids = sorted({int(product_id) for product_id, _ in product_pairs})
        combination_ids = sorted({
            int(attribute_id)
            for _, attribute_id in product_pairs
            if int(attribute_id or 0) > 0
        })
        result = {}
        for offset in range(0, len(product_ids), 50):
            chunk = product_ids[offset:offset + 50]
            response = self._request_get(
                f"{self._base_url}products",
                params={
                    "display": "[id,ean13,reference,supplier_reference]",
                    "filter[id]": f"[{'|'.join(map(str, chunk))}]",
                    "output_format": "JSON",
                    "ws_key": self._api_key,
                },
                timeout=15,
            )
            response.raise_for_status()
            for product in _as_list(response.json().get("products", [])):
                if not isinstance(product, dict) or not product.get("id"):
                    continue
                result[(int(product["id"]), 0)] = {
                    "ean": str(product.get("ean13") or "").strip(),
                    "product_reference": str(product.get("reference") or "").strip(),
                    "supplier_reference": str(product.get("supplier_reference") or "").strip(),
                }

        for offset in range(0, len(combination_ids), 50):
            chunk = combination_ids[offset:offset + 50]
            response = self._request_get(
                f"{self._base_url}combinations",
                params={
                    "display": "[id,id_product,ean13,reference,supplier_reference]",
                    "filter[id]": f"[{'|'.join(map(str, chunk))}]",
                    "output_format": "JSON",
                    "ws_key": self._api_key,
                },
                timeout=15,
            )
            response.raise_for_status()
            for combination in _as_list(response.json().get("combinations", [])):
                if not isinstance(combination, dict):
                    continue
                if not combination.get("id") or not combination.get("id_product"):
                    continue
                result[(int(combination["id_product"]), int(combination["id"]))] = {
                    "ean": str(combination.get("ean13") or "").strip(),
                    "product_reference": str(combination.get("reference") or "").strip(),
                    "supplier_reference": str(combination.get("supplier_reference") or "").strip(),
                }
        return result
