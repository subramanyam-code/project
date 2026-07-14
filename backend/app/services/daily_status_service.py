from datetime import date
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid

from app.models.daily_status import DailyStatus
from app.repositories.daily_status_repository import DailyStatusRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.project_repository import ProjectRepository
from app.models.notification import NotificationType
from app.schemas.daily_status import DailyStatusCreate, DailyStatusUpdate
from app.services.email_service import EmailService


class DailyStatusService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DailyStatusRepository(db)
        self.notif_repo = NotificationRepository(db)
        self.audit = AuditLogRepository(db)
        self.project_repo = ProjectRepository(db)

    def submit(self, data: DailyStatusCreate, user_id) -> DailyStatus:
        submit_date = data.submit_date or date.today()
        project = self.project_repo.get_by_id(data.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if not self.project_repo.is_member(data.project_id, user_id) and str(project.manager_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Not a member of this project")

        payload = data.model_dump(exclude={"submit_date"})
        payload["user_id"] = user_id
        payload["submit_date"] = submit_date
        ds = self.repo.create(payload)

        if ds.status == "blocked" and project.manager_id:
            from app.models.user import User
            user = self.db.get(User, user_id)
            self.notif_repo.create_notification(
                user_id=project.manager_id,
                title="Blocked Task Alert",
                message=f"{user.full_name} reported a blocked task: '{ds.task_title}'",
                notification_type=NotificationType.TASK_BLOCKED,
                action_url=f"/daily-status/{ds.id}",
            )
            manager = self.db.get(User, project.manager_id)
            if manager and user:
                EmailService().send_blocked_task_notification(manager.email, user.full_name, ds.task_title, project.project_name)

        self.audit.log(user_id, "CREATE", "DailyStatus", str(ds.id))
        return ds

    def update(self, status_id, data: DailyStatusUpdate, user_id) -> DailyStatus:
        ds = self._get_or_404(status_id)
        if str(ds.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Cannot edit others' status")
        if ds.submit_date < date.today():
            raise HTTPException(status_code=400, detail="Past submissions are read-only")
        updated = self.repo.update(ds, data.model_dump(exclude_none=True))
        self.audit.log(user_id, "UPDATE", "DailyStatus", str(status_id))
        return updated

    def delete(self, status_id, user_id):
        ds = self._get_or_404(status_id)
        if str(ds.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Access denied")
        if ds.submit_date < date.today():
            raise HTTPException(status_code=400, detail="Cannot delete past submissions")
        self.repo.delete(ds)
        self.audit.log(user_id, "DELETE", "DailyStatus", str(status_id))

    def _get_or_404(self, status_id) -> DailyStatus:
        ds = self.repo.get_by_id(status_id)
        if not ds:
            raise HTTPException(status_code=404, detail="Status not found")
        return ds

    def list(self, user_id, project_id, status, start_date, end_date, skip, limit):
        return self.repo.search(user_id, project_id, status, start_date, end_date, skip, limit)

    def get_today(self, user_id):
        return self.repo.get_by_user_and_date(user_id, date.today())
