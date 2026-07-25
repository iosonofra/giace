from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.extension_auth import (
    require_extension_api_token,
    verify_extension_api_token as _verify_extension_api_token,
)
from backend.api.extension_packages import (
    _safe_userscript_origin,
    download_chrome_extension,
    download_firefox_extension,
    download_userscript,
    install_signed_firefox_extension,
)
from backend.database import get_db
from backend.services.auto_picking_runner import (
    AutoPickingRequestError,
    run_auto_picking,
)
from backend.services.extension_availability import (
    ExtensionAvailabilityError,
    build_orders_availability,
)


router = APIRouter(tags=["extensions"])


@router.get("/api/extension/health")
def extension_health(
    token_required: bool = Depends(
        require_extension_api_token
    ),
):
    return {
        "status": "ok",
        "extension_api": True,
        "token_required": token_required,
    }


@router.post("/api/extension/orders-availability")
def extension_orders_availability(
    payload: dict,
    db: Session = Depends(get_db),
    token_required: bool = Depends(
        require_extension_api_token
    ),
):
    try:
        return build_orders_availability(
            db,
            payload,
            token_required=token_required,
            simulation_runner=run_auto_picking,
        )
    except (
        AutoPickingRequestError,
        ExtensionAvailabilityError,
    ) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
