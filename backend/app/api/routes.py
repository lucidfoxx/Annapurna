import asyncio
import json
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    get_optional_user,
    get_password_hash,
    normalize_role,
    require_admin,
    require_roles,
    verify_password,
)
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.models import (
    DonationRequest,
    FoodListing,
    Notification,
    Review,
    User,
    VolunteerHandover,
)
from app.schemas.schemas import (
    AdminNgoVerifyRequest,
    DeliveryVerificationRequest,
    DonationRequestCreate,
    DonationRequestResponse,
    HandoverResponse,
    ListingCancelRequest,
    ListingCreate,
    ListingResponse,
    ListingUpdate,
    NgoLicenseUpdateRequest,
    NotificationResponse,
    PickupVerificationRequest,
    RegisterRequest,
    ReviewCreateRequest,
    UserResponse,
)

router = APIRouter()

ACTIVE_DONATION_STATUSES = ("available", "requested", "claimed", "in_transit", "picked_up")
PAST_DONATION_STATUSES = (
    "delivered",
    "completed",
    "cancelled",
    "removed",
    "expired",
    "pickup_failed",
    "delivery_failed",
)

# Real-time SSE subscriber queues for broadcasting `donation:claimed`
_sse_subscribers: List[asyncio.Queue] = []


def broadcast_sse_event(event_name: str, data: dict) -> None:
    payload = f"event: {event_name}\ndata: {json.dumps(data)}\n\n"
    for q in list(_sse_subscribers):
        try:
            q.put_nowait(payload)
        except Exception:
            pass


def parse_meal_volume(qty_str: Optional[str]) -> float:
    if not qty_str:
        return 10.0
    m = re.search(r"(\d+(?:\.\d+)?)", str(qty_str))
    return float(m.group(1)) if m else 10.0


def ensure_ngo_verified(user: User) -> None:
    """Gatekeeper: Restrict claiming & requesting donations strictly to NGOs with verification_status == 'approved'."""
    if normalize_role(user.role) == "NGO" and (user.verification_status or "pending").lower() != "approved":
        if (user.verification_status or "").lower() == "rejected":
            reason_suffix = f" Reason: {user.rejection_reason}" if user.rejection_reason else ""
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your NGO license verification was rejected by administrators.{reason_suffix}",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your NGO license verification is currently pending review by administrators.",
        )


@router.get("/events/stream")
async def sse_events_stream(request: Request):
    """Server-Sent Events (SSE) stream for real-time `donation:claimed` broadcasts."""
    queue: asyncio.Queue = asyncio.Queue()
    _sse_subscribers.append(queue)

    async def event_generator():
        try:
            yield 'event: connected\ndata: {"status":"connected"}\n\n'
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield msg
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            if queue in _sse_subscribers:
                _sse_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@router.get("/auth/bootstrap-status")
def get_admin_bootstrap_status(db: Session = Depends(get_db)):
    has_admin = (
        db.query(User).filter(func.lower(User.role) == "admin").count() > 0
    )
    return {"has_admin": has_admin}


@router.post("/auth/bootstrap-admin", status_code=status.HTTP_201_CREATED)
def bootstrap_first_admin(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing_admin_count = (
        db.query(User).filter(func.lower(User.role) == "admin").count()
    )
    if existing_admin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An administrator already exists. Use an existing Admin account or the promote_admin CLI.",
        )

    email_clean = payload.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    if existing_user:
        prev_role = existing_user.role
        existing_user.role = "Admin"
        existing_user.status = "active"
        existing_user.verification_status = "approved"
        if payload.password:
            existing_user.hashed_password = get_password_hash(payload.password)
        if payload.full_name:
            existing_user.full_name = payload.full_name.strip()
        user = existing_user
        action_label = "INITIAL_ADMIN_PROMOTED"
        prev_val = f'{{"role": "{prev_role}"}}'
    else:
        full_name = (payload.full_name or payload.email.split("@")[0]).strip()
        user = User(
            full_name=full_name,
            email=payload.email.strip(),
            hashed_password=get_password_hash(payload.password),
            role="Admin",
            status="active",
            verification_status="approved",
            phone=payload.phone,
            organization=payload.organization or "Platform Administration",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        action_label = "INITIAL_ADMIN_CREATED"
        prev_val = None

    db.add(
        AuditLog(
            admin_id=user.id,
            admin_email=user.email,
            action=action_label,
            entity_type="users",
            entity_id=str(user.id),
            previous_value=prev_val,
            new_value='{"role": "Admin", "status": "active"}',
            ip_address=request.client.host if request.client else None,
            user_agent=(request.headers.get("user-agent") or "")[:250] or None,
        )
    )
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "verification_status": user.verification_status,
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    raw_role = (payload.role or "Donor").strip().lower()
    if raw_role in ("admin", "administrator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public admin registration is not permitted.",
        )

    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please sign in instead.",
        )

    role = normalize_role(payload.role, allow_admin=False)
    full_name = (payload.full_name or payload.email.split("@")[0]).strip()

    # NGO License Verification requirement on registration
    verification_status = "approved"
    license_number = (payload.license_number or "").strip() or None
    license_doc = (payload.license_document_url or "").strip() or None
    if role == "NGO":
        if not license_number or not license_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Official NGO Registration/License Number and Registration Certificate document are required for NGO registration.",
            )
        verification_status = "pending"

    user = User(
        full_name=full_name,
        email=payload.email.strip(),
        hashed_password=get_password_hash(payload.password),
        role=role,
        status="active",
        phone=payload.phone,
        organization=payload.organization,
        address=payload.address,
        is_available=True,
        verification_status=verification_status,
        license_number=license_number,
        license_document_url=license_doc,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "verification_status": user.verification_status,
        "license_number": user.license_number,
        "license_document_url": user.license_document_url,
        "phone": user.phone,
        "address": user.address,
        "access_token": token,
        "token_type": "bearer",
    }


