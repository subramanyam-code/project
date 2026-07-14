from fastapi import Depends, HTTPException, status
from typing import List
from app.models.user import User
from app.auth.dependencies import get_current_active_user


class Roles:
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    PROJECT_MANAGER = "project_manager"
    TEAM_LEAD = "team_lead"
    EMPLOYEE = "employee"


ROLE_HIERARCHY: List[str] = [
    Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROJECT_MANAGER,
    Roles.TEAM_LEAD, Roles.EMPLOYEE,
]


def has_minimum_role(user: User, minimum_role: str) -> bool:
    if not user.role:
        return False
    try:
        return ROLE_HIERARCHY.index(user.role.role_name) <= ROLE_HIERARCHY.index(minimum_role)
    except ValueError:
        return False


def require_roles(*allowed: str):
    def _check(u: User = Depends(get_current_active_user)) -> User:
        if not u.role or u.role.role_name not in allowed:
            raise HTTPException(status_code=403, detail=f"Access denied. Required: {', '.join(allowed)}")
        return u
    return _check


def require_minimum_role(minimum: str):
    def _check(u: User = Depends(get_current_active_user)) -> User:
        if not has_minimum_role(u, minimum):
            raise HTTPException(status_code=403, detail=f"Access denied. Minimum role: {minimum}")
        return u
    return _check


RequireSuperAdmin = require_roles(Roles.SUPER_ADMIN)
RequireCompanyAdmin = require_minimum_role(Roles.COMPANY_ADMIN)
RequireManager = require_minimum_role(Roles.PROJECT_MANAGER)
RequireTeamLead = require_minimum_role(Roles.TEAM_LEAD)
RequireEmployee = require_minimum_role(Roles.EMPLOYEE)
