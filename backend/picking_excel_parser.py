from backend.excel_common import (
    find_column,
    load_excel_workbook,
    read_header,
)


def _picking_anomaly(filename, row_number, record, anomaly_type, message):
    return {
        "source": "file_picking_import",
        "record_key": f"{filename} - {record}",
        "anomaly_type": anomaly_type,
        "message": message,
    }


def parse_picking_orders_excel(file_content, filename):
    valid_rows = []
    order_refs = set()
    anomalies = []
    try:
        sheet = load_excel_workbook(file_content).active
        header = read_header(sheet)
        if not header:
            raise ValueError(
                "Il file Excel è vuoto o non contiene un'intestazione.",
            )
        product_index = find_column(
            header,
            [
                "id prodotto",
                "id_prodotto",
                "id_product",
                "product_id",
                "id",
                "product id",
            ],
            required=True,
            label="ID prodotto",
        )
        quantity_index = find_column(
            header,
            [
                "quantità del prodotto",
                "quantita del prodotto",
                "quantità",
                "quantita",
                "qty",
                "quantity",
                "quantit del prodotto",
                "qta",
            ],
            required=True,
            label="Quantità del prodotto",
        )
        reference_index = find_column(
            header,
            [
                "riferimento ordine",
                "riferimento",
                "reference",
                "order_reference",
                "order reference",
                "id_order",
                "order_id",
                "order id",
            ],
        )
        customer_index = find_column(
            header,
            ["cliente", "customer", "customer_name", "customer name"],
        )

        for row_number, row in enumerate(
            sheet.iter_rows(min_row=2, values_only=True),
            start=2,
        ):
            if not any(cell is not None for cell in row):
                continue
            product_value = (
                row[product_index]
                if product_index < len(row)
                else None
            )
            quantity_value = (
                row[quantity_index]
                if quantity_index < len(row)
                else None
            )
            reference_value = (
                row[reference_index]
                if reference_index is not None
                and reference_index < len(row)
                else None
            )
            customer_value = (
                row[customer_index]
                if customer_index is not None
                and customer_index < len(row)
                else None
            )
            if product_value is None or not str(product_value).strip():
                anomalies.append(_picking_anomaly(
                    filename,
                    row_number,
                    f"Riga {row_number}",
                    "missing_product_id",
                    (
                        f"File '{filename}', riga {row_number}: ID prodotto "
                        "vuoto o mancante, riga ignorata."
                    ),
                ))
                continue
            try:
                product_id = int(float(str(product_value).strip()))
            except Exception:
                anomalies.append(_picking_anomaly(
                    filename,
                    row_number,
                    f"Riga {row_number}",
                    "invalid_product_id",
                    (
                        f"File '{filename}', riga {row_number}: ID prodotto "
                        f"non valido ('{product_value}'), riga ignorata."
                    ),
                ))
                continue
            try:
                if quantity_value is None:
                    raise ValueError("Quantità mancante")
                quantity = float(
                    str(quantity_value).replace(",", ".").strip(),
                )
                if quantity <= 0:
                    anomalies.append(_picking_anomaly(
                        filename,
                        row_number,
                        f"ID {product_id}",
                        "invalid_quantity",
                        (
                            f"File '{filename}', riga {row_number} "
                            f"(ID {product_id}): Quantità non positiva "
                            f"({quantity_value})."
                        ),
                    ))
                    continue
            except Exception:
                anomalies.append(_picking_anomaly(
                    filename,
                    row_number,
                    f"ID {product_id}",
                    "invalid_quantity",
                    (
                        f"File '{filename}', riga {row_number} "
                        f"(ID {product_id}): Quantità non valida o "
                        f"mancante ('{quantity_value}')."
                    ),
                ))
                continue

            order_reference = (
                str(reference_value).strip()
                if reference_value is not None
                and str(reference_value).strip()
                else None
            )
            customer = (
                str(customer_value).strip()
                if customer_value is not None
                and str(customer_value).strip()
                else None
            )
            if order_reference:
                order_refs.add(order_reference)
            valid_rows.append({
                "product_id": product_id,
                "quantity": quantity,
                "order_ref": order_reference,
                "customer": customer,
            })
        return valid_rows, list(order_refs), anomalies
    except Exception as error:
        if isinstance(error, ValueError):
            raise
        raise ValueError(
            f"Errore durante il parsing del file Excel '{filename}': {error}",
        ) from error
