import threading
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class SyncProgressSnapshot:
    active: bool
    total_orders: int
    synced_orders: int
    phase: str
    error_message: str


class SyncProgress:
    def __init__(self):
        self._lock = threading.RLock()
        self._active = False
        self._total_orders = 0
        self._synced_orders = 0
        self._phase = "idle"
        self._error_message = ""

    @property
    def active(self) -> bool:
        with self._lock:
            return self._active

    @property
    def total_orders(self) -> int:
        with self._lock:
            return self._total_orders

    @property
    def synced_orders(self) -> int:
        with self._lock:
            return self._synced_orders

    @property
    def phase(self) -> str:
        with self._lock:
            return self._phase

    @property
    def error_message(self) -> str:
        with self._lock:
            return self._error_message

    def start(self) -> None:
        with self._lock:
            self._active = True
            self._total_orders = 0
            self._synced_orders = 0
            self._phase = "fetching_orders"
            self._error_message = ""

    def update(
        self,
        phase=None,
        synced_orders=None,
        total_orders=None,
        error_message=None,
    ) -> None:
        with self._lock:
            if phase:
                self._phase = phase
            if synced_orders is not None:
                self._synced_orders = synced_orders
            if total_orders is not None:
                self._total_orders = total_orders
            if error_message:
                self._error_message = error_message
                self._phase = "error"

    def stop(
        self,
        success: bool = True,
        error_msg: str | None = None,
    ) -> None:
        with self._lock:
            self._active = False
            if success:
                self._phase = "completed"
            else:
                self._phase = "error"
                self._error_message = (
                    error_msg or "Errore sconosciuto"
                )

    def snapshot(self) -> SyncProgressSnapshot:
        with self._lock:
            return SyncProgressSnapshot(
                active=self._active,
                total_orders=self._total_orders,
                synced_orders=self._synced_orders,
                phase=self._phase,
                error_message=self._error_message,
            )

    def as_dict(self) -> dict:
        return asdict(self.snapshot())
