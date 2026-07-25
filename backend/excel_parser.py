"""Stable public facade for the Excel parsers."""

from backend.associations_excel_parser import parse_associations_excel
from backend.excel_common import load_excel_workbook, normalize_sku_cell
from backend.picking_excel_parser import parse_picking_orders_excel
from backend.warehouse_excel_parser import parse_warehouse_excel

__all__ = [
    "get_excel_sheets",
    "normalize_sku_cell",
    "parse_associations_excel",
    "parse_picking_orders_excel",
    "parse_warehouse_excel",
]


def get_excel_sheets(file_content):
    try:
        return load_excel_workbook(
            file_content,
            read_only=True,
        ).sheetnames
    except Exception as error:
        raise ValueError(
            f"Impossibile leggere il file Excel: {error}",
        ) from error
