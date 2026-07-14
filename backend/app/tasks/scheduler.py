from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

_scheduler = None


def get_scheduler():
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler(timezone="UTC")
        from app.tasks import reminders
        _scheduler.add_job(reminders.send_daily_reminders, CronTrigger(hour=17, minute=0), id="daily_reminder", replace_existing=True, misfire_grace_time=3600)
        _scheduler.add_job(reminders.send_weekly_reports, CronTrigger(day_of_week="mon", hour=8, minute=0), id="weekly_report", replace_existing=True, misfire_grace_time=3600)
        _scheduler.add_job(reminders.check_blocked_tasks, CronTrigger(hour=9, minute=0), id="blocked_check", replace_existing=True, misfire_grace_time=3600)
    return _scheduler


def start_scheduler():
    s = get_scheduler()
    if not s.running:
        s.start()
        logger.info("Scheduler started")


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
