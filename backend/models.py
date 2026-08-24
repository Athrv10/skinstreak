"""
models.py — SQLAlchemy ORM models.

Tables created:
  • users          – registered app users
  • daily_routines – one row per (user, date), tracking AM/PM completion
  • photos         – progress photos captured during daily check-ins
"""

from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    am_reminder_time: Mapped[time | None] = mapped_column(Time, default=time(6, 0), nullable=True)
    pm_reminder_time: Mapped[time | None] = mapped_column(Time, default=time(20, 0), nullable=True)
    reminders_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default="true")
    am_email_sent_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pm_email_sent_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    routines: Mapped[list["DailyRoutine"]] = relationship(
        "DailyRoutine", back_populates="user", cascade="all, delete-orphan"
    )
    photos: Mapped[list["Photo"]] = relationship(
        "Photo", back_populates="user", cascade="all, delete-orphan"
    )


    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


class DailyRoutine(Base):
    __tablename__ = "daily_routines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    routine_date: Mapped[date] = mapped_column(Date, nullable=False)
    am_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pm_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    streak_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="routines")
    photos: Mapped[list["Photo"]] = relationship(
        "Photo", back_populates="daily_routine", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "routine_date", name="uq_user_routine_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<DailyRoutine user_id={self.user_id} date={self.routine_date} "
            f"am={self.am_done} pm={self.pm_done}>"
        )


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    daily_routine_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("daily_routines.id", ondelete="SET NULL"), nullable=True
    )
    storage_url: Mapped[str] = mapped_column(String, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="photos")
    daily_routine: Mapped["DailyRoutine | None"] = relationship(
        "DailyRoutine", back_populates="photos"
    )

    def __repr__(self) -> str:
        return f"<Photo id={self.id} user_id={self.user_id} url={self.storage_url!r}>"
