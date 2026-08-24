"""
schemas.py — Pydantic v2 request / response models.
"""

import re
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


# ─── User ────────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    name: str | None = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ─── Auth ────────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v.strip()):
            raise ValueError("Invalid email address format.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead



# ─── DailyRoutine ────────────────────────────────────────────────────────────────

class DailyRoutineBase(BaseModel):
    routine_date: date
    am_done: bool = False
    pm_done: bool = False
    streak_count: int = 0
    notes: str | None = None


class DailyRoutineCreate(DailyRoutineBase):
    user_id: int


class DailyRoutineRead(DailyRoutineBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


# ─── Streak & Calendar ─────────────────────────────────────────────────────────

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_completed_date: date | None = None
    is_streak_broken: bool = False


class CalendarDayResponse(BaseModel):
    date: date
    status: str  # "completed" | "missed" | "pending" | "future"
    am_done: bool = False
    pm_done: bool = False
    is_today: bool = False


# ─── Photos ──────────────────────────────────────────────────────────────────────

class PhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    daily_routine_id: int | None = None
    storage_url: str
    captured_at: datetime
    created_at: datetime
    streak_day: int = 0
    am_done: bool = False
    pm_done: bool = False


# ─── Health ──────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str


# ─── Profile Stats ───────────────────────────────────────────────────────────────

class ProfileStatsResponse(BaseModel):
    total_routines_completed: int
    longest_streak: int
    current_streak: int
    member_since: datetime


# ─── Reminder Settings ─────────────────────────────────────────────────────────

class ReminderSettingsRead(BaseModel):
    am_reminder_time: str
    pm_reminder_time: str
    reminders_enabled: bool


class ReminderSettingsUpdate(BaseModel):
    am_reminder_time: str | None = None
    pm_reminder_time: str | None = None
    reminders_enabled: bool | None = None

