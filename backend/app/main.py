from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import os

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.middleware.logging_middleware import LoggingMiddleware
from app.utils.exceptions import http_exception_handler, validation_exception_handler, unhandled_exception_handler

os.makedirs("logs", exist_ok=True)
logger = setup_logging()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Team Status & Project Management System API",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
    )

    # CORS — must be first middleware to handle OPTIONS preflight correctly
    cors_origins = settings.get_cors_origins()
    logger.info(f"CORS origins: {cors_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.netlify\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)

    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.on_event("startup")
    async def startup():
        logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} | {settings.ENVIRONMENT}")
        logger.info(f"   Docs: {settings.API_V1_STR}/docs")

        # Auto-run migrations on startup (safe — alembic checks current state)
        try:
            import subprocess
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                capture_output=True, text=True, cwd="/app"
            )
            if result.returncode == 0:
                logger.info("✅ Database migrations applied successfully")
                if result.stdout:
                    logger.info(result.stdout)
            else:
                logger.error(f"❌ Migration failed: {result.stderr}")
        except Exception as e:
            logger.error(f"❌ Migration error: {e}")

        if settings.ENVIRONMENT != "test":
            from app.tasks.scheduler import start_scheduler
            start_scheduler()

    @app.on_event("shutdown")
    async def shutdown():
        from app.tasks.scheduler import stop_scheduler
        stop_scheduler()

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "healthy", "version": settings.APP_VERSION}

    return app


app = create_application()
