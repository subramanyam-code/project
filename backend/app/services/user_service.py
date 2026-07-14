from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
import secrets, uuid

from app.models.user import User
from app.models.role import Role
from app.repositories.user_repository import UserRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.auth.password import hash_password
from app.schemas.user import UserCreate, UserUpdate, UserInvite
from app.services.email_service import EmailService


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
        self.audit = AuditLogRepository(db)
        self.db = db

    def create(self, data: UserCreate, actor_id=None) -> User:
        if self.repo.get_by_email(data.email):
            raise HTTPException(status_code=409, detail=f"Email '{data.email}' already exists")
        payload = data.model_dump(exclude={"password"})
        payload["email"] = payload["email"].lower()
        payload["hashed_password"] = hash_password(data.password)
        user = self.repo.create(payload)
        if actor_id:
            self.audit.log(actor_id, "CREATE", "User", str(user.id), new_values={"email": user.email})
        return user

    def invite(self, data: UserInvite, actor_id, company_id=None) -> User:
        if self.repo.get_by_email(data.email):
            raise HTTPException(status_code=409, detail=f"Email '{data.email}' already exists")
        temp = secrets.token_urlsafe(12)
        user = self.repo.create({
            "first_name": data.first_name, "last_name": data.last_name,
            "email": data.email.lower(), "hashed_password": hash_password(temp),
            "role_id": data.role_id, "company_id": company_id,
            "department_id": data.department_id, "team_id": data.team_id,
            "is_active": True, "is_verified": False,
        })
        self.audit.log(actor_id, "INVITE", "User", str(user.id), new_values={"email": user.email})
        EmailService().send_welcome_email(user.email, user.first_name, temp)
        return user

    def get_or_404(self, user_id) -> User:
        user = self.repo.get_with_role(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def search(self, company_id, search, department_id, team_id, role_id, is_active, skip, limit):
        return self.repo.search(company_id, search, department_id, team_id, role_id, is_active, skip, limit)

    def update(self, user_id, data: UserUpdate, actor_id) -> User:
        user = self.get_or_404(user_id)
        updates = data.model_dump(exclude_none=True)
        updated = self.repo.update(user, updates)
        self.audit.log(actor_id, "UPDATE", "User", str(user_id), new_values=updates)
        return updated

    def activate(self, user_id, actor_id) -> User:
        user = self.get_or_404(user_id)
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        self.audit.log(actor_id, "ACTIVATE", "User", str(user_id))
        return user

    def deactivate(self, user_id, actor_id) -> User:
        if str(user_id) == str(actor_id):
            raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        user = self.get_or_404(user_id)
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        self.audit.log(actor_id, "DEACTIVATE", "User", str(user_id))
        return user

    def update_profile_image(self, user_id, url) -> User:
        user = self.get_or_404(user_id)
        user.profile_image = url
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_roles(self):
        return self.db.execute(select(Role)).scalars().all()
