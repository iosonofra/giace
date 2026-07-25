import json
from dataclasses import dataclass

from backend.inventory_math import (
    aggregate_stock,
    build_components_map,
)
from backend.models import (
    AppSetting,
    ImportBatch,
    PrestashopOrder,
    PrestashopOrderLine,
    ProductComponent,
    WarehouseStock,
)


@dataclass(frozen=True)
class CalculationBatchIds:
    warehouse: int | None
    associations: int | None


@dataclass(frozen=True)
class CalculationInputs:
    included_states: list
    order_lines: list
    components_map: dict
    sku_total_stock: dict


def resolve_calculation_batch_ids(
    db,
    *,
    warehouse_batch_id=None,
    associations_batch_id=None,
) -> CalculationBatchIds:
    if warehouse_batch_id and associations_batch_id:
        return CalculationBatchIds(
            warehouse=warehouse_batch_id,
            associations=associations_batch_id,
        )

    batches = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type.in_(
                ("warehouse", "associations"),
            ),
            ImportBatch.is_active.is_(True),
        )
        .order_by(ImportBatch.imported_at.desc())
        .all()
    )
    active_by_type = {}
    for batch in batches:
        active_by_type.setdefault(batch.file_type, batch.id)

    return CalculationBatchIds(
        warehouse=(
            warehouse_batch_id
            or active_by_type.get("warehouse")
        ),
        associations=(
            associations_batch_id
            or active_by_type.get("associations")
        ),
    )


def load_calculation_inputs(
    db,
    batch_ids: CalculationBatchIds,
) -> CalculationInputs:
    _validate_batch_ids(batch_ids)
    included_states = _load_included_states(db)
    order_ids = [
        row[0]
        for row in db.query(PrestashopOrder.order_id)
        .filter(
            PrestashopOrder.current_state.in_(
                included_states
            )
        )
        .all()
    ]
    order_lines = (
        db.query(PrestashopOrderLine)
        .filter(
            PrestashopOrderLine.order_id.in_(order_ids)
        )
        .all()
        if order_ids
        else []
    )
    components = (
        db.query(ProductComponent)
        .filter(
            ProductComponent.import_batch_id
            == batch_ids.associations,
        )
        .all()
    )
    stock = (
        db.query(WarehouseStock)
        .filter(
            WarehouseStock.import_batch_id
            == batch_ids.warehouse,
        )
        .all()
    )
    return CalculationInputs(
        included_states=included_states,
        order_lines=order_lines,
        components_map=build_components_map(components),
        sku_total_stock=aggregate_stock(stock),
    )


def _validate_batch_ids(
    batch_ids: CalculationBatchIds,
) -> None:
    messages = []
    if not batch_ids.warehouse:
        messages.append(
            "Nessun batch di giacenza (magazzino) "
            "attivo trovato."
        )
    if not batch_ids.associations:
        messages.append(
            "Nessun batch di associazioni attivo trovato."
        )
    if messages:
        raise ValueError(" ".join(messages))


def _load_included_states(db) -> list:
    setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "included_state_ids")
        .first()
    )
    included_states = []
    if setting:
        try:
            included_states = json.loads(setting.value)
        except Exception:
            pass
    return included_states or [12]
