from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
import uuid

from app.database.session import get_db
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.repositories.base import BaseRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.department import Department
from app.auth.rbac import RequireCompanyAdmin, RequireManager
from app.utils.pagination import PaginationParams, paginate
from app.models.user import User

router = APIRouter(prefix="/departments", tags=["Departments"])


class DeptRepo(BaseRepository[Department]):
    def __init__(self, db):
        super().__init__(Department, db)
    def list_by_company(self, company_id, search, skip, limit):
        q = select(Department).where(Department.company_id == company_id)
        if search: q = q.where(Department.department_name.ilike(f"%{search}%"))
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total


@router.get("", response_model=PaginatedResponse[DepartmentResponse])
def list_departments(company_id: uuid.UUID = Query(...), search: Optional[str] = None,
                     pagination: PaginationParams = Depends(), db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    items, total = DeptRepo(db).list_by_company(company_id, search, pagination.skip, pagination.limit)
    return paginate([DepartmentResponse.model_validate(d) for d in items], total, pagination)


@router.post("", response_model=DepartmentResponse, status_code=201)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    d = DeptRepo(db).create(data.model_dump())
    AuditLogRepository(db).log(u.id, "CREATE", "Department", str(d.id))
    return d


@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(dept_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    d = DeptRepo(db).get_by_id(dept_id)
    if not d: raise HTTPException(status_code=404, detail="Not found")
    return d


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: uuid.UUID, data: DepartmentUpdate, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    repo = DeptRepo(db)
    d = repo.get_by_id(dept_id)
    if not d: raise HTTPException(status_code=404, detail="Not found")
    return repo.update(d, data.model_dump(exclude_none=True))


@router.delete("/{dept_id}", response_model=MessageResponse)
def delete_department(dept_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    repo = DeptRepo(db)
    d = repo.get_by_id(dept_id)
    if not d: raise HTTPException(status_code=404, detail="Not found")
    repo.delete(d)
    return MessageResponse(message="Department deleted")
