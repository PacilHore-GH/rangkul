from datetime import datetime
from typing import Any, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.development_checkpoints.domain.enums import CaptureMode, ProcessingStatus, QualityStatus


class ConsentSnapshot(BaseModel):
    capture: bool
    analysis: bool
    professional_sharing: bool


class CheckpointTemplateOut(BaseModel):
    id: UUID
    code: str
    name: str
    modality: str
    instruction_text: str
    metric_schema: dict[str, Any] = Field(default_factory=dict)
    quality_requirements: dict[str, Any] = Field(default_factory=dict)
    active: bool = True

    model_config = {"from_attributes": True}


class CheckpointCreate(BaseModel):
    template_id: UUID
    recommendation_target_id: UUID | None = None
    capture_mode: CaptureMode
    raw_retention_mode: Literal["privacy_first", "professional_review", "retain_derivatives_only"] = "privacy_first"
    consent: ConsentSnapshot
    client_request_id: UUID = Field(default_factory=uuid4)


class CheckpointOut(BaseModel):
    id: UUID
    person_profile_id: UUID
    template_id: UUID
    recommendation_target_id: UUID | None
    capture_mode: CaptureMode
    status: ProcessingStatus
    overall_quality_status: QualityStatus | None = None
    capture_timestamp: datetime
    processing_version: int
    raw_retention_mode: str
    trend_badge: str | None = None


class CheckpointHistoryItemOut(CheckpointOut):
    template_code: str
    template_name: str
    has_uploaded_asset: bool = False
    has_results: bool = False
    has_report: bool = False


class PresignRequest(BaseModel):
    filename: str
    content_type: str
    size_bytes: int


class PresignResponse(BaseModel):
    upload_url: str
    object_key: str
    expires_in_seconds: int
    required_headers: dict[str, str]


class AssetCompleteRequest(BaseModel):
    object_key: str
    content_type: str
    size_bytes: int
    sha256: str | None = None


class CheckpointResultOut(BaseModel):
    checkpoint_id: UUID
    processing_version: int
    speech: dict[str, Any] | None = None
    face: dict[str, Any] | None = None
    motion: dict[str, Any] | None = None
    reference_comparison: dict[str, Any] | None = None
    trend: dict[str, Any] | None = None
    limitations: list[str] = Field(default_factory=list)


class GeneratedReportOut(BaseModel):
    headline: str
    observation_summary: list[str]
    positive_observations: list[str]
    items_for_professional_review: list[str]
    adherence_summary: str
    data_quality_summary: str
    limitations: list[str]
    suggested_review_questions: list[str]
    automated_trend_language: str
    requires_professional_approval: bool = True


class ReviewCreate(BaseModel):
    decision: Literal["approved", "request_recapture", "rejected"]
    professional_notes: str | None = None
    corrected_observations: dict[str, Any] = Field(default_factory=dict)
