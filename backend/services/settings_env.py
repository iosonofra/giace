import json
import logging
import os
from collections.abc import Mapping
from pathlib import Path

from backend.models import AppSetting


logger = logging.getLogger(__name__)
BACKEND_DIR = str(Path(__file__).resolve().parent.parent)


def _environment_values(
    settings: dict[str, str],
    environment: Mapping[str, str],
) -> dict[str, str]:
    values = {
        "PRESTASHOP_URL": settings.get("prestashop_url", ""),
        "PRESTASHOP_API_KEY": settings.get(
            "prestashop_api_key",
            "",
        ),
        "MOCK_MODE": settings.get("prestashop_mock_mode", "True"),
        "DATABASE_URL": environment.get(
            "DATABASE_URL",
            "sqlite:///./inventory.db",
        ),
        "DEFAULT_STATE_IDS": settings.get(
            "included_state_ids",
            "",
        ),
        "GIAC_EXTENSION_TOKEN": settings.get(
            "extension_api_token",
            environment.get("GIAC_EXTENSION_TOKEN", ""),
        ),
    }

    values["MOCK_MODE"] = (
        "True"
        if values["MOCK_MODE"].lower() in {"true", "1", "yes"}
        else "False"
    )
    try:
        state_ids = json.loads(values["DEFAULT_STATE_IDS"])
        if isinstance(state_ids, list):
            values["DEFAULT_STATE_IDS"] = ",".join(
                str(state_id)
                for state_id in state_ids
            )
    except (TypeError, ValueError, json.JSONDecodeError):
        pass
    return values


def sync_env_file(
    db,
    backend_dir: str | Path = BACKEND_DIR,
    environment: Mapping[str, str] | None = None,
) -> bool:
    environment = os.environ if environment is None else environment
    backend_path = Path(backend_dir)
    env_path = backend_path / ".env"
    example_path = backend_path / ".env.example"
    source_path = env_path if env_path.exists() else example_path

    try:
        lines = source_path.read_text(encoding="utf-8").splitlines(
            keepends=True
        )
    except Exception:
        lines = []

    settings = {
        setting.key: setting.value
        for setting in db.query(AppSetting).all()
    }
    values = _environment_values(settings, environment)
    written_keys = set()
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#") or "=" not in stripped:
            new_lines.append(line)
            continue

        key = stripped.split("=", 1)[0].strip()
        if key in values:
            new_lines.append(f"{key}={values[key]}\n")
            written_keys.add(key)
        else:
            new_lines.append(line)

    for key, value in values.items():
        if key not in written_keys and value:
            new_lines.append(f"{key}={value}\n")

    try:
        env_path.write_text("".join(new_lines), encoding="utf-8")
        logger.info("backend/.env aggiornato con le impostazioni correnti.")
        return True
    except Exception as error:
        logger.warning(
            "Impossibile aggiornare backend/.env: %s",
            error,
        )
        return False
