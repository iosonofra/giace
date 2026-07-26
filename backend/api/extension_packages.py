import io
import json
import logging
import os
import zipfile
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import AppSetting


logger = logging.getLogger(__name__)
router = APIRouter(tags=["extensions"])
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
USERSCRIPT_VERSION = "0.1.2"


def _build_extension_archive_response(
    directory_name: str,
    filename_prefix: str,
    browser_label: str,
):
    extension_dir = os.path.join(PROJECT_ROOT, directory_name)
    manifest_path = os.path.join(extension_dir, "manifest.json")
    if (
        not os.path.isdir(extension_dir)
        or not os.path.isfile(manifest_path)
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                f"Pacchetto dell'estensione {browser_label} "
                "non disponibile."
            ),
        )

    try:
        with open(
            manifest_path,
            "r",
            encoding="utf-8",
        ) as manifest_file:
            manifest = json.load(manifest_file)
        version = str(
            manifest.get("version") or "beta"
        ).strip()
    except Exception:
        version = "beta"

    archive_buffer = io.BytesIO()
    with zipfile.ZipFile(
        archive_buffer,
        "w",
        compression=zipfile.ZIP_DEFLATED,
    ) as archive:
        for root, directories, files in os.walk(extension_dir):
            directories[:] = [
                directory
                for directory in directories
                if directory not in {"__pycache__", ".git"}
            ]
            for filename in files:
                if (
                    filename == ".DS_Store"
                    or filename.endswith((".pyc", ".zip"))
                ):
                    continue
                absolute_path = os.path.join(root, filename)
                archive_name = os.path.relpath(
                    absolute_path,
                    extension_dir,
                ).replace(os.sep, "/")
                archive.write(absolute_path, archive_name)

    archive_buffer.seek(0)
    download_filename = f"{filename_prefix}_{version}.zip"
    return StreamingResponse(
        archive_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{download_filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )


@router.get("/api/extension/download")
def download_chrome_extension():
    return _build_extension_archive_response(
        "chrome-extension",
        "giac_chrome_extension_beta",
        "Chrome",
    )


@router.get("/api/extension/firefox/download")
def download_firefox_extension():
    return _build_extension_archive_response(
        "firefox-extension",
        "giac_firefox_extension_beta",
        "Firefox",
    )


@router.get("/api/extension/firefox/install")
def install_signed_firefox_extension():
    signed_xpi_path = os.path.join(
        PROJECT_ROOT,
        "signed-xpi-giacenza.xpi",
    )
    if not os.path.isfile(signed_xpi_path):
        raise HTTPException(
            status_code=404,
            detail=(
                "Versione Firefox firmata da Mozilla "
                "non disponibile."
            ),
        )
    return FileResponse(
        signed_xpi_path,
        media_type="application/x-xpinstall",
        headers={
            "Content-Disposition": (
                'inline; filename="'
                'giac-feedback-ordini-firefox.xpi"'
            ),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


def _safe_userscript_origin(value: str) -> str:
    try:
        parsed = urlparse((value or "").strip())
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
        ):
            return ""
        if parsed.username or parsed.password:
            return ""
        return f"{parsed.scheme}://{parsed.netloc}"
    except (TypeError, ValueError):
        return ""


@router.get("/api/extension/userscript/download")
@router.get(
    "/api/extension/userscript/"
    "giac-feedback-ordini.user.js"
)
def download_userscript(
    request: Request,
    db: Session = Depends(get_db),
):
    adapter_path = os.path.join(
        PROJECT_ROOT,
        "userscript",
        "adapter.js",
    )
    content_script_path = os.path.join(
        PROJECT_ROOT,
        "chrome-extension",
        "content-script.js",
    )
    content_style_path = os.path.join(
        PROJECT_ROOT,
        "chrome-extension",
        "content-style.css",
    )
    if not all(
        os.path.isfile(path)
        for path in (
            adapter_path,
            content_script_path,
            content_style_path,
        )
    ):
        raise HTTPException(
            status_code=404,
            detail="Pacchetto userscript non disponibile.",
        )

    webapp_url = str(request.base_url).rstrip("/")
    prestashop_origin = _load_prestashop_origin(db)
    if not prestashop_origin:
        raise HTTPException(
            status_code=400,
            detail=(
                "Configura prima il dominio amministrazione "
                "PrestaShop nelle impostazioni della webapp."
            ),
        )

    try:
        adapter = _read_text(adapter_path)
        content_script = _read_text(content_script_path)
        content_style = _read_text(content_style_path)
    except OSError as error:
        logger.error(
            "Impossibile generare lo userscript: %s",
            error,
        )
        raise HTTPException(
            status_code=500,
            detail="Generazione userscript non riuscita.",
        ) from error

    adapter = adapter.replace(
        "__GIAC_WEBAPP_URL__",
        json.dumps(webapp_url),
    )
    adapter = adapter.replace(
        "__GIAC_PRESTASHOP_ORIGIN__",
        json.dumps(prestashop_origin),
    )
    metadata = _userscript_metadata(
        webapp_url,
        prestashop_origin,
    )
    generated_script = "\n".join(
        [
            metadata,
            adapter,
            f"  GM_addStyle({json.dumps(content_style)});",
            content_script,
            "})();",
            "",
        ]
    )
    return StreamingResponse(
        io.BytesIO(generated_script.encode("utf-8")),
        media_type="application/javascript; charset=utf-8",
        headers={
            "Content-Disposition": (
                'inline; filename="'
                'giac-feedback-ordini.user.js"'
            ),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


def _load_prestashop_origin(db):
    settings = {
        setting.key: setting.value
        for setting in (
            db.query(AppSetting)
            .filter(
                AppSetting.key.in_(
                    (
                        "prestashop_admin_url",
                        "prestashop_url",
                    )
                )
            )
            .all()
        )
    }
    return _safe_userscript_origin(
        settings.get("prestashop_admin_url", "")
        or settings.get("prestashop_url", "")
        or os.getenv("PRESTASHOP_URL", "")
    )


def _read_text(path):
    with open(path, "r", encoding="utf-8") as source_file:
        return source_file.read()


def _userscript_metadata(webapp_url, prestashop_origin):
    webapp_host = urlparse(webapp_url).hostname or "localhost"
    download_url = (
        f"{webapp_url}/api/extension/userscript/"
        "giac-feedback-ordini.user.js"
    )
    return "\n".join(
        [
            "// ==UserScript==",
            "// @name         Giac Feedback Ordini",
            "// @namespace    giac.feedback.ordini",
            f"// @version      {USERSCRIPT_VERSION}",
            (
                "// @description  Disponibilità e priorità "
                "cronologica negli ordini PrestaShop."
            ),
            f"// @match        {prestashop_origin}/*",
            f"// @connect      {webapp_host}",
            f"// @downloadURL  {download_url}",
            f"// @updateURL    {download_url}",
            "// @run-at       document-idle",
            "// @grant        GM_getValue",
            "// @grant        GM_setValue",
            "// @grant        GM_registerMenuCommand",
            "// @grant        GM_xmlhttpRequest",
            "// @grant        GM_addStyle",
            "// ==/UserScript==",
            "",
        ]
    )
