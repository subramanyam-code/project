from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    team_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    team_lead_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    department = relationship("Department", back_populates="teams")
    team_lead = relationship("User", foreign_keys=[team_lead_id], back_populates="led_teams")
    members = relationship("User", foreign_keys="User.team_id", back_populates="team")
