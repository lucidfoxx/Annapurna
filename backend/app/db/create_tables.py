from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.models import User
from app.models.platform_setting import PlatformSetting
import app.models.audit_log  # noqa: F401


def seed_default_users_and_settings() -> None:
    db = SessionLocal()
    try:
        defaults = [
            {
                "full_name": "Test Donor 1",
                "email": "donor1@shareplate.org",
                "password": "password123",
                "role": "Donor",
                "organization": "Green Harvest Kitchen",
            },
            {
                "full_name": "Hope Kitchen NGO",
                "email": "ngo1@shareplate.org",
                "password": "password123",
                "role": "NGO",
                "organization": "Hope Community Shelter",
            },
            {
                "full_name": "Alex Volunteer",
                "email": "volunteer1@shareplate.org",
                "password": "password123",
                "role": "Volunteer",
                "organization": "City Rescue Corps",
            },
            {
                "full_name": "Platform Admin",
                "email": "admin@shareplate.org",
                "password": "password123",
                "role": "Admin",
                "organization": "ANNAPURNA Governance",
            },
        ]
        for item in defaults:
            existing = db.query(User).filter(User.email == item["email"]).first()
            if not existing:
                db.add(
                    User(
                        full_name=item["full_name"],
                        email=item["email"],
                        hashed_password=get_password_hash(item["password"]),
                        role=item["role"],
                        status="active",
                        organization=item["organization"],
                        is_available=True,
                    )
                )

        settings_row = db.query(PlatformSetting).first()
        if not settings_row:
            db.add(
                PlatformSetting(
                    platform_name="ANNAPURNA",
                    platform_description="Food rescue and redistribution platform connecting food donors, NGOs/recipients, and volunteers.",
                    support_email="support@annapurna.org",
                    support_phone="+1 (555) 234-5678",
                    default_expiry_hours=24,
                    enable_notifications=True,
                    maintenance_mode=False,
                    allow_new_registrations=True,
                )
            )
        db.commit()
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    seed_default_users_and_settings()


if __name__ == "__main__":
    print("Initializing database tables and platform settings...")
    init_db()
    print("Database ready. To promote a user to Admin, run:")
    print("  uv run python -m app.db.promote_admin --email <user@email.com>")
