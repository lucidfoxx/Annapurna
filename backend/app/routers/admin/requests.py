from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.models import (
    DonationRequest,
    FoodListing,
    User,
    VolunteerHandover,
)
from app.schemas.admin import AdminRequestModerate
from app.services.admin.audit_service import log_admin_action

router = APIRouter(prefix="/requests", tags=["Admin Requests"])


def _serialize_request(r: DonationRequest, listing: Optional[FoodListing] = None) -> dict:
    return {
        "id": r.id,
        "listing_id": r.listing_id,
        "listing_title": r.listing_title,
        "donor_id": listing.donor_id if listing else None,
        "donor_name": listing.donor_name if listing else None,
        "requester_id": r.requester_id,
        "requester_name": r.requester_name,
        "requested_quantity": r.requested_quantity or (listing.quantity if listing else "1"),
        "notes": r.notes,
        "status": r.status,
        "is_disputed": bool(r.is_disputed),
        "moderation_note": r.moderation_note,
        "created_at": r.created_at,
    }


@router.get("")
def list_admin_requests(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    donor_id: Optional[int] = Query(None),
    requester_id: Optional[int] = Query(None),
    disputed_only: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(DonationRequest)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(DonationRequest.listing_title).like(q)
            | func.lower(DonationRequest.requester_name).like(q)
            | func.lower(DonationRequest.notes).like(q)
        )

    if status_filter and status_filter.lower() != "all":
        query = query.filter(func.lower(DonationRequest.status) == status_filter.strip().lower())

    if requester_id is not None:
        query = query.filter(DonationRequest.requester_id == requester_id)

    if disputed_only:
        query = query.filter(DonationRequest.is_disputed.is_(True))

    if donor_id is not None:
        donor_listing_ids = [
            l.id for l in db.query(FoodListing.id).filter(FoodListing.donor_id == donor_id).all()
        ]
        query = query.filter(DonationRequest.listing_id.in_(donor_listing_ids))

    total = query.count()
    rows = (
        query.order_by(DonationRequest.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    listing_ids = {r.listing_id for r in rows}
    listings_by_id = {
        l.id: l
        for l in db.query(FoodListing).filter(FoodListing.id.in_(listing_ids)).all()
    } if listing_ids else {}

    return {
        "items": [_serialize_request(r, listings_by_id.get(r.listing_id)) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{request_id}")
def get_admin_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    req_item = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    listing = db.query(FoodListing).filter(FoodListing.id == req_item.listing_id).first()
    requester = db.query(User).filter(User.id == req_item.requester_id).first()
    handovers = (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.request_id == req_item.id)
        .all()
    )

    return {
        "request": _serialize_request(req_item, listing),
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "quantity": listing.quantity,
            "pickup_location": listing.pickup_location,
            "status": listing.status,
            "donor_id": listing.donor_id,
            "donor_name": listing.donor_name,
        }
        if listing
        else None,
        "recipient": {
            "id": requester.id,
            "full_name": requester.full_name,
            "email": requester.email,
            "organization": requester.organization,
            "status": requester.status,
        }
        if requester
        else None,
        "handovers": [
            {
                "id": h.id,
                "volunteer_id": h.volunteer_id,
                "volunteer_name": h.volunteer_name,
                "status": h.status,
                "pickup_location": h.pickup_location,
                "dropoff_location": h.dropoff_location,
                "created_at": h.created_at,
            }
            for h in handovers
        ],
    }


@router.patch("/{request_id}/moderate")
def moderate_request(
    request_id: int,
    payload: AdminRequestModerate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    req_item = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    listing = db.query(FoodListing).filter(FoodListing.id == req_item.listing_id).first()
    prev_val = _serialize_request(req_item, listing)

    updates = payload.model_dump(exclude_unset=True)
    if "is_disputed" in updates and updates["is_disputed"] is not None:
        req_item.is_disputed = bool(updates["is_disputed"])
    if "moderation_note" in updates:
        req_item.moderation_note = updates["moderation_note"]
    if "status" in updates and updates["status"]:
        req_item.status = updates["status"]
        if updates["status"] == "cancelled" and listing and listing.status == "requested":
            listing.status = "available"

    log_admin_action(
        db=db,
        admin=admin,
        action="REQUEST_MODERATED",
        entity_type="donation_requests",
        entity_id=req_item.id,
        previous_value=prev_val,
        new_value=_serialize_request(req_item, listing),
        request=request,
    )
    db.commit()
    db.refresh(req_item)
    return _serialize_request(req_item, listing)
