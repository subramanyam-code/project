from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: Session):
        self.repo = ProjectRepository(db)
        self.audit = AuditLogRepository(db)

    def create(self, data: ProjectCreate, actor_id, company_id) -> Project:
        payload = data.model_dump()
        if not payload.get("manager_id"):
            payload["manager_id"] = actor_id
        payload["company_id"] = company_id
        project = self.repo.create(payload)
        self.audit.log(actor_id, "CREATE", "Project", str(project.id), new_values={"project_name": project.project_name})
        return project

    def get_or_404(self, project_id) -> Project:
        p = self.repo.get_detail(project_id)
        if not p:
            raise HTTPException(status_code=404, detail="Project not found")
        return p

    def search(self, company_id, manager_id, status, search, skip, limit):
        return self.repo.search(company_id, manager_id, status, search, skip, limit)

    def update(self, project_id, data: ProjectUpdate, actor_id) -> Project:
        p = self.get_or_404(project_id)
        updates = data.model_dump(exclude_none=True)
        updated = self.repo.update(p, updates)
        self.audit.log(actor_id, "UPDATE", "Project", str(project_id), new_values=updates)
        return updated

    def delete(self, project_id, actor_id):
        p = self.get_or_404(project_id)
        self.audit.log(actor_id, "DELETE", "Project", str(project_id), old_values={"project_name": p.project_name})
        self.repo.delete(p)

    def add_members(self, project_id, user_ids, actor_id) -> Project:
        p = self.get_or_404(project_id)
        existing = {str(m.user_id) for m in p.members}
        for uid in user_ids:
            if str(uid) not in existing:
                self.repo.add_member(project_id, uid)
        self.audit.log(actor_id, "PROJECT_MEMBER_ADD", "Project", str(project_id))
        return self.get_or_404(project_id)

    def remove_member(self, project_id, user_id, actor_id):
        if not self.repo.remove_member(project_id, user_id):
            raise HTTPException(status_code=404, detail="User not a member")
        self.audit.log(actor_id, "PROJECT_MEMBER_REMOVE", "Project", str(project_id))

    def get_user_projects(self, user_id):
        return self.repo.get_user_projects(user_id)
