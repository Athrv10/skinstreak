"""
email_service.py — Email notification service using Resend SDK.
Provides HTML email templates for AM and PM skincare routine reminders.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import resend

# Windows doesn't guarantee a UTF-8 stdout/stderr (it depends on how the
# process was launched), but the log messages below use emoji — force UTF-8
# so this module never crashes on print() regardless of the host console.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# Ensure environment variables are loaded
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
APP_URL = os.getenv("APP_URL", "http://localhost:5173").rstrip("/")

resend.api_key = RESEND_API_KEY


def get_am_motivational_message(streak: int) -> str:
    """Returns a motivational message based on user's current streak count."""
    if streak == 0:
        return "Start your journey today! Every great skin routine begins with Day 1."
    elif 1 <= streak <= 6:
        return f"Great job getting started! {streak} day streak. Consistency builds the glow."
    elif 7 <= streak <= 13:
        return f"1 week milestone reached ({streak} days)! Keep that amazing momentum going."
    elif 14 <= streak <= 29:
        return f"You're a routine master with a {streak}-day streak! Glowing skin is your reward."
    else:
        return f"Legendary status! {streak}+ days of dedicated skincare excellence."


def build_am_email_html(user_name: str, streak_count: int) -> str:
    """Renders the HTML email body for Morning (AM) skincare reminder."""
    name = user_name.split()[0] if user_name else "Glow Setter"
    motivation = get_am_motivational_message(streak_count)
    checkin_url = f"{APP_URL}/checkin"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AM Skincare Routine Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF5E4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF5E4; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 107, 107, 0.15);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #FF6B6B; padding: 32px 20px; text-align: center;">
              <div style="font-size: 28px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.5px;">✦ SkinStreak</div>
              <p style="margin: 6px 0 0 0; color: #FFE3E3; font-size: 14px; font-weight: 500;">Your Personal Skincare Habit Tracker</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px; background-color: #FFFFFF;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #1A202C;">☀️ Good Morning, {name}!</h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                It's time for your morning skincare routine. Cleanse, hydrate, and protect your skin for the day ahead!
              </p>

              <!-- Streak Box -->
              <div style="background-color: #FFF5E4; border: 2px dashed #FF6B6B; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 36px; display: block; margin-bottom: 4px;">🔥</span>
                <div style="font-size: 24px; font-weight: 800; color: #FF6B6B;">{streak_count} Day Streak</div>
                <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 600; color: #718096;">{motivation}</p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 16px 0;">
                    <a href="{checkin_url}" style="display: inline-block; background-color: #FF6B6B; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);">
                      Start My Morning Routine ☀️
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAFA; border-top: 1px solid #EDF2F7; padding: 20px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #A0AEC0;">
                You're receiving this because you enabled reminders in SkinStreak.
              </p>
              <p style="margin: 0; font-size: 12px; color: #A0AEC0;">
                To turn off reminders, visit your Profile settings in the app.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_pm_email_html(user_name: str, streak_count: int, am_done_today: bool) -> str:
    """Renders the HTML email body for Evening (PM) skincare reminder."""
    name = user_name.split()[0] if user_name else "Glow Setter"
    checkin_url = f"{APP_URL}/checkin"

    if streak_count > 0:
        urgency_msg = f"Don't lose your {streak_count} day streak! Complete your night routine before bed to keep your streak glowing."
    else:
        urgency_msg = "Wrap up your day with a soothing night routine and start building your streak!"

    am_status_html = (
        '<span style="color: #38A169; font-weight: 700;">✓ Completed</span>'
        if am_done_today
        else '<span style="color: #E53E3E; font-weight: 700;">○ Pending</span>'
    )

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PM Skincare Routine Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF5E4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF5E4; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 107, 107, 0.15);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #FF6B6B; padding: 32px 20px; text-align: center;">
              <div style="font-size: 28px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.5px;">✦ SkinStreak</div>
              <p style="margin: 6px 0 0 0; color: #FFE3E3; font-size: 14px; font-weight: 500;">Your Personal Skincare Habit Tracker</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px; background-color: #FFFFFF;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #1A202C;">🌙 Good Evening, {name}!</h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                {urgency_msg}
              </p>

              <!-- Progress Banner -->
              <div style="background-color: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                  <span><strong>Current Streak:</strong> 🔥 {streak_count} Days</span>
                </div>
                <div style="font-size: 14px;">
                  <span><strong>Today's AM Routine:</strong> {am_status_html}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 16px 0;">
                    <a href="{checkin_url}" style="display: inline-block; background-color: #FF6B6B; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);">
                      Complete Night Routine 🌙
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAFA; border-top: 1px solid #EDF2F7; padding: 20px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #A0AEC0;">
                You're receiving this because you enabled reminders in SkinStreak.
              </p>
              <p style="margin: 0; font-size: 12px; color: #A0AEC0;">
                To turn off reminders, visit your Profile settings in the app.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_am_reminder_email(to_email: str, user_name: str, streak_count: int) -> bool:
    """Sends morning skincare reminder email using Resend API."""
    subject = "☀️ Good Morning! Time for your AM skincare routine"
    html_content = build_am_email_html(user_name, streak_count)

    try:
        response = resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        })
        print(f"✅ AM reminder email sent to {to_email}. ID: {response.get('id', 'N/A')}")
        return True
    except Exception as e:
        print(f"❌ Failed to send AM reminder email to {to_email}: {e}")
        return False


def send_pm_reminder_email(
    to_email: str, user_name: str, streak_count: int, am_done_today: bool
) -> bool:
    """Sends evening skincare reminder email using Resend API."""
    subject = "🌙 Evening reminder — Don't break your streak!"
    html_content = build_pm_email_html(user_name, streak_count, am_done_today)

    try:
        response = resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        })
        print(f"✅ PM reminder email sent to {to_email}. ID: {response.get('id', 'N/A')}")
        return True
    except Exception as e:
        print(f"❌ Failed to send PM reminder email to {to_email}: {e}")
        return False
