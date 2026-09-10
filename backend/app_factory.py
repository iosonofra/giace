import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.anomalies import router as anomalies_router
from backend.api.associations import router as associations_router
from backend.api.backup import router as backup_router
from backend.api.extension_packages import (
    router as extension_packages_router,
)
from backend.api.extensions import router as extensions_router
from backend.api.gaer import router as gaer_router
from backend.api.imports import router as imports_router
from backend.api.orders import router as orders_router
from backend.api.picking import router as picking_router
from backend.api.picking_analysis import router as picking_analysis_router
from backend.api.picking_history import router as picking_history_router
from backend.api.picking_sheet_write import router as picking_sheet_write_router
from backend.api.picking_sessions import router as picking_sessions_router
from backend.api.prestashop import router as prestashop_router
from backend.api.settings import router as settings_router
from backend.api.stock import router as stock_router
from backend.api.stock_products import router as stock_products_router
from backend.api.system import router as system_router
from backend.config import AppConfig
from backend.database import SessionLocal, engine
from backend.db_schema import initialize_database
from backend.services.default_settings import initialize_default_settings
from backend.services.sync_workers import sync_worker_manager


logger = logging.getLogger(__name__)

API_ROUTERS = (
    stock_router,
    stock_products_router,
    associations_router,
    anomalies_router,
    system_router,
    backup_router,
    orders_router,
    picking_router,
    picking_analysis_router,
    picking_history_router,
    picking_sheet_write_router,
    picking_sessions_router,
    extensions_router,
    extension_packages_router,
    imports_router,
    gaer_router,
    prestashop_router,
    settings_router,
)

FRONTEND_PAGE_PATHS = (
    "/dashboard",
    "/stock",
    "/orders",
    "/picking",
    "/anomalies",
    "/associations",
    "/settings",
)


def create_lifespan(
    database_initializer=initialize_database,
    session_factory=SessionLocal,
    settings_initializer=initialize_default_settings,
    worker_manager=sync_worker_manager,
    database_engine=engine,
):
    @asynccontextmanager
    async def lifespan(_app):
        database_initializer()
        db = session_factory()
        try:
            settings_initializer(db)
            logger.info(
                "Impostazioni inizializzate con successo nel database."
            )
            worker_manager.start()
        except Exception:
            logger.exception(
                "Errore nell'inizializzazione delle impostazioni."
            )
        finally:
            db.close()

        try:
            yield
        finally:
            try:
                worker_manager.stop()
            finally:
                database_engine.dispose()

    return lifespan


def create_app(
    *,
    config: AppConfig | None = None,
    lifespan=None,
    frontend_dist: str | Path | None = None,
) -> FastAPI:
    config = config or AppConfig.from_environment()
    app = FastAPI(
        title=config.title,
        lifespan=lifespan or create_lifespan(),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(config.cors_origins),
        allow_credentials=config.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for router in API_ROUTERS:
        app.include_router(router)

    static_path = (
        Path(frontend_dist)
        if frontend_dist is not None
        else config.frontend_dist
    )
    if static_path.exists():
        index_path = static_path / "index.html"

        def serve_frontend_page():
            return FileResponse(index_path)

        for page_path in FRONTEND_PAGE_PATHS:
            app.add_api_route(
                page_path,
                serve_frontend_page,
                methods=["GET", "HEAD"],
                include_in_schema=False,
            )

        app.mount(
            "/",
            StaticFiles(directory=static_path, html=True),
            name="static",
        )
        logger.info("Frontend static files mounted from: %s", static_path)
    else:
        logger.warning(
            "Frontend build folder '%s' not found. Serving API only. "
            "Run 'npm run build' in frontend first.",
            static_path,
        )

        @app.get("/")
        def read_root():
            return {
                "message": (
                    "PrestaShop Inventory Backend API is running. "
                    "Build the frontend or run Vite dev server to access the UI."
                ),
                "api_docs": "/docs",
            }

    return app
