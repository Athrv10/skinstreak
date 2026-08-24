"""
routers/streak.py — Streak metrics & monthly calendar endpoints.
"""

import calendar
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import DailyRoutine, User
from schemas import CalendarDayResponse, StreakResponse
from streak_utils import get_user_streak_info
from timezone_utils import ist_today

router = APIRouter(prefix="/streak", tags=["streak"])


@router.get(
    "",
    response_model=StreakResponse,
    summary="Get current & longest streak statistics",
)
def get_streak_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreakResponse:
    """Calculates and returns user's current streak, longest streak, and last completed date."""
    info = get_user_streak_info(current_user.id, db)
    return StreakResponse(**info)


@router.get(
    "/calendar",
    response_model=List[CalendarDayResponse],
    summary="Get monthly routine completion calendar",
)
def get_calendar_history(
    year: Optional[int] = Query(None, description="Year (e.g. 2026)"),
    month: Optional[int] = Query(None, description="Month (1-12)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CalendarDayResponse]:
    """
    Returns an array of daily completion statuses for all days in the specified month/year.
    Defaults to current year and month if omitted.
    """
    today = ist_today()
    target_year = year or today.year
    target_month = month or today.month

    # Get start and end of month
    _, num_days = calendar.monthrange(target_year, target_month)
    month_start = date(target_year, target_month, 1)
    month_end = date(target_year, target_month, num_days)

    # Query routines in range
    routines = (
        db.query(DailyRoutine)
        .filter(
            DailyRoutine.user_id == current_user.id,
            DailyRoutine.routine_date >= month_start,
            DailyRoutine.routine_date <= month_end,
        )
        .all()
    )
    routine_map = {r.routine_date: r for r in routines}

    result: List[CalendarDayResponse] = []
    for day in range(1, num_days + 1):
        d = date(target_year, target_month, day)
        r = routine_map.get(d)
        am_done = r.am_done if r else False
        pm_done = r.pm_done if r else False
        is_completed = am_done or pm_done

        if d > today:
            status = "future"
        elif d == today:
            status = "completed" if is_completed else "pending"
        else:  # d < today
            status = "completed" if is_completed else "missed"

        result.append(
            CalendarDayResponse(
                date=d,
                status=status,
                am_done=am_done,
                pm_done=pm_done,
                is_today=(d == today),
            )
        )

    return result
