from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.database.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserInvite, UserResponse, UserListResponse, RoleResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.user_service import UserService
from app.auth.rbac import RequireCompanyAdmin, RequireManager, has_minimum_role, Roles
from app.auth.dependencies import get_current_active_user
from app.utils.pagination import PaginationParams, paginate
from app.utils.s3 import upload_file_to_s3
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserListResponse])
def list_users(company_id: Optional[uuid.UUID] = None, department_id: Optional[uuid.UUID] = None,
               team_id: Optional[uuid.UUID] = None, role_id: Optional[uuid.UUID] = None,
               is_active: Optional[bool] = None, search: Optional[str] = None,
               pagination: PaginationParams = Depends(), db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    eid = company_id or u.company_id
    items, total = UserService(db).search(eid, search, department_id, team_id, role_id, is_active, pagination.skip, pagination.limit)
    return paginate([UserListResponse.model_validate(x) for x in items], total, pagination)


@router.post("", response_model=UserResponse, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    return UserService(db).create(data, actor_id=u.id)


@router.post("/invite", response_model=UserResponse, status_code=201)
def invite_user(data: UserInvite, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    return UserService(db).invite(data, u.id, company_id=u.company_id)


@router.get("/roles", response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    return UserService(db).get_roles()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    from fastapi import HTTPException
    if str(user_id) != str(u.id) and not has_minimum_role(u, Roles.TEAM_LEAD):
        raise HTTPException(status_code=403, detail="Access denied")
    return UserService(db).get_or_404(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: uuid.UUID, data: UserUpdate, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    return UserService(db).update(user_id, data, u.id)


@router.patch("/{user_id}/activate", response_model=UserResponse)
def activate(user_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    return UserService(db).activate(user_id, u.id)


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
def deactivate(user_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    return UserService(db).deactivate(user_id, u.id)


@router.post("/{user_id}/avatar", response_model=UserResponse)
def upload_avatar(user_id: uuid.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    from fastapi import HTTPException
    if str(user_id) != str(u.id) and not has_minimum_role(u, Roles.COMPANY_ADMIN):
        raise HTTPException(status_code=403, detail="Access denied")
    url = upload_file_to_s3(file, folder="avatars")
    return UserService(db).update_profile_image(user_id, url)
