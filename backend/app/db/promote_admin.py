import argparse
import getpass
import os
import sys
from sqlalchemy import func

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.audit_log import AuditLog
from app.models.models import User


def promote_or_create_admin(email: str, full_name: str | None = None, password: str | None = None) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        clean_email = email.strip().lower()
        user = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if user:
            prev_role = user.role
            user.role = "Admin"
            user.status = "active"
            if full_name:
                user.full_name = full_name.strip()
            if password:
                user.hashed_password = get_password_hash(password)
            db.add(
                AuditLog(
                    admin_id=user.id,
                    admin_email=user.email,
                    action="CLI_PROMOTE_ADMIN",
                    entity_type="users",
                    entity_id=str(user.id),
                    previous_value=f'{{"role": "{prev_role}"}}',
                    new_value='{"role": "Admin"}',
                    ip_address="127.0.0.1",
                    user_agent="promote_admin_cli",
                )
            )
            db.commit()
            print(f"Promoted existing user '{user.email}' (ID: {user.id}) to Admin.")
        else:
            if not password:
                password = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD")
            if not password:
                password = getpass.getpass(f"Enter password for new Admin ({email}): ")
            if not password or len(password) < 8:
                print("Error: Admin password must be at least 8 characters.", file=sys.stderr)
                sys.exit(1)
            new_admin = User(
                full_name=(full_name or email.split("@")[0]).strip(),
                email=email.strip(),
                hashed_password=get_password_hash(password),
                role="Admin",
                status="active",
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            db.add(
                AuditLog(
                    admin_id=new_admin.id,
                    admin_email=new_admin.email,
                    action="CLI_CREATE_ADMIN",
                    entity_type="users",
                    entity_id=str(new_admin.id),
                    previous_value=None,
                    new_value='{"role": "Admin", "status": "active"}',
                    ip_address="127.0.0.1",
                    user_agent="promote_admin_cli",
                )
            )
            db.commit()
            print(f"Created new Admin account '{new_admin.email}' (ID: {new_admin.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Controlled CLI utility to promote an existing user or create the first Administrator."
    )
    parser.add_argument("--email", required=True, help="Email address of the user to promote or create as Admin")
    parser.add_argument("--name", required=False, help="Full name of the administrator")
    parser.add_argument(
        "--password",
        required=False,
        help="Password (optional if promoting an existing user, or set ADMIN_BOOTSTRAP_PASSWORD env var)",
    )
    args = parser.parse_args()
    promote_or_create_admin(email=args.email, full_name=args.name, password=args.password)
