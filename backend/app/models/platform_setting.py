from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    platform_name: Mapped[str] = mapped_column(String(120), default="ANNAPURNA", nullable=False)
    platform_description: Mapped[str] = mapped_column(
        Text,
        default="Food rescue and redistribution network connecting donors, NGOs, and volunteers.",
        nullable=False,
    )
    support_email: Mapped[str] = mapped_column(
        String(255), default="support@annapurna.org", nullable=False
    )
    support_phone: Mapped[str] = mapped_column(
        String(60), default="+1 (555) 234-5678", nullable=False
    )
    default_expiry_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    enable_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    maintenance_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_new_registrations: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
