import random
from datetime import datetime, timedelta, timezone
from typing import Any


MOCK_ORDER_STATES = (
    {"id": 1, "name": "In attesa di pagamento"},
    {"id": 2, "name": "Pagamento accettato"},
    {"id": 3, "name": "In preparazione"},
    {"id": 4, "name": "Spedito"},
    {"id": 5, "name": "Consegnato"},
    {"id": 12, "name": "magazzino rosate"},
    {"id": 13, "name": "Annullato"},
    {"id": 14, "name": "Rimborsato"},
)

DEFAULT_PRODUCT_IDS = (609286, 609287, 605652)


class PrestaShopMockData:
    def get_order_states(self) -> list[dict[str, Any]]:
        return [dict(state) for state in MOCK_ORDER_STATES]

    def generate_orders(
        self,
        state_ids: list[int],
        valid_product_ids: list[int] | None = None,
    ) -> list[dict[str, Any]]:
        product_ids = valid_product_ids or list(DEFAULT_PRODUCT_IDS)
        generator = random.Random(42)
        customers = (
            "Mario Rossi",
            "Giulia Bianchi",
            "Luca Verdi",
            "Anna Ferrari",
            "Paolo Esposito",
            "Chiara Romano",
            "Marco Colombo",
            "Sofia Ricci",
        )
        prices = (12.50, 24.90, 34.00, 18.75, 45.00, 9.99, 29.50, 55.00)
        start_date = datetime(2026, 7, 1)
        orders = []

        for index in range(8):
            order_id = 1000 + index
            if 12 in state_ids:
                current_state = (
                    12
                    if generator.random() < 0.7
                    else generator.choice(state_ids)
                )
            else:
                current_state = (
                    generator.choice(state_ids)
                    if state_ids
                    else 12
                )

            date_add = start_date + timedelta(
                days=generator.random() * 5,
                hours=generator.random() * 24,
            )
            date_add = date_add.replace(microsecond=0)
            date_upd = date_add + timedelta(
                minutes=generator.random() * 120
            )
            date_upd = date_upd.replace(microsecond=0)

            line_count = generator.randint(1, 3)
            selected_products = generator.sample(
                product_ids,
                min(line_count, len(product_ids)),
            )
            lines = [
                {
                    "line_id": line_index + 1,
                    "product_id": product_id,
                    "product_attribute_id": 0,
                    "product_reference": f"REF-{product_id}",
                    "product_name": f"Prodotto demo {product_id}",
                    "product_quantity": generator.choice([1, 1, 1, 2, 3]),
                }
                for line_index, product_id in enumerate(selected_products)
            ]

            orders.append(
                {
                    "order_id": order_id,
                    "current_state": current_state,
                    "date_add": date_add,
                    "date_upd": date_upd,
                    "customer_name": customers[index % len(customers)],
                    "total_paid": prices[index % len(prices)],
                    "lines": lines,
                }
            )

        return orders

    def get_product_reference(self, product_id: int) -> str:
        return f"REF-{product_id}"

    def generate_orders_by_ids(
        self,
        order_ids: list[int],
        state_ids: list[int],
        valid_product_ids: list[int],
    ) -> list[dict[str, Any]]:
        generator = random.Random(42)
        customers = (
            "Mario Rossi",
            "Giulia Bianchi",
            "Luca Verdi",
            "Anna Ferrari",
            "Paolo Esposito",
        )
        prices = (12.50, 24.90, 34.00, 18.75, 45.00)
        now = (
            datetime.now(timezone.utc)
            .replace(tzinfo=None, microsecond=0)
        )
        orders = []

        for index, order_id in enumerate(order_ids):
            state_id = (
                generator.choice(state_ids)
                if state_ids
                else 12
            )
            line_count = generator.randint(1, 3)
            selected_products = generator.sample(
                valid_product_ids,
                min(line_count, len(valid_product_ids)),
            )
            lines = [
                {
                    "line_id": line_index + 1,
                    "product_id": product_id,
                    "product_attribute_id": 0,
                    "product_reference": f"REF-{product_id}",
                    "product_name": f"Prodotto demo {product_id}",
                    "product_quantity": generator.choice([1, 1, 2]),
                }
                for line_index, product_id in enumerate(selected_products)
            ]
            orders.append(
                {
                    "order_id": order_id,
                    "current_state": state_id,
                    "date_add": now,
                    "date_upd": now,
                    "customer_name": customers[index % len(customers)],
                    "total_paid": prices[index % len(prices)],
                    "lines": lines,
                }
            )

        return orders

    def get_products_details(
        self,
        product_ids: list[int],
    ) -> dict[int, dict[str, str]]:
        return {
            product_id: {
                "product_name": f"Prodotto demo {product_id}",
                "product_reference": f"REF-{product_id}",
            }
            for product_id in product_ids
        }
