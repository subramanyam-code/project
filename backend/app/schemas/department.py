from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class DepartmentCreate(BaseModel):
    department_name: str
    company_id: uuid.UUID
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    department_name: str
    description: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True
