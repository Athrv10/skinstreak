"""
init_db.py — One-shot table creation script.

Run once after cloning the repo to create all tables in Supabase:
    python init_db.py

This script is idempotent — it uses CREATE TABLE IF NOT EXISTS semantics
via SQLAlchemy's checkfirst=True, so it is safe to re-run.
"""

import sys

# See main.py for why this is needed — Windows doesn't guarantee a UTF-8
# stdout, and the progress messages below use emoji.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

from database import Base, engine
import models  # noqa: F401 — import ensures models are registered on Base


def init() -> None:
    print("Connecting to database...")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    
    # Ensure password_hash and reminder columns exist on users table for existing databases
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS am_reminder_time TIME DEFAULT '06:00';"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS pm_reminder_time TIME DEFAULT '20:00';"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS am_email_sent_date DATE;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS pm_email_sent_date DATE;"))
        conn.commit()

    print("✅  Tables created/updated:")
    for table_name in Base.metadata.tables:
        print(f"   • {table_name}")

    # Seed a demo user if the users table is empty
    from sqlalchemy.orm import Session
    from models import User
    from auth_utils import hash_password

    with Session(engine) as session:
        existing = session.query(User).filter(User.email == "demo@skinstreak.app").first()
        if not existing:
            demo_user = User(
                email="demo@skinstreak.app",
                name="Demo User",
                password_hash=hash_password("password123"),
            )
            session.add(demo_user)
            session.commit()
            print("✅  Seeded demo user (email=demo@skinstreak.app, password=password123)")
        else:
            if not existing.password_hash:
                existing.password_hash = hash_password("password123")
                session.commit()
            print("ℹ️   Demo user ready (email=demo@skinstreak.app, password=password123)")


if __name__ == "__main__":
    init()
