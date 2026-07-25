import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path


DEFAULT_APP_TITLE = "PrestaShop Composite Inventory Manager API"
DEFAULT_LOG_FORMAT = (
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
VALID_LOG_LEVELS = {
    "CRITICAL",
    "ERROR",
    "WARNING",
    "INFO",
    "DEBUG",
}


def _parse_origins(value: str) -> tuple[str, ...]:
    origins = tuple(
        origin.strip()
        for origin in value.split(",")
        if origin.strip()
    )
    return origins or ("*",)


def _parse_log_level(value: str) -> str:
    normalized = value.strip().upper()
    return normalized if normalized in VALID_LOG_LEVELS else "INFO"


@dataclass(frozen=True)
class AppConfig:
    title: str
    frontend_dist: Path
    cors_origins: tuple[str, ...]
    cors_allow_credentials: bool
    log_level: str
    log_format: str

    @classmethod
    def from_environment(
        cls,
        environment: Mapping[str, str] | None = None,
    ) -> "AppConfig":
        environment = os.environ if environment is None else environment
        project_root = Path(__file__).resolve().parent.parent
        configured_dist = environment.get("FRONTEND_DIST", "").strip()
        frontend_dist = (
            Path(configured_dist).expanduser().resolve()
            if configured_dist
            else project_root / "frontend" / "dist"
        )

        return cls(
            title=environment.get("APP_TITLE", DEFAULT_APP_TITLE),
            frontend_dist=frontend_dist,
            cors_origins=_parse_origins(
                environment.get("CORS_ORIGINS", "*")
            ),
            cors_allow_credentials=(
                environment.get("CORS_ALLOW_CREDENTIALS", "true")
                .strip()
                .lower()
                in {"true", "1", "yes"}
            ),
            log_level=_parse_log_level(
                environment.get("LOG_LEVEL", "INFO")
            ),
            log_format=environment.get(
                "LOG_FORMAT",
                DEFAULT_LOG_FORMAT,
            ),
        )
