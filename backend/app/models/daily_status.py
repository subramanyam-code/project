from sqlalchemy import Column, String, ForeignKey, Text, Float, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base, TimestampMixin


class TaskStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class DailyStatus(Base, TimestampMixin):
    __tablename__ = "daily_statuses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default=TaskStatus.IN_PROGRESS, nullable=False)
    hours_worked = Column(Float, default=0.0, nullable=False)
    blockers = Column(Text, nullable=True)
    tomorrow_plan = Column(Text, nullable=True)
    attachment_url = Column(String(500), nullable=True)
    submit_date = Column(Date, nullable=False)

    user = relationship("User", back_populates="daily_statuses")
    project = relationship("Project", back_populates="daily_statuses")
