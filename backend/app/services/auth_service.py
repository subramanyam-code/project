from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import JWTError
import uuid

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.auth.password import hash_password, verify_password
from app.auth.jwt import create_access_token, create_refresh_token, decode_token, create_password_reset_token, verify_password_reset_token
from app.schemas.auth import Token, LoginRequest
from app.core.config import settings


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.audit = AuditLogRepository(db)

    def login(self, credentials: LoginRequest, ip: str = None, ua: str = None) -> Token:
        user = self.user_repo.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account deactivated")
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()
        self.audit.log(user.id, "LOGIN", "User", str(user.id), ip_address=ip, user_agent=ua)
        return Token(access_token=create_access_token(user.id), refresh_token=create_refresh_token(user.id))

    def refresh_tokens(self, refresh_token: str) -> Token:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError
            user_id = payload.get("sub")
        except (JWTError, ValueError):
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user = self.user_repo.get_by_id(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        return Token(access_token=create_access_token(user.id), refresh_token=create_refresh_token(user.id))

    def logout(self, user: User, ip: str = None):
        self.audit.log(user.id, "LOGOUT", "User", str(user.id), ip_address=ip)

    def forgot_password(self, email: str) -> Optional[str]:
        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        token = create_password_reset_token(email)
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        self.db.commit()
        return token

    def reset_password(self, token: str, new_password: str):
        email = verify_password_reset_token(token)
        if not email:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        user = self.user_repo.get_by_email(email)
        if not user or user.password_reset_token != token:
            raise HTTPException(status_code=400, detail="Invalid token")
        if user.password_reset_expires and user.password_reset_expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Token expired")
        user.hashed_password = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        self.db.commit()
        self.audit.log(user.id, "PASSWORD_RESET", "User", str(user.id))

    def change_password(self, user: User, current: str, new: str):
        if not verify_password(current, user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password incorrect")
        user.hashed_password = hash_password(new)
        self.db.commit()
        self.audit.log(user.id, "PASSWORD_CHANGED", "User", str(user.id))
