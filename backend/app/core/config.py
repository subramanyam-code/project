from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Optional, Union
import secrets
import json


class Settings(BaseSettings):
    APP_NAME: str = "Team Status & Project Management"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24

    DATABASE_URL: str = "postgresql://tspm_user:tspm_password@localhost:5432/tspm_db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    REDIS_URL: str = "redis://localhost:6379/0"

    # Stored as a plain string internally — parsed in the validator below.
    # In Render, set as: https://your-site.netlify.app,http://localhost:3000
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> str:
        """
        Accepts any format and normalises to a comma-separated string.
        Actual splitting into a list is done in get_cors_origins().
        """
        if isinstance(v, list):
            return ",".join(v)
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                try:
                    parsed = json.loads(v)
                    return ",".join(i.strip() for i in parsed)
                except json.JSONDecodeError:
                    pass
            return v
        return str(v)

    def get_cors_origins(self) -> List[str]:
        """Return CORS origins as a list — use this in main.py."""
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: Optional[str] = None
    EMAILS_ENABLED: bool = False

    FRONTEND_URL: str = "http://localhost:3000"
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "xls", "xlsx"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
