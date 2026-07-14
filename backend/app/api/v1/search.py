from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.database.session import get_db
from app.auth.dependencies import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.team import Team
from app.models.department import Department

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    t = f"%{q}%"
    cid = u.company_id
    users = db.execute(select(User.id, User.first_name, User.last_name, User.email, User.job_title).where(
        or_(User.first_name.ilike(t), User.last_name.ilike(t), User.email.ilike(t))).where(User.company_id == cid if cid else True).limit(10)).all()
    projects = db.execute(select(Project.id, Project.project_name, Project.status).where(Project.project_name.ilike(t)).limit(10)).all()
    teams = db.execute(select(Team.id, Team.team_name).where(Team.team_name.ilike(t)).limit(10)).all()
    depts = db.execute(select(Department.id, Department.department_name).where(Department.department_name.ilike(t)).limit(10)).all()
    return {
        "query": q,
        "results": {
            "users": [{"id": str(u.id), "name": f"{u.first_name} {u.last_name}", "email": u.email, "type": "user"} for u in users],
            "projects": [{"id": str(p.id), "name": p.project_name, "status": p.status, "type": "project"} for p in projects],
            "teams": [{"id": str(t.id), "name": t.team_name, "type": "team"} for t in teams],
            "departments": [{"id": str(d.id), "name": d.department_name, "type": "department"} for d in depts],
        },
        "total": len(users) + len(projects) + len(teams) + len(depts),
    }
