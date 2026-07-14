from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
import uuid


class DailyStatusCreate(BaseModel):
    project_id: uuid.UUID
    task_title: str
    description: Optional[str] = None
    status: str = "in_progress"
    hours_worked: float = 0.0
    blockers: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    submit_date: Optional[date] = None

    @field_validator("hours_worked")
    @classmethod
    def validate_hours(cls, v):
        if v < 0 or v > 24:
            raise ValueError("Hours must be 0-24")
        return v


class DailyStatusUpdate(BaseModel):
    task_title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    hours_worked: Optional[float] = None
    blockers: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    attachment_url: Optional[str] = None


class DailyStatusResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID
    task_title: str
    description: Optional[str] = None
    status: str
    hours_worked: float
    blockers: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    attachment_url: Optional[str] = None
    submit_date: date
    created_at: datetime
    class Config:
        from_attributes = True
