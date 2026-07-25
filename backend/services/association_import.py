import logging

from backend.calculator import run_calculation
from backend.excel_parser import parse_associations_excel
from backend.models import (
    ImportAnomaly,
    ImportBatch,
    ProductComponent,
)


logger = logging.getLogger(__name__)


class AssociationImportParseError(Exception):
    """Raised after persisting a fatal association parsing anomaly."""


def import_association_data(
    db,
    file_content: bytes,
    *,
    filename: str,
    parser=parse_associations_excel,
    calculation_runner=run_calculation,
) -> dict:
    try:
        associations, anomalies = parser(file_content)
    except Exception as error:
        _record_parse_error(db, filename, error)
        raise AssociationImportParseError(str(error)) from error

    try:
        (
            db.query(ImportBatch)
            .filter(ImportBatch.file_type == "associations")
            .update({ImportBatch.is_active: False})
        )
        batch = ImportBatch(
            file_type="associations",
            filename=filename,
            record_count=len(associations),
            is_active=True,
        )
        db.add(batch)
        db.flush()
        db.bulk_save_objects(
            [
                ProductComponent(
                    import_batch_id=batch.id,
                    product_id=association["product_id"],
                    sku=association["sku"],
                    qty_required=association["qty_required"],
                )
                for association in associations
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

    try:
        calculation_runner(
            db,
            associations_batch_id=batch.id,
        )
    except Exception as error:
        logger.error(
            "Errore nel calcolo automatico dopo import associazioni: %s",
            error,
        )

    return {
        "status": "success",
        "batch_id": batch.id,
        "records_imported": len(associations),
        "anomalies_found": len(anomalies),
    }


def _record_parse_error(
    db,
    filename: str,
    error: Exception,
) -> None:
    db.add(
        ImportAnomaly(
            source="associations_import",
            anomaly_type="parse_error",
            message=(
                f"Errore fatale nel parsing di {filename}: "
                f"{error}"
            ),
        )
    )
    db.commit()
