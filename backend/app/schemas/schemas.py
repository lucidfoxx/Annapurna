from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: Optional[str] = None
    email: EmailStr
    password: str
    role: Optional[str] = "Donor"
    phone: Optional[str] = None
    organization: Optional[str] = None
    address: Optional[str] = None
    license_number: Optional[str] = None
    license_document_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    status: str = "active"
    phone: Optional[str] = None
    organization: Optional[str] = None
    address: Optional[str] = None
    is_available: bool = True
    verification_status: str = "approved"
    license_number: Optional[str] = None
    license_document_url: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by_admin_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NgoLicenseUpdateRequest(BaseModel):
    license_number: str
    license_document_url: str
    phone: Optional[str] = None
    address: Optional[str] = None


class AdminNgoVerifyRequest(BaseModel):
    status: str  # "approved" | "rejected"
    reason: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "cooked_meals"
    quantity: Optional[str] = "1"
    pickup_location: Optional[str] = "Community Hub"
    expiry_time: Optional[str] = None


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[str] = None
    pickup_location: Optional[str] = None
    expiry_time: Optional[str] = None
    status: Optional[str] = None


class ListingCancelRequest(BaseModel):
    cancellation_reason: Optional[str] = None
    reason: Optional[str] = None


class ListingResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str = "cooked_meals"
    quantity: str
    pickup_location: str
    expiry_time: Optional[str] = None
    status: str
    is_flagged: bool = False
    moderation_notes: Optional[str] = None
    donor_id: int
    donor_name: str
    claimed_by_ngo_id: Optional[int] = None
    claimed_by_ngo_name: Optional[str] = None
    claimed_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    pickup_status: str = "pending"
    pickup_failure_reason: Optional[str] = None
    delivery_status: str = "pending"
    delivery_failure_reason: Optional[str] = None
    verified_by_volunteer_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DonationRequestCreate(BaseModel):
    listing_id: Optional[int] = None
    ngo_name: Optional[str] = None
    quantity: Optional[str] = None
    quantity_needed: Optional[str] = None
    requested_quantity: Optional[str] = None
    required_by: Optional[str] = None
    required_by_time: Optional[str] = None
    urgency_level: Optional[str] = "normal"
    notes: Optional[str] = None


class DonationRequestResponse(BaseModel):
    id: int
    listing_id: Optional[int] = None
    listing_title: str
    requester_id: int
    requester_name: str
    ngo_id: Optional[int] = None
    ngo_name: Optional[str] = None
    quantity: Optional[str] = None
    requested_quantity: Optional[str] = None
    required_by: Optional[str] = None
    urgency_level: Optional[str] = "normal"
    request_type: str = "listing_claim"
    notes: Optional[str] = None
    status: str
    is_disputed: bool = False
    moderation_note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PickupVerificationRequest(BaseModel):
    status: str  # "claimed" | "pickup_failed"
    reason: Optional[str] = None


class DeliveryVerificationRequest(BaseModel):
    status: str  # "delivered" | "delivery_failed"
    reason: Optional[str] = None
    distribution_proof: Optional[str] = None


class ReviewCreateRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    tags: Optional[List[str]] = None


class ReviewResponse(BaseModel):
    id: int
    donation_id: int
    donation_title: Optional[str] = None
    restaurant_id: int
    restaurant_name: Optional[str] = None
    ngo_id: int
    ngo_name: str
    rating: int
    comment: Optional[str] = None
    tags: List[str] = []
    created_at: datetime


class HandoverResponse(BaseModel):
    id: int
    request_id: int
    listing_id: int
    listing_title: str
    pickup_location: str
    dropoff_location: str
    volunteer_id: Optional[int] = None
    volunteer_name: Optional[str] = None
    status: str
    pickup_status: str = "pending"
    pickup_failure_reason: Optional[str] = None
    delivery_status: str = "pending"
    delivery_failure_reason: Optional[str] = None
    verified_by_volunteer_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    distribution_proof: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
