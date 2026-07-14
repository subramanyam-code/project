from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class CompanyCreate(BaseModel):
    company_name: str
    description: Optional[str] = None
    website: Optional[str] = None


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True
