import json
import os
import re
from collections.abc import Mapping

import requests

from backend.models import AppSetting


class SettingsValidationError(ValueError):
    pass


def _setting(db, key: str):
    return (
        db.query(AppSetting)
        .filter(AppSetting.key == key)
        .first()
    )


def _current_value(
    db,
    key: str,
    fallback: str = "",
) -> str:
    setting = _setting(db, key)
    return setting.value if setting else fallback


def _upsert(db, key: str, value: str) -> None:
    setting = _setting(db, key)
    if setting:
        setting.value = value
    else:
        db.add(AppSetting(key=key, value=value))


def _require_string(
    value,
    error_message: str,
) -> str:
    if not isinstance(value, str):
        raise SettingsValidationError(error_message)
    return value.strip()


def _positive_integer(value, error_message: str) -> str:
    try:
        parsed = int(value)
        if parsed < 1 or parsed > 1440:
            raise ValueError
    except (TypeError, ValueError) as error:
        raise SettingsValidationError(error_message) from error
    return str(parsed)


def _validate_extension_token(value) -> str:
    token = _require_string(
        value,
        "Il token estensione deve essere una stringa.",
    )
    if not token:
        raise SettingsValidationError(
            "Il token estensione è obbligatorio. "
            "Genera un token sicuro prima di salvare."
        )
    if len(token) < 16:
        raise SettingsValidationError(
            "Il token estensione deve contenere almeno 16 caratteri."
        )
    if len(token) > 256 or not re.fullmatch(
        r"[A-Za-z0-9._~-]+",
        token,
    ):
        raise SettingsValidationError(
            "Il token estensione può contenere solo lettere, numeri, "
            "punto, trattino e underscore (massimo 256 caratteri)."
        )
    return token


def _validate_real_connection(
    db,
    payload: dict,
    environment: Mapping[str, str],
    request_get,
) -> None:
    target_mock = payload.get("prestashop_mock_mode")
    if target_mock is None:
        target_mock = _current_value(
            db,
            "prestashop_mock_mode",
            environment.get("MOCK_MODE", "True"),
        ).lower() in {"true", "1", "yes"}
    if target_mock:
        return

    target_url = payload.get("prestashop_url")
    if target_url is None:
        target_url = _current_value(
            db,
            "prestashop_url",
            environment.get("PRESTASHOP_URL", ""),
        )
    target_key = payload.get("prestashop_api_key")
    if target_key is None:
        target_key = _current_value(
            db,
            "prestashop_api_key",
            environment.get("PRESTASHOP_API_KEY", ""),
        )

    if not target_url or not target_key:
        raise SettingsValidationError(
            "Per disattivare la modalità simulazione, devi "
            "configurare l'URL del sito e la chiave API di PrestaShop."
        )

    clean_url = target_url.rstrip("/") + "/"
    try:
        response = request_get(
            f"{clean_url}order_states",
            params={
                "display": "[id]",
                "output_format": "JSON",
                "ws_key": target_key,
            },
            timeout=8,
        )
        response.raise_for_status()
    except requests.Timeout as error:
        raise SettingsValidationError(
            "PrestaShop non ha risposto entro 8 secondi. "
            "Controlla la raggiungibilità del negozio e riprova."
        ) from error
    except requests.ConnectionError as error:
        raise SettingsValidationError(
            "Server PrestaShop non raggiungibile. "
            "Controlla URL, rete e certificato HTTPS."
        ) from error
    except requests.HTTPError as error:
        status_code = getattr(error.response, "status_code", None)
        if status_code in {401, 403}:
            message = (
                "Chiave API rifiutata o priva dei permessi necessari. "
                "Verifica la chiave e abilita la lettura degli stati ordine."
            )
        elif status_code == 404:
            message = (
                "Endpoint Webservice non trovato. "
                "Controlla che l'URL termini con /api/."
            )
        else:
            status_label = f" {status_code}" if status_code else ""
            message = f"PrestaShop ha restituito un errore HTTP{status_label}."
        raise SettingsValidationError(message) from error
    except Exception as error:
        raise SettingsValidationError(
            "Errore di connessione a PrestaShop: "
            f"{error}. Controlla l'URL "
            "(es: https://mio-sito.com/api) e la Chiave API."
        ) from error


