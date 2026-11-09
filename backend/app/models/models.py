from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="Donor", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    organization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # NGO License Verification Extensions
    verification_status: Mapped[str] = mapped_column(String(50), default="approved", nullable=False)
    license_number: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    license_document_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_admin_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class FoodListing(Base):
    __tablename__ = "food_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="cooked_meals", nullable=False)
    quantity: Mapped[str] = mapped_column(String(120), default="1", nullable=False)
    pickup_location: Mapped[str] = mapped_column(String(255), default="Community Hub", nullable=False)
    expiry_time: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="available", nullable=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    moderation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    donor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    donor_name: Mapped[str] = mapped_column(String(255), default="", nullable=False)

    # Atomic Claim Fields
    claimed_by_ngo_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    claimed_by_ngo_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    claimed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pickup_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    pickup_failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    delivery_failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_by_volunteer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DonationRequest(Base):
    __tablename__ = "donation_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    listing_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=True
    )
    listing_title: Mapped[str] = mapped_column(String(255), default="Open NGO Food Request", nullable=False)
    requester_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    requester_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ngo_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ngo_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    requested_quantity: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    required_by: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    urgency_level: Mapped[Optional[str]] = mapped_column(String(50), default="normal", nullable=True)
    request_type: Mapped[str] = mapped_column(String(50), default="listing_claim", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    is_disputed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    moderation_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class VolunteerHandover(Base):
    __tablename__ = "volunteer_handovers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("donation_requests.id", ondelete="CASCADE"), nullable=False
    )
    listing_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False
    )
    listing_title: Mapped[str] = mapped_column(String(255), nullable=False)
    pickup_location: Mapped[str] = mapped_column(String(255), nullable=False)
    dropoff_location: Mapped[str] = mapped_column(String(255), nullable=False)
    volunteer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    volunteer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="available", nullable=False)
    pickup_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    pickup_failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    delivery_failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_by_volunteer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    distribution_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("donation_id", name="uq_reviews_donation_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    donation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    restaurant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ngo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ngo_name: Mapped[str] = mapped_column(String(255), default="Partner NGO", nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array string
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
