"""
streak_utils.py — Streak calculation algorithms.
"""

from datetime import timedelta
from typing import Any, Dict

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import DailyRoutine
from timezone_utils import ist_today


def get_user_streak_info(user_id: int, db: Session) -> Dict[str, Any]:
    """
    Calculates current_streak, longest_streak, and last_completed_date
    for a user based on their historical daily_routines records.

    A day is considered completed if am_done OR pm_done is True.
    """
    today = ist_today()

    # Fetch all routines for user, ordered by date descending
    routines = (
        db.query(DailyRoutine)
        .filter(DailyRoutine.user_id == user_id)
        .order_by(DailyRoutine.routine_date.desc())
        .all()
    )

    if not routines:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_completed_date": None,
            "is_streak_broken": False,
        }

    # Map of date -> DailyRoutine
    routine_map = {r.routine_date: r for r in routines}
    completed_dates = {r.routine_date for r in routines if r.am_done or r.pm_done}

    # 1. Last completed date
    sorted_completed = sorted(list(completed_dates), reverse=True)
    last_completed_date = sorted_completed[0] if sorted_completed else None

    # 2. Current streak calculation
    current_streak = 0
    check_date = today

    # If today is completed, count starting from today
    if today in completed_dates:
        while check_date in completed_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
    else:
        # If today is not completed yet, check starting from yesterday
        yesterday = today - timedelta(days=1)
        check_date = yesterday
        while check_date in completed_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

    # 3. Longest streak calculation across all time
    longest_streak = 0
    if sorted_completed:
        temp_streak = 0
        all_dates_ascending = sorted(list(completed_dates))
        
        for i in range(len(all_dates_ascending)):
            if i == 0:
                temp_streak = 1
            else:
                prev_date = all_dates_ascending[i - 1]
                curr_date = all_dates_ascending[i]
                if curr_date == prev_date + timedelta(days=1):
                    temp_streak += 1
                else:
                    temp_streak = 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak

    # Handle current streak surpassing historical longest
    if current_streak > longest_streak:
        longest_streak = current_streak

    # Check if streak was broken (e.g., missed yesterday and today not done)
    yesterday = today - timedelta(days=1)
    is_streak_broken = (
        last_completed_date is not None
        and last_completed_date < yesterday
        and current_streak == 0
    )

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_completed_date": last_completed_date,
        "is_streak_broken": is_streak_broken,
    }


def get_or_create_today_routine(user_id: int, db: Session) -> DailyRoutine:
    """
    Fetches today's (IST) DailyRoutine for a user, creating a blank one if it
    doesn't exist yet. Guards against the race condition where two concurrent
    requests (e.g. duplicate button taps) both see no existing row and both
    try to insert one — the unique (user_id, routine_date) constraint would
    otherwise surface as an unhandled IntegrityError on the losing request.
    """
    today = ist_today()

    routine = (
        db.query(DailyRoutine)
        .filter(DailyRoutine.user_id == user_id, DailyRoutine.routine_date == today)
        .first()
    )
    if routine is not None:
        return routine

    routine = DailyRoutine(
        user_id=user_id,
        routine_date=today,
        am_done=False,
        pm_done=False,
        streak_count=0,
    )
    db.add(routine)
    try:
        db.commit()
    except IntegrityError:
        # Another concurrent request won the insert race — fall back to it.
        db.rollback()
        routine = (
            db.query(DailyRoutine)
            .filter(DailyRoutine.user_id == user_id, DailyRoutine.routine_date == today)
            .first()
        )
        if routine is None:
            raise
    return routine
