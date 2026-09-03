import json
from datetime import date

from sqlalchemy import func, or_

from backend.models import PickingSession, PickingSheetOperation


class PickingHistoryError(ValueError):
    pass


def _loads(value, fallback):
    try:
        parsed = json.loads(value or "")
    except (TypeError, ValueError):
        return fallback
    return parsed


def _iso(value):
    return value.isoformat() if value else None


def _date_filter(value, label):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)).isoformat()
    except ValueError as error:
        raise PickingHistoryError(f"La {label} non è valida.") from error


def _summary(operation, session=None):
    response = _loads(operation.response_json, {})
    plan = _loads(operation.plan_json, {})
    orders = _loads(session.orders_json, []) if session else []
    sheet_name = response.get("sheet_name") or plan.get("sheet_name") or "Google Sheets"
    target_header = response.get("target_header") or plan.get("target_header") or operation.target_column or ""
    plan_errors = plan.get("errors") or []
    error_message = response.get("error") or response.get("detail") or (plan_errors[0] if plan_errors else "")
    return {
        "operation_id": operation.operation_id,
        "status": operation.status,
        "target_date": operation.target_date,
        "target_column": operation.target_column,
        "target_header": target_header,
        "sheet_name": sheet_name,
        "sku_count": operation.sku_count,
        "total_quantity": operation.total_qty,
        "source_type": session.source_type if session else "legacy",
        "orders_count": len(orders),
        "created_at": _iso(operation.created_at),
        "applied_at": _iso(operation.applied_at),
        "has_details": bool(plan.get("items") or (session and session.requirements_json)),
        "error": error_message,
    }


def list_picking_history(
    db,
    *,
    page=1,
    page_size=25,
    status="all",
    query="",
    date_from=None,
    date_to=None,
):
    try:
        page = max(1, int(page))
        page_size = max(1, min(100, int(page_size)))
    except (TypeError, ValueError) as error:
        raise PickingHistoryError("La paginazione richiesta non è valida.") from error
    valid_statuses = {"all", "applied", "failed", "pending"}
    if status not in valid_statuses:
        raise PickingHistoryError("Il filtro di stato non è valido.")
    start = _date_filter(date_from, "data iniziale")
    end = _date_filter(date_to, "data finale")
    if start and end and start > end:
        raise PickingHistoryError("La data iniziale non può superare quella finale.")

    statement = db.query(PickingSheetOperation)
    if status != "all":
        statement = statement.filter(PickingSheetOperation.status == status)
    if start:
        statement = statement.filter(PickingSheetOperation.target_date >= start)
    if end:
        statement = statement.filter(PickingSheetOperation.target_date <= end)
    search = str(query or "").strip()
    if search:
        pattern = f"%{search}%"
        statement = statement.filter(or_(
            PickingSheetOperation.operation_id.ilike(pattern),
            PickingSheetOperation.target_date.ilike(pattern),
            PickingSheetOperation.target_column.ilike(pattern),
            PickingSheetOperation.plan_json.ilike(pattern),
            PickingSheetOperation.operation_id.in_(
                db.query(PickingSession.sheet_operation_id).filter(
                    PickingSession.requirements_json.ilike(pattern),
                )
            ),
        ))

    total = statement.count()
    operations = (
        statement
        .order_by(
            func.coalesce(
                PickingSheetOperation.applied_at,
                PickingSheetOperation.created_at,
            ).desc(),
            PickingSheetOperation.operation_id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    operation_ids = [item.operation_id for item in operations]
    sessions = (
        db.query(PickingSession)
        .filter(PickingSession.sheet_operation_id.in_(operation_ids))
        .all()
        if operation_ids else []
    )
    sessions_by_operation = {
        session.sheet_operation_id: session
        for session in sessions
        if session.sheet_operation_id
    }
    return {
        "items": [
            _summary(operation, sessions_by_operation.get(operation.operation_id))
            for operation in operations
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": max(1, (total + page_size - 1) // page_size),
    }


def get_picking_history_detail(db, operation_id):
    operation = db.get(PickingSheetOperation, str(operation_id or ""))
    if not operation:
        raise PickingHistoryError("L’operazione di prelievo non è stata trovata.")
    session = (
        db.query(PickingSession)
        .filter(PickingSession.sheet_operation_id == operation.operation_id)
        .order_by(PickingSession.created_at.desc())
        .first()
    )
    plan = _loads(operation.plan_json, {})
    response = _loads(operation.response_json, {})
    requirements = _loads(session.requirements_json, []) if session else []
    return {
        **_summary(operation, session),
        "items": plan.get("items") or [],
        "skipped": plan.get("skipped") or [],
        "errors": plan.get("errors") or [],
        "sheet_revision": plan.get("sheet_revision") or "",
        "orders": _loads(session.orders_json, []) if session else [],
        "requirements": requirements,
        "source": _loads(session.source_json, {}) if session else {},
        "receipt": response,
        "detail_available": bool(plan),
    }
