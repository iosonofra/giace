import hashlib
import json
import uuid
from datetime import datetime, timezone

from backend.models import (
    ImportBatch,
    PickingSession,
    PrestashopOrder,
    PrestashopOrderLine,
)
from backend.services.datetime_serialization import utc_iso


class PickingSessionError(ValueError):
    pass


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _json(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _loads(value, fallback):
    try:
        result = json.loads(value or "")
    except (TypeError, ValueError):
        return fallback
    return result


def _active_batch_id(db, file_type):
    batch = (
        db.query(ImportBatch)
        .filter(ImportBatch.file_type == file_type, ImportBatch.is_active.is_(True))
        .order_by(ImportBatch.id.desc())
        .first()
    )
    return batch.id if batch else None


def _normalize_order_ids(values):
    result = []
    for value in values or []:
        try:
            result.append(int(value))
        except (TypeError, ValueError):
            continue
    return list(dict.fromkeys(result))


def _orders_fingerprint(db, order_ids):
    if not order_ids:
        return ""
    orders = (
        db.query(PrestashopOrder)
        .filter(PrestashopOrder.order_id.in_(order_ids))
        .order_by(PrestashopOrder.order_id)
        .all()
    )
    lines = (
        db.query(PrestashopOrderLine)
        .filter(PrestashopOrderLine.order_id.in_(order_ids))
        .order_by(PrestashopOrderLine.order_id, PrestashopOrderLine.id)
        .all()
    )
    payload = {
        "orders": [
            {
                "id": order.order_id,
                "state": order.current_state,
                "updated": order.date_upd.isoformat() if order.date_upd else None,
            }
            for order in orders
        ],
        "lines": [
            {
                "order": line.order_id,
                "line": line.line_id,
                "product": line.product_id,
                "attribute": line.product_attribute_id,
                "reference": line.product_reference,
                "quantity": line.product_quantity,
            }
            for line in lines
        ],
    }
    return hashlib.sha256(_json(payload).encode("utf-8")).hexdigest()


def _snapshot(db, order_ids):
    return {
        "warehouse_batch_id": _active_batch_id(db, "warehouse"),
        "associations_batch_id": _active_batch_id(db, "associations"),
        "orders_fingerprint": _orders_fingerprint(db, order_ids),
    }


def _normalize_requirements(values):
    if not isinstance(values, list):
        raise PickingSessionError("Il fabbisogno della sessione non è valido.")
    aggregated = {}
    for value in values:
        if not isinstance(value, dict):
            raise PickingSessionError("Una riga del fabbisogno non è valida.")
        sku = str(value.get("sku") or "").strip().upper()
        if not sku or len(sku) > 100:
            raise PickingSessionError("È presente uno SKU vuoto o non valido.")
        try:
            planned = float(value.get("qty_required", value.get("planned_qty", 0)))
        except (TypeError, ValueError) as error:
            raise PickingSessionError(f"La quantità pianificata di {sku} non è valida.") from error
        if planned <= 0 or planned > 1_000_000:
            raise PickingSessionError(f"La quantità pianificata di {sku} non è valida.")
        entry = aggregated.setdefault(sku, {
            "sku": sku,
            "description": str(value.get("description") or "")[:255],
            "planned_qty": 0.0,
            "actual_qty": 0.0,
        })
        entry["planned_qty"] += planned
        entry["actual_qty"] += planned
    if not aggregated:
        raise PickingSessionError("La simulazione non contiene SKU da prelevare.")
    if len(aggregated) > 2_000:
        raise PickingSessionError("Una sessione può contenere al massimo 2000 SKU.")
    return list(aggregated.values())


def serialize_picking_session(session, *, include_details=True):
    result = {
        "session_id": session.session_id,
        "status": session.status,
        "source_type": session.source_type,
        "sheet_operation_id": session.sheet_operation_id,
        "created_at": utc_iso(session.created_at),
        "updated_at": utc_iso(session.updated_at),
    }
    if include_details:
        result.update({
            "source": _loads(session.source_json, {}),
            "snapshot": _loads(session.snapshot_json, {}),
            "requirements": _loads(session.requirements_json, []),
            "orders": _loads(session.orders_json, []),
            "receipt": _loads(session.receipt_json, None),
        })
    return result


def create_picking_session(db, payload):
    results = payload.get("results") if isinstance(payload, dict) else None
    if not isinstance(results, dict):
        raise PickingSessionError("I risultati della simulazione non sono validi.")
    requirements = _normalize_requirements(results.get("sku_requirements"))
    order_ids = _normalize_order_ids(results.get("orders_found"))
    now = _now()
    session = PickingSession(
        session_id=f"pick-session-{uuid.uuid4().hex}",
        status="draft",
        source_type=str(payload.get("source_type") or "simulation")[:30],
        source_json=_json(payload.get("source") or {}),
        snapshot_json=_json(_snapshot(db, order_ids)),
        requirements_json=_json(requirements),
        orders_json=_json(order_ids),
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return serialize_picking_session(session)


def get_picking_session(db, session_id):
    session = db.get(PickingSession, str(session_id or ""))
    if not session:
        raise PickingSessionError("La sessione di prelievo non esiste più.")
    return session


def update_picking_quantities(db, session_id, raw_quantities):
    session = get_picking_session(db, session_id)
    if session.status in {"recording", "recorded", "cancelled"}:
        raise PickingSessionError("Questa sessione non può più essere modificata.")
    if not isinstance(raw_quantities, list):
        raise PickingSessionError("Le quantità effettive non sono valide.")
    updates = {}
    for item in raw_quantities:
        sku = str((item or {}).get("sku") or "").strip().upper()
        try:
            quantity = float((item or {}).get("quantity"))
        except (TypeError, ValueError) as error:
            raise PickingSessionError(f"La quantità effettiva di {sku or 'uno SKU'} non è valida.") from error
        updates[sku] = quantity
    requirements = _loads(session.requirements_json, [])
    known = {item["sku"] for item in requirements}
    if set(updates) != known:
        raise PickingSessionError("L’elenco SKU non corrisponde alla sessione corrente.")
    for item in requirements:
        actual = updates[item["sku"]]
        if actual < 0 or actual > float(item["planned_qty"]):
            raise PickingSessionError(
                f"La quantità effettiva di {item['sku']} deve essere tra 0 e {item['planned_qty']}."
            )
        item["actual_qty"] = actual
    if not any(float(item["actual_qty"]) > 0 for item in requirements):
        raise PickingSessionError("Imposta almeno una quantità effettiva maggiore di zero.")
    session.requirements_json = _json(requirements)
    session.status = "draft"
    session.verified_at = None
    session.updated_at = _now()
    db.commit()
    return serialize_picking_session(session)


def verify_picking_session(db, session_id):
    session = get_picking_session(db, session_id)
    if session.status in {"recorded", "cancelled"}:
        raise PickingSessionError("Questa sessione è già conclusa.")
    previous = _loads(session.snapshot_json, {})
    current = _snapshot(db, _loads(session.orders_json, []))
    differences = []
    if previous.get("warehouse_batch_id") != current.get("warehouse_batch_id"):
        differences.append("La giacenza attiva è cambiata dopo la simulazione.")
    if previous.get("associations_batch_id") != current.get("associations_batch_id"):
        differences.append("Le associazioni prodotto/SKU sono cambiate dopo la simulazione.")
    if previous.get("orders_fingerprint") != current.get("orders_fingerprint"):
        differences.append("Uno o più ordini della simulazione sono stati modificati.")
    session.status = "stale" if differences else "verified"
    session.verified_at = None if differences else _now()
    session.updated_at = _now()
    db.commit()
    if differences:
        raise PickingSessionError(
            "La simulazione non è più aggiornata: " + " ".join(differences)
        )
    return serialize_picking_session(session)


def session_write_items(db, session_id):
    session = get_picking_session(db, session_id)
    verify_picking_session(db, session_id)
    requirements = _loads(session.requirements_json, [])
    return session, [
        {"sku": item["sku"], "quantity": item["actual_qty"]}
        for item in requirements
        if float(item.get("actual_qty") or 0) > 0
    ]


def mark_session_recording(db, session_id, operation_id):
    session = get_picking_session(db, session_id)
    session.status = "recording"
    session.sheet_operation_id = operation_id
    session.updated_at = _now()
    db.commit()


def mark_session_recorded(db, session_id, receipt):
    session = get_picking_session(db, session_id)
    session.status = "recorded"
    session.receipt_json = _json(receipt)
    session.recorded_at = _now()
    session.updated_at = session.recorded_at
    db.commit()


def mark_session_verified(db, session_id):
    session = get_picking_session(db, session_id)
    if session.status == "recording":
        session.status = "verified"
        session.updated_at = _now()
        db.commit()