@router.patch("/auth/ngo-license", response_model=UserResponse)
def update_ngo_license_submission(
    payload: NgoLicenseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("NGO", "Admin")),
):
    """Allows an NGO to submit or re-submit their license number and certificate document for Admin review."""
    if not payload.license_number.strip() or not payload.license_document_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both license number and certificate document are required.",
        )
    current_user.license_number = payload.license_number.strip()
    current_user.license_document_url = payload.license_document_url.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    if payload.address is not None:
        current_user.address = payload.address.strip()
    current_user.verification_status = "pending"
    current_user.rejection_reason = None
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/auth/login")
async def login_user(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    username = ""
    password = ""

    if "application/json" in content_type:
        body = await request.json()
        username = str(body.get("username") or body.get("email") or "").strip()
        password = str(body.get("password") or "")
    else:
        form = await request.form()
        username = str(form.get("username") or form.get("email") or "").strip()
        password = str(form.get("password") or "")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == username.lower())
            | (func.lower(User.full_name) == username.lower())
        )
        .first()
    )

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials or register a new account.",
        )

    if (user.status or "active").lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account is currently {user.status}. Please contact an administrator.",
        )

    token = create_access_token(user.id, user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "verification_status": user.verification_status or "approved",
            "license_number": user.license_number,
            "license_document_url": user.license_document_url,
            "rejection_reason": user.rejection_reason,
            "phone": user.phone,
            "address": user.address,
            "organization": user.organization,
        },
    }


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ============================================================================
# ADMIN NGO LICENSE VERIFICATION ENDPOINTS
# ============================================================================
@router.get("/admin/ngos/verifications")
def list_ngo_verifications(
    status_filter: Optional[str] = Query("all", alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User).filter(func.lower(User.role) == "ngo")
    mode = (status_filter or "all").strip().lower()
    if mode in ("pending", "approved", "rejected"):
        query = query.filter(func.lower(User.verification_status) == mode)
    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            (func.lower(User.full_name).like(q))
            | (func.lower(User.email).like(q))
            | (func.lower(User.license_number).like(q))
        )
    ngos = query.order_by(User.created_at.desc(), User.id.desc()).all()
    all_ngos = db.query(User).filter(func.lower(User.role) == "ngo").all()
    counts = {
        "all": len(all_ngos),
        "pending": sum(1 for u in all_ngos if (u.verification_status or "pending") == "pending"),
        "approved": sum(1 for u in all_ngos if (u.verification_status or "pending") == "approved"),
        "rejected": sum(1 for u in all_ngos if (u.verification_status or "pending") == "rejected"),
    }
    return {
        "items": [UserResponse.model_validate(u) for u in ngos],
        "counts": counts,
    }


@router.patch("/admin/ngos/{ngo_id}/verify", response_model=UserResponse)
def verify_ngo_license(
    ngo_id: int,
    payload: AdminNgoVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ngo = db.query(User).filter(User.id == ngo_id, func.lower(User.role) == "ngo").first()
    if not ngo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NGO account not found.")

    decision = (payload.status or "").strip().lower()
    if decision not in ("approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status must be 'approved' or 'rejected'.",
        )

    prev_status = ngo.verification_status
    now = datetime.now(timezone.utc)

    if decision == "approved":
        ngo.verification_status = "approved"
        ngo.verified_at = now
        ngo.verified_by_admin_id = admin.id
        ngo.rejection_reason = None
        notif_msg = "Your NGO license has been verified and approved by administrators. You now have full access to claim and request food donations."
    else:
        reason = (payload.reason or "").strip()
        if not reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A rejection reason is mandatory when rejecting an NGO license.",
            )
        ngo.verification_status = "rejected"
        ngo.verified_at = now
        ngo.verified_by_admin_id = admin.id
        ngo.rejection_reason = reason
        notif_msg = f"Your NGO license verification was not approved. Reason: {reason}"

    db.add(
        Notification(
            user_id=ngo.id,
            message=notif_msg,
            is_read=False,
        )
    )
    db.add(
        AuditLog(
            admin_id=admin.id,
            admin_email=admin.email,
            action=f"NGO_LICENSE_{decision.upper()}",
            entity_type="users",
            entity_id=str(ngo.id),
            previous_value=json.dumps({"verification_status": prev_status}),
            new_value=json.dumps(
                {
                    "verification_status": ngo.verification_status,
                    "rejection_reason": ngo.rejection_reason,
                }
            ),
            ip_address=request.client.host if request.client else None,
            user_agent=(request.headers.get("user-agent") or "")[:250] or None,
        )
    )
    db.commit()
    db.refresh(ngo)
    return ngo


