from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.security import normalize_role, require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.models import (
    DonationRequest,
    FoodListing,
    User,
    VolunteerHandover,
)
from app.schemas.admin import AdminRoleUpdate, AdminStatusUpdate, AdminUserUpdate
from app.services.admin.audit_service import log_admin_action

router = APIRouter(prefix="/users", tags=["Admin Users"])


def _serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "status": u.status or "active",
        "phone": u.phone,
        "organization": u.organization,
        "is_available": bool(u.is_available),
        "created_at": u.created_at,
    }


def _count_active_admins(db: Session) -> int:
    admins = db.query(User).filter(func.lower(User.role) == "admin").all()
    return sum(1 for a in admins if (a.status or "active").lower() == "active")


@router.get("")
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        if search.strip().isdigit():
            query = query.filter(
                or_(
                    User.id == int(search.strip()),
                    func.lower(User.full_name).like(q),
                    func.lower(User.email).like(q),
                )
            )
        else:
            query = query.filter(
                or_(
                    func.lower(User.full_name).like(q),
                    func.lower(User.email).like(q),
                    func.lower(User.organization).like(q),
                )
            )

    if role and role.lower() != "all":
        normalized = normalize_role(role, allow_admin=True)
        query = query.filter(func.lower(User.role) == normalized.lower())

    if status_filter and status_filter.lower() != "all":
        query = query.filter(func.lower(User.status) == status_filter.strip().lower())

    total = query.count()
    items = (
        query.order_by(User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [_serialize_user(u) for u in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{user_id}")
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    donations = (
        db.query(FoodListing)
        .filter(FoodListing.donor_id == user.id)
        .order_by(FoodListing.id.desc())
        .all()
    )
    requests = (
        db.query(DonationRequest)
        .filter(DonationRequest.requester_id == user.id)
        .order_by(DonationRequest.id.desc())
        .all()
    )
    handovers = (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.volunteer_id == user.id)
        .order_by(VolunteerHandover.id.desc())
        .all()
    )
    audits = (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == "users", AuditLog.entity_id == str(user.id))
        .order_by(AuditLog.id.desc())
        .limit(20)
        .all()
    )

    return {
        "user": _serialize_user(user),
        "donation_history": [
            {
                "id": l.id,
                "title": l.title,
                "category": l.category,
                "quantity": l.quantity,
                "status": l.status,
                "created_at": l.created_at,
            }
            for l in donations
        ],
        "request_history": [
            {
                "id": r.id,
                "listing_id": r.listing_id,
                "listing_title": r.listing_title,
                "status": r.status,
                "created_at": r.created_at,
            }
            for r in requests
        ],
        "handover_history": [
            {
                "id": h.id,
                "listing_title": h.listing_title,
                "pickup_location": h.pickup_location,
                "dropoff_location": h.dropoff_location,
                "status": h.status,
                "created_at": h.created_at,
            }
            for h in handovers
        ],
        "audit_history": [
            {
                "id": a.id,
                "action": a.action,
                "admin_email": a.admin_email,
                "previous_value": a.previous_value,
                "new_value": a.new_value,
                "created_at": a.created_at,
            }
            for a in audits
        ],
    }


@router.patch("/{user_id}")
def update_user_profile(
    user_id: int,
    payload: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    prev_state = _serialize_user(user)
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"]:
        clean_email = updates["email"].strip().lower()
        conflict = (
            db.query(User)
            .filter(func.lower(User.email) == clean_email, User.id != user.id)
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another account is already using this email address.",
            )
        user.email = updates["email"].strip()

    if "full_name" in updates and updates["full_name"] is not None:
        user.full_name = updates["full_name"].strip()
    if "phone" in updates:
        user.phone = updates["phone"]
    if "organization" in updates:
        user.organization = updates["organization"]
    if "is_available" in updates and updates["is_available"] is not None:
        user.is_available = bool(updates["is_available"])

    log_admin_action(
        db=db,
        admin=admin,
        action="USER_PROFILE_UPDATED",
        entity_type="users",
        entity_id=user.id,
        previous_value=prev_state,
        new_value=_serialize_user(user),
        request=request,
    )
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.patch("/{user_id}/role")
def change_user_role(
    user_id: int,
    payload: AdminRoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    new_role = normalize_role(payload.role, allow_admin=True)
    current_role = normalize_role(user.role, allow_admin=True)

    if user.id == admin.id and new_role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security protection: You cannot remove your own Admin role.",
        )

    if current_role == "Admin" and new_role != "Admin":
        if _count_active_admins(db) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security protection: Cannot demote the last active administrator.",
            )

    prev_val = {"role": user.role}
    user.role = new_role

    log_admin_action(
        db=db,
        admin=admin,
        action="USER_ROLE_CHANGED",
        entity_type="users",
        entity_id=user.id,
        previous_value=prev_val,
        new_value={"role": new_role, "reason": payload.reason},
        request=request,
    )
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.patch("/{user_id}/status")
def change_user_status(
    user_id: int,
    payload: AdminStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    desired = payload.status.strip().lower()
    if desired not in ("active", "suspended", "deactivated"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Allowed values: active, suspended, deactivated.",
        )

    if user.id == admin.id and desired != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security protection: You cannot suspend or deactivate your own Admin account.",
        )

    if normalize_role(user.role, allow_admin=True) == "Admin" and desired != "active":
        if _count_active_admins(db) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security protection: Cannot suspend or deactivate the last active administrator.",
            )

    prev_status = user.status
    user.status = desired

    action_name = (
        "USER_RESTORED"
        if desired == "active"
        else "USER_SUSPENDED"
        if desired == "suspended"
        else "USER_DEACTIVATED"
    )
    log_admin_action(
        db=db,
        admin=admin,
        action=action_name,
        entity_type="users",
        entity_id=user.id,
        previous_value={"status": prev_status},
        new_value={"status": desired, "reason": payload.reason},
        request=request,
    )
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.delete("/{user_id}")
def delete_user_account(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security protection: You cannot delete your own Admin account.",
        )

    if normalize_role(user.role, allow_admin=True) == "Admin" and _count_active_admins(db) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security protection: Cannot delete the last active administrator.",
        )

    snapshot = _serialize_user(user)
    log_admin_action(
        db=db,
        admin=admin,
        action="USER_DELETED",
        entity_type="users",
        entity_id=user.id,
        previous_value=snapshot,
        new_value=None,
        request=request,
    )
    db.delete(user)
    db.commit()
    return {"detail": "User deleted.", "deleted_id": user_id}
