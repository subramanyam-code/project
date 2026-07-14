import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from loguru import logger
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.enabled = bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and settings.FROM_EMAIL)

    def _send(self, to: str, subject: str, html: str) -> bool:
        if not self.enabled:
            logger.info(f"[Email disabled] '{subject}' → {to}")
            return False
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.FROM_EMAIL
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
                s.starttls()
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.sendmail(settings.FROM_EMAIL, to, msg.as_string())
            return True
        except Exception as e:
            logger.error(f"Email failed to {to}: {e}")
            return False

    def send_password_reset_email(self, email: str, token: str) -> bool:
        url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        return self._send(email, f"[{settings.APP_NAME}] Password Reset",
            f"<h2>Password Reset</h2><p>Click <a href='{url}'>here</a> to reset your password (expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS}h).</p>")

    def send_welcome_email(self, email: str, first_name: str, temp_password: str) -> bool:
        return self._send(email, f"Welcome to {settings.APP_NAME}",
            f"<h2>Welcome {first_name}!</h2><p>Email: {email}<br>Temp Password: <b>{temp_password}</b><br><br>Please change your password after first login.</p>")

    def send_status_reminder(self, email: str, first_name: str) -> bool:
        url = f"{settings.FRONTEND_URL}/daily-status"
        return self._send(email, f"[{settings.APP_NAME}] Daily Status Reminder",
            f"<p>Hi {first_name}, please <a href='{url}'>submit your daily status</a>.</p>")

    def send_blocked_task_notification(self, manager_email: str, employee_name: str, task: str, project: str) -> bool:
        return self._send(manager_email, f"[{settings.APP_NAME}] Blocked Task: {task}",
            f"<p><b>{employee_name}</b> reported a blocked task: <b>{task}</b> on project <b>{project}</b>.</p>")

    def send_team_status_complete(self, manager_email: str, team_name: str) -> bool:
        return self._send(manager_email, f"[{settings.APP_NAME}] {team_name} — All Status Submitted",
            f"<p>All members of <b>{team_name}</b> have submitted their daily status.</p>")

    def send_weekly_report_email(self, email: str, first_name: str, report_html: str) -> bool:
        return self._send(email, f"[{settings.APP_NAME}] Weekly Report",
            f"<h2>Hi {first_name},</h2><p>Here is your weekly summary:</p>{report_html}")
