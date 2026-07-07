import requests
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import time

logger = logging.getLogger(__name__)

class PrestaShopClient:
    def __init__(self, url: str, api_key: str, mock_mode: bool = True):
        self.url = url.rstrip('/') + '/' if url else ""
        self.api_key = api_key
        self.mock_mode = mock_mode or not self.url or not self.api_key

        if self.mock_mode:
            logger.info("PrestaShopClient inizializzato in MOCK MODE (dati di test simulati).")
        else:
            logger.info(f"PrestaShopClient inizializzato con URL: {self.url}")

    def _make_request(self, url: str, params: dict, timeout: int = 30) -> requests.Response:
        max_retries = 3
        backoff = 1.0
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, timeout=timeout)
                return response
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt == max_retries - 1:
                    logger.error(f"Errore di rete definitivo per {url} dopo {max_retries} tentativi: {e}")
                    raise e
                logger.warning(f"Tentativo {attempt + 1} fallito per {url} ({e}). Riprovo tra {backoff}s...")
                time.sleep(backoff)
                backoff *= 2

    def get_order_states(self) -> List[Dict[str, Any]]:
        """
        Fetches the order states from PrestaShop.
        In mock mode, returns a list of standard states including 'magazzino rosate' (ID 12).
        """
        if self.mock_mode:
            return [
                {"id": 1, "name": "In attesa di pagamento"},
                {"id": 2, "name": "Pagamento accettato"},
                {"id": 3, "name": "In preparazione"},
                {"id": 4, "name": "Spedito"},
                {"id": 5, "name": "Consegnato"},
                {"id": 12, "name": "magazzino rosate"},
                {"id": 13, "name": "Annullato"},
                {"id": 14, "name": "Rimborsato"}
            ]

        try:
            # Query order_states resource
            states_url = f"{self.url}order_states"
            params = {
                "display": "[id,name]",
                "output_format": "JSON",
                "ws_key": self.api_key
            }
            response = self._make_request(states_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            # PrestaShop returns data as: {"order_states": [{"id": ..., "name": ...}]}
            # Note: "name" can be a list of localized names or a single string.
            states = []
            raw_states = data.get("order_states", [])
            for s in raw_states:
                state_id = int(s.get("id"))
                name_val = s.get("name", "")
                
                # If name is localized, it might be a list: [{"id": "1", "value": "Name"}, ...]
                name = ""
                if isinstance(name_val, list):
                    name = next((item.get("value") for item in name_val if item.get("id") == "1"), "")
                    if not name and name_val:
                        name = name_val[0].get("value", "")
                elif isinstance(name_val, dict):
                    name = name_val.get("value", "")
                else:
                    name = str(name_val)
                
                states.append({"id": state_id, "name": name})
            return states
            
        except Exception as e:
            logger.error(f"Errore nel recupero degli stati ordine da PrestaShop: {str(e)}")
            # Fallback to a basic list if real request fails to prevent crash
            return [
                {"id": 12, "name": "magazzino rosate (Fallback)"}
            ]

    def _clean_name_field(self, val) -> str:
        """
        Cleans and extracts localized or multi-lingual name values from PrestaShop fields.
        """
        if not val:
            return ""
        if isinstance(val, str):
            return val.strip()
        if isinstance(val, list):
            if val and isinstance(val[0], dict):
                for item in val:
                    if item.get("id") == "1":
                        return str(item.get("value") or "").strip()
                return str(val[0].get("value") or "").strip()
            if val:
                return str(val[0]).strip()
            return ""
        if isinstance(val, dict):
            if "value" in val:
                return str(val["value"] or "").strip()
            if "language" in val:
                lang_val = val["language"]
                if isinstance(lang_val, list) and lang_val:
                    for item in lang_val:
                        if isinstance(item, dict) and item.get("id") == "1":
                            return str(item.get("value") or "").strip()
                    if isinstance(lang_val[0], dict):
                        return str(lang_val[0].get("value") or "").strip()
                return str(lang_val).strip()
            for k in ["1", 1]:
                if k in val:
                    return str(val[k] or "").strip()
            if val:
                first_key = list(val.keys())[0]
                return str(val[first_key] or "").strip()
        return str(val).strip()

    def _get_customer_name(self, order_data: Dict[str, Any], customer_cache: Dict[int, str]) -> Optional[str]:
        """
        Extracts customer name from order data.
        First tries customer_firstname/customer_lastname fields directly in the order.
        Falls back to calling /api/customers/{id_customer} if those fields are empty.
        Results are cached in customer_cache to avoid duplicate API calls.
        """
        # Try direct fields first (some PS versions include them in display=full)
        firstname = self._clean_name_field(order_data.get("customer_firstname"))
        lastname = self._clean_name_field(order_data.get("customer_lastname"))
        if firstname or lastname:
            return f"{firstname} {lastname}".strip() or None

        # Fallback: call /api/customers/{id_customer}
        id_customer = order_data.get("id_customer")
        if not id_customer:
            return None

        try:
            id_customer = int(id_customer)
        except (ValueError, TypeError):
            return None

        if id_customer in customer_cache:
            return customer_cache[id_customer]

        try:
            customer_url = f"{self.url}customers/{id_customer}"
            params = {
                "display": "[firstname,lastname]",
                "output_format": "JSON",
                "ws_key": self.api_key
            }
            resp = requests.get(customer_url, params=params, timeout=8)
            if resp.status_code == 200:
                res_json = resp.json()
                cdata = {}
                if isinstance(res_json, dict):
                    cdata = res_json.get("customer", {})
                elif isinstance(res_json, list) and res_json:
                    cdata = res_json[0]

                if isinstance(cdata, dict):
                    fn = self._clean_name_field(cdata.get("firstname"))
                    ln = self._clean_name_field(cdata.get("lastname"))
                    name = f"{fn} {ln}".strip() or None
                    customer_cache[id_customer] = name
                    return name
        except Exception as e:
            logger.warning(f"Impossibile recuperare il nome del cliente {id_customer}: {e}")

        customer_cache[id_customer] = None
        return None

    def _fetch_customer_names_batch(self, customer_ids: List[int], customer_cache: Dict[int, Optional[str]], progress_callback = None):
        """
        Fetches customer names in batches of 50 to minimize requests.
        """
        if not customer_ids:
            return

        chunk_size = 50
        total_customers = len(customer_ids)
        fetched_so_far = 0

        for i in range(0, len(customer_ids), chunk_size):
            chunk = customer_ids[i:i+chunk_size]
            ids_filter = "|".join(str(cid) for cid in chunk)
            try:
                if progress_callback:
                    progress_callback("fetching_customers", fetched_so_far, total_customers)

                customer_url = f"{self.url}customers"
                params = {
                    "display": "[id,firstname,lastname]",
                    "filter[id]": f"[{ids_filter}]",
                    "output_format": "JSON",
                    "ws_key": self.api_key
                }
                resp = self._make_request(customer_url, params=params, timeout=15)
                if resp.status_code == 200:
                    cdata_list = []
                    res_json = resp.json()
                    if isinstance(res_json, dict):
                        cdata_list = res_json.get("customers", [])
                    elif isinstance(res_json, list):
                        cdata_list = res_json

                    if isinstance(cdata_list, dict):
                        cdata_list = [cdata_list]
                    elif not isinstance(cdata_list, list):
                        cdata_list = []

                    found_ids = set()
                    for cdata in cdata_list:
                        if isinstance(cdata, dict):
                            cid_str = cdata.get("id")
                            if cid_str:
                                cid = int(cid_str)
                                fn = self._clean_name_field(cdata.get("firstname"))
                                ln = self._clean_name_field(cdata.get("lastname"))
                                name = f"{fn} {ln}".strip() or None
                                customer_cache[cid] = name
                                found_ids.add(cid)

                    for cid in chunk:
                        if cid not in found_ids:
                            customer_cache[cid] = None
                else:
                    for cid in chunk:
                        customer_cache[cid] = None
            except Exception as e:
                logger.warning(f"Errore nel recupero batch dei clienti {chunk}: {e}")
                for cid in chunk:
                    customer_cache[cid] = None

            fetched_so_far += len(chunk)
            if progress_callback:
                progress_callback("fetching_customers", fetched_so_far, total_customers)

    def get_order_ids_and_update_times(self, state_ids: List[int], valid_product_ids: List[int] = None) -> List[Dict[str, Any]]:
        """
        Fetches only order IDs and their date_upd from PrestaShop for fast change detection.
        In mock mode, returns the mock order IDs and fixed/generated dates.
        """
        if self.mock_mode:
            mock_orders = self._generate_mock_orders(state_ids, valid_product_ids or [609286, 609287, 605652])
            return [{"id": o["order_id"], "date_upd": o["date_upd"].strftime("%Y-%m-%d %H:%M:%S")} for o in mock_orders]

        if not state_ids:
            return []

        try:
            states_filter = "|".join(str(sid) for sid in state_ids)
            orders_url = f"{self.url}orders"
            params = {
                "display": "[id,date_upd]",
                "output_format": "JSON",
                "filter[current_state]": f"[{states_filter}]",
                "ws_key": self.api_key
            }
            response = self._make_request(orders_url, params=params, timeout=30)
            if response.status_code == 404:
                return []
            response.raise_for_status()
            data = response.json()
            raw_orders = data.get("orders", [])

            if isinstance(raw_orders, dict):
                raw_orders = [raw_orders]
            elif not isinstance(raw_orders, list):
                raw_orders = []

            results = []
            for item in raw_orders:
                if isinstance(item, dict) and "id" in item:
                    try:
                        oid = int(item["id"])
                        date_upd = item.get("date_upd", "")
                        results.append({"id": oid, "date_upd": date_upd})
                    except (ValueError, TypeError):
                        pass
            return results
        except Exception as e:
            logger.error(f"Errore nel recupero leggero degli ordini da PrestaShop: {str(e)}")
            raise e

    def get_orders(self, state_ids: List[int], valid_product_ids: List[int] = None, progress_callback = None) -> List[Dict[str, Any]]:
        """
        Fetches orders filter by state_ids.
        In mock mode, generates realistic orders referencing valid_product_ids.
        """

        if self.mock_mode:
            return self._generate_mock_orders(state_ids, valid_product_ids or [609286, 609287, 605652])

        if not state_ids:
            return []

        orders_list = []
        customer_cache: Dict[int, Optional[str]] = {}  # Cache to avoid duplicate /customers API calls
        try:
            states_filter = "|".join(str(sid) for sid in state_ids)
            orders_url = f"{self.url}orders"

            # 1. Fetch all order IDs matching state filters to know total count
            params_ids = {
                "display": "[id]",
                "output_format": "JSON",
                "filter[current_state]": f"[{states_filter}]",
                "ws_key": self.api_key
            }
            response = self._make_request(orders_url, params=params_ids, timeout=30)
            if response.status_code == 404:
                return []
            response.raise_for_status()
            data_ids = response.json()
            raw_ids_list = data_ids.get("orders", [])

            if isinstance(raw_ids_list, dict):
                raw_ids_list = [raw_ids_list]
            elif not isinstance(raw_ids_list, list):
                raw_ids_list = []

            order_ids = []
            for item in raw_ids_list:
                if isinstance(item, dict) and "id" in item:
                    try:
                        order_ids.append(int(item["id"]))
                    except (ValueError, TypeError):
                        pass

            order_ids.sort()
            total_orders = len(order_ids)

            if total_orders == 0:
                return []

            # 2. Fetch full orders details in chunks of 50 by ID
            limit = 50
            for i in range(0, total_orders, limit):
                chunk = order_ids[i:i+limit]
                ids_filter = "|".join(str(oid) for oid in chunk)

                if progress_callback:
                    progress_callback("fetching_orders", i, total_orders)

                params = {
                    "display": "full",
                    "output_format": "JSON",
                    "filter[id]": f"[{ids_filter}]",
                    "ws_key": self.api_key
                }

                response = self._make_request(orders_url, params=params, timeout=30)
                if response.status_code == 404:
                    continue
                response.raise_for_status()
                data = response.json()
                raw_orders = data.get("orders", [])

                if isinstance(raw_orders, dict):
                    raw_orders = [raw_orders]
                elif not isinstance(raw_orders, list):
                    raw_orders = []

                # Gather customer IDs to fetch in batch
                cust_ids_to_fetch = []
                for order_data in raw_orders:
                    if isinstance(order_data, dict):
                        firstname = self._clean_name_field(order_data.get("customer_firstname"))
                        lastname = self._clean_name_field(order_data.get("customer_lastname"))
                        if not (firstname or lastname):
                            id_customer = order_data.get("id_customer")
                            if id_customer:
                                try:
                                    id_customer = int(id_customer)
                                    if id_customer not in customer_cache:
                                        cust_ids_to_fetch.append(id_customer)
                                except (ValueError, TypeError):
                                    pass

                # Batch fetch customer names (pass progress_callback = None so it doesn't emit fetching_customers)
                if cust_ids_to_fetch:
                    self._fetch_customer_names_batch(cust_ids_to_fetch, customer_cache, None)

                for order_data in raw_orders:
                    if not isinstance(order_data, dict):
                        continue
                    order_id = int(order_data.get("id"))
                    current_state = int(order_data.get("current_state"))

                    date_add_str = order_data.get("date_add")
                    date_upd_str = order_data.get("date_upd")

                    # Parse dates
                    date_add = None
                    date_upd = None
                    try:
                        if date_add_str:
                            date_add = datetime.strptime(date_add_str, "%Y-%m-%d %H:%M:%S")
                        if date_upd_str:
                            date_upd = datetime.strptime(date_upd_str, "%Y-%m-%d %H:%M:%S")
                    except Exception:
                        pass

                    # Rows parser
                    assoc = order_data.get("associations", {})
                    order_rows_raw = []
                    if isinstance(assoc, dict):
                        order_rows_raw = assoc.get("order_rows", [])
                    if isinstance(order_rows_raw, dict):
                        order_rows_raw = [order_rows_raw]
                    elif not isinstance(order_rows_raw, list):
                        order_rows_raw = []

                    order_lines = []
                    for line in order_rows_raw:
                        if not isinstance(line, dict):
                            continue
                        product_id = int(line.get("product_id"))
                        qty = int(line.get("product_quantity", 1))
                        line_id = int(line.get("id")) if line.get("id") else None
                        prod_attr_id = int(line.get("product_attribute_id", 0)) if line.get("product_attribute_id") else 0
                        ref = line.get("product_reference", "")

                        order_lines.append({
                            "line_id": line_id,
                            "product_id": product_id,
                            "product_attribute_id": prod_attr_id,
                            "product_reference": ref,
                            "product_quantity": qty
                        })

                    # Extract customer name (now cached in batch) and total
                    customer_name = self._get_customer_name(order_data, customer_cache)
                    try:
                        total_paid = float(order_data.get("total_paid_tax_incl") or 0)
                    except (ValueError, TypeError):
                        total_paid = None

                    orders_list.append({
                        "order_id": order_id,
                        "current_state": current_state,
                        "date_add": date_add,
                        "date_upd": date_upd,
                        "customer_name": customer_name,
                        "total_paid": total_paid,
                        "lines": order_lines
                    })

                # Sleep 200ms between chunks to prevent overloading the PrestaShop API
                time.sleep(0.2)

            if progress_callback:
                progress_callback("fetching_orders", total_orders, total_orders)

            return orders_list

        except Exception as e:
            logger.error(f"Errore nel recupero degli ordini da PrestaShop: {str(e)}")
            raise e

    def _generate_mock_orders(self, state_ids: List[int], valid_product_ids: List[int]) -> List[Dict[str, Any]]:
        """
        Generates dummy orders for testing.
        """
        orders = []
        random.seed(42) # Deterministic mock orders for reproducibility
        
        # Determine labels mapping
        states_dict = {s["id"]: s["name"] for s in self.get_order_states()}
        
        # Mock customer names and prices for realistic data
        mock_customers = [
            "Mario Rossi", "Giulia Bianchi", "Luca Verdi", "Anna Ferrari",
            "Paolo Esposito", "Chiara Romano", "Marco Colombo", "Sofia Ricci"
        ]
        mock_prices = [12.50, 24.90, 34.00, 18.75, 45.00, 9.99, 29.50, 55.00]
        
        # Let's create 8 orders
        num_orders = 8
        start_date = datetime(2026, 7, 1)
        
        for i in range(num_orders):
            order_id = 1000 + i
            # Assign states. Mostly put them in state 12 (magazzino rosate) if 12 is selected
            # Otherwise random from selected state_ids or general list
            if 12 in state_ids:
                # 70% chance to be in state 12, otherwise other state
                current_state = 12 if random.random() < 0.7 else random.choice(state_ids)
            else:
                current_state = random.choice(state_ids) if state_ids else 12
                
            date_add = start_date + timedelta(days=random.random() * 5, hours=random.random() * 24)
            date_add = date_add.replace(microsecond=0)
            date_upd = date_add + timedelta(minutes=random.random() * 120)
            date_upd = date_upd.replace(microsecond=0)
            
            # Generate lines (1 to 3 items per order)
            num_lines = random.randint(1, 3)
            order_lines = []
            selected_products = random.sample(valid_product_ids, min(num_lines, len(valid_product_ids)))
            
            for idx, prod_id in enumerate(selected_products):
                qty = random.choice([1, 1, 1, 2, 3]) # Bias towards 1
                order_lines.append({
                    "line_id": idx + 1,
                    "product_id": prod_id,
                    "product_attribute_id": 0,
                    "product_reference": f"REF-{prod_id}",
                    "product_quantity": qty
                })
                
            orders.append({
                "order_id": order_id,
                "current_state": current_state,
                "date_add": date_add,
                "date_upd": date_upd,
                "customer_name": mock_customers[i % len(mock_customers)],
                "total_paid": mock_prices[i % len(mock_prices)],
                "lines": order_lines
            })
            
        return orders

    def get_product_reference(self, product_id: int) -> Optional[str]:
        """
        Fetches the product reference (SKU) for a given product ID from PrestaShop.
        In mock mode, returns a mock SKU.
        """
        if self.mock_mode:
            return f"REF-{product_id}"
            
        try:
            prod_url = f"{self.url}products/{product_id}"
            params = {
                "display": "[reference]",
                "output_format": "JSON",
                "ws_key": self.api_key
            }
            response = self._make_request(prod_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            # PrestaShop returns data as: {"product": {"reference": "..."}}
            prod = data.get("product", {})
            if isinstance(prod, dict):
                return str(prod.get("reference", "")).strip()
            elif isinstance(prod, list) and prod:
                return str(prod[0].get("reference", "")).strip()
            return None
        except Exception as e:
            logger.error(f"Errore nel recupero della reference per il prodotto {product_id} da PrestaShop: {str(e)}")
            return None

