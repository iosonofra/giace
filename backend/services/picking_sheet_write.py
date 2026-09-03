import hashlib
import hmac
import json
import re
import threading
import time
import uuid
from datetime import date, datetime, timezone

import requests

from backend.models import AppSetting, PickingSheetOperation
from backend.services.google_sheets import sync_stock_from_google_sheets
from backend.services.settings_reader import DEFAULT_PICKING_DAY_MAPPING
from backend.services.stock_calculation_policy import load_stock_calculation_policy
from backend.services.picking_sessions import (
    PickingSessionError,
    mark_session_recorded,
    mark_session_recording,
    mark_session_verified,
    session_write_items,
    verify_picking_session,
)


class PickingSheetWriteError(ValueError):
    pass


_write_lock = threading.Lock()
_DAY_KEYS = (
    "monday", "tuesday", "wednesday", "thursday", "friday",
    "saturday", "sunday",
)
_WEBAPP_URL = re.compile(
    r"https://script\.google\.com/macros/s/[^/]+/exec"
)
_SCRIPT_PROTOCOL_VERSION = "2.0.0"


def _require_script_protocol(result: dict) -> None:
    if result.get("script_version") != _SCRIPT_PROTOCOL_VERSION:
        raise PickingSheetWriteError(
            "Apps Script non è aggiornato. Copia il nuovo Code.gs e "
            "pubblica una nuova versione del deployment."
        )


def _settings(db) -> dict[str, str]:
    return {
        item.key: item.value
        for item in db.query(AppSetting).filter(
            AppSetting.key.in_((
                "picking_sheet_write_enabled",
                "picking_sheet_webapp_url",
                "picking_sheet_shared_secret",
                "picking_sheet_remaining_header",
                "picking_sheet_day_mapping",
                "google_sheet_name",
                "mapping_sku",
                "mapping_qty",
                "mapping_lotto",
            ))
        ).all()
    }


def _config(db, *, require_enabled=True) -> dict:
    values = _settings(db)
    enabled = values.get("picking_sheet_write_enabled", "false").lower() in {
        "true", "1", "yes",
    }
    try:
        mapping = json.loads(values.get("picking_sheet_day_mapping", "{}"))
    except (TypeError, ValueError):
        mapping = {}
    mapping = {
        key: str(mapping.get(key, DEFAULT_PICKING_DAY_MAPPING[key]) or "").strip()
        for key in _DAY_KEYS
    }
    calculation_policy = load_stock_calculation_policy(db)
    config = {
        "enabled": enabled,
        "webapp_url": values.get("picking_sheet_webapp_url", "").strip(),
        "secret": values.get("picking_sheet_shared_secret", "").strip(),
        "sheet_name": values.get("google_sheet_name", "ROSATE").strip(),
        "sku_header": values.get("mapping_sku", "Sku").strip(),
        "lot_header": values.get("mapping_lotto", "Lotto").strip(),
        "exclude_return_lots": calculation_policy.exclude_return_lots,
        "excluded_lot_keywords": list(
            calculation_policy.excluded_lot_keywords
        ),
        "remaining_header": values.get(
            "picking_sheet_remaining_header",
            "RIMANENTI",
        ).strip(),
        "day_mapping": mapping,
    }
    if require_enabled and not enabled:
        raise PickingSheetWriteError(
            "La registrazione dei prelievi su Google Sheets non è attiva."
        )
    if enabled and (
        not _WEBAPP_URL.fullmatch(config["webapp_url"])
        or len(config["secret"]) < 32
        or (
            config["exclude_return_lots"]
            and not config["lot_header"]
        )
    ):
        raise PickingSheetWriteError(
            "La configurazione Apps Script è incompleta o non valida."
        )
    return config


def get_write_status(db) -> dict:
    config = _config(db, require_enabled=False)
    return {
        "enabled": config["enabled"],
        "configured": bool(
            _WEBAPP_URL.fullmatch(config["webapp_url"])
            and len(config["secret"]) >= 32
        ),
        "sheet_name": config["sheet_name"],
        "day_mapping": config["day_mapping"],
    }


