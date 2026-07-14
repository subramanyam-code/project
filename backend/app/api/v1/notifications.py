from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.database.session import get_db
from app.schemas.notification import NotificationResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.repositories.notification_repository import NotificationRepository
from app.auth.dependencies import get_current_active_user
from app.utils.pagination import PaginationParams, paginate
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=PaginatedResponse[NotificationResponse])
def list_notifications(unread_only: bool = False, pagination: PaginationParams = Depends(),
                       db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    items, total = NotificationRepository(db).get_user_notifications(u.id, pagination.skip, pagination.limit, unread_only)
    return paginate([NotificationResponse.model_validate(n) for n in items], total, pagination)


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    return {"unread_count": NotificationRepository(db).get_unread_count(u.id)}


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
def mark_read(notif_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    repo = NotificationRepository(db)
    n = repo.get_by_id(notif_id)
    if not n: raise HTTPException(status_code=404, detail="Not found")
    if str(n.user_id) != str(u.id): raise HTTPException(status_code=403, detail="Access denied")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.post("/mark-all-read", response_model=MessageResponse)
def mark_all_read(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    NotificationRepository(db).mark_all_read(u.id)
    return MessageResponse(message="All marked as read")


@router.delete("/{notif_id}", response_model=MessageResponse)
def delete_notification(notif_id: uuid.UUID, db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    repo = NotificationRepository(db)
    n = repo.get_by_id(notif_id)
    if not n: raise HTTPException(status_code=404, detail="Not found")
    if str(n.user_id) != str(u.id): raise HTTPException(status_code=403, detail="Access denied")
    repo.delete(n)
    return MessageResponse(message="Notification deleted")