def write_settings(
    db,
    payload: dict,
    environment: Mapping[str, str] | None = None,
    request_get=None,
) -> None:
    environment = os.environ if environment is None else environment
    request_get = request_get or requests.get
    _validate_real_connection(
        db,
        payload,
        environment,
        request_get,
    )

    state_ids = payload.get("included_state_ids")
    if state_ids is not None:
        if not isinstance(state_ids, list):
            raise SettingsValidationError(
                "Formato non valido. 'included_state_ids' deve essere "
                "una lista di interi."
            )
        try:
            parsed_ids = [int(state_id) for state_id in state_ids]
        except (TypeError, ValueError) as error:
            raise SettingsValidationError(
                "Tutti gli ID degli stati devono essere numeri interi."
            ) from error
        _upsert(db, "included_state_ids", json.dumps(parsed_ids))

    string_fields = {
        "prestashop_url": "L'URL deve essere una stringa.",
        "prestashop_admin_url": (
            "L'URL del pannello di amministrazione deve essere "
            "una stringa."
        ),
        "prestashop_api_key": "La chiave API deve essere una stringa.",
        "google_sheet_url": (
            "L'URL del foglio deve essere una stringa."
        ),
        "google_sheet_name": (
            "Il nome del foglio deve essere una stringa."
        ),
        "mapping_sku": (
            "Il nome della colonna SKU deve essere una stringa."
        ),
        "mapping_qty": (
            "Il nome della colonna Quantità deve essere una stringa."
        ),
        "mapping_desc": (
            "Il nome della colonna Descrizione deve essere una stringa."
        ),
        "mapping_lotto": (
            "Il nome della colonna Lotto deve essere una stringa."
        ),
        "picking_sheet_webapp_url": (
            "L'URL Apps Script deve essere una stringa."
        ),
        "picking_sheet_remaining_header": (
            "La colonna residuo Apps Script deve essere una stringa."
        ),
    }
    for key, error_message in string_fields.items():
        if payload.get(key) is not None:
            _upsert(
                db,
                key,
                _require_string(payload[key], error_message),
            )

    if payload.get("extension_api_token") is not None:
        _upsert(
            db,
            "extension_api_token",
            _validate_extension_token(
                payload["extension_api_token"]
            ),
        )

    picking_sheet_secret = payload.get("picking_sheet_shared_secret")
    if picking_sheet_secret is not None:
        picking_sheet_secret = _require_string(
            picking_sheet_secret,
            "Il secret Apps Script deve essere una stringa.",
        )
        if picking_sheet_secret:
            if len(picking_sheet_secret) < 32 or len(picking_sheet_secret) > 256:
                raise SettingsValidationError(
                    "Il secret Apps Script deve contenere da 32 a 256 caratteri."
                )
            _upsert(db, "picking_sheet_shared_secret", picking_sheet_secret)

    mock_mode = payload.get("prestashop_mock_mode")
    if mock_mode is not None:
        if not isinstance(mock_mode, bool):
            raise SettingsValidationError(
                "prestashop_mock_mode deve essere un booleano."
            )
        _upsert(
            db,
            "prestashop_mock_mode",
            "true" if mock_mode else "false",
        )

    stock_source = payload.get("stock_source")
    if stock_source is not None:
        if stock_source not in {"local_upload", "google_sheets"}:
            raise SettingsValidationError("Sorgente stock non valida.")
        _upsert(db, "stock_source", stock_source)

    exclude_return_lots = payload.get("exclude_return_lots")
    if exclude_return_lots is not None:
        if not isinstance(exclude_return_lots, bool):
            raise SettingsValidationError(
                "exclude_return_lots deve essere un booleano."
            )
        _upsert(
            db,
            "exclude_return_lots",
            "true" if exclude_return_lots else "false",
        )

    picking_sheet_write_enabled = payload.get(
        "picking_sheet_write_enabled"
    )
    if picking_sheet_write_enabled is not None:
        if not isinstance(picking_sheet_write_enabled, bool):
            raise SettingsValidationError(
                "picking_sheet_write_enabled deve essere un booleano."
            )
        target_url = payload.get(
            "picking_sheet_webapp_url",
            _current_value(db, "picking_sheet_webapp_url"),
        )
        target_secret = picking_sheet_secret or _current_value(
            db,
            "picking_sheet_shared_secret",
        )
        target_remaining_header = payload.get(
            "picking_sheet_remaining_header",
            _current_value(db, "picking_sheet_remaining_header", "RIMANENTI"),
        )
        if picking_sheet_write_enabled:
            if not re.fullmatch(
                r"https://script\.google\.com/macros/s/[^/]+/exec",
                str(target_url or "").strip(),
            ):
                raise SettingsValidationError(
                    "Inserisci l'URL /exec della Web App Apps Script."
                )
            if len(str(target_secret or "")) < 32:
                raise SettingsValidationError(
                    "Configura un secret Apps Script di almeno 32 caratteri."
                )
            if not str(target_remaining_header or "").strip():
                raise SettingsValidationError(
                    "Configura il nome della colonna residuo."
                )
        _upsert(
            db,
            "picking_sheet_write_enabled",
            "true" if picking_sheet_write_enabled else "false",
        )

    day_mapping = payload.get("picking_sheet_day_mapping")
    if day_mapping is not None:
        required_keys = (
            "monday", "tuesday", "wednesday", "thursday", "friday",
            "saturday", "sunday",
        )
        if not isinstance(day_mapping, dict) or set(day_mapping) != set(required_keys):
            raise SettingsValidationError(
                "La mappatura dei giorni non è valida."
            )
        normalized_mapping = {}
        for key in required_keys:
            label = _require_string(
                day_mapping[key],
                "Le intestazioni dei giorni devono essere testuali.",
            )
            if len(label) > 40:
                raise SettingsValidationError(
                    "Le intestazioni dei giorni possono contenere al massimo 40 caratteri."
                )
            normalized_mapping[key] = label
        if any(not normalized_mapping[key] for key in (
            "monday", "tuesday", "wednesday", "thursday", "friday"
        )):
            raise SettingsValidationError(
                "Configura le intestazioni da lunedì a venerdì."
            )
        _upsert(
            db,
            "picking_sheet_day_mapping",
            json.dumps(normalized_mapping, ensure_ascii=False),
        )

    excluded_lot_keywords = payload.get("excluded_lot_keywords")
    if excluded_lot_keywords is not None:
        if not isinstance(excluded_lot_keywords, list):
            raise SettingsValidationError(
                "Le parole dei lotti esclusi devono essere una lista."
            )
        normalized_keywords = []
        for value in excluded_lot_keywords:
            if not isinstance(value, str):
                raise SettingsValidationError(
                    "Ogni parola dei lotti esclusi deve essere testuale."
                )
            keyword = value.strip().upper()
            if not keyword:
                continue
            if len(keyword) > 30:
                raise SettingsValidationError(
                    "Le parole dei lotti esclusi possono contenere "
                    "al massimo 30 caratteri."
                )
            if keyword not in normalized_keywords:
                normalized_keywords.append(keyword)
        if not normalized_keywords:
            raise SettingsValidationError(
                "Configura almeno una parola per i lotti esclusi."
            )
        _upsert(
            db,
            "excluded_lot_keywords",
            json.dumps(normalized_keywords),
        )

    interval_fields = {
        "google_sheet_sync_interval": (
            "L'intervallo deve essere compreso tra 1 e 1440 minuti."
        ),
        "prestashop_sync_interval": (
            "L'intervallo di sincronizzazione ordini deve essere "
            "compreso tra 1 e 1440 minuti."
        ),
    }
    for key, error_message in interval_fields.items():
        if payload.get(key) is not None:
            _upsert(
                db,
                key,
                _positive_integer(payload[key], error_message),
            )

    db.commit()
