from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from typing import Optional
import uuid

from app.database.session import get_db
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamDetailResponse, TeamAddMembers
from app.schemas.common import PaginatedResponse, MessageResponse
from app.repositories.base import BaseRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.team import Team
from app.models.user import User
from app.auth.rbac import RequireManager, RequireTeamLead
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/teams", tags=["Teams"])


class TeamRepo(BaseRepository[Team]):
    def __init__(self, db): super().__init__(Team, db)
    def get_with_members(self, tid):
        return self.db.execute(select(Team).options(joinedload(Team.team_lead), joinedload(Team.members)).where(Team.id == tid)).scalar_one_or_none()
    def list_by_dept(self, dept_id, search, skip, limit):
        q = select(Team).options(joinedload(Team.team_lead), joinedload(Team.department))
        if dept_id:
            q = q.where(Team.department_id == dept_id)
        if search:
            q = q.where(Team.team_name.ilike(f"%{search}%"))
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total


@router.get("", response_model=PaginatedResponse[TeamResponse])
def list_teams(department_id: Optional[uuid.UUID] = Query(None), search: Optional[str] = None,
               pagination: PaginationParams = Depends(), db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    items, total = TeamRepo(db).list_by_dept(department_id, search, pagination.skip, pagination.limit)
    return paginate([TeamResponse.model_validate(t) for t in items], total, pagination)


@router.post("", response_model=TeamResponse, status_code=201)
def create_team(data: TeamCreate, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    t = TeamRepo(db).create(data.model_dump())
    AuditLogRepository(db).log(u.id, "CREATE", "Team", str(t.id))
    return t


@router.get("/{team_id}", response_model=TeamDetailResponse)
def get_team(team_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    repo = TeamRepo(db)
    t = repo.get_with_members(team_id)
    if not t: raise HTTPException(status_code=404, detail="Team not found")
    r = TeamDetailResponse.model_validate(t)
    r.member_count = len(t.members)
    return r


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: uuid.UUID, data: TeamUpdate, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    repo = TeamRepo(db)
    t = repo.get_by_id(team_id)
    if not t: raise HTTPException(status_code=404, detail="Team not found")
    return repo.update(t, data.model_dump(exclude_none=True))


@router.delete("/{team_id}", response_model=MessageResponse)
def delete_team(team_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    repo = TeamRepo(db)
    t = repo.get_by_id(team_id)
    if not t: raise HTTPException(status_code=404, detail="Team not found")
    repo.delete(t)
    return MessageResponse(message="Team deleted")


@router.post("/{team_id}/members", response_model=TeamDetailResponse)
def add_members(team_id: uuid.UUID, body: TeamAddMembers, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    for uid in body.user_ids:
        user = db.get(User, uid)
        if user: user.team_id = team_id
    db.commit()
    AuditLogRepository(db).log(u.id, "TEAM_MEMBER_ADD", "Team", str(team_id))
    t = TeamRepo(db).get_with_members(team_id)
    r = TeamDetailResponse.model_validate(t)
    r.member_count = len(t.members)
    return r


@router.delete("/{team_id}/members/{user_id}", response_model=MessageResponse)
def remove_member(team_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    user = db.get(User, user_id)
    if user and user.team_id == team_id:
        user.team_id = None
        db.commit()
    return MessageResponse(message="Member removed")


@router.patch("/{team_id}/lead/{user_id}", response_model=TeamResponse)
def assign_lead(team_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    repo = TeamRepo(db)
    t = repo.get_by_id(team_id)
    if not t: raise HTTPException(status_code=404, detail="Team not found")
    t.team_lead_id = user_id
    db.commit()
    db.refresh(t)
    return t
