import json

from backend.models import (
    AppSetting,
    ImportBatch,
    ProductComponent,
)


DEFAULT_STATE_IDS = [12]
DEFAULT_PRODUCT_IDS = [609286, 609287, 605652]


def load_included_state_ids(db) -> list[int]:
    setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "included_state_ids")
        .first()
    )
    if not setting:
        return list(DEFAULT_STATE_IDS)
    return json.loads(setting.value)


def load_valid_product_ids(db) -> list[int]:
    active_batch = (
        db.query(ImportBatch)
        .filter(
            ImportBatch.file_type == "associations",
            ImportBatch.is_active == True,
        )
        .first()
    )
    if not active_batch:
        return list(DEFAULT_PRODUCT_IDS)

    product_ids = [
        row[0]
        for row in (
            db.query(ProductComponent.product_id)
            .filter(
                ProductComponent.import_batch_id
                == active_batch.id
            )
            .distinct()
            .all()
        )
    ]
    return product_ids or list(DEFAULT_PRODUCT_IDS)
