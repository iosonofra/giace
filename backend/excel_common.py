import math
import numbers
from io import BytesIO
from typing import Any

import openpyxl


def normalize_sku_cell(value: Any) -> str:
    if isinstance(value, bool):
        return str(value).strip()
    if isinstance(value, numbers.Integral):
        return str(int(value))
    if isinstance(value, numbers.Real):
        numeric_value = float(value)
        if math.isfinite(numeric_value) and numeric_value.is_integer():
            return str(int(numeric_value))
    return str(value).strip()


def load_excel_workbook(file_content, *, read_only=False):
    return openpyxl.load_workbook(
        BytesIO(file_content),
        data_only=not read_only,
        read_only=read_only,
    )


def read_header(sheet):
    row = next(sheet.iter_rows(min_row=1, max_row=1), None)
    if not row:
        return []
    return [
        str(cell.value).strip() if cell.value is not None else ""
        for cell in row
    ]


def find_column(
    header,
    names,
    *,
    required=False,
    label="",
):
    normalized = {
        value.lower(): index
        for index, value in enumerate(header)
    }
    for name in names:
        if name.lower() in normalized:
            return normalized[name.lower()]
    if required:
        available = ", ".join(filter(None, header))
        raise ValueError(
            f"Colonna '{label}' non trovata nella riga di intestazione "
            f"(colonne presenti: {available}).",
        )
    return None
