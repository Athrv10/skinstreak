"""
timezone_utils.py — India Standard Time (IST, UTC+5:30) helpers.

The backend host's system clock is not guaranteed to be IST (cloud hosts
commonly default to UTC), but SkinStreak is a single-user app for someone
in India. "Today", streak day-boundaries, and reminder-time comparisons
must all be anchored to IST rather than the host's local system time, or
they silently drift by up to 5.5 hours depending on where/how the server
is run. India does not observe daylight saving time, so a fixed UTC+5:30
offset is used rather than a zoneinfo database lookup — this also avoids
requiring the optional `tzdata` package on Windows, where the IANA
timezone database isn't bundled with Python.
"""

from datetime import date, datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))


def ist_now() -> datetime:
    """Returns the current timezone-aware datetime in IST."""
    return datetime.now(IST)


def ist_today() -> date:
    """Returns today's calendar date in IST."""
    return ist_now().date()
