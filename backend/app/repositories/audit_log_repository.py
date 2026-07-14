from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository
import uuid


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def log(self, user_id, action, entity, entity_id=None, old_values=None, new_values=None, ip_address=None, user_agent=None):
        obj = AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id,
                       old_values=old_values, new_values=new_values, ip_address=ip_address, user_agent=user_agent)
        self.db.add(obj)
        self.db.commit()
        return obj

    def search(self, user_id=None, action=None, entity=None, skip=0, limit=50):
        q = select(AuditLog).options(joinedload(AuditLog.user))
        if user_id:
            q = q.where(AuditLog.user_id == user_id)
        if action:
            q = q.where(AuditLog.action == action)
        if entity:
            q = q.where(AuditLog.entity == entity)
        q = q.order_by(AuditLog.created_at.desc())
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total
