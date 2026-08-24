"""
routers/reminders.py — Endpoints for managing user email reminder settings.

GET /reminders/settings
  Returns current AM/PM reminder times and enabled status for authenticated user.

PATCH /reminders/settings
  Updates AM/PM reminder times and/or reminders enabled flag.
"""

from datetime import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import ReminderSettingsRead, ReminderSettingsUpdate

router = APIRouter(prefix="/reminders", tags=["reminders"])


def parse_time_str(time_str: str) -> time:
    """Parses a time string formatted as 'HH:MM' or 'HH:MM:SS' into a datetime.time object."""
    try:
        parts = time_str.strip().split(":")
        if len(parts) >= 2:
            hour = int(parts[0])
            minute = int(parts[1])
            second = int(parts[2]) if len(parts) > 2 else 0
            return time(hour=hour, minute=minute, second=second)
        raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid time format '{time_str}'. Expected 'HH:MM' format (e.g. '08:00').",
        )


@router.get(
    "/settings",
    response_model=ReminderSettingsRead,
    summary="Get user's email reminder settings",
)
def get_reminder_settings(
    current_user: User = Depends(get_current_user),
) -> ReminderSettingsRead:
    """Returns the email reminder settings for the currently authenticated user."""
    am_str = current_user.am_reminder_time.strftime("%H:%M") if current_user.am_reminder_time else "06:00"
    pm_str = current_user.pm_reminder_time.strftime("%H:%M") if current_user.pm_reminder_time else "20:00"

    return ReminderSettingsRead(
        am_reminder_time=am_str,
        pm_reminder_time=pm_str,
        reminders_enabled=current_user.reminders_enabled,
    )


@router.patch(
    "/settings",
    response_model=ReminderSettingsRead,
    summary="Update user's email reminder settings",
)
def update_reminder_settings(
    payload: ReminderSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReminderSettingsRead:
    """Updates AM/PM reminder times or enabled status for the authenticated user."""
    if payload.reminders_enabled is not None:
        current_user.reminders_enabled = payload.reminders_enabled

    if payload.am_reminder_time is not None:
        new_am_time = parse_time_str(payload.am_reminder_time)
        current_user.am_reminder_time = new_am_time
        # Reset sent date when time changes so user receives email at new time
        current_user.am_email_sent_date = None

    if payload.pm_reminder_time is not None:
        new_pm_time = parse_time_str(payload.pm_reminder_time)
        current_user.pm_reminder_time = new_pm_time
        # Reset sent date when time changes so user receives email at new time
        current_user.pm_email_sent_date = None

    db.commit()
    db.refresh(current_user)

    am_str = current_user.am_reminder_time.strftime("%H:%M") if current_user.am_reminder_time else "06:00"
    pm_str = current_user.pm_reminder_time.strftime("%H:%M") if current_user.pm_reminder_time else "20:00"

    return ReminderSettingsRead(
        am_reminder_time=am_str,
        pm_reminder_time=pm_str,
        reminders_enabled=current_user.reminders_enabled,
    )
