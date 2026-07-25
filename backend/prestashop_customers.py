import logging
from collections.abc import Callable
from typing import Any, Optional


logger = logging.getLogger(__name__)


class PrestaShopCustomerResource:
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

    def get_name(
        self,
        order_data: dict[str, Any],
        customer_cache: dict[int, Optional[str]],
    ) -> Optional[str]:
        firstname = self._clean_name(
            order_data.get("customer_firstname")
        )
        lastname = self._clean_name(
            order_data.get("customer_lastname")
        )
        if firstname or lastname:
            return f"{firstname} {lastname}".strip() or None

        customer_id = order_data.get("id_customer")
        if not customer_id:
            return None

        try:
            customer_id = int(customer_id)
        except (ValueError, TypeError):
            return None

        if customer_id in customer_cache:
            return customer_cache[customer_id]

        try:
            response = self._request_get(
                f"{self._base_url}customers/{customer_id}",
                params={
                    "display": "[firstname,lastname]",
                    "output_format": "JSON",
                    "ws_key": self._api_key,
                },
                timeout=8,
            )
            if response.status_code == 200:
                data = response.json()
                customer_data = {}
                if isinstance(data, dict):
                    customer_data = data.get("customer", {})
                elif isinstance(data, list) and data:
                    customer_data = data[0]

                if isinstance(customer_data, dict):
                    firstname = self._clean_name(
                        customer_data.get("firstname")
                    )
                    lastname = self._clean_name(
                        customer_data.get("lastname")
                    )
                    name = (
                        f"{firstname} {lastname}".strip() or None
                    )
                    customer_cache[customer_id] = name
                    return name
        except Exception as error:
            logger.warning(
                "Impossibile recuperare il nome del cliente %s: %s",
                customer_id,
                error,
            )

        customer_cache[customer_id] = None
        return None

    def fetch_names_batch(
        self,
        customer_ids: list[int],
        customer_cache: dict[int, Optional[str]],
        progress_callback=None,
    ) -> None:
        if not customer_ids:
            return

        chunk_size = 50
        total_customers = len(customer_ids)
        fetched_so_far = 0

        for offset in range(0, total_customers, chunk_size):
            chunk = customer_ids[offset:offset + chunk_size]
            ids_filter = "|".join(
                str(customer_id)
                for customer_id in chunk
            )
            try:
                if progress_callback:
                    progress_callback(
                        "fetching_customers",
                        fetched_so_far,
                        total_customers,
                    )

                response = self._request_get(
                    f"{self._base_url}customers",
                    params={
                        "display": "[id,firstname,lastname]",
                        "filter[id]": f"[{ids_filter}]",
                        "output_format": "JSON",
                        "ws_key": self._api_key,
                    },
                    timeout=15,
                )
                if response.status_code == 200:
                    data = response.json()
                    customers = (
                        data.get("customers", [])
                        if isinstance(data, dict)
                        else data
                    )
                    if isinstance(customers, dict):
                        customers = [customers]
                    elif not isinstance(customers, list):
                        customers = []

                    found_ids = set()
                    for customer in customers:
                        if (
                            not isinstance(customer, dict)
                            or not customer.get("id")
                        ):
                            continue
                        customer_id = int(customer["id"])
                        firstname = self._clean_name(
                            customer.get("firstname")
                        )
                        lastname = self._clean_name(
                            customer.get("lastname")
                        )
                        customer_cache[customer_id] = (
                            f"{firstname} {lastname}".strip() or None
                        )
                        found_ids.add(customer_id)

                    for customer_id in chunk:
                        if customer_id not in found_ids:
                            customer_cache[customer_id] = None
                else:
                    for customer_id in chunk:
                        customer_cache[customer_id] = None
            except Exception as error:
                logger.warning(
                    "Errore nel recupero batch dei clienti %s: %s",
                    chunk,
                    error,
                )
                for customer_id in chunk:
                    customer_cache[customer_id] = None

            fetched_so_far += len(chunk)
            if progress_callback:
                progress_callback(
                    "fetching_customers",
                    fetched_so_far,
                    total_customers,
                )
