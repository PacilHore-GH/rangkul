from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('family', 'professional', 'admin')", name="ck_users_role"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(80), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="family", nullable=False)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PersonProfile(Base):
    __tablename__ = "person_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    support_needs: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    communication_preferences: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    accessibility_preferences: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    primary_language: Mapped[str] = mapped_column(String(10), default="id", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    consented_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class PersonRelationship(Base):
    __tablename__ = "person_relationships"
    __table_args__ = (
        UniqueConstraint("person_id", "user_id", "is_primary", name="uq_person_primary_relationship"),
        CheckConstraint(
            "relationship_type IN ('parent','guardian','sibling','extended_family','caregiver','other','unspecified')",
            name="ck_person_relationship_type",
        ),
        CheckConstraint("status IN ('active','revoked')", name="ck_person_relationship_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    person_id: Mapped[str] = mapped_column(ForeignKey("person_profiles.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    relationship_type: Mapped[str] = mapped_column(String(30), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Facility(Base):
    __tablename__ = "facilities"
    __table_args__ = (
        CheckConstraint(
            "facility_type IN ('hospital','clinic','therapy_center','school','community_service')",
            name="ck_facility_type",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    facility_type: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    services: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    province: Mapped[str] = mapped_column(String(80), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    phone: Mapped[str | None] = mapped_column(String(30))
    website: Mapped[str | None] = mapped_column(String(500))
    source_name: Mapped[str] = mapped_column(String(120), nullable=False)
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class RateLimitCounter(Base):
    __tablename__ = "rate_limit_counters"
    __table_args__ = (
        UniqueConstraint("scope", "subject_hash", "window_started_at", name="uq_rate_limit_window"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    scope: Mapped[str] = mapped_column(String(50), nullable=False)
    subject_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    window_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    __table_args__ = (
        UniqueConstraint("user_id", "operation", "idempotency_key", name="uq_idempotency_operation"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    operation: Mapped[str] = mapped_column(String(50), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(64), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_status: Mapped[int] = mapped_column(Integer, nullable=False)
    response_body: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
