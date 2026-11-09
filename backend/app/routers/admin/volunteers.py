from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import normalize_role, require_admin
from app.db.session import get_db
from app.models.models import User, VolunteerHandover
from app.schemas.admin import AdminVolunteerReassign
from app.services.admin.audit_service import log_admin_action

router = APIRouter(prefix="/volunteers", tags=["Admin Volunteers"])


@router.get("")
def list_volunteers(
    search: Optional[str] = Query(None),
    availability: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    volunteers = (
        db.query(User)
        .filter(func.lower(User.role) == "volunteer")
        .order_by(User.id.desc())
        .all()
    )
    all_handovers = db.query(VolunteerHandover).all()

    items = []
    for v in volunteers:
        if search and search.strip():
            q = search.strip().lower()
            if q not in v.full_name.lower() and q not in v.email.lower():
                continue
        if availability == "available" and not v.is_available:
            continue
        if availability == "unavailable" and v.is_available:
            continue

        v_handovers = [h for h in all_handovers if h.volunteer_id == v.id]
        assigned_count = sum(
            1 for h in v_handovers if h.status in ("assigned", "picked_up")
        )
        completed_count = sum(1 for h in v_handovers if h.status == "delivered")

        items.append(
            {
                "id": v.id,
                "full_name": v.full_name,
                "email": v.email,
                "phone": v.phone,
                "organization": v.organization,
                "status": v.status or "active",
                "is_available": bool(v.is_available),
                "assigned_runs": assigned_count,
                "completed_deliveries": completed_count,
                "total_assignments": len(v_handovers),
                "created_at": v.created_at,
            }
        )

    pending_handovers = [
        {
            "id": h.id,
            "request_id": h.request_id,
            "listing_id": h.listing_id,
            "listing_title": h.listing_title,
            "pickup_location": h.pickup_location,
            "dropoff_location": h.dropoff_location,
            "volunteer_id": h.volunteer_id,
            "volunteer_name": h.volunteer_name,
            "status": h.status,
            "created_at": h.created_at,
        }
        for h in all_handovers
        if h.status != "delivered"
    ]

    return {
        "items": items,
        "total": len(items),
        "pending_handovers": pending_handovers,
    }


@router.get("/{volunteer_id}")
def get_volunteer_profile(
    volunteer_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    vol = db.query(User).filter(User.id == volunteer_id).first()
    if not vol or normalize_role(vol.role) != "Volunteer":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found."
        )

    assignments = (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.volunteer_id == vol.id)
        .order_by(VolunteerHandover.id.desc())
        .all()
    )

    return {
        "volunteer": {
            "id": vol.id,
            "full_name": vol.full_name,
            "email": vol.email,
            "phone": vol.phone,
            "organization": vol.organization,
            "status": vol.status,
            "is_available": bool(vol.is_available),
            "created_at": vol.created_at,
        },
        "assignments": [
            {
                "id": h.id,
                "request_id": h.request_id,
                "listing_id": h.listing_id,
                "listing_title": h.listing_title,
                "pickup_location": h.pickup_location,
                "dropoff_location": h.dropoff_location,
                "status": h.status,
                "notes": h.notes,
                "created_at": h.created_at,
            }
            for h in assignments
        ],
    }


@router.get("/{volunteer_id}/assignments")
def get_volunteer_assignments(
    volunteer_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    assignments = (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.volunteer_id == volunteer_id)
        .order_by(VolunteerHandover.id.desc())
        .all()
    )
    return [
        {
            "id": h.id,
            "request_id": h.request_id,
            "listing_id": h.listing_id,
            "listing_title": h.listing_title,
            "pickup_location": h.pickup_location,
            "dropoff_location": h.dropoff_location,
            "status": h.status,
            "notes": h.notes,
            "created_at": h.created_at,
        }
        for h in assignments
    ]


@router.post("/handovers/{handover_id}/reassign")
def reassign_volunteer_handover(
    handover_id: int,
    payload: AdminVolunteerReassign,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    handover = (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.id == handover_id)
        .first()
    )
    if not handover:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Handover not found."
        )

    prev_val = {
        "volunteer_id": handover.volunteer_id,
        "volunteer_name": handover.volunteer_name,
        "status": handover.status,
    }

    if payload.volunteer_id is not None:
        vol = db.query(User).filter(User.id == payload.volunteer_id).first()
        if not vol or normalize_role(vol.role) != "Volunteer":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user is not a valid Volunteer.",
            )
        handover.volunteer_id = vol.id
        handover.volunteer_name = vol.full_name
        if handover.status == "available":
            handover.status = "assigned"
    else:
        handover.volunteer_id = None
        handover.volunteer_name = None
        handover.status = "available"

    if payload.status:
        handover.status = payload.status
    if payload.notes is not None:
        handover.notes = payload.notes

    log_admin_action(
        db=db,
        admin=admin,
        action="VOLUNTEER_REASSIGNED",
        entity_type="volunteer_handovers",
        entity_id=handover.id,
        previous_value=prev_val,
        new_value={
            "volunteer_id": handover.volunteer_id,
            "volunteer_name": handover.volunteer_name,
            "status": handover.status,
        },
        request=request,
    )
    db.commit()
    db.refresh(handover)
    return {
        "id": handover.id,
        "request_id": handover.request_id,
        "listing_id": handover.listing_id,
        "listing_title": handover.listing_title,
        "pickup_location": handover.pickup_location,
        "dropoff_location": handover.dropoff_location,
        "volunteer_id": handover.volunteer_id,
        "volunteer_name": handover.volunteer_name,
        "status": handover.status,
        "notes": handover.notes,
        "created_at": handover.created_at,
    }
