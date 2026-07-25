from collections.abc import Callable

from backend.models import AppSetting, ImportAnomaly
from backend.services.order_sync_check import utc_now_iso


def _set_setting(db, key: str, value: str) -> None:
    setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == key)
        .first()
    )
    if setting:
        setting.value = value
    else:
        db.add(AppSetting(key=key, value=value))


def mark_sync_success(
    db,
    now_factory: Callable[[], str] = utc_now_iso,
) -> None:
    _set_setting(
        db,
        "prestashop_last_sync",
        now_factory(),
    )
    _set_setting(db, "prestashop_last_error", "")
    db.commit()


def record_sync_failure(db, error: Exception) -> str:
    db.rollback()
    message = (
        "Errore durante la sincronizzazione degli ordini: "
        f"{error}"
    )
    _set_setting(db, "prestashop_last_error", message)
    db.add(
        ImportAnomaly(
            source="orders_sync",
            anomaly_type="sync_error",
            message=message,
        )
    )
    db.commit()
    return message
