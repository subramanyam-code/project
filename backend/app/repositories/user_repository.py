from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, func
from app.models.user import User
from app.repositories.base import BaseRepository
import uuid


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()

    def get_with_role(self, user_id: uuid.UUID) -> Optional[User]:
        return self.db.execute(select(User).options(joinedload(User.role)).where(User.id == user_id)).scalar_one_or_none()

    def search(self, company_id=None, search=None, department_id=None, team_id=None, role_id=None, is_active=None, skip=0, limit=20):
        q = select(User).options(joinedload(User.role))
        if company_id:
            q = q.where(User.company_id == company_id)
        if search:
            t = f"%{search}%"
            q = q.where(or_(User.first_name.ilike(t), User.last_name.ilike(t), User.email.ilike(t), User.job_title.ilike(t)))
        if department_id:
            q = q.where(User.department_id == department_id)
        if team_id:
            q = q.where(User.team_id == team_id)
        if role_id:
            q = q.where(User.role_id == role_id)
        if is_active is not None:
            q = q.where(User.is_active == is_active)
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total