# ============================================================================
# ATOMIC CONCURRENCY-SAFE DONATION CLAIM ENDPOINT
# ============================================================================
@router.patch("/donations/{listing_id}/claim")
def atomic_claim_donation(
    listing_id: int,
    payload: Optional[DonationRequestCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("NGO", "Admin")),
):
    """
    Concurrency-safe atomic claim operation:
    UPDATE food_listings SET status = 'claimed', claimed_by_ngo_id = :ngo_id, claimed_at = NOW()
    WHERE id = :listing_id AND status = 'available'
    If rows affected == 0, returns HTTP 409 Conflict.
    """
    ensure_ngo_verified(current_user)

    exists = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation listing not found.")

    now = datetime.now(timezone.utc)
    stmt = (
        update(FoodListing)
        .where(FoodListing.id == listing_id, FoodListing.status == "available")
        .values(
            status="claimed",
            claimed_by_ngo_id=current_user.id,
            claimed_by_ngo_name=current_user.full_name,
            claimed_at=now,
        )
    )
    result = db.execute(stmt)
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This donation has already been claimed by another organization.",
        )

    db.refresh(exists)
    notes = payload.notes if payload else "Atomic NGO pickup claim"
    new_req = DonationRequest(
        listing_id=exists.id,
        listing_title=exists.title,
        requester_id=current_user.id,
        requester_name=current_user.full_name,
        ngo_id=current_user.id,
        ngo_name=current_user.full_name,
        quantity=exists.quantity,
        requested_quantity=exists.quantity,
        urgency_level=(payload.urgency_level if payload else None) or "normal",
        request_type="listing_claim",
        notes=notes,
        status="pending",
    )
    db.add(new_req)
    db.add(
        Notification(
            user_id=exists.donor_id,
            message=f'{current_user.full_name} claimed "{exists.title}"',
            is_read=False,
        )
    )
    db.commit()
    db.refresh(new_req)

    # Emit real-time SSE `donation:claimed` broadcast to all connected NGO clients
    broadcast_sse_event(
        "donation:claimed",
        {
            "donationId": exists.id,
            "claimedByNgoId": current_user.id,
            "claimedByNgoName": current_user.full_name,
            "claimedAt": now.isoformat(),
        },
    )

    return {
        "success": True,
        "donation": ListingResponse.model_validate(exists),
        "request": DonationRequestResponse.model_validate(new_req),
    }


# ============================================================================
# DONOR LEADERBOARD ("RANK PAGE") & REVIEW SYSTEM ENDPOINTS
# ============================================================================
@router.get("/leaderboard")
def get_donor_leaderboard(
    period: Optional[str] = Query("all"),  # all | monthly | weekly
    sort: Optional[str] = Query("points"),  # points | donations
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    cutoff: Optional[datetime] = None
    p = (period or "all").strip().lower()
    if p in ("monthly", "month"):
        cutoff = now - timedelta(days=30)
    elif p in ("weekly", "week"):
        cutoff = now - timedelta(days=7)

    donors = db.query(User).filter(func.lower(User.role) == "donor").all()
    all_listings = db.query(FoodListing).all()
    all_reviews = db.query(Review).all()

    leaderboard = []
    month_cutoff = now - timedelta(days=30)

    for donor in donors:
        donor_listings = [l for l in all_listings if l.donor_id == donor.id]
        delivered_all = [
            l for l in donor_listings if (l.status or "").lower() in ("delivered", "completed")
        ]
        if cutoff:
            delivered_period = [
                l
                for l in delivered_all
                if l.created_at
                and (
                    l.created_at.replace(tzinfo=timezone.utc)
                    if l.created_at.tzinfo is None
                    else l.created_at
                )
                >= cutoff
            ]
        else:
            delivered_period = delivered_all

        completed_count = len(delivered_period)
        meals_fed = int(round(sum(parse_meal_volume(l.quantity) for l in delivered_period)))

        # Points formula:
        # - 10 points per completed delivery
        # - 1 point per 5 meals saved
        # - +5 consistency bonus for 5+ donations in the last 30 days
        delivery_points = completed_count * 10
        volume_points = meals_fed // 5
        monthly_delivered = sum(
            1
            for l in delivered_all
            if l.created_at
            and (
                l.created_at.replace(tzinfo=timezone.utc)
                if l.created_at.tzinfo is None
                else l.created_at
            )
            >= month_cutoff
        )
        consistency_bonus = 5 if monthly_delivered >= 5 else 0
        total_points = delivery_points + volume_points + consistency_bonus

        donor_reviews = [r for r in all_reviews if r.restaurant_id == donor.id]
        total_reviews = len(donor_reviews)
        avg_rating = (
            round(sum(r.rating for r in donor_reviews) / total_reviews, 1)
            if total_reviews > 0
            else 0.0
        )

        leaderboard.append(
            {
                "restaurant_id": donor.id,
                "restaurant_name": donor.full_name,
                "organization": donor.organization or donor.full_name,
                "total_donations_count": completed_count,
                "active_donations_count": sum(
                    1 for l in donor_listings if (l.status or "").lower() in ACTIVE_DONATION_STATUSES
                ),
                "meals_fed": meals_fed,
                "total_points": total_points,
                "delivery_points": delivery_points,
                "volume_points": volume_points,
                "consistency_bonus": consistency_bonus,
                "average_rating": avg_rating,
                "total_reviews_count": total_reviews,
            }
        )

    sort_key = (sort or "points").strip().lower()
    if sort_key == "donations":
        leaderboard.sort(
            key=lambda x: (x["total_donations_count"], x["total_points"], x["average_rating"]),
            reverse=True,
        )
    else:
        leaderboard.sort(
            key=lambda x: (x["total_points"], x["total_donations_count"], x["average_rating"]),
            reverse=True,
        )

    for idx, entry in enumerate(leaderboard):
        entry["rank"] = idx + 1

    return {
        "period": p,
        "sort": sort_key,
        "items": leaderboard,
    }


@router.post("/donations/{listing_id}/reviews", status_code=status.HTTP_201_CREATED)
def create_donation_review(
    listing_id: int,
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("NGO", "Admin")),
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found.")

    if (listing.status or "").lower() not in ("delivered", "completed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviews can only be submitted after a donation reaches 'delivered' status.",
        )

    # Verify caller is the claiming NGO
    claim_req = (
        db.query(DonationRequest)
        .filter(
            DonationRequest.listing_id == listing.id,
            DonationRequest.requester_id == current_user.id,
        )
        .first()
    )
    if (
        normalize_role(current_user.role) != "Admin"
        and listing.claimed_by_ngo_id != current_user.id
        and not claim_req
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the NGO that claimed and received this donation can submit a review.",
        )

    existing_review = db.query(Review).filter(Review.donation_id == listing.id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A review has already been submitted for this completed delivery.",
        )

    tags_list = payload.tags or []
    review = Review(
        donation_id=listing.id,
        restaurant_id=listing.donor_id,
        ngo_id=current_user.id,
        ngo_name=current_user.full_name,
        rating=int(payload.rating),
        comment=(payload.comment or "").strip() or None,
        tags=json.dumps(tags_list),
    )
    db.add(review)
    db.add(
        Notification(
            user_id=listing.donor_id,
            message=f'{current_user.full_name} left a {payload.rating}★ review on "{listing.title}"!',
            is_read=False,
        )
    )
    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "donation_id": review.donation_id,
        "donation_title": listing.title,
        "restaurant_id": review.restaurant_id,
        "restaurant_name": listing.donor_name,
        "ngo_id": review.ngo_id,
        "ngo_name": review.ngo_name,
        "rating": review.rating,
        "comment": review.comment,
        "tags": tags_list,
        "created_at": review.created_at,
    }


