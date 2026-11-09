from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import normalize_role, require_admin
from app.db.session import get_db
from app.models.models import Notification, User
from app.models.platform_setting import PlatformSetting
from app.schemas.admin import BroadcastNotificationCreate, PlatformSettingsUpdate
from app.services.admin.audit_service import log_admin_action

router = APIRouter(tags=["Admin Settings & Notifications"])


def _get_or_create_settings(db: Session) -> PlatformSetting:
    row = db.query(PlatformSetting).first()
    if not row:
        row = PlatformSetting(
            platform_name="ANNAPURNA",
            platform_description="Food rescue and redistribution platform connecting food donors, NGOs/recipients, and volunteers.",
            support_email="support@annapurna.org",
            support_phone="+1 (555) 234-5678",
            default_expiry_hours=24,
            enable_notifications=True,
            maintenance_mode=False,
            allow_new_registrations=True,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _serialize_settings(row: PlatformSetting) -> dict:
    return {
        "id": row.id,
        "platform_name": row.platform_name,
        "platform_description": row.platform_description,
        "support_email": row.support_email,
        "support_phone": row.support_phone,
        "default_expiry_hours": row.default_expiry_hours,
        "enable_notifications": bool(row.enable_notifications),
        "maintenance_mode": bool(row.maintenance_mode),
        "allow_new_registrations": bool(row.allow_new_registrations),
        "updated_by_id": row.updated_by_id,
        "updated_at": row.updated_at,
    }


@router.get("/settings")
def get_platform_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    row = _get_or_create_settings(db)
    return _serialize_settings(row)


@router.patch("/settings")
def update_platform_settings(
    payload: PlatformSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    row = _get_or_create_settings(db)
    prev_val = _serialize_settings(row)

    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(row, k, v)
    row.updated_by_id = admin.id

    log_admin_action(
        db=db,
        admin=admin,
        action="PLATFORM_SETTINGS_UPDATED",
        entity_type="platform_settings",
        entity_id=row.id,
        previous_value=prev_val,
        new_value=_serialize_settings(row),
        request=request,
    )
    db.commit()
    db.refresh(row)
    return _serialize_settings(row)


@router.post("/notifications/broadcast", status_code=status.HTTP_201_CREATED)
def send_broadcast_notification(
    payload: BroadcastNotificationCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if not payload.message or not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notification message is required.",
        )

    target = (payload.target_role or "all").strip().lower()
    users_query = db.query(User)
    if target != "all":
        norm = normalize_role(target, allow_admin=True)
        users_query = users_query.filter(func.lower(User.role) == norm.lower())

    recipients = users_query.all()
    for u in recipients:
        db.add(
            Notification(
                user_id=u.id,
                message=f"[Admin Announcement] {payload.message.strip()}",
                is_read=False,
            )
        )

    log_admin_action(
        db=db,
        admin=admin,
        action="NOTIFICATION_BROADCAST",
        entity_type="notifications",
        entity_id=target,
        previous_value=None,
        new_value={"message": payload.message.strip(), "recipients_count": len(recipients)},
        request=request,
    )
    db.commit()
    return {
        "detail": "Broadcast notification sent.",
        "recipients_count": len(recipients),
        "target_role": target,
    }
