import sys
from loguru import logger
from app.core.config import settings


def setup_logging():
    logger.remove()
    fmt = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    logger.add(sys.stdout, format=fmt, level="DEBUG" if settings.DEBUG else "INFO", colorize=True)
    logger.add("logs/app.log", format=fmt, level="INFO", rotation="10 MB", retention="30 days", compression="zip")
    logger.add("logs/error.log", format=fmt, level="ERROR", rotation="10 MB", retention="60 days", compression="zip")
    return logger
