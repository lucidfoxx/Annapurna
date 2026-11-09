from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import normalize_role, require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.models import (
    DonationRequest,
    FoodListing,
    Notification,
    User,
    VolunteerHandover,
)
from app.services.admin.audit_service import parse_numeric_quantity

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])


@router.get("/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    all_users = db.query(User).all()
    all_listings = db.query(FoodListing).all()
    all_requests = db.query(DonationRequest).all()
    all_handovers = db.query(VolunteerHandover).all()
    audit_count = db.query(AuditLog).count()
    notif_count = db.query(Notification).count()

    total_users = len(all_users)
    total_donors = sum(1 for u in all_users if normalize_role(u.role) == "Donor")
    total_recipients = sum(1 for u in all_users if normalize_role(u.role) == "NGO")
    total_volunteers = sum(1 for u in all_users if normalize_role(u.role) == "Volunteer")
    total_admins = sum(1 for u in all_users if normalize_role(u.role) == "Admin")

    active_volunteers = sum(
        1
        for u in all_users
        if normalize_role(u.role) == "Volunteer"
        and (u.status or "active") == "active"
        and bool(u.is_available)
    )

    total_listings = len(all_listings)
    available_listings = sum(1 for l in all_listings if l.status == "available")
    flagged_listings = sum(1 for l in all_listings if l.is_flagged or l.status == "flagged")
    expired_listings = sum(1 for l in all_listings if l.status == "expired")

    pending_requests = sum(1 for r in all_requests if r.status == "pending")
    accepted_requests = sum(1 for r in all_requests if r.status == "accepted")
    rejected_requests = sum(1 for r in all_requests if r.status == "rejected")
    disputed_requests = sum(1 for r in all_requests if r.is_disputed)

    completed_donations = sum(
        1 for h in all_handovers if h.status == "delivered"
    )

    total_quantity_donated = round(
        sum(parse_numeric_quantity(l.quantity) for l in all_listings if l.status != "removed"),
        1,
    )

    completed_listing_ids = {
        h.listing_id for h in all_handovers if h.status == "delivered"
    }
    total_quantity_redistributed = round(
        sum(
            parse_numeric_quantity(l.quantity)
            for l in all_listings
            if l.id in completed_listing_ids or l.status == "completed"
        ),
        1,
    )

    total_platform_activity = (
        total_users
        + total_listings
        + len(all_requests)
        + len(all_handovers)
        + audit_count
        + notif_count
    )

    donation_activity_chart = [
        {"stage": "Available", "count": available_listings},
        {"stage": "Requested", "count": sum(1 for l in all_listings if l.status == "requested")},
        {"stage": "Claimed", "count": sum(1 for l in all_listings if l.status == "claimed")},
        {"stage": "Completed", "count": sum(1 for l in all_listings if l.status == "completed")},
        {"stage": "Flagged/Removed", "count": sum(1 for l in all_listings if l.status in ("removed", "flagged") or l.is_flagged)},
    ]

    user_registration_chart = [
        {"role": "Donors", "count": total_donors},
        {"role": "Recipients (NGO)", "count": total_recipients},
        {"role": "Volunteers", "count": total_volunteers},
        {"role": "Admins", "count": total_admins},
    ]

    request_status_chart = [
        {"status": "Pending", "count": pending_requests},
        {"status": "Accepted", "count": accepted_requests},
        {"status": "Rejected", "count": rejected_requests},
        {"status": "Disputed", "count": disputed_requests},
    ]

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_recipients": total_recipients,
        "total_volunteers": total_volunteers,
        "total_admins": total_admins,
        "total_listings": total_listings,
        "available_listings": available_listings,
        "flagged_listings": flagged_listings,
        "expired_listings": expired_listings,
        "pending_requests": pending_requests,
        "accepted_requests": accepted_requests,
        "rejected_requests": rejected_requests,
        "disputed_requests": disputed_requests,
        "completed_donations": completed_donations,
        "active_volunteers": active_volunteers,
        "total_quantity_donated": total_quantity_donated,
        "total_quantity_redistributed": total_quantity_redistributed,
        "total_platform_activity": total_platform_activity,
        "donation_activity_chart": donation_activity_chart,
        "user_registration_chart": user_registration_chart,
        "request_status_chart": request_status_chart,
    }


@router.get("/activity")
def get_admin_dashboard_activity(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    recent_users = (
        db.query(User)
        .order_by(User.id.desc())
        .limit(6)
        .all()
    )
    recent_listings = (
        db.query(FoodListing)
        .order_by(FoodListing.id.desc())
        .limit(6)
        .all()
    )
    recent_requests = (
        db.query(DonationRequest)
        .order_by(DonationRequest.id.desc())
        .limit(6)
        .all()
    )
    recent_audits = (
        db.query(AuditLog)
        .order_by(AuditLog.id.desc())
        .limit(8)
        .all()
    )

    return {
        "recent_registrations": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
                "created_at": u.created_at,
            }
            for u in recent_users
        ],
        "recent_listings": [
            {
                "id": l.id,
                "title": l.title,
                "category": l.category,
                "quantity": l.quantity,
                "status": l.status,
                "donor_name": l.donor_name,
                "is_flagged": l.is_flagged,
                "created_at": l.created_at,
            }
            for l in recent_listings
        ],
        "recent_requests": [
            {
                "id": r.id,
                "listing_id": r.listing_id,
                "listing_title": r.listing_title,
                "requester_name": r.requester_name,
                "status": r.status,
                "is_disputed": r.is_disputed,
                "created_at": r.created_at,
            }
            for r in recent_requests
        ],
        "recent_activity": [
            {
                "id": a.id,
                "admin_email": a.admin_email,
                "action": a.action,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "created_at": a.created_at,
            }
            for a in recent_audits
        ],
    }
