from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, and_
from app.models.daily_status import DailyStatus, TaskStatus
from app.repositories.base import BaseRepository
from datetime import date
import uuid


class DailyStatusRepository(BaseRepository[DailyStatus]):
    def __init__(self, db: Session):
        super().__init__(DailyStatus, db)

    def get_by_user_and_date(self, user_id, submit_date):
        return self.db.execute(
            select(DailyStatus).where(and_(DailyStatus.user_id == user_id, DailyStatus.submit_date == submit_date))
        ).scalar_one_or_none()

    def search(self, user_id=None, project_id=None, status=None, start_date=None, end_date=None, skip=0, limit=20):
        q = select(DailyStatus).options(joinedload(DailyStatus.user), joinedload(DailyStatus.project))
        if user_id:
            q = q.where(DailyStatus.user_id == user_id)
        if project_id:
            q = q.where(DailyStatus.project_id == project_id)
        if status:
            q = q.where(DailyStatus.status == status)
        if start_date:
            q = q.where(DailyStatus.submit_date >= start_date)
        if end_date:
            q = q.where(DailyStatus.submit_date <= end_date)
        q = q.order_by(DailyStatus.submit_date.desc())
        total = self.db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
        items = self.db.execute(q.offset(skip).limit(limit)).scalars().all()
        return list(items), total

    def get_productivity_stats(self, user_id, start_date, end_date):
        r = self.db.execute(
            select(
                func.count(DailyStatus.id).label("total"),
                func.sum(DailyStatus.hours_worked).label("total_hours"),
                func.count(DailyStatus.id).filter(DailyStatus.status == TaskStatus.COMPLETED).label("completed"),
                func.count(DailyStatus.id).filter(DailyStatus.status == TaskStatus.BLOCKED).label("blocked"),
            ).where(and_(DailyStatus.user_id == user_id, DailyStatus.submit_date >= start_date, DailyStatus.submit_date <= end_date))
        ).one()
        return {"total": r.total or 0, "total_hours": float(r.total_hours or 0), "completed": r.completed or 0, "blocked": r.blocked or 0}
