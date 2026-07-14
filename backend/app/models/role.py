from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database.base import Base, TimestampMixin


class Role(Base, TimestampMixin):
    __tablename__ = "roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    users = relationship("User", back_populates="role")
