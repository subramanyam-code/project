from datetime import date, timedelta
from loguru import logger
from app.database.session import SessionLocal


def send_daily_reminders():
    db = SessionLocal()
    try:
        from sqlalchemy import select
        from app.models.user import User
        from app.models.team import Team
        from app.models.daily_status import DailyStatus
        from app.repositories.notification_repository import NotificationRepository
        from app.models.notification import NotificationType
        from app.services.email_service import EmailService

        today = date.today()
        notif_repo = NotificationRepository(db)
        email_svc = EmailService()
        active_users = db.execute(select(User).where(User.is_active == True)).scalars().all()
        submitted = set(db.execute(select(DailyStatus.user_id).where(DailyStatus.submit_date == today)).scalars().all())

        for user in active_users:
            if user.id not in submitted:
                try:
                    notif_repo.create_notification(user.id, "Daily Status Reminder", "Please submit your daily status.", NotificationType.STATUS_REMINDER, "/daily-status")
                    email_svc.send_status_reminder(user.email, user.first_name)
                except Exception as e:
                    logger.error(f"Reminder failed {user.email}: {e}")

        teams = db.execute(select(Team)).scalars().all()
        for team in teams:
            if not team.team_lead_id: continue
            member_ids = {u.id for u in team.members if u.is_active}
            if member_ids and member_ids.issubset(submitted):
                try:
                    lead = db.get(User, team.team_lead_id)
                    if lead:
                        notif_repo.create_notification(lead.id, "Team Status Complete", f"All of {team.team_name} submitted.", NotificationType.TEAM_STATUS_COMPLETE)
                        email_svc.send_team_status_complete(lead.email, team.team_name)
                except Exception as e:
                    logger.error(f"Team notify failed {team.id}: {e}")
        db.commit()
        logger.info("Daily reminders sent")
    except Exception as e:
        logger.error(f"send_daily_reminders failed: {e}")
        db.rollback()
    finally:
        db.close()


def send_weekly_reports():
    db = SessionLocal()
    try:
        from sqlalchemy import select
        from app.models.user import User
        from app.services.report_service import ReportService
        from app.services.email_service import EmailService
        from app.auth.rbac import Roles
        today = date.today()
        week_start = today - timedelta(days=7)
        svc = ReportService(db)
        email_svc = EmailService()
        managers = [u for u in db.execute(select(User).where(User.is_active == True)).scalars().all()
                    if u.role and u.role.role_name in (Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD)]
        for m in managers:
            try:
                data = svc.weekly_report(week_start, company_id=m.company_id)
                html = f"<table border='1'><tr><th>Period</th><th>Entries</th><th>Hours</th></tr><tr><td>{data['label']}</td><td>{data['total_entries']}</td><td>{data['total_hours']}</td></tr></table>"
                email_svc.send_weekly_report_email(m.email, m.first_name, html)
            except Exception as e:
                logger.error(f"Weekly report failed {m.email}: {e}")
        logger.info("Weekly reports sent")
    except Exception as e:
        logger.error(f"send_weekly_reports failed: {e}")
    finally:
        db.close()


def check_blocked_tasks():
    db = SessionLocal()
    try:
        from sqlalchemy import select
        from app.models.daily_status import DailyStatus
        from app.models.project import Project
        from app.models.user import User
        from app.repositories.notification_repository import NotificationRepository
        from app.models.notification import NotificationType
        today = date.today()
        yesterday = today - timedelta(days=1)
        notif_repo = NotificationRepository(db)
        blocked = db.execute(select(DailyStatus).where(DailyStatus.status == "blocked", DailyStatus.submit_date >= yesterday)).scalars().all()
        for task in blocked:
            project = db.get(Project, task.project_id)
            if not project or not project.manager_id: continue
            emp = db.get(User, task.user_id)
            if not emp: continue
            try:
                notif_repo.create_notification(project.manager_id, "Blocked Task Alert",
                    f"{emp.full_name}: '{task.task_title}'", NotificationType.TASK_BLOCKED, f"/daily-status/{task.id}")
            except Exception as e:
                logger.error(f"Block notify failed {task.id}: {e}")
        db.commit()
        logger.info(f"Blocked check: {len(blocked)} tasks")
    except Exception as e:
        logger.error(f"check_blocked_tasks failed: {e}")
        db.rollback()
    finally:
        db.close()
