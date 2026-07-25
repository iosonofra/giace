import re

from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ImportAnomaly, PrestashopOrder, PrestashopOrderLine


router = APIRouter(tags=["anomalies"])


@router.get("/api/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(ImportAnomaly).order_by(desc(ImportAnomaly.created_at)).all()
    product_ids = {
        int(a.record_key)
        for a in anomalies
        if a.record_key and str(a.record_key).isdigit()
    }
    product_names = {}
    if product_ids:
        product_rows = db.query(
            PrestashopOrderLine.product_id,
            PrestashopOrderLine.product_name
        ).filter(
            PrestashopOrderLine.product_id.in_(product_ids),
            PrestashopOrderLine.product_name.isnot(None),
            PrestashopOrderLine.product_name != ""
        ).all()
        for product_id, product_name in product_rows:
            product_names.setdefault(product_id, product_name)

    # Le nuove anomalie salvano direttamente l'ID ordine. Per quelle storiche
    # recuperiamo l'ID dal testo "Ordine 12345" così il filtro funziona subito.
    anomaly_order_ids = {}
    for anomaly in anomalies:
        order_id = anomaly.order_id
        if order_id is None and anomaly.message:
            order_match = re.search(r"\bOrdine\s+(\d+)\b", anomaly.message, re.IGNORECASE)
            if order_match:
                order_id = int(order_match.group(1))
        if order_id is not None:
            anomaly_order_ids[anomaly.id] = order_id

    order_state_map = {}
    if anomaly_order_ids:
        related_orders = db.query(PrestashopOrder).filter(
            PrestashopOrder.order_id.in_(set(anomaly_order_ids.values()))
        ).all()
        order_state_map = {order.order_id: order for order in related_orders}

    result = []
    for anomaly in anomalies:
        order_id = anomaly_order_ids.get(anomaly.id)
        order = order_state_map.get(order_id)
        result.append({
            "id": anomaly.id,
            "source": anomaly.source,
            "record_key": anomaly.record_key or "",
            "product_name": product_names.get(int(anomaly.record_key), "") if anomaly.record_key and str(anomaly.record_key).isdigit() else "",
            "order_id": order_id,
            "current_state": order.current_state if order else None,
            "current_state_label": (order.current_state_label or f"Stato {order.current_state}") if order else "",
            "anomaly_type": anomaly.anomaly_type,
            "message": anomaly.message,
            "created_at": anomaly.created_at.isoformat() + "Z" if anomaly.created_at else None
        })
    return result

@router.post("/api/anomalies/clear")
def clear_anomalies(db: Session = Depends(get_db)):
    db.query(ImportAnomaly).delete()
    db.commit()
    return {"status": "success"}
