from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional, Literal
from datetime import date, timedelta
import uuid

from app.database.session import get_db
from app.services.report_service import ReportService
from app.auth.rbac import RequireManager, RequireTeamLead
from app.auth.dependencies import get_current_active_user
from app.models.user import User
from app.models.daily_status import DailyStatus
from app.models.project import Project, ProjectMember
from app.models.department import Department

router = APIRouter(prefix="/reports", tags=["Reports"])
Fmt = Literal["json", "csv", "excel", "pdf"]


def _export(svc, data, fmt, filename):
    if fmt == "csv":
        return Response(svc.export_csv(data), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'})
    if fmt == "excel":
        return Response(svc.export_excel(data), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'})
    if fmt == "pdf":
        return Response(svc.export_pdf(data), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'})
    return data


@router.get("/daily")
def daily_report(report_date: date = Query(default_factory=date.today), user_id: Optional[uuid.UUID] = None,
                 project_id: Optional[uuid.UUID] = None, department_id: Optional[uuid.UUID] = None,
                 format: Fmt = "json", db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    svc = ReportService(db)
    return _export(svc, svc.daily_report(report_date, u.company_id, user_id, project_id, department_id), format, f"daily-{report_date}")


@router.get("/weekly")
def weekly_report(week_start: date = Query(...), user_id: Optional[uuid.UUID] = None,
                  project_id: Optional[uuid.UUID] = None, department_id: Optional[uuid.UUID] = None,
                  format: Fmt = "json", db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    svc = ReportService(db)
    return _export(svc, svc.weekly_report(week_start, u.company_id, user_id, project_id, department_id), format, f"weekly-{week_start}")


@router.get("/monthly")
def monthly_report(year: int = Query(...), month: int = Query(..., ge=1, le=12),
                   user_id: Optional[uuid.UUID] = None, project_id: Optional[uuid.UUID] = None,
                   department_id: Optional[uuid.UUID] = None, format: Fmt = "json",
                   db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    svc = ReportService(db)
    return _export(svc, svc.monthly_report(year, month, u.company_id, user_id, project_id, department_id), format, f"monthly-{year}-{month:02d}")


@router.get("/custom")
def custom_report(start_date: date = Query(...), end_date: date = Query(...),
                  user_id: Optional[uuid.UUID] = None, project_id: Optional[uuid.UUID] = None,
                  department_id: Optional[uuid.UUID] = None, format: Fmt = "json",
                  db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    svc = ReportService(db)
    return _export(svc, svc.custom_report(start_date, end_date, u.company_id, user_id, project_id, department_id), format, f"report-{start_date}-{end_date}")


@router.get("/productivity")
def productivity_report(start_date: date = Query(...), end_date: date = Query(...),
                        department_id: Optional[uuid.UUID] = None, format: Fmt = "json",
                        db: Session = Depends(get_db), u: User = Depends(RequireManager)):
    svc = ReportService(db)
    return svc.productivity_report(start_date, end_date, u.company_id, department_id)


@router.get("/dashboard/super-admin")
def super_admin_dashboard(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    from app.models.company import Company
    today = date.today()
    return {
        "total_companies": db.execute(select(func.count(Company.id))).scalar_one(),
        "total_employees": db.execute(select(func.count(User.id))).scalar_one(),
        "active_users": db.execute(select(func.count(User.id)).where(User.is_active == True)).scalar_one(),
        "total_projects": db.execute(select(func.count(Project.id))).scalar_one(),
        "total_departments": db.execute(select(func.count(Department.id))).scalar_one(),
        "today_submissions": db.execute(select(func.count(DailyStatus.id)).where(DailyStatus.submit_date == today)).scalar_one(),
    }


@router.get("/dashboard/manager")
def manager_dashboard(db: Session = Depends(get_db), u: User = Depends(RequireTeamLead)):
    today = date.today()
    cid = u.company_id
    return {
        "total_projects": db.execute(select(func.count(Project.id)).where(Project.manager_id == u.id)).scalar_one(),
        "today_submitted": db.execute(select(func.count(DailyStatus.id)).join(User, DailyStatus.user_id == User.id).where(User.company_id == cid, DailyStatus.submit_date == today)).scalar_one(),
        "blocked_tasks": db.execute(select(func.count(DailyStatus.id)).join(User, DailyStatus.user_id == User.id).where(User.company_id == cid, DailyStatus.status == "blocked", DailyStatus.submit_date == today)).scalar_one(),
        "completed_today": db.execute(select(func.count(DailyStatus.id)).join(User, DailyStatus.user_id == User.id).where(User.company_id == cid, DailyStatus.status == "completed", DailyStatus.submit_date == today)).scalar_one(),
    }


@router.get("/dashboard/employee")
def employee_dashboard(db: Session = Depends(get_db), u: User = Depends(get_current_active_user)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    my_pids = db.execute(select(ProjectMember.project_id).where(ProjectMember.user_id == u.id)).scalars().all()
    today_ds = db.execute(select(DailyStatus).where(DailyStatus.user_id == u.id, DailyStatus.submit_date == today)).scalar_one_or_none()
    return {
        "total_projects": len(my_pids),
        "today_status_submitted": today_ds is not None,
        "today_status": today_ds.status if today_ds else None,
        "week_hours": float(db.execute(select(func.sum(DailyStatus.hours_worked)).where(DailyStatus.user_id == u.id, DailyStatus.submit_date >= week_start)).scalar_one() or 0),
        "completed_tasks": db.execute(select(func.count(DailyStatus.id)).where(DailyStatus.user_id == u.id, DailyStatus.status == "completed")).scalar_one(),
        "pending_tasks": db.execute(select(func.count(DailyStatus.id)).where(DailyStatus.user_id == u.id, DailyStatus.status.in_(["in_progress", "not_started"]))).scalar_one(),
    }
