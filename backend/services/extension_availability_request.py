class ExtensionAvailabilityError(Exception):
    """Raised when an extension availability request is invalid."""


def normalize_order_ids(raw_order_ids):
    order_ids = []
    seen = set()
    for raw_order_id in raw_order_ids:
        try:
            order_id = int(raw_order_id)
        except (TypeError, ValueError):
            continue
        if order_id <= 0 or order_id in seen:
            continue
        order_ids.append(order_id)
        seen.add(order_id)
        if len(order_ids) >= 1000:
            break
    return order_ids


def minimum_residual(payload):
    try:
        value = float(payload.get("min_sku_residual", 0) or 0)
    except (TypeError, ValueError) as error:
        raise ExtensionAvailabilityError(
            "La scorta minima deve essere un numero valido."
        ) from error
    if value < 0:
        raise ExtensionAvailabilityError(
            "La scorta minima non può essere negativa."
        )
    return value


def build_simulation_payload(*, chronological_mode, min_sku_residual):
    return {
        "limit": 5000,
        "strict_chronology": False,
        "selection_strategy": "chronological",
        "independent_availability": not chronological_mode,
        "min_sku_residual": min_sku_residual,
        "sku_filter": [],
    }
