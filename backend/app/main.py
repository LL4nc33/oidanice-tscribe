"""FastAPI application entry point.

WHY: The lifespan context manager pattern (replacing deprecated on_event)
ensures database tables are created before the first request arrives.
CORS middleware is configured from settings so allowed origins can be
changed per environment without code changes.
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routes import health, jobs

# WHY: Structured logging configured at module level (before any request)
# so all library and application logs follow a consistent, parseable format.
# Mirrors the pattern in run_worker.py for uniform log output across services.
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("tscribe.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup, clean up on shutdown.

    WHY: Lifespan replaces the deprecated @app.on_event decorators and
    provides a single place for startup/shutdown logic. We create DB
    tables here so the app works immediately after first deploy without
    manual migration steps.
    """
    logger.info("Starting %s (debug=%s, log_level=%s)", settings.app_name, settings.debug, settings.log_level)
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down")


def create_app() -> FastAPI:
    """Application factory that wires together middleware and routes.

    WHY: Factory pattern allows creating multiple app instances (e.g. for
    testing with overridden settings) and keeps configuration logic in
    one discoverable place rather than scattered at module level.
    """
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
        debug=settings.debug,
    )

    # WHY: CORS must be configured for the frontend dev server (Vite on :5173)
    # to communicate with the API. Origins come from settings so production
    # can lock this down to the actual domain.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # WHY: All routes live under /api so the frontend can be served from
    # the same domain without path conflicts, and reverse proxies can
    # route by prefix.
    app.include_router(health.router, prefix="/api")
    app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])

    return app


app = create_app()
