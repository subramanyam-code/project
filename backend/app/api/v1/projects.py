from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from app.database.session import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse, ProjectMemberAdd
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.project_service import ProjectService
from app.auth.rbac import RequireManager, has_minimum_role, Roles
from app.auth.dependencies import get_current_active_user
from app.utils.pagination import PaginationParams, paginate
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PaginatedResponse[ProjectResponse])
def list_projects(company_id: Optional[uuid.UUID] = None, manager_id: Optional[uuid.UUID] = None,
                  status: Optional[str] = None, search: Optional[str] = None,
                  pagination: PaginationParams = Depends(), db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    svc = ProjectService(db)
    if not has_minimum_role(u, Roles.PROJECT_MANAGER):
        projects = svc.get_user_projects(u.id)
        return PaginatedResponse(items=[ProjectResponse.model_validate(p) for p in projects], total=len(projects), page=1, page_size=len(projects), total_pages=1)
    items, total = svc.search(company_id or u.company_id, manager_id, status, search, pagination.skip, pagination.limit)
    return paginate([ProjectResponse.model_validate(p) for p in items], total, pagination)


@router.post("", response_model=ProjectDetailResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    p = ProjectService(db).create(data, u.id, u.company_id)
    r = ProjectDetailResponse.model_validate(p)
    r.member_count = len(p.members)
    return r


@router.get("/my", response_model=List[ProjectResponse])
def my_projects(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    return [ProjectResponse.model_validate(p) for p in ProjectService(db).get_user_projects(u.id)]


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    p = ProjectService(db).get_or_404(project_id)
    r = ProjectDetailResponse.model_validate(p)
    r.member_count = len(p.members)
    return r


@router.put("/{project_id}", response_model=ProjectDetailResponse)
def update_project(project_id: uuid.UUID, data: ProjectUpdate, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    p = ProjectService(db).update(project_id, data, u.id)
    r = ProjectDetailResponse.model_validate(p)
    r.member_count = len(p.members)
    return r


@router.delete("/{project_id}", response_model=MessageResponse)
def delete_project(project_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    ProjectService(db).delete(project_id, u.id)
    return MessageResponse(message="Project deleted")


@router.post("/{project_id}/members", response_model=ProjectDetailResponse)
def add_members(project_id: uuid.UUID, body: ProjectMemberAdd, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    p = ProjectService(db).add_members(project_id, body.user_ids, u.id)
    r = ProjectDetailResponse.model_validate(p)
    r.member_count = len(p.members)
    return r


@router.delete("/{project_id}/members/{user_id}", response_model=MessageResponse)
def remove_member(project_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    ProjectService(db).remove_member(project_id, user_id, u.id)
    return MessageResponse(message="Member removed")
