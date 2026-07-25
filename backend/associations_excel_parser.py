from backend.excel_common import load_excel_workbook, normalize_sku_cell


def _association_anomaly(row_number, record_key, anomaly_type, message):
    return {
        "source": "associations_import",
        "record_key": record_key,
        "anomaly_type": anomaly_type,
        "message": message,
    }


def parse_associations_excel(file_content):
    associations = []
    anomalies = []
    try:
        sheet = load_excel_workbook(file_content).active
        for row_number, row in enumerate(
            sheet.iter_rows(values_only=True),
            start=1,
        ):
            if not any(cell is not None for cell in row):
                continue
            product_value = row[0] if row else None
            sku_list_value = row[1] if len(row) > 1 else None
            if product_value is None or not str(product_value).strip():
                anomalies.append(_association_anomaly(
                    row_number,
                    f"Riga {row_number}",
                    "missing_product_id",
                    (
                        f"Riga {row_number}: Product ID mancante, "
                        "riga ignorata."
                    ),
                ))
                continue
            try:
                product_id = int(float(str(product_value).strip()))
            except Exception:
                anomalies.append(_association_anomaly(
                    row_number,
                    str(product_value),
                    "invalid_product_id",
                    (
                        f"Riga {row_number}: Product ID non valido "
                        f"({product_value}), riga ignorata."
                    ),
                ))
                continue

            if sku_list_value is None or not str(sku_list_value).strip():
                anomalies.append(_association_anomaly(
                    row_number,
                    str(product_id),
                    "empty_sku_list",
                    (
                        f"Il prodotto '{product_id}' (Riga {row_number}) "
                        "ha un elenco SKU vuoto."
                    ),
                ))
                continue
            skus = [
                sku.strip()
                for sku in normalize_sku_cell(sku_list_value).split(",")
                if sku.strip()
            ]
            if not skus:
                anomalies.append(_association_anomaly(
                    row_number,
                    str(product_id),
                    "empty_sku_list",
                    (
                        f"Il prodotto '{product_id}' ha un elenco SKU "
                        "vuoto dopo la pulizia."
                    ),
                ))
                continue
            counts = {}
            for sku in skus:
                counts[sku] = counts.get(sku, 0) + 1
            associations.extend(
                {
                    "product_id": product_id,
                    "sku": sku,
                    "qty_required": quantity,
                }
                for sku, quantity in counts.items()
            )

        consolidated = {}
        for association in associations:
            key = (association["product_id"], association["sku"])
            if key not in consolidated:
                consolidated[key] = association
                continue
            previous = consolidated[key]["qty_required"]
            consolidated[key]["qty_required"] += association["qty_required"]
            anomalies.append(_association_anomaly(
                0,
                str(association["product_id"]),
                "duplicate_association",
                (
                    f"Il prodotto composto '{association['product_id']}' "
                    f"ha associazioni duplicate per la SKU "
                    f"'{association['sku']}'. Le quantità richieste sono "
                    f"state consolidate (Sommate: {previous} + "
                    f"{association['qty_required']} = "
                    f"{consolidated[key]['qty_required']})."
                ),
            ))
        return list(consolidated.values()), anomalies
    except Exception as error:
        raise ValueError(
            "Errore durante il parsing del file Excel di associazioni: "
            f"{error}",
        ) from error
