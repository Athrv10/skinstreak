"""
routers/routine.py — Routine endpoints.

GET /routine/today
  Returns today's routine for the authenticated user.
  If no record exists yet, auto-creates a blank one and returns it.

PATCH /routine/today
  Toggles AM/PM completion and optionally saves notes.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import DailyRoutineRead
from streak_utils import get_or_create_today_routine, get_user_streak_info

router = APIRouter(prefix="/routine", tags=["routine"])


@router.get(
    "/today",
    response_model=DailyRoutineRead,
    summary="Get today's routine status",
)
def get_today_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyRoutineRead:
    """
    Returns the current day's routine record for the authenticated user.
    If none exists, creates a blank record (am_done=False, pm_done=False).
    """
    routine = get_or_create_today_routine(current_user.id, db)

    # Recalculate streak count dynamically
    streak_info = get_user_streak_info(current_user.id, db)
    routine.streak_count = streak_info["current_streak"]
    db.commit()
    db.refresh(routine)

    return routine


@router.patch(
    "/today",
    response_model=DailyRoutineRead,
    summary="Toggle AM or PM routine completion for today, optionally save notes",
)
def update_today_routine(
    am_done: Optional[bool] = Query(None, description="Mark AM routine as done or undone"),
    pm_done: Optional[bool] = Query(None, description="Mark PM routine as done or undone"),
    notes: Optional[str] = Query(None, description="Optional notes for today's routine"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyRoutineRead:
    """Updates today's routine status and/or notes for the authenticated user."""
    routine = get_or_create_today_routine(current_user.id, db)

    if am_done is not None:
        routine.am_done = am_done
    if pm_done is not None:
        routine.pm_done = pm_done
    if notes is not None:
        routine.notes = notes.strip() if notes.strip() else None

    db.commit()

    # Recalculate streak count dynamically after toggle
    streak_info = get_user_streak_info(current_user.id, db)
    routine.streak_count = streak_info["current_streak"]
    db.commit()
    db.refresh(routine)

    return routine
