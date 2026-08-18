from dataclasses import dataclass

from backend.services.order_sync_check import parse_remote_datetime


class OrderSyncDeltaError(ValueError):
    """Raised when the lightweight remote snapshot cannot be trusted."""


@dataclass(frozen=True)
class OrderSyncDelta:
    changed_ids: list[int]
    removed_ids: list[int]
    unchanged_count: int
    remote_count: int


def build_order_sync_delta(
    remote_orders: list[dict],
    local_orders: list,
    stale_order_ids=(),
) -> OrderSyncDelta:
    remote_snapshot = {}
    for remote_order in remote_orders:
        try:
            order_id = int(remote_order["id"])
            current_state = int(remote_order["current_state"])
        except (KeyError, TypeError, ValueError) as error:
            raise OrderSyncDeltaError(
                "Snapshot remoto privo di ID o stato ordine valido."
            ) from error

        if order_id in remote_snapshot:
            raise OrderSyncDeltaError(
                f"Ordine remoto duplicato nello snapshot: {order_id}."
            )

        remote_date = parse_remote_datetime(
            remote_order.get("date_upd")
        )
        if remote_date is None:
            raise OrderSyncDeltaError(
                f"Data di aggiornamento non valida per l'ordine {order_id}."
            )
        remote_snapshot[order_id] = (remote_date, current_state)

    local_snapshot = {
        int(order.order_id): (
            order.date_upd,
            int(order.current_state),
        )
        for order in local_orders
    }
    stale_ids = {
        int(order_id)
        for order_id in stale_order_ids
    }
    changed_ids = sorted(
        order_id
        for order_id, remote_value in remote_snapshot.items()
        if (
            order_id not in local_snapshot
            or local_snapshot[order_id] != remote_value
            or order_id in stale_ids
        )
    )
    removed_ids = sorted(set(local_snapshot) - set(remote_snapshot))

    return OrderSyncDelta(
        changed_ids=changed_ids,
        removed_ids=removed_ids,
        unchanged_count=len(remote_snapshot) - len(changed_ids),
        remote_count=len(remote_snapshot),
    )
