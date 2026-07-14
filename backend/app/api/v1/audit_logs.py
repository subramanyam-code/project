from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.database.session import get_db
from app.schemas.notification import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.repositories.audit_log_repository import AuditLogRepository
from app.auth.rbac import RequireCompanyAdmin
from app.utils.pagination import PaginationParams, paginate
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(user_id: Optional[uuid.UUID] = None, action: Optional[str] = None,
                    entity: Optional[str] = None, pagination: PaginationParams = Depends(),
                    db: Session = Depends(get_db), u: User = Depends(RequireCompanyAdmin)):
    items, total = AuditLogRepository(db).search(user_id, action, entity, pagination.skip, pagination.limit)
    return paginate([AuditLogResponse.model_validate(l) for l in items], total, pagination)
