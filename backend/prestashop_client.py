import logging
from typing import List, Dict, Any, Optional

from backend.prestashop_customers import PrestaShopCustomerResource
from backend.prestashop_mock import PrestaShopMockData
from backend.prestashop_order_states import PrestaShopOrderStateResource
from backend.prestashop_orders import PrestaShopOrderResource
from backend.prestashop_parsing import clean_localized_name
from backend.prestashop_products import PrestaShopProductResource
from backend.prestashop_transport import PrestaShopTransport

logger = logging.getLogger(__name__)

class PrestaShopClient:
    def __init__(
        self,
        url: str,
        api_key: str,
        mock_mode: bool = True,
        transport: Optional[PrestaShopTransport] = None,
        mock_data: Optional[PrestaShopMockData] = None,
        product_resource: Optional[PrestaShopProductResource] = None,
        customer_resource: Optional[PrestaShopCustomerResource] = None,
        order_resource: Optional[PrestaShopOrderResource] = None,
        state_resource: Optional[PrestaShopOrderStateResource] = None,
    ):
        self.url = url.rstrip('/') + '/' if url else ""
        self.api_key = api_key
        self.mock_mode = mock_mode or not self.url or not self.api_key
        self.transport = transport or PrestaShopTransport()
        self.mock_data = mock_data or PrestaShopMockData()
        self.product_resource = (
            product_resource
            or PrestaShopProductResource(
                self.url,
                self.api_key,
                self._make_request,
                self._clean_name_field,
            )
        )
        self.customer_resource = (
            customer_resource
            or PrestaShopCustomerResource(
                self.url,
                self.api_key,
                self._make_request,
                self._clean_name_field,
            )
        )
        self.order_resource = (
            order_resource
            or PrestaShopOrderResource(
                self.url,
                self.api_key,
                self._make_request,
                self._clean_name_field,
                self.customer_resource,
            )
        )
        self.state_resource = (
            state_resource
            or PrestaShopOrderStateResource(
                self.url,
                self.api_key,
                self._make_request,
            )
        )

        if self.mock_mode:
            logger.info("PrestaShopClient inizializzato in MOCK MODE (dati di test simulati).")
        else:
            logger.info(f"PrestaShopClient inizializzato con URL: {self.url}")

    def _make_request(self, url: str, params: dict, timeout: int = 30):
        return self.transport.get(
            url,
            params=params,
            timeout=timeout,
        )

    def get_order_states(self) -> List[Dict[str, Any]]:
        """
        Fetches the order states from PrestaShop.
        In mock mode, returns a list of standard states including 'magazzino rosate' (ID 12).
        """
        if self.mock_mode:
            return self.mock_data.get_order_states()

        return self.state_resource.get_all()

    def _clean_name_field(self, val) -> str:
        return clean_localized_name(val)

    def _get_customer_name(self, order_data: Dict[str, Any], customer_cache: Dict[int, str]) -> Optional[str]:
        return self.customer_resource.get_name(
            order_data,
            customer_cache,
        )

    def _fetch_customer_names_batch(self, customer_ids: List[int], customer_cache: Dict[int, Optional[str]], progress_callback = None):
        return self.customer_resource.fetch_names_batch(
            customer_ids,
            customer_cache,
            progress_callback,
        )

    def get_order_ids_and_update_times(self, state_ids: List[int], valid_product_ids: List[int] = None) -> List[Dict[str, Any]]:
        """
        Fetches only order IDs and their date_upd from PrestaShop for fast change detection.
        In mock mode, returns the mock order IDs and fixed/generated dates.
        """
        if self.mock_mode:
            mock_orders = self.mock_data.generate_orders(
                state_ids,
                valid_product_ids,
            )
            return [
                {
                    "id": order["order_id"],
                    "date_upd": order["date_upd"].strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
                for order in mock_orders
            ]

        return self.order_resource.get_ids_and_update_times(state_ids)

    def get_orders(self, state_ids: List[int], valid_product_ids: List[int] = None, progress_callback = None) -> List[Dict[str, Any]]:
        """
        Fetches orders filter by state_ids.
        In mock mode, generates realistic orders referencing valid_product_ids.
        """
        if self.mock_mode:
            return self.mock_data.generate_orders(
                state_ids,
                valid_product_ids,
            )

        return self.order_resource.get_orders(
            state_ids,
            progress_callback,
        )

    def get_orders_by_ids(
        self,
        order_ids: List[int],
        state_ids: List[int],
        valid_product_ids: List[int],
    ) -> List[Dict[str, Any]]:
        if self.mock_mode:
            return self.mock_data.generate_orders_by_ids(
                order_ids,
                state_ids,
                valid_product_ids,
            )
        return self.order_resource.get_orders_by_ids(order_ids)

    def get_product_reference(self, product_id: int) -> Optional[str]:
        """
        Fetches the product reference (SKU) for a given product ID from PrestaShop.
        In mock mode, returns a mock SKU.
        """
        if self.mock_mode:
            return self.mock_data.get_product_reference(product_id)

        return self.product_resource.get_reference(product_id)

    def get_products_details(self, product_ids: List[int]) -> Dict[int, Dict[str, str]]:
        """Recupera nome e riferimento di più prodotti con richieste batch."""
        normalized_ids = sorted({int(product_id) for product_id in product_ids if int(product_id) > 0})
        if not normalized_ids:
            return {}

        if self.mock_mode:
            return self.mock_data.get_products_details(normalized_ids)

        return self.product_resource.get_details(normalized_ids)
