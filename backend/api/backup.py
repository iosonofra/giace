import logging
import os
import shutil
import sys
import threading
import time
from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.database import engine


logger = logging.getLogger(__name__)
router = APIRouter(tags=["backup"])
SQLITE_MAGIC = b"SQLite format 3\x00"


def get_db_path() -> str:
    """Return the absolute path to the configured SQLite database file."""
    db_url = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")
    raw_path = db_url.replace("sqlite:///", "")
    return os.path.abspath(raw_path)


@router.get("/api/backup")
def download_backup():
    """Download the full SQLite database as a binary file."""
    db_path = get_db_path()
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found.")

    today = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"inventory_backup_{today}.db"
    return FileResponse(
        path=db_path,
        media_type="application/octet-stream",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _schedule_server_restart() -> None:
    def restart():
        time.sleep(1.5)
        logger.info("Avvio del riavvio del server dopo il ripristino del database...")
        try:
            engine.dispose()
        except Exception:
            pass
        os.execv(sys.executable, [sys.executable] + sys.argv)

    threading.Thread(target=restart, daemon=True).start()


@router.post("/api/restore")
async def restore_backup(file: UploadFile = File(...)):
    """Restore the SQLite database from an uploaded file and restart the server."""
    db_path = get_db_path()
    content = await file.read()

    if content[:16] != SQLITE_MAGIC:
        raise HTTPException(
            status_code=400,
            detail="File non valido: non è un database SQLite. Il ripristino è stato annullato.",
        )

    pre_restore_path = db_path.replace(".db", "_pre_restore.db")
    try:
        if os.path.exists(db_path):
            shutil.copy2(db_path, pre_restore_path)
            logger.info("Pre-restore backup salvato in: %s", pre_restore_path)
    except Exception as error:
        logger.warning("Impossibile creare backup pre-ripristino: %s", error)

    try:
        with open(db_path, "wb") as database_file:
            database_file.write(content)
        logger.info(
            "Database ripristinato con successo da: %s (%s bytes)",
            file.filename,
            len(content),
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Errore nella scrittura del database: {error}",
        ) from error

    _schedule_server_restart()
    return {
        "status": "success",
        "message": "Database ripristinato. Il server si sta riavviando...",
        "bytes_written": len(content),
        "pre_restore_backup": os.path.basename(pre_restore_path),
    }
