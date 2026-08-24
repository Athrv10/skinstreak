"""
database.py — SQLAlchemy engine and session factory.
Reads DATABASE_URL from the .env file at the project root.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Load .env from the project root (one level above /backend)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not set. Make sure a .env file exists at the project root."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # drop stale connections automatically
    pool_recycle=300,     # recycle connections every 5 minutes
    echo=False,           # set True to log SQL queries during debugging
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency — yields a DB session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
