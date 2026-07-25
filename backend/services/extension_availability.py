from datetime import datetime, timezone

from backend.services.extension_availability_freshness import (
    load_freshness,
    utc_iso,
)
from backend.services.extension_availability_orders import (
    add_out_of_scope_orders,
    serialize_simulation_orders,
    summarize_orders,
)
from backend.services.extension_availability_request import (
    ExtensionAvailabilityError,
    build_simulation_payload,
    minimum_residual,
    normalize_order_ids,
)


def build_orders_availability(
    db,
    payload,
    *,
    token_required: bool,
    simulation_runner,
    now_factory=lambda: datetime.now(timezone.utc),
) -> dict:
    requested_ids = normalize_order_ids(
        payload.get("visible_order_ids", [])
    )
    if not requested_ids:
        return _empty_response(token_required, now_factory())

    min_sku_residual = minimum_residual(payload)
    chronological_mode = payload.get("chronological_mode", True) is not False
    simulation = simulation_runner(
        build_simulation_payload(
            chronological_mode=chronological_mode,
            min_sku_residual=min_sku_residual,
        ),
        db,
    )
    response_orders = serialize_simulation_orders(
        simulation,
        requested_ids,
        chronological_mode,
    )
    add_out_of_scope_orders(db, requested_ids, response_orders)

    return {
        "calculated_at": now_factory().isoformat(),
        "policy": {
            "evaluation_mode": (
                "chronological" if chronological_mode else "availability"
            ),
            "selection_strategy": (
                "chronological"
                if chronological_mode
                else "independent_availability"
            ),
            "skip_unpreparable": True,
            "min_sku_residual": min_sku_residual,
        },
        "freshness": load_freshness(db),
        "orders": response_orders,
        "summary": summarize_orders(
            response_orders,
            requested_ids,
            simulation,
        ),
        "token_required": token_required,
    }


def _empty_response(token_required, calculated_at):
    return {
        "calculated_at": calculated_at.isoformat(),
        "orders": {},
        "summary": {
            "requested_count": 0,
            "queue_count": 0,
            "preparable_count": 0,
            "blocked_count": 0,
        },
        "token_required": token_required,
    }


# Compatibility aliases for callers that imported the previous private helpers.
_normalize_order_ids = normalize_order_ids
_minimum_residual = minimum_residual
_serialize_simulation_orders = serialize_simulation_orders
_add_out_of_scope_orders = add_out_of_scope_orders
_load_freshness = load_freshness
