import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.dependencies import get_ps_client
from backend.calculator import run_calculation
from backend.database import get_db
from backend.prestashop_client import PrestaShopClient
from backend.services.dashboard_metrics import get_dashboard_metrics
from backend.services.system_status import get_system_status


router = APIRouter(tags=["system"])
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


@router.get("/api/status")
def get_status(db: Session = Depends(get_db), client: PrestaShopClient = Depends(get_ps_client)):
    return get_system_status(
        db,
        client,
        workspace_dir=PROJECT_ROOT,
    )


@router.post("/api/calc/run")
def run_calc(db: Session = Depends(get_db)):
    try:
        run_id = run_calculation(db)
        return {"status": "success", "calc_run_id": run_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/dashboard")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)
