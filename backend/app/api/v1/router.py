from fastapi import APIRouter
from app.api.v1 import auth, companies, departments, teams, users, projects, daily_status, reports, notifications, audit_logs, upload, search

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(companies.router)
api_router.include_router(departments.router)
api_router.include_router(teams.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(daily_status.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(audit_logs.router)
api_router.include_router(upload.router)
api_router.include_router(search.router)
