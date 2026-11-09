"""Initial schema and admin platform tables (audit_logs, platform_settings, moderation, cancellation & verification columns)

Revision ID: 0001_admin_platform
Revises: None
Create Date: 2026-11-09 01:28:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_admin_platform"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("full_name", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False, unique=True),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("role", sa.String(length=50), nullable=False, server_default="Donor"),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
            sa.Column("phone", sa.String(length=60), nullable=True),
            sa.Column("organization", sa.String(length=255), nullable=True),
            sa.Column("address", sa.String(length=500), nullable=True),
            sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("verification_status", sa.String(length=50), nullable=False, server_default="approved"),
            sa.Column("license_number", sa.String(length=120), nullable=True),
            sa.Column("license_document_url", sa.Text(), nullable=True),
            sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("verified_by_admin_id", sa.Integer(), nullable=True),
            sa.Column("rejection_reason", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        user_cols = {c["name"] for c in inspector.get_columns("users")}
        if "status" not in user_cols:
            op.add_column("users", sa.Column("status", sa.String(length=50), nullable=False, server_default="active"))
        if "phone" not in user_cols:
            op.add_column("users", sa.Column("phone", sa.String(length=60), nullable=True))
        if "organization" not in user_cols:
            op.add_column("users", sa.Column("organization", sa.String(length=255), nullable=True))
        if "address" not in user_cols:
            op.add_column("users", sa.Column("address", sa.String(length=500), nullable=True))
        if "is_available" not in user_cols:
            op.add_column("users", sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("1")))
        if "verification_status" not in user_cols:
            op.add_column("users", sa.Column("verification_status", sa.String(length=50), nullable=False, server_default="approved"))
        if "license_number" not in user_cols:
            op.add_column("users", sa.Column("license_number", sa.String(length=120), nullable=True))
        if "license_document_url" not in user_cols:
            op.add_column("users", sa.Column("license_document_url", sa.Text(), nullable=True))
        if "verified_at" not in user_cols:
            op.add_column("users", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
        if "verified_by_admin_id" not in user_cols:
            op.add_column("users", sa.Column("verified_by_admin_id", sa.Integer(), nullable=True))
        if "rejection_reason" not in user_cols:
            op.add_column("users", sa.Column("rejection_reason", sa.Text(), nullable=True))

    if "food_listings" not in existing_tables:
        op.create_table(
            "food_listings",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=False, server_default="cooked_meals"),
            sa.Column("quantity", sa.String(length=120), nullable=False, server_default="1"),
            sa.Column("pickup_location", sa.String(length=255), nullable=False),
            sa.Column("expiry_time", sa.String(length=120), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="available"),
            sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("moderation_notes", sa.Text(), nullable=True),
            sa.Column("donor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("donor_name", sa.String(length=255), nullable=False),
            sa.Column("claimed_by_ngo_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("claimed_by_ngo_name", sa.String(length=255), nullable=True),
            sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("cancellation_reason", sa.Text(), nullable=True),
            sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("pickup_status", sa.String(length=50), nullable=False, server_default="pending"),
            sa.Column("pickup_failure_reason", sa.Text(), nullable=True),
            sa.Column("delivery_status", sa.String(length=50), nullable=False, server_default="pending"),
            sa.Column("delivery_failure_reason", sa.Text(), nullable=True),
            sa.Column("verified_by_volunteer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        listing_cols = {c["name"] for c in inspector.get_columns("food_listings")}
        if "category" not in listing_cols:
            op.add_column("food_listings", sa.Column("category", sa.String(length=100), nullable=False, server_default="cooked_meals"))
        if "is_flagged" not in listing_cols:
            op.add_column("food_listings", sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("0")))
        if "moderation_notes" not in listing_cols:
            op.add_column("food_listings", sa.Column("moderation_notes", sa.Text(), nullable=True))
        if "claimed_by_ngo_id" not in listing_cols:
            op.add_column("food_listings", sa.Column("claimed_by_ngo_id", sa.Integer(), nullable=True))
        if "claimed_by_ngo_name" not in listing_cols:
            op.add_column("food_listings", sa.Column("claimed_by_ngo_name", sa.String(length=255), nullable=True))
        if "claimed_at" not in listing_cols:
            op.add_column("food_listings", sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True))
        if "cancellation_reason" not in listing_cols:
            op.add_column("food_listings", sa.Column("cancellation_reason", sa.Text(), nullable=True))
        if "cancelled_at" not in listing_cols:
            op.add_column("food_listings", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))
        if "pickup_status" not in listing_cols:
            op.add_column("food_listings", sa.Column("pickup_status", sa.String(length=50), nullable=False, server_default="pending"))
        if "pickup_failure_reason" not in listing_cols:
            op.add_column("food_listings", sa.Column("pickup_failure_reason", sa.Text(), nullable=True))
        if "delivery_status" not in listing_cols:
            op.add_column("food_listings", sa.Column("delivery_status", sa.String(length=50), nullable=False, server_default="pending"))
        if "delivery_failure_reason" not in listing_cols:
            op.add_column("food_listings", sa.Column("delivery_failure_reason", sa.Text(), nullable=True))
        if "verified_by_volunteer_id" not in listing_cols:
            op.add_column("food_listings", sa.Column("verified_by_volunteer_id", sa.Integer(), nullable=True))

    if "reviews" not in existing_tables:
        op.create_table(
            "reviews",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("donation_id", sa.Integer(), sa.ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False, unique=True),
            sa.Column("restaurant_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("ngo_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("ngo_name", sa.String(length=255), nullable=False),
            sa.Column("rating", sa.Integer(), nullable=False),
            sa.Column("comment", sa.Text(), nullable=True),
            sa.Column("tags", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "donation_requests" not in existing_tables:
        op.create_table(
            "donation_requests",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("listing_id", sa.Integer(), sa.ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=True),
            sa.Column("listing_title", sa.String(length=255), nullable=False, server_default="Open NGO Food Request"),
            sa.Column("requester_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("requester_name", sa.String(length=255), nullable=False),
            sa.Column("ngo_id", sa.Integer(), nullable=True),
            sa.Column("ngo_name", sa.String(length=255), nullable=True),
            sa.Column("quantity", sa.String(length=120), nullable=True),
            sa.Column("requested_quantity", sa.String(length=120), nullable=True),
            sa.Column("required_by", sa.String(length=120), nullable=True),
            sa.Column("urgency_level", sa.String(length=50), nullable=True, server_default="normal"),
            sa.Column("request_type", sa.String(length=50), nullable=False, server_default="listing_claim"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
            sa.Column("is_disputed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("moderation_note", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        req_cols = {c["name"] for c in inspector.get_columns("donation_requests")}
        if "ngo_id" not in req_cols:
            op.add_column("donation_requests", sa.Column("ngo_id", sa.Integer(), nullable=True))
        if "ngo_name" not in req_cols:
            op.add_column("donation_requests", sa.Column("ngo_name", sa.String(length=255), nullable=True))
        if "quantity" not in req_cols:
            op.add_column("donation_requests", sa.Column("quantity", sa.String(length=120), nullable=True))
        if "requested_quantity" not in req_cols:
            op.add_column("donation_requests", sa.Column("requested_quantity", sa.String(length=120), nullable=True))
        if "required_by" not in req_cols:
            op.add_column("donation_requests", sa.Column("required_by", sa.String(length=120), nullable=True))
        if "urgency_level" not in req_cols:
            op.add_column("donation_requests", sa.Column("urgency_level", sa.String(length=50), nullable=True, server_default="normal"))
        if "request_type" not in req_cols:
            op.add_column("donation_requests", sa.Column("request_type", sa.String(length=50), nullable=False, server_default="listing_claim"))
        if "is_disputed" not in req_cols:
            op.add_column("donation_requests", sa.Column("is_disputed", sa.Boolean(), nullable=False, server_default=sa.text("0")))
        if "moderation_note" not in req_cols:
            op.add_column("donation_requests", sa.Column("moderation_note", sa.Text(), nullable=True))

    if "volunteer_handovers" not in existing_tables:
        op.create_table(
            "volunteer_handovers",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("request_id", sa.Integer(), sa.ForeignKey("donation_requests.id", ondelete="CASCADE"), nullable=False),
            sa.Column("listing_id", sa.Integer(), sa.ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False),
            sa.Column("listing_title", sa.String(length=255), nullable=False),
            sa.Column("pickup_location", sa.String(length=255), nullable=False),
            sa.Column("dropoff_location", sa.String(length=255), nullable=False),
            sa.Column("volunteer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("volunteer_name", sa.String(length=255), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="available"),
            sa.Column("pickup_status", sa.String(length=50), nullable=False, server_default="pending"),
            sa.Column("pickup_failure_reason", sa.Text(), nullable=True),
            sa.Column("delivery_status", sa.String(length=50), nullable=False, server_default="pending"),
            sa.Column("delivery_failure_reason", sa.Text(), nullable=True),
            sa.Column("verified_by_volunteer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("distribution_proof", sa.Text(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        handover_cols = {c["name"] for c in inspector.get_columns("volunteer_handovers")}
        if "pickup_status" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("pickup_status", sa.String(length=50), nullable=False, server_default="pending"))
        if "pickup_failure_reason" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("pickup_failure_reason", sa.Text(), nullable=True))
        if "delivery_status" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("delivery_status", sa.String(length=50), nullable=False, server_default="pending"))
        if "delivery_failure_reason" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("delivery_failure_reason", sa.Text(), nullable=True))
        if "verified_by_volunteer_id" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("verified_by_volunteer_id", sa.Integer(), nullable=True))
        if "verified_at" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
        if "distribution_proof" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("distribution_proof", sa.Text(), nullable=True))
        if "notes" not in handover_cols:
            op.add_column("volunteer_handovers", sa.Column("notes", sa.Text(), nullable=True))

    if "notifications" not in existing_tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "audit_logs" not in existing_tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("admin_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("admin_email", sa.String(length=255), nullable=False),
            sa.Column("action", sa.String(length=120), nullable=False),
            sa.Column("entity_type", sa.String(length=80), nullable=False),
            sa.Column("entity_id", sa.String(length=80), nullable=False),
            sa.Column("previous_value", sa.Text(), nullable=True),
            sa.Column("new_value", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(length=64), nullable=True),
            sa.Column("user_agent", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "platform_settings" not in existing_tables:
        op.create_table(
            "platform_settings",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("platform_name", sa.String(length=120), nullable=False, server_default="ANNAPURNA"),
            sa.Column("platform_description", sa.Text(), nullable=False),
            sa.Column("support_email", sa.String(length=255), nullable=False, server_default="support@annapurna.org"),
            sa.Column("support_phone", sa.String(length=60), nullable=False, server_default="+1 (555) 234-5678"),
            sa.Column("default_expiry_hours", sa.Integer(), nullable=False, server_default="24"),
            sa.Column("enable_notifications", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("maintenance_mode", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("allow_new_registrations", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("updated_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("platform_settings")
    op.drop_table("audit_logs")
