import json

from sqlalchemy import asc

from backend.models import (
    AppSetting,
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
    WarehouseStock,
)
from backend.services.auto_picking import simulate_auto_picking


class AutoPickingRequestError(Exception):
    """Raised when automatic picking parameters are invalid."""


def run_auto_picking(
    payload: dict,
    db,
    *,
    simulator=simulate_auto_picking,
):
    parameters = _parse_parameters(payload)
    (
        components_map,
        stock_map,
        stock_order,
    ) = _load_inventory(db)
    orders, lines_by_order = _load_orders(db)

    return simulator(
        orders=orders,
        lines_by_order=lines_by_order,
        components_map=components_map,
        stock_map=stock_map,
        stock_order=stock_order,
        **parameters,
    )


def _parse_parameters(payload):
    try:
        limit = int(payload.get("limit", 20))
    except (TypeError, ValueError) as error:
        raise AutoPickingRequestError(
            "Il numero ordini deve essere un intero valido."
        ) from error
    if limit < 1 or limit > 5000:
        raise AutoPickingRequestError(
            "Il numero ordini deve essere compreso tra 1 e 5000."
        )

    selection_strategy = str(
        payload.get("selection_strategy", "chronological")
    ).strip().lower()
    if selection_strategy not in (
        "chronological",
        "maximize_orders",
    ):
        raise AutoPickingRequestError(
            "Strategia lista automatica non valida."
        )

    try:
        min_sku_residual = float(
            payload.get("min_sku_residual", 0) or 0
        )
    except (TypeError, ValueError) as error:
        raise AutoPickingRequestError(
            "La scorta minima SKU deve essere un numero valido."
        ) from error
    if min_sku_residual < 0:
        raise AutoPickingRequestError(
            "La scorta minima SKU non può essere negativa."
        )

    sku_filter = _sku_set(
        payload.get("sku_filter", []),
        invalid_fallback=True,
    )
    excluded_skus = _excluded_skus(
        payload.get("excluded_skus", [])
    )
    sku_limits = _sku_limits(
        payload.get("sku_limits", {})
    )
    sku_filter.update(sku_limits)

    return {
        "limit": limit,
        "strict_chronology": bool(
            payload.get("strict_chronology", False)
        ),
        "independent_availability": bool(
            payload.get("independent_availability", False)
        ),
        "selection_strategy": selection_strategy,
        "min_sku_residual": min_sku_residual,
        "sku_filter": sku_filter,
        "sku_limits": sku_limits,
        "excluded_skus": excluded_skus,
    }


def _sku_set(raw_value, *, invalid_fallback=False):
    if isinstance(raw_value, str):
        raw_value = [
            sku.strip()
            for sku in raw_value.split(",")
        ]
    if not isinstance(raw_value, list):
        if invalid_fallback:
            return set()
        raise AutoPickingRequestError(
            "Le SKU da escludere devono essere una lista valida."
        )
    return {
        str(sku).strip().upper()
        for sku in raw_value
        if str(sku).strip()
    }


def _excluded_skus(raw_value):
    excluded_skus = _sku_set(raw_value)
    if len(excluded_skus) > 500:
        raise AutoPickingRequestError(
            "Puoi configurare al massimo 500 SKU da escludere."
        )
    return excluded_skus


def _sku_limits(raw_value):
    if not isinstance(raw_value, dict):
        raise AutoPickingRequestError(
            "I limiti quantità per SKU devono essere "
            "una mappa valida."
        )

    limits = {}
    for raw_sku, raw_limit in raw_value.items():
        sku = str(raw_sku).strip().upper()
        if not sku:
            continue
        try:
            limit = float(raw_limit)
        except (TypeError, ValueError) as error:
            raise AutoPickingRequestError(
                f"Il massimo per ordine della SKU {raw_sku} "
                "deve essere un numero valido."
            ) from error
        if limit <= 0 or not limit.is_integer():
            raise AutoPickingRequestError(
                f"Il massimo per ordine della SKU {raw_sku} "
                "deve essere un numero intero superiore a 0."
            )
        limits[sku] = int(limit)
    return limits


def _load_inventory(db):
    batches = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type.in_(
                ("associations", "warehouse")
            ),
            ImportBatch.is_active.is_(True),
        )
        .order_by(ImportBatch.id)
        .all()
    )
    batch_map = {}
    for batch in batches:
        batch_map.setdefault(batch.file_type, batch)

    components_map = {}
    associations = batch_map.get("associations")
    if associations:
        components = (
            db.query(ProductComponent)
            .filter(
                ProductComponent.import_batch_id
                == associations.id
            )
            .order_by(ProductComponent.id)
            .all()
        )
        for component in components:
            components_map.setdefault(
                component.product_id,
                [],
            ).append(
                (component.sku, component.qty_required)
            )

    stock_map = {}
    stock_order = {}
    warehouse = batch_map.get("warehouse")
    if warehouse:
        stock_items = (
            db.query(WarehouseStock)
            .filter(
                WarehouseStock.import_batch_id == warehouse.id
            )
            .order_by(WarehouseStock.id)
            .all()
        )
        for item in stock_items:
            sku = item.sku.strip()
            if not sku or sku.startswith("__spacer_"):
                continue
            if sku not in stock_map:
                stock_order[sku] = len(stock_order)
                stock_map[sku] = {
                    "description": item.description or "",
                    "qty_total": 0.0,
                }
            stock_map[sku]["qty_total"] += item.qty_total

    return components_map, stock_map, stock_order


def _load_orders(db):
    state_setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "included_state_ids")
        .first()
    )
    try:
        included_states = (
            json.loads(state_setting.value)
            if state_setting
            else [12]
        )
    except Exception:
        included_states = [12]

    orders_query = db.query(PrestashopOrder)
    if included_states:
        orders_query = orders_query.filter(
            PrestashopOrder.current_state.in_(included_states)
        )
    else:
        orders_query = orders_query.filter(False)

    orders = (
        orders_query
        .order_by(
            asc(PrestashopOrder.date_add),
            asc(PrestashopOrder.order_id),
        )
        .all()
    )
    order_ids = [
        order.order_id
        for order in orders
    ]
    lines_by_order = {}
    if order_ids:
        lines = (
            db.query(PrestashopOrderLine)
            .filter(
                PrestashopOrderLine.order_id.in_(order_ids)
            )
            .order_by(PrestashopOrderLine.id)
            .all()
        )
        for line in lines:
            lines_by_order.setdefault(
                line.order_id,
                [],
            ).append(line)

    return orders, lines_by_order
