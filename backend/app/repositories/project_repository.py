from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, func
from app.models.project import Project, ProjectMember
from app.repositories.base import BaseRepository
import uuid


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: Session):
        super().__init__(Project, db)

    def get_detail(self, project_id):
        return self.db.execute(
            select(Project).options(joinedload(Project.manager), joinedload(Project.members).joinedload(ProjectMember.user))
            .where(Project.id == project_id)
        ).scalar_one_or_none()

    def search(self, company_id=None, manager_id=None, status=None, search=None, skip=0, limit=20):
        q = select(Project).options(joinedload(Project.manager))
        if company_id:
            q = q.where(Project.company_id == company_id)
        if manager_id:
            q = q.where(Project.manager_id == manager_id)
        if status:
            q = q.where(Project.status == status)
        if search:
            q = q.where(Project.project_name.ilike(f"%{search}%"))
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total

    def get_user_projects(self, user_id):
        member_ids = self.db.execute(select(ProjectMember.project_id).where(ProjectMember.user_id == user_id)).scalars().all()
        return self.db.execute(select(Project).where(or_(Project.manager_id == user_id, Project.id.in_(member_ids)))).scalars().all()

    def add_member(self, project_id, user_id, role="member"):
        m = ProjectMember(project_id=project_id, user_id=user_id, role_in_project=role)
        self.db.add(m)
        self.db.commit()
        return m

    def remove_member(self, project_id, user_id):
        m = self.db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)).scalar_one_or_none()
        if m:
            self.db.delete(m)
            self.db.commit()
            return True
        return False

    def is_member(self, project_id, user_id):
        return self.db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)).scalar_one_or_none() is not None
