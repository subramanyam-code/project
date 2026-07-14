from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid
from app.schemas.user import UserListResponse


class ProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None
    status: str = "not_started"
    priority: str = "medium"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[uuid.UUID] = None
    company_id: Optional[uuid.UUID] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    progress_percentage: Optional[str] = None


class ProjectMemberAdd(BaseModel):
    user_ids: List[uuid.UUID]


class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    role_in_project: Optional[str] = None
    user: Optional[UserListResponse] = None
    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    project_name: str
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    status: str
    priority: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    progress_percentage: str
    created_at: datetime
    manager: Optional[UserListResponse] = None
    member_count: int = 0
    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    members: List[ProjectMemberResponse] = []
