from backend.excel_common import (
    find_column,
    load_excel_workbook,
    normalize_sku_cell,
    read_header,
)


def _trim_trailing_spacers(rows):
    last_real_index = next(
        (
            index
            for index in range(len(rows) - 1, -1, -1)
            if not rows[index]["sku"].startswith("__spacer_")
        ),
        -1,
    )
    if last_real_index != -1:
        if len(rows) - 1 - last_real_index > 5:
            return rows[:last_real_index + 1]
        return rows
    return [] if len(rows) > 5 else rows


def parse_warehouse_excel(
    file_content,
    sheet_name,
    col_sku="Sku",
    col_qty="Qta Tot.",
    col_desc="Descrizione Sku",
    col_lotto="Lotto",
):
    try:
        workbook = load_excel_workbook(file_content)
        if sheet_name not in workbook.sheetnames:
            raise ValueError(
                f"Foglio '{sheet_name}' non trovato nel file Excel.",
            )
        sheet = workbook[sheet_name]
        header = read_header(sheet)
        sku_index = find_column(
            header,
            [col_sku, "sku"],
            required=True,
            label=col_sku,
        )
        quantity_index = find_column(
            header,
            [
                col_qty,
                "qta tot.",
                "qty tot",
                "quantità",
                "qta",
                "quantity",
            ],
            required=True,
            label=col_qty,
        )
        description_index = find_column(
            header,
            [col_desc, "descrizione sku", "descrizione", "description"],
        )
        lot_index = find_column(header, [col_lotto, "lotto", "lot"])

        rows = []
        anomalies = []
        seen_skus = set()
        for row_number, row in enumerate(
            sheet.iter_rows(min_row=2, values_only=True),
            start=2,
        ):
            if not any(cell is not None for cell in row):
                rows.append({
                    "sku": f"__spacer_{row_number}",
                    "description": "",
                    "lotto": "",
                    "qty_total": 0.0,
                })
                continue

            sku_value = row[sku_index] if sku_index < len(row) else None
            quantity_value = (
                row[quantity_index]
                if quantity_index < len(row)
                else None
            )
            if sku_value is None or not str(sku_value).strip():
                anomalies.append({
                    "source": "stock_import",
                    "record_key": f"Riga {row_number}",
                    "anomaly_type": "missing_sku",
                    "message": (
                        f"Riga {row_number}: SKU vuota o mancante, "
                        "riga ignorata."
                    ),
                })
                continue
            sku = normalize_sku_cell(sku_value)
            try:
                if quantity_value is None:
                    raise ValueError("Quantità mancante")
                quantity = float(quantity_value)
                if quantity < 0:
                    anomalies.append({
                        "source": "stock_import",
                        "record_key": sku,
                        "anomaly_type": "negative_quantity",
                        "message": (
                            f"La SKU '{sku}' ha una quantità negativa "
                            f"alla riga {row_number}: {quantity}."
                        ),
                    })
            except Exception:
                anomalies.append({
                    "source": "stock_import",
                    "record_key": sku,
                    "anomaly_type": "invalid_quantity",
                    "message": (
                        f"Riga {row_number} (SKU: {sku}): Quantità non "
                        f"numerica o mancante ('{quantity_value}'). "
                        "Riga ignorata."
                    ),
                })
                continue

            description = (
                str(row[description_index]).strip()
                if description_index is not None
                and description_index < len(row)
                and row[description_index] is not None
                else ""
            )
            lot = (
                str(row[lot_index]).strip()
                if lot_index is not None
                and lot_index < len(row)
                and row[lot_index] is not None
                else ""
            )
            if sku in seen_skus:
                anomalies.append({
                    "source": "stock_import",
                    "record_key": sku,
                    "anomaly_type": "duplicate_sku",
                    "message": (
                        f"La SKU '{sku}' compare più volte nel file di "
                        f"stock (riga {row_number}). Questa riga viene "
                        "importata separatamente."
                    ),
                })
            else:
                seen_skus.add(sku)
            rows.append({
                "sku": sku,
                "description": description,
                "lotto": lot,
                "qty_total": quantity,
            })
        return _trim_trailing_spacers(rows), anomalies
    except Exception as error:
        if isinstance(error, ValueError):
            raise
        raise ValueError(
            f"Errore durante il parsing del file Excel di stock: {error}",
        ) from error
