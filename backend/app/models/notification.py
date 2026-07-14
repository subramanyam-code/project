from sqlalchemy import Column, String, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base, TimestampMixin


class NotificationType(str, enum.Enum):
    STATUS_REMINDER = "status_reminder"
    TASK_BLOCKED = "task_blocked"
    PROJECT_ASSIGNED = "project_assigned"
    TEAM_STATUS_COMPLETE = "team_status_complete"
    WEEKLY_REPORT = "weekly_report"
    GENERAL = "general"


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default=NotificationType.GENERAL, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    action_url = Column(String(500), nullable=True)
    user = relationship("User", back_populates="notifications")
