from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import uuid, re


class RoleResponse(BaseModel):
    id: uuid.UUID
    role_name: str
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role_id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    department_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8: raise ValueError("Min 8 characters")
        if not re.search(r"[A-Z]", v): raise ValueError("Must contain uppercase")
        if not re.search(r"\d", v): raise ValueError("Must contain digit")
        return v


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None
    role_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class UserInvite(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    job_title: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    is_verified: bool
    company_id: Optional[uuid.UUID] = None
    department_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None
    role: Optional[RoleResponse] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    job_title: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    role: Optional[RoleResponse] = None
    class Config:
        from_attributes = True
