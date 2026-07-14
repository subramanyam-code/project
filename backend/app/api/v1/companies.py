from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
from slugify import slugify

from app.database.session import get_db
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.repositories.base import BaseRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.company import Company
from app.auth.rbac import RequireSuperAdmin, RequireCompanyAdmin
from app.utils.pagination import PaginationParams, paginate
from app.models.user import User
import uuid

router = APIRouter(prefix="/companies", tags=["Companies"])


class CompanyRepo(BaseRepository[Company]):
    def __init__(self, db):
        super().__init__(Company, db)
    def get_by_name(self, name):
        return self.db.execute(select(Company).where(Company.company_name == name)).scalar_one_or_none()
    def search(self, search, skip, limit):
        q = select(Company)
        if search:
            q = q.where(Company.company_name.ilike(f"%{search}%"))
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total


@router.get("", response_model=PaginatedResponse[CompanyResponse])
def list_companies(search: Optional[str] = None, pagination: PaginationParams = Depends(), db: Session = Depends(get_db), u: User = Depends(RequireSuperAdmin)):
    items, total = CompanyRepo(db).search(search, pagination.skip, pagination.limit)
    return paginate([CompanyResponse.model_validate(c) for c in items], total, pagination)


@router.post("", response_model=CompanyResponse, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db), u: User = Depends(RequireSuperAdmin)):
    from fastapi import HTTPException
    repo = CompanyRepo(db)
    if repo.get_by_name(data.company_name):
        raise HTTPException(status_code=409, detail="Company already exists")
    c = repo.create({**data.model_dump(), "slug": slugify(data.company_name)})
    AuditLogRepository(db).log(u.id, "CREATE", "Company", str(c.id))
    return c


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    from fastapi import HTTPException
    c = CompanyRepo(db).get_by_id(company_id)
    if not c: raise HTTPException(status_code=404, detail="Not found")
    return c


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: uuid.UUID, data: CompanyUpdate, db: Session = Depends(get_db), u: User = Depends(RequireSuperAdmin)):
    from fastapi import HTTPException
    repo = CompanyRepo(db)
    c = repo.get_by_id(company_id)
    if not c: raise HTTPException(status_code=404, detail="Not found")
    updates = data.model_dump(exclude_none=True)
    if "company_name" in updates: updates["slug"] = slugify(updates["company_name"])
    return repo.update(c, updates)


@router.delete("/{company_id}", response_model=MessageResponse)
def delete_company(company_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(RequireSuperAdmin)):
    from fastapi import HTTPException
    repo = CompanyRepo(db)
    c = repo.get_by_id(company_id)
    if not c: raise HTTPException(status_code=404, detail="Not found")
    repo.delete(c)
    return MessageResponse(message="Company deleted")
