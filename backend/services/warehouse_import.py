import logging

from backend.calculator import run_calculation
from backend.excel_parser import parse_warehouse_excel
from backend.models import (
    AppSetting,
    ImportAnomaly,
    ImportBatch,
    WarehouseStock,
)


logger = logging.getLogger(__name__)

MAPPING_DEFAULTS = {
    "mapping_sku": "Sku",
    "mapping_qty": "Qta Tot.",
    "mapping_desc": "Descrizione Sku",
    "mapping_lotto": "Lotto",
}


class WarehouseImportParseError(Exception):
    """Raised after persisting a fatal warehouse parsing anomaly."""


def import_warehouse_data(
    db,
    file_content: bytes,
    *,
    filename: str,
    sheet_name: str,
    parser=parse_warehouse_excel,
    calculation_runner=run_calculation,
) -> dict:
    mappings = load_column_mappings(db)
    try:
        valid_rows, anomalies = parser(
            file_content,
            sheet_name,
            col_sku=mappings["mapping_sku"],
            col_qty=mappings["mapping_qty"],
            col_desc=mappings["mapping_desc"],
            col_lotto=mappings["mapping_lotto"],
        )
    except Exception as error:
        _record_parse_error(db, filename, error)
        raise WarehouseImportParseError(str(error)) from error

    batch, records_imported = persist_warehouse_rows(
        db,
        valid_rows,
        anomalies,
        filename=filename,
        sheet_name=sheet_name,
    )

    try:
        calculation_runner(
            db,
            warehouse_batch_id=batch.id,
        )
    except Exception as error:
        logger.error(
            "Errore nel calcolo automatico dopo import stock: %s",
            error,
        )

    return {
        "status": "success",
        "batch_id": batch.id,
        "records_imported": records_imported,
        "anomalies_found": len(anomalies),
    }


def persist_warehouse_rows(
    db,
    valid_rows,
    anomalies,
    *,
    filename: str,
    sheet_name: str,
):
    records_imported = sum(
        1
        for row in valid_rows
        if not row["sku"].startswith("__spacer_")
    )
    try:
        (
            db.query(ImportBatch)
            .filter(ImportBatch.file_type == "warehouse")
            .update({ImportBatch.is_active: False})
        )
        batch = ImportBatch(
            file_type="warehouse",
            filename=filename,
            sheet_name=sheet_name,
            record_count=records_imported,
            is_active=True,
        )
        db.add(batch)
        db.flush()
        db.bulk_save_objects(
            [
                WarehouseStock(
                    import_batch_id=batch.id,
                    sku=row["sku"],
                    description=row["description"],
                    lotto=row["lotto"],
                    qty_total=row["qty_total"],
                )
                for row in valid_rows
            ]
        )
        db.add_all(
            [
                ImportAnomaly(
                    source=anomaly["source"],
                    record_key=anomaly["record_key"],
                    anomaly_type=anomaly["anomaly_type"],
                    message=anomaly["message"],
                )
                for anomaly in anomalies
            ]
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    return batch, records_imported


def load_column_mappings(db) -> dict:
    settings = (
        db.query(AppSetting)
        .filter(AppSetting.key.in_(tuple(MAPPING_DEFAULTS)))
        .all()
    )
    return resolve_column_mappings(settings)


def resolve_column_mappings(settings) -> dict:
    configured = {
        setting.key: setting.value
        for setting in settings
    }
    return {
        key: configured.get(key) or default
        for key, default in MAPPING_DEFAULTS.items()
    }


def _record_parse_error(
    db,
    filename: str,
    error: Exception,
) -> None:
    db.add(
        ImportAnomaly(
            source="stock_import",
            anomaly_type="parse_error",
            message=(
                f"Errore fatale nel parsing di {filename}: "
                f"{error}"
            ),
        )
    )
    db.commit()
