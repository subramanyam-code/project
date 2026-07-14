from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.schemas.user import UserListResponse


class TeamCreate(BaseModel):
    team_name: str
    department_id: uuid.UUID
    description: Optional[str] = None
    team_lead_id: Optional[uuid.UUID] = None


class TeamUpdate(BaseModel):
    team_name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    team_lead_id: Optional[uuid.UUID] = None


class TeamAddMembers(BaseModel):
    user_ids: List[uuid.UUID]


class TeamResponse(BaseModel):
    id: uuid.UUID
    department_id: uuid.UUID
    team_name: str
    description: Optional[str] = None
    team_lead_id: Optional[uuid.UUID] = None
    created_at: datetime
    class Config:
        from_attributes = True


class TeamDetailResponse(TeamResponse):
    team_lead: Optional[UserListResponse] = None
    members: List[UserListResponse] = []
    member_count: int = 0
