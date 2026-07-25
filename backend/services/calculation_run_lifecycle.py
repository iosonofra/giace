from datetime import datetime

from backend.models import CalcRun, ImportAnomaly


def start_calculation_run(
    db,
    *,
    now_factory=datetime.now,
):
    run = CalcRun(
        status="running",
        started_at=now_factory(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def assign_calculation_batches(
    db,
    run,
    batch_ids,
) -> None:
    run.warehouse_batch_id = batch_ids.warehouse
    run.associations_batch_id = batch_ids.associations
    db.commit()


def complete_calculation_run(
    db,
    run,
    *,
    now_factory=datetime.now,
) -> int:
    run.status = "completed"
    run.completed_at = now_factory()
    db.commit()
    return run.id


def fail_calculation_run(
    db,
    run,
    error: Exception,
    *,
    now_factory=datetime.now,
) -> None:
    db.rollback()
    run.status = "failed"
    run.completed_at = now_factory()
    db.commit()

    db.add(
        ImportAnomaly(
            source="calculation",
            record_key=f"Run {run.id}",
            anomaly_type="calculation_error",
            message=(
                "Errore critico durante il calcolo "
                f"della disponibilità: {error}"
            ),
        )
    )
    db.commit()