def _normalize_items(raw_items) -> list[dict]:
    if not isinstance(raw_items, list):
        raise PickingSheetWriteError("La lista SKU non è valida.")
    aggregated = {}
    for raw in raw_items:
        if not isinstance(raw, dict):
            raise PickingSheetWriteError("Una riga SKU non è valida.")
        sku = str(raw.get("sku") or "").strip().upper()
        if not sku or len(sku) > 100:
            raise PickingSheetWriteError("È presente uno SKU vuoto o non valido.")
        try:
            quantity = float(raw.get("quantity"))
        except (TypeError, ValueError) as error:
            raise PickingSheetWriteError(
                f"La quantità dello SKU {sku} non è valida."
            ) from error
        if quantity <= 0 or quantity > 1_000_000:
            raise PickingSheetWriteError(
                f"La quantità dello SKU {sku} deve essere maggiore di zero."
            )
        aggregated[sku] = aggregated.get(sku, 0.0) + quantity
    if not aggregated:
        raise PickingSheetWriteError(
            "La simulazione non contiene quantità da registrare."
        )
    if len(aggregated) > 2_000:
        raise PickingSheetWriteError(
            "La registrazione può contenere al massimo 2000 SKU."
        )
    return [
        {"sku": sku, "quantity": quantity}
        for sku, quantity in sorted(aggregated.items())
    ]


def _parse_date(value) -> date:
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError) as error:
        raise PickingSheetWriteError(
            "Seleziona una data valida per il prelievo."
        ) from error


def _canonical(value) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def _signature(secret: str, payload: str) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _call_script(config, data, *, request_post=requests.post) -> dict:
    payload = _canonical({
        **data,
        "timestamp": int(time.time()),
    })
    envelope = {
        "payload": payload,
        "signature": _signature(config["secret"], payload),
    }
    try:
        response = request_post(
            config["webapp_url"],
            json=envelope,
            timeout=45,
        )
        response.raise_for_status()
        result = response.json()
    except Exception as error:
        raise PickingSheetWriteError(
            "Apps Script non è raggiungibile o ha restituito una risposta non valida."
        ) from error
    if not isinstance(result, dict) or not result.get("ok"):
        detail = result.get("error") if isinstance(result, dict) else None
        raise PickingSheetWriteError(
            detail or "Apps Script ha rifiutato la richiesta."
        )
    return result


def test_write_connection(db, *, request_post=requests.post) -> dict:
    config = _config(db)
    result = _call_script(
        config,
        {
            "action": "health",
            "sheet_name": config["sheet_name"],
            "sku_header": config["sku_header"],
            "lot_header": config["lot_header"],
            "exclude_return_lots": config["exclude_return_lots"],
            "excluded_lot_keywords": config["excluded_lot_keywords"],
        },
        request_post=request_post,
    )
    _require_script_protocol(result)
    return {
        "status": "success",
        "script_version": result.get("script_version", ""),
        "sheet_name": result.get("sheet_name", config["sheet_name"]),
        "headers": result.get("headers", []),
        "message": "Collegamento Apps Script verificato in sola lettura.",
    }


def preview_sheet_write(db, payload: dict, *, request_post=requests.post) -> dict:
    config = _config(db)
    target_date = _parse_date(payload.get("target_date"))
    session_id = str(payload.get("session_id") or "").strip()
    try:
        if session_id:
            _, session_items = session_write_items(db, session_id)
            items = _normalize_items(session_items)
        else:
            items = _normalize_items(payload.get("items"))
    except PickingSessionError as error:
        raise PickingSheetWriteError(str(error)) from error
    day_key = _DAY_KEYS[target_date.weekday()]
    day_label = config["day_mapping"].get(day_key, "")
    if not day_label:
        raise PickingSheetWriteError(
            "Il giorno selezionato non è configurato per la scrittura."
        )

    operation_id = f"pick-{target_date:%Y%m%d}-{uuid.uuid4().hex[:12]}"
    result = _call_script(
        config,
        {
            "action": "preview",
            "operation_id": operation_id,
            "sheet_name": config["sheet_name"],
            "sku_header": config["sku_header"],
            "lot_header": config["lot_header"],
            "exclude_return_lots": config["exclude_return_lots"],
            "excluded_lot_keywords": config["excluded_lot_keywords"],
            "remaining_header": config["remaining_header"],
            "target_date": target_date.isoformat(),
            "day_key": day_key,
            "day_label": day_label,
            "items": items,
        },
        request_post=request_post,
    )
    _require_script_protocol(result)
    if not result.get("sheet_revision"):
        raise PickingSheetWriteError(
            "Apps Script non ha restituito la revisione del foglio. "
            "Aggiorna il deployment e riprova."
        )
    plan = {
        "operation_id": operation_id,
        "script_version": result.get("script_version", ""),
        "sheet_revision": result.get("sheet_revision", ""),
        "session_id": session_id,
        "sheet_name": result.get("sheet_name", config["sheet_name"]),
        "target_date": target_date.isoformat(),
        "day_key": day_key,
        "day_label": day_label,
        "target_header": result.get("target_header", ""),
        "target_column": result.get("target_column", ""),
        "items": result.get("items", []),
        "errors": result.get("errors", []),
        "skipped": result.get("skipped", []),
        "can_apply": bool(result.get("can_apply", False)),
    }
    preview_token = _signature(config["secret"], _canonical(plan))
    total_quantity = sum(
        float(item.get("quantity", 0)) for item in plan["items"]
    )
    return {
        "plan": plan,
        "preview_token": preview_token,
        "total_quantity": total_quantity,
        "sku_count": len(plan["items"]),
        "skipped_count": len(plan["skipped"]),
    }


