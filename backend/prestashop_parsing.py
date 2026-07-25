from typing import Any


def clean_localized_name(value: Any) -> str:
    if not value:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        if value and isinstance(value[0], dict):
            for item in value:
                if item.get("id") == "1":
                    return str(item.get("value") or "").strip()
            return str(value[0].get("value") or "").strip()
        return str(value[0]).strip() if value else ""
    if isinstance(value, dict):
        if "value" in value:
            return str(value["value"] or "").strip()
        if "language" in value:
            return clean_localized_name(value["language"])
        for key in ("1", 1):
            if key in value:
                return str(value[key] or "").strip()
        if value:
            first_key = next(iter(value))
            return str(value[first_key] or "").strip()
    return str(value).strip()
