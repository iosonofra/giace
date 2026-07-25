from backend.app_factory import create_app
from backend.config import AppConfig
from backend.logging_config import configure_logging


config = AppConfig.from_environment()
configure_logging(config)

app = create_app(config=config)
