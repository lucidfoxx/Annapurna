from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.models import (
    DonationRequest,
    FoodListing,
    User,
    VolunteerHandover,
)

router = APIRouter(prefix="/donations", tags=["Admin Donations Monitoring"])


def _derive_lifecycle_status(
    listing: FoodListing,
    req: Optional[DonationRequest],
    handover: Optional[VolunteerHandover],
) -> str:
    if listing.status in ("removed", "cancelled"):
        return "cancelled"
    if listing.status == "expired":
        return "expired"
    if listing.status == "pickup_failed" or (handover and handover.status == "pickup_failed"):
        return "pickup_failed"
    if listing.status == "delivery_failed" or (handover and handover.status == "delivery_failed"):
        return "delivery_failed"
    if handover:
        if handover.status == "delivered" or listing.status in ("completed", "delivered"):
            return "completed"
        if handover.status in ("picked_up", "in_transit") or listing.status == "in_transit":
            return "in_progress"
        if handover.status == "assigned":
            return "assigned"
    if req:
        if req.status == "rejected":
            return "rejected"
        if req.status == "cancelled":
            return "cancelled"
        if req.status == "accepted":
            return "accepted"
        if req.status == "pending":
            return "pending"
    return listing.status or "available"


@router.get("")
def list_donation_lifecycle(
    lifecycle_filter: Optional[str] = Query(None, alias="status"),
    donor_id: Optional[int] = Query(None),
    ngo_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    listings = db.query(FoodListing).order_by(FoodListing.id.desc()).all()
    requests = db.query(DonationRequest).order_by(DonationRequest.id.desc()).all()
    handovers = db.query(VolunteerHandover).order_by(VolunteerHandover.id.desc()).all()

    requests_by_listing: dict[int, DonationRequest] = {}
    for r in requests:
        if r.listing_id and r.listing_id not in requests_by_listing:
            requests_by_listing[r.listing_id] = r

    handovers_by_listing: dict[int, VolunteerHandover] = {}
    for h in handovers:
        if h.listing_id and h.listing_id not in handovers_by_listing:
            handovers_by_listing[h.listing_id] = h

    records = []
    for l in listings:
        req = requests_by_listing.get(l.id)
        handover = handovers_by_listing.get(l.id)
        stage = _derive_lifecycle_status(l, req, handover)

        if lifecycle_filter and lifecycle_filter.lower() != "all":
            lf = lifecycle_filter.strip().lower()
            if lf == "active":
                if stage in ("completed", "cancelled", "expired", "pickup_failed", "delivery_failed"):
                    continue
            elif lf == "past":
                if stage not in ("completed", "cancelled", "expired", "pickup_failed", "delivery_failed"):
                    continue
            elif stage.lower() != lf:
                continue

        if donor_id is not None and l.donor_id != donor_id:
            continue
        if ngo_id is not None and (not req or req.requester_id != ngo_id):
            continue
        if date_from and l.created_at and l.created_at.isoformat()[:10] < date_from:
            continue
        if date_to and l.created_at and l.created_at.isoformat()[:10] > date_to:
            continue

        if search and search.strip():
            q = search.strip().lower()
            haystack = " ".join(
                filter(
                    None,
                    [
                        l.title,
                        l.donor_name,
                        req.requester_name if req else "",
                        handover.volunteer_name if handover else "",
                        l.cancellation_reason or "",
                        l.pickup_failure_reason or "",
                        l.delivery_failure_reason or "",
                    ],
                )
            ).lower()
            if q not in haystack:
                continue

        records.append(
            {
                "donation_id": l.id,
                "listing_id": l.id,
                "listing_title": l.title,
                "category": l.category,
                "quantity": l.quantity,
                "pickup_location": l.pickup_location,
                "donor_id": l.donor_id,
                "donor_name": l.donor_name,
                "listing_status": l.status,
                "cancellation_reason": l.cancellation_reason,
                "cancelled_at": l.cancelled_at,
                "pickup_status": handover.pickup_status if handover else l.pickup_status,
                "pickup_failure_reason": (handover.pickup_failure_reason if handover else None) or l.pickup_failure_reason,
                "delivery_status": handover.delivery_status if handover else l.delivery_status,
                "delivery_failure_reason": (handover.delivery_failure_reason if handover else None) or l.delivery_failure_reason,
                "verified_by_volunteer_id": (handover.verified_by_volunteer_id if handover else None) or l.verified_by_volunteer_id,
                "distribution_proof": handover.distribution_proof if handover else None,
                "request_id": req.id if req else None,
                "requester_id": req.requester_id if req else None,
                "requester_name": req.requester_name if req else None,
                "request_status": req.status if req else None,
                "handover_id": handover.id if handover else None,
                "volunteer_id": handover.volunteer_id if handover else None,
                "volunteer_name": handover.volunteer_name if handover else None,
                "handover_status": handover.status if handover else None,
                "lifecycle_status": stage,
                "created_at": l.created_at,
            }
        )

    return {"items": records, "total": len(records)}


@router.get("/{donation_id}")
def get_donation_lifecycle_detail(
    donation_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    listing = db.query(FoodListing).filter(FoodListing.id == donation_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Donation listing not found."
        )

    reqs = (
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

    primary_req = reqs[0] if reqs else None
    primary_handover = handovers[0] if handovers else None
    stage = _derive_lifecycle_status(listing, primary_req, primary_handover)

    steps = [
        {
            "step": "1. Listing Created",
            "completed": True,
            "actor": listing.donor_name,
            "detail": f"{listing.title} ({listing.quantity}) at {listing.pickup_location}",
        },
        {
            "step": "2. Recipient Requested",
            "completed": primary_req is not None,
            "actor": primary_req.requester_name if primary_req else "Awaiting NGO",
            "detail": primary_req.notes if primary_req else "No request submitted yet",
        },
        {
            "step": "3. Donor Decision",
            "completed": primary_req is not None and primary_req.status in ("accepted", "rejected", "fulfilled"),
            "actor": listing.donor_name,
            "detail": (
                f"Cancelled: {listing.cancellation_reason}"
                if listing.cancellation_reason
                else (f"Status: {primary_req.status}" if primary_req else "Pending")
            ),
        },
        {
            "step": "4. Volunteer Assigned",
            "completed": primary_handover is not None and primary_handover.volunteer_id is not None,
            "actor": primary_handover.volunteer_name if primary_handover and primary_handover.volunteer_name else "Unassigned",
            "detail": f"Handover #{primary_handover.id}" if primary_handover else "Not dispatched",
        },
        {
            "step": "5. Food Picked Up / Claimed",
            "completed": primary_handover is not None and (primary_handover.status in ("picked_up", "delivered") or primary_handover.pickup_status == "claimed"),
            "actor": primary_handover.volunteer_name if primary_handover else "-",
            "detail": (
                f"Pickup Failed: {primary_handover.pickup_failure_reason}"
                if primary_handover and primary_handover.pickup_failure_reason
                else (primary_handover.pickup_location if primary_handover else "-")
            ),
        },
        {
            "step": "6. Delivered & Verified",
            "completed": primary_handover is not None and (primary_handover.status == "delivered" or primary_handover.delivery_status == "delivered"),
            "actor": primary_handover.volunteer_name if primary_handover else "-",
            "detail": (
                f"Delivery Failed: {primary_handover.delivery_failure_reason}"
                if primary_handover and primary_handover.delivery_failure_reason
                else (primary_handover.distribution_proof or (primary_handover.dropoff_location if primary_handover else "-"))
            ),
        },
    ]

    return {
        "donation_id": listing.id,
        "lifecycle_status": stage,
        "steps": steps,
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "quantity": listing.quantity,
            "status": listing.status,
            "donor_name": listing.donor_name,
            "pickup_location": listing.pickup_location,
            "cancellation_reason": listing.cancellation_reason,
            "cancelled_at": listing.cancelled_at,
            "pickup_status": listing.pickup_status,
            "pickup_failure_reason": listing.pickup_failure_reason,
            "delivery_status": listing.delivery_status,
            "delivery_failure_reason": listing.delivery_failure_reason,
            "created_at": listing.created_at,
        },
        "requests": [
            {
                "id": r.id,
                "requester_name": r.requester_name,
                "status": r.status,
                "notes": r.notes,
                "created_at": r.created_at,
            }
            for r in reqs
        ],
        "handovers": [
            {
                "id": h.id,
                "volunteer_name": h.volunteer_name,
                "status": h.status,
                "pickup_status": h.pickup_status,
                "pickup_failure_reason": h.pickup_failure_reason,
                "delivery_status": h.delivery_status,
                "delivery_failure_reason": h.delivery_failure_reason,
                "distribution_proof": h.distribution_proof,
                "pickup_location": h.pickup_location,
                "dropoff_location": h.dropoff_location,
                "created_at": h.created_at,
            }
            for h in handovers
        ],
    }
