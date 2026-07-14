from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import uuid

from app.database.session import get_db
from app.schemas.daily_status import DailyStatusCreate, DailyStatusUpdate, DailyStatusResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.daily_status_service import DailyStatusService
from app.auth.rbac import has_minimum_role, Roles
from app.auth.dependencies import get_current_active_user
from app.utils.pagination import PaginationParams, paginate
from app.utils.s3 import upload_file_to_s3
from app.models.user import User

router = APIRouter(prefix="/daily-status", tags=["Daily Status"])


@router.get("", response_model=PaginatedResponse[DailyStatusResponse])
def list_statuses(user_id: Optional[uuid.UUID] = None, project_id: Optional[uuid.UUID] = None,
                  status: Optional[str] = None, start_date: Optional[date] = None, end_date: Optional[date] = None,
                  pagination: PaginationParams = Depends(), db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    effective_uid = user_id if has_minimum_role(u, Roles.TEAM_LEAD) else u.id
    items, total = DailyStatusService(db).list(effective_uid, project_id, status, start_date, end_date, pagination.skip, pagination.limit)
    return paginate([DailyStatusResponse.model_validate(s) for s in items], total, pagination)


@router.post("", response_model=DailyStatusResponse, status_code=201)
def submit_status(data: DailyStatusCreate, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    return DailyStatusService(db).submit(data, u.id)


@router.get("/today", response_model=Optional[DailyStatusResponse])
def today_status(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    return DailyStatusService(db).get_today(u.id)


@router.get("/{status_id}", response_model=DailyStatusResponse)
def get_status(status_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    svc = DailyStatusService(db)
    ds = svc._get_or_404(status_id)
    if str(ds.user_id) != str(u.id) and not has_minimum_role(u, Roles.TEAM_LEAD):
        raise HTTPException(status_code=403, detail="Access denied")
    return ds


@router.put("/{status_id}", response_model=DailyStatusResponse)
def update_status(status_id: uuid.UUID, data: DailyStatusUpdate, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    return DailyStatusService(db).update(status_id, data, u.id)


@router.delete("/{status_id}", response_model=MessageResponse)
def delete_status(status_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    DailyStatusService(db).delete(status_id, u.id)
    return MessageResponse(message="Status deleted")


@router.post("/{status_id}/attachment", response_model=DailyStatusResponse)
def upload_attachment(status_id: uuid.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    url = upload_file_to_s3(file, folder="status-attachments")
    svc = DailyStatusService(db)
    ds = svc._get_or_404(status_id)
    if str(ds.user_id) != str(u.id): raise HTTPException(status_code=403, detail="Access denied")
    return svc.update(status_id, DailyStatusUpdate(attachment_url=url), u.id)
