import time, uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        rid = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        logger.info(f"[{rid}] → {request.method} {request.url.path}")
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"[{rid}] Error: {exc}")
            raise
        ms = (time.perf_counter() - start) * 1000
        logger.info(f"[{rid}] ← {response.status_code} ({ms:.1f}ms)")
        response.headers["X-Request-ID"] = rid
        return response
