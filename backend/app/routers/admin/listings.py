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
from app.schemas.admin import AdminListingModerate
from app.services.admin.audit_service import log_admin_action

router = APIRouter(prefix="/listings", tags=["Admin Listings"])


def _serialize_listing(l: FoodListing) -> dict:
    return {
        "id": l.id,
        "title": l.title,
        "description": l.description,
        "category": l.category or "cooked_meals",
        "quantity": l.quantity,
        "pickup_location": l.pickup_location,
        "expiry_time": l.expiry_time,
        "status": l.status,
        "is_flagged": bool(l.is_flagged),
        "moderation_notes": l.moderation_notes,
        "donor_id": l.donor_id,
        "donor_name": l.donor_name,
        "created_at": l.created_at,
    }


@router.get("")
def list_admin_listings(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    donor_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    flagged_only: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(FoodListing)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(FoodListing.title).like(q)
            | func.lower(FoodListing.donor_name).like(q)
            | func.lower(FoodListing.pickup_location).like(q)
        )

    if category and category.lower() != "all":
        query = query.filter(func.lower(FoodListing.category) == category.strip().lower())

    if donor_id is not None:
        query = query.filter(FoodListing.donor_id == donor_id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(func.lower(FoodListing.status) == status_filter.strip().lower())

    if flagged_only:
        query = query.filter(FoodListing.is_flagged.is_(True))

    total = query.count()
    items = (
        query.order_by(FoodListing.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [_serialize_listing(l) for l in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{listing_id}")
def get_admin_listing_detail(
    listing_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    donor = db.query(User).filter(User.id == listing.donor_id).first()
    requests = (
        db.query(DonationRequest)
        .filter(DonationRequest.listing_id == listing.id)
        .order_by(DonationRequest.id.desc())
        .all()
    )
    handovers = (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.listing_id == listing.id)
        .order_by(VolunteerHandover.id.desc())
        .all()
    )

    return {
        "listing": _serialize_listing(listing),
        "donor": {
            "id": donor.id,
            "full_name": donor.full_name,
            "email": donor.email,
            "status": donor.status,
            "organization": donor.organization,
        }
        if donor
        else None,
        "requests": [
            {
                "id": r.id,
                "requester_id": r.requester_id,
                "requester_name": r.requester_name,
                "status": r.status,
                "notes": r.notes,
                "is_disputed": r.is_disputed,
                "created_at": r.created_at,
            }
            for r in requests
        ],
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


@router.patch("/{listing_id}")
def moderate_listing(
    listing_id: int,
    payload: AdminListingModerate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    prev_val = _serialize_listing(listing)
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(listing, k, v)

    action_type = "LISTING_FLAGGED" if updates.get("is_flagged") else "LISTING_MODERATED"
    log_admin_action(
        db=db,
        admin=admin,
        action=action_type,
        entity_type="food_listings",
        entity_id=listing.id,
        previous_value=prev_val,
        new_value=_serialize_listing(listing),
        request=request,
    )
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing)


@router.delete("/{listing_id}")
def soft_remove_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    prev_status = listing.status
    listing.status = "removed"

    log_admin_action(
        db=db,
        admin=admin,
        action="LISTING_REMOVED",
        entity_type="food_listings",
        entity_id=listing.id,
        previous_value={"status": prev_status},
        new_value={"status": "removed"},
        request=request,
    )
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing)


@router.post("/{listing_id}/restore")
def restore_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    prev_state = {"status": listing.status, "is_flagged": listing.is_flagged}
    listing.status = "available"
    listing.is_flagged = False

    log_admin_action(
        db=db,
        admin=admin,
        action="LISTING_RESTORED",
        entity_type="food_listings",
        entity_id=listing.id,
        previous_value=prev_state,
        new_value={"status": "available", "is_flagged": False},
        request=request,
    )
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing)
