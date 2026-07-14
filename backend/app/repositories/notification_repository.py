from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, update
from app.models.notification import Notification, NotificationType
from app.repositories.base import BaseRepository
import uuid


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def get_user_notifications(self, user_id, skip=0, limit=20, unread_only=False):
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read == False)
        q = q.order_by(Notification.created_at.desc())
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total

    def get_unread_count(self, user_id):
        return self.db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read == False)
        ).scalar_one()

    def mark_all_read(self, user_id):
        self.db.execute(update(Notification).where(Notification.user_id == user_id, Notification.is_read == False).values(is_read=True))
        self.db.commit()

    def create_notification(self, user_id, title, message, notification_type=NotificationType.GENERAL, action_url=None):
        n = Notification(user_id=user_id, title=title, message=message, notification_type=notification_type, action_url=action_url)
        self.db.add(n)
        self.db.commit()
        self.db.refresh(n)
        return n
