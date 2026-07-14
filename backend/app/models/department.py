from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    department_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    company = relationship("Company", back_populates="departments")
    teams = relationship("Team", back_populates="department", cascade="all, delete-orphan")
    users = relationship("User", back_populates="department")
