from dataclasses import dataclass

from backend.inventory_math import (
    calculate_product_availabilities,
    calculate_sku_commitments,
)
from backend.models import (
    ImportAnomaly,
    ProductAvailability,
    SkuCommitment,
)


@dataclass(frozen=True)
class CalculationResults:
    sku_commitments: list[dict]
    product_availabilities: list[dict]
    anomalies: list[dict]


def build_calculation_results(
    order_lines,
    components_map,
    sku_total_stock,
) -> CalculationResults:
    commitments, missing_associations = (
        calculate_sku_commitments(
            order_lines,
            components_map,
        )
    )
    anomalies = [
        _missing_association_anomaly(line)
        for line in missing_associations
    ]
    all_skus = (
        set(sku_total_stock)
        | set(commitments)
    )
    residuals = {}
    commitment_rows = []

    for sku in all_skus:
        quantity_total = sku_total_stock.get(sku, 0.0)
        quantity_committed = commitments.get(sku, 0.0)
        quantity_residual = (
            quantity_total - quantity_committed
        )
        residuals[sku] = quantity_residual
        commitment_rows.append(
            {
                "sku": sku,
                "qty_committed": quantity_committed,
                "qty_total": quantity_total,
                "qty_residual": quantity_residual,
            }
        )
        if sku not in sku_total_stock:
            anomalies.append(
                _missing_stock_anomaly(sku)
            )

    return CalculationResults(
        sku_commitments=commitment_rows,
        product_availabilities=(
            calculate_product_availabilities(
                components_map,
                residuals,
            )
        ),
        anomalies=anomalies,
    )


def persist_calculation_results(
    db,
    run_id: int,
    results: CalculationResults,
) -> None:
    (
        db.query(ImportAnomaly)
        .filter(ImportAnomaly.source == "calculation")
        .delete()
    )
    db.add_all(
        [
            ImportAnomaly(**anomaly)
            for anomaly in results.anomalies
        ]
    )
    if results.sku_commitments:
        db.bulk_save_objects(
            [
                SkuCommitment(
                    calc_run_id=run_id,
                    **commitment,
                )
                for commitment in results.sku_commitments
            ]
        )
    if results.product_availabilities:
        db.bulk_save_objects(
            [
                ProductAvailability(
                    calc_run_id=run_id,
                    **availability,
                )
                for availability
                in results.product_availabilities
            ]
        )


def _missing_association_anomaly(line) -> dict:
    product_label = (
        f" '{line.product_name}'"
        if line.product_name
        else ""
    )
    return {
        "source": "calculation",
        "record_key": str(line.product_id),
        "order_id": line.order_id,
        "anomaly_type": "missing_association",
        "message": (
            f"Ordine {line.order_id}: Il prodotto venduto"
            f"{product_label} (ID {line.product_id}, "
            f"Qta {line.product_quantity}) non è presente "
            "nelle associazioni. SKU non deducibili."
        ),
    }


def _missing_stock_anomaly(sku: str) -> dict:
    return {
        "source": "calculation",
        "record_key": sku,
        "anomaly_type": "missing_sku_in_stock",
        "message": (
            f"La SKU '{sku}' è richiesta nelle associazioni "
            "o impegnata negli ordini ma non è presente "
            "nell'inventario. Trattata come stock = 0."
        ),
    }
