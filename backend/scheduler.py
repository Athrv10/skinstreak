"""
scheduler.py — APScheduler background job service.

Runs every minute to check users with enabled email reminders,
compares current time against user preferences, and sends AM/PM reminder emails.
"""

import sys

# Windows doesn't guarantee a UTF-8 stdout/stderr (it depends on how the
# process was launched), but the log messages below use emoji — force UTF-8
# so this module never crashes on print() regardless of the host console.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from database import SessionLocal
from email_service import send_am_reminder_email, send_pm_reminder_email
from models import DailyRoutine, User
from streak_utils import get_user_streak_info
from timezone_utils import IST, ist_now

# Global scheduler instance
scheduler = BackgroundScheduler(daemon=True, timezone=IST)


def check_and_send_reminders() -> None:
    """
    Executes every minute to evaluate reminder schedules for all users.
    Checks am_reminder_time and pm_reminder_time against current HH:MM
    in IST, verifies emails haven't been sent today, and dispatches via Resend.
    """
    now = ist_now()
    current_time_str = now.strftime("%H:%M")
    today = now.date()

    db: Session = SessionLocal()
    try:
        # Fetch active users with reminders enabled
        users = db.query(User).filter(User.reminders_enabled == True).all()

        for user in users:
            # ─── 1. AM Reminder Check ───────────────────────────────────────
            if user.am_reminder_time:
                am_time_str = user.am_reminder_time.strftime("%H:%M")
                if am_time_str == current_time_str and user.am_email_sent_date != today:
                    streak_info = get_user_streak_info(user.id, db)
                    current_streak = streak_info.get("current_streak", 0)

                    success = send_am_reminder_email(
                        to_email=user.email,
                        user_name=user.name or "Glow Setter",
                        streak_count=current_streak,
                    )
                    if success:
                        user.am_email_sent_date = today
                        db.commit()

            # ─── 2. PM Reminder Check ───────────────────────────────────────
            if user.pm_reminder_time:
                pm_time_str = user.pm_reminder_time.strftime("%H:%M")
                if pm_time_str == current_time_str and user.pm_email_sent_date != today:
                    streak_info = get_user_streak_info(user.id, db)
                    current_streak = streak_info.get("current_streak", 0)

                    # Check if today's AM routine was done
                    today_routine = (
                        db.query(DailyRoutine)
                        .filter(
                            DailyRoutine.user_id == user.id,
                            DailyRoutine.routine_date == today,
                        )
                        .first()
                    )
                    am_done_today = today_routine.am_done if today_routine else False

                    success = send_pm_reminder_email(
                        to_email=user.email,
                        user_name=user.name or "Glow Setter",
                        streak_count=current_streak,
                        am_done_today=am_done_today,
                    )
                    if success:
                        user.pm_email_sent_date = today
                        db.commit()

    except Exception as e:
        print(f"⚠️ Error during reminder scheduler run: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> None:
    """Starts the APScheduler background job manager."""
    if not scheduler.running:
        scheduler.add_job(
            check_and_send_reminders,
            trigger="cron",
            minute="*",
            id="skin_streak_email_reminder_job",
            replace_existing=True,
        )
        scheduler.start()
        print("⏰ APScheduler background reminder service started (checking every minute).")


def stop_scheduler() -> None:
    """Shuts down the APScheduler background job manager cleanly."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("⏰ APScheduler background reminder service stopped.")
