from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    is_available: Optional[bool] = None


class AdminRoleUpdate(BaseModel):
    role: str
    reason: Optional[str] = None


class AdminStatusUpdate(BaseModel):
    status: str  # "active", "suspended", "deactivated"
    reason: Optional[str] = None


class AdminListingModerate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[str] = None
    pickup_location: Optional[str] = None
    expiry_time: Optional[str] = None
    status: Optional[str] = None
    is_flagged: Optional[bool] = None
    moderation_notes: Optional[str] = None


class AdminRequestModerate(BaseModel):
    status: Optional[str] = None
    is_disputed: Optional[bool] = None
    moderation_note: Optional[str] = None


class AdminVolunteerReassign(BaseModel):
    volunteer_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PlatformSettingsUpdate(BaseModel):
    platform_name: Optional[str] = None
    platform_description: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    default_expiry_hours: Optional[int] = None
    enable_notifications: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    allow_new_registrations: Optional[bool] = None


class BroadcastNotificationCreate(BaseModel):
    message: str
    target_role: Optional[str] = "all"


class AuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_email: str
    action: str
    entity_type: str
    entity_id: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
