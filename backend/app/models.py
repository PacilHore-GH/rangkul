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


class CheckpointTemplate(Base):
    __tablename__ = "checkpoint_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    code: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    modality: Mapped[str] = mapped_column(String(64), nullable=False)
    instruction_text: Mapped[str] = mapped_column(Text, nullable=False)
    instruction_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    expected_phases: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    metric_schema: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    quality_requirements: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ConsentSnapshot(Base):
    __tablename__ = "consent_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    person_profile_id: Mapped[str] = mapped_column(ForeignKey("person_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    captured_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    capture: Mapped[bool] = mapped_column(Boolean, nullable=False)
    analysis: Mapped[bool] = mapped_column(Boolean, nullable=False)
    professional_sharing: Mapped[bool] = mapped_column(Boolean, nullable=False)
    raw_retention_mode: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class DevelopmentCheckpoint(Base):
    __tablename__ = "development_checkpoints"
    __table_args__ = (
        UniqueConstraint("person_profile_id", "client_request_id", name="uq_development_checkpoints_client_request"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    person_profile_id: Mapped[str] = mapped_column(ForeignKey("person_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    template_id: Mapped[str] = mapped_column(ForeignKey("checkpoint_templates.id"), index=True, nullable=False)
    captured_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    recommendation_target_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    capture_mode: Mapped[str] = mapped_column(String(64), nullable=False)
    modality: Mapped[str] = mapped_column(String(64), nullable=False)
    capture_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    overall_quality_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    processing_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    raw_retention_mode: Mapped[str] = mapped_column(String(64), nullable=False)
    client_request_id: Mapped[str] = mapped_column(String(36), nullable=False)
    consent_snapshot_id: Mapped[str] = mapped_column(ForeignKey("consent_snapshots.id"), nullable=False)
    trend_badge: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointAsset(Base):
    __tablename__ = "checkpoint_assets"
    __table_args__ = (UniqueConstraint("checkpoint_id", "object_key", name="uq_checkpoint_assets_object"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), index=True, nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str | None] = mapped_column(String(128), nullable=True)
    upload_status: Mapped[str] = mapped_column(String(64), default="presigned", nullable=False)
    retention_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointAnalysisJob(Base):
    __tablename__ = "checkpoint_analysis_jobs"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_checkpoint_analysis_jobs_idempotency_key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), index=True, nullable=False)
    processing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    queue_name: Mapped[str] = mapped_column(String(64), nullable=False)
    step: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class AIModelRegistry(Base):
    __tablename__ = "ai_model_registry"
    __table_args__ = (UniqueConstraint("model_key", "model_revision", name="uq_ai_model_registry_key_revision"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    model_key: Mapped[str] = mapped_column(String(120), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    model_revision: Mapped[str] = mapped_column(String(255), nullable=False)
    feature_schema_version: Mapped[str] = mapped_column(String(64), nullable=False)
    embedding_dimension: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointSpeechResult(Base):
    __tablename__ = "checkpoint_speech_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    processing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    model_registry_id: Mapped[str | None] = mapped_column(ForeignKey("ai_model_registry.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointSpeechEmbedding(Base):
    __tablename__ = "checkpoint_speech_embeddings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, default=list, nullable=True)
    model_registry_id: Mapped[str | None] = mapped_column(ForeignKey("ai_model_registry.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointFaceResult(Base):
    __tablename__ = "checkpoint_face_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    processing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    model_registry_id: Mapped[str | None] = mapped_column(ForeignKey("ai_model_registry.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointFaceEmbedding(Base):
    __tablename__ = "checkpoint_face_embeddings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, default=list, nullable=True)
    model_registry_id: Mapped[str | None] = mapped_column(ForeignKey("ai_model_registry.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointPoseSequence(Base):
    __tablename__ = "checkpoint_pose_sequences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    format: Mapped[str] = mapped_column(String(32), default="npz", nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointMotionEmbedding(Base):
    __tablename__ = "checkpoint_motion_embeddings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, default=list, nullable=True)
    model_registry_id: Mapped[str | None] = mapped_column(ForeignKey("ai_model_registry.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointEventSegment(Base):
    __tablename__ = "checkpoint_event_segments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), index=True, nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    phase_name: Mapped[str] = mapped_column(String(120), nullable=False)
    start_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointReferenceComparison(Base):
    __tablename__ = "checkpoint_reference_comparisons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointReport(Base):
    __tablename__ = "checkpoint_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    processing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    report_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CheckpointTrendSnapshot(Base):
    __tablename__ = "checkpoint_trend_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    person_profile_id: Mapped[str] = mapped_column(ForeignKey("person_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    checkpoint_id: Mapped[str] = mapped_column(ForeignKey("development_checkpoints.id", ondelete="CASCADE"), unique=True, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    topic: Mapped[str] = mapped_column(String(120), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
