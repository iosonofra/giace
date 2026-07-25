import json

from backend.models import (
    AppSetting,
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
)


STOCK_ORDER_SETTING_KEYS = (
    "included_state_ids",
    "prestashop_url",
    "prestashop_admin_url",
)


def list_stock_orders(db, sku) -> list[dict]:
    active_associations = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active.is_(True),
        )
        .first()
    )
    if not active_associations:
        return []

    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == active_associations.id,
            ProductComponent.sku == sku,
        )
        .all()
    )
    if not components:
        return []

    required_by_product = {
        component.product_id: component.qty_required
        for component in components
    }
    settings = _load_settings(db)
    included_states = json.loads(
        settings.get("included_state_ids", "[12]")
    )
    rows = (
        db.query(PrestashopOrderLine, PrestashopOrder)
        .join(
            PrestashopOrder,
            PrestashopOrderLine.order_id
            == PrestashopOrder.order_id,
        )
        .filter(
            PrestashopOrder.current_state.in_(included_states),
            PrestashopOrderLine.product_id.in_(
                required_by_product
            ),
        )
        .all()
    )
    admin_url = _admin_url(settings)
    result = [
        _serialize_order_line(
            line,
            order,
            required_by_product,
            admin_url,
        )
        for line, order in rows
    ]
    result.sort(
        key=lambda item: item["date_add"] or "",
        reverse=True,
    )
    return result


def _load_settings(db):
    return {
        setting.key: setting.value
        for setting in (
            db.query(AppSetting)
            .filter(
                AppSetting.key.in_(STOCK_ORDER_SETTING_KEYS)
            )
            .all()
        )
    }


def _admin_url(settings):
    admin_url = settings.get(
        "prestashop_admin_url",
        "",
    ).strip()
    if admin_url:
        return admin_url

    prestashop_url = settings.get(
        "prestashop_url",
        "",
    ).strip()
    if not prestashop_url:
        return ""
    if "/api" in prestashop_url:
        return prestashop_url.split("/api")[0].rstrip("/")
    return prestashop_url.rstrip("/")


def _serialize_order_line(
    line,
    order,
    required_by_product,
    admin_url,
):
    required = required_by_product.get(line.product_id, 1)
    quantity = line.product_quantity
    return {
        "order_id": line.order_id,
        "current_state_label": order.current_state_label or "",
        "date_add": (
            order.date_add.isoformat()
            if order.date_add
            else None
        ),
        "product_id": line.product_id,
        "product_reference": (
            line.product_reference
            or f"ID {line.product_id}"
        ),
        "product_quantity": quantity,
        "qty_required": required,
        "contribution": required * quantity,
        "customer_name": order.customer_name,
        "total_paid": round(order.total_paid or 0, 2),
        "unit_price": (
            round(order.total_paid / quantity, 2)
            if order.total_paid and quantity
            else None
        ),
        "order_link": (
            f"{admin_url}/index.php?"
            "controller=AdminOrders"
            f"&id_order={order.order_id}&vieworder"
            if admin_url
            else None
        ),
    }
