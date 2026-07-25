import logging
import time
from collections.abc import Callable
from datetime import datetime
from typing import Any, Optional

from backend.prestashop_customers import PrestaShopCustomerResource


logger = logging.getLogger(__name__)


def _as_list(value: Any) -> list:
    if isinstance(value, dict):
        return [value]
    return value if isinstance(value, list) else []


class PrestaShopOrderResource:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        request_get: Callable,
        clean_name: Callable[[Any], str],
        customer_resource: PrestaShopCustomerResource,
        sleeper: Callable[[float], None] = time.sleep,
    ):
        self._base_url = base_url
        self._api_key = api_key
        self._request_get = request_get
        self._clean_name = clean_name
        self._customers = customer_resource
        self._sleeper = sleeper

    def get_ids_and_update_times(
        self,
        state_ids: list[int],
    ) -> list[dict[str, Any]]:
        if not state_ids:
            return []

        try:
            states_filter = "|".join(
                str(state_id)
                for state_id in state_ids
            )
            response = self._request_get(
                f"{self._base_url}orders",
                params={
                    "display": "[id,date_upd]",
                    "output_format": "JSON",
                    "filter[current_state]": f"[{states_filter}]",
                    "ws_key": self._api_key,
                },
                timeout=30,
            )
            if response.status_code == 404:
                return []
            response.raise_for_status()
            orders = _as_list(response.json().get("orders", []))

            results = []
            for order in orders:
                if not isinstance(order, dict) or "id" not in order:
                    continue
                try:
                    results.append(
                        {
                            "id": int(order["id"]),
                            "date_upd": order.get("date_upd", ""),
                        }
                    )
                except (ValueError, TypeError):
                    continue
            return results
        except Exception:
            logger.exception(
                "Errore nel recupero leggero degli ordini da PrestaShop."
            )
            raise

    def get_orders(
        self,
        state_ids: list[int],
        progress_callback=None,
    ) -> list[dict[str, Any]]:
        if not state_ids:
            return []

        try:
            order_ids = self._fetch_order_ids(state_ids)
            if not order_ids:
                return []

            orders = []
            customer_cache: dict[int, Optional[str]] = {}
            total_orders = len(order_ids)

            for offset in range(0, total_orders, 50):
                chunk = order_ids[offset:offset + 50]
                if progress_callback:
                    progress_callback(
                        "fetching_orders",
                        offset,
                        total_orders,
                    )

                raw_orders = self._fetch_order_chunk(chunk)
                customer_ids = self._customer_ids_to_fetch(
                    raw_orders,
                    customer_cache,
                )
                if customer_ids:
                    self._customers.fetch_names_batch(
                        customer_ids,
                        customer_cache,
                        None,
                    )

                for order_data in raw_orders:
                    if isinstance(order_data, dict):
                        orders.append(
                            self._parse_order(
                                order_data,
                                customer_cache,
                            )
                        )

                self._sleeper(0.2)

            if progress_callback:
                progress_callback(
                    "fetching_orders",
                    total_orders,
                    total_orders,
                )
            return orders
        except Exception:
            logger.exception(
                "Errore nel recupero degli ordini da PrestaShop."
            )
            raise

    def get_orders_by_ids(
        self,
        order_ids: list[int],
    ) -> list[dict[str, Any]]:
        if not order_ids:
            return []

        orders = []
        customer_cache: dict[int, Optional[str]] = {}
        for offset in range(0, len(order_ids), 50):
            chunk = order_ids[offset:offset + 50]
            raw_orders = self._fetch_order_chunk(chunk)
            customer_ids = self._customer_ids_to_fetch(
                raw_orders,
                customer_cache,
            )
            if customer_ids:
                self._customers.fetch_names_batch(
                    customer_ids,
                    customer_cache,
                    None,
                )

            for order_data in raw_orders:
                if isinstance(order_data, dict):
                    orders.append(
                        self._parse_order(
                            order_data,
                            customer_cache,
                        )
                    )
        return orders

    def _fetch_order_ids(self, state_ids: list[int]) -> list[int]:
        states_filter = "|".join(
            str(state_id)
            for state_id in state_ids
        )
        response = self._request_get(
            f"{self._base_url}orders",
            params={
                "display": "[id]",
                "output_format": "JSON",
                "filter[current_state]": f"[{states_filter}]",
                "ws_key": self._api_key,
            },
            timeout=30,
        )
        if response.status_code == 404:
            return []
        response.raise_for_status()

        order_ids = []
        for order in _as_list(response.json().get("orders", [])):
            if not isinstance(order, dict) or "id" not in order:
                continue
            try:
                order_ids.append(int(order["id"]))
            except (ValueError, TypeError):
                continue
        return sorted(order_ids)

    def _fetch_order_chunk(
        self,
        order_ids: list[int],
    ) -> list[dict[str, Any]]:
        ids_filter = "|".join(
            str(order_id)
            for order_id in order_ids
        )
        response = self._request_get(
            f"{self._base_url}orders",
            params={
                "display": "full",
                "output_format": "JSON",
                "filter[id]": f"[{ids_filter}]",
                "ws_key": self._api_key,
            },
            timeout=30,
        )
        if response.status_code == 404:
            return []
        response.raise_for_status()
        return _as_list(response.json().get("orders", []))

    def _customer_ids_to_fetch(
        self,
        orders: list[dict[str, Any]],
        customer_cache: dict[int, Optional[str]],
    ) -> list[int]:
        customer_ids = []
        for order in orders:
            if not isinstance(order, dict):
                continue
            firstname = self._clean_name(
                order.get("customer_firstname")
            )
            lastname = self._clean_name(
                order.get("customer_lastname")
            )
            if firstname or lastname:
                continue

            customer_id = order.get("id_customer")
            if not customer_id:
                continue
            try:
                customer_id = int(customer_id)
            except (ValueError, TypeError):
                continue
            if (
                customer_id not in customer_cache
                and customer_id not in customer_ids
            ):
                customer_ids.append(customer_id)
        return customer_ids

    def _parse_order(
        self,
        order_data: dict[str, Any],
        customer_cache: dict[int, Optional[str]],
    ) -> dict[str, Any]:
        date_add = None
        date_upd = None
        try:
            if order_data.get("date_add"):
                date_add = datetime.strptime(
                    order_data["date_add"],
                    "%Y-%m-%d %H:%M:%S",
                )
            if order_data.get("date_upd"):
                date_upd = datetime.strptime(
                    order_data["date_upd"],
                    "%Y-%m-%d %H:%M:%S",
                )
        except Exception:
            pass

        associations = order_data.get("associations", {})
        raw_lines = (
            associations.get("order_rows", [])
            if isinstance(associations, dict)
            else []
        )
        lines = [
            self._parse_line(line)
            for line in _as_list(raw_lines)
            if isinstance(line, dict)
        ]

        try:
            total_paid = float(
                order_data.get("total_paid_tax_incl") or 0
            )
        except (ValueError, TypeError):
            total_paid = None

        return {
            "order_id": int(order_data.get("id")),
            "current_state": int(order_data.get("current_state")),
            "date_add": date_add,
            "date_upd": date_upd,
            "customer_name": self._customers.get_name(
                order_data,
                customer_cache,
            ),
            "total_paid": total_paid,
            "lines": lines,
        }

    def _parse_line(
        self,
        line: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "line_id": int(line["id"]) if line.get("id") else None,
            "product_id": int(line.get("product_id")),
            "product_attribute_id": (
                int(line.get("product_attribute_id", 0))
                if line.get("product_attribute_id")
                else 0
            ),
            "product_reference": line.get("product_reference", ""),
            "product_name": (
                self._clean_name(line.get("product_name")) or ""
            ),
            "product_quantity": int(
                line.get("product_quantity", 1)
            ),
        }
