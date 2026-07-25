import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import AppSetting
from backend.services.google_sheets import sync_stock_from_google_sheets
from backend.services.order_sync import sync_orders_internal
from backend.services.prestashop_client_factory import (
    create_prestashop_client,
)


logger = logging.getLogger(__name__)


def _parse_setting_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _get_setting_int(
    db: Session,
    key: str,
    default: int = 10,
    minimum: int = 1,
) -> int:
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting and setting.value and setting.value.isdigit():
        return max(int(setting.value), minimum)
    return default


def _auto_sync_delay_seconds(
    db: Session,
    interval_key: str,
    last_sync_key: str,
) -> float:
    interval_minutes = _get_setting_int(db, interval_key)
    last_sync_setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == last_sync_key)
        .first()
    )
    try:
        last_sync = _parse_setting_datetime(
            last_sync_setting.value if last_sync_setting else ""
        )
    except (TypeError, ValueError):
        return 0
    if not last_sync:
        return 0

    next_sync_at = last_sync + timedelta(minutes=interval_minutes)
    return max(
        0.0,
        (next_sync_at - datetime.now(timezone.utc)).total_seconds(),
    )


class SyncWorkerManager:
    def __init__(
        self,
        session_factory=SessionLocal,
        stock_sync=sync_stock_from_google_sheets,
        order_sync=sync_orders_internal,
        ps_client_factory=create_prestashop_client,
        check_seconds: float = 5,
    ):
        self._session_factory = session_factory
        self._stock_sync = stock_sync
        self._order_sync = order_sync
        self._ps_client_factory = ps_client_factory
        self._check_seconds = check_seconds
        self._stop_event = threading.Event()
        self._threads = []
        self._lock = threading.Lock()

    @property
    def is_running(self) -> bool:
        return any(thread.is_alive() for thread in self._threads)

    def start(self) -> bool:
        with self._lock:
            if self.is_running:
                return False

            self._stop_event.clear()
            self._threads = [
                threading.Thread(
                    target=self._google_sheets_loop,
                    name="google-sheets-sync",
                    daemon=True,
                ),
                threading.Thread(
                    target=self._prestashop_orders_loop,
                    name="prestashop-orders-sync",
                    daemon=True,
                ),
            ]
            for thread in self._threads:
                thread.start()

        logger.info("Worker di sincronizzazione avviati.")
        return True

    def stop(self, timeout: float = 2) -> bool:
        with self._lock:
            self._stop_event.set()
            threads = list(self._threads)

        for thread in threads:
            thread.join(timeout=timeout)

        stopped = not self.is_running
        if stopped:
            logger.info("Worker di sincronizzazione arrestati.")
        else:
            logger.warning(
                "Uno o più worker stanno completando un'operazione in corso."
            )
        return stopped

    def _wait(self, seconds: float) -> bool:
        return self._stop_event.wait(max(0, seconds))

    def _google_sheets_loop(self) -> None:
        logger.info("Worker Google Sheets avviato.")
        while not self._stop_event.is_set():
            sleep_seconds = self._check_seconds
            db = self._session_factory()
            try:
                source_setting = (
                    db.query(AppSetting)
                    .filter(AppSetting.key == "stock_source")
                    .first()
                )
                if source_setting and source_setting.value == "google_sheets":
                    delay_seconds = _auto_sync_delay_seconds(
                        db,
                        "google_sheet_sync_interval",
                        "google_sheet_last_sync",
                    )
                    if delay_seconds <= 0:
                        logger.info(
                            "Avvio sincronizzazione automatica da Google Sheets..."
                        )
                        try:
                            result = self._stock_sync(db, force=False)
                            logger.info(
                                "Sincronizzazione automatica completata: %s",
                                result,
                            )
                        except Exception as sync_error:
                            logger.error(
                                "Errore nella sincronizzazione automatica "
                                "Google Sheets: %s",
                                sync_error,
                            )
                            error_setting = (
                                db.query(AppSetting)
                                .filter(
                                    AppSetting.key == "google_sheet_last_error"
                                )
                                .first()
                            )
                            if error_setting:
                                error_setting.value = str(sync_error)
                            else:
                                db.add(
                                    AppSetting(
                                        key="google_sheet_last_error",
                                        value=str(sync_error),
                                    )
                                )
                            db.commit()
                    else:
                        sleep_seconds = min(
                            delay_seconds,
                            self._check_seconds,
                        )
            except Exception as loop_error:
                logger.error(
                    "Errore nel ciclo del worker Google Sheets: %s",
                    loop_error,
                )
            finally:
                db.close()

            if self._wait(sleep_seconds):
                break

    def _prestashop_orders_loop(self) -> None:
        logger.info("Worker ordini PrestaShop avviato.")
        while not self._stop_event.is_set():
            sleep_seconds = self._check_seconds
            db = self._session_factory()
            try:
                delay_seconds = _auto_sync_delay_seconds(
                    db,
                    "prestashop_sync_interval",
                    "prestashop_last_sync",
                )
                if delay_seconds <= 0:
                    logger.info(
                        "Avvio sincronizzazione automatica ordini da PrestaShop..."
                    )
                    try:
                        client = self._ps_client_factory(db)
                        result = self._order_sync(db, client, force=False)
                        logger.info(
                            "Sincronizzazione automatica ordini completata: %s",
                            result,
                        )
                    except Exception as sync_error:
                        logger.error(
                            "Errore nella sincronizzazione automatica ordini: %s",
                            sync_error,
                        )
                else:
                    sleep_seconds = min(
                        delay_seconds,
                        self._check_seconds,
                    )
            except Exception as loop_error:
                logger.error(
                    "Errore nel ciclo del worker PrestaShop: %s",
                    loop_error,
                )
            finally:
                db.close()

            if self._wait(sleep_seconds):
                break


sync_worker_manager = SyncWorkerManager()
