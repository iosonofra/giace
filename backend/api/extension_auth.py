import hmac
import os
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import AppSetting


def verify_extension_api_token(
    provided_token: Optional[str],
    db: Session,
) -> bool:
    token_setting = (
        db.query(AppSetting)
        .filter(AppSetting.key == "extension_api_token")
        .first()
    )
    expected_token = (
        token_setting.value
        if token_setting
        else os.getenv("GIAC_EXTENSION_TOKEN", "")
    ).strip()
    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail=(
                "API estensione non disponibile: configura prima "
                "un token obbligatorio nelle impostazioni."
            ),
        )

    clean_provided_token = (provided_token or "").strip()
    if not clean_provided_token:
        raise HTTPException(
            status_code=401,
            detail="Token estensione obbligatorio.",
        )
    if not hmac.compare_digest(
        clean_provided_token,
        expected_token,
    ):
        raise HTTPException(
            status_code=401,
            detail="Token estensione non valido.",
        )
    return True


def require_extension_api_token(
    x_giac_extension_token: Optional[str] = Header(
        default=None,
        alias="X-Giac-Extension-Token",
    ),
    db: Session = Depends(get_db),
) -> bool:
    return verify_extension_api_token(
        x_giac_extension_token,
        db,
    )
