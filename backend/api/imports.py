import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.excel_parser import get_excel_sheets
from backend.services.association_import import (
    AssociationImportParseError,
    import_association_data,
)
from backend.services.warehouse_import import (
    WarehouseImportParseError,
    import_warehouse_data,
)


router = APIRouter(tags=["imports"])
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


@router.get("/api/import/sheets")
def get_local_sheets():
    """
    Returns sheet names of the local giacenza.xlsx in the workspace directory.
    """
    workspace_dir = PROJECT_ROOT
    filepath = os.path.join(workspace_dir, "giacenza.xlsx")
    if not os.path.exists(filepath):
         raise HTTPException(status_code=404, detail="File 'giacenza.xlsx' non trovato nella cartella di lavoro.")
         
    try:
        with open(filepath, "rb") as f:
            content = f.read()
        sheets = get_excel_sheets(content)
        return {"sheets": sheets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella lettura dei fogli Excel: {str(e)}")

@router.post("/api/import/warehouse")
def import_warehouse(
    file: Optional[UploadFile] = File(None),
    use_local: bool = Form(False),
    sheet_name: str = Form("ROSATE"),
    db: Session = Depends(get_db)
):
    filename = "giacenza.xlsx"
    file_content = None
    
    if use_local:
        workspace_dir = PROJECT_ROOT
        filepath = os.path.join(workspace_dir, "giacenza.xlsx")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File local 'giacenza.xlsx' non trovato nella cartella.")
        try:
            with open(filepath, "rb") as f:
                file_content = f.read()
            filename = "giacenza.xlsx (Locale)"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Errore nella lettura del file locale: {str(e)}")
    elif file is not None:
        filename = file.filename
        file_content = file.file.read()
    else:
        raise HTTPException(status_code=400, detail="Devi caricare un file o abilitare 'use_local=true'.")

    try:
        return import_warehouse_data(
            db,
            file_content,
            filename=filename,
            sheet_name=sheet_name,
        )
    except WarehouseImportParseError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

@router.post("/api/import/associations")
def import_associations(
    file: Optional[UploadFile] = File(None),
    use_local: bool = Form(False),
    db: Session = Depends(get_db)
):
    filename = "associazione.xlsx"
    file_content = None
    
    if use_local:
        workspace_dir = PROJECT_ROOT
        filepath = os.path.join(workspace_dir, "associazione.xlsx")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File local 'associazione.xlsx' non trovato nella cartella.")
        try:
            with open(filepath, "rb") as f:
                file_content = f.read()
            filename = "associazione.xlsx (Locale)"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Errore nella lettura del file locale: {str(e)}")
    elif file is not None:
        filename = file.filename
        file_content = file.file.read()
    else:
        raise HTTPException(status_code=400, detail="Devi caricare un file o abilitare 'use_local=true'.")

    try:
        return import_association_data(
            db,
            file_content,
            filename=filename,
        )
    except AssociationImportParseError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
