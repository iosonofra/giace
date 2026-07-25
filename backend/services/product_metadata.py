import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from backend.models import PrestashopOrderLine, PrestashopProductCache


logger = logging.getLogger(__name__)
NEGATIVE_CACHE_TTL = timedelta(minutes=15)


def resolve_product_metadata(
    db: Session,
    product_ids,
    client_factory,
    now=None,
):
    """Risolve nome e riferimento dei prodotti usando fonti locali e PrestaShop.

    Priorità: cache persistente, righe ordine già sincronizzate, Webservice.
    Restituisce due mappe indicizzate per product_id: metadati e fonte.
    """
    normalized_ids = sorted({int(product_id) for product_id in product_ids})
    if not normalized_ids:
        return {}, {}

    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    cache_rows = db.query(PrestashopProductCache).filter(
        PrestashopProductCache.product_id.in_(normalized_ids)
    ).all()
    cache_by_product = {row.product_id: row for row in cache_rows}
    metadata = {}
    sources = {}

    for product_id, cache_row in cache_by_product.items():
        if cache_row.product_name or cache_row.product_reference:
            metadata[product_id] = {
                "product_name": cache_row.product_name or "",
                "product_reference": cache_row.product_reference or "",
            }
            sources[product_id] = "cache"

    recent_lines = db.query(PrestashopOrderLine).filter(
        PrestashopOrderLine.product_id.in_(normalized_ids)
    ).order_by(PrestashopOrderLine.id.desc()).all()
    for line in recent_lines:
        current = metadata.get(line.product_id, {})
        if not current.get("product_name") and line.product_name:
            metadata[line.product_id] = {
                "product_name": line.product_name or "",
                "product_reference": line.product_reference or current.get("product_reference", ""),
            }
            sources[line.product_id] = "orders"

    ids_to_fetch = []
    for product_id in normalized_ids:
        if metadata.get(product_id, {}).get("product_name"):
            continue
        cache_row = cache_by_product.get(product_id)
        cache_is_recent = (
            cache_row is not None
            and cache_row.fetched_at is not None
            and now - cache_row.fetched_at < NEGATIVE_CACHE_TTL
        )
        if not cache_is_recent:
            ids_to_fetch.append(product_id)

    cache_changed = False
    if ids_to_fetch:
        try:
            client = client_factory()
            if not client.url or not client.api_key:
                raise RuntimeError("Webservice PrestaShop non configurato")
            fetched_products = client.get_products_details(ids_to_fetch)
            for product_id in ids_to_fetch:
                details = fetched_products.get(product_id, {})
                cache_row = _get_or_create_cache_row(db, cache_by_product, product_id)
                cache_row.product_name = details.get("product_name", "")
                cache_row.product_reference = details.get("product_reference", "")
                cache_row.fetch_status = "success" if details else "not_found"
                cache_row.fetched_at = now
                cache_changed = True
                if details:
                    metadata[product_id] = details
                    sources[product_id] = "prestashop"
        except Exception as exc:
            logger.warning("Impossibile aggiornare la cache dei prodotti %s: %s", ids_to_fetch, exc)
            for product_id in ids_to_fetch:
                cache_row = _get_or_create_cache_row(db, cache_by_product, product_id)
                cache_row.fetch_status = "error"
                cache_row.fetched_at = now
                cache_changed = True

    # I metadati già presenti negli ordini diventano cache persistente.
    for product_id, details in metadata.items():
        if sources.get(product_id) != "orders":
            continue
        cache_row = _get_or_create_cache_row(db, cache_by_product, product_id)
        cache_row.product_name = details.get("product_name", "")
        cache_row.product_reference = details.get("product_reference", "")
        cache_row.fetch_status = "success"
        cache_row.fetched_at = now
        cache_changed = True

    if cache_changed:
        db.commit()

    return metadata, sources


def _get_or_create_cache_row(db, cache_by_product, product_id):
    cache_row = cache_by_product.get(product_id)
    if cache_row is None:
        cache_row = PrestashopProductCache(product_id=product_id)
        db.add(cache_row)
        cache_by_product[product_id] = cache_row
    return cache_row
