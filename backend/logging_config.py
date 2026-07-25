import logging

from backend.config import AppConfig


def configure_logging(config: AppConfig) -> None:
    logging.basicConfig(
        level=getattr(logging, config.log_level),
        format=config.log_format,
    )