def apply_sheet_write(db, payload: dict, *, request_post=requests.post) -> dict:
    config = _config(db)
    plan = payload.get("plan")
    token = str(payload.get("preview_token") or "")
    if not isinstance(plan, dict):
        raise PickingSheetWriteError("L'anteprima della registrazione non è valida.")
    expected_token = _signature(config["secret"], _canonical(plan))
    if not hmac.compare_digest(token, expected_token):
        raise PickingSheetWriteError(
            "L'anteprima è stata modificata o non è più valida. Rigenerala."
        )
    if plan.get("errors") or not plan.get("can_apply"):
        raise PickingSheetWriteError(
            "L'anteprima contiene errori e non può essere applicata."
        )

    operation_id = str(plan.get("operation_id") or "")
    session_id = str(plan.get("session_id") or "").strip()
    request_hash = hashlib.sha256(_canonical(plan).encode("utf-8")).hexdigest()
    existing = db.get(PickingSheetOperation, operation_id)
    if existing:
        if existing.request_hash != request_hash:
            raise PickingSheetWriteError(
                "L'ID operazione è già associato a un contenuto differente."
            )
        if existing.status == "applied":
            response = json.loads(existing.response_json or "{}")
            return {**response, "idempotent": True}

    if session_id:
        try:
            verify_picking_session(db, session_id)
        except PickingSessionError as error:
            raise PickingSheetWriteError(str(error)) from error

    if existing:
        if existing.status == "pending":
            created_at = existing.created_at or datetime.now()
            age_seconds = (datetime.now() - created_at).total_seconds()
            if age_seconds < 90:
                raise PickingSheetWriteError(
                    "Questa registrazione è già in corso."
                )
        existing.status = "pending"
        existing.plan_json = existing.plan_json or _canonical(plan)
        existing.response_json = None
        db.commit()
    else:
        existing = PickingSheetOperation(
            operation_id=operation_id,
            request_hash=request_hash,
            target_date=str(plan.get("target_date") or ""),
            target_column=str(plan.get("target_column") or ""),
            status="pending",
            sku_count=len(plan.get("items") or []),
            total_qty=sum(
                float(item.get("quantity", 0))
                for item in plan.get("items") or []
            ),
            plan_json=_canonical(plan),
        )
        db.add(existing)
        db.commit()

    if not _write_lock.acquire(blocking=False):
        existing.status = "failed"
        existing.response_json = json.dumps({
            "error": "Un'altra registrazione è già in corso."
        })
        db.commit()
        raise PickingSheetWriteError(
            "Un'altra registrazione su Google Sheets è già in corso."
        )

    try:
        if session_id:
            mark_session_recording(db, session_id, operation_id)
        result = _call_script(
            config,
            {
                "action": "apply",
                "sku_header": config["sku_header"],
                "lot_header": config["lot_header"],
                "exclude_return_lots": config["exclude_return_lots"],
                "excluded_lot_keywords": config["excluded_lot_keywords"],
                "remaining_header": config["remaining_header"],
                **plan,
            },
            request_post=request_post,
        )
        response = {
            "status": "success",
            "operation_id": operation_id,
            "sheet_name": result.get("sheet_name", config["sheet_name"]),
            "target_header": result.get("target_header", plan.get("target_header")),
            "updated_cells": result.get("updated_cells", len(plan.get("items") or [])),
            "sku_count": len(plan.get("items") or []),
            "total_quantity": sum(
                float(item.get("quantity", 0))
                for item in plan.get("items") or []
            ),
            "idempotent": bool(result.get("idempotent", False)),
        }
        try:
            response["stock_sync"] = sync_stock_from_google_sheets(
                db,
                force=True,
            )
        except Exception as error:
            response["stock_sync"] = {
                "status": "warning",
                "message": (
                    "Prelievo registrato, ma la giacenza locale non è stata "
                    f"sincronizzata: {error}"
                ),
            }
        existing.status = "applied"
        existing.applied_at = datetime.now(timezone.utc).replace(tzinfo=None)
        existing.response_json = json.dumps(response, ensure_ascii=False)
        db.commit()
        if session_id:
            mark_session_recorded(db, session_id, response)
        return response
    except Exception as error:
        existing.status = "failed"
        existing.response_json = json.dumps(
            {"error": str(error)},
            ensure_ascii=False,
        )
        db.commit()
        if session_id:
            mark_session_verified(db, session_id)
        raise
    finally:
        _write_lock.release()
