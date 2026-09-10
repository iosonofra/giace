import json
import logging
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.api.dependencies import get_ps_client
from backend.database import get_db
from backend.prestashop_client import PrestaShopClient
from backend.services.gaer_file import (
    MAX_GAER_FILE_SIZE,
    GaerExportError,
    GaerFileError,
    export_gaer_workbook,
    parse_gaer_workbook,
)
from backend.services.gaer_picking import simulate_gaer_picking
from backend.services.settings_reader import read_settings


logger = logging.getLogger(__name__)
router = APIRouter(tags=["gaer"])


def _state_ids(value: str) -> list[int]:
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, list):
            raise ValueError
        normalized = list(dict.fromkeys(int(item) for item in parsed))
    except (TypeError, ValueError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=400, detail="Gli stati Gaer selezionati non sono validi.") from error
    if not normalized or len(normalized) > 50 or any(item <= 0 for item in normalized):
        raise HTTPException(status_code=400, detail="Seleziona da 1 a 50 stati ordine Gaer.")
    return normalized


def _export_allocations(value: str) -> dict[str, list[int]]:
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, dict):
            raise ValueError
        normalized = {}
        total = 0
        for raw_ean, raw_order_ids in parsed.items():
            ean = str(raw_ean).strip()
            if not ean.isdigit() or not 8 <= len(ean) <= 13:
                raise ValueError
            if not isinstance(raw_order_ids, list):
                raise ValueError
            order_ids = [int(order_id) for order_id in raw_order_ids]
            if any(order_id <= 0 for order_id in order_ids):
                raise ValueError
            total += len(order_ids)
            normalized[ean] = order_ids
        if total == 0 or total > 100_000:
            raise ValueError
        return normalized
    except (TypeError, ValueError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=400,
            detail="Le assegnazioni degli ordini Gaer non sono valide.",
        ) from error


@router.get("/api/gaer/states")
def get_gaer_states(
    db: Session = Depends(get_db),
    client: PrestaShopClient = Depends(get_ps_client),
):
    try:
        states = client.get_order_states()
    except Exception as error:
        logger.exception("Impossibile caricare gli stati Gaer da PrestaShop.")
        raise HTTPException(
            status_code=502,
            detail="Impossibile caricare gli stati ordine da PrestaShop.",
        ) from error
    return {
        "states": states,
        "selected_state_ids": read_settings(db).get("gaer_state_ids", []),
    }


@router.post("/api/gaer/analyze")
def analyze_gaer_file(
    file: UploadFile = File(...),
    state_ids: str = Form(...),
    ean_column: str = Form(""),
    quantity_column: str = Form(""),
    header_row: int | None = Form(None),
    client: PrestaShopClient = Depends(get_ps_client),
):
    if not str(file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Carica un file Gaer in formato .xlsx.")
    selected_states = _state_ids(state_ids)
    try:
        parsed_file = parse_gaer_workbook(
            file.file.read(MAX_GAER_FILE_SIZE + 1),
            ean_column=ean_column or None,
            quantity_column=quantity_column or None,
            header_row=header_row,
        )
    except GaerFileError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if parsed_file["mapping_required"]:
        return {
            **parsed_file,
            "filename": file.filename,
        }

    try:
        state_catalog = client.get_order_states()
        state_names = {
            int(state["id"]): str(state.get("name") or f"Stato {state['id']}")
            for state in state_catalog
            if state.get("id") is not None
        }
        orders = client.get_orders(selected_states)
        for order in orders:
            state_id = int(order.get("current_state") or 0)
            order["current_state_label"] = state_names.get(state_id, f"Stato {state_id}")
        pairs = list({
            (
                int(line.get("product_id") or 0),
                int(line.get("product_attribute_id") or 0),
            )
            for order in orders
            for line in order.get("lines") or []
            if int(line.get("product_id") or 0) > 0
        })
        ean_map = client.get_product_identifier_map(pairs)
    except Exception as error:
        logger.exception("Analisi Gaer non riuscita durante la lettura di PrestaShop.")
        raise HTTPException(
            status_code=502,
            detail=(
                "Impossibile leggere ordini o codici EAN13 da PrestaShop. "
                "Verifica che la chiave Webservice possa leggere orders, products e combinations."
            ),
        ) from error

    result = simulate_gaer_picking(
        orders=orders,
        stock_items=parsed_file["stock"],
        ean_map=ean_map,
        state_ids=selected_states,
    )
    result["gaer"].update({
        "filename": file.filename,
        "sheet_name": parsed_file["sheet_name"],
        "header_row": parsed_file["header_row"],
        "mapping": parsed_file["mapping"],
        "file_warnings": parsed_file["warnings"],
        "parsed_rows": parsed_file["parsed_rows"],
        "states": [
            {"id": state_id, "name": state_names.get(state_id, f"Stato {state_id}")}
            for state_id in selected_states
        ],
    })
    return result


@router.post("/api/gaer/export")
def export_gaer_file(
    file: UploadFile = File(...),
    allocations: str = Form(...),
    ean_column: str = Form(...),
    quantity_column: str = Form(...),
    header_row: int = Form(...),
    sheet_name: str = Form(""),
):
    filename = str(file.filename or "")
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Carica un file Gaer in formato .xlsx.")
    try:
        content = export_gaer_workbook(
            file.file.read(MAX_GAER_FILE_SIZE + 1),
            allocations=_export_allocations(allocations),
            ean_column=ean_column,
            quantity_column=quantity_column,
            header_row=header_row,
            sheet_name=sheet_name or None,
        )
    except GaerExportError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    encoded_filename = quote(filename, safe="")
    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
        },
    )
