IGNORED_PICKING_SKUS = frozenset({
    "ASSICURAZIONE-SPEDIZIONE",
})


def normalize_picking_sku(value) -> str:
    return str(value or "").strip().strip("*").strip().upper()


def is_ignored_picking_sku(value) -> bool:
    return normalize_picking_sku(value) in IGNORED_PICKING_SKUS