@router.get("/restaurants/{restaurant_id}/reviews")
def get_restaurant_reviews(
    restaurant_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    restaurant = db.query(User).filter(User.id == restaurant_id).first()
    reviews = (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .all()
    )
    total = len(reviews)
    avg_rating = (
        round(sum(r.rating for r in reviews) / total, 1) if total > 0 else 0.0
    )
    start = (page - 1) * page_size
    sliced = reviews[start : start + page_size]

    items = []
    for r in sliced:
        listing = db.query(FoodListing).filter(FoodListing.id == r.donation_id).first()
        try:
            parsed_tags = json.loads(r.tags) if r.tags else []
        except Exception:
            parsed_tags = []
        items.append(
            {
                "id": r.id,
                "donation_id": r.donation_id,
                "donation_title": listing.title if listing else f"Donation #{r.donation_id}",
                "restaurant_id": r.restaurant_id,
                "restaurant_name": restaurant.full_name if restaurant else "Restaurant Partner",
                "ngo_id": r.ngo_id,
                "ngo_name": r.ngo_name,
                "rating": r.rating,
                "comment": r.comment,
                "tags": parsed_tags,
                "created_at": r.created_at,
            }
        )

    return {
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant.full_name if restaurant else "Restaurant Partner",
        "average_rating": avg_rating,
        "total_reviews_count": total,
        "items": items,
        "page": page,
        "page_size": page_size,
    }


# ============================================================================
# RESTAURANT / DONOR DONATION FILTERING & CANCELLATION ENDPOINTS
# ============================================================================
@router.get("/donations/my-donations", response_model=List[ListingResponse])
def get_my_donations(
    status_filter: Optional[str] = Query("active", alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    """Restaurant/Donor strict RBAC: only returns donations belonging to current_user.id."""
    query = db.query(FoodListing).filter(FoodListing.donor_id == current_user.id)
    mode = (status_filter or "active").strip().lower()
    if mode == "active":
        query = query.filter(FoodListing.status.in_(ACTIVE_DONATION_STATUSES))
    elif mode == "past":
        query = query.filter(FoodListing.status.in_(PAST_DONATION_STATUSES))
    return query.order_by(FoodListing.created_at.desc(), FoodListing.id.desc()).all()


@router.get("/donations/admin/all")
def get_admin_all_donations(
    status_filter: Optional[str] = Query("all", alias="status"),
    donor_id: Optional[int] = Query(None),
    ngo_id: Optional[int] = Query(None),
    status_detail: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    listings = db.query(FoodListing).order_by(FoodListing.created_at.desc(), FoodListing.id.desc()).all()
    requests = db.query(DonationRequest).order_by(DonationRequest.id.desc()).all()
    handovers = db.query(VolunteerHandover).order_by(VolunteerHandover.id.desc()).all()

    reqs_by_listing: dict[int, DonationRequest] = {}
    for r in requests:
        if r.listing_id and r.listing_id not in reqs_by_listing:
            reqs_by_listing[r.listing_id] = r

    handovers_by_listing: dict[int, VolunteerHandover] = {}
    for h in handovers:
        if h.listing_id and h.listing_id not in handovers_by_listing:
            handovers_by_listing[h.listing_id] = h

    mode = (status_filter or "all").strip().lower()
    items = []
    for l in listings:
        req = reqs_by_listing.get(l.id)
        handover = handovers_by_listing.get(l.id)

        is_past = l.status in PAST_DONATION_STATUSES
        if mode == "active" and is_past:
            continue
        if mode == "past" and not is_past:
            continue
        if donor_id is not None and l.donor_id != donor_id:
            continue
        if ngo_id is not None and (not req or req.requester_id != ngo_id):
            continue
        if status_detail and status_detail != "all" and l.status != status_detail:
            continue
        if date_from and l.created_at and l.created_at.isoformat()[:10] < date_from:
            continue
        if date_to and l.created_at and l.created_at.isoformat()[:10] > date_to:
            continue

        items.append(
            {
                "id": l.id,
                "title": l.title,
                "description": l.description,
                "category": l.category,
                "quantity": l.quantity,
                "pickup_location": l.pickup_location,
                "expiry_time": l.expiry_time,
                "status": l.status,
                "donor_id": l.donor_id,
                "donor_name": l.donor_name,
                "claimed_by_ngo_id": l.claimed_by_ngo_id or (req.requester_id if req else None),
                "claimed_by_ngo_name": l.claimed_by_ngo_name or (req.requester_name if req else None),
                "claimed_at": l.claimed_at,
                "cancellation_reason": l.cancellation_reason,
                "cancelled_at": l.cancelled_at,
                "pickup_status": handover.pickup_status if handover else l.pickup_status,
                "pickup_failure_reason": (handover.pickup_failure_reason if handover else None) or l.pickup_failure_reason,
                "delivery_status": handover.delivery_status if handover else l.delivery_status,
                "delivery_failure_reason": (handover.delivery_failure_reason if handover else None) or l.delivery_failure_reason,
                "verified_by_volunteer_id": (handover.verified_by_volunteer_id if handover else None) or l.verified_by_volunteer_id,
                "volunteer_name": handover.volunteer_name if handover else None,
                "distribution_proof": handover.distribution_proof if handover else None,
                "ngo_id": req.requester_id if req else l.claimed_by_ngo_id,
                "ngo_name": req.requester_name if req else l.claimed_by_ngo_name,
                "claim_status": req.status if req else None,
                "created_at": l.created_at,
            }
        )

    return {"items": items, "total": len(items)}


@router.patch("/donations/{listing_id}/cancel", response_model=ListingResponse)
def cancel_donation(
    listing_id: int,
    payload: ListingCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    reason = (payload.cancellation_reason or payload.reason or "").strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellation reason is mandatory and cannot be blank.",
        )

    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation listing not found.")

    if normalize_role(current_user.role) != "Admin" and item.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own food donations.",
        )

    item.status = "cancelled"
    item.cancellation_reason = reason
    item.cancelled_at = datetime.now(timezone.utc)

    linked_reqs = db.query(DonationRequest).filter(DonationRequest.listing_id == item.id).all()
    for r in linked_reqs:
        if r.status in ("pending", "accepted"):
            r.status = "cancelled"
            r.moderation_note = f"Cancelled by restaurant: {reason}"

    db.commit()
    db.refresh(item)
    return item


# ============================================================================
# FOOD LISTINGS (ROLE-FILTERED FOR RESTAURANTS, AVAILABLE FEED FOR NGOS)
# ============================================================================
@router.get("/listings", response_model=List[ListingResponse])
def list_listings(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(FoodListing).filter(FoodListing.status != "removed")
    if current_user and normalize_role(current_user.role) == "Donor":
        query = query.filter(FoodListing.donor_id == current_user.id)
    return query.order_by(FoodListing.id.desc()).all()


@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if current_user and normalize_role(current_user.role) == "Donor" and item.donor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another restaurant's donation.")
    return item


@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    if not payload.title or not payload.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing title is required.",
        )
    new_listing = FoodListing(
        title=payload.title.strip(),
        description=(payload.description or "").strip(),
        category=(payload.category or "cooked_meals").strip(),
        quantity=str(payload.quantity or "1").strip(),
        pickup_location=(payload.pickup_location or "Community Hub").strip(),
        expiry_time=payload.expiry_time,
        status="available",
        pickup_status="pending",
        delivery_status="pending",
        is_flagged=False,
        donor_id=current_user.id,
        donor_name=current_user.full_name,
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing


@router.patch("/listings/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if normalize_role(current_user.role) != "Admin" and item.donor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own donations.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if normalize_role(current_user.role) != "Admin" and item.donor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only remove your own donations.")
    item.status = "cancelled"
    item.cancellation_reason = item.cancellation_reason or "Removed by restaurant"
    item.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return None


# ============================================================================
# NGO CLAIMS & NGO DONATION REQUESTS
# ============================================================================
@router.get("/claims/my-claims")
def get_ngo_claims(
    status_filter: Optional[str] = Query("active", alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("NGO", "Admin")),
):
    claims = (
        db.query(DonationRequest)
        .filter(DonationRequest.requester_id == current_user.id)
        .order_by(DonationRequest.created_at.desc(), DonationRequest.id.desc())
        .all()
    )
    reviews_by_donation = {
        r.donation_id: r
        for r in db.query(Review).filter(Review.ngo_id == current_user.id).all()
    }
    mode = (status_filter or "active").strip().lower()
    results = []
    for c in claims:
        listing = db.query(FoodListing).filter(FoodListing.id == c.listing_id).first() if c.listing_id else None
        handover = (
            db.query(VolunteerHandover)
            .filter(VolunteerHandover.request_id == c.id)
            .order_by(VolunteerHandover.id.desc())
            .first()
        )

        eff_status = c.status
        if c.status in ("rejected", "cancelled"):
            eff_status = c.status
        elif listing and listing.status == "cancelled":
            eff_status = "cancelled"
        elif handover:
            if handover.status == "delivered" or handover.delivery_status == "delivered":
                eff_status = "delivered"
            elif handover.status in ("delivery_failed", "pickup_failed") or handover.delivery_status == "delivery_failed" or handover.pickup_status == "pickup_failed":
                eff_status = "failed_delivery"
            elif handover.status == "picked_up" or handover.delivery_status == "in_transit":
                eff_status = "in_transit"
            elif handover.status == "assigned":
                eff_status = "assigned"
        elif listing and listing.status in ("delivered", "completed"):
            eff_status = "delivered"

        is_past = eff_status in ("delivered", "completed", "failed_delivery", "cancelled", "rejected")
        if mode == "active" and is_past:
            continue
        if mode == "past" and not is_past:
            continue

        rev = reviews_by_donation.get(c.listing_id) if c.listing_id else None

        results.append(
            {
                "id": c.id,
                "listing_id": c.listing_id,
                "listing_title": c.listing_title,
                "donor_id": listing.donor_id if listing else None,
                "donor_name": listing.donor_name if listing else "Restaurant Partner",
                "pickup_location": listing.pickup_location if listing else "",
                "quantity": c.requested_quantity or c.quantity or (listing.quantity if listing else ""),
                "status": eff_status,
                "claim_status": eff_status,
                "raw_request_status": c.status,
                "request_type": c.request_type,
                "urgency_level": c.urgency_level,
                "required_by": c.required_by,
                "notes": c.notes,
                "cancellation_reason": listing.cancellation_reason if listing else None,
                "pickup_status": handover.pickup_status if handover else (listing.pickup_status if listing else "pending"),
                "pickup_failure_reason": (handover.pickup_failure_reason if handover else None) or (listing.pickup_failure_reason if listing else None),
                "delivery_status": handover.delivery_status if handover else (listing.delivery_status if listing else "pending"),
                "delivery_failure_reason": (handover.delivery_failure_reason if handover else None) or (listing.delivery_failure_reason if listing else None),
                "volunteer_name": handover.volunteer_name if handover else None,
                "distribution_proof": handover.distribution_proof if handover else None,
                "has_reviewed": bool(rev),
                "review_rating": rev.rating if rev else None,
                "review_comment": rev.comment if rev else None,
                "created_at": c.created_at,
            }
        )
    return results


@router.get("/requests", response_model=List[DonationRequestResponse])
@router.get("/requests/my", response_model=List[DonationRequestResponse])
def list_requests(
    request_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(DonationRequest).order_by(DonationRequest.id.desc())
    if request_type and request_type != "all":
        query = query.filter(DonationRequest.request_type == request_type)

    if current_user:
        role = normalize_role(current_user.role)
        if role == "NGO" and request_type != "open_broadcast":
            return query.filter(DonationRequest.requester_id == current_user.id).all()
        if role == "Donor":
            my_listing_ids = [
                l.id for l in db.query(FoodListing).filter(FoodListing.donor_id == current_user.id).all()
            ]
            return query.filter(
                (DonationRequest.request_type == "open_broadcast")
                | (DonationRequest.listing_id.in_(my_listing_ids))
            ).all()
    return query.all()


@router.post("/requests", response_model=DonationRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: DonationRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("NGO", "Admin")),
):
    # Mandatory NGO License Verification check
    ensure_ngo_verified(current_user)

    # Case 1: Atomic Claim on a specific restaurant listing
    if payload.listing_id is not None:
        listing = db.query(FoodListing).filter(FoodListing.id == payload.listing_id).first()
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

        now = datetime.now(timezone.utc)
        stmt = (
            update(FoodListing)
            .where(FoodListing.id == payload.listing_id, FoodListing.status == "available")
            .values(
                status="claimed",
                claimed_by_ngo_id=current_user.id,
                claimed_by_ngo_name=current_user.full_name,
                claimed_at=now,
            )
        )
        result = db.execute(stmt)
        if result.rowcount == 0:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This donation has already been claimed by another organization.",
            )

        db.refresh(listing)
        qty = payload.requested_quantity or payload.quantity or payload.quantity_needed or listing.quantity
        new_req = DonationRequest(
            listing_id=listing.id,
            listing_title=listing.title,
            requester_id=current_user.id,
            requester_name=current_user.full_name,
            ngo_id=current_user.id,
            ngo_name=payload.ngo_name or current_user.full_name,
            quantity=qty,
            requested_quantity=qty,
            required_by=payload.required_by or payload.required_by_time,
            urgency_level=payload.urgency_level or "normal",
            request_type="listing_claim",
            notes=payload.notes,
            status="pending",
        )
        db.add(new_req)

        notif = Notification(
            user_id=listing.donor_id,
            message=f'{current_user.full_name} claimed "{listing.title}"',
            is_read=False,
        )
        db.add(notif)

        db.commit()
        db.refresh(new_req)

        # Broadcast SSE `donation:claimed` event
        broadcast_sse_event(
            "donation:claimed",
            {
                "donationId": listing.id,
                "claimedByNgoId": current_user.id,
                "claimedByNgoName": current_user.full_name,
                "claimedAt": now.isoformat(),
            },
        )
        return new_req

    # Case 2: Open NGO Food Donation Request (Broadcast to Restaurants & Admin)
    qty = (payload.quantity_needed or payload.quantity or payload.requested_quantity or "").strip()
    req_by = (payload.required_by_time or payload.required_by or "").strip()
    if not qty or not req_by:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both quantity_needed and required_by_time are required for an NGO food request.",
        )

    ngo_display_name = (payload.ngo_name or current_user.full_name).strip()
    urgency = (payload.urgency_level or "normal").strip().lower()

    new_req = DonationRequest(
        listing_id=None,
        listing_title=f"NGO Food Request · {qty} needed by {ngo_display_name}",
        requester_id=current_user.id,
        requester_name=ngo_display_name,
        ngo_id=current_user.id,
        ngo_name=ngo_display_name,
        quantity=qty,
        requested_quantity=qty,
        required_by=req_by,
        urgency_level=urgency,
        request_type="open_broadcast",
        notes=payload.notes,
        status="open",
    )
    db.add(new_req)

    donors = db.query(User).filter(User.role == "Donor").all()
    for d in donors:
        db.add(
            Notification(
                user_id=d.id,
                message=f"New NGO Food Request from {ngo_display_name}: {qty} needed by {req_by}",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(new_req)
    return new_req


@router.patch("/requests/{request_id}/fulfill", response_model=DonationRequestResponse)
@router.post("/requests/{request_id}/fulfill", response_model=DonationRequestResponse)
def fulfill_open_ngo_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    req_item = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    req_item.status = "fulfilled"
    listing = FoodListing(
        title=f"Fulfilled Request: {req_item.quantity or 'Meals'} for {req_item.ngo_name or req_item.requester_name}",
        description=req_item.notes or "Created in response to NGO Food Donation Request",
        category="cooked_meals",
        quantity=req_item.quantity or "25 meals",
        pickup_location=current_user.organization or f"{current_user.full_name} Kitchen",
        expiry_time=req_item.required_by,
        status="claimed",
        claimed_by_ngo_id=req_item.requester_id,
        claimed_by_ngo_name=req_item.ngo_name or req_item.requester_name,
        claimed_at=datetime.now(timezone.utc),
        pickup_status="pending",
        delivery_status="pending",
        donor_id=current_user.id,
        donor_name=current_user.full_name,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    req_item.listing_id = listing.id
    req_item.listing_title = listing.title

    handover = VolunteerHandover(
        request_id=req_item.id,
        listing_id=listing.id,
        listing_title=listing.title,
        pickup_location=listing.pickup_location,
        dropoff_location=f"{req_item.ngo_name or req_item.requester_name} Distribution Hub",
        volunteer_id=None,
        status="available",
        pickup_status="pending",
        delivery_status="pending",
    )
    db.add(handover)
    db.commit()
    db.refresh(req_item)
    return req_item


@router.patch("/requests/{request_id}/accept", response_model=DonationRequestResponse)
@router.post("/requests/{request_id}/accept", response_model=DonationRequestResponse)
def accept_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Donor", "Admin")),
):
    req_item = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    if req_item.request_type == "open_broadcast" and not req_item.listing_id:
        return fulfill_open_ngo_request(request_id, db, current_user)

    req_item.status = "accepted"
    listing = db.query(FoodListing).filter(FoodListing.id == req_item.listing_id).first()
    if listing:
        listing.status = "claimed"
        listing.claimed_by_ngo_id = req_item.requester_id
        listing.claimed_by_ngo_name = req_item.requester_name

    handover = VolunteerHandover(
        request_id=req_item.id,
        listing_id=req_item.listing_id or 0,
        listing_title=req_item.listing_title,
        pickup_location=listing.pickup_location if listing else "Donor Location",
        dropoff_location=f"{req_item.requester_name} Distribution Hub",
        volunteer_id=None,
        status="available",
        pickup_status="pending",
        delivery_status="pending",
    )
    db.add(handover)
    db.commit()
    db.refresh(req_item)
    return req_item


@router.patch("/requests/{request_id}/reject", response_model=DonationRequestResponse)
@router.post("/requests/{request_id}/reject", response_model=DonationRequestResponse)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles("Donor", "Admin")),
):
    req_item = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    req_item.status = "rejected"
    if req_item.listing_id:
        listing = db.query(FoodListing).filter(FoodListing.id == req_item.listing_id).first()
        if listing:
            listing.status = "available"
            listing.claimed_by_ngo_id = None
            listing.claimed_by_ngo_name = None
            listing.claimed_at = None

    pending_handovers = (
        db.query(VolunteerHandover)
        .filter(
            VolunteerHandover.request_id == req_item.id,
            VolunteerHandover.status != "delivered",
        )
        .all()
    )
    for h in pending_handovers:
        db.delete(h)

    db.commit()
    db.refresh(req_item)
    return req_item


# ============================================================================
# VOLUNTEER HANDOVERS & BIDIRECTIONAL VERIFICATION ENDPOINTS
# ============================================================================
@router.get("/handovers/available", response_model=List[HandoverResponse])
def list_available_handovers(db: Session = Depends(get_db)):
    return (
        db.query(VolunteerHandover)
        .filter(VolunteerHandover.status == "available")
        .order_by(VolunteerHandover.id.desc())
        .all()
    )


@router.get("/handovers/my", response_model=List[HandoverResponse])
def list_my_handovers(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(VolunteerHandover).order_by(VolunteerHandover.id.desc())
    if current_user and normalize_role(current_user.role) == "Volunteer":
        return query.filter(
            (VolunteerHandover.volunteer_id == current_user.id)
            | (VolunteerHandover.status != "available")
        ).all()
    return query.filter(VolunteerHandover.status != "available").all()


@router.post("/handovers/{handover_id}/assign", response_model=HandoverResponse)
def assign_handover(
    handover_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Volunteer", "Admin")),
):
    item = db.query(VolunteerHandover).filter(VolunteerHandover.id == handover_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handover not found.")

    item.volunteer_id = current_user.id
    item.volunteer_name = current_user.full_name
    item.status = "assigned"
    db.commit()
    db.refresh(item)
    return item


@router.patch("/deliveries/{handover_id}/verify-pickup", response_model=HandoverResponse)
def verify_pickup(
    handover_id: int,
    payload: PickupVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Volunteer", "Admin")),
):
    item = db.query(VolunteerHandover).filter(VolunteerHandover.id == handover_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery handover not found.")

    outcome = (payload.status or "").strip().lower()
    if outcome not in ("claimed", "pickup_failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status must be 'claimed' or 'pickup_failed'.",
        )

    listing = db.query(FoodListing).filter(FoodListing.id == item.listing_id).first()
    req = db.query(DonationRequest).filter(DonationRequest.id == item.request_id).first()
    now = datetime.now(timezone.utc)

    if outcome == "claimed":
        item.status = "picked_up"
        item.pickup_status = "claimed"
        item.pickup_failure_reason = None
        item.delivery_status = "in_transit"
        item.verified_by_volunteer_id = current_user.id
        item.verified_at = now
        if listing:
            listing.status = "in_transit"
            listing.pickup_status = "claimed"
            listing.delivery_status = "in_transit"
            listing.verified_by_volunteer_id = current_user.id
    else:
        reason = (payload.reason or "").strip()
        if not reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A failure reason is mandatory when reporting pickup_failed.",
            )
        item.status = "pickup_failed"
        item.pickup_status = "pickup_failed"
        item.pickup_failure_reason = reason
        item.delivery_status = "delivery_failed"
        item.verified_by_volunteer_id = current_user.id
        item.verified_at = now
        if listing:
            listing.status = "pickup_failed"
            listing.pickup_status = "pickup_failed"
            listing.pickup_failure_reason = reason
            listing.verified_by_volunteer_id = current_user.id
        if req:
            req.status = "failed_delivery"
            req.moderation_note = f"Pickup failed: {reason}"

    db.commit()
    db.refresh(item)
    return item


@router.patch("/deliveries/{handover_id}/verify-delivery", response_model=HandoverResponse)
def verify_delivery(
    handover_id: int,
    payload: DeliveryVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Volunteer", "Admin")),
):
    item = db.query(VolunteerHandover).filter(VolunteerHandover.id == handover_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery handover not found.")

    outcome = (payload.status or "").strip().lower()
    if outcome not in ("delivered", "delivery_failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status must be 'delivered' or 'delivery_failed'.",
        )

    listing = db.query(FoodListing).filter(FoodListing.id == item.listing_id).first()
    req = db.query(DonationRequest).filter(DonationRequest.id == item.request_id).first()
    now = datetime.now(timezone.utc)

    if outcome == "delivered":
        item.status = "delivered"
        item.pickup_status = "claimed"
        item.delivery_status = "delivered"
        item.delivery_failure_reason = None
        item.distribution_proof = (payload.distribution_proof or "").strip() or None
        item.verified_by_volunteer_id = current_user.id
        item.verified_at = now
        if listing:
            listing.status = "delivered"
            listing.pickup_status = "claimed"
            listing.delivery_status = "delivered"
            listing.verified_by_volunteer_id = current_user.id
        if req:
            req.status = "completed"
    else:
        reason = (payload.reason or "").strip()
        if not reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A failure reason is mandatory when reporting delivery_failed.",
            )
        item.status = "delivery_failed"
        item.delivery_status = "delivery_failed"
        item.delivery_failure_reason = reason
        item.verified_by_volunteer_id = current_user.id
        item.verified_at = now
        if listing:
            listing.status = "delivery_failed"
            listing.delivery_status = "delivery_failed"
            listing.delivery_failure_reason = reason
            listing.verified_by_volunteer_id = current_user.id
        if req:
            req.status = "failed_delivery"
            req.moderation_note = f"Delivery failed: {reason}"

    db.commit()
    db.refresh(item)
    return item


@router.patch("/handovers/{handover_id}/pickup", response_model=HandoverResponse)
@router.post("/handovers/{handover_id}/pickup", response_model=HandoverResponse)
def pickup_handover(
    handover_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Volunteer", "Admin")),
):
    return verify_pickup(
        handover_id=handover_id,
        payload=PickupVerificationRequest(status="claimed"),
        db=db,
        current_user=current_user,
    )


@router.patch("/handovers/{handover_id}/delivery", response_model=HandoverResponse)
@router.post("/handovers/{handover_id}/delivery", response_model=HandoverResponse)
@router.post("/handovers/{handover_id}/deliver", response_model=HandoverResponse)
def deliver_handover(
    handover_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Volunteer", "Admin")),
):
    return verify_delivery(
        handover_id=handover_id,
        payload=DeliveryVerificationRequest(status="delivered"),
        db=db,
        current_user=current_user,
    )


# ============================================================================
# NOTIFICATIONS, MATCHING & IMPACT
# ============================================================================
@router.get("/notifications", response_model=List[NotificationResponse])
def list_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.id.desc()).all()


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    item = db.query(Notification).filter(Notification.id == notification_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    item.is_read = True
    db.commit()
    db.refresh(item)
    return item


@router.get("/matching/recommendations", response_model=List[ListingResponse])
def matching_recommendations(db: Session = Depends(get_db)):
    return (
        db.query(FoodListing)
        .filter(FoodListing.status == "available")
        .order_by(FoodListing.id.desc())
        .all()
    )


@router.get("/dashboard/impact")
@router.get("/extras/impact")
def get_impact_summary(db: Session = Depends(get_db)):
    completed_deliveries = (
        db.query(VolunteerHandover).filter(VolunteerHandover.status == "delivered").count()
    )
    available_listings = (
        db.query(FoodListing).filter(FoodListing.status == "available").count()
    )
    total_requests = db.query(DonationRequest).count()

    payload = {
        "available_listings": available_listings,
        "successful_handovers": completed_deliveries,
        "completed_handovers": completed_deliveries,
        "total_requests": total_requests,
        "food_rescued": completed_deliveries,
    }
    return payload
